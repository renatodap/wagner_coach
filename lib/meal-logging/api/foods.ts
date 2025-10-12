/**
 * Foods API Client
 *
 * Client functions for food search and meal logging.
 * Aligned with V2 comprehensive food system schema.
 */

import { Food as FoodV2, FoodType } from '../../types/nutrition-v2'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

// Extended Food type for API responses (includes usage stats)
export interface Food extends Omit<FoodV2, 'food_type'> {
  food_type: FoodType
  
  // Usage stats (from food_preferences)
  is_recent?: boolean
  last_quantity?: number
  last_unit?: string
  last_logged_at?: string
  log_count?: number
  
  // Template-specific fields (for unified search results)
  is_template?: boolean         // True if this is a meal template (not an atomic food)
  is_user_template?: boolean    // True if this is user's private template
  is_restaurant?: boolean       // True if restaurant food (food_type === 'restaurant')
  is_community?: boolean        // True if this is a community template
  template_category?: string    // Meal type: breakfast, lunch, dinner, snack
  tags?: string[]               // Template tags
  is_favorite?: boolean         // True if user favorited this
  use_count?: number            // Number of times used
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

export interface DetectedFood {
  name: string
  quantity: string
  unit: string
}

export interface MatchedFood extends Food {
  detected_quantity: number
  detected_unit: string
  match_confidence: number
  match_method: string
}

export interface MatchFoodsResponse {
  matched_foods: MatchedFood[]
  unmatched_foods: Array<{ name: string; reason: string }>
}

/**
 * Search foods AND meal templates by query
 */
export async function searchFoods(
  query: string,
  options: {
    limit?: number
    includeRecent?: boolean
    includeTemplates?: boolean
    token: string
  }
): Promise<FoodSearchResponse> {
  const params = new URLSearchParams({
    q: query,
    limit: (options.limit || 20).toString(),
    include_recent: (options.includeRecent !== false).toString(),
    include_templates: (options.includeTemplates !== false).toString(),
  })

  const url = `${API_BASE_URL}/api/v1/foods/search?${params}`
  console.log('🔍 [Foods API] Searching foods + templates:', { url, hasToken: !!options.token, tokenLength: options.token?.length, includeTemplates: options.includeTemplates !== false })

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

/**
 * Match detected food names to database foods
 *
 * Takes food names/quantities from image analysis and finds
 * matching database records with full nutrition data.
 *
 * @param detectedFoods - Array of detected foods from image analysis
 * @param token - Auth token
 * @returns Matched foods with nutrition data + unmatched foods
 */
export async function matchDetectedFoods(
  detectedFoods: DetectedFood[],
  token: string
): Promise<MatchFoodsResponse> {
  const url = `${API_BASE_URL}/api/v1/foods/match-detected`
  console.log('🔍 [Foods API] Matching detected foods:', {
    url,
    foodCount: detectedFoods.length,
    foods: detectedFoods.map(f => f.name),
    hasToken: !!token
  })

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ detected_foods: detectedFoods })
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('❌ [Foods API] Food matching failed:', {
      status: response.status,
      statusText: response.statusText,
      url,
      errorBody,
      hasToken: !!token
    })
    throw new Error(`Food matching failed (${response.status}): ${errorBody || response.statusText}`)
  }

  const result = await response.json()
  console.log('✅ [Foods API] Matching complete:', {
    matched: result.matched_foods.length,
    unmatched: result.unmatched_foods.length
  })

  return result
}
