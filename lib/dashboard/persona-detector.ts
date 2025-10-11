/**
 * Persona Detector
 *
 * Determines the appropriate dashboard variant for a user based on:
 * 1. Explicit preference (from consultation or settings)
 * 2. Consultation answers (inferred from user goals/experience)
 * 3. Default (balanced)
 */

import type { DashboardVariant } from '@/lib/types/dashboard'

// ============================================================================
// Consultation Data Types
// ============================================================================

export interface ConsultationAnswers {
  experience_level?: 'beginner' | 'intermediate' | 'advanced'
  primary_goal?: 'weight_loss' | 'muscle_gain' | 'performance' | 'maintenance'
  desired_engagement?: 'minimal' | 'moderate' | 'detailed'
  tracks_macros?: boolean
  has_coach_experience?: boolean
  tech_comfort?: 'low' | 'medium' | 'high'
}

// ============================================================================
// Detection Functions
// ============================================================================

/**
 * Detect dashboard preference from consultation answers
 *
 * @param answers - User's consultation responses
 * @returns Inferred dashboard variant
 */
export function inferDashboardPreference(
  answers: ConsultationAnswers
): DashboardVariant {
  // Priority 1: Explicit engagement preference
  if (answers.desired_engagement) {
    switch (answers.desired_engagement) {
      case 'minimal':
        return 'simple'
      case 'moderate':
        return 'balanced'
      case 'detailed':
        return 'detailed'
    }
  }

  // Priority 2: Macro tracking behavior
  if (answers.tracks_macros === false) {
    return 'simple' // User explicitly doesn't want to track macros
  }

  if (answers.tracks_macros === true) {
    return 'detailed' // User actively tracks macros
  }

  // Priority 3: Experience level + goal combination
  const experience = answers.experience_level
  const goal = answers.primary_goal

  // Beginners typically want simplicity
  if (experience === 'beginner') {
    if (goal === 'weight_loss') {
      return 'simple' // Most common beginner path
    }
    return 'balanced' // Other beginner goals
  }

  // Advanced users typically want detail
  if (experience === 'advanced') {
    if (goal === 'performance') {
      return 'detailed' // Athletes want all the data
    }
    if (answers.has_coach_experience === true) {
      return 'detailed' // They know what they're looking for
    }
    return 'balanced' // Advanced but not performance-focused
  }

  // Intermediate users get balanced by default
  if (experience === 'intermediate') {
    return 'balanced'
  }

  // Priority 4: Goal-based inference (no experience level)
  if (goal === 'performance') {
    return 'detailed' // Performance users want metrics
  }

  if (goal === 'maintenance') {
    return 'simple' // Casual users want simplicity
  }

  // Priority 5: Tech comfort (fallback)
  if (answers.tech_comfort === 'high') {
    return 'balanced' // Comfortable with tech, but not necessarily detailed
  }

  if (answers.tech_comfort === 'low') {
    return 'simple' // Keep it simple for less tech-savvy users
  }

  // Default: Balanced (safe middle ground)
  return 'balanced'
}

/**
 * Determine dashboard variant based on all available data
 *
 * Priority:
 * 1. Explicit user preference (from settings)
 * 2. Inferred from consultation
 * 3. Default (balanced)
 *
 * @param explicitPreference - User's explicitly set preference
 * @param consultationAnswers - User's consultation responses
 * @returns Final dashboard variant to use
 */
export function determineDashboardVariant(
  explicitPreference?: DashboardVariant | null,
  consultationAnswers?: ConsultationAnswers | null
): DashboardVariant {
  // Priority 1: User explicitly set preference
  if (explicitPreference) {
    return explicitPreference
  }

  // Priority 2: Infer from consultation
  if (consultationAnswers) {
    return inferDashboardPreference(consultationAnswers)
  }

  // Priority 3: Default to balanced
  return 'balanced'
}

/**
 * Get dashboard variant description for user display
 *
 * @param variant - Dashboard variant
 * @returns User-friendly description
 */
export function getDashboardVariantDescription(variant: DashboardVariant): {
  title: string
  description: string
  bestFor: string
} {
  switch (variant) {
    case 'simple':
      return {
        title: 'Simple',
        description: 'Just tell me what to do next. No clutter, no complexity.',
        bestFor: 'Beginners, busy people, or anyone who wants straightforward guidance'
      }

    case 'balanced':
      return {
        title: 'Balanced',
        description: "See today's plan and track your progress with key metrics.",
        bestFor: 'Most users who want a good mix of guidance and data'
      }

    case 'detailed':
      return {
        title: 'Detailed',
        description: 'Full nutrition breakdown, analytics, and performance metrics.',
        bestFor: 'Advanced trackers, athletes, or data enthusiasts'
      }
  }
}

/**
 * Get consultation question for dashboard preference
 *
 * @returns Question configuration for consultation flow
 */
export function getDashboardPreferenceQuestion() {
  return {
    id: 'dashboard_preference',
    question: 'How much detail do you want to see in your dashboard?',
    type: 'single_choice',
    required: false, // Optional - we'll infer if skipped
    options: [
      {
        id: 'simple',
        label: 'Simple',
        description: 'Just my next action and basic progress',
        icon: '🎯'
      },
      {
        id: 'balanced',
        label: 'Balanced',
        description: "Today's plan with key nutrition metrics",
        icon: '⚖️'
      },
      {
        id: 'detailed',
        label: 'Detailed',
        description: 'Full analytics, trends, and all the data',
        icon: '📊'
      }
    ]
  }
}

/**
 * Get persona characteristics based on dashboard variant
 *
 * @param variant - Dashboard variant
 * @returns Expected behavior characteristics
 */
export function getPersonaCharacteristics(variant: DashboardVariant) {
  switch (variant) {
    case 'simple':
      return {
        opensPerDay: 1.5,
        logsProactively: false,
        prefersQuickEntry: true,
        viewsMacros: false,
        usesCoach: 'high',
        needsMotivation: true
      }

    case 'balanced':
      return {
        opensPerDay: 3,
        logsProactively: true,
        prefersQuickEntry: false,
        viewsMacros: true,
        usesCoach: 'moderate',
        needsMotivation: true
      }

    case 'detailed':
      return {
        opensPerDay: 6,
        logsProactively: true,
        prefersQuickEntry: false,
        viewsMacros: true,
        usesCoach: 'low',
        needsMotivation: false
      }
  }
}

/**
 * Check if user's behavior matches their assigned persona
 *
 * Used for adaptation suggestions after 14 days
 *
 * @param variant - Current dashboard variant
 * @param actualBehavior - User's actual behavior metrics
 * @returns Mismatch analysis with suggested variant
 */
export function detectPersonaMismatch(
  variant: DashboardVariant,
  actualBehavior: {
    macroViews: number
    dailyOpensAvg: number
    coachMessages: number
  }
): {
  isMismatch: boolean
  suggestedVariant?: DashboardVariant
  reason?: string
} {
  const expected = getPersonaCharacteristics(variant)

  // User on Simple but acts like Detailed
  if (variant === 'simple') {
    if (actualBehavior.macroViews > 20 && actualBehavior.dailyOpensAvg >= 5) {
      return {
        isMismatch: true,
        suggestedVariant: 'detailed',
        reason: 'You check macros frequently and use the app heavily. Want more detail?'
      }
    }
    if (actualBehavior.macroViews > 10 && actualBehavior.dailyOpensAvg >= 3) {
      return {
        isMismatch: true,
        suggestedVariant: 'balanced',
        reason: 'You seem interested in more data. Try the Balanced view?'
      }
    }
  }

  // User on Balanced but acts like Simple
  if (variant === 'balanced') {
    if (actualBehavior.macroViews === 0 && actualBehavior.coachMessages > 30) {
      return {
        isMismatch: true,
        suggestedVariant: 'simple',
        reason: "You never check macros but use the coach heavily. Simplify your view?"
      }
    }
    if (actualBehavior.macroViews > 30 && actualBehavior.dailyOpensAvg >= 6) {
      return {
        isMismatch: true,
        suggestedVariant: 'detailed',
        reason: "You're a power user! Want full analytics?"
      }
    }
  }

  // User on Detailed but acts like Balanced/Simple
  if (variant === 'detailed') {
    if (actualBehavior.macroViews < 5 && actualBehavior.dailyOpensAvg < 3) {
      return {
        isMismatch: true,
        suggestedVariant: 'balanced',
        reason: "You rarely check the detailed metrics. Simplify your dashboard?"
      }
    }
  }

  return { isMismatch: false }
}
