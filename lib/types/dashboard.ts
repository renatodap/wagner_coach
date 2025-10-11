/**
 * Dashboard Types
 *
 * Type definitions for the adaptive dashboard system
 */

// ============================================================================
// Dashboard Variants
// ============================================================================

export type DashboardVariant = 'simple' | 'balanced' | 'detailed'

export interface DashboardPreference {
  variant: DashboardVariant
  showsWeightCard: boolean | null // null = auto-detect
  showsRecoveryCard: boolean | null // null = auto-detect
  showsWorkoutCard: boolean
  setAt?: string
}

// ============================================================================
// User Personas
// ============================================================================

export interface UserPersona {
  type: 'beginner_weight_loss' | 'intermediate_balanced' | 'advanced_macro_tracker' | 'athlete_performance' | 'casual_maintenance'
  dashboardVariant: DashboardVariant
  characteristics: {
    opensPerDay: number
    logsProactively: boolean
    tracksWeight: boolean
    tracksRecovery: boolean
    usesCoach: 'high' | 'moderate' | 'low'
  }
}

// ============================================================================
// Dashboard Cards
// ============================================================================

export type CardType =
  | 'consultation_banner'
  | 'consultation_review'
  | 'next_action'
  | 'todays_plan_preview'
  | 'todays_plan_detailed'
  | 'quick_actions'
  | 'event_countdown'
  | 'weight_tracking'
  | 'pre_workout'
  | 'nutrition_simple'
  | 'nutrition_balanced'
  | 'nutrition_detailed'
  | 'macro_details'
  | 'streak'
  | 'activity_summary'
  | 'recovery_metrics'
  | 'coach_insight'
  | 'weekly_trends'
  | 'weekly_summary'

export type CardVisibility = 'always' | 'conditional' | 'hidden'

export interface DashboardCard {
  id: string
  type: CardType
  priority: number // 0 = highest
  visibility: CardVisibility
  personas: DashboardVariant[] // Which variants show this card
  condition?: (context: DashboardContext) => boolean
  component: React.ComponentType<any>
}

// ============================================================================
// Dashboard Context
// ============================================================================

export interface DashboardContext {
  user: {
    id: string
    dashboardPreference: DashboardVariant
    hasCompletedConsultation: boolean
    hasActiveProgram: boolean
    streakDays: number
    tracksWeight: boolean
    tracksRecovery: boolean
    showsWeightCard: boolean
    showsRecoveryCard: boolean
  }

  today: {
    meals: number
    workouts: number
    activities: number
    caloriesLogged: number
  }

  program?: {
    dayNumber: number
    adherenceToday: number
    adherenceLast3Days: number
  }

  events?: {
    primaryEvent?: {
      name: string
      date: string
      daysUntil: number
    }
  }

  behavior: {
    macroViews: number
    weightLogsLast14Days: number
    planInteractions: number
    coachMessages: number
    dailyOpensAvg: number
    recoveryLogsLast7Days: number
  }

  time: {
    now: Date
    hour: number
    isWeekend: boolean
  }

  nextAction?: {
    type: 'meal' | 'workout' | 'rest'
    time: string
    title: string
    minutesUntil: number
  }
}

// ============================================================================
// Behavior Signals
// ============================================================================

export interface BehaviorSignals {
  userId: string
  macroViews: number
  weightLogs: number
  planInteractions: number
  coachMessages: number
  dailyOpensAvg: number
  recoveryLogs: number
  expandedCards: string[]
  trackingStartedAt: string
  lastUpdatedAt: string
  lastAdaptationShownAt?: string
}

export type BehaviorSignalType =
  | 'macro_views'
  | 'weight_logs'
  | 'plan_interactions'
  | 'coach_messages'
  | 'recovery_logs'

// ============================================================================
// Dashboard Adaptations
// ============================================================================

export type AdaptationType =
  | 'dashboard_variant_change'
  | 'card_added'
  | 'card_removed'
  | 'card_priority_changed'
  | 'feature_suggestion'

export interface DashboardAdaptation {
  id: string
  userId: string
  adaptationType: AdaptationType
  oldValue: string
  newValue: string
  reason: string
  triggerData?: Record<string, any>
  userAccepted?: boolean
  userFeedback?: string
  suggestedAt: string
  respondedAt?: string
}

export interface AdaptationSuggestion {
  title: string
  message: string
  adaptation: DashboardAdaptation
  actions: AdaptationAction[]
}

export interface AdaptationAction {
  label: string
  variant: 'primary' | 'secondary' | 'ghost'
  action: () => void | Promise<void>
}

// ============================================================================
// Time Context
// ============================================================================

export interface TimeContext {
  show_before?: string // '30min_before_meal'
  show_after?: string // '1hour_after_workout'
  time_range?: [string, string] // ['6am', '10am']
}

// ============================================================================
// Card Props
// ============================================================================

export interface BaseCardProps {
  context: DashboardContext
  variant?: 'simple' | 'balanced' | 'detailed'
  onAction?: (action: string, data?: any) => void
}

export interface NextActionCardProps extends BaseCardProps {
  nextAction: {
    type: 'meal' | 'workout'
    time: string
    title: string
    description?: string
    calories?: number
    preFillData?: any
  }
}

export interface TodaysPlanCardProps extends BaseCardProps {
  plan: {
    meals: Array<{
      id: string
      time: string
      name: string
      foods: string[]
      calories: number
      protein: number
      logged: boolean
    }>
    workouts: Array<{
      id: string
      time: string
      name: string
      duration: number
      completed: boolean
    }>
  }
}

export interface WeightTrackingCardProps extends BaseCardProps {
  currentWeight?: number
  unit: 'lbs' | 'kg'
  weeklyChange?: number
  history: Array<{
    date: string
    weight: number
  }>
  onLogWeight: () => void
}

export interface StreakCardProps extends BaseCardProps {
  streakDays: number
  message?: string
}

export interface CoachInsightCardProps extends BaseCardProps {
  message: string
  type: 'motivation' | 'adjustment' | 'milestone' | 'warning'
  actions?: Array<{
    label: string
    action: string
  }>
}

// ============================================================================
// API Types
// ============================================================================

export interface UpdateDashboardPreferenceRequest {
  variant?: DashboardVariant
  showsWeightCard?: boolean
  showsRecoveryCard?: boolean
  showsWorkoutCard?: boolean
}

export interface GetDashboardDataResponse {
  preference: DashboardPreference
  context: DashboardContext
  cards: DashboardCard[]
  adaptationSuggestions?: AdaptationSuggestion[]
}

export interface IncrementBehaviorSignalRequest {
  signalType: BehaviorSignalType
  increment?: number
}

export interface RespondToAdaptationRequest {
  adaptationId: string
  accepted: boolean
  feedback?: string
}
