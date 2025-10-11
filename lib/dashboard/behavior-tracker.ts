/**
 * Behavior Tracker
 *
 * Client-side utility for tracking user behavior signals
 * that inform dashboard adaptations.
 */

import type { BehaviorSignalType } from '@/lib/types/dashboard'
import { createClient } from '@/lib/supabase/client'

// ============================================================================
// Behavior Tracking Functions
// ============================================================================

/**
 * Track a behavior signal (increments counter in database)
 *
 * @param signalType - Type of behavior signal
 * @param increment - Amount to increment (default: 1)
 */
export async function trackBehaviorSignal(
  signalType: BehaviorSignalType,
  increment: number = 1
): Promise<void> {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.access_token) {
      console.warn('No auth token, skipping behavior tracking')
      return
    }

    // Call backend to increment signal
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/dashboard/behavior`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        signal_type: signalType,
        increment
      })
    })
  } catch (error) {
    // Silent fail - behavior tracking is non-critical
    console.warn('Failed to track behavior signal:', error)
  }
}

/**
 * Track macro card expansion
 */
export function trackMacroView(): void {
  trackBehaviorSignal('macro_views')
}

/**
 * Track weight log
 */
export function trackWeightLog(): void {
  trackBehaviorSignal('weight_logs')
}

/**
 * Track plan interaction (clicking on meal/workout)
 */
export function trackPlanInteraction(): void {
  trackBehaviorSignal('plan_interactions')
}

/**
 * Track coach message sent
 */
export function trackCoachMessage(): void {
  trackBehaviorSignal('coach_messages')
}

/**
 * Track recovery log
 */
export function trackRecoveryLog(): void {
  trackBehaviorSignal('recovery_logs')
}

// ============================================================================
// Card Expansion Tracking
// ============================================================================

/**
 * Track when a collapsible card is expanded
 *
 * @param cardId - ID of the card that was expanded
 */
export async function trackCardExpansion(cardId: string): Promise<void> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    // Get current expanded cards
    const { data: signals } = await supabase
      .from('user_behavior_signals')
      .select('expanded_cards')
      .eq('user_id', user.id)
      .single()

    const expandedCards = signals?.expanded_cards || []

    // Add card if not already in list
    if (!expandedCards.includes(cardId)) {
      await supabase
        .from('user_behavior_signals')
        .upsert({
          user_id: user.id,
          expanded_cards: [...expandedCards, cardId],
          last_updated_at: new Date().toISOString()
        })
    }
  } catch (error) {
    console.warn('Failed to track card expansion:', error)
  }
}

// ============================================================================
// App Open Tracking
// ============================================================================

let lastAppOpenTime: number | null = null
const APP_OPEN_THROTTLE_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Track app open (throttled to once per 5 minutes)
 *
 * Called from _app.tsx or layout.tsx on mount
 */
export async function trackAppOpen(): Promise<void> {
  const now = Date.now()

  // Throttle: Only track if more than 5 minutes since last open
  if (lastAppOpenTime && (now - lastAppOpenTime) < APP_OPEN_THROTTLE_MS) {
    return
  }

  lastAppOpenTime = now

  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.access_token) return

    // Log app open event
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/dashboard/app-open`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.warn('Failed to track app open:', error)
  }
}

// ============================================================================
// Behavior Analysis
// ============================================================================

/**
 * Get user's behavior signals from database
 *
 * @returns Behavior signals or null
 */
export async function getBehaviorSignals() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data, error } = await supabase
      .from('user_behavior_signals')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Failed to get behavior signals:', error)
    return null
  }
}

/**
 * Calculate days since tracking started
 *
 * Used to determine if user is eligible for adaptation suggestions (14+ days)
 *
 * @returns Number of days or null
 */
export async function getDaysSinceTrackingStarted(): Promise<number | null> {
  try {
    const signals = await getBehaviorSignals()

    if (!signals?.tracking_started_at) return null

    const startDate = new Date(signals.tracking_started_at)
    const now = new Date()
    const diffMs = now.getTime() - startDate.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    return diffDays
  } catch (error) {
    console.error('Failed to calculate tracking days:', error)
    return null
  }
}

/**
 * Check if user is eligible for adaptation suggestions
 *
 * Requires 14+ days of tracking data
 *
 * @returns True if eligible
 */
export async function isEligibleForAdaptations(): Promise<boolean> {
  const days = await getDaysSinceTrackingStarted()
  return days !== null && days >= 14
}

// ============================================================================
// React Hooks
// ============================================================================

/**
 * Hook to track behavior signals easily in React components
 *
 * Example usage:
 * ```tsx
 * const { trackMacroView, trackPlanInteraction } = useBehaviorTracking()
 *
 * <Button onClick={() => {
 *   trackMacroView()
 *   // ... open macro details
 * }}>
 *   View Macros
 * </Button>
 * ```
 */
export function useBehaviorTracking() {
  return {
    trackMacroView,
    trackWeightLog,
    trackPlanInteraction,
    trackCoachMessage,
    trackRecoveryLog,
    trackCardExpansion,
    trackAppOpen
  }
}

// ============================================================================
// Automatic Tracking Setup
// ============================================================================

/**
 * Initialize behavior tracking
 *
 * Call this once in app initialization (_app.tsx or layout.tsx)
 */
export function initializeBehaviorTracking(): void {
  // Track app open
  trackAppOpen()

  // Set up periodic tracking of daily opens
  if (typeof window !== 'undefined') {
    // Track on visibility change (user returns to tab)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        trackAppOpen()
      }
    })

    // Track on focus (user switches back to window)
    window.addEventListener('focus', () => {
      trackAppOpen()
    })
  }
}
