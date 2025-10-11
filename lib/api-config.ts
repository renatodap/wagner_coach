/**
 * Centralized API Configuration
 *
 * This file provides the base URL for the backend API.
 * In development, it uses localhost. In production, it uses the Railway backend.
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/**
 * Helper function to make API calls to the backend
 */
export async function fetchFromBackend(
  endpoint: string,
  options?: RequestInit
): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options?.headers,
    },
  });

  return response;
}

/**
 * Backend API endpoints
 */
export const API_ENDPOINTS = {
  // Health check
  health: '/health',

  // AI & Coaching
  aiChat: '/api/v1/ai/chat',
  aiContext: '/api/v1/ai/context',

  // Nutrition
  mealParse: '/api/v1/nutrition/meal/parse',
  meals: '/api/v1/nutrition/meals',

  // Embeddings
  embeddings: '/api/v1/embeddings',
  embeddingsSearch: '/api/v1/embeddings/search',

  // Integrations
  garminTest: '/api/v1/integrations/garmin/test',
  garminSync: '/api/v1/integrations/garmin/sync',

  // Background jobs
  summaries: '/api/v1/jobs/summaries',
} as const;
