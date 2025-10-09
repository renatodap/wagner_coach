/**
 * Merge Requests API Client
 *
 * Handles duplicate activity detection and merge request management.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export interface MergeRequest {
  id: string;
  primary_activity_id: string;
  duplicate_activity_id: string;
  confidence_score: number;
  status: 'pending' | 'approved' | 'rejected' | 'auto_merged';
  merge_reason: {
    time_diff_minutes: number;
    duration_diff_pct?: number;
    distance_diff_pct?: number;
    hr_diff_bpm?: number;
    calories_diff_pct?: number;
    same_type: boolean;
    same_source: boolean;
    signals_matched: string[];
  };
  created_at: string;
  primary: Activity;
  duplicate: Activity;
}

export interface Activity {
  id: string;
  user_id: string;
  type: string;
  name: string | null;
  start_date: string;
  duration_minutes: number;
  distance_meters: number | null;
  calories: number | null;
  average_heartrate: number | null;
  max_heartrate: number | null;
  average_pace: string | null;
  perceived_exertion: number | null;
  notes: string | null;
  source: string;
  created_at: string;
}

export interface DetectDuplicatesRequest {
  activity_id: string;
}

export interface DetectDuplicatesResponse {
  success: boolean;
  duplicates_found: number;
  merge_requests_created: number;
  auto_merged: number;
  message: string;
}

export interface ApproveRejectResponse {
  success: boolean;
  message: string;
  primary_activity_id?: string;
  duplicate_activity_id?: string;
}

/**
 * Get pending merge requests for the current user
 */
export async function getPendingMergeRequests(
  token: string,
  limit: number = 10
): Promise<MergeRequest[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/merge-requests?limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch merge requests');
  }

  return response.json();
}

/**
 * Get count of pending merge requests
 */
export async function getMergeRequestsCount(token: string): Promise<number> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/merge-requests/count`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch merge requests count');
  }

  const data = await response.json();
  return data.count;
}

/**
 * Detect duplicates for a specific activity
 */
export async function detectDuplicates(
  token: string,
  activityId: string
): Promise<DetectDuplicatesResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/merge-requests/detect`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ activity_id: activityId }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to detect duplicates');
  }

  return response.json();
}

/**
 * Approve a merge request (mark duplicate activity as merged)
 */
export async function approveMergeRequest(
  token: string,
  mergeRequestId: string
): Promise<ApproveRejectResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/merge-requests/${mergeRequestId}/approve`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to approve merge request');
  }

  return response.json();
}

/**
 * Reject a merge request (mark activities as not duplicates)
 */
export async function rejectMergeRequest(
  token: string,
  mergeRequestId: string
): Promise<ApproveRejectResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/merge-requests/${mergeRequestId}/reject`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to reject merge request');
  }

  return response.json();
}
