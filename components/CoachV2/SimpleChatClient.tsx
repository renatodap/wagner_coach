'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Loader2, MessageSquare, Plus, Zap } from 'lucide-react'
import { sendMessageStreaming, getConversations, getConversationMessages, confirmLog, cancelLog } from '@/lib/api/unified-coach'
import type { SendMessageResponse, ConversationSummary, UnifiedMessage, LogType, FoodDetected, SuggestedAction } from '@/lib/api/unified-coach'
import { getAutoLogPreference, updateAutoLogPreference } from '@/lib/api/profile'
import BottomNavigation from '@/app/components/BottomNavigation'
import { useToast } from '@/hooks/use-toast'
import { InlineMealCard } from '@/components/Coach/InlineMealCard'
import { ActionButtons } from '@/components/Coach/ActionButtons'
import { FloatingQuickActions } from '@/components/Coach/FloatingQuickActions'
import { MessageActions } from '@/components/Coach/MessageActions'
import { VoiceRecorder } from '@/components/Coach/VoiceRecorder'
import { CameraButton } from '@/components/Coach/CameraButton'
import { generateSmartSuggestions, getTimeBasedGreeting } from '@/lib/utils/smartSuggestions'
import type { FoodDetected as FoodDetectedType, SuggestedAction as SuggestedActionType } from '@/lib/types'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
  food_detected?: FoodDetectedType
  food_logged?: boolean
  suggested_actions?: SuggestedActionType[]
}

interface PendingLog {
  log_type: LogType
  data: Record<string, any>
  message: string
}

interface AutoLoggedItem {
  log_type: LogType
  id: string
  message: string
}

export function SimpleChatClient() {
  const router = useRouter()
  const [text, setText] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Conversation history
  const [showHistory, setShowHistory] = useState(false)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [isLoadingConversations, setIsLoadingConversations] = useState(false)

  // Auto-log preference
  const [autoLogEnabled, setAutoLogEnabled] = useState(false)
  const [isTogglingAutoLog, setIsTogglingAutoLog] = useState(false)

  // Meal logging state
  const [pendingLogs, setPendingLogs] = useState<PendingLog[]>([])
  const [showLogModal, setShowLogModal] = useState(false)
  const [currentUserMessageId, setCurrentUserMessageId] = useState<string | null>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load conversations and auto-log preference on mount
  useEffect(() => {
    loadConversations()
    loadAutoLogPreference()
  }, [])

  async function loadConversations() {
    try {
      setIsLoadingConversations(true)
      const response = await getConversations({ limit: 50 })
      setConversations(response.conversations)
    } catch (error) {
      console.error('[SimpleChatClient] Failed to load conversations:', error)
      toast({
        title: 'Failed to load conversations',
        description: 'Unable to load your chat history. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoadingConversations(false)
    }
  }

  async function loadConversation(convId: string) {
    try {
      setIsLoading(true)
      const response = await getConversationMessages(convId)

      // Convert UnifiedMessage to our Message format
      const loadedMessages: Message[] = response.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at),
      }))

      setMessages(loadedMessages)
      setConversationId(convId)
      setShowHistory(false)
      toast({
        title: 'Conversation loaded',
        description: `${loadedMessages.length} messages restored`
      })
    } catch (error) {
      console.error('[SimpleChatClient] Failed to load conversation:', error)
      toast({
        title: 'Failed to load conversation',
        description: 'Unable to load this conversation. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  function startNewConversation() {
    setMessages([])
    setConversationId(null)
    setShowHistory(false)
  }

  async function loadAutoLogPreference() {
    try {
      const { auto_log_enabled } = await getAutoLogPreference()
      setAutoLogEnabled(auto_log_enabled)
    } catch (error) {
      console.error('[SimpleChatClient] Failed to load auto-log preference:', error)
      // Default to false on error (safer option)
      setAutoLogEnabled(false)
      // Don't show toast for this - it's not critical and happens on load
    }
  }

  async function toggleAutoLog() {
    const newValue = !autoLogEnabled
    try {
      setIsTogglingAutoLog(true)
      await updateAutoLogPreference(newValue)
      setAutoLogEnabled(newValue)
      toast({
        title: `Auto-log ${newValue ? 'enabled' : 'disabled'}`,
        description: newValue
          ? 'Meals and activities will be logged automatically'
          : 'You will need to manually confirm before logging'
      })
    } catch (error) {
      console.error('[SimpleChatClient] Failed to toggle auto-log:', error)
      toast({
        title: 'Failed to update preference',
        description: 'Unable to change auto-log setting. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsTogglingAutoLog(false)
    }
  }

  async function handleConfirmLog(pendingLog: PendingLog) {
    if (!conversationId || !currentUserMessageId) {
      toast({
        title: 'Error',
        description: 'Missing conversation context. Please try again.',
        variant: 'destructive'
      })
      return
    }

    try {
      await confirmLog({
        conversation_id: conversationId,
        user_message_id: currentUserMessageId,
        log_type: pendingLog.log_type,
        log_data: pendingLog.data
      })

      toast({
        title: 'Logged successfully!',
        description: pendingLog.message,
        action: (
          <button
            onClick={() => {
              router.refresh()
              router.push('/nutrition')
            }}
            className="px-3 py-1 bg-iron-orange text-white text-sm rounded hover:bg-orange-600 transition-colors"
          >
            View
          </button>
        ),
      })

      // Close modal and clear pending logs
      setShowLogModal(false)
      setPendingLogs([])
      setCurrentUserMessageId(null)
    } catch (error) {
      console.error('[SimpleChatClient] Failed to confirm log:', error)
      toast({
        title: 'Failed to save log',
        description: 'Unable to save the log. Please try again.',
        variant: 'destructive'
      })
    }
  }

  async function handleCancelLog() {
    if (!conversationId || !currentUserMessageId) {
      setShowLogModal(false)
      setPendingLogs([])
      return
    }

    try {
      await cancelLog({
        conversation_id: conversationId,
        user_message_id: currentUserMessageId
      })

      // Close modal and clear pending logs
      setShowLogModal(false)
      setPendingLogs([])
      setCurrentUserMessageId(null)
    } catch (error) {
      console.error('[SimpleChatClient] Failed to cancel log:', error)
      // Still close modal even if API call fails
      setShowLogModal(false)
      setPendingLogs([])
      setCurrentUserMessageId(null)
    }
  }

  async function handleLogMeal(messageId: string, foodData: FoodDetectedType) {
    if (!conversationId) {
      toast({
        title: 'Error',
        description: 'Missing conversation context. Please try again.',
        variant: 'destructive'
      })
      return
    }

    // Mark meal as logging
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? { ...msg, food_logged: true }
          : msg
      )
    )

    try {
      // Convert FoodDetected to meal log format
      const mealLogData = {
        category: foodData.meal_type || 'meal',
        logged_at: new Date().toISOString(),
        total_calories: foodData.nutrition.calories,
        total_protein_g: foodData.nutrition.protein_g,
        total_carbs_g: foodData.nutrition.carbs_g,
        total_fat_g: foodData.nutrition.fats_g,
        foods: foodData.food_items.map((item) => ({
          name: item.name,
          quantity: item.quantity || 1,
          unit: item.portion || 'serving',
          calories: item.calories,
          protein_g: item.protein_g,
          carbs_g: item.carbs_g,
          fats_g: item.fats_g
        })),
        notes: foodData.description || undefined
      }

      await confirmLog({
        conversation_id: conversationId,
        user_message_id: messageId,
        log_type: 'meal',
        log_data: mealLogData
      })

      toast({
        title: 'Meal logged successfully!',
        description: `${Math.round(foodData.nutrition.calories)} calories, ${Math.round(foodData.nutrition.protein_g)}g protein`,
        action: (
          <button
            onClick={() => {
              router.refresh()
              router.push('/nutrition')
            }}
            className="px-3 py-1 bg-iron-orange text-white text-sm rounded hover:bg-orange-600 transition-colors"
          >
            View
          </button>
        ),
      })
    } catch (error) {
      console.error('[SimpleChatClient] Failed to log meal:', error)

      // Revert logged state
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? { ...msg, food_logged: false }
            : msg
        )
      )

      toast({
        title: 'Failed to log meal',
        description: 'Unable to save the meal. Please try again.',
        variant: 'destructive'
      })
    }
  }

  function handleAction(action: SuggestedActionType) {
    switch (action.action) {
      case 'log_meal':
        router.push('/nutrition/log')
        break
      case 'log_workout':
        router.push('/activities/log')
        break
      case 'scan_photo':
        router.push('/meal-scan')
        break
      case 'set_reminder':
        toast({
          title: 'Coming soon!',
          description: 'Reminder feature will be available in a future update.'
        })
        break
      case 'view_progress':
        router.push('/analytics')
        break
      default:
        console.warn('[SimpleChatClient] Unknown action:', action.action)
    }
  }

  // Image upload handler
  function handleImageSelected(file: File) {
    // TODO: Upload image and process with AI
    // For now, show a coming soon message
    toast({
      title: 'Image selected',
      description: `${file.name} - Processing will be available soon!`
    })
    console.log('Image selected:', file.name, file.size, file.type)
  }

  function handleVoiceTranscript(transcript: string) {
    // Auto-fill the text input with transcribed text
    setText(transcript)
    toast({
      title: 'Voice transcribed',
      description: 'Your message has been transcribed. Review and send!'
    })
  }

  function handleVoiceError(error: string) {
    toast({
      title: 'Voice input failed',
      description: error,
      variant: 'destructive'
    })
  }

  function handleProgressClick() {
    router.push('/analytics')
  }

  const handleSubmit = async () => {
    if (!text.trim() || isLoading) {
      return
    }

    const userMessageContent = text

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessageContent,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])

    // Clear input
    setText('')
    setIsLoading(true)

    // Create placeholder AI message for streaming
    const aiMessageId = `ai-${Date.now()}`
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }
    setMessages(prev => [...prev, aiMessage])

    try {
      // Call real backend API with streaming
      const stream = sendMessageStreaming({
        message: userMessageContent,
        conversation_id: conversationId,
      })

      let fullResponse = ''
      let newConversationId = conversationId
      let receivedPendingLogs: PendingLog[] = []
      let receivedAutoLogged: AutoLoggedItem[] = []
      let receivedFoodDetected: FoodDetectedType | undefined = undefined
      let receivedActions: SuggestedActionType[] = []

      for await (const chunk of stream) {
        if (chunk.conversation_id && !newConversationId) {
          newConversationId = chunk.conversation_id
          setConversationId(chunk.conversation_id)
          // Reload conversations list to show new conversation
          loadConversations()
        }

        if (chunk.message) {
          fullResponse += chunk.message

          // Update streaming message
          setMessages(prev =>
            prev.map(msg =>
              msg.id === aiMessageId
                ? { ...msg, content: fullResponse }
                : msg
            )
          )
        }

        // Check for food detection data (from image or text analysis)
        if (chunk.food_detected && chunk.food_detected.is_food) {
          receivedFoodDetected = chunk.food_detected as FoodDetectedType

          // Update message with food_detected
          setMessages(prev =>
            prev.map(msg =>
              msg.id === aiMessageId
                ? { ...msg, food_detected: receivedFoodDetected }
                : msg
            )
          )
        }

        // Check for suggested actions
        if (chunk.suggested_actions && chunk.suggested_actions.length > 0) {
          receivedActions = chunk.suggested_actions as SuggestedActionType[]

          // Update message with suggested_actions
          setMessages(prev =>
            prev.map(msg =>
              msg.id === aiMessageId
                ? { ...msg, suggested_actions: receivedActions }
                : msg
            )
          )
        }

        // Check for pending logs (needs user confirmation)
        if (chunk.pending_logs && chunk.pending_logs.length > 0) {
          receivedPendingLogs = chunk.pending_logs
        }

        // Check for auto-logged items (already saved)
        if (chunk.auto_logged && chunk.auto_logged.length > 0) {
          receivedAutoLogged = chunk.auto_logged
        }
      }

      // After streaming completes, handle logs
      if (receivedPendingLogs.length > 0) {
        setPendingLogs(receivedPendingLogs)
        setCurrentUserMessageId(userMessage.id)
        setShowLogModal(true)
      }

      if (receivedAutoLogged.length > 0) {
        // Show success toast for auto-logged items
        const mealCount = receivedAutoLogged.filter(item => item.log_type === 'meal').length
        const workoutCount = receivedAutoLogged.filter(item => item.log_type === 'workout').length
        const activityCount = receivedAutoLogged.filter(item => item.log_type === 'activity').length

        // Show toast notification
        toast({
          title: 'Logged successfully!',
          description: `${mealCount > 0 ? `${mealCount} meal(s)` : ''} ${workoutCount > 0 ? `${workoutCount} workout(s)` : ''} ${activityCount > 0 ? `${activityCount} activity(s)` : ''}`.trim() + ' - Redirecting to nutrition page...',
        })

        // AUTOMATIC REDIRECT after 1 second
        setTimeout(() => {
          router.refresh()
          router.push('/nutrition/log')
        }, 1000)
      }

      // Mark streaming as complete
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, isStreaming: false }
            : msg
        )
      )

    } catch (error) {
      console.error('[SimpleChatClient] Error calling API:', error)

      // Update message with error
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? {
                ...msg,
                content: `I'm having trouble responding right now. Please try again in a moment.`,
                isStreaming: false
              }
            : msg
        )
      )

      toast({
        title: 'Failed to send message',
        description: 'Unable to reach the coach. Please check your connection and try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-iron-black">
      {/* Conversation History Sidebar */}
      {showHistory && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowHistory(false)}
          />

          {/* Sidebar */}
          <div className="fixed left-0 top-0 bottom-0 w-80 bg-zinc-900 border-r-2 border-iron-gray z-50 overflow-y-auto">
            <div className="p-4 border-b border-iron-gray">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-iron-white font-bold text-lg">Conversations</h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-iron-gray hover:text-iron-white"
                  aria-label="Close history"
                >
                  ✕
                </button>
              </div>

              <button
                onClick={startNewConversation}
                className="w-full bg-iron-orange hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </button>
            </div>

            <div className="p-2">
              {isLoadingConversations ? (
                <div className="text-center py-8 text-iron-gray">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Loading conversations...</p>
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 text-iron-gray">
                  <p className="text-sm">No conversations yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => loadConversation(conv.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        conversationId === conv.id
                          ? 'bg-iron-orange/20 border border-iron-orange'
                          : 'hover:bg-zinc-800'
                      }`}
                      aria-label={`Load conversation: ${conv.title || 'Untitled Chat'}, ${conv.message_count} messages, last message ${new Date(conv.last_message_at).toLocaleDateString()}`}
                      aria-current={conversationId === conv.id ? 'true' : 'false'}
                    >
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-iron-gray mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-iron-white text-sm font-medium truncate">
                            {conv.title || 'Untitled Chat'}
                          </p>
                          <p className="text-iron-gray text-xs mt-1 truncate">
                            {conv.last_message_preview || `${conv.message_count} messages`}
                          </p>
                          <p className="text-iron-gray text-xs mt-1">
                            {new Date(conv.last_message_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 h-screen">
        {/* Header */}
        <header className="bg-zinc-900 border-b-2 border-iron-orange p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-iron-orange font-black text-2xl tracking-tight">
                WAGNER COACH
              </h1>
              <p className="text-iron-gray text-sm mt-1">
                Your AI fitness & nutrition coach
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Auto-log toggle */}
              <button
                onClick={toggleAutoLog}
                disabled={isTogglingAutoLog}
                className={`p-2 rounded-lg transition-colors ${
                  autoLogEnabled
                    ? 'bg-iron-orange/20 text-iron-orange hover:bg-iron-orange/30'
                    : 'hover:bg-zinc-800 text-iron-gray'
                }`}
                aria-label={`Auto-log ${autoLogEnabled ? 'enabled' : 'disabled'}. Click to ${autoLogEnabled ? 'disable' : 'enable'}`}
                title={`Auto-log ${autoLogEnabled ? 'enabled' : 'disabled'}`}
              >
                {isTogglingAutoLog ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Zap className="w-6 h-6" />
                )}
              </button>

              {/* Conversation history toggle */}
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                aria-label="Toggle conversation history"
              >
                <MessageSquare className="w-6 h-6 text-iron-orange" />
              </button>
            </div>
          </div>
        </header>

      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 pb-40"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto mt-12">
            <div className="text-center text-iron-gray mb-8">
              <p className="text-lg font-medium text-iron-white">{getTimeBasedGreeting()}!</p>
              <p className="text-sm mt-2">What would you like to do today?</p>
            </div>

            {/* Smart Suggestions */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-iron-gray uppercase tracking-wide px-2 mb-3">Quick Actions</h3>
              <ActionButtons
                actions={generateSmartSuggestions()}
                onAction={handleAction}
              />
            </div>

            {/* Example Prompts */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-iron-gray uppercase tracking-wide px-2">Or try these examples:</h3>

              <div className="grid gap-3">
                {/* Meal Logging Examples */}
                <button
                  onClick={() => setText("I had 6oz chicken breast, 1 cup brown rice, and steamed broccoli for lunch")}
                  className="text-left bg-zinc-900 hover:bg-zinc-800 border border-iron-gray/30 hover:border-iron-orange/50 rounded-lg p-4 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">🍽️</span>
                    <div>
                      <p className="text-sm text-iron-white font-medium group-hover:text-iron-orange transition-colors">
                        Log a meal
                      </p>
                      <p className="text-xs text-iron-gray mt-1">
                        "I had 6oz chicken breast, 1 cup brown rice, and steamed broccoli for lunch"
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setText("Breakfast: 3 eggs, 2 slices whole wheat toast, and a banana")}
                  className="text-left bg-zinc-900 hover:bg-zinc-800 border border-iron-gray/30 hover:border-iron-orange/50 rounded-lg p-4 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">🥗</span>
                    <div>
                      <p className="text-sm text-iron-white font-medium group-hover:text-iron-orange transition-colors">
                        Quick breakfast log
                      </p>
                      <p className="text-xs text-iron-gray mt-1">
                        "Breakfast: 3 eggs, 2 slices whole wheat toast, and a banana"
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setText("What should I eat post-workout to maximize muscle recovery?")}
                  className="text-left bg-zinc-900 hover:bg-zinc-800 border border-iron-gray/30 hover:border-iron-orange/50 rounded-lg p-4 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">💪</span>
                    <div>
                      <p className="text-sm text-iron-white font-medium group-hover:text-iron-orange transition-colors">
                        Nutrition advice
                      </p>
                      <p className="text-xs text-iron-gray mt-1">
                        "What should I eat post-workout to maximize muscle recovery?"
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setText("Create a training program for me to build strength 3x per week")}
                  className="text-left bg-zinc-900 hover:bg-zinc-800 border border-iron-gray/30 hover:border-iron-orange/50 rounded-lg p-4 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">🏋️</span>
                    <div>
                      <p className="text-sm text-iron-white font-medium group-hover:text-iron-orange transition-colors">
                        Training program
                      </p>
                      <p className="text-xs text-iron-gray mt-1">
                        "Create a training program for me to build strength 3x per week"
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} group`}
                role="article"
                aria-label={`${message.role === 'user' ? 'Your message' : 'Coach response'} at ${message.timestamp.toLocaleTimeString()}`}
              >
                <div className={`max-w-[80%] space-y-3 ${message.role === 'assistant' ? 'w-full' : ''}`}>
                  {/* Text message bubble */}
                  <div
                    className={`rounded-lg px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-iron-orange text-iron-black'
                        : 'bg-zinc-800 text-iron-white border border-iron-gray'
                    }`}
                  >
                    {message.isStreaming && !message.content ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm text-iron-gray">Thinking...</span>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <p className="text-xs opacity-70">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                          <div className="flex items-center gap-2">
                            {message.isStreaming && (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            )}
                            <MessageActions
                              messageContent={message.content}
                              onCopy={() => {
                                toast({
                                  title: 'Copied to clipboard',
                                  description: 'Message copied successfully'
                                })
                              }}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Inline Meal Card - Render if food detected */}
                  {message.food_detected && message.role === 'assistant' && (
                    <InlineMealCard
                      foodDetected={message.food_detected}
                      onLogMeal={(foodData) => handleLogMeal(message.id, foodData)}
                      isLogged={message.food_logged}
                    />
                  )}

                  {/* Action Buttons - Render if suggested actions exist */}
                  {message.suggested_actions && message.role === 'assistant' && (
                    <ActionButtons
                      actions={message.suggested_actions}
                      onAction={handleAction}
                      isLoading={isLoading}
                    />
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area - Fixed at Bottom (above bottom nav) */}
      <div className="fixed bottom-16 left-0 right-0 bg-zinc-900 border-t-2 border-iron-orange p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 items-end">
            {/* Camera Button - Opens camera on mobile, file picker on desktop */}
            <CameraButton
              onImageSelected={handleImageSelected}
              disabled={isLoading}
            />

            {/* Voice Recorder */}
            <VoiceRecorder
              onTranscript={handleVoiceTranscript}
              onError={handleVoiceError}
            />

            {/* Text Input */}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              placeholder="Type a message..."
              disabled={isLoading}
              className="flex-1 bg-zinc-800 text-iron-white placeholder-iron-gray/60 border-2 border-iron-gray focus:border-iron-orange outline-none rounded-lg px-4 py-3 resize-none min-h-[56px] max-h-[200px] disabled:opacity-50"
              rows={1}
              aria-label="Chat message input"
              aria-describedby="send-hint"
            />

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              onTouchStart={() => {}}
              onTouchEnd={() => {}}
              disabled={!text.trim() || isLoading}
              className="min-w-[56px] min-h-[56px] bg-iron-orange hover:bg-orange-600 active:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-colors"
              style={{
                cursor: 'pointer',
                touchAction: 'manipulation',
                userSelect: 'none',
                WebkitTapHighlightColor: 'transparent'
              }}
              aria-label={isLoading ? 'Sending message' : 'Send message'}
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Screen reader hint */}
          <span id="send-hint" className="sr-only">
            Press Enter to send, Shift+Enter for new line
          </span>
        </div>
      </div>
      </div>

      {/* Pending Log Confirmation Modal */}
      {showLogModal && pendingLogs.length > 0 && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-zinc-900 border-2 border-iron-orange max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b-2 border-iron-gray">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-heading text-iron-orange uppercase">
                    Confirm Log
                  </h2>
                  <p className="text-sm text-iron-gray mt-1">
                    Review and confirm before saving
                  </p>
                </div>
                <button
                  onClick={handleCancelLog}
                  className="p-2 hover:bg-iron-gray/30 transition-colors rounded-xl"
                  aria-label="Close modal"
                >
                  <span className="text-iron-white text-2xl">✕</span>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {pendingLogs.map((log, index) => (
                <div key={index} className="bg-zinc-800 border border-iron-gray rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">
                      {log.log_type === 'meal' ? '🍽️' : log.log_type === 'workout' ? '💪' : '🏃'}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-iron-white capitalize">{log.log_type}</h3>
                      <p className="text-sm text-iron-gray">{log.message}</p>
                    </div>
                  </div>

                  {/* Display log data - Formatted Card */}
                  {log.log_type === 'meal' ? (
                    <div className="bg-zinc-900 rounded-lg p-4 space-y-3">
                      {/* Meal Type & Time */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-iron-white capitalize">
                          {log.data.category || 'Meal'}
                        </span>
                        {log.data.logged_at && (
                          <span className="text-xs text-iron-gray">
                            {new Date(log.data.logged_at).toLocaleTimeString()}
                          </span>
                        )}
                      </div>

                      {/* Foods List */}
                      {log.data.foods && log.data.foods.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-iron-gray font-medium">Foods:</p>
                          {log.data.foods.map((food: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span className="text-iron-white">
                                {food.name || 'Unknown food'}
                                {food.brand && <span className="text-iron-gray text-xs ml-1">({food.brand})</span>}
                              </span>
                              <span className="text-iron-gray text-xs">
                                {food.serving_quantity || food.quantity || 1} {food.serving_unit || food.unit || 'serving'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Nutrition Totals */}
                      {(log.data.total_calories || log.data.total_protein_g || log.data.total_carbs_g || log.data.total_fat_g) && (
                        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-iron-gray/30">
                          {log.data.total_calories && (
                            <div className="text-center">
                              <p className="text-xs text-iron-gray">Cal</p>
                              <p className="text-sm font-semibold text-iron-white">{Math.round(log.data.total_calories)}</p>
                            </div>
                          )}
                          {log.data.total_protein_g && (
                            <div className="text-center">
                              <p className="text-xs text-iron-gray">Protein</p>
                              <p className="text-sm font-semibold text-iron-white">{Math.round(log.data.total_protein_g)}g</p>
                            </div>
                          )}
                          {log.data.total_carbs_g && (
                            <div className="text-center">
                              <p className="text-xs text-iron-gray">Carbs</p>
                              <p className="text-sm font-semibold text-iron-white">{Math.round(log.data.total_carbs_g)}g</p>
                            </div>
                          )}
                          {log.data.total_fat_g && (
                            <div className="text-center">
                              <p className="text-xs text-iron-gray">Fat</p>
                              <p className="text-sm font-semibold text-iron-white">{Math.round(log.data.total_fat_g)}g</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Notes */}
                      {log.data.notes && (
                        <div className="pt-2 border-t border-iron-gray/30">
                          <p className="text-xs text-iron-gray">Notes:</p>
                          <p className="text-sm text-iron-white mt-1">{log.data.notes}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-zinc-900 rounded-lg p-3">
                      <pre className="text-xs text-iron-gray overflow-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => handleConfirmLog(log)}
                      className="flex-1 bg-iron-orange text-white py-3 px-4 rounded-xl font-bold hover:bg-orange-600 transition-all uppercase tracking-wide shadow-xl"
                    >
                      Confirm & Save
                    </button>
                    <button
                      onClick={handleCancelLog}
                      className="flex-1 bg-zinc-700 text-iron-white py-3 px-4 rounded-xl font-bold hover:bg-zinc-600 transition-colors uppercase tracking-wide"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  )
}
