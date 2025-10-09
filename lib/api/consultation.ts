/**
 * Consultation API Client
 *
 * API functions for consultation and daily recommendations
 */

import { createClient } from '@/lib/supabase/client';
import type {
  StartConsultationRequest,
  SendMessageRequest,
  CompleteConsultationRequest,
  UpdateRecommendationRequest,
  GenerateDailyPlanRequest,
  ConsultationSession,
  ConsultationMessage,
  ConsultationSummary,
  CompleteConsultationResponse,
  DailyPlan,
  NextAction,
  Recommendation,
  ConsultationError
} from '@/types/consultation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/**
 * Get auth token from Supabase session
 */
async function getAuthToken(): Promise<string> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new ConsultationError('Not authenticated', 401);
  }

  return session.access_token;
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new ConsultationError(
      error.error || 'Request failed',
      response.status,
      error.details
    );
  }

  return response.json();
}

// =====================================================
// CONSULTATION API
// =====================================================

/**
 * Start a new consultation with specialist
 */
export async function startConsultation(
  request: StartConsultationRequest
): Promise<ConsultationSession> {
  return apiRequest<ConsultationSession>('/api/v1/consultation/start', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Send message in consultation
 */
export async function sendConsultationMessage(
  sessionId: string,
  request: SendMessageRequest
): Promise<ConsultationMessage> {
  return apiRequest<ConsultationMessage>(
    `/api/v1/consultation/${sessionId}/message`,
    {
      method: 'POST',
      body: JSON.stringify(request),
    }
  );
}

/**
 * Get consultation summary
 */
export async function getConsultationSummary(
  sessionId: string
): Promise<ConsultationSummary> {
  return apiRequest<ConsultationSummary>(
    `/api/v1/consultation/${sessionId}/summary`
  );
}

/**
 * Complete consultation
 */
export async function completeConsultation(
  sessionId: string,
  request: CompleteConsultationRequest = { generate_program: true }
): Promise<CompleteConsultationResponse> {
  return apiRequest<CompleteConsultationResponse>(
    `/api/v1/consultation/${sessionId}/complete`,
    {
      method: 'POST',
      body: JSON.stringify(request),
    }
  );
}

/**
 * Check if user has completed any consultation
 * Used by dashboard to show/hide first-time user banner
 */
export async function checkConsultationStatus(): Promise<{ has_completed: boolean }> {
  return apiRequest<{ has_completed: boolean }>('/api/v1/consultation/status');
}

/**
 * Check if user has an active consultation session
 * Used by consultation page to prevent duplicate sessions
 */
export async function checkActiveSession(): Promise<{
  has_active_session: boolean;
  session: ConsultationSession | null;
}> {
  return apiRequest<{
    has_active_session: boolean;
    session: ConsultationSession | null;
  }>('/api/v1/consultation/active-session');
}

// =====================================================
// RECOMMENDATIONS API
// =====================================================

/**
 * Generate daily plan
 */
export async function generateDailyPlan(
  request: GenerateDailyPlanRequest = {}
): Promise<DailyPlan> {
  return apiRequest<DailyPlan>('/api/v1/consultation/recommendations/generate', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Get today's recommendations
 */
export async function getTodaysRecommendations(): Promise<DailyPlan> {
  return apiRequest<DailyPlan>('/api/v1/consultation/recommendations/today');
}

/**
 * Get next recommended action
 */
export async function getNextRecommendation(): Promise<NextAction> {
  return apiRequest<NextAction>('/api/v1/consultation/recommendations/next');
}

/**
 * Update recommendation status
 */
export async function updateRecommendationStatus(
  recommendationId: string,
  request: UpdateRecommendationRequest
): Promise<Recommendation> {
  return apiRequest<Recommendation>(
    `/api/v1/consultation/recommendations/${recommendationId}/feedback`,
    {
      method: 'POST',
      body: JSON.stringify(request),
    }
  );
}

/**
 * Accept recommendation
 */
export async function acceptRecommendation(
  recommendationId: string
): Promise<Recommendation> {
  return updateRecommendationStatus(recommendationId, { status: 'accepted' });
}

/**
 * Reject recommendation
 */
export async function rejectRecommendation(
  recommendationId: string,
  feedback?: string
): Promise<Recommendation> {
  return updateRecommendationStatus(recommendationId, {
    status: 'rejected',
    feedback,
  });
}

/**
 * Mark recommendation as completed
 */
export async function completeRecommendation(
  recommendationId: string,
  feedback?: string,
  rating?: number
): Promise<Recommendation> {
  return updateRecommendationStatus(recommendationId, {
    status: 'completed',
    feedback,
    feedback_rating: rating,
  });
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Format time until next action
 */
export function formatTimeUntil(minutes: number): string {
  if (minutes < 0) {
    return 'now';
  }

  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}

/**
 * Check if recommendation is meal type
 */
export function isMealRecommendation(rec: Recommendation): boolean {
  return rec.recommendation_type === 'meal';
}

/**
 * Check if recommendation is workout type
 */
export function isWorkoutRecommendation(rec: Recommendation): boolean {
  return rec.recommendation_type === 'workout';
}

/**
 * Get recommendation icon
 */
export function getRecommendationIcon(type: string): string {
  const icons: Record<string, string> = {
    meal: '🍽️',
    workout: '💪',
    rest: '😴',
    hydration: '💧',
    supplement: '💊',
    note: '📝',
    check_in: '✅',
  };

  return icons[type] || '📌';
}

/**
 * Get recommendation color class
 */
export function getRecommendationColor(type: string): string {
  const colors: Record<string, string> = {
    meal: 'bg-green-100 text-green-800 border-green-200',
    workout: 'bg-orange-100 text-orange-800 border-orange-200',
    rest: 'bg-blue-100 text-blue-800 border-blue-200',
    hydration: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    supplement: 'bg-purple-100 text-purple-800 border-purple-200',
    note: 'bg-gray-100 text-gray-800 border-gray-200',
    check_in: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  };

  return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
}
