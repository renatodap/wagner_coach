'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Target, TrendingUp, ChevronRight } from 'lucide-react'
import type { Event } from '@/types/event'
import {
  getEventTypeMetadata,
  formatEventDate,
  formatCountdown
} from '@/types/event'

interface EventCardProps {
  event: Event
  showPrimaryBadge?: boolean
  onClick?: () => void
}

export function EventCard({ event, showPrimaryBadge = true, onClick }: EventCardProps) {
  const router = useRouter()
  const eventMeta = getEventTypeMetadata(event.event_type)

  // Calculate days until event
  const now = new Date()
  const eventDate = new Date(event.event_date)
  const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      router.push(`/events/${event.id}`)
    }
  }

  return (
    <Card
      className="bg-iron-black/50 backdrop-blur-sm border-iron-gray/20 hover:border-iron-orange/40 transition-all cursor-pointer"
      onClick={handleClick}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-3xl">{eventMeta?.icon || '🎯'}</span>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-base truncate">
                {event.event_name}
              </h3>
              <p className="text-iron-gray text-sm">{eventMeta?.label || event.event_type}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-iron-gray flex-shrink-0" />
        </div>

        {/* Event Date & Countdown */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-iron-orange" />
            <span className="text-white">
              {new Date(event.event_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>

          <div className={`text-sm font-medium ${
            daysUntil <= 7 ? 'text-orange-400' :
            daysUntil <= 30 ? 'text-yellow-400' :
            'text-iron-gray'
          }`}>
            {formatCountdown(daysUntil)}
          </div>
        </div>

        {/* Goal Performance */}
        {event.goal_performance && (
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-iron-orange" />
            <span className="text-sm text-white">Goal: {event.goal_performance}</span>
          </div>
        )}

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {event.is_primary_goal && showPrimaryBadge && (
            <Badge variant="default" className="bg-iron-orange/20 text-iron-orange border-iron-orange/40 text-xs">
              Primary Goal
            </Badge>
          )}

          {event.linked_program_id && (
            <Badge variant="outline" className="border-green-500/40 text-green-400 text-xs">
              Has Program
            </Badge>
          )}

          <Badge variant="outline" className="border-iron-gray/40 text-iron-gray text-xs">
            {eventMeta?.category || 'event'}
          </Badge>
        </div>
      </div>
    </Card>
  )
}
