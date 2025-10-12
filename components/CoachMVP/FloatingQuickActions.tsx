"use client"

import { Camera, Mic, PlusCircle, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FloatingQuickActionsProps {
  onCameraClick: () => void
  onMicClick: () => void
  onQuickEntryClick: () => void
  onProgressClick: () => void
  isVisible?: boolean
}

/**
 * FloatingQuickActions - Context-aware quick action bar
 *
 * Floating button bar above input field for instant access to:
 * - Camera (meal scan)
 * - Mic (voice input)
 * - Quick Entry (multimodal logging)
 * - Progress (analytics)
 *
 * Appears above keyboard on mobile, integrated with input on desktop.
 */
export function FloatingQuickActions({
  onCameraClick,
  onMicClick,
  onQuickEntryClick,
  onProgressClick,
  isVisible = true
}: FloatingQuickActionsProps) {
  if (!isVisible) return null

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        onClick={onCameraClick}
        variant="ghost"
        size="icon"
        className="text-iron-gray hover:text-iron-orange hover:bg-iron-orange/10"
        aria-label="Scan meal photo"
        title="Scan meal photo"
      >
        <Camera className="h-5 w-5" />
      </Button>

      <Button
        type="button"
        onClick={onMicClick}
        variant="ghost"
        size="icon"
        className="text-iron-gray hover:text-iron-orange hover:bg-iron-orange/10"
        aria-label="Voice input"
        title="Voice input"
      >
        <Mic className="h-5 w-5" />
      </Button>

      <Button
        type="button"
        onClick={onQuickEntryClick}
        variant="ghost"
        size="icon"
        className="text-iron-gray hover:text-iron-orange hover:bg-iron-orange/10"
        aria-label="Quick entry"
        title="Quick entry"
      >
        <PlusCircle className="h-5 w-5" />
      </Button>

      <Button
        type="button"
        onClick={onProgressClick}
        variant="ghost"
        size="icon"
        className="text-iron-gray hover:text-iron-orange hover:bg-iron-orange/10"
        aria-label="View progress"
        title="View progress"
      >
        <TrendingUp className="h-5 w-5" />
      </Button>
    </div>
  )
}
