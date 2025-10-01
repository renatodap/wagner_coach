'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function TrainerChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    // Optimistic UI update
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coach_type: 'trainer',
          message: userMessage.content
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get response')
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || '',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
      
    } catch (err) {
      console.error('Chat error:', err)
      setError(err instanceof Error ? err.message : 'Failed to send message')
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id))
      // Restore the input
      setInput(userMessage.content)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-2xl mx-auto p-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Chat with Coach Alex</h1>
        <p className="text-sm text-gray-600">Your AI fitness trainer</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 border rounded-lg bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p className="text-lg mb-2">Welcome! I'm Coach Alex, your AI trainer.</p>
            <p className="text-sm">Ask me anything about your workouts, form, or training plan!</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`inline-block max-w-[80%] p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                {msg.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="inline-block bg-gray-200 text-gray-900 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask your trainer..."
          className="flex-1 resize-none"
          rows={2}
          disabled={loading}
          maxLength={1000}
        />
        <Button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="px-6"
        >
          {loading ? 'Sending...' : 'Send'}
        </Button>
      </div>
      
      {/* Character count */}
      <div className="text-xs text-gray-500 mt-1 text-right">
        {input.length}/1000
      </div>
    </div>
  )
}
