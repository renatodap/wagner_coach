/**
 * Unified Coach Client - ChatGPT-Style Interface
 *
 * Complete AI Coach with Quick Entry integration.
 * - Pre-chat state: Centered entry screen like Quick Entry
 * - Post-chat state: Full messaging interface
 * - Auto-detects logging vs chatting
 * - Orange/black visual theme for consistency
 *
 * Features:
 * - Multimodal input (text, voice, images)
 * - Auto-detection of logs vs chat
 * - Log preview cards with confirm/edit/cancel
 * - Streaming responses (typing indicator)
 * - RAG context from all user data
 */

'use client'

import { useState, useEffect, useRef } from 'react'
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
  Archive
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { UnifiedMessageBubble } from './UnifiedMessageBubble'
import { LogPreviewCard } from './LogPreviewCard'
import {
  sendMessage,
  confirmLog,
  type UnifiedMessage,
  type LogPreview,
  type SendMessageResponse
} from '@/lib/api/unified-coach'

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

export function UnifiedCoachClient({ userId, initialConversationId }: UnifiedCoachClientProps) {
  // State
  const [messages, setMessages] = useState<UnifiedMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId || null)
  const [pendingLogPreview, setPendingLogPreview] = useState<{
    preview: LogPreview
    userMessageId: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Input state
  const [text, setText] = useState('')
  const [selectedLogType, setSelectedLogType] = useState<LogType>('auto')
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Hooks
  const { toast } = useToast()

  // Determine if we're in chat mode (messages exist) or entry mode (no messages)
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
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [text])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTypeDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function scrollToBottom(smooth = true) {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      block: 'end'
    })
  }

  // ============================================================================
  // FILE HANDLING
  // ============================================================================

  const handleFileSelect = (files: FileList) => {
    const newFiles: AttachedFile[] = []

    Array.from(files).forEach(file => {
      let fileType: AttachedFile['type'] = 'other'

      if (file.type.startsWith('image/')) {
        fileType = 'image'
        const reader = new FileReader()
        reader.onloadend = () => {
          setAttachedFiles(prev => prev.map(f =>
            f.file === file ? { ...f, preview: reader.result as string } : f
          ))
        }
        reader.readAsDataURL(file)
      } else if (file.type.startsWith('audio/')) {
        fileType = 'audio'
      } else if (file.type === 'application/pdf') {
        fileType = 'pdf'
      }

      newFiles.push({ file, type: fileType })
    })

    setAttachedFiles(prev => [...prev, ...newFiles])
    setError(null)
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
        setError('Voice recognition not supported in this browser')
        return
      }

      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsRecording(true)
        setError(null)
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setText(prev => prev ? `${prev} ${transcript}` : transcript)
        setIsRecording(false)
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setError(`Voice input error: ${event.error}`)
        setIsRecording(false)
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err) {
      console.error('Voice recording error:', err)
      setError('Failed to start voice recording')
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

    // Optimistic UI update - add user message immediately
    const tempUserMessageId = `temp-${Date.now()}`
    const optimisticUserMessage: UnifiedMessage = {
      id: tempUserMessageId,
      role: 'user',
      content: text,
      message_type: 'chat',
      is_vectorized: false,
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, optimisticUserMessage])

    try {
      // TODO: Handle image URLs from attachedFiles
      const imageUrls = undefined // Backend integration needed

      // Send to backend
      const response: SendMessageResponse = await sendMessage({
        message: text,
        conversation_id: conversationId,
        has_image: !!attachedFiles.length,
        image_urls: imageUrls
      })

      // Update conversation ID if new
      if (!conversationId) {
        setConversationId(response.conversation_id)
      }

      // Replace temp user message with real one
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempUserMessageId
            ? { ...msg, id: response.message_id }
            : msg
        )
      )

      // Handle response
      if (response.is_log_preview && response.log_preview) {
        // Show log preview card
        setPendingLogPreview({
          preview: response.log_preview,
          userMessageId: response.message_id
        })
      } else if (response.message) {
        // Add AI chat response
        const aiMessage: UnifiedMessage = {
          id: response.message_id,
          role: 'assistant',
          content: response.message,
          message_type: 'chat',
          is_vectorized: false,
          created_at: new Date().toISOString()
        }
        setMessages(prev => [...prev, aiMessage])
      }

      // Clear input
      setText('')
      setAttachedFiles([])
    } catch (err) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempUserMessageId))

      const errorMessage = err instanceof Error ? err.message : 'Failed to send message'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
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

      // Add system success message
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

      // Clear pending preview
      setPendingLogPreview(null)

      toast({
        title: 'Logged!',
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
    toast({
      title: 'Cancelled',
      description: 'Log was not saved',
      variant: 'default'
    })
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
      <div className="flex flex-col h-screen bg-iron-black">
        {/* ChatGPT-style centered content */}
        <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto p-4 pb-24">
          <div className="w-full max-w-3xl">
            {/* Header - only show when no content */}
            {!hasContent && (
              <div className="text-center mb-8">
                <h1 className="text-4xl font-heading text-iron-orange mb-3">YOUR AI COACH</h1>
                <p className="text-iron-gray text-lg">Ask anything, log meals, track workouts, get advice</p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-4 bg-red-900/20 border-2 border-red-500 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* ChatGPT-Style Input Box - CENTERED */}
            <div className="w-full">
              {/* Attached Files Preview */}
              {attachedFiles.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {attachedFiles.map((attached, index) => (
                    <div
                      key={index}
                      className="relative bg-iron-gray p-2 flex items-center gap-2"
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

              {/* Input Container */}
              <div className="bg-iron-gray border-2 border-iron-gray hover:border-iron-orange/50 focus-within:border-iron-orange transition-colors flex items-end gap-2 p-3 shadow-2xl">
                {/* Log Type Selector */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                    disabled={isLoading}
                    className="p-2 hover:bg-iron-black/50 transition-colors disabled:opacity-50"
                    title="Select log type"
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-xl">{getLogTypeIcon(selectedLogType)}</span>
                      <ChevronDown className="w-4 h-4 text-iron-white" />
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {showTypeDropdown && (
                    <div className="absolute bottom-full mb-2 left-0 bg-iron-gray border-2 border-iron-orange shadow-2xl min-w-[180px] overflow-hidden">
                      {(['auto', 'meal', 'workout', 'activity', 'note', 'measurement'] as LogType[]).map(type => (
                        <button
                          key={type}
                          onClick={() => {
                            setSelectedLogType(type)
                            setShowTypeDropdown(false)
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-iron-black/50 transition-colors flex items-center gap-3 ${
                            selectedLogType === type ? 'bg-iron-orange text-white' : 'text-iron-white'
                          }`}
                        >
                          <span className="text-lg">{getLogTypeIcon(type)}</span>
                          <span className="text-sm font-medium">{getLogTypeLabel(type)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* File Attachment */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="p-2 hover:bg-iron-black/50 transition-colors disabled:opacity-50"
                  title="Attach file"
                >
                  <Paperclip className="w-5 h-5 text-iron-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,audio/*,application/pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
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
                  className="flex-1 bg-transparent text-iron-white placeholder-iron-gray/60 resize-none outline-none max-h-[200px] min-h-[28px] py-2 text-base disabled:opacity-50"
                  rows={1}
                />

                {/* Voice Recording */}
                {!isRecording ? (
                  <button
                    onClick={startVoiceRecording}
                    disabled={isLoading}
                    className="p-2 hover:bg-iron-black/50 transition-colors disabled:opacity-50"
                    title="Voice input"
                  >
                    <Mic className="w-5 h-5 text-iron-white" />
                  </button>
                ) : (
                  <button
                    onClick={stopVoiceRecording}
                    className="p-2 bg-red-500 animate-pulse"
                    title="Stop recording"
                  >
                    <Mic className="w-5 h-5 text-white" />
                  </button>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={(!text && attachedFiles.length === 0) || isLoading}
                  className="p-3 bg-iron-orange hover:bg-iron-orange/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                  title="Submit"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>

              {/* Helper Text */}
              <div className="mt-3 text-xs text-iron-gray text-center">
                Press <kbd className="px-2 py-1 bg-iron-gray/30">Enter</kbd> to send • <kbd className="px-2 py-1 bg-iron-gray/30">Shift + Enter</kbd> for new line
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================================
  // RENDER - POST-CHAT (MESSAGING INTERFACE)
  // ============================================================================

  return (
    <div className="h-screen flex flex-col bg-iron-black">
      {/* Header */}
      <header className="bg-iron-gray border-b-2 border-iron-orange sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Title */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-iron-orange flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg font-heading text-iron-orange">
                  YOUR AI COACH
                </h1>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-iron-white hover:text-iron-orange hover:bg-iron-black"
                title="Conversation history (coming soon)"
                disabled
              >
                <Archive className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto pb-4"
        data-testid="messages-container"
      >
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Messages */}
          <div className="space-y-4">
            {messages.map((message) => (
              <UnifiedMessageBubble
                key={message.id}
                message={message}
              />
            ))}

            {/* Typing Indicator */}
            {isLoading && !pendingLogPreview && (
              <div
                className="flex items-center gap-2 text-iron-gray px-4"
                data-testid="typing-indicator"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Coach is thinking...</span>
              </div>
            )}

            {/* Log Preview Card (if log detected) */}
            {pendingLogPreview && (
              <LogPreviewCard
                preview={pendingLogPreview.preview}
                onConfirm={handleConfirmLog}
                onCancel={handleCancelLog}
                className="mt-4"
              />
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/20 border-2 border-red-500 p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-300">
                    Something went wrong
                  </p>
                  <p className="text-sm text-red-200 mt-1">
                    {error}
                  </p>
                  <button
                    onClick={() => setError(null)}
                    className="text-sm text-red-400 hover:text-red-300 underline mt-2"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Container (fixed at bottom) */}
      <div className="bg-iron-gray border-t-2 border-iron-orange p-4 safe-area-pb">
        <div className="max-w-4xl mx-auto">
          {/* Attached Files Preview */}
          {attachedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachedFiles.map((attached, index) => (
                <div
                  key={index}
                  className="relative bg-iron-black p-2 flex items-center gap-2"
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
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input Container */}
          <div className="bg-iron-black border-2 border-iron-orange/50 hover:border-iron-orange focus-within:border-iron-orange transition-colors flex items-end gap-2 p-3">
            {/* Log Type Selector */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                disabled={isLoading || !!pendingLogPreview}
                className="p-2 hover:bg-iron-gray/50 transition-colors disabled:opacity-50"
                title="Select log type"
              >
                <div className="flex items-center gap-1">
                  <span className="text-xl">{getLogTypeIcon(selectedLogType)}</span>
                  <ChevronDown className="w-4 h-4 text-iron-white" />
                </div>
              </button>

              {showTypeDropdown && (
                <div className="absolute bottom-full mb-2 left-0 bg-iron-black border-2 border-iron-orange shadow-2xl min-w-[180px] overflow-hidden">
                  {(['auto', 'meal', 'workout', 'activity', 'note', 'measurement'] as LogType[]).map(type => (
                    <button
                      key={type}
                      onClick={() => {
                        setSelectedLogType(type)
                        setShowTypeDropdown(false)
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-iron-gray/50 transition-colors flex items-center gap-3 ${
                        selectedLogType === type ? 'bg-iron-orange text-white' : 'text-iron-white'
                      }`}
                    >
                      <span className="text-lg">{getLogTypeIcon(type)}</span>
                      <span className="text-sm font-medium">{getLogTypeLabel(type)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* File Attachment */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || !!pendingLogPreview}
              className="p-2 hover:bg-iron-gray/50 transition-colors disabled:opacity-50"
              title="Attach file"
            >
              <Paperclip className="w-5 h-5 text-iron-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,audio/*,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
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
              className="flex-1 bg-transparent text-iron-white placeholder-iron-gray/60 resize-none outline-none max-h-[200px] min-h-[28px] py-2 text-base disabled:opacity-50"
              rows={1}
            />

            {/* Voice Recording */}
            {!isRecording ? (
              <button
                onClick={startVoiceRecording}
                disabled={isLoading || !!pendingLogPreview}
                className="p-2 hover:bg-iron-gray/50 transition-colors disabled:opacity-50"
                title="Voice input"
              >
                <Mic className="w-5 h-5 text-iron-white" />
              </button>
            ) : (
              <button
                onClick={stopVoiceRecording}
                className="p-2 bg-red-500 animate-pulse"
                title="Stop recording"
              >
                <Mic className="w-5 h-5 text-white" />
              </button>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSendMessage}
              disabled={(!text && attachedFiles.length === 0) || isLoading || !!pendingLogPreview}
              className="p-3 bg-iron-orange hover:bg-iron-orange/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              title="Submit"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Send className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
