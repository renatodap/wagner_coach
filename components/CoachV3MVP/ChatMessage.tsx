'use client'

/**
 * ChatMessage - Message Bubble for Coach V3
 *
 * Features:
 * - Glass morphism design
 * - Streaming animation with cursor
 * - Message reactions (👍 🤔 💪)
 * - Inline meal cards
 * - Copy to clipboard
 */

import { useState } from 'react'
import { Copy, Check, ThumbsUp, HelpCircle, Dumbbell } from 'lucide-react'
import { format } from 'date-fns'
import type { ChatMessage as ChatMessageType } from '@/types/coach-v3'
import { InlineMealCardV3 } from './InlineMealCardV3'
import { ActionButtons } from './ActionButtons'

interface ChatMessageProps {
  message: ChatMessageType
  onLogMeal?: (messageId: string, foods: any[], mealType: string) => Promise<void>
}

export function ChatMessage({ message, onLogMeal }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const [reaction, setReaction] = useState<'helpful' | 'unclear' | 'motivated' | null>(null)

  const isUser = message.role === 'user'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReaction = (type: 'helpful' | 'unclear' | 'motivated') => {
    setReaction(reaction === type ? null : type)
    // TODO: Send reaction to backend for analytics
  }

  const handleMealLog = async (foods: any[]) => {
    if (!onLogMeal || !message.foodDetected) return

    await onLogMeal(
      message.id,
      foods,
      message.foodDetected.category || 'other'
    )
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[85%] md:max-w-[75%] ${
          isUser
            ? 'bg-gradient-to-br from-iron-orange/90 to-orange-600/90 text-white'
            : 'bg-gradient-to-br from-zinc-900/80 to-neutral-900/80 text-iron-white border border-zinc-800'
        } backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg space-y-3`}
      >
        {/* Message Content */}
        <div className="space-y-2">
          <div className="prose prose-invert prose-sm max-w-none">
            {message.content}
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-white/70 animate-pulse" />
            )}
          </div>

          {/* Timestamp */}
          <div
            className={`text-xs ${
              isUser ? 'text-white/70' : 'text-iron-gray'
            } flex items-center gap-2`}
          >
            <span>{format(message.timestamp, 'h:mm a')}</span>

            {/* Copy button (assistant only) */}
            {!isUser && !message.isStreaming && (
              <button
                onClick={handleCopy}
                className="hover:text-iron-orange transition-colors"
                aria-label="Copy message"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </button>
            )}
          </div>
        </div>

        {/* Inline Meal Card (if food detected) */}
        {message.foodDetected && !isUser && (
          <div className="mt-3">
            <InlineMealCardV3
              foodDetected={message.foodDetected}
              onLogMeal={handleMealLog}
              isLogged={message.foodLogged}
            />
          </div>
        )}

        {/* Action Buttons (if suggested actions) */}
        {message.suggestedActions && !isUser && (
          <div className="mt-3">
            <ActionButtons actions={message.suggestedActions} />
          </div>
        )}

        {/* Message Reactions (assistant only) */}
        {!isUser && !message.isStreaming && (
          <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
            <span className="text-xs text-iron-gray">Was this helpful?</span>

            <button
              onClick={() => handleReaction('helpful')}
              className={`p-1.5 rounded-lg transition-all ${
                reaction === 'helpful'
                  ? 'bg-green-500/20 text-green-400'
                  : 'hover:bg-zinc-800 text-iron-gray hover:text-white'
              }`}
              aria-label="Helpful"
            >
              <ThumbsUp className="h-4 w-4" />
            </button>

            <button
              onClick={() => handleReaction('unclear')}
              className={`p-1.5 rounded-lg transition-all ${
                reaction === 'unclear'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'hover:bg-zinc-800 text-iron-gray hover:text-white'
              }`}
              aria-label="Unclear"
            >
              <HelpCircle className="h-4 w-4" />
            </button>

            <button
              onClick={() => handleReaction('motivated')}
              className={`p-1.5 rounded-lg transition-all ${
                reaction === 'motivated'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'hover:bg-zinc-800 text-iron-gray hover:text-white'
              }`}
              aria-label="Motivated"
            >
              <Dumbbell className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
