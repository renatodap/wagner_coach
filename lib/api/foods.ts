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

  const url = `${API_BASE_URL}/api/v1/foods/search?${params}`
  console.log('🔍 [Foods API] Searching foods:', { url, hasToken: !!options.token, tokenLength: options.token?.length })

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${options.token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('❌ [Foods API] Search failed:', {
      status: response.status,
      statusText: response.statusText,
      url,
      errorBody,
      hasToken: !!options.token,
      tokenPrefix: options.token?.substring(0, 20) + '...'
    })
    throw new Error(`Food search failed (${response.status}): ${errorBody || response.statusText}`)
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

  const url = `${API_BASE_URL}/api/v1/foods/recent?${params}`
  console.log('🕐 [Foods API] Fetching recent foods:', { url, hasToken: !!options.token, tokenLength: options.token?.length })

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${options.token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('❌ [Foods API] Recent foods failed:', {
      status: response.status,
      statusText: response.statusText,
      url,
      errorBody,
      hasToken: !!options.token,
      tokenPrefix: options.token?.substring(0, 20) + '...'
    })
    throw new Error(`Failed to fetch recent foods (${response.status}): ${errorBody || response.statusText}`)
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
  const url = `${API_BASE_URL}/api/v1/foods/${foodId}`
  console.log('🍎 [Foods API] Fetching food by ID:', { url, foodId, hasToken: !!token, tokenLength: token?.length })

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('❌ [Foods API] Get food failed:', {
      status: response.status,
      statusText: response.statusText,
      url,
      errorBody,
      hasToken: !!token,
      tokenPrefix: token?.substring(0, 20) + '...'
    })
    throw new Error(`Failed to fetch food (${response.status}): ${errorBody || response.statusText}`)
  }

  return response.json()
}
