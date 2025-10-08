/**
 * Unified Coach Client - PRODUCTION-READY ChatGPT-Style Interface
 *
 * Complete AI Coach with Quick Entry integration.
 * - Pre-chat: Centered entry screen with quick actions
 * - Post-chat: Full messaging interface with streaming
 * - Auto-detects logging vs chatting
 * - Iron Discipline branding with aggressive styling
 *
 * Features:
 * - Multimodal input (text, voice, images)
 * - Real-time streaming with visual feedback
 * - Conversation history sidebar
 * - Cost/token tracking display
 * - Smart error recovery
 * - Full accessibility (WCAG AA)
 * - Mobile-optimized with keyboard handling
 */

'use client'

import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Mic,
  Paperclip,
  Send,
  X,
  Loader2,
  ChevronDown,
  AlertCircle,
  Volume2,
  FileText,
  MessageSquare,
  History,
  Zap,
  DollarSign,
  Database,
  Info,
  RefreshCw,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { UnifiedMessageBubble } from './UnifiedMessageBubble'
import QuickEntryPreview from '@/components/quick-entry/QuickEntryPreview'
import BottomNavigation from '@/app/components/BottomNavigation'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { formatDistanceToNow } from 'date-fns'
import {
  sendMessageStreaming,
  confirmLog,
  getConversations,
  getConversationMessages,
  type UnifiedMessage,
  type LogPreview,
  type ConversationSummary,
  type FoodDetected,
} from '@/lib/api/unified-coach'
import { uploadFiles, validateFile } from '@/lib/utils/file-upload'
import { analyzeImage, formatAnalysisAsText } from '@/lib/services/client-image-analysis'

interface UnifiedCoachClientProps {
  userId: string
  initialConversationId?: string | null
}

interface AttachedFile {
  file: File
  preview?: string
  type: 'image' | 'audio' | 'pdf' | 'other'
}

type LogType = 'auto' | 'meal' | 'workout' | 'activity' | 'note' | 'measurement'

interface ErrorState {
  message: string
  recoveryAction?: () => void
  recoveryLabel?: string
}

// Memoized message bubble for performance
const MemoizedMessageBubble = memo(UnifiedMessageBubble, (prev, next) => {
  return prev.message.id === next.message.id &&
         prev.message.content === next.message.content
})
MemoizedMessageBubble.displayName = 'MemoizedMessageBubble'

export function UnifiedCoachClient({ userId, initialConversationId }: UnifiedCoachClientProps) {
  // State
  const [messages, setMessages] = useState<UnifiedMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId || null)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [showHistorySidebar, setShowHistorySidebar] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [pendingLogPreview, setPendingLogPreview] = useState<{
    preview: LogPreview
    userMessageId: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamedContent, setStreamedContent] = useState('')
  const [streamProgress, setStreamProgress] = useState(0)
  const [tokensReceived, setTokensReceived] = useState(0)
  const [error, setError] = useState<ErrorState | null>(null)

  // Input state
  const [text, setText] = useState('')
  const [selectedLogType, setSelectedLogType] = useState<LogType>('auto')
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)

  // Cost tracking
  const [lastCost, setLastCost] = useState<number | null>(null)
  const [lastTokens, setLastTokens] = useState<number | null>(null)
  const [lastRagSources, setLastRagSources] = useState<number | null>(null)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Hooks
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Determine if we're in chat mode or entry mode
  const hasStartedChat = messages.length > 0
  const hasContent = text || attachedFiles.length > 0

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (hasStartedChat) {
      scrollToBottom()
    }
  }, [messages, pendingLogPreview, hasStartedChat])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200)
      textareaRef.current.style.height = `${newHeight}px`
    }
  }, [text])

  // Close dropdown on outside click/touch
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setShowTypeDropdown(false)
      }
    }

    // Listen for both mouse and touch events for cross-device compatibility
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  // Load conversation history on mount
  useEffect(() => {
    loadConversationHistory()
  }, [])

  // Detect mobile vs desktop
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle return from meal log page
  useEffect(() => {
    const from = searchParams.get('from')
    const returnedConversationId = searchParams.get('conversationId')
    const status = searchParams.get('status')

    if (from === 'meal-log' && returnedConversationId) {
      // User returned from meal log page - reload conversation to show coach's response
      const loadConversation = async () => {
        try {
          const { messages: conversationMessages } = await getConversationMessages(returnedConversationId)

          // Update state with loaded messages
          setMessages(conversationMessages)
          setConversationId(returnedConversationId)

          // Show toast notification
          if (status === 'submitted') {
            toast({
              title: '✅ Meal logged!',
              description: 'Coach has updated your conversation with a summary.',
              variant: 'default',
            })
          } else if (status === 'cancelled') {
            toast({
              title: 'Log cancelled',
              description: 'No problem! Let me know when you\'re ready.',
              variant: 'default',
            })
          }

          // Auto-scroll to bottom to show new messages
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({
              behavior: 'smooth',
              block: 'end'
            })
          }, 100)

          // Clean up URL params (remove query string)
          const cleanUrl = window.location.pathname
          window.history.replaceState({}, '', cleanUrl)
        } catch (error) {
          console.error('Failed to load conversation after meal log:', error)
          toast({
            title: 'Error',
            description: 'Failed to reload conversation. Please refresh the page.',
            variant: 'destructive',
          })
        }
      }

      loadConversation()
    }
  }, [searchParams, toast])

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      block: 'end'
    })
  }, [])

  const loadConversationHistory = async () => {
    try {
      const { conversations: convs } = await getConversations({ limit: 50 })
      setConversations(convs)
    } catch (err) {
      console.error('Failed to load conversation history:', err)
    }
  }

  const startNewChat = () => {
    setMessages([])
    setConversationId(null)
    setPendingLogPreview(null)
    setText('')
    setAttachedFiles([])
    setError(null)
    if (isMobile) {
      setShowHistorySidebar(false)
    }
  }

  // ============================================================================
  // FILE HANDLING
  // ============================================================================

  const handleFileSelect = (files: FileList) => {
    const newFiles: AttachedFile[] = []

    Array.from(files).forEach(file => {
      const validation = validateFile(file, {
        maxSizeMB: 10,
        allowedTypes: ['image/*', 'audio/*', 'application/pdf']
      })

      if (!validation.valid) {
        toast({
          title: '📎 File Error',
          description: validation.error,
          variant: 'destructive'
        })
        return
      }

      let fileType: AttachedFile['type'] = 'other'

      if (file.type.startsWith('image/')) {
        fileType = 'image'
        const reader = new FileReader()
        reader.onloadend = () => {
          setAttachedFiles(prev => prev.map(f =>
            f.file === file ? { ...f, preview: reader.result as string } : f
          ))
        }
        reader.onerror = () => {
          toast({
            title: '📎 Image Preview Failed',
            description: 'Could not load image preview, but file is attached',
            variant: 'destructive'
          })
        }
        reader.readAsDataURL(file)
      } else if (file.type.startsWith('audio/')) {
        fileType = 'audio'
      } else if (file.type === 'application/pdf') {
        fileType = 'pdf'
      }

      newFiles.push({ file, type: fileType })
    })

    if (newFiles.length > 0) {
      setAttachedFiles(prev => [...prev, ...newFiles])
      setError(null)

      // Show success toast
      const fileTypeLabel = newFiles[0].type === 'image' ? 'Image' :
                           newFiles[0].type === 'audio' ? 'Audio' :
                           newFiles[0].type === 'pdf' ? 'PDF' : 'File'
      toast({
        title: `📎 ${fileTypeLabel} attached`,
        description: `${newFiles[0].file.name} (${(newFiles[0].file.size / 1024).toFixed(1)} KB)`,
      })
    }
  }

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // ============================================================================
  // VOICE RECORDING
  // ============================================================================

  const startVoiceRecording = () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

      if (!SpeechRecognition) {
        const message = 'Voice input not supported on this browser. Try using the text input or file upload instead.'
        toast({
          title: '🎤 Voice Not Supported',
          description: message,
          variant: 'destructive'
        })
        setError({
          message,
          recoveryAction: undefined
        })
        return
      }

      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsRecording(true)
        setError(null)
        toast({
          title: '🎤 Listening...',
          description: 'Speak now to add text',
        })
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setText(prev => prev ? `${prev} ${transcript}` : transcript)
        setIsRecording(false)
        toast({
          title: '✅ Voice recognized',
          description: `Added: "${transcript.slice(0, 50)}${transcript.length > 50 ? '...' : ''}"`,
        })
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)

        let errorMessage = 'Voice input failed'
        let errorDescription = 'Please try again or use text input'

        if (event.error === 'not-allowed') {
          errorMessage = 'Microphone Permission Denied'
          errorDescription = 'Please enable microphone access in your browser settings'
        } else if (event.error === 'no-speech') {
          errorMessage = 'No Speech Detected'
          errorDescription = 'Try speaking louder or closer to the microphone'
        } else if (event.error === 'network') {
          errorMessage = 'Network Error'
          errorDescription = 'Voice recognition requires an internet connection'
        }

        toast({
          title: `🎤 ${errorMessage}`,
          description: errorDescription,
          variant: 'destructive'
        })

        setError({
          message: errorDescription,
          recoveryAction: event.error !== 'not-allowed' ? () => startVoiceRecording() : undefined,
          recoveryLabel: 'Try Again'
        })
        setIsRecording(false)
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err) {
      console.error('Voice recording error:', err)
      const message = 'Failed to start voice recording. Please use text input instead.'
      toast({
        title: '🎤 Voice Input Failed',
        description: message,
        variant: 'destructive'
      })
      setError({
        message,
        recoveryAction: () => startVoiceRecording(),
        recoveryLabel: 'Try Again'
      })
    }
  }

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
  }

  // ============================================================================
  // MESSAGE HANDLING
  // ============================================================================

  async function handleSendMessage() {
    if (!text.trim() && !attachedFiles.length) return

    setError(null)
    setIsLoading(true)
    setIsStreaming(true)
    setStreamedContent('')
    setStreamProgress(0)
    setTokensReceived(0)

    let messageText = text

    try {
      // ============================================================================
      // CLIENT-SIDE IMAGE ANALYSIS (NEW FLOW)
      // ============================================================================
      // Analyze images BEFORE sending to backend to avoid backend storage costs
      // The analysis is converted to text and prepended to the user's message

      if (attachedFiles.length > 0 && attachedFiles[0].type === 'image') {
        const imageFile = attachedFiles[0].file

        toast({
          title: '🔍 Analyzing image...',
          description: 'This may take a few seconds',
        })

        try {
          // Analyze image using OpenAI Vision API (client-side)
          const analysis = await analyzeImage(imageFile, text)

          console.log('[UnifiedCoachClient] Image analysis result:', analysis)

          // Format analysis as text
          const analysisText = formatAnalysisAsText(analysis)

          // Prepend analysis to user's message
          messageText = analysisText + (text || '')

          console.log('[UnifiedCoachClient] Message with analysis attached:', messageText)

          toast({
            title: '✅ Image analyzed!',
            description: analysis.is_food
              ? `Detected ${analysis.food_items?.length || 0} food items`
              : 'Image processed',
          })
        } catch (err) {
          console.error('[UnifiedCoachClient] Image analysis failed:', err)
          toast({
            title: '⚠️ Image analysis failed',
            description: 'Continuing without image analysis',
            variant: 'destructive',
          })
          // Continue without analysis - user message will still be sent
        }
      }

      // Optimistic UI update (AFTER image analysis so we show the analysis)
      const tempUserMessageId = `temp-${Date.now()}`
      const optimisticUserMessage: UnifiedMessage = {
        id: tempUserMessageId,
        role: 'user',
        content: messageText, // Use messageText which includes analysis if image was present
        message_type: 'chat',
        is_vectorized: false,
        created_at: new Date().toISOString()
      }

      setMessages(prev => [...prev, optimisticUserMessage])

      // Create streaming request (NO image_urls - images are NOT sent to backend)
      const request = {
        message: messageText,
        conversation_id: conversationId,
        has_image: false, // Always false now since we analyze client-side
        image_urls: undefined // Never send images to backend
      }

      // Use streaming API
      let firstChunk = true
      let accumulatedContent = ''
      let aiMessageId = ''
      let newConversationId = conversationId
      let chunkCount = 0

      for await (const chunk of sendMessageStreaming(request)) {
        if (firstChunk) {
          firstChunk = false
          aiMessageId = chunk.message_id
          newConversationId = chunk.conversation_id

          // Update conversation ID if new
          if (!conversationId) {
            setConversationId(newConversationId)
          }

          // Replace temp user message with real one
          setMessages(prev =>
            prev.map(msg =>
              msg.id === tempUserMessageId
                ? { ...msg, id: chunk.message_id }
                : msg
            )
          )

          // Check if it's a log preview - REDIRECT to /nutrition/log instead of showing card
          if (chunk.is_log_preview && chunk.log_preview) {
            // For meals, redirect immediately to meal log page with pre-filled data
            if (chunk.log_preview.log_type === 'meal') {
              const params = new URLSearchParams({
                previewData: JSON.stringify(chunk.log_preview.data),
                returnTo: '/coach',
                conversationId: newConversationId || '',
                userMessageId: chunk.message_id,
                logType: 'meal'
              })

              setText('')
              setAttachedFiles([])
              setIsLoading(false)
              setIsStreaming(false)

              // Redirect to meal log page
              router.push(`/nutrition/log?${params.toString()}`)
              return
            }

            // For other log types (workout, activity, etc), show preview card
            setPendingLogPreview({
              preview: chunk.log_preview,
              userMessageId: chunk.message_id
            })

            setText('')
            setAttachedFiles([])
            setIsLoading(false)
            setIsStreaming(false)
            return
          }

          // NEW: Check if food was detected in image - AUTO-REDIRECT to meal log page
          if (chunk.food_detected && chunk.food_detected.is_food) {
            const foodData = chunk.food_detected

            // Convert food_detected to meal preview data format
            const mealData = {
              meal_type: foodData.meal_type || 'snack',
              calories: foodData.nutrition.calories || 0,
              protein_g: foodData.nutrition.protein_g || 0,
              carbs_g: foodData.nutrition.carbs_g || 0,
              fat_g: foodData.nutrition.fats_g || 0,
              foods: foodData.food_items.map(item => ({
                name: item.name,
                quantity: item.quantity || '1',
                unit: item.unit || 'serving'
              })),
              notes: `Detected from image: ${foodData.description}`
            }

            const params = new URLSearchParams({
              previewData: JSON.stringify(mealData),
              returnTo: '/coach',
              conversationId: newConversationId || '',
              userMessageId: chunk.message_id,
              logType: 'meal'
            })

            setText('')
            setAttachedFiles([])
            setIsLoading(false)
            setIsStreaming(false)

            // Show toast notification
            toast({
              title: '🍽️ Food Detected!',
              description: `Detected ${foodData.food_items.length} food items. Review and log your meal.`,
            })

            // Redirect to meal log page with pre-populated data
            router.push(`/nutrition/log?${params.toString()}`)
            return
          }

          // If it's a chat message, create AI message bubble
          if (chunk.message) {
            accumulatedContent = chunk.message
            const aiMessage: UnifiedMessage = {
              id: aiMessageId,
              role: 'assistant',
              content: accumulatedContent,
              message_type: 'chat',
              is_vectorized: false,
              created_at: new Date().toISOString()
            }
            setMessages(prev => [...prev, aiMessage])
            setStreamedContent(accumulatedContent)
          }

          // Track cost/tokens
          if (chunk.tokens_used) setLastTokens(chunk.tokens_used)
          if (chunk.cost_usd) setLastCost(chunk.cost_usd)
          if (chunk.rag_context?.sources_count) setLastRagSources(chunk.rag_context.sources_count)
        } else {
          // Subsequent chunks contain content updates
          if (chunk.message) {
            chunkCount++
            accumulatedContent += chunk.message
            setStreamedContent(accumulatedContent)
            setTokensReceived(prev => prev + 1)

            // Update streaming progress (simulate based on chunk count)
            setStreamProgress(Math.min(95, chunkCount * 5))

            // Update existing AI message (optimized to reduce re-renders)
            setMessages(prev => {
              const lastMsg = prev[prev.length - 1]
              if (lastMsg && lastMsg.id === aiMessageId) {
                lastMsg.content = accumulatedContent
                return [...prev]
              }
              return prev
            })
          }
        }
      }

      // Mark streaming complete
      setStreamProgress(100)
      setText('')
      setAttachedFiles([])

      // Reload conversation history
      loadConversationHistory()
    } catch (err) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempUserMessageId))

      // Categorize error and provide recovery
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message'

      let errorState: ErrorState = {
        message: errorMessage
      }

      if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        errorState = {
          message: '⚠️ Connection lost. Check your internet and try again.',
          recoveryAction: () => {
            setText(messageText)
            handleSendMessage()
          },
          recoveryLabel: 'Retry'
        }
      } else if (errorMessage.includes('401') || errorMessage.includes('auth')) {
        errorState = {
          message: '🔒 Session expired. Please log in again.',
          recoveryAction: () => window.location.href = '/login',
          recoveryLabel: 'Go to Login'
        }
      } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        errorState = {
          message: '🚫 Daily message limit reached. Come back tomorrow or upgrade!',
          recoveryAction: () => window.location.href = '/pricing',
          recoveryLabel: 'Upgrade'
        }
      } else if (errorMessage.includes('500') || errorMessage.includes('503')) {
        errorState = {
          message: '⚙️ AI Coach temporarily unavailable. Try again in a moment.',
          recoveryAction: () => {
            setText(messageText)
            handleSendMessage()
          },
          recoveryLabel: 'Retry'
        }
      } else {
        errorState = {
          message: `❌ ${errorMessage}`,
          recoveryAction: () => {
            setText(messageText)
            handleSendMessage()
          },
          recoveryLabel: 'Retry'
        }
      }

      setError(errorState)
      toast({
        title: 'Error',
        description: errorState.message,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
      setStreamedContent('')
      setStreamProgress(0)
    }
  }

  async function handleConfirmLog(logData: Record<string, any>) {
    if (!pendingLogPreview || !conversationId) return

    try {
      const result = await confirmLog({
        conversation_id: conversationId,
        log_data: logData,
        log_type: pendingLogPreview.preview.log_type,
        user_message_id: pendingLogPreview.userMessageId
      })

      const systemMessage: UnifiedMessage = {
        id: result.system_message_id,
        role: 'system',
        content: result.system_message,
        message_type: 'log_confirmed',
        quick_entry_log_id: result.quick_entry_log_id,
        is_vectorized: false,
        created_at: new Date().toISOString()
      }

      setMessages(prev => [...prev, systemMessage])
      setPendingLogPreview(null)

      toast({
        title: '✅ Logged!',
        description: result.system_message,
        variant: 'default'
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save log'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    }
  }

  function handleCancelLog() {
    setPendingLogPreview(null)
  }

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getLogTypeLabel = (type: LogType) => {
    const labels: Record<LogType, string> = {
      auto: 'Auto-detect',
      meal: 'Meal',
      workout: 'Workout',
      activity: 'Activity',
      note: 'Note',
      measurement: 'Measurement',
    }
    return labels[type]
  }

  const getLogTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      meal: '🍽️',
      workout: '💪',
      activity: '🏃',
      note: '📝',
      measurement: '📊',
      unknown: '❓',
      auto: '✨',
    }
    return icons[type] || '❓'
  }

  // ============================================================================
  // RENDER - PRE-CHAT (ENTRY SCREEN)
  // ============================================================================

  if (!hasStartedChat) {
    return (
      <div className="flex flex-col h-screen bg-iron-black" style={{ height: '100dvh' }}>
        {/* ChatGPT-style centered content */}
        <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto p-4 pb-32">
          <div className="w-full max-w-3xl">
            {/* Header - only show when no content */}
            {!hasContent && (
              <div className="text-center mb-8">
                <div className="relative inline-block mb-4">
                  <div className="absolute inset-0 bg-iron-orange/20 blur-2xl" />
                  <h1 className="relative text-5xl font-black tracking-tighter uppercase text-iron-orange drop-shadow-[0_2px_20px_rgba(255,107,53,0.6)]">
                    WAGNER COACH
                  </h1>
                </div>
                <p className="text-iron-gray text-lg font-heading tracking-wide">
                  Ask anything, log meals, track workouts, get advice
                </p>
              </div>
            )}


            {/* Error Display */}
            {error && (
              <div className="mb-4 p-4 bg-red-900/20 border-2 border-red-500 flex items-start gap-3 clip-path-[polygon(0_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%)]">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-300 font-semibold">{error.message}</p>
                  {error.recoveryAction && (
                    <button
                      onClick={error.recoveryAction}
                      className="mt-2 px-3 py-1 bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      {error.recoveryLabel || 'Try Again'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ChatGPT-Style Input Box */}
            <div className="w-full">
              {/* Attached Files Preview */}
              {attachedFiles.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {attachedFiles.map((attached, index) => (
                    <div
                      key={index}
                      className="relative bg-iron-gray p-2 flex items-center gap-2 border-l-4 border-iron-orange"
                    >
                      {attached.type === 'image' && attached.preview ? (
                        <img
                          src={attached.preview}
                          alt="Preview"
                          className="w-12 h-12 object-cover"
                        />
                      ) : attached.type === 'audio' ? (
                        <div className="w-12 h-12 bg-iron-black flex items-center justify-center">
                          <Volume2 className="w-6 h-6 text-iron-orange" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-iron-black flex items-center justify-center">
                          <FileText className="w-6 h-6 text-iron-orange" />
                        </div>
                      )}
                      <span className="text-xs text-iron-white truncate max-w-[100px]">
                        {attached.file.name}
                      </span>
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input Container with aggressive styling */}
              <div className="bg-gradient-to-br from-iron-gray to-iron-gray/80 border-4 border-iron-orange/50 hover:border-iron-orange focus-within:border-iron-orange transition-all duration-300 flex items-end gap-2 p-3 shadow-2xl relative overflow-hidden">

                {/* Log Type Selector */}
                <div className="relative z-50" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTypeDropdown(!showTypeDropdown)
                    }}
                    disabled={isLoading}
                    className="min-h-[44px] min-w-[44px] p-3 hover:bg-iron-black/50 active:bg-iron-black/70 transition-colors disabled:opacity-50 rounded flex items-center justify-center gap-1 cursor-pointer touch-manipulation"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    title="Select log type"
                    aria-label={`Select log type. Current: ${getLogTypeLabel(selectedLogType)}`}
                    aria-haspopup="listbox"
                    aria-expanded={showTypeDropdown}
                  >
                    <span className="text-2xl pointer-events-none">{getLogTypeIcon(selectedLogType)}</span>
                    <ChevronDown className="w-4 h-4 text-iron-white pointer-events-none" />
                  </button>

                  {showTypeDropdown && (
                    <div
                      role="listbox"
                      aria-label="Log type options"
                      className="absolute bottom-full mb-2 left-0 bg-iron-gray border-4 border-iron-orange shadow-2xl min-w-[200px] overflow-hidden"
                    >
                      {(['auto', 'meal', 'workout', 'activity', 'note', 'measurement'] as LogType[]).map(type => (
                        <button
                          key={type}
                          role="option"
                          aria-selected={selectedLogType === type}
                          onClick={() => {
                            setSelectedLogType(type)
                            setShowTypeDropdown(false)
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-iron-black/50 transition-colors flex items-center gap-3 font-heading ${
                            selectedLogType === type ? 'bg-iron-orange text-white font-black' : 'text-iron-white'
                          }`}
                        >
                          <span className="text-xl">{getLogTypeIcon(type)}</span>
                          <span className="text-sm font-bold tracking-wide uppercase">{getLogTypeLabel(type)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* File Attachment */}
                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click()
                  }}
                  disabled={isLoading}
                  className="relative z-50 min-h-[44px] min-w-[44px] p-3 hover:bg-iron-black/50 active:bg-iron-black/70 transition-colors disabled:opacity-50 rounded flex items-center justify-center cursor-pointer touch-manipulation"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  title="Attach file"
                  aria-label="Attach file"
                >
                  <Paperclip className="w-5 h-5 text-iron-white pointer-events-none" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,audio/*,application/pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                  aria-label="File upload input"
                />

                {/* Text Input */}
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="Ask a question, log a meal, describe a workout..."
                  disabled={isLoading}
                  className="relative z-10 flex-1 bg-transparent text-iron-white placeholder-iron-gray/60 resize-none outline-none min-h-[32px] py-2 text-base disabled:opacity-50 font-medium"
                  rows={1}
                  style={{ maxHeight: '200px' }}
                  aria-label="Message input"
                />

                {/* Voice Recording */}
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={() => {
                      startVoiceRecording()
                    }}
                    disabled={isLoading}
                    className="relative z-50 min-h-[44px] min-w-[44px] p-3 hover:bg-iron-black/50 active:bg-iron-black/70 transition-colors disabled:opacity-50 rounded flex items-center justify-center cursor-pointer touch-manipulation"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    title="Voice input"
                    aria-label="Start voice input"
                  >
                    <Mic className="w-5 h-5 text-iron-white pointer-events-none" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      stopVoiceRecording()
                    }}
                    className="relative z-50 min-h-[44px] min-w-[44px] p-3 bg-red-500 active:bg-red-600 animate-pulse flex items-center justify-center cursor-pointer touch-manipulation"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    title="Stop recording"
                    aria-label="Stop recording"
                  >
                    <Mic className="w-5 h-5 text-white pointer-events-none" />
                  </button>
                )}

                {/* Submit Button with aggressive styling */}
                <button
                  type="button"
                  onClick={() => {
                    if (!isLoading && (text || attachedFiles.length > 0)) {
                      handleSendMessage()
                    }
                  }}
                  disabled={(!text && attachedFiles.length === 0) || isLoading}
                  className="relative z-50 min-h-[44px] min-w-[44px] p-3 bg-gradient-to-r from-iron-orange to-orange-600 hover:from-orange-600 hover:to-iron-orange active:from-orange-700 active:to-orange-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-95 border-2 border-orange-700 flex items-center justify-center cursor-pointer touch-manipulation"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  title="Submit"
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin pointer-events-none" />
                  ) : (
                    <Send className="w-5 h-5 text-white pointer-events-none" />
                  )}
                </button>
              </div>

              {/* Helper Text */}
              <div className="mt-3 text-xs text-iron-gray text-center font-medium">
                Press <kbd className="px-2 py-1 bg-iron-gray/30 border border-iron-gray rounded">Enter</kbd> to send • <kbd className="px-2 py-1 bg-iron-gray/30 border border-iron-gray rounded">Shift + Enter</kbd> for new line
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation />
      </div>
    )
  }

  // ============================================================================
  // RENDER - POST-CHAT (MESSAGING INTERFACE)
  // ============================================================================

  return (
    <div className="h-screen flex flex-col bg-iron-black" style={{ height: '100dvh' }}>
      {/* Header with aggressive Iron Discipline styling */}
      <header className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border-b-4 border-iron-orange sticky top-0 z-30 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-iron-orange to-orange-600 flex items-center justify-center shadow-lg border-2 border-orange-700">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-black tracking-tighter uppercase text-iron-orange drop-shadow-[0_2px_10px_rgba(255,107,53,0.5)]">
                WAGNER COACH
              </h1>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={startNewChat}
                className="text-iron-white hover:text-iron-orange hover:bg-iron-gray/30"
                title="New chat"
                aria-label="Start new chat"
              >
                <Plus className="w-5 h-5" />
              </Button>
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowHistorySidebar(true)}
                  className="text-iron-white hover:text-iron-orange hover:bg-iron-gray/30"
                  title="Conversation history"
                  aria-label="Open conversation history"
                >
                  <History className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar (always visible on lg+) */}
        {!isMobile && (
          <div className="w-80 bg-iron-black border-r-4 border-iron-orange flex flex-col">
            <div className="p-4 border-b border-iron-gray">
              <h2 className="text-iron-orange font-heading font-black text-lg tracking-wide uppercase">
                Conversation History
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {conversations.length === 0 ? (
                <p className="text-iron-gray text-sm text-center py-8">No previous conversations</p>
              ) : (
                conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => {
                      // TODO: Load conversation messages
                    }}
                    className="w-full text-left p-3 bg-iron-gray/20 hover:bg-iron-gray/40 border-l-4 border-transparent hover:border-iron-orange transition-all group"
                  >
                    <p className="font-bold text-iron-white truncate group-hover:text-iron-orange transition-colors">
                      {conv.title || 'Untitled Conversation'}
                    </p>
                    {conv.last_message_preview && (
                      <p className="text-xs text-iron-gray truncate mt-1">
                        {conv.last_message_preview}
                      </p>
                    )}
                    <p className="text-xs text-iron-gray/60 mt-1">
                      {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Mobile Sidebar (Sheet) */}
        {isMobile && (
          <Sheet open={showHistorySidebar} onOpenChange={setShowHistorySidebar}>
            <SheetContent side="left" className="w-80 bg-iron-black border-r-4 border-iron-orange">
              <SheetHeader>
                <SheetTitle className="text-iron-orange font-heading font-black text-xl tracking-wide">
                  CONVERSATION HISTORY
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-2 overflow-y-auto max-h-[calc(100vh-120px)]">
                {conversations.length === 0 ? (
                  <p className="text-iron-gray text-sm text-center py-8">No previous conversations</p>
                ) : (
                  conversations.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => {
                        // TODO: Load conversation messages
                        setShowHistorySidebar(false)
                      }}
                      className="w-full text-left p-3 bg-iron-gray/20 hover:bg-iron-gray/40 border-l-4 border-transparent hover:border-iron-orange transition-all group"
                    >
                      <p className="font-bold text-iron-white truncate group-hover:text-iron-orange transition-colors">
                        {conv.title || 'Untitled Conversation'}
                      </p>
                      {conv.last_message_preview && (
                        <p className="text-xs text-iron-gray truncate mt-1">
                          {conv.last_message_preview}
                        </p>
                      )}
                      <p className="text-xs text-iron-gray/60 mt-1">
                        {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>
        )}

        {/* Messages and Input Container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages Container */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto pb-4"
            data-testid="messages-container"
          >
            <div className="max-w-4xl mx-auto px-4 py-6">
              <div className="space-y-4">
                {messages.map((message) => (
                  <MemoizedMessageBubble
                    key={message.id}
                    message={message}
                  />
                ))}

                {/* Typing Indicator with aggressive styling */}
                {isStreaming && (
                  <div
                    className="flex items-start gap-3 animate-pulse-subtle"
                    data-testid="typing-indicator"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full border-4 border-iron-orange animate-ping opacity-40" />
                      <div className="relative w-12 h-12 rounded-full border-4 border-iron-orange border-t-transparent animate-spin" />
                    </div>

                    <div className="flex-1 bg-iron-gray/10 border-l-4 border-iron-orange px-4 py-4 relative overflow-hidden">
                      {/* Streaming progress bar */}
                      <div
                        className="absolute top-0 left-0 h-1 bg-gradient-to-r from-iron-orange to-orange-600 transition-all duration-300"
                        style={{ width: `${streamProgress}%` }}
                      />

                      <p className="text-iron-white font-bold text-sm mb-2 flex items-center gap-2">
                        <span className="animate-pulse">COACH IS ANALYZING YOUR DATA</span>
                      </p>

                      {streamedContent && (
                        <div className="text-iron-white text-sm leading-relaxed mb-2">
                          {streamedContent}
                          <span className="inline-block w-2 h-5 bg-iron-orange animate-pulse ml-1" />
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-iron-gray">
                        {tokensReceived > 0 && (
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3 text-iron-orange" />
                            {tokensReceived} tokens
                          </span>
                        )}
                        {lastRagSources && (
                          <span className="flex items-center gap-1">
                            <Database className="w-3 h-3 text-iron-orange" />
                            {lastRagSources} sources
                          </span>
                        )}
                        <span className="animate-pulse">Streaming...</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cost/Token Display after AI response */}
                {lastTokens && !isStreaming && (
                  <div className="px-4 py-2 bg-iron-gray/10 border-l-2 border-iron-gray text-xs text-iron-gray flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-iron-orange" />
                        <span className="font-mono">{lastTokens} tokens</span>
                      </div>
                      {lastCost && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-iron-orange" />
                          <span className="font-mono">${(lastCost * 1000).toFixed(3)}m</span>
                        </div>
                      )}
                      {lastRagSources && (
                        <div className="flex items-center gap-1">
                          <Database className="w-3 h-3 text-iron-orange" />
                          <span>{lastRagSources} sources</span>
                        </div>
                      )}
                    </div>

                    <button
                      className="text-iron-gray hover:text-iron-white transition-colors"
                      title="Token/cost info"
                      aria-label="Show token and cost information"
                    >
                      <Info className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Log Preview - For non-meal logs (workout, activity, measurement) */}
                {pendingLogPreview && (
                  <div className="mt-4 bg-iron-black border-2 border-iron-orange rounded-3xl p-6 shadow-2xl">
                    <QuickEntryPreview
                      data={{
                        success: true,
                        entry_type: pendingLogPreview.preview.log_type as any,
                        confidence: pendingLogPreview.preview.confidence,
                        data: pendingLogPreview.preview.data,
                        validation: (pendingLogPreview.preview as any).validation || {
                          errors: [],
                          warnings: [],
                          missing_critical: []
                        },
                        suggestions: (pendingLogPreview.preview as any).suggestions || []
                      }}
                      onSave={async (editedData) => {
                        await handleConfirmLog(editedData)
                      }}
                      onEdit={() => {
                        // Edit mode is handled within the preview components
                      }}
                      onCancel={handleCancelLog}
                    />
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-900/20 border-4 border-red-500 p-4 flex items-start gap-3 clip-path-[polygon(0_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%)]">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-red-300">
                        Something went wrong
                      </p>
                      <p className="text-sm text-red-200 mt-1">
                        {error.message}
                      </p>
                      {error.recoveryAction && (
                        <button
                          onClick={error.recoveryAction}
                          className="mt-2 px-3 py-1 bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors inline-flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          {error.recoveryLabel || 'Try Again'}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>

          {/* Input Container - with proper bottom padding for bottom nav */}
          <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border-t-4 border-iron-orange p-4 pb-20">
            <div className="max-w-4xl mx-auto">
              {/* Attached Files Preview */}
              {attachedFiles.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {attachedFiles.map((attached, index) => (
                    <div
                      key={index}
                      className="relative bg-iron-black p-2 flex items-center gap-2 border-l-4 border-iron-orange"
                    >
                      {attached.type === 'image' && attached.preview ? (
                        <img
                          src={attached.preview}
                          alt="Preview"
                          className="w-12 h-12 object-cover"
                        />
                      ) : attached.type === 'audio' ? (
                        <div className="w-12 h-12 bg-iron-gray flex items-center justify-center">
                          <Volume2 className="w-6 h-6 text-iron-orange" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-iron-gray flex items-center justify-center">
                          <FileText className="w-6 h-6 text-iron-orange" />
                        </div>
                      )}
                      <span className="text-xs text-iron-white truncate max-w-[100px]">
                        {attached.file.name}
                      </span>
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors"
                        aria-label={`Remove ${attached.file.name}`}
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input Container */}
              <div className="bg-iron-black border-4 border-iron-orange/50 hover:border-iron-orange focus-within:border-iron-orange transition-colors flex items-end gap-2 p-3 relative overflow-hidden">

                {/* Log Type Selector */}
                <div className="relative z-50" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTypeDropdown(!showTypeDropdown)
                    }}
                    disabled={isLoading || !!pendingLogPreview}
                    className="min-h-[44px] min-w-[44px] p-3 hover:bg-iron-gray/50 active:bg-iron-gray/70 transition-colors disabled:opacity-50 rounded flex items-center justify-center gap-1 cursor-pointer touch-manipulation"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    title="Select log type"
                    aria-label={`Select log type. Current: ${getLogTypeLabel(selectedLogType)}`}
                    aria-haspopup="listbox"
                    aria-expanded={showTypeDropdown}
                  >
                    <span className="text-2xl pointer-events-none">{getLogTypeIcon(selectedLogType)}</span>
                    <ChevronDown className="w-4 h-4 text-iron-white pointer-events-none" />
                  </button>

                  {showTypeDropdown && (
                    <div
                      role="listbox"
                      aria-label="Log type options"
                      className="absolute bottom-full mb-2 left-0 bg-iron-black border-4 border-iron-orange shadow-2xl min-w-[200px] overflow-hidden"
                    >
                      {(['auto', 'meal', 'workout', 'activity', 'note', 'measurement'] as LogType[]).map(type => (
                        <button
                          key={type}
                          role="option"
                          aria-selected={selectedLogType === type}
                          onClick={() => {
                            setSelectedLogType(type)
                            setShowTypeDropdown(false)
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-iron-gray/50 transition-colors flex items-center gap-3 font-heading ${
                            selectedLogType === type ? 'bg-iron-orange text-white font-black' : 'text-iron-white'
                          }`}
                        >
                          <span className="text-xl">{getLogTypeIcon(type)}</span>
                          <span className="text-sm font-bold tracking-wide uppercase">{getLogTypeLabel(type)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* File Attachment */}
                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click()
                  }}
                  disabled={isLoading || !!pendingLogPreview}
                  className="relative z-50 min-h-[44px] min-w-[44px] p-3 hover:bg-iron-gray/50 active:bg-iron-gray/70 transition-colors disabled:opacity-50 rounded flex items-center justify-center cursor-pointer touch-manipulation"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  title="Attach file"
                  aria-label="Attach file"
                >
                  <Paperclip className="w-5 h-5 text-iron-white pointer-events-none" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,audio/*,application/pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                  aria-label="File upload input"
                />

                {/* Text Input */}
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder={
                    pendingLogPreview
                      ? "Review the log above before sending another message..."
                      : "Ask anything, or describe what you ate/did..."
                  }
                  disabled={isLoading || !!pendingLogPreview}
                  className="relative z-10 flex-1 bg-transparent text-iron-white placeholder-iron-gray/60 resize-none outline-none min-h-[32px] py-2 text-base disabled:opacity-50 font-medium"
                  rows={1}
                  style={{ maxHeight: '200px' }}
                  aria-label="Message input"
                />

                {/* Voice Recording */}
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={() => {
                      startVoiceRecording()
                    }}
                    disabled={isLoading || !!pendingLogPreview}
                    className="relative z-50 min-h-[44px] min-w-[44px] p-3 hover:bg-iron-gray/50 active:bg-iron-gray/70 transition-colors disabled:opacity-50 rounded flex items-center justify-center cursor-pointer touch-manipulation"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    title="Voice input"
                    aria-label="Start voice input"
                  >
                    <Mic className="w-5 h-5 text-iron-white pointer-events-none" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      stopVoiceRecording()
                    }}
                    className="relative z-50 min-h-[44px] min-w-[44px] p-3 bg-red-500 active:bg-red-600 animate-pulse flex items-center justify-center cursor-pointer touch-manipulation"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    title="Stop recording"
                    aria-label="Stop recording"
                  >
                    <Mic className="w-5 h-5 text-white pointer-events-none" />
                  </button>
                )}

                {/* Submit Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (!isLoading && !pendingLogPreview && (text || attachedFiles.length > 0)) {
                      handleSendMessage()
                    }
                  }}
                  disabled={(!text && attachedFiles.length === 0) || isLoading || !!pendingLogPreview}
                  className="relative z-50 min-h-[44px] min-w-[44px] p-3 bg-gradient-to-r from-iron-orange to-orange-600 hover:from-orange-600 hover:to-iron-orange active:from-orange-700 active:to-orange-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-95 border-2 border-orange-700 flex items-center justify-center cursor-pointer touch-manipulation"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  title="Submit"
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin pointer-events-none" />
                  ) : (
                    <Send className="w-5 h-5 text-white pointer-events-none" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {isLoading && "Coach is responding"}
        {streamedContent && `Coach says: ${streamedContent.slice(-100)}`}
      </div>
    </div>
  )
}
