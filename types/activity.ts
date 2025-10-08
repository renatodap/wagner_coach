/**
 * Activity Types and Interfaces
 *
 * TypeScript types for activity logging system
 */

// ============================================================================
// ACTIVITY TYPES
// ============================================================================

export type ActivityType =
  | 'running'
  | 'cycling'
  | 'swimming'
  | 'walking'
  | 'hiking'
  | 'strength_training'
  | 'crossfit'
  | 'tennis'
  | 'soccer'
  | 'basketball'
  | 'yoga'
  | 'climbing'
  | 'workout';

export type ActivityCategory =
  | 'cardio'
  | 'strength'
  | 'sports'
  | 'flexibility'
  | 'mind_body'
  | 'recreational';

export type ActivitySource =
  | 'manual'
  | 'quick_entry'
  | 'strava'
  | 'garmin'
  | 'apple'
  | 'fitbit';

export type Mood = 'terrible' | 'bad' | 'okay' | 'good' | 'amazing';

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface CreateActivityRequest {
  // Required fields
  activity_type: ActivityType;
  name: string;
  start_date: string;

  // Optional common fields
  end_date?: string;
  timezone?: string;
  elapsed_time_seconds?: number;
  duration_minutes?: number;

  // Cardio metrics
  distance_meters?: number;
  average_speed?: number;
  max_speed?: number;
  average_pace?: string;

  // Elevation
  total_elevation_gain?: number;
  total_elevation_loss?: number;
  elevation_high?: number;
  elevation_low?: number;

  // Heart rate
  average_heartrate?: number;
  max_heartrate?: number;
  min_heartrate?: number;

  // Power (cycling)
  average_power?: number;
  max_power?: number;
  normalized_power?: number;

  // Cadence
  average_cadence?: number;
  max_cadence?: number;

  // Swimming
  pool_length?: number;
  total_strokes?: number;
  average_stroke_rate?: number;
  average_swolf?: number;
  lap_count?: number;

  // Strength training
  total_reps?: number;
  total_sets?: number;
  total_weight_lifted_kg?: number;
  exercise_count?: number;
  exercises?: ActivityExercise[];

  // Tennis
  total_shots?: number;
  forehand_count?: number;
  backhand_count?: number;
  serve_count?: number;
  ace_count?: number;
  winner_count?: number;
  unforced_error_count?: number;
  sets_played?: number;
  games_played?: number;

  // Yoga/Flexibility
  poses_held?: number;
  average_hold_duration?: number;
  flexibility_score?: number;

  // Calories
  calories?: number;
  active_calories?: number;

  // Subjective metrics
  perceived_exertion?: number;
  rpe?: number;
  mood?: Mood;
  energy_level?: number;
  soreness_level?: number;
  workout_rating?: number;

  // Weather
  weather_conditions?: string;
  temperature_celsius?: number;
  humidity_percentage?: number;
  wind_speed_kmh?: number;
  indoor?: boolean;

  // Location
  location?: string;
  route_name?: string;
  city?: string;

  // Notes
  notes?: string;
  private_notes?: string;

  // Metadata
  tags?: string[];
  trainer?: boolean;
  race?: boolean;
  workout_type?: string;
  sport_type?: string;
  source?: ActivitySource;
  quick_entry_log_id?: string;
}

export interface ActivityExercise {
  exercise_name: string;
  order_index?: number;
  sets?: ActivitySet[];
  notes?: string;
}

export interface ActivitySet {
  set_number: number;
  reps_completed?: number;
  weight_lbs?: number;
  weight_kg?: number;
  rpe?: number;
  rest_seconds?: number;
  completed?: boolean;
  notes?: string;
}

export interface UpdateActivityRequest {
  name?: string;
  start_date?: string;
  duration_minutes?: number;
  distance_meters?: number;
  average_pace?: string;
  average_heartrate?: number;
  calories?: number;
  perceived_exertion?: number;
  mood?: Mood;
  energy_level?: number;
  notes?: string;
  tags?: string[];
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface ActivitySetResponse {
  id: string;
  set_number: number;
  reps_completed?: number;
  weight_lbs?: number;
  weight_kg?: number;
  rpe?: number;
  rest_seconds?: number;
  completed: boolean;
  notes?: string;
  created_at: string;
}

export interface ActivityExerciseResponse {
  id: string;
  exercise_name: string;
  order_index: number;
  sets: ActivitySetResponse[];
  notes?: string;
  created_at: string;
}

export interface ActivityResponse {
  // Core fields
  id: string;
  user_id: string;
  activity_type: ActivityType;
  sport_type?: string;
  name: string;
  source: ActivitySource;

  // Timing
  start_date: string;
  end_date?: string;
  elapsed_time_seconds?: number;
  duration_minutes?: number;

  // Cardio metrics
  distance_meters?: number;
  average_speed?: number;
  max_speed?: number;
  average_pace?: string;

  // Elevation
  total_elevation_gain?: number;
  total_elevation_loss?: number;
  elevation_high?: number;
  elevation_low?: number;

  // Heart rate
  average_heartrate?: number;
  max_heartrate?: number;
  min_heartrate?: number;

  // Power
  average_power?: number;
  max_power?: number;
  normalized_power?: number;

  // Cadence
  average_cadence?: number;
  max_cadence?: number;

  // Swimming
  pool_length?: number;
  total_strokes?: number;
  average_stroke_rate?: number;
  average_swolf?: number;
  lap_count?: number;

  // Strength
  total_reps?: number;
  total_sets?: number;
  total_weight_lifted_kg?: number;
  exercise_count?: number;
  exercises?: ActivityExerciseResponse[];

  // Tennis
  total_shots?: number;
  serve_count?: number;
  ace_count?: number;
  winner_count?: number;
  sets_played?: number;

  // Calories
  calories?: number;
  active_calories?: number;

  // Subjective
  perceived_exertion?: number;
  rpe?: number;
  mood?: Mood;
  energy_level?: number;
  soreness_level?: number;
  workout_rating?: number;

  // Weather
  weather_conditions?: string;
  temperature_celsius?: number;
  indoor: boolean;

  // Location
  location?: string;
  route_name?: string;
  city?: string;

  // Notes
  notes?: string;
  private_notes?: string;

  // Metadata
  tags: string[];
  trainer: boolean;
  race: boolean;
  workout_type?: string;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Quick entry integration
  quick_entry_log_id?: string;
  ai_extracted: boolean;
  ai_confidence?: number;
}

export interface ActivitiesListResponse {
  activities: ActivityResponse[];
  total: number;
  limit: number;
  offset: number;
}

// ============================================================================
// ACTIVITY TYPE CONFIGURATION
// ============================================================================

export type FieldType = 'string' | 'integer' | 'float' | 'boolean' | 'datetime' | 'array' | 'object';

export interface ActivityField {
  name: string;
  label: string;
  field_type: FieldType;
  required: boolean;
  unit?: string;
  min_value?: number;
  max_value?: number;
  placeholder?: string;
  help_text?: string;
}

export interface ActivityTypeConfig {
  activity_type: string;
  display_name: string;
  category: ActivityCategory;
  icon: string;
  description: string;
  primary_fields: ActivityField[];
  secondary_fields: ActivityField[];
  supports_segments: boolean;
  supports_exercises: boolean;
  supports_sets: boolean;
}

export interface ActivityTypesResponse {
  activity_types: Record<string, ActivityTypeConfig>;
}

// ============================================================================
// ACTIVITY TYPE METADATA
// ============================================================================

export const ACTIVITY_TYPE_ICONS: Record<ActivityType, string> = {
  running: '🏃',
  cycling: '🚴',
  swimming: '🏊',
  walking: '🚶',
  hiking: '🥾',
  strength_training: '🏋️',
  crossfit: '⚡',
  tennis: '🎾',
  soccer: '⚽',
  basketball: '🏀',
  yoga: '🧘',
  climbing: '🧗',
  workout: '💪'
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  running: 'Running',
  cycling: 'Cycling',
  swimming: 'Swimming',
  walking: 'Walking',
  hiking: 'Hiking',
  strength_training: 'Strength Training',
  crossfit: 'CrossFit',
  tennis: 'Tennis',
  soccer: 'Soccer',
  basketball: 'Basketball',
  yoga: 'Yoga',
  climbing: 'Rock Climbing',
  workout: 'General Workout'
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function formatDuration(minutes?: number): string {
  if (!minutes) return '0 min';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  return `${mins}m`;
}

export function formatDistance(meters?: number): string {
  if (!meters) return '0 mi';

  // Convert meters to miles
  const miles = meters / 1609.34;

  if (miles < 0.1) {
    return `${meters.toFixed(0)} m`;
  }

  return `${miles.toFixed(2)} mi`;
}

export function formatPace(paceString?: string): string {
  if (!paceString) return '--:--';
  return paceString;
}

export function formatHeartRate(bpm?: number): string {
  if (!bpm) return '-- bpm';
  return `${bpm} bpm`;
}

export function formatCalories(calories?: number): string {
  if (!calories) return '0 cal';
  return `${calories.toLocaleString()} cal`;
}

export function getActivityIcon(activityType: ActivityType): string {
  return ACTIVITY_TYPE_ICONS[activityType] || '🏃';
}

export function getActivityLabel(activityType: ActivityType): string {
  return ACTIVITY_TYPE_LABELS[activityType] || activityType;
}
