"use client"

import { Copy, RotateCw, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface MessageActionsProps {
  messageContent: string
  onCopy?: () => void
  onRetry?: () => void
  canRetry?: boolean
}

/**
 * MessageActions - Quick action buttons for chat messages
 *
 * Provides contextual actions:
 * - Copy message text to clipboard
 * - Retry failed messages
 *
 * Appears on hover/focus for clean UI
 */
export function MessageActions({
  messageContent,
  onCopy,
  onRetry,
  canRetry = false
}: MessageActionsProps) {
  const [isCopied, setIsCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(messageContent)
      setIsCopied(true)
      if (onCopy) onCopy()

      // Reset after 2 seconds
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      {/* Copy Button */}
      <Button
        type="button"
        onClick={handleCopy}
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-iron-gray hover:text-iron-white hover:bg-iron-gray/20"
        aria-label="Copy message"
        title="Copy message"
      >
        {isCopied ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </Button>

      {/* Retry Button (for failed messages) */}
      {canRetry && onRetry && (
        <Button
          type="button"
          onClick={onRetry}
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-iron-gray hover:text-iron-orange hover:bg-iron-orange/20"
          aria-label="Retry message"
          title="Retry message"
        >
          <RotateCw className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}
