/**
 * Event Countdown Card
 *
 * Shows countdown to user's primary event (competition, race, etc.)
 * Priority: 6 (normal), 1 (urgent when <=7 days)
 *
 * Conditional: Only shows if user has an event within 30 days
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, Target } from 'lucide-react'
import Link from 'next/link'

interface Event {
  id: string
  name: string
  date: string // ISO date string
  daysUntil: number
  location?: string
  type?: string // 'race' | 'competition' | 'game' | 'other'
}

interface EventCountdownCardProps {
  event?: Event
}

// Default event for demo
const DEFAULT_EVENT: Event = {
  id: '1',
  name: 'Half Marathon',
  date: '2025-11-15',
  daysUntil: 21,
  location: 'Central Park, NYC',
  type: 'race'
}

export function EventCountdownCard({ event = DEFAULT_EVENT }: EventCountdownCardProps) {
  const isUrgent = event.daysUntil <= 7
  const isThisWeek = event.daysUntil <= 7 && event.daysUntil > 0
  const isToday = event.daysUntil === 0
  const isPast = event.daysUntil < 0

  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDaysText = (days: number): string => {
    if (days === 0) return 'Today!'
    if (days === 1) return '1 day'
    if (days < 0) return 'Past'
    return `${days} days`
  }

  const getUrgencyColor = () => {
    if (isToday) return 'from-red-600 to-red-700'
    if (isUrgent) return 'from-orange-600 to-orange-700'
    return 'from-blue-600 to-blue-700'
  }

  const getEventIcon = () => {
    if (isToday) return <Target className="w-6 h-6 text-white animate-pulse" aria-hidden="true" />
    return <Calendar className="w-6 h-6 text-white" aria-hidden="true" />
  }

  if (isPast) {
    return null // Don't show past events
  }

  return (
    <Card className={`bg-gradient-to-br ${getUrgencyColor()} border-none shadow-lg`}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="bg-white/20 p-2 rounded-lg flex-shrink-0">
            {getEventIcon()}
          </div>
          <div className="flex-1">
            <CardTitle className="text-white text-lg mb-1">
              {event.name}
            </CardTitle>
            {event.location && (
              <div className="flex items-center gap-1 text-white/80 text-xs">
                <MapPin className="w-3 h-3" aria-hidden="true" />
                <span>{event.location}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Countdown Display */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
          <div className="text-5xl font-bold text-white mb-1">
            {isToday ? '🎯' : event.daysUntil}
          </div>
          <div className="text-white/90 text-sm font-medium">
            {getDaysText(event.daysUntil)}
          </div>
          <div className="text-white/70 text-xs mt-2">
            {formatDate(event.date)}
          </div>
        </div>

        {/* Urgency Messages */}
        {isToday && (
          <div className="bg-white/20 rounded-lg p-3 text-center">
            <p className="text-white font-semibold text-sm mb-1">
              It's game day! 🔥
            </p>
            <p className="text-white/80 text-xs">
              Trust your training. You've got this!
            </p>
          </div>
        )}

        {isThisWeek && !isToday && (
          <div className="bg-white/20 rounded-lg p-3 text-center">
            <p className="text-white font-semibold text-sm mb-1">
              Final prep week 💪
            </p>
            <p className="text-white/80 text-xs">
              Focus on rest, hydration, and staying consistent
            </p>
          </div>
        )}

        {/* Action Button */}
        <Link href="/events">
          <Button
            className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold backdrop-blur-sm border border-white/20 transition-all"
            aria-label="View event details and preparation checklist"
          >
            <Clock className="w-4 h-4 mr-2" aria-hidden="true" />
            View Event Details
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
