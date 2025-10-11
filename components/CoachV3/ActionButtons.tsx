'use client'

/**
 * ActionButtons - Contextual Action Chips
 *
 * Displays suggested actions below assistant messages.
 */

import { useRouter } from 'next/navigation'
import { UtensilsCrossed, Dumbbell, TrendingUp, Target } from 'lucide-react'
import type { SuggestedAction } from '@/types/coach-v3'

interface ActionButtonsProps {
  actions: SuggestedAction[]
}

export function ActionButtons({ actions }: ActionButtonsProps) {
  const router = useRouter()

  const handleAction = (action: SuggestedAction) => {
    switch (action.action) {
      case 'log_meal':
        router.push('/nutrition')
        break
      case 'log_workout':
        router.push('/workouts')
        break
      case 'view_progress':
        router.push('/analytics')
        break
      case 'set_goal':
        router.push('/settings')
        break
      default:
        console.warn('Unknown action:', action.action)
    }
  }

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'utensils':
        return <UtensilsCrossed className="h-4 w-4" />
      case 'dumbbell':
        return <Dumbbell className="h-4 w-4" />
      case 'trending':
        return <TrendingUp className="h-4 w-4" />
      case 'target':
        return <Target className="h-4 w-4" />
      default:
        return null
    }
  }

  if (actions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => handleAction(action)}
          className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-all hover:scale-[0.98] active:scale-95"
        >
          {getIcon(action.icon)}
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  )
}
