/**
 * Streak Card
 *
 * Shows user's current streak with motivational message.
 * Priority: 12
 *
 * Conditional: Only shows if streak >= 3 days
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Flame, Trophy, Zap } from 'lucide-react'

interface StreakCardProps {
  streakDays: number
}

export function StreakCard({ streakDays = 0 }: StreakCardProps) {
  // Don't render if streak < 3
  if (streakDays < 3) {
    return null
  }

  const getMotivationalMessage = (days: number): string => {
    if (days >= 30) return "Legendary consistency! 🏆"
    if (days >= 21) return "You've built a habit! 💪"
    if (days >= 14) return "Two weeks strong! Keep it up!"
    if (days >= 7) return "One week streak! You're on fire!"
    return "Great start! Keep the momentum going!"
  }

  const getStreakIcon = (days: number) => {
    if (days >= 30) return <Trophy className="w-12 h-12 text-yellow-500" aria-hidden="true" />
    if (days >= 7) return <Flame className="w-12 h-12 text-orange-500 animate-pulse" aria-hidden="true" />
    return <Zap className="w-12 h-12 text-iron-orange" aria-hidden="true" />
  }

  const getBackgroundGradient = (days: number): string => {
    if (days >= 30) return 'from-yellow-600 to-orange-600'
    if (days >= 14) return 'from-orange-600 to-red-600'
    if (days >= 7) return 'from-iron-orange to-orange-600'
    return 'from-blue-600 to-blue-700'
  }

  return (
    <Card className={`bg-gradient-to-br ${getBackgroundGradient(streakDays)} border-none shadow-lg overflow-hidden relative`}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-20 translate-y-20" />
      </div>

      <CardContent className="relative pt-6 pb-6">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            {getStreakIcon(streakDays)}
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-5xl font-bold text-white">
                {streakDays}
              </span>
              <span className="text-xl font-semibold text-white/90">
                {streakDays === 1 ? 'day' : 'days'}
              </span>
            </div>
            <p className="text-white/90 font-medium text-base">
              {getMotivationalMessage(streakDays)}
            </p>
          </div>
        </div>

        {/* Progress to next milestone */}
        {streakDays < 30 && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center justify-between text-white/80 text-xs mb-2">
              <span>Next milestone</span>
              <span>
                {streakDays < 7 && `${7 - streakDays} days to 1 week`}
                {streakDays >= 7 && streakDays < 14 && `${14 - streakDays} days to 2 weeks`}
                {streakDays >= 14 && streakDays < 21 && `${21 - streakDays} days to 3 weeks`}
                {streakDays >= 21 && streakDays < 30 && `${30 - streakDays} days to 1 month`}
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    streakDays < 7
                      ? (streakDays / 7) * 100
                      : streakDays < 14
                      ? ((streakDays - 7) / 7) * 100
                      : streakDays < 21
                      ? ((streakDays - 14) / 7) * 100
                      : ((streakDays - 21) / 9) * 100
                  }%`
                }}
                role="progressbar"
                aria-label={`Progress to next milestone`}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
