'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function SimpleChatClient() {
  const [text, setText] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = () => {
    console.log('[SimpleChatClient] Submit button clicked!')
    console.log('[SimpleChatClient] Text:', text)
    console.log('[SimpleChatClient] isLoading:', isLoading)

    if (!text.trim() || isLoading) {
      console.log('[SimpleChatClient] Skipping - no text or loading')
      return
    }

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    console.log('[SimpleChatClient] Added user message:', userMessage)

    // Clear input
    setText('')

    // Simulate AI response
    setIsLoading(true)
    setTimeout(() => {
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: `Echo: ${userMessage.content}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
      setIsLoading(false)
      console.log('[SimpleChatClient] Added AI message:', aiMessage)
    }, 1000)
  }

  return (
    <div className="flex flex-col h-screen bg-iron-black">
      {/* Header */}
      <header className="bg-zinc-900 border-b-2 border-iron-orange p-4">
        <h1 className="text-iron-orange font-black text-2xl tracking-tight">
          COACH V2 (TEST)
        </h1>
        <p className="text-iron-gray text-sm mt-1">
          Minimal chat interface - testing mobile buttons
        </p>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 mb-20">
        {messages.length === 0 ? (
          <div className="text-center text-iron-gray mt-20">
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm mt-2">Type something and tap Send to test!</p>
          </div>
        ) : (
          messages.map(message => (
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
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Area - Fixed at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t-2 border-iron-orange p-4 pb-safe">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 items-end">
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
              disabled={!text.trim() || isLoading}
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
  )
}
