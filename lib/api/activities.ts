/**
 * Activities API Client
 *
 * Functions for interacting with the activities API
 */

import { createClient } from '@/lib/supabase/client';
import type {
  CreateActivityRequest,
  UpdateActivityRequest,
  ActivityResponse,
  ActivitiesListResponse,
  ActivityTypesResponse
} from '@/types/activity';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/**
 * Get authentication token from Supabase
 */
async function getAuthToken(): Promise<string> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  return session.access_token;
}

/**
 * Get all activity type configurations
 */
export async function getActivityTypes(): Promise<ActivityTypesResponse> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/api/v1/activities/types`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch activity types: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create a new activity
 */
export async function createActivity(activity: CreateActivityRequest): Promise<ActivityResponse> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/api/v1/activities`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(activity)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create activity');
  }

  return response.json();
}

/**
 * Get user's activities with filters
 */
export async function getActivities(params?: {
  activity_type?: string;
  source?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}): Promise<ActivitiesListResponse> {
  const token = await getAuthToken();

  // Build query string
  const queryParams = new URLSearchParams();
  if (params?.activity_type) queryParams.append('activity_type', params.activity_type);
  if (params?.source) queryParams.append('source', params.source);
  if (params?.start_date) queryParams.append('start_date', params.start_date);
  if (params?.end_date) queryParams.append('end_date', params.end_date);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const url = `${API_BASE_URL}/api/v1/activities${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch activities: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get a single activity by ID
 */
export async function getActivity(activityId: string): Promise<ActivityResponse> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/api/v1/activities/${activityId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Activity not found');
    }
    throw new Error(`Failed to fetch activity: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Update an activity
 */
export async function updateActivity(
  activityId: string,
  updates: UpdateActivityRequest
): Promise<ActivityResponse> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/api/v1/activities/${activityId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update activity');
  }

  return response.json();
}

/**
 * Delete an activity
 */
export async function deleteActivity(activityId: string): Promise<void> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/api/v1/activities/${activityId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Activity not found');
    }
    throw new Error(`Failed to delete activity: ${response.statusText}`);
  }
}

/**
 * Activity summary for today
 */
export interface ActivitySummary {
  count: number
  duration: number // seconds
  calories: number
  distance: number // meters
}

/**
 * Get today's activity summary
 */
export async function getTodaysActivitySummary(): Promise<ActivitySummary> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/api/v1/activities/summary/today`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch activity summary: ${response.statusText}`);
  }

  return response.json();
}
