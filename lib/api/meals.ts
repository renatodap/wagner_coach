/**
 * Meals API Client
 *
 * Client functions for meal logging and management.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

// Types
export interface FoodItem {
  food_id: string
  name: string
  brand?: string | null
  quantity: number
  unit: string
  serving_size: number
  serving_unit: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  sugar_g?: number | null
  sodium_mg?: number | null
  order: number
}

export interface Meal {
  id: string
  user_id: string
  name?: string | null
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  logged_at: string
  notes?: string | null
  total_calories: number
  total_protein_g: number
  total_carbs_g: number
  total_fat_g: number
  total_fiber_g: number
  total_sugar_g?: number | null
  total_sodium_mg?: number | null
  foods: FoodItem[]
  source: string
  estimated: boolean
  created_at: string
  updated_at: string
}

export interface CreateMealRequest {
  name?: string
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  logged_at: string
  notes?: string
  foods: Array<{
    food_id: string
    quantity: number
    unit: string
  }>
}

export interface UpdateMealRequest {
  name?: string
  category?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  logged_at?: string
  notes?: string
  foods?: Array<{
    food_id: string
    quantity: number
    unit: string
  }>
}

export interface MealsListResponse {
  meals: Meal[]
  total: number
  limit: number
  offset: number
}

/**
 * Create a new meal log
 */
export async function createMeal(
  meal: CreateMealRequest,
  token: string
): Promise<Meal> {
  const response = await fetch(`${API_BASE_URL}/api/v1/meals`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(meal),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error(error.detail || 'Failed to create meal')
  }

  return response.json()
}

/**
 * Get user's meals
 */
export async function getMeals(
  options: {
    startDate?: string
    endDate?: string
    category?: string
    limit?: number
    offset?: number
    token: string
  }
): Promise<MealsListResponse> {
  const params = new URLSearchParams()

  if (options.startDate) params.set('start_date', options.startDate)
  if (options.endDate) params.set('end_date', options.endDate)
  if (options.category) params.set('category', options.category)
  if (options.limit) params.set('limit', options.limit.toString())
  if (options.offset) params.set('offset', options.offset.toString())

  const response = await fetch(`${API_BASE_URL}/api/v1/meals?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${options.token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch meals: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get a single meal by ID
 */
export async function getMeal(
  mealId: string,
  token: string
): Promise<Meal> {
  const response = await fetch(`${API_BASE_URL}/api/v1/meals/${mealId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch meal: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Update an existing meal
 */
export async function updateMeal(
  mealId: string,
  updates: UpdateMealRequest,
  token: string
): Promise<Meal> {
  const response = await fetch(`${API_BASE_URL}/api/v1/meals/${mealId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error(error.detail || 'Failed to update meal')
  }

  return response.json()
}

/**
 * Delete a meal
 */
export async function deleteMeal(
  mealId: string,
  token: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/meals/${mealId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error(error.detail || 'Failed to delete meal')
  }
}
