"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UtensilsCrossed, Activity, Camera, Bell, TrendingUp, Sparkles } from 'lucide-react'
import type { SuggestedAction } from '@/lib/types'

interface ActionButtonsProps {
  actions: SuggestedAction[]
  onAction: (action: SuggestedAction) => void
  isLoading?: boolean
}

/**
 * ActionButtons - One-tap action buttons below coach messages
 *
 * Shows contextual actions like "Log Meal", "Log Workout", "Scan Photo"
 * Provides instant access to common actions without typing
 */
export function ActionButtons({ actions, onAction, isLoading = false }: ActionButtonsProps) {
  const [clickedId, setClickedId] = useState<string | null>(null)

  const getIcon = (action: string) => {
    switch (action) {
      case 'log_meal':
        return <UtensilsCrossed className="h-4 w-4" />
      case 'log_workout':
        return <Activity className="h-4 w-4" />
      case 'scan_photo':
        return <Camera className="h-4 w-4" />
      case 'set_reminder':
        return <Bell className="h-4 w-4" />
      case 'view_progress':
        return <TrendingUp className="h-4 w-4" />
      default:
        return <Sparkles className="h-4 w-4" />
    }
  }

  const handleAction = (action: SuggestedAction) => {
    setClickedId(action.id)
    onAction(action)
    // Reset after animation
    setTimeout(() => setClickedId(null), 300)
  }

  if (actions.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {actions.map((action) => (
        <Button
          key={action.id}
          onClick={() => handleAction(action)}
          disabled={isLoading}
          variant="outline"
          className={`
            border-iron-gray/30 text-white hover:bg-iron-orange/20 hover:border-iron-orange
            transition-all duration-200
            ${clickedId === action.id ? 'scale-95' : ''}
          `}
          aria-label={action.label}
        >
          {getIcon(action.action)}
          <span className="ml-2 text-sm">{action.label}</span>
        </Button>
      ))}
    </div>
  )
}
