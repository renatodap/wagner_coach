/**
 * Unified Coach Client
 *
 * Complete ChatGPT-like interface for Wagner Coach.
 * Single interface for both:
 * - Chat (questions, advice) → AI responds with RAG context
 * - Logging (meals, workouts) → Shows preview card for confirmation
 *
 * Follows 2026 AI SaaS principles:
 * - Invisible, anticipatory, trustworthy
 * - 3-minute time-to-value (user can start chatting immediately)
 * - Minimal cognitive load (clear, calm, consistent)
 * - Proactive (suggests actions at right moment)
 *
 * Features:
 * - Auto-detection of logs vs chat
 * - Log preview cards with confirm/edit/cancel
 * - Conversation history (sidebar on desktop, bottom sheet on mobile)
 * - Streaming responses (typing indicator)
 * - Optimistic UI updates
 * - Full RAG context from all user data
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Loader2, ChevronLeft, Archive, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { UnifiedMessageBubble } from './UnifiedMessageBubble'
import { LogPreviewCard } from './LogPreviewCard'
import { ChatInput } from './ChatInput'
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

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Hooks
  const { toast } = useToast()

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages, pendingLogPreview])

  // Load conversation history on mount (if continuing existing conversation)
  useEffect(() => {
    if (initialConversationId) {
      loadConversationHistory(initialConversationId)
    } else {
      // Show welcome message for new conversation
      showWelcomeMessage()
    }
  }, [initialConversationId])

  function scrollToBottom(smooth = true) {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      block: 'end'
    })
  }

  function showWelcomeMessage() {
    // Welcome message (not saved to DB)
    const welcomeMessage: UnifiedMessage = {
      id: 'welcome',
      role: 'assistant',
      content: `# Welcome to Your AI Coach! 👋

I'm here to help you achieve your fitness and nutrition goals. I can:

✅ **Answer questions** about training, nutrition, recovery, and more
✅ **Log your meals** - just tell me what you ate (e.g., "I had 3 eggs and oatmeal")
✅ **Log your workouts** - describe what you did (e.g., "Did 10 pushups and ran 5K")
✅ **Track measurements** - tell me your weight, body fat, etc.
✅ **Provide personalized advice** based on your complete history

**Just start typing!** I'll automatically detect if you're logging something or asking a question.`,
      message_type: 'chat',
      is_vectorized: false,
      created_at: new Date().toISOString()
    }
    setMessages([welcomeMessage])
  }

  async function loadConversationHistory(convId: string) {
    // TODO: Load from backend (Phase 2 - conversation history)
    // For now, just show welcome
    showWelcomeMessage()
  }

  /**
   * Handle sending a message
   *
   * Flow:
   * 1. Add user message to UI (optimistic)
   * 2. Send to backend
   * 3. Backend classifies (chat vs log)
   * 4. If log: Show preview card
   * 5. If chat: Add AI response to UI
   */
  async function handleSendMessage(message: string, imageUrls?: string[]) {
    if (!message.trim() && !imageUrls?.length) return

    setError(null)
    setIsLoading(true)

    // Optimistic UI update - add user message immediately
    const tempUserMessageId = `temp-${Date.now()}`
    const optimisticUserMessage: UnifiedMessage = {
      id: tempUserMessageId,
      role: 'user',
      content: message,
      message_type: 'chat',
      is_vectorized: false,
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, optimisticUserMessage])

    try {
      // Send to backend
      const response: SendMessageResponse = await sendMessage({
        message,
        conversation_id: conversationId,
        has_image: !!imageUrls?.length,
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
          is_vectorized: false, // Will be vectorized in backend
          created_at: new Date().toISOString()
        }
        setMessages(prev => [...prev, aiMessage])
      }
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

  /**
   * Handle confirming a log
   *
   * Flow:
   * 1. Call confirmLog API
   * 2. Add system success message
   * 3. Clear pending log preview
   */
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

      // Show success toast
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

  /**
   * Handle canceling a log
   */
  function handleCancelLog() {
    setPendingLogPreview(null)
    toast({
      title: 'Cancelled',
      description: 'Log was not saved',
      variant: 'default'
    })
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Back button (mobile only) */}
              <Link
                href="/dashboard"
                className="lg:hidden text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </Link>

              {/* Title */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg font-bold text-gray-900">
                  Coach
                </h1>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Conversation history button (Phase 2) */}
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-600 hover:text-gray-900"
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
                className="flex items-center gap-2 text-gray-500 px-4"
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
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">
                    Something went wrong
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    {error}
                  </p>
                  <button
                    onClick={() => setError(null)}
                    className="text-sm text-red-600 hover:text-red-800 underline mt-2"
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
      <div className="bg-white border-t border-gray-200 p-4 safe-area-pb">
        <div className="max-w-4xl mx-auto">
          <ChatInput
            onSend={handleSendMessage}
            disabled={isLoading || !!pendingLogPreview}
            placeholder={
              pendingLogPreview
                ? "Review the log above before sending another message..."
                : "Ask anything, or describe what you ate/did..."
            }
          />
        </div>
      </div>
    </div>
  )
}
