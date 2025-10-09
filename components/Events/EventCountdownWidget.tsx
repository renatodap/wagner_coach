'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Calendar, Target, TrendingUp } from 'lucide-react'
import type { EventCountdown } from '@/types/event'
import {
  getEventTypeMetadata,
  getTrainingPhaseMetadata,
  formatEventDate,
  formatCountdown
} from '@/types/event'

interface EventCountdownWidgetProps {
  event: EventCountdown
  size?: 'small' | 'medium' | 'large'
  showActions?: boolean
}

export function EventCountdownWidget({
  event,
  size = 'medium',
  showActions = true
}: EventCountdownWidgetProps) {
  const router = useRouter()
  const eventMeta = getEventTypeMetadata(event.event_type)
  const phaseMeta = getTrainingPhaseMetadata(event.current_training_phase)

  // Calculate total days (from training start to event)
  const totalDays = event.training_phases?.training_start_date
    ? Math.ceil(
        (new Date(event.event_date).getTime() - new Date(event.training_phases.training_start_date).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 112 // Default to 16 weeks

  // Calculate progress percentage
  const progressPercent = Math.max(0, Math.min(100, ((totalDays - event.days_until_event) / totalDays) * 100))

  // Size-dependent styles
  const sizeStyles = {
    small: {
      container: 'p-4',
      title: 'text-base',
      icon: 'text-2xl',
      countdown: 'text-3xl',
      daysLabel: 'text-xs'
    },
    medium: {
      container: 'p-6',
      title: 'text-lg',
      icon: 'text-3xl',
      countdown: 'text-4xl',
      daysLabel: 'text-sm'
    },
    large: {
      container: 'p-8',
      title: 'text-xl',
      icon: 'text-4xl',
      countdown: 'text-5xl',
      daysLabel: 'text-base'
    }
  }

  const styles = sizeStyles[size]

  // Get next phase info
  const getNextPhaseInfo = () => {
    const phases = event.training_phases
    if (!phases) return null

    const now = new Date()
    const phaseTransitions = [
      { name: 'Taper', date: new Date(phases.taper_start), phase: 'taper' },
      { name: 'Peak Phase', date: new Date(phases.peak_phase_start), phase: 'peak' },
      { name: 'Build Phase', date: new Date(phases.build_phase_start), phase: 'build' },
      { name: 'Base Phase', date: new Date(phases.base_phase_start), phase: 'base' }
    ]

    for (const transition of phaseTransitions) {
      if (now < transition.date) {
        const daysUntil = Math.ceil((transition.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return { name: transition.name, daysUntil }
      }
    }

    return null
  }

  const nextPhase = getNextPhaseInfo()

  return (
    <Card className={`bg-gradient-to-br from-iron-black/80 to-neutral-900/80 border-iron-gray/20 ${styles.container}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={styles.icon}>{eventMeta?.icon || '🎯'}</span>
          <div>
            <h3 className={`${styles.title} font-bold text-white`}>
              {event.event_name}
            </h3>
            <p className="text-iron-gray text-sm">{eventMeta?.label || event.event_type}</p>
          </div>
        </div>
        {event.is_primary_goal && (
          <span className="bg-iron-orange/20 text-iron-orange text-xs font-semibold px-2 py-1 rounded">
            PRIMARY
          </span>
        )}
      </div>

      {/* Circular Countdown Display */}
      <div className="flex justify-center my-6">
        <div className="relative">
          {/* Progress Circle */}
          <div className="relative w-32 h-32 sm:w-40 sm:h-40">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${progressPercent * 2.83} 283`}
                className="transition-all duration-500"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff6b35" />
                  <stop offset="100%" stopColor="#f7931e" />
                </linearGradient>
              </defs>
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`${styles.countdown} font-bold text-iron-orange leading-none`}>
                {event.days_until_event}
              </div>
              <div className={`${styles.daysLabel} text-iron-gray uppercase tracking-wide`}>
                {event.days_until_event === 1 ? 'Day' : 'Days'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Date */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 text-white mb-1">
          <Calendar className="w-4 h-4" />
          <span className="font-medium">{formatEventDate(event.event_date)}</span>
        </div>
        <p className="text-iron-gray text-sm">{formatCountdown(event.days_until_event)}</p>
      </div>

      {/* Training Phase */}
      <div className="bg-iron-black/50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-iron-orange" />
            <span className="text-sm font-medium text-white">Current Phase</span>
          </div>
          <span className={`text-sm font-semibold ${phaseMeta.color}`}>
            {phaseMeta.label}
          </span>
        </div>
        <p className="text-xs text-iron-gray">{phaseMeta.description}</p>

        {nextPhase && (
          <div className="mt-3 pt-3 border-t border-iron-gray/20">
            <p className="text-xs text-iron-gray">
              Next: <span className="text-white font-medium">{nextPhase.name}</span> in {nextPhase.daysUntil} day
              {nextPhase.daysUntil !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Goal Performance */}
      {event.goal_performance && (
        <div className="bg-iron-black/50 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-iron-orange" />
            <div>
              <span className="text-xs text-iron-gray">Goal</span>
              <p className="text-sm font-medium text-white">{event.goal_performance}</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 border-iron-gray/30 text-white hover:bg-iron-gray/20"
            onClick={() => router.push(`/events/${event.id}`)}
          >
            View Details
          </Button>
          {!event.linked_program_id && (
            <Button
              className="flex-1 bg-iron-orange hover:bg-iron-orange/90 text-white"
              onClick={() => router.push(`/programs/create?event_id=${event.id}`)}
            >
              Create Program
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}
