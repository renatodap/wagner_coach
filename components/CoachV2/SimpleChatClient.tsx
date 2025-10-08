'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, MessageSquare, Plus, Zap } from 'lucide-react'
import { sendMessageStreaming, getConversations, getConversationMessages } from '@/lib/api/unified-coach'
import type { SendMessageResponse, ConversationSummary, UnifiedMessage } from '@/lib/api/unified-coach'
import { getAutoLogPreference, updateAutoLogPreference } from '@/lib/api/profile'
import BottomNavigation from '@/app/components/BottomNavigation'
import { validateFile } from '@/lib/utils/file-upload'
import { analyzeImage, formatAnalysisAsText } from '@/lib/services/client-image-analysis'
import { useToast } from '@/hooks/use-toast'
import { Paperclip, X } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

interface AttachedFile {
  file: File
  preview?: string
  type: 'image' | 'audio' | 'pdf' | 'other'
}

export function SimpleChatClient() {
  const [text, setText] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Conversation history
  const [showHistory, setShowHistory] = useState(false)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [isLoadingConversations, setIsLoadingConversations] = useState(false)

  // Auto-log preference
  const [autoLogEnabled, setAutoLogEnabled] = useState(false)
  const [isTogglingAutoLog, setIsTogglingAutoLog] = useState(false)

  // File uploads
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])

  const { toast } = useToast()

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
      console.log('[SimpleChatClient] Loaded conversation:', convId, loadedMessages.length, 'messages')
    } catch (error) {
      console.error('[SimpleChatClient] Failed to load conversation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function startNewConversation() {
    setMessages([])
    setConversationId(null)
    setShowHistory(false)
    console.log('[SimpleChatClient] Started new conversation')
  }

  async function loadAutoLogPreference() {
    try {
      const { auto_log_enabled } = await getAutoLogPreference()
      setAutoLogEnabled(auto_log_enabled)
      console.log('[SimpleChatClient] Auto-log preference loaded:', auto_log_enabled)
    } catch (error) {
      console.error('[SimpleChatClient] Failed to load auto-log preference:', error)
      // Default to false on error
      setAutoLogEnabled(false)
    }
  }

  async function toggleAutoLog() {
    const newValue = !autoLogEnabled
    try {
      setIsTogglingAutoLog(true)
      await updateAutoLogPreference(newValue)
      setAutoLogEnabled(newValue)
      console.log('[SimpleChatClient] Auto-log toggled to:', newValue)
    } catch (error) {
      console.error('[SimpleChatClient] Failed to toggle auto-log:', error)
    } finally {
      setIsTogglingAutoLog(false)
    }
  }

  function handleFileSelect(files: FileList) {
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

      const fileTypeLabel = newFiles[0].type === 'image' ? 'Image' :
                           newFiles[0].type === 'audio' ? 'Audio' :
                           newFiles[0].type === 'pdf' ? 'PDF' : 'File'
      toast({
        title: `📎 ${fileTypeLabel} attached`,
        description: `${newFiles[0].file.name} (${(newFiles[0].file.size / 1024).toFixed(1)} KB)`,
      })
    }
  }

  function removeFile(index: number) {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    console.log('[SimpleChatClient] Submit button clicked!')
    console.log('[SimpleChatClient] Text:', text)

    if (!text.trim() && !attachedFiles.length) {
      console.log('[SimpleChatClient] Skipping - no text or files')
      return
    }

    if (isLoading) {
      console.log('[SimpleChatClient] Skipping - already loading')
      return
    }

    let userMessageContent = text

    // If there's an image, analyze it first
    if (attachedFiles.length > 0 && attachedFiles[0].type === 'image') {
      const imageFile = attachedFiles[0].file

      toast({
        title: '🔍 Analyzing image...',
        description: 'This may take a few seconds',
      })

      try {
        const analysis = await analyzeImage(imageFile, text)
        console.log('[SimpleChatClient] Image analysis result:', analysis)

        const analysisText = formatAnalysisAsText(analysis)
        userMessageContent = analysisText + (text || '')

        toast({
          title: '✅ Image analyzed',
          description: 'Sending to coach...',
        })
      } catch (error) {
        console.error('[SimpleChatClient] Image analysis failed:', error)
        toast({
          title: '⚠️ Image analysis failed',
          description: 'Sending image description instead',
          variant: 'destructive',
        })
        // Continue anyway with text only
      }
    }

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessageContent,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    console.log('[SimpleChatClient] Added user message')

    // Clear input and attached files
    setText('')
    setAttachedFiles([])
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
      console.log('[SimpleChatClient] Calling backend API...')

      const stream = sendMessageStreaming({
        message: userMessageContent,
        conversation_id: conversationId,
      })

      let fullResponse = ''
      let newConversationId = conversationId

      for await (const chunk of stream) {
        console.log('[SimpleChatClient] Received chunk:', chunk)

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
      }

      // Mark streaming as complete
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, isStreaming: false }
            : msg
        )
      )

      console.log('[SimpleChatClient] Streaming complete!')

    } catch (error) {
      console.error('[SimpleChatClient] Error calling API:', error)

      // Update message with error
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? {
                ...msg,
                content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
                isStreaming: false
              }
            : msg
        )
      )
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
                COACH V2 (TEST)
              </h1>
              <p className="text-iron-gray text-sm mt-1">
                Real API + streaming + history
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-40">
        {messages.length === 0 ? (
          <div className="text-center text-iron-gray mt-20">
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm mt-2">Ask your coach anything about fitness & nutrition!</p>
          </div>
        ) : (
          <>
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
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
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                        {message.isStreaming && (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        )}
                      </div>
                    </>
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
                      alt="Attached"
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <Paperclip className="w-5 h-5 text-iron-gray" />
                  )}
                  <span className="text-iron-white text-sm max-w-[150px] truncate">
                    {attached.file.name}
                  </span>
                  <button
                    onClick={() => removeFile(index)}
                    className="ml-2 p-1 hover:bg-zinc-800 rounded"
                    aria-label="Remove file"
                  >
                    <X className="w-4 h-4 text-iron-gray" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 items-end">
            {/* Attach File Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="min-h-[56px] min-w-[56px] p-3 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Attach file"
              title="Attach image, audio, or PDF"
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
              aria-label="File upload input"
            />

            {/* Text Input */}
            <textarea
              value={text}
              onChange={(e) => {
                console.log('[SimpleChatClient] Text changed:', e.target.value)
                setText(e.target.value)
              }}
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
            />

            {/* Submit Button */}
            <button
              type="button"
              onClick={() => {
                console.log('[SimpleChatClient] Button CLICKED!')
                handleSubmit()
              }}
              onTouchStart={() => {
                console.log('[SimpleChatClient] TouchStart detected')
              }}
              onTouchEnd={() => {
                console.log('[SimpleChatClient] TouchEnd detected')
              }}
              disabled={(!text.trim() && !attachedFiles.length) || isLoading}
              className="min-w-[56px] min-h-[56px] bg-iron-orange hover:bg-orange-600 active:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-colors"
              style={{
                cursor: 'pointer',
                touchAction: 'manipulation',
                userSelect: 'none',
                WebkitTapHighlightColor: 'transparent'
              }}
              aria-label="Send message"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Debug Info */}
          <div className="mt-2 text-xs text-iron-gray">
            <p>Debug: {text.length} chars | {isLoading ? 'Loading...' : 'Ready'}</p>
            <p className="text-green-500">✓ Pure React events | ✓ cursor: pointer | ✓ No overlays</p>
          </div>
        </div>
      </div>
      </div>

      <BottomNavigation />
    </div>
  )
}
