/**
 * Next Action Card
 *
 * Shows the SINGLE next action for Simple persona users.
 * Priority 2 - High priority for Simple users who want "just tell me what to do"
 *
 * Displays:
 * - Next meal or workout with time
 * - One-tap log button with pre-filled data
 * - Time until action (e.g., "in 45 minutes")
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Dumbbell, UtensilsCrossed } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface NextAction {
  type: 'meal' | 'workout' | 'rest'
  time: string // HH:MM format
  title: string
  minutesUntil: number
  prefillData?: {
    mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    workoutName?: string
  }
}

interface NextActionCardProps {
  action?: NextAction
}

// Default next action if none provided
const DEFAULT_ACTION: NextAction = {
  type: 'meal',
  time: '12:00',
  title: 'Lunch',
  minutesUntil: 90,
  prefillData: {
    mealType: 'lunch'
  }
}

export function NextActionCard({ action = DEFAULT_ACTION }: NextActionCardProps) {
  const router = useRouter()

  const handleLogAction = () => {
    if (action.type === 'meal') {
      // Navigate to quick entry with pre-filled meal type
      const mealType = action.prefillData?.mealType || 'snack'
      router.push(`/quick-entry-optimized?meal_type=${mealType}`)
    } else if (action.type === 'workout') {
      // Navigate to workout logging
      router.push('/activities/log')
    }
  }

  const getTimeUntilText = (minutes: number): string => {
    if (minutes < 0) {
      return 'Now'
    } else if (minutes === 0) {
      return 'Right now'
    } else if (minutes < 60) {
      return `in ${minutes} min`
    } else {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      if (mins === 0) {
        return `in ${hours}h`
      }
      return `in ${hours}h ${mins}m`
    }
  }

  const getActionIcon = () => {
    switch (action.type) {
      case 'meal':
        return <UtensilsCrossed className="w-8 h-8 text-iron-orange" aria-hidden="true" />
      case 'workout':
        return <Dumbbell className="w-8 h-8 text-iron-orange" aria-hidden="true" />
      case 'rest':
        return <Clock className="w-8 h-8 text-iron-orange" aria-hidden="true" />
    }
  }

  const getActionLabel = () => {
    switch (action.type) {
      case 'meal':
        return 'Log Meal'
      case 'workout':
        return 'Log Workout'
      case 'rest':
        return 'View Details'
    }
  }

  const isPast = action.minutesUntil < 0
  const isNow = action.minutesUntil >= -15 && action.minutesUntil <= 15 // 15 min window

  return (
    <Card className="bg-gradient-to-br from-iron-gray to-iron-black border-iron-orange shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-lg">Next Up</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action Details */}
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="bg-iron-orange/20 p-3 rounded-xl flex-shrink-0">
            {getActionIcon()}
          </div>

          {/* Text */}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1">
              {action.title}
            </h3>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-gray-400" aria-hidden="true" />
              <span className="text-gray-300">{action.time}</span>
              <span className="text-iron-orange font-medium">
                {getTimeUntilText(action.minutesUntil)}
              </span>
            </div>
          </div>
        </div>

        {/* Log Button */}
        <Button
          onClick={handleLogAction}
          className={`w-full h-14 font-bold text-base transition-all ${
            isNow
              ? 'bg-iron-orange hover:bg-orange-600 text-white animate-pulse'
              : 'bg-white hover:bg-gray-100 text-iron-black'
          }`}
          aria-label={`${getActionLabel()} for ${action.title}`}
        >
          {getActionLabel()}
        </Button>

        {/* Status Message */}
        {isNow && (
          <div className="flex items-center justify-center gap-2 text-sm">
            <div className="w-2 h-2 bg-iron-orange rounded-full animate-pulse" aria-hidden="true" />
            <span className="text-iron-orange font-medium">
              It's time!
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
