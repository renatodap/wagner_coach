'use client'

import { getTrainingPhaseMetadata, type EventCountdown } from '@/types/event'
import { CheckCircle2, Circle } from 'lucide-react'

interface TrainingPhaseTimelineProps {
  event: EventCountdown
}

export function TrainingPhaseTimeline({ event }: TrainingPhaseTimelineProps) {
  if (!event.training_phases) {
    return null
  }

  const { training_phases, current_training_phase } = event

  const phases = [
    { key: 'base', label: 'Base', date: training_phases.base_phase_start },
    { key: 'build', label: 'Build', date: training_phases.build_phase_start },
    { key: 'peak', label: 'Peak', date: training_phases.peak_phase_start },
    { key: 'taper', label: 'Taper', date: training_phases.taper_start },
    { key: 'event_day', label: 'Event Day', date: training_phases.event_day }
  ]

  const currentPhaseIndex = phases.findIndex(p => p.key === current_training_phase)

  return (
    <div className="bg-iron-black/50 rounded-lg p-6">
      <h3 className="text-white font-semibold mb-6">Training Phase Timeline</h3>

      <div className="space-y-6">
        {phases.map((phase, index) => {
          const phaseMeta = getTrainingPhaseMetadata(phase.key as any)
          const isActive = phase.key === current_training_phase
          const isCompleted = index < currentPhaseIndex
          const isFuture = index > currentPhaseIndex

          return (
            <div key={phase.key} className="relative">
              {/* Connecting line */}
              {index < phases.length - 1 && (
                <div
                  className={`absolute left-4 top-12 bottom-[-24px] w-0.5 ${
                    isCompleted ? 'bg-iron-orange' : 'bg-iron-gray/20'
                  }`}
                />
              )}

              {/* Phase item */}
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="relative z-10">
                  {isCompleted ? (
                    <CheckCircle2 className="w-8 h-8 text-iron-orange" />
                  ) : isActive ? (
                    <div className="w-8 h-8 rounded-full bg-iron-orange flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-white animate-pulse" />
                    </div>
                  ) : (
                    <Circle className="w-8 h-8 text-iron-gray/40" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-2">
                  <div className="flex items-center justify-between mb-1">
                    <h4
                      className={`font-semibold ${
                        isActive ? 'text-iron-orange' : isCompleted ? 'text-white' : 'text-iron-gray'
                      }`}
                    >
                      {phase.label}
                    </h4>
                    <span
                      className={`text-sm ${
                        isActive || isCompleted ? 'text-white' : 'text-iron-gray'
                      }`}
                    >
                      {new Date(phase.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  <p className={`text-sm ${isActive ? 'text-white' : 'text-iron-gray'}`}>
                    {phaseMeta.description}
                  </p>

                  {isActive && (
                    <div className="mt-2 inline-block bg-iron-orange/20 text-iron-orange text-xs font-semibold px-3 py-1 rounded-full">
                      Current Phase
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Training Start Date */}
      <div className="mt-6 pt-6 border-t border-iron-gray/20">
        <div className="flex items-center justify-between text-sm">
          <span className="text-iron-gray">Training Started</span>
          <span className="text-white font-medium">
            {new Date(training_phases.training_start_date).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>
      </div>
    </div>
  )
}
