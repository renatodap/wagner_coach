/**
 * Nutrition API Client
 *
 * Functions for interacting with the nutrition API
 */

import { createClient } from '@/lib/supabase/client'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

/**
 * Get authentication token from Supabase
 */
async function getAuthToken(): Promise<string> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }

  return session.access_token
}

/**
 * Nutrition targets and current consumption
 */
export interface NutritionSummary {
  targets: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  current: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}

/**
 * Get today's nutrition summary (targets and consumed)
 */
export async function getTodaysNutrition(): Promise<NutritionSummary> {
  const token = await getAuthToken()

  const response = await fetch(`${API_BASE_URL}/api/v1/nutrition/summary/today`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch nutrition summary: ${response.statusText}`)
  }

  return response.json()
}
