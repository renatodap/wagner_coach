'use client'

/**
 * ChatInput - Enhanced Text Input for Coach V3
 *
 * Features:
 * - Auto-resizing textarea
 * - Keyboard shortcuts (Enter to send, Shift+Enter for newline)
 * - Character count
 * - Loading state
 * - Quick suggestions
 */

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading: boolean
  placeholder?: string
}

const QUICK_SUGGESTIONS = [
  'I ate chicken and rice for lunch',
  'Log my breakfast',
  'What should I eat today?',
  'How am I doing on my goals?',
  'I just finished a workout'
]

export function ChatInput({
  onSend,
  isLoading,
  placeholder = 'Ask your coach anything...'
}: ChatInputProps) {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [input])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    onSend(trimmed)
    setInput('')
    setShowSuggestions(false)

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    setShowSuggestions(false)
    textareaRef.current?.focus()
  }

  const charCount = input.length
  const maxChars = 1000

  return (
    <div className="space-y-2">
      {/* Quick Suggestions */}
      {showSuggestions && input.length === 0 && (
        <div className="flex flex-wrap gap-2 pb-2">
          {QUICK_SUGGESTIONS.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-lg transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Input Container */}
      <div className="relative flex items-end gap-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-2 backdrop-blur-sm focus-within:border-iron-orange transition-colors">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          disabled={isLoading}
          rows={1}
          maxLength={maxChars}
          className="flex-1 bg-transparent text-white placeholder:text-iron-gray resize-none outline-none min-h-[56px] max-h-[200px] px-2 py-3 disabled:opacity-50"
          style={{ lineHeight: '1.5' }}
        />

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          size="icon"
          className="h-12 w-12 rounded-xl bg-iron-orange hover:bg-orange-600 disabled:bg-zinc-800 disabled:text-zinc-600 flex-shrink-0 transition-all hover:scale-105 active:scale-95"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Character Count */}
      <div className="flex justify-between items-center text-xs text-iron-gray px-2">
        <div className="flex items-center gap-4">
          <span>
            {charCount}/{maxChars}
          </span>
          {charCount > maxChars * 0.9 && (
            <span className="text-yellow-500">
              Approaching character limit
            </span>
          )}
        </div>

        <div className="text-iron-gray/70">
          <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-xs">Enter</kbd> to send •{' '}
          <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-xs">Shift+Enter</kbd> for
          new line
        </div>
      </div>
    </div>
  )
}
