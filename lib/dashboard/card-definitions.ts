/**
 * Dashboard Card Definitions
 *
 * Defines all dashboard cards with their priorities, visibility rules,
 * and conditional logic for the adaptive dashboard system.
 */

import type {
  DashboardCard,
  DashboardContext,
  CardType,
  DashboardVariant
} from '@/lib/types/dashboard'

// Import card components (will be created)
import { ConsultationBannerCard } from '@/components/dashboard/cards/ConsultationBannerCard'
import { NextActionCard } from '@/components/dashboard/cards/NextActionCard'
import { TodaysPlanCard } from '@/components/dashboard/cards/TodaysPlanCard'
import { QuickActionsCard } from '@/components/dashboard/cards/QuickActionsCard'
import { EventCountdownCard } from '@/components/dashboard/cards/EventCountdownCard'
import { WeightTrackingCard } from '@/components/dashboard/cards/WeightTrackingCard'
import { NutritionCard } from '@/components/dashboard/cards/NutritionCard'
import { MacroDetailsCard } from '@/components/dashboard/cards/MacroDetailsCard'
import { StreakCard } from '@/components/dashboard/cards/StreakCard'
import { ActivitySummaryCard } from '@/components/dashboard/cards/ActivitySummaryCard'
import { RecoveryMetricsCard } from '@/components/dashboard/cards/RecoveryMetricsCard'
import { CoachInsightCard } from '@/components/dashboard/cards/CoachInsightCard'
import { WeeklyTrendsCard } from '@/components/dashboard/cards/WeeklyTrendsCard'

/**
 * All dashboard cards with priority and visibility rules
 *
 * Priority: 0 = highest (shown first)
 * Lower numbers = higher priority
 */
export const CARD_DEFINITIONS: DashboardCard[] = [
  // ============================================================================
  // TIER 0: Absolute Priority (0-1)
  // ============================================================================

  {
    id: 'consultation_banner',
    type: 'consultation_banner',
    priority: 0,
    visibility: 'conditional',
    personas: ['simple', 'balanced', 'detailed'],
    condition: (ctx: DashboardContext) => !ctx.user.hasCompletedConsultation,
    component: ConsultationBannerCard
  },

  {
    id: 'consultation_review',
    type: 'consultation_review',
    priority: 0,
    visibility: 'conditional',
    personas: ['simple', 'balanced', 'detailed'],
    condition: (ctx: DashboardContext) => {
      return ctx.program?.dayNumber === 13
    },
    component: ConsultationBannerCard // Reuse with different props
  },

  // ============================================================================
  // TIER 1: Core Experience (2-5)
  // ============================================================================

  {
    id: 'next_action',
    type: 'next_action',
    priority: 2,
    visibility: 'conditional',
    personas: ['simple'],
    condition: (ctx: DashboardContext) => {
      return ctx.user.hasActiveProgram && !!ctx.nextAction
    },
    component: NextActionCard
  },

  {
    id: 'todays_plan_preview',
    type: 'todays_plan_preview',
    priority: 2,
    visibility: 'conditional',
    personas: ['balanced'],
    condition: (ctx: DashboardContext) => ctx.user.hasActiveProgram,
    component: TodaysPlanCard
  },

  {
    id: 'todays_plan_detailed',
    type: 'todays_plan_detailed',
    priority: 2,
    visibility: 'conditional',
    personas: ['detailed'],
    condition: (ctx: DashboardContext) => ctx.user.hasActiveProgram,
    component: TodaysPlanCard
  },

  {
    id: 'quick_actions',
    type: 'quick_actions',
    priority: 3,
    visibility: 'always',
    personas: ['simple', 'balanced', 'detailed'],
    component: QuickActionsCard
  },

  // ============================================================================
  // TIER 2: Conditional High Priority (6-10)
  // ============================================================================

  {
    id: 'event_countdown',
    type: 'event_countdown',
    priority: 6,
    visibility: 'conditional',
    personas: ['simple', 'balanced', 'detailed'],
    condition: (ctx: DashboardContext) => {
      const event = ctx.events?.primaryEvent
      return !!event && event.daysUntil <= 30
    },
    component: EventCountdownCard
  },

  {
    id: 'event_countdown_urgent',
    type: 'event_countdown',
    priority: 1, // Bumped to top when urgent
    visibility: 'conditional',
    personas: ['simple', 'balanced', 'detailed'],
    condition: (ctx: DashboardContext) => {
      const event = ctx.events?.primaryEvent
      return !!event && event.daysUntil <= 7
    },
    component: EventCountdownCard
  },

  {
    id: 'weight_tracking_simple',
    type: 'weight_tracking',
    priority: 7,
    visibility: 'conditional',
    personas: ['simple', 'balanced'],
    condition: (ctx: DashboardContext) => {
      return ctx.user.showsWeightCard && ctx.behavior.weightLogsLast14Days >= 2
    },
    component: WeightTrackingCard
  },

  {
    id: 'weight_tracking_detailed',
    type: 'weight_tracking',
    priority: 4, // Higher priority for detailed users
    visibility: 'conditional',
    personas: ['detailed'],
    condition: (ctx: DashboardContext) => {
      // Show if ANY weight logs (detailed users want data)
      return ctx.behavior.weightLogsLast14Days >= 1
    },
    component: WeightTrackingCard
  },

  // ============================================================================
  // TIER 3: Standard Display (11-15)
  // ============================================================================

  {
    id: 'nutrition_simple',
    type: 'nutrition_simple',
    priority: 11,
    visibility: 'always',
    personas: ['simple'],
    component: NutritionCard
  },

  {
    id: 'nutrition_balanced',
    type: 'nutrition_balanced',
    priority: 8,
    visibility: 'always',
    personas: ['balanced'],
    component: NutritionCard
  },

  {
    id: 'nutrition_detailed',
    type: 'nutrition_detailed',
    priority: 7,
    visibility: 'always',
    personas: ['detailed'],
    component: NutritionCard
  },

  {
    id: 'macro_details_collapsed',
    type: 'macro_details',
    priority: 15,
    visibility: 'always',
    personas: ['simple'],
    component: MacroDetailsCard // Will be collapsed accordion
  },

  {
    id: 'streak_card',
    type: 'streak',
    priority: 12,
    visibility: 'conditional',
    personas: ['simple', 'balanced'],
    condition: (ctx: DashboardContext) => ctx.user.streakDays >= 3,
    component: StreakCard
  },

  // ============================================================================
  // TIER 4: Secondary Info (16-20)
  // ============================================================================

  {
    id: 'activity_summary',
    type: 'activity_summary',
    priority: 16,
    visibility: 'conditional',
    personas: ['balanced', 'detailed'],
    condition: (ctx: DashboardContext) => {
      return ctx.today.activities > 0 || ctx.user.tracksWeight
    },
    component: ActivitySummaryCard
  },

  {
    id: 'recovery_metrics',
    type: 'recovery_metrics',
    priority: 18,
    visibility: 'conditional',
    personas: ['balanced', 'detailed'],
    condition: (ctx: DashboardContext) => {
      return ctx.user.showsRecoveryCard && ctx.behavior.recoveryLogsLast7Days >= 3
    },
    component: RecoveryMetricsCard
  },

  {
    id: 'coach_insight',
    type: 'coach_insight',
    priority: 5, // High priority when triggered
    visibility: 'conditional',
    personas: ['simple', 'balanced', 'detailed'],
    condition: (ctx: DashboardContext) => {
      // Show if struggling OR milestone
      const struggling = ctx.program && ctx.program.adherenceLast3Days < 60
      const milestone = ctx.user.streakDays % 7 === 0 && ctx.user.streakDays > 0
      return struggling || milestone
    },
    component: CoachInsightCard
  },

  // ============================================================================
  // TIER 5: Analytics (21-25)
  // ============================================================================

  {
    id: 'weekly_trends',
    type: 'weekly_trends',
    priority: 21,
    visibility: 'always',
    personas: ['detailed'],
    component: WeeklyTrendsCard
  },

  {
    id: 'weekly_summary',
    type: 'weekly_summary',
    priority: 24,
    visibility: 'conditional',
    personas: ['balanced'],
    condition: (ctx: DashboardContext) => {
      // Show on weekends or evening
      const isWeekend = ctx.time.now.getDay() >= 5
      const isEvening = ctx.time.hour >= 19
      return isWeekend || isEvening
    },
    component: WeeklyTrendsCard // Same component, different variant
  }
]

/**
 * Get visible cards for a user based on their persona and context
 *
 * @param persona - User's dashboard variant
 * @param context - Current dashboard context
 * @returns Array of cards to display, sorted by priority
 */
export function getVisibleCards(
  persona: DashboardVariant,
  context: DashboardContext
): DashboardCard[] {
  return CARD_DEFINITIONS
    // Filter by persona
    .filter(card => card.personas.includes(persona))
    // Filter by visibility rules
    .filter(card => {
      if (card.visibility === 'always') return true
      if (card.visibility === 'hidden') return false
      if (card.visibility === 'conditional' && card.condition) {
        return card.condition(context)
      }
      return true
    })
    // Sort by priority (lower number = higher priority)
    .sort((a, b) => a.priority - b.priority)
}

/**
 * Get card by ID
 *
 * @param cardId - Card identifier
 * @returns Dashboard card or undefined
 */
export function getCardById(cardId: string): DashboardCard | undefined {
  return CARD_DEFINITIONS.find(card => card.id === cardId)
}

/**
 * Get cards by type
 *
 * @param cardType - Card type
 * @returns Array of cards matching type
 */
export function getCardsByType(cardType: CardType): DashboardCard[] {
  return CARD_DEFINITIONS.filter(card => card.type === cardType)
}

/**
 * Check if a specific card should be visible
 *
 * @param cardId - Card identifier
 * @param persona - User's dashboard variant
 * @param context - Current dashboard context
 * @returns True if card should be visible
 */
export function shouldShowCard(
  cardId: string,
  persona: DashboardVariant,
  context: DashboardContext
): boolean {
  const card = getCardById(cardId)
  if (!card) return false

  // Check persona
  if (!card.personas.includes(persona)) return false

  // Check visibility
  if (card.visibility === 'always') return true
  if (card.visibility === 'hidden') return false
  if (card.visibility === 'conditional' && card.condition) {
    return card.condition(context)
  }

  return true
}

/**
 * Get highest priority card that should be visible
 *
 * @param persona - User's dashboard variant
 * @param context - Current dashboard context
 * @returns Highest priority visible card or undefined
 */
export function getTopPriorityCard(
  persona: DashboardVariant,
  context: DashboardContext
): DashboardCard | undefined {
  const visibleCards = getVisibleCards(persona, context)
  return visibleCards[0] // Already sorted by priority
}
