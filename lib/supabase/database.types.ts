export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          goal: 'build_muscle' | 'lose_weight' | 'gain_strength' | null
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          goal?: 'build_muscle' | 'lose_weight' | 'gain_strength' | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string | null
          goal?: 'build_muscle' | 'lose_weight' | 'gain_strength' | null
          onboarding_completed?: boolean
          updated_at?: string
        }
      }
      exercises: {
        Row: {
          id: number
          name: string
          category: string
          muscle_group: string
          equipment: string | null
          difficulty: string | null
          instructions: string[] | null
          created_at: string
        }
      }
      workouts: {
        Row: {
          id: number
          name: string
          type: string
          goal: string | null
          duration_minutes: number | null
          difficulty: string | null
          created_at: string
        }
      }
      workout_exercises: {
        Row: {
          id: number
          workout_id: number
          exercise_id: number
          sets: number
          reps: string
          rest_seconds: number | null
          order_index: number
          notes: string | null
        }
      }
      user_workouts: {
        Row: {
          id: number
          user_id: string
          workout_id: number | null
          scheduled_date: string
          completed: boolean
          created_at: string
        }
        Insert: {
          user_id: string
          workout_id?: number | null
          scheduled_date: string
          completed?: boolean
        }
      }
      workout_completions: {
        Row: {
          id: number
          user_id: string
          user_workout_id: number
          workout_id: number | null
          started_at: string | null
          completed_at: string
          notes: string | null
        }
        Insert: {
          user_id: string
          user_workout_id: number
          workout_id?: number | null
          started_at?: string | null
          completed_at?: string
          notes?: string | null
        }
      }
      exercise_completions: {
        Row: {
          id: number
          completion_id: number
          exercise_id: number | null
          sets_completed: number | null
          reps_completed: number[] | null
          weight_kg: number[] | null
          notes: string | null
        }
        Insert: {
          completion_id: number
          exercise_id?: number | null
          sets_completed?: number | null
          reps_completed?: number[] | null
          weight_kg?: number[] | null
          notes?: string | null
        }
      }
      user_settings: {
        Row: {
          user_id: string
          preferred_workout_days: string[]
          preferred_workout_time: string | null
          notifications_enabled: boolean
          created_at: string
          updated_at: string
          auto_sync_activities?: boolean
          preferred_units?: string
          default_activity_privacy?: string
          watch_type?: string
        }
        Update: {
          preferred_workout_days?: string[]
          preferred_workout_time?: string | null
          notifications_enabled?: boolean
          updated_at?: string
          auto_sync_activities?: boolean
          preferred_units?: string
          default_activity_privacy?: string
          watch_type?: string
        }
      }
      strava_connections: {
        Row: {
          id: string
          user_id: string
          strava_athlete_id: number
          access_token: string
          refresh_token: string
          expires_at: string
          athlete_data: Record<string, unknown>
          scope?: string
          connected_at: string
          last_sync_at?: string
          sync_enabled: boolean
        }
        Insert: {
          user_id: string
          strava_athlete_id: number
          access_token: string
          refresh_token: string
          expires_at: string
          athlete_data: Record<string, unknown>
          scope?: string
          connected_at?: string
          last_sync_at?: string
          sync_enabled?: boolean
        }
        Update: {
          access_token?: string
          refresh_token?: string
          expires_at?: string
          athlete_data?: Record<string, unknown>
          scope?: string
          last_sync_at?: string
          sync_enabled?: boolean
        }
      }
      activities: {
        Row: {
          id: string
          user_id: string
          source: string
          external_id?: string
          name: string
          activity_type: string
          sport_type?: string
          start_date: string
          end_date?: string
          elapsed_time_seconds?: number
          moving_time_seconds?: number
          distance_meters?: number
          total_elevation_gain?: number
          average_heartrate?: number
          max_heartrate?: number
          heartrate_zones?: Record<string, unknown>
          average_speed?: number
          max_speed?: number
          average_cadence?: number
          average_power?: number
          normalized_power?: number
          calories?: number
          active_calories?: number
          training_load?: number
          perceived_exertion?: number
          workout_id?: number
          sets_completed?: number
          reps_completed?: number
          total_weight_lifted_kg?: number
          start_lat?: number
          start_lng?: number
          end_lat?: number
          end_lng?: number
          weather_data?: Record<string, unknown>
          notes?: string
          mood?: string
          energy_level?: number
          workout_rating?: number
          raw_data?: Record<string, unknown>
          created_at: string
          updated_at: string
          synced_at?: string
        }
        Insert: {
          user_id: string
          source: string
          external_id?: string
          name: string
          activity_type: string
          sport_type?: string
          start_date: string
          end_date?: string
          elapsed_time_seconds?: number
          moving_time_seconds?: number
          distance_meters?: number
          total_elevation_gain?: number
          average_heartrate?: number
          max_heartrate?: number
          heartrate_zones?: Record<string, unknown>
          average_speed?: number
          max_speed?: number
          average_cadence?: number
          average_power?: number
          normalized_power?: number
          calories?: number
          active_calories?: number
          training_load?: number
          perceived_exertion?: number
          workout_id?: number
          sets_completed?: number
          reps_completed?: number
          total_weight_lifted_kg?: number
          start_lat?: number
          start_lng?: number
          end_lat?: number
          end_lng?: number
          weather_data?: Record<string, unknown>
          notes?: string
          mood?: string
          energy_level?: number
          workout_rating?: number
          raw_data?: Record<string, unknown>
          created_at?: string
          updated_at?: string
          synced_at?: string
        }
        Update: {
          name?: string
          activity_type?: string
          sport_type?: string
          start_date?: string
          end_date?: string
          elapsed_time_seconds?: number
          moving_time_seconds?: number
          distance_meters?: number
          total_elevation_gain?: number
          average_heartrate?: number
          max_heartrate?: number
          heartrate_zones?: Record<string, unknown>
          average_speed?: number
          max_speed?: number
          average_cadence?: number
          average_power?: number
          normalized_power?: number
          calories?: number
          active_calories?: number
          training_load?: number
          perceived_exertion?: number
          workout_id?: number
          sets_completed?: number
          reps_completed?: number
          total_weight_lifted_kg?: number
          start_lat?: number
          start_lng?: number
          end_lat?: number
          end_lng?: number
          weather_data?: Record<string, unknown>
          notes?: string
          mood?: string
          energy_level?: number
          workout_rating?: number
          raw_data?: Record<string, unknown>
          updated_at?: string
          synced_at?: string
        }
      }
    }
  }
}