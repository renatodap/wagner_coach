/**
 * Profile API Client
 *
 * Handles all API calls related to user profile management.
 */

import { createClient } from '@/lib/supabase/client'
import { authenticatedFetch } from './auth'

// =====================================================
// Types
// =====================================================

export interface UserProfile {
  id: string
  full_name?: string
  goal?: string
  auto_log_enabled: boolean
  timezone?: string
  created_at: string
  updated_at: string
}

export interface AutoLogPreference {
  auto_log_enabled: boolean
}

// Full profile from backend /api/v1/users/me
export interface FullUserProfile {
  // Basic info
  id: string
  email: string
  full_name?: string
  created_at?: string
  updated_at?: string

  // Onboarding status
  onboarding_completed: boolean
  onboarding_completed_at?: string

  // Physical stats
  age?: number
  biological_sex?: 'male' | 'female'
  height_cm?: number
  current_weight_kg?: number
  goal_weight_kg?: number

  // Goals & Training
  primary_goal?: 'lose_weight' | 'build_muscle' | 'maintain' | 'improve_performance'
  experience_level?: 'beginner' | 'intermediate' | 'advanced'
  activity_level?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active'
  workout_frequency?: number

  // Dietary
  dietary_preference?: 'none' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo'
  food_allergies?: string[]
  foods_to_avoid?: string[]
  meals_per_day?: number
  cooks_regularly?: boolean

  // Lifestyle
  sleep_hours?: number
  stress_level?: 'low' | 'medium' | 'high'

  // Macro targets
  estimated_tdee?: number
  daily_calorie_goal?: number
  daily_protein_goal?: number
  daily_carbs_goal?: number
  daily_fat_goal?: number
  macros_last_calculated_at?: string

  // Preferences
  unit_system?: 'metric' | 'imperial'
  timezone?: string

  // Consultation
  consultation_completed?: boolean
  consultation_completed_at?: string
}

export interface UpdateProfileData {
  full_name?: string
  age?: number
  height_cm?: number
  current_weight_kg?: number
  goal_weight_kg?: number
  primary_goal?: 'lose_weight' | 'build_muscle' | 'maintain' | 'improve_performance'
  experience_level?: 'beginner' | 'intermediate' | 'advanced'
  activity_level?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active'
  workout_frequency?: number
  dietary_preference?: 'none' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo'
  food_allergies?: string[]
  foods_to_avoid?: string[]
  meals_per_day?: number
  cooks_regularly?: boolean
  sleep_hours?: number
  stress_level?: 'low' | 'medium' | 'high'
  unit_system?: 'metric' | 'imperial'
  timezone?: string
}

// =====================================================
// Profile Functions
// =====================================================

/**
 * Get user's auto-log preference
 *
 * @deprecated This function uses direct Supabase access. Consider migrating to backend API pattern.
 * Direct Supabase access should be used only for simple preferences like this.
 * For complex profile operations, use getFullUserProfile() instead.
 *
 * @returns {Promise<AutoLogPreference>} The auto-log preference
 * @throws {Error} If user is not authenticated or query fails
 */
export async function getAutoLogPreference(): Promise<AutoLogPreference> {
  const supabase = createClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  // Fetch profile - gracefully handle missing column
  const { data, error } = await supabase
    .from('profiles')
    .select('auto_log_enabled')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('[getAutoLogPreference] Database error:', error)
    throw new Error(`Failed to fetch auto-log preference: ${error.message}`)
  }

  return {
    auto_log_enabled: data?.auto_log_enabled ?? false
  }
}

/**
 * Update user's auto-log preference
 *
 * @deprecated This function uses direct Supabase access. Consider migrating to backend API pattern.
 * Direct Supabase access should be used only for simple preferences like this.
 * For complex profile updates, use updateFullUserProfile() instead.
 *
 * @param {boolean} enabled - Whether to enable auto-logging
 * @returns {Promise<void>}
 * @throws {Error} If user is not authenticated or update fails
 */
export async function updateAutoLogPreference(enabled: boolean): Promise<void> {
  const supabase = createClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  // Update profile
  const { error } = await supabase
    .from('profiles')
    .update({ auto_log_enabled: enabled })
    .eq('id', user.id)

  if (error) {
    console.error('[updateAutoLogPreference] Database error:', error)
    throw new Error(`Failed to update auto-log preference: ${error.message}`)
  }
}

/**
 * Get full user profile
 *
 * @deprecated Use getFullUserProfile() instead. This function uses direct Supabase access
 * and returns a limited UserProfile type. The new backend API provides a complete profile
 * with 40+ fields including onboarding data, macro targets, and consultation status.
 *
 * Migration: Replace getUserProfile() with getFullUserProfile()
 * Returns: FullUserProfile (comprehensive) vs UserProfile (basic fields only)
 *
 * @returns {Promise<UserProfile>} The user's profile
 * @throws {Error} If user is not authenticated or query fails
 */
export async function getUserProfile(): Promise<UserProfile> {
  const supabase = createClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  // Fetch profile
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('[getUserProfile] Database error:', error)
    throw new Error('Failed to fetch user profile')
  }

  return {
    id: data.id,
    full_name: data.full_name,
    goal: data.goal,
    auto_log_enabled: data.auto_log_enabled ?? false,
    timezone: data.timezone ?? 'UTC',
    created_at: data.created_at,
    updated_at: data.updated_at
  }
}

/**
 * Update user's timezone preference
 *
 * @deprecated Use updateFullUserProfile({ timezone }) instead. This function uses direct Supabase access
 * and doesn't provide the benefits of the backend API (validation, structured logging, error handling).
 * The new backend API ensures consistency and better error messages.
 *
 * Migration:
 * OLD: await updateUserTimezone('America/New_York')
 * NEW: await updateFullUserProfile({ timezone: 'America/New_York' })
 *
 * @param {string} timezone - IANA timezone identifier (e.g., "America/New_York")
 * @returns {Promise<void>}
 * @throws {Error} If user is not authenticated or update fails
 */
export async function updateUserTimezone(timezone: string): Promise<void> {
  const supabase = createClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  // Update profile
  const { error } = await supabase
    .from('profiles')
    .update({ timezone })
    .eq('id', user.id)

  if (error) {
    console.error('[updateUserTimezone] Database error:', error)
    throw new Error('Failed to update timezone')
  }

  console.log(`[updateUserTimezone] Updated timezone to: ${timezone}`)
}

// =====================================================
// Backend API Functions (uses /api/v1/users/me)
// =====================================================

/**
 * Get current user's full profile from backend API
 * Uses /api/v1/users/me endpoint with authentication
 *
 * @returns {Promise<FullUserProfile>} Complete user profile with all onboarding data
 * @throws {Error} If not authenticated or fetch fails
 */
export async function getFullUserProfile(): Promise<FullUserProfile> {
  const response = await authenticatedFetch('/api/v1/users/me', {
    method: 'GET',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to fetch profile' }))
    throw new Error(error.detail || 'Failed to fetch profile')
  }

  return await response.json()
}

/**
 * Update current user's profile via backend API
 * Uses PATCH /api/v1/users/me endpoint with authentication
 * Automatically recalculates macros if physical stats change
 *
 * @param {UpdateProfileData} data - Profile fields to update
 * @returns {Promise<FullUserProfile>} Updated profile with recalculated macros if applicable
 * @throws {Error} If not authenticated or update fails
 */
export async function updateFullUserProfile(data: UpdateProfileData): Promise<FullUserProfile> {
  // Build form data for PATCH request
  const formData = new URLSearchParams()
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        // For arrays like food_allergies, send as JSON
        formData.append(key, JSON.stringify(value))
      } else {
        formData.append(key, String(value))
      }
    }
  })

  const response = await authenticatedFetch('/api/v1/users/me', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to update profile' }))
    throw new Error(error.detail || 'Failed to update profile')
  }

  return await response.json()
}
