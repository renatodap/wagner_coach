/**
 * Foods API Client
 *
 * Client functions for food search and meal logging.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

// Types
export interface Food {
  id: string
  name: string
  brand_name?: string
  food_group?: string
  serving_size: number
  serving_unit: string
  calories?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  fiber_g?: number
  sugar_g?: number
  sodium_mg?: number
  is_recent?: boolean
  is_generic?: boolean
  is_branded?: boolean
  data_quality_score?: number
  last_quantity?: number
  last_unit?: string
  last_logged_at?: string
  log_count?: number
}

export interface FoodSearchResponse {
  foods: Food[]
  total: number
  limit: number
  query: string
}

export interface RecentFoodsResponse {
  foods: Food[]
}

/**
 * Search foods by query
 */
export async function searchFoods(
  query: string,
  options: {
    limit?: number
    includeRecent?: boolean
    token: string
  }
): Promise<FoodSearchResponse> {
  const params = new URLSearchParams({
    q: query,
    limit: (options.limit || 20).toString(),
    include_recent: (options.includeRecent !== false).toString(),
  })

  const response = await fetch(`${API_BASE_URL}/api/v1/foods/search?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${options.token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Food search failed: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get recent foods for user
 */
export async function getRecentFoods(
  options: {
    limit?: number
    token: string
  }
): Promise<RecentFoodsResponse> {
  const params = new URLSearchParams({
    limit: (options.limit || 20).toString(),
  })

  const response = await fetch(`${API_BASE_URL}/api/v1/foods/recent?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${options.token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch recent foods: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get food by ID
 */
export async function getFoodById(
  foodId: string,
  token: string
): Promise<Food> {
  const response = await fetch(`${API_BASE_URL}/api/v1/foods/${foodId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${options.token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch food: ${response.statusText}`)
  }

  return response.json()
}
