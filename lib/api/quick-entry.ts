/**
 * Quick Entry API Client
 *
 * Handles multimodal quick entry (text, voice, image)
 */

import { createClient } from '@/lib/supabase/client'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

/**
 * Get authorization headers with Supabase token
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }

  return {
    'Authorization': `Bearer ${session.access_token}`,
  }
}

export interface QuickEntryResult {
  success: boolean
  entry_type: 'meal' | 'activity' | 'workout' | 'measurement' | 'note' | 'unknown'
  confidence: number
  data: any
  entry_id?: string
  suggestions?: string[]
  extracted_text?: string
  error?: string
}

export interface MealData {
  meal_name: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  foods: Array<{ name: string; quantity: string }>
  calories?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  fiber_g?: number
  sugar_g?: number
  sodium_mg?: number
  estimated?: boolean
  notes?: string
}

export interface ActivityData {
  activity_name: string
  activity_type: string
  duration_minutes?: number
  distance_km?: number
  pace?: string
  calories_burned?: number
  rpe?: number
  mood?: string
  energy_level?: number
  notes?: string
}

export interface WorkoutData {
  workout_name: string
  workout_type: string
  exercises: Array<{
    name: string
    sets?: number
    reps?: number | string
    weight_lbs?: number
    weight_kg?: number
  }>
  duration_minutes?: number
  rpe?: number
  difficulty_rating?: number
  notes?: string
}

/**
 * Preview quick entry - get AI estimates WITHOUT saving
 */
export async function previewQuickEntry(input: {
  text?: string
  imageFile?: File
  audioFile?: File
  notes?: string
  manualType?: string
}): Promise<QuickEntryResult> {
  const authHeaders = await getAuthHeaders()
  const formData = new FormData()

  if (input.text) formData.append('text', input.text)
  if (input.notes) formData.append('notes', input.notes)
  if (input.manualType) formData.append('manual_type', input.manualType)
  if (input.imageFile) formData.append('image', input.imageFile)
  if (input.audioFile) formData.append('audio', input.audioFile)

  const response = await fetch(`${API_BASE_URL}/api/v1/quick-entry/preview`, {
    method: 'POST',
    headers: authHeaders,
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to preview entry' }))
    throw new Error(error.detail || 'Failed to preview entry')
  }

  return response.json()
}

/**
 * Confirm and save quick entry after user approval
 */
export async function confirmQuickEntry(data: {
  entry_type: string
  data: any
  original_text: string
  extracted_text?: string
  image_base64?: string
}): Promise<QuickEntryResult> {
  const authHeaders = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/api/v1/quick-entry/confirm`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to save entry' }))
    throw new Error(error.detail || 'Failed to save entry')
  }

  return response.json()
}

/**
 * Direct quick entry (process and save immediately - legacy)
 */
export async function processQuickEntry(input: {
  text?: string
  imageFile?: File
  audioFile?: File
  notes?: string
  manualType?: string
}): Promise<QuickEntryResult> {
  const authHeaders = await getAuthHeaders()
  const formData = new FormData()

  if (input.text) formData.append('text', input.text)
  if (input.notes) formData.append('notes', input.notes)
  if (input.manualType) formData.append('manual_type', input.manualType)
  if (input.imageFile) formData.append('image', input.imageFile)
  if (input.audioFile) formData.append('audio', input.audioFile)

  const response = await fetch(`${API_BASE_URL}/api/v1/quick-entry/multimodal`, {
    method: 'POST',
    headers: authHeaders,
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to process entry' }))
    throw new Error(error.detail || 'Failed to process entry')
  }

  return response.json()
}
