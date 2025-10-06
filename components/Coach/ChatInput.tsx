/**
 * Chat Input Component
 *
 * Multimodal input for unified Coach interface.
 * Supports:
 * - Text input (textarea with auto-resize)
 * - Image upload (optional, for meal photos)
 * - Voice recording (optional, Phase 2)
 *
 * Follows 2026 AI SaaS principles:
 * - Minimal friction (large tap targets, clear placeholders)
 * - Progressive disclosure (image/voice buttons appear when needed)
 * - Instant feedback (loading states, character count)
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Image as ImageIcon, Mic, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChatInputProps {
  onSend: (message: string, imageUrls?: string[]) => Promise<void>
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Ask your coach anything, or describe what you ate/did...",
  className = ''
}: ChatInputProps) {
  const [input, setInput] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }, [input])

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  async function handleSend() {
    if (!input.trim() && imageUrls.length === 0) return
    if (isSending) return

    setIsSending(true)

    try {
      await onSend(input.trim(), imageUrls.length > 0 ? imageUrls : undefined)
      // Clear input on success
      setInput('')
      setImageUrls([])
    } catch (error) {
      // Error handled by parent
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
      // Refocus textarea
      textareaRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    // TODO: Upload to Supabase Storage and get URL
    // For Phase 2
    const files = Array.from(e.target.files || [])
    console.log('Image upload:', files)
    // Mock for now
    // setImageUrls([...imageUrls, 'https://example.com/image.jpg'])
  }

  function removeImage(index: number) {
    setImageUrls(imageUrls.filter((_, i) => i !== index))
  }

  const canSend = (input.trim().length > 0 || imageUrls.length > 0) && !isSending && !disabled
  const charCount = input.length
  const isNearLimit = charCount > 450

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Image Previews (if any) */}
      {imageUrls.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {imageUrls.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200"
              />
              <button
                onClick={() => removeImage(index)}
                className="
                  absolute -top-2 -right-2
                  w-5 h-5 rounded-full
                  bg-red-500 text-white
                  flex items-center justify-center
                  opacity-0 group-hover:opacity-100
                  transition-opacity
                "
                type="button"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Container */}
      <div className="flex gap-2 items-end">
        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isSending || disabled}
            rows={1}
            className="
              w-full px-4 py-3
              bg-white border-2 border-gray-200
              rounded-2xl
              text-gray-900 placeholder-gray-400
              focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20
              disabled:opacity-50 disabled:cursor-not-allowed
              resize-none
              transition-all duration-200
            "
            style={{
              minHeight: '48px',
              maxHeight: '120px'
            }}
            aria-label="Message input"
          />

          {/* Character count (subtle, only show near limit) */}
          {isNearLimit && (
            <div className={`
              absolute bottom-2 right-2
              text-xs font-medium
              ${charCount > 500 ? 'text-red-500' : 'text-gray-400'}
            `}>
              {charCount}/500
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Image Upload Button (optional, Phase 2) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            multiple={false}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="
              w-12 h-12 rounded-full
              border-2 border-gray-200
              hover:border-blue-500 hover:bg-blue-50
              transition-colors
              hidden sm:flex
            "
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || disabled}
            title="Upload image (meal photo)"
          >
            <ImageIcon className="w-5 h-5 text-gray-600" />
          </Button>

          {/* Voice Recording Button (optional, Phase 3) */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="
              w-12 h-12 rounded-full
              border-2 border-gray-200
              hover:border-blue-500 hover:bg-blue-50
              transition-colors
              hidden sm:flex
            "
            disabled
            title="Voice input (coming soon)"
          >
            <Mic className="w-5 h-5 text-gray-400" />
          </Button>

          {/* Send Button (primary action) */}
          <Button
            type="button"
            size="icon"
            className={`
              w-12 h-12 rounded-full
              ${canSend
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
              transition-all duration-200
              focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
            `}
            onClick={handleSend}
            disabled={!canSend}
            aria-label="Send message"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Subtle hint about Enter key (progressive disclosure) */}
      {input.length > 10 && !isSending && (
        <p className="text-xs text-gray-500 px-1 animate-in fade-in duration-300">
          💡 Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-gray-700 font-mono text-xs">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-gray-700 font-mono text-xs">Shift + Enter</kbd> for new line
        </p>
      )}
    </div>
  )
}
