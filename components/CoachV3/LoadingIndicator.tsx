'use client'

/**
 * LoadingIndicator - Shows what coach is doing before streaming
 *
 * Displays contextual loading messages so users know coach is working.
 */

import { Loader2 } from 'lucide-react'

interface LoadingIndicatorProps {
  phase?: 'thinking' | 'analyzing' | 'preparing'
}

const LOADING_MESSAGES = {
  thinking: 'Thinking about your question...',
  analyzing: 'Analyzing your profile...',
  preparing: 'Preparing response...'
}

export function LoadingIndicator({ phase = 'thinking' }: LoadingIndicatorProps) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
        <Loader2 className="h-4 w-4 text-iron-orange animate-spin" />
      </div>
      <div className="flex-1 bg-gradient-to-br from-zinc-900/80 to-neutral-900/80 text-iron-white border border-zinc-800 backdrop-blur-sm rounded-2xl px-4 py-3">
        <p className="text-sm text-iron-gray animate-pulse">
          {LOADING_MESSAGES[phase]}
        </p>
      </div>
    </div>
  )
}
