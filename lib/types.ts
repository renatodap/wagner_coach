export interface Profile {
  id: string;
  full_name?: string;
  goal?: 'build_muscle' | 'lose_weight' | 'gain_strength';
  onboarding_completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Exercise {
  id: number;
  name: string;
  category: string;
  muscle_group: string;
  equipment?: string;
  difficulty?: string;
  instructions?: string[];
}

export interface Workout {
  id: number;
  name: string;
  type: string;
  goal?: string;
  duration_minutes?: number;
  difficulty?: string;
  created_at?: string;
  workout_exercises?: WorkoutExercise[];
}

export interface WorkoutExercise {
  id: number;
  workout_id: number;
  exercise_id: number;
  sets: number;
  reps: string;
  rest_seconds?: number;
  order_index: number;
  notes?: string;
  exercises?: Exercise;
}

export interface UserWorkout {
  id: number;
  user_id: string;
  workout_id?: number;
  scheduled_date: string;
  completed: boolean;
  created_at?: string;
  workouts?: Workout;
}

export interface WorkoutCompletion {
  id: number;
  user_id: string;
  user_workout_id: number;
  workout_id?: number;
  started_at?: string;
  completed_at: string;
  notes?: string;
  workouts?: Workout;
  exercise_completions?: ExerciseCompletion[];
}

export interface ExerciseCompletion {
  id: number;
  completion_id: number;
  exercise_id: number;
  sets_completed?: number;
  reps_completed?: number[];
  weight_kg?: number[];
  notes?: string;
  exercises?: Exercise;
}

// ============================================================================
// NEW UNIFIED SCHEMA (Migration 007)
// ============================================================================

/**
 * Activity - Unified completion log for ALL activity types
 *
 * Replaces the confusing separation between:
 * - workout_completions (strength logs)
 * - activities (cardio logs)
 *
 * Now handles: strength training, cardio, sports, all logged activities
 */
export interface Activity {
  id: string;
  user_id: string;

  // Source and type
  source: 'strava' | 'garmin' | 'manual' | 'apple' | 'fitbit' | 'polar' | 'suunto' | 'wahoo' | 'quick_entry' | 'workout_log';
  activity_type: string;  // 'Run', 'Ride', 'Swim', 'strength', etc.
  name: string;
  activity_name?: string;

  // Timing
  start_date: string;
  end_date?: string;
  elapsed_time_seconds?: number;
  moving_time_seconds?: number;
  duration_minutes?: number;

  // Performance
  rpe?: number;  // Rate of Perceived Exertion (1-10)
  notes?: string;
  completed?: boolean;

  // Context
  location?: string;
  energy_level_before?: number;
  energy_level_after?: number;

  // Cardio-specific (for activities from Strava/Garmin)
  distance_meters?: number;
  calories?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  elevation_gain?: number;
  average_speed?: number;

  // Template linkage (if user followed a workout template)
  workout_id?: number;

  // Integration IDs
  strava_id?: string;
  garmin_id?: string;

  // Timestamps
  created_at?: string;
  updated_at?: string;

  // Relations (loaded separately)
  activity_exercises?: ActivityExercise[];
}

/**
 * ActivityExercise - Exercises performed in a logged activity
 *
 * Links an activity to specific exercises with sets/reps/weight
 */
export interface ActivityExercise {
  id: string;
  activity_id: string;
  exercise_id: string;

  // Optional template linkage
  workout_exercise_id?: string;

  order_index?: number;
  notes?: string;

  created_at?: string;

  // Relations
  exercises?: Exercise;
  activity_sets?: ActivitySet[];
}

/**
 * ActivitySet - Individual sets logged within exercises
 *
 * Tracks ACTUAL performance (not template suggestions)
 */
export interface ActivitySet {
  id: string;
  activity_exercise_id: string;

  set_number: number;
  reps_completed?: number;
  weight_lbs?: number;
  weight_kg?: number;
  rpe?: number;  // Set-specific RPE
  rest_seconds?: number;

  completed?: boolean;
  notes?: string;

  created_at?: string;
}

/**
 * WorkoutExerciseTemplate - Exercises in workout templates
 *
 * These are BLUEPRINTS (what CAN be done)
 * Distinct from ActivityExercise (what WAS done)
 */
export interface WorkoutExerciseTemplate {
  id: string;
  workout_id: number;
  exercise_id: string;
  order_index: number;

  // Suggested values (this is a template!)
  suggested_sets?: number;
  suggested_reps?: string;  // "8-12", "AMRAP", etc.
  suggested_weight_type?: 'percentage_1rm' | 'fixed' | 'bodyweight';
  suggested_weight_percentage?: number;
  suggested_weight_lbs?: number;

  rest_seconds?: number;
  notes?: string;
  technique_cues?: string[];

  // Grouping (for supersets, circuits)
  superset_group?: number;

  created_at?: string;
  updated_at?: string;

  // Relations
  exercises?: Exercise;
}