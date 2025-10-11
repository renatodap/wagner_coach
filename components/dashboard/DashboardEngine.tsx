/**
 * Dashboard Engine
 *
 * Orchestrates the adaptive dashboard by:
 * 1. Determining user's persona (simple/balanced/detailed)
 * 2. Getting visible cards based on persona + context
 * 3. Sorting cards by priority
 * 4. Rendering cards with proper data
 *
 * This is the heart of the adaptive dashboard system.
 */

'use client'

import { useEffect, useState } from 'react'
import type { DashboardVariant } from '@/lib/types/dashboard'

// Import all card components
import { ConsultationBannerCard } from './cards/ConsultationBannerCard'
import { NextActionCard } from './cards/NextActionCard'
import { TodaysPlanCard } from './cards/TodaysPlanCard'
import { QuickActionsCard } from './cards/QuickActionsCard'
import { EventCountdownCard } from './cards/EventCountdownCard'
import { WeightTrackingCard } from './cards/WeightTrackingCard'
import { NutritionCard } from './cards/NutritionCard'
import { MacroDetailsCard } from './cards/MacroDetailsCard'
import { StreakCard } from './cards/StreakCard'
import { ActivitySummaryCard } from './cards/ActivitySummaryCard'
import { RecoveryMetricsCard } from './cards/RecoveryMetricsCard'
import { CoachInsightCard } from './cards/CoachInsightCard'
import { WeeklyTrendsCard } from './cards/WeeklyTrendsCard'

interface DashboardEngineProps {
  userId: string
  variant?: DashboardVariant
}

export function DashboardEngine({ userId, variant = 'balanced' }: DashboardEngineProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [context, setContext] = useState<any>(null)

  useEffect(() => {
    loadDashboardContext()
  }, [userId])

  async function loadDashboardContext() {
    try {
      setIsLoading(true)
      // TODO: Fetch dashboard context from API
      // const response = await fetch(`/api/dashboard/context?user_id=${userId}`)
      // const data = await response.json()
      // setContext(data)

      // For now, use mock data
      setContext({
        user: {
          hasCompletedConsultation: false,
          hasActiveProgram: true,
          streakDays: 5,
          tracksWeight: true,
          showsWeightCard: true,
          showsRecoveryCard: false
        },
        program: {
          dayNumber: 5,
          adherenceLast3Days: 85
        },
        events: {
          primaryEvent: {
            name: 'Half Marathon',
            date: '2025-11-15',
            daysUntil: 21
          }
        }
      })
    } catch (error) {
      console.error('Failed to load dashboard context:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (!context) {
    return <DashboardError onRetry={loadDashboardContext} />
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Priority 0: Consultation Banner (if incomplete) */}
      {!context.user.hasCompletedConsultation && (
        <ConsultationBannerCard variant="initial" />
      )}

      {/* Priority 0-1: Day 13 Review (if applicable) */}
      {context.program?.dayNumber === 13 && (
        <ConsultationBannerCard
          variant="day13_review"
          programDayNumber={13}
        />
      )}

      {/* Priority 2: Next Action (Simple only) */}
      {variant === 'simple' && context.user.hasActiveProgram && (
        <NextActionCard />
      )}

      {/* Priority 2: Today's Plan (Balanced/Detailed) */}
      {(variant === 'balanced' || variant === 'detailed') && context.user.hasActiveProgram && (
        <TodaysPlanCard variant={variant} />
      )}

      {/* Priority 3: Quick Actions (All personas) */}
      <QuickActionsCard variant={variant} />

      {/* Priority 1 or 6: Event Countdown (if urgent or within 30 days) */}
      {context.events?.primaryEvent && context.events.primaryEvent.daysUntil <= 30 && (
        <EventCountdownCard event={context.events.primaryEvent} />
      )}

      {/* Priority 5: Coach Insight (conditional) */}
      {context.program && context.program.adherenceLast3Days < 60 && (
        <CoachInsightCard
          insight={{
            type: 'warning',
            title: 'Let\'s get back on track',
            message: 'Your adherence has dipped below 60% this week. Let\'s talk about what\'s challenging you and how we can adjust.',
            action: {
              label: 'Talk to Coach',
              href: '/coach-v2'
            }
          }}
        />
      )}

      {/* Priority 7-8: Nutrition (All personas with variants) */}
      <NutritionCard variant={variant} />

      {/* Priority 4-7: Weight Tracking (conditional) */}
      {context.user.showsWeightCard && (
        <WeightTrackingCard variant={variant} />
      )}

      {/* Priority 12: Streak (conditional >= 3 days) */}
      {context.user.streakDays >= 3 && (
        <StreakCard streakDays={context.user.streakDays} />
      )}

      {/* Priority 15: Macro Details (Simple only, collapsible) */}
      {variant === 'simple' && (
        <MacroDetailsCard />
      )}

      {/* Priority 16: Activity Summary (Balanced/Detailed) */}
      {(variant === 'balanced' || variant === 'detailed') && (
        <ActivitySummaryCard />
      )}

      {/* Priority 18: Recovery Metrics (conditional) */}
      {context.user.showsRecoveryCard && (
        <RecoveryMetricsCard />
      )}

      {/* Priority 21-24: Weekly Trends (Balanced/Detailed) */}
      {(variant === 'balanced' || variant === 'detailed') && (
        <WeeklyTrendsCard variant={variant} />
      )}
    </div>
  )
}

// Loading skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-4 pb-24">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="h-48 bg-iron-gray rounded-lg animate-pulse"
          aria-label="Loading dashboard card"
        />
      ))}
    </div>
  )
}

// Error state
function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white mb-2">
          Unable to load dashboard
        </h2>
        <p className="text-gray-400 text-sm">
          Please check your connection and try again
        </p>
      </div>
      <button
        onClick={onRetry}
        className="px-6 py-3 bg-iron-orange hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
      >
        Retry
      </button>
    </div>
  )
}
