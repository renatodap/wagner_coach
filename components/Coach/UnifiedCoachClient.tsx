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
  Send,
  X,
  Loader2,
  AlertCircle,
  MessageSquare,
  History,
  RefreshCw,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { UnifiedMessageBubble } from './UnifiedMessageBubble'
import QuickEntryPreview from '@/components/quick-entry/QuickEntryPreview'
import BottomNavigation from '@/app/components/BottomNavigation'
import { getAutoLogPreference, updateAutoLogPreference } from '@/lib/api/profile'
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
import { createClient } from '@/lib/supabase/client'

interface UnifiedCoachClientProps {
  userId: string
  initialConversationId?: string | null
}

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
  const [autoLogEnabled, setAutoLogEnabled] = useState(false)
  const [isLoadingPreference, setIsLoadingPreference] = useState(false)

  // Cost tracking
  const [lastCost, setLastCost] = useState<number | null>(null)
  const [lastTokens, setLastTokens] = useState<number | null>(null)
  const [lastRagSources, setLastRagSources] = useState<number | null>(null)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Hooks
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Determine if we're in chat mode or entry mode
  const hasStartedChat = messages.length > 0
  const hasContent = text.trim()

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

  // NOTE: Dropdown close is now handled by backdrop div (React events only)
  // No document-level listeners to avoid native/synthetic event conflicts

  // Load conversation history on mount
  useEffect(() => {
    loadConversationHistory()
  }, [])

  // Load auto-log preference on mount
  useEffect(() => {
    loadAutoLogPreference()
  }, [])

  const loadAutoLogPreference = async () => {
    try {
      setIsLoadingPreference(true)
      const preference = await getAutoLogPreference()
      setAutoLogEnabled(preference.auto_log_enabled)
    } catch (err) {
      console.error('Failed to load auto-log preference:', err)
      // Default to false (preview mode)
      setAutoLogEnabled(false)
    } finally {
      setIsLoadingPreference(false)
    }
  }

  const toggleAutoLog = async () => {
    const newValue = !autoLogEnabled

    try {
      // Optimistic update
      setAutoLogEnabled(newValue)

      // Update in database
      await updateAutoLogPreference(newValue)

      // Show success toast with mode info
      toast({
        title: newValue ? '⚡ Auto-Save Mode Enabled' : '👁️ Preview Mode Enabled',
        description: newValue
          ? 'Logs will be saved automatically. You can edit them later.'
          : 'You\'ll review logs before saving them.',
        variant: 'default',
      })
    } catch (err) {
      // Revert on error
      setAutoLogEnabled(!newValue)
      console.error('Failed to update auto-log preference:', err)
      toast({
        title: 'Failed to update preference',
        description: 'Please try again or check your connection.',
        variant: 'destructive',
      })
    }
  }

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

  const loadConversation = async (convId: string) => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch conversation messages
      const { messages: conversationMessages } = await getConversationMessages(convId)

      // Update state with loaded messages
      setMessages(conversationMessages)
      setConversationId(convId)
      setPendingLogPreview(null)

      // Close mobile sidebar if open
      if (isMobile) {
        setShowHistorySidebar(false)
      }

      // Scroll to bottom to show messages
      setTimeout(() => {
        scrollToBottom(false) // instant scroll, not smooth
      }, 100)

      toast({
        title: '💬 Conversation loaded',
        description: `${conversationMessages.length} messages`,
      })
    } catch (err) {
      console.error('Failed to load conversation:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversation'
      setError({
        message: `⚠️ ${errorMessage}`,
        recoveryAction: () => loadConversation(convId),
        recoveryLabel: 'Retry'
      })
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const startNewChat = () => {
    setMessages([])
    setConversationId(null)
    setPendingLogPreview(null)
    setText('')
    setError(null)
    if (isMobile) {
      setShowHistorySidebar(false)
    }
  }

  // ============================================================================
  // MESSAGE HANDLING
  // ============================================================================

  async function handleSendMessage() {
    if (!text.trim()) return

    setError(null)
    setIsLoading(true)
    setIsStreaming(true)
    setStreamedContent('')
    setStreamProgress(0)
    setTokensReceived(0)

    const messageText = text

    try {
      // Create streaming request
      const request = {
        message: messageText,
        conversation_id: conversationId,
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

          // Check for log previews
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
              setIsLoading(false)
              setIsStreaming(false)

              // Redirect to meal log page
              router.push(`/nutrition/log?${params.toString()}`)
              return
            }

            // For activities/workouts, redirect to activity log page with pre-filled data
            if (chunk.log_preview.log_type === 'activity' || chunk.log_preview.log_type === 'workout') {
              const params = new URLSearchParams({
                previewData: JSON.stringify(chunk.log_preview.data),
                returnTo: '/coach',
                conversationId: newConversationId || '',
                userMessageId: chunk.message_id,
                logType: chunk.log_preview.log_type
              })

              setText('')
              setIsLoading(false)
              setIsStreaming(false)

              // Redirect to activity log page
              router.push(`/activities/log?${params.toString()}`)
              return
            }

            // For other log types (measurements, etc), show preview card
            setPendingLogPreview({
              preview: chunk.log_preview,
              userMessageId: chunk.message_id
            })

            setText('')
            setIsLoading(false)
            setIsStreaming(false)
            return
          }

          // If it's a chat message (not a redirect), add user message + AI message
          if (chunk.message) {
            // Add user message first (now that we know it's not redirecting)
            const userMessage: UnifiedMessage = {
              id: chunk.message_id,
              role: 'user',
              content: messageText,
              message_type: 'chat',
              is_vectorized: false,
              created_at: new Date().toISOString()
            }

            accumulatedContent = chunk.message
            const aiMessage: UnifiedMessage = {
              id: aiMessageId,
              role: 'assistant',
              content: accumulatedContent,
              message_type: 'chat',
              is_vectorized: false,
              created_at: new Date().toISOString()
            }
            setMessages(prev => [...prev, userMessage, aiMessage])
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

      // Reload conversation history
      loadConversationHistory()
    } catch (err) {
      // Error handling (no optimistic message to remove since we add it after food check)

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
              {/* Input Container */}
              <div className="bg-iron-gray border-2 border-iron-gray hover:border-iron-orange focus-within:border-iron-orange transition-colors flex items-end gap-2 p-3 rounded-lg shadow-lg">

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

                {/* Submit Button */}
                <button
                  type="button"
                  onClick={() => {
                    console.log('[Submit] Button clicked!')
                    if (!isLoading && text.trim()) {
                      handleSendMessage()
                    }
                  }}
                  disabled={!text.trim() || isLoading}
                  className="relative z-50 min-h-[44px] min-w-[44px] p-3 bg-iron-orange hover:bg-orange-600 active:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center touch-manipulation"
                  style={{
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    userSelect: 'none'
                  }}
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
      {/* Header */}
      <header className="bg-zinc-900 border-b-2 border-iron-orange sticky top-0 z-30 shadow-lg">
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
              {/* Auto-Log Toggle - LOUD AND CLEAR */}
              <button
                onClick={toggleAutoLog}
                disabled={isLoadingPreference}
                className={`
                  px-3 py-2 rounded-lg border-2 transition-all font-bold text-xs uppercase tracking-wide
                  flex items-center gap-2 min-h-[44px]
                  ${autoLogEnabled
                    ? 'border-iron-orange bg-iron-orange text-iron-black hover:bg-orange-600'
                    : 'border-iron-gray bg-iron-black text-iron-white hover:border-iron-orange hover:bg-iron-gray/30'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                title={autoLogEnabled ? 'Auto-Save Mode: Logs saved instantly' : 'Preview Mode: Review before saving'}
                aria-label={autoLogEnabled ? 'Disable auto-logging' : 'Enable auto-logging'}
              >
                {isLoadingPreference ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span className="text-base">{autoLogEnabled ? '⚡' : '👁️'}</span>
                    <span className="hidden sm:inline">{autoLogEnabled ? 'Auto-Save' : 'Preview'}</span>
                  </>
                )}
              </button>

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

      {/* Current Mode Info Banner - LOUD AND CLEAR */}
      {!isLoadingPreference && (
        <div className={`
          border-b-2 py-2 px-4 text-center text-sm font-semibold
          ${autoLogEnabled
            ? 'bg-iron-orange/10 border-iron-orange text-iron-orange'
            : 'bg-iron-gray/20 border-iron-gray text-iron-white'
          }
        `}>
          <span className="inline-flex items-center gap-2">
            <span className="text-base">{autoLogEnabled ? '⚡' : '👁️'}</span>
            <span>
              {autoLogEnabled
                ? 'Auto-Save Mode: Logs saved automatically'
                : 'Preview Mode: Review logs before saving'
              }
            </span>
          </span>
        </div>
      )}

      {/* Main Content Area with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar (always visible on lg+) */}
        {!isMobile && (
          <div className="w-80 bg-iron-black border-r-2 border-iron-gray flex flex-col">
            <div className="p-4 border-b border-iron-gray">
              <h2 className="text-iron-orange font-heading font-black text-lg tracking-wide uppercase">
                Conversation History
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {conversations.length === 0 ? (
                <p className="text-iron-gray text-sm text-center py-8">No previous conversations</p>
              ) : (
                conversations.map(conv => {
                  const isActive = conversationId === conv.id
                  return (
                    <button
                      key={conv.id}
                      onClick={() => loadConversation(conv.id)}
                      className={`
                        w-full text-left p-3 transition-all group
                        ${isActive
                          ? 'bg-iron-orange/20 border-l-4 border-iron-orange'
                          : 'bg-iron-gray/20 hover:bg-iron-gray/40 border-l-4 border-transparent hover:border-iron-orange'
                        }
                      `}
                      disabled={isLoading}
                    >
                      <p className={`font-bold truncate transition-colors ${
                        isActive ? 'text-iron-orange' : 'text-iron-white group-hover:text-iron-orange'
                      }`}>
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
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Mobile Sidebar (Sheet) */}
        {isMobile && (
          <Sheet open={showHistorySidebar} onOpenChange={setShowHistorySidebar}>
            <SheetContent side="left" className="w-80 bg-iron-black border-r-2 border-iron-orange">
              <SheetHeader>
                <SheetTitle className="text-iron-orange font-heading font-black text-xl tracking-wide">
                  CONVERSATION HISTORY
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-2 overflow-y-auto max-h-[calc(100vh-120px)]">
                {conversations.length === 0 ? (
                  <p className="text-iron-gray text-sm text-center py-8">No previous conversations</p>
                ) : (
                  conversations.map(conv => {
                    const isActive = conversationId === conv.id
                    return (
                      <button
                        key={conv.id}
                        onClick={() => loadConversation(conv.id)}
                        className={`
                          w-full text-left p-3 transition-all group
                          ${isActive
                            ? 'bg-iron-orange/20 border-l-4 border-iron-orange'
                            : 'bg-iron-gray/20 hover:bg-iron-gray/40 border-l-4 border-transparent hover:border-iron-orange'
                          }
                        `}
                        disabled={isLoading}
                      >
                        <p className={`font-bold truncate transition-colors ${
                          isActive ? 'text-iron-orange' : 'text-iron-white group-hover:text-iron-orange'
                        }`}>
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
                    )
                  })
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

                {/* Typing Indicator */}
                {isStreaming && (
                  <div
                    className="flex items-start gap-3"
                    data-testid="typing-indicator"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="relative">
                      <Loader2 className="w-8 h-8 text-iron-orange animate-spin" />
                    </div>

                    <div className="flex-1 bg-iron-gray/10 border-l-2 border-iron-orange px-4 py-3 rounded-r">
                      <p className="text-iron-white font-medium text-sm mb-1">
                        <span className="animate-pulse">Coach is thinking...</span>
                      </p>

                      {streamedContent && (
                        <div className="text-iron-white text-sm leading-relaxed mt-2">
                          {streamedContent}
                          <span className="inline-block w-1 h-4 bg-iron-orange animate-pulse ml-1" />
                        </div>
                      )}
                    </div>
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
          <div className="bg-zinc-900 border-t-2 border-iron-orange p-4 pb-20">
            <div className="max-w-4xl mx-auto">
              {/* Input Container */}
              <div className="bg-iron-black border-2 border-iron-gray hover:border-iron-orange focus-within:border-iron-orange transition-colors flex items-end gap-2 p-3 rounded-lg">

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

                {/* Submit Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (!isLoading && !pendingLogPreview && text.trim()) {
                      handleSendMessage()
                    }
                  }}
                  disabled={!text.trim() || isLoading || !!pendingLogPreview}
                  className="relative z-50 min-h-[44px] min-w-[44px] p-3 bg-iron-orange hover:bg-orange-600 active:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center cursor-pointer touch-manipulation"
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
