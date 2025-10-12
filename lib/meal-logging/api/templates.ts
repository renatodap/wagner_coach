/**
 * Meal Templates API Client
 *
 * Client functions for meal template management.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

export interface MealTemplate {
  id: string
  user_id: string
  name: string
  category: string
  description?: string
  tags?: string[]
  is_favorite: boolean
  use_count: number
  last_used_at?: string
  total_calories: number
  total_protein_g: number
  total_carbs_g: number
  total_fat_g: number
  total_fiber_g: number
  items: Array<{
    item_type: string
    food_id?: string
    template_id?: string
    name: string
    quantity: number
    unit: string
    order_index: number
  }>
  created_at: string
  updated_at: string
}

export interface TemplatesListResponse {
  templates: MealTemplate[]
  total: number
  limit: number
  offset: number
}

/**
 * Get user's meal templates
 */
export async function getTemplates(
  options: {
    category?: string
    favorites_only?: boolean
    tags?: string[]
    limit?: number
    offset?: number
    token: string
  }
): Promise<TemplatesListResponse> {
  const params = new URLSearchParams()

  if (options.category) params.set('category', options.category)
  if (options.favorites_only) params.set('favorites_only', 'true')
  if (options.tags && options.tags.length > 0) params.set('tags', options.tags.join(','))
  if (options.limit) params.set('limit', options.limit.toString())
  if (options.offset) params.set('offset', options.offset.toString())

  const response = await fetch(`${API_BASE_URL}/api/v1/templates?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${options.token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch templates: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Create a meal from a template (one-click logging)
 */
export async function createMealFromTemplate(
  templateId: string,
  options: {
    logged_at?: string
    notes?: string
    token: string
  }
): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/v1/templates/${templateId}/create-meal`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${options.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      logged_at: options.logged_at,
      notes: options.notes,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error(error.detail || 'Failed to create meal from template')
  }

  return response.json()
}

/**
 * Create a new meal template
 */
export async function createTemplate(
  template: {
    name: string
    category: string
    description?: string
    tags?: string[]
    food_items: Array<{
      item_type: string
      food_id?: string
      template_id?: string
      quantity: number
      unit: string
    }>
  },
  token: string
): Promise<MealTemplate> {
  const response = await fetch(`${API_BASE_URL}/api/v1/templates`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(template),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error(error.detail || 'Failed to create template')
  }

  return response.json()
}

/**
 * Delete a meal template
 */
export async function deleteTemplate(
  templateId: string,
  token: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/templates/${templateId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error(error.detail || 'Failed to delete template')
  }
}
