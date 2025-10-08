/**
 * Profile API Client
 *
 * Handles all API calls related to user profile management.
 */

import { createClient } from '@/lib/supabase/client'

// =====================================================
// Types
// =====================================================

export interface UserProfile {
  id: string
  full_name?: string
  goal?: string
  auto_log_enabled: boolean
  created_at: string
  updated_at: string
}

export interface AutoLogPreference {
  auto_log_enabled: boolean
}

// =====================================================
// Profile Functions
// =====================================================

/**
 * Get user's auto-log preference
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

  // Fetch profile
  const { data, error } = await supabase
    .from('profiles')
    .select('auto_log_enabled')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('[getAutoLogPreference] Database error:', error)
    throw new Error('Failed to fetch auto-log preference')
  }

  return {
    auto_log_enabled: data?.auto_log_enabled ?? false
  }
}

/**
 * Update user's auto-log preference
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
    throw new Error('Failed to update auto-log preference')
  }
}

/**
 * Get full user profile
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
    created_at: data.created_at,
    updated_at: data.updated_at
  }
}
