import { createClient } from '@/lib/supabase/client';

export interface StravaActivity {
  id: number;
  name: string;
  sport_type: string;
  start_date: string;
  elapsed_time: number;
  moving_time: number;
  distance: number;
  total_elevation_gain: number;
  calories?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_speed: number;
  max_speed: number;
  average_cadence?: number;
  average_power?: number;
  kudos_count: number;
  comment_count: number;
  athlete_count: number;
  photo_count: number;
  trainer: boolean;
  commute: boolean;
  manual: boolean;
  private: boolean;
  visibility: 'everyone' | 'followers_only' | 'only_me';
  flagged: boolean;
  gear_id?: string;
  start_latlng?: [number, number];
  end_latlng?: [number, number];
  achievement_count: number;
  pr_count: number;
  external_id?: string;
  upload_id?: number;
  summary_polyline?: string;
  detailed_polyline?: string;
}

export interface StravaAthlete {
  id: number;
  username: string;
  resource_state: number;
  firstname: string;
  lastname: string;
  bio: string;
  city: string;
  state: string;
  country: string;
  sex: 'M' | 'F';
  premium: boolean;
  summit: boolean;
  created_at: string;
  updated_at: string;
  badge_type_id: number;
  weight: number;
  profile_medium: string;
  profile: string;
  friend?: string;
  follower?: string;
}

export interface StravaStats {
  biggest_ride_distance: number;
  biggest_climb_elevation_gain: number;
  recent_ride_totals: {
    count: number;
    distance: number;
    moving_time: number;
    elapsed_time: number;
    elevation_gain: number;
    achievement_count: number;
  };
  recent_run_totals: {
    count: number;
    distance: number;
    moving_time: number;
    elapsed_time: number;
    elevation_gain: number;
    achievement_count: number;
  };
  recent_swim_totals: {
    count: number;
    distance: number;
    moving_time: number;
    elapsed_time: number;
    elevation_gain: number;
    achievement_count: number;
  };
  ytd_ride_totals: {
    count: number;
    distance: number;
    moving_time: number;
    elapsed_time: number;
    elevation_gain: number;
  };
  ytd_run_totals: {
    count: number;
    distance: number;
    moving_time: number;
    elapsed_time: number;
    elevation_gain: number;
  };
  ytd_swim_totals: {
    count: number;
    distance: number;
    moving_time: number;
    elapsed_time: number;
    elevation_gain: number;
  };
  all_ride_totals: {
    count: number;
    distance: number;
    moving_time: number;
    elapsed_time: number;
    elevation_gain: number;
  };
  all_run_totals: {
    count: number;
    distance: number;
    moving_time: number;
    elapsed_time: number;
    elevation_gain: number;
  };
  all_swim_totals: {
    count: number;
    distance: number;
    moving_time: number;
    elapsed_time: number;
    elevation_gain: number;
  };
}

export class StravaApiClient {
  private accessToken: string;
  private baseUrl = 'https://www.strava.com/api/v3';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Strava API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // Get authenticated athlete
  async getAthlete(): Promise<StravaAthlete> {
    return this.makeRequest('/athlete');
  }

  // Get athlete's activities
  async getActivities(
    page = 1,
    perPage = 30,
    before?: number,
    after?: number
  ): Promise<StravaActivity[]> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: Math.min(perPage, 200).toString(), // Strava max is 200
    });

    if (before) params.append('before', before.toString());
    if (after) params.append('after', after.toString());

    return this.makeRequest(`/athlete/activities?${params}`);
  }

  // Get specific activity by ID
  async getActivity(activityId: string | number): Promise<StravaActivity> {
    return this.makeRequest(`/activities/${activityId}`);
  }

  // Get athlete's stats
  async getAthleteStats(athleteId?: number): Promise<StravaStats> {
    const id = athleteId || (await this.getAthlete()).id;
    return this.makeRequest(`/athletes/${id}/stats`);
  }

  // Get activity zones (heart rate, power)
  async getActivityZones(activityId: string | number) {
    return this.makeRequest(`/activities/${activityId}/zones`);
  }

  // Get activity streams (detailed time-series data)
  async getActivityStreams(
    activityId: string | number,
    types: string[] = ['heartrate', 'cadence', 'power', 'velocity_smooth', 'altitude'],
    resolution: 'low' | 'medium' | 'high' = 'medium'
  ) {
    const streamTypes = types.join(',');
    return this.makeRequest(
      `/activities/${activityId}/streams?keys=${streamTypes}&key_by_type=true&resolution=${resolution}`
    );
  }

  // Get activity laps
  async getActivityLaps(activityId: string | number) {
    return this.makeRequest(`/activities/${activityId}/laps`);
  }

  // Helper: Get activities since a specific date
  async getActivitiesSince(sinceDate: Date, limit = 100): Promise<StravaActivity[]> {
    const after = Math.floor(sinceDate.getTime() / 1000);
    const activities: StravaActivity[] = [];
    let page = 1;
    const perPage = 50;

    while (activities.length < limit) {
      const batch = await this.getActivities(page, perPage, undefined, after);

      if (batch.length === 0) break;

      activities.push(...batch);

      if (batch.length < perPage) break; // Last page

      page++;
    }

    return activities.slice(0, limit);
  }

  // Helper: Get recent activities (last N days)
  async getRecentActivities(days = 30, limit = 100): Promise<StravaActivity[]> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    return this.getActivitiesSince(sinceDate, limit);
  }
}

// Helper function to refresh expired tokens
export async function refreshStravaToken(userId: string): Promise<string | null> {
  const supabase = createClient();

  const { data: connection, error } = await supabase
    .from('strava_connections')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !connection) {
    console.error('No Strava connection found:', error);
    return null;
  }

  // Check if token is still valid (with 5 minute buffer)
  const expiresAt = new Date(connection.expires_at);
  const now = new Date();
  const buffer = 5 * 60 * 1000; // 5 minutes in milliseconds

  if (expiresAt.getTime() > now.getTime() + buffer) {
    return connection.access_token; // Still valid
  }

  // Token expired, refresh it
  try {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: connection.refresh_token,
      }),
    });

    const tokenData = await response.json();

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${tokenData.message || response.statusText}`);
    }

    // Update database with new tokens
    const { error: updateError } = await supabase
      .from('strava_connections')
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(tokenData.expires_at * 1000),
        updated_at: new Date(),
      })
      .eq('user_id', userId);

    if (updateError) {
      throw new Error(`Failed to update tokens: ${updateError.message}`);
    }

    return tokenData.access_token;
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}

// Helper function to get a Strava client for a user
export async function getStravaClientForUser(userId: string): Promise<StravaApiClient | null> {
  const accessToken = await refreshStravaToken(userId);

  if (!accessToken) {
    return null;
  }

  return new StravaApiClient(accessToken);
}

// Helper function to check if user has Strava connected
export async function hasStravaConnection(userId: string): Promise<boolean> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('strava_connections')
    .select('id')
    .eq('user_id', userId)
    .single();

  return !error && !!data;
}

// Helper function to get connection status
export async function getStravaConnectionStatus(userId: string) {
  const supabase = createClient();

  const { data: connection, error } = await supabase
    .from('strava_connections')
    .select('athlete_data, connected_at, last_sync_at, sync_enabled')
    .eq('user_id', userId)
    .single();

  if (error || !connection) {
    return {
      connected: false,
      athlete: null,
      connectedAt: null,
      lastSyncAt: null,
      syncEnabled: false,
    };
  }

  return {
    connected: true,
    athlete: connection.athlete_data,
    connectedAt: connection.connected_at,
    lastSyncAt: connection.last_sync_at,
    syncEnabled: connection.sync_enabled,
  };
}

// Activity type mapping helpers
export const STRAVA_ACTIVITY_TYPES = {
  // Endurance activities
  Run: 'run',
  TrailRun: 'trail_run',
  VirtualRun: 'virtual_run',
  Ride: 'ride',
  VirtualRide: 'virtual_ride',
  EBikeRide: 'ebike_ride',
  MountainBikeRide: 'mountain_bike_ride',
  Swim: 'swim',
  OpenWaterSwim: 'open_water_swim',

  // Strength and conditioning
  WeightTraining: 'strength_training',
  Crossfit: 'crossfit',
  HIIT: 'hiit',

  // Flexibility and recovery
  Yoga: 'yoga',
  Pilates: 'pilates',
  Stretching: 'stretching',

  // Other activities
  Walk: 'walk',
  Hike: 'hike',
  Rowing: 'rowing',
  Kayaking: 'kayaking',
  Skiing: 'skiing',
  Snowboarding: 'snowboarding',
  IceSkate: 'ice_skating',
  InlineSkate: 'inline_skating',
  Skateboard: 'skateboarding',

  // Indoor activities
  Elliptical: 'elliptical',
  Treadmill: 'treadmill',
  StationaryBike: 'stationary_bike',

  // Sports
  Tennis: 'tennis',
  Golf: 'golf',
  Soccer: 'soccer',
  Basketball: 'basketball',
  BadmintionGame: 'badminton',
  TableTennis: 'table_tennis',

  // Default fallback
  Workout: 'workout',
} as const;

export function mapStravaActivityType(stravaType: string): string {
  return STRAVA_ACTIVITY_TYPES[stravaType as keyof typeof STRAVA_ACTIVITY_TYPES] || stravaType.toLowerCase();
}