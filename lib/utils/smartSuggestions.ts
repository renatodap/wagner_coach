import type { SuggestedAction } from '@/lib/types'

/**
 * Generate smart context-aware action suggestions based on time of day
 * and user context.
 *
 * This provides proactive suggestions like:
 * - "Log breakfast" in the morning
 * - "Log workout" in the evening
 * - "View progress" on weekends
 */
export function generateSmartSuggestions(): SuggestedAction[] {
  const now = new Date()
  const hour = now.getHours()
  const dayOfWeek = now.getDay() // 0 = Sunday, 6 = Saturday

  const suggestions: SuggestedAction[] = []

  // Morning (6am - 11am): Breakfast logging
  if (hour >= 6 && hour < 11) {
    suggestions.push({
      id: 'morning-breakfast',
      icon: '🍳',
      label: 'Log Breakfast',
      action: 'log_meal',
      params: { meal_type: 'breakfast' }
    })
  }

  // Lunch time (11am - 2pm): Lunch logging
  if (hour >= 11 && hour < 14) {
    suggestions.push({
      id: 'lunch-time',
      icon: '🥗',
      label: 'Log Lunch',
      action: 'log_meal',
      params: { meal_type: 'lunch' }
    })
  }

  // Dinner time (5pm - 9pm): Dinner logging
  if (hour >= 17 && hour < 21) {
    suggestions.push({
      id: 'dinner-time',
      icon: '🍽️',
      label: 'Log Dinner',
      action: 'log_meal',
      params: { meal_type: 'dinner' }
    })
  }

  // Evening (4pm - 10pm): Workout logging (peak gym time)
  if (hour >= 16 && hour < 22) {
    suggestions.push({
      id: 'evening-workout',
      icon: '💪',
      label: 'Log Workout',
      action: 'log_workout'
    })
  }

  // Weekends: View progress and analytics
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    suggestions.push({
      id: 'weekend-progress',
      icon: '📊',
      label: 'View Progress',
      action: 'view_progress'
    })
  }

  // Always available: Photo scan
  suggestions.push({
    id: 'anytime-photo',
    icon: '📸',
    label: 'Scan Photo',
    action: 'scan_photo'
  })

  // Limit to 3 suggestions max (avoid overwhelming)
  return suggestions.slice(0, 3)
}

/**
 * Get greeting message based on time of day
 */
export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours()

  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}
