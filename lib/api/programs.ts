/**
 * Programs API Client
 *
 * Functions for interacting with the AI programs API
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
 * Meal info from program
 */
export interface ProgramMeal {
  id: string
  meal_type: string
  meal_name: string
  foods: any[]
  calories?: number
  protein?: number
  carbs?: number
  fats?: number
  instructions?: string
  prep_time_minutes?: number
  is_completed: boolean
}

/**
 * Workout info from program
 */
export interface ProgramWorkout {
  id: string
  workout_type: string
  workout_name: string
  exercises: any[]
  duration_minutes?: number
  intensity?: string
  notes?: string
  is_completed: boolean
}

/**
 * Program day info
 */
export interface ProgramDay {
  day_number: number
  day_date: string
  day_name: string
  notes?: string
  is_completed: boolean
  meals: ProgramMeal[]
  workouts: ProgramWorkout[]
}

/**
 * Get today's program plan (meals and workouts)
 */
export async function getTodaysPlan(): Promise<ProgramDay | null> {
  const token = await getAuthToken()

  const response = await fetch(`${API_BASE_URL}/api/v1/programs/today`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    if (response.status === 404) {
      return null // No active program
    }
    throw new Error(`Failed to fetch today's plan: ${response.statusText}`)
  }

  const data = await response.json()
  return data || null
}

/**
 * Mark a meal as completed/uncompleted
 */
export async function markMealCompleted(mealId: string, isCompleted: boolean): Promise<void> {
  const token = await getAuthToken()

  const response = await fetch(`${API_BASE_URL}/api/v1/programs/meals/${mealId}/complete`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ is_completed: isCompleted })
  })

  if (!response.ok) {
    throw new Error(`Failed to mark meal as completed: ${response.statusText}`)
  }
}

/**
 * Mark a workout as completed/uncompleted
 */
export async function markWorkoutCompleted(workoutId: string, isCompleted: boolean): Promise<void> {
  const token = await getAuthToken()

  const response = await fetch(`${API_BASE_URL}/api/v1/programs/workouts/${workoutId}/complete`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ is_completed: isCompleted })
  })

  if (!response.ok) {
    throw new Error(`Failed to mark workout as completed: ${response.statusText}`)
  }
}
