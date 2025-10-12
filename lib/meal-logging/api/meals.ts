/**
 * Meals API Client
 *
 * Client functions for meal logging and management.
 * Aligned with V2 comprehensive food system schema.
 */

import { 
  Meal as MealV2, 
  MealFood, 
  CreateMealRequest as CreateMealRequestV2,
  MealCategory 
} from '../../types/nutrition-v2'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

// Food item in meal (with dual quantity tracking)
export interface MealFoodItem extends MealFood {
  name: string
  brand_name?: string | null
  serving_size: number
  serving_unit: string
  order?: number  // For display ordering
}

// Meal with expanded food details
export interface Meal extends MealV2 {
  foods: MealFoodItem[]
  source?: string      // 'manual', 'photo', 'template'
  estimated?: boolean  // For photo analysis meals
}

// Create meal request (V2 with dual quantity)
export interface CreateMealRequest extends CreateMealRequestV2 {}

// Update meal request
export interface UpdateMealRequest {
  name?: string
  category?: MealCategory
  logged_at?: string
  notes?: string
  foods?: Array<{
    food_id: string
    serving_quantity: number
    serving_unit?: string
    gram_quantity: number
    last_edited_field: 'serving' | 'grams'
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
  const url = `${API_BASE_URL}/api/v1/meals`

  console.log('🌐 [createMeal] Making request to:', url)
  console.log('📤 [createMeal] Request body:', JSON.stringify(meal, null, 2))
  console.log('🔑 [createMeal] Token (first 20 chars):', token.substring(0, 20))

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(meal),
  })

  console.log('📥 [createMeal] Response status:', response.status, response.statusText)
  console.log('📥 [createMeal] Response headers:', Object.fromEntries(response.headers.entries()))

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ [createMeal] Error response body:', errorText)

    let error
    try {
      error = JSON.parse(errorText)
    } catch {
      error = { detail: response.statusText }
    }

    throw new Error(error.detail || 'Failed to create meal')
  }

  const result = await response.json()
  console.log('✅ [createMeal] Success response:', result)

  return result
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

  console.log('🔍 [getMeals] Fetching meals:', {
    url: `${API_BASE_URL}/api/v1/meals?${params}`,
    startDate: options.startDate,
    endDate: options.endDate
  })

  const response = await fetch(`${API_BASE_URL}/api/v1/meals?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${options.token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    console.error('❌ [getMeals] Failed:', response.status, response.statusText)
    throw new Error(`Failed to fetch meals: ${response.statusText}`)
  }

  const data = await response.json()

  console.log('✅ [getMeals] Response:', {
    totalMeals: data.meals?.length || 0,
    meals: data.meals?.map((m: any) => ({
      id: m.id,
      category: m.category,
      logged_at: m.logged_at,
      total_calories: m.total_calories,
      total_protein_g: m.total_protein_g,
      total_carbs_g: m.total_carbs_g,
      total_fat_g: m.total_fat_g,
      foods_count: m.foods?.length || 0,
      has_foods_nutrition: m.foods?.[0]?.calories ? true : false
    })) || []
  })

  return data
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

/**
 * Get recent meals for quick-add (last 7 days, limit 5)
 */
export async function getRecentMeals(
  token: string
): Promise<Meal[]> {
  const now = new Date()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(now.getDate() - 7)

  const response = await getMeals({
    startDate: sevenDaysAgo.toISOString(),
    endDate: now.toISOString(),
    limit: 5,
    offset: 0,
    token,
  })

  return response.meals
}
