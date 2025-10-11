/**
 * Dashboard API Client
 *
 * Client-side functions for interacting with the adaptive dashboard API.
 */

import { createClient } from '@/lib/supabase/client'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

/**
 * Get authenticated headers with JWT token from Supabase.
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('No active session')
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  }
}

/**
 * Dashboard context types matching backend response.
 */
export interface UserContext {
  hasCompletedConsultation: boolean
  hasActiveProgram: boolean
  streakDays: number
  tracksWeight: boolean
  showsWeightCard: boolean
  showsRecoveryCard: boolean
  showsWorkoutCard: boolean
}

export interface ProgramContext {
  dayNumber: number
  adherenceLast3Days: number
  weekNumber: number
  programName: string
}

export interface EventContext {
  name: string
  date: string
  daysUntil: number
}

export interface EventsContext {
  primaryEvent?: EventContext
}

export interface DashboardContext {
  user: UserContext
  program?: ProgramContext
  events?: EventsContext
}

/**
 * Fetch dashboard context from backend API.
 *
 * @returns Complete dashboard context for rendering
 * @throws Error if request fails
 */
export async function fetchDashboardContext(): Promise<DashboardContext> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/context`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard context: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Log behavior signal for adaptive learning.
 *
 * @param signalType Type of behavior signal
 * @param signalValue Signal value (e.g., card name)
 * @param metadata Additional metadata
 */
export async function logBehaviorSignal(
  signalType: 'dashboard_open' | 'card_interaction' | 'card_dismissal' | 'setting_change',
  signalValue: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/behavior`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      signal_type: signalType,
      signal_value: signalValue,
      metadata,
    }),
  })

  if (!response.ok) {
    console.error('Failed to log behavior signal:', response.statusText)
    // Don't throw - behavior logging is non-critical
  }
}

/**
 * Log app open event.
 *
 * @param source Source of app open (optional)
 * @param timeOfDay Time of day (morning, afternoon, evening, night)
 */
export async function logAppOpen(
  source?: string,
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
): Promise<void> {
  const headers = await getAuthHeaders()

  // Determine time of day if not provided
  const hour = new Date().getHours()
  const calculatedTimeOfDay =
    timeOfDay ||
    (hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night')

  const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/app-open`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      source,
      time_of_day: calculatedTimeOfDay,
    }),
  })

  if (!response.ok) {
    console.error('Failed to log app open:', response.statusText)
    // Don't throw - app open logging is non-critical
  }
}

/**
 * Update dashboard preference.
 *
 * @param preference Dashboard variant (simple, balanced, detailed)
 */
export async function updateDashboardPreference(
  preference: 'simple' | 'balanced' | 'detailed'
): Promise<void> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/preference`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ preference }),
  })

  if (!response.ok) {
    throw new Error(`Failed to update dashboard preference: ${response.statusText}`)
  }
}

/**
 * Daily adherence data point
 */
export interface DailyAdherence {
  day: string
  percent: number
}

/**
 * Weekly analytics response
 */
export interface WeeklyAnalytics {
  adherencePercent: number
  averageCalories: number
  targetCalories: number
  mealsLogged: number
  workoutsCompleted: number
  dailyAdherence: DailyAdherence[]
}

/**
 * Get weekly analytics data
 */
export async function fetchWeeklyAnalytics(): Promise<WeeklyAnalytics> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/analytics/weekly`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch weekly analytics: ${response.statusText}`)
  }

  return response.json()
}
