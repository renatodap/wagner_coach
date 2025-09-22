export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      active_workout_sessions: {
        Row: {
          created_at: string | null
          current_exercise_index: number | null
          current_set_index: number | null
          exercise_completions: Json | null
          id: number
          paused_at: string | null
          resumed_at: string | null
          started_at: string | null
          status: string
          total_pause_duration_seconds: number | null
          updated_at: string | null
          user_id: string | null
          user_workout_id: number | null
          workout_id: number | null
        }
        Insert: {
          created_at?: string | null
          current_exercise_index?: number | null
          current_set_index?: number | null
          exercise_completions?: Json | null
          id?: number
          paused_at?: string | null
          resumed_at?: string | null
          started_at?: string | null
          status: string
          total_pause_duration_seconds?: number | null
          updated_at?: string | null
          user_id?: string | null
          user_workout_id?: number | null
          workout_id?: number | null
        }
        Update: {
          created_at?: string | null
          current_exercise_index?: number | null
          current_set_index?: number | null
          exercise_completions?: Json | null
          id?: number
          paused_at?: string | null
          resumed_at?: string | null
          started_at?: string | null
          status?: string
          total_pause_duration_seconds?: number | null
          updated_at?: string | null
          user_id?: string | null
          user_workout_id?: number | null
          workout_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "active_workout_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_workout_sessions_user_workout_id_fkey"
            columns: ["user_workout_id"]
            isOneToOne: false
            referencedRelation: "user_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_workout_sessions_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "popular_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_workout_sessions_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "user_favorite_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_workout_sessions_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_workout_sessions_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts_with_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          active_calories: number | null
          activity_type: string
          average_cadence: number | null
          average_heartrate: number | null
          average_power: number | null
          average_speed: number | null
          calories: number | null
          created_at: string | null
          distance_meters: number | null
          elapsed_time_seconds: number | null
          end_date: string | null
          end_lat: number | null
          end_lng: number | null
          energy_level: number | null
          external_id: string | null
          heartrate_zones: Json | null
          id: string
          max_heartrate: number | null
          max_speed: number | null
          mood: string | null
          moving_time_seconds: number | null
          name: string
          normalized_power: number | null
          notes: string | null
          perceived_exertion: number | null
          raw_data: Json | null
          reps_completed: number | null
          sets_completed: number | null
          source: string
          sport_type: string | null
          start_date: string
          start_lat: number | null
          start_lng: number | null
          synced_at: string | null
          total_elevation_gain: number | null
          total_weight_lifted_kg: number | null
          training_load: number | null
          updated_at: string | null
          user_id: string | null
          weather_data: Json | null
          workout_id: number | null
          workout_rating: number | null
        }
        Insert: {
          active_calories?: number | null
          activity_type: string
          average_cadence?: number | null
          average_heartrate?: number | null
          average_power?: number | null
          average_speed?: number | null
          calories?: number | null
          created_at?: string | null
          distance_meters?: number | null
          elapsed_time_seconds?: number | null
          end_date?: string | null
          end_lat?: number | null
          end_lng?: number | null
          energy_level?: number | null
          external_id?: string | null
          heartrate_zones?: Json | null
          id?: string
          max_heartrate?: number | null
          max_speed?: number | null
          mood?: string | null
          moving_time_seconds?: number | null
          name: string
          normalized_power?: number | null
          notes?: string | null
          perceived_exertion?: number | null
          raw_data?: Json | null
          reps_completed?: number | null
          sets_completed?: number | null
          source: string
          sport_type?: string | null
          start_date: string
          start_lat?: number | null
          start_lng?: number | null
          synced_at?: string | null
          total_elevation_gain?: number | null
          total_weight_lifted_kg?: number | null
          training_load?: number | null
          updated_at?: string | null
          user_id?: string | null
          weather_data?: Json | null
          workout_id?: number | null
          workout_rating?: number | null
        }
        Update: {
          active_calories?: number | null
          activity_type?: string
          average_cadence?: number | null
          average_heartrate?: number | null
          average_power?: number | null
          average_speed?: number | null
          calories?: number | null
          created_at?: string | null
          distance_meters?: number | null
          elapsed_time_seconds?: number | null
          end_date?: string | null
          end_lat?: number | null
          end_lng?: number | null
          energy_level?: number | null
          external_id?: string | null
          heartrate_zones?: Json | null
          id?: string
          max_heartrate?: number | null
          max_speed?: number | null
          mood?: string | null
          moving_time_seconds?: number | null
          name?: string
          normalized_power?: number | null
          notes?: string | null
          perceived_exertion?: number | null
          raw_data?: Json | null
          reps_completed?: number | null
          sets_completed?: number | null
          source?: string
          sport_type?: string | null
          start_date?: string
          start_lat?: number | null
          start_lng?: number | null
          synced_at?: string | null
          total_elevation_gain?: number | null
          total_weight_lifted_kg?: number | null
          training_load?: number | null
          updated_at?: string | null
          user_id?: string | null
          weather_data?: Json | null
          workout_id?: number | null
          workout_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "popular_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "user_favorite_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts_with_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_segments: {
        Row: {
          activity_id: string | null
          average_cadence: number | null
          average_heartrate: number | null
          average_pace: string | null
          average_power: number | null
          average_speed: number | null
          calories: number | null
          distance_meters: number | null
          elapsed_time_seconds: number | null
          exercise_name: string | null
          id: string
          max_heartrate: number | null
          notes: string | null
          reps: number | null
          segment_index: number
          segment_type: string
          start_time: string | null
          weight_kg: number | null
        }
        Insert: {
          activity_id?: string | null
          average_cadence?: number | null
          average_heartrate?: number | null
          average_pace?: string | null
          average_power?: number | null
          average_speed?: number | null
          calories?: number | null
          distance_meters?: number | null
          elapsed_time_seconds?: number | null
          exercise_name?: string | null
          id?: string
          max_heartrate?: number | null
          notes?: string | null
          reps?: number | null
          segment_index: number
          segment_type: string
          start_time?: string | null
          weight_kg?: number | null
        }
        Update: {
          activity_id?: string | null
          average_cadence?: number | null
          average_heartrate?: number | null
          average_pace?: string | null
          average_power?: number | null
          average_speed?: number | null
          calories?: number | null
          distance_meters?: number | null
          elapsed_time_seconds?: number | null
          exercise_name?: string | null
          id?: string
          max_heartrate?: number | null
          notes?: string | null
          reps?: number | null
          segment_index?: number
          segment_type?: string
          start_time?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_segments_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_streams: {
        Row: {
          activity_id: string
          data_points: Json
          resolution: string | null
          stream_type: string
        }
        Insert: {
          activity_id: string
          data_points: Json
          resolution?: string | null
          stream_type: string
        }
        Update: {
          activity_id?: string
          data_points?: Json
          resolution?: string | null
          stream_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_streams_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          context_used: Json | null
          created_at: string
          embedding: string | null
          id: string
          last_message_at: string | null
          messages: Json
          updated_at: string
          user_id: string | null
        }
        Insert: {
          context_used?: Json | null
          created_at?: string
          embedding?: string | null
          id?: string
          last_message_at?: string | null
          messages?: Json
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          context_used?: Json | null
          created_at?: string
          embedding?: string | null
          id?: string
          last_message_at?: string | null
          messages?: Json
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      exercise_completions: {
        Row: {
          completion_id: number | null
          exercise_id: number | null
          form_quality: string | null
          id: number
          notes: string | null
          reps_completed: number[] | null
          rpe: number | null
          sets_completed: number | null
          weight_kg: number[] | null
        }
        Insert: {
          completion_id?: number | null
          exercise_id?: number | null
          form_quality?: string | null
          id?: number
          notes?: string | null
          reps_completed?: number[] | null
          rpe?: number | null
          sets_completed?: number | null
          weight_kg?: number[] | null
        }
        Update: {
          completion_id?: number | null
          exercise_id?: number | null
          form_quality?: string | null
          id?: number
          notes?: string | null
          reps_completed?: number[] | null
          rpe?: number | null
          sets_completed?: number | null
          weight_kg?: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_completions_completion_id_fkey"
            columns: ["completion_id"]
            isOneToOne: false
            referencedRelation: "workout_completions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_completions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_notes: {
        Row: {
          created_at: string | null
          exercise_id: number | null
          id: number
          note: string
          tags: string[] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          exercise_id?: number | null
          id?: number
          note: string
          tags?: string[] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          exercise_id?: number | null
          id?: number
          note?: string
          tags?: string[] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_notes_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          category: string
          created_at: string | null
          difficulty: string | null
          equipment: string | null
          id: number
          instructions: string[] | null
          muscle_group: string
          name: string
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          difficulty?: string | null
          equipment?: string | null
          id?: number
          instructions?: string[] | null
          muscle_group: string
          name: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          difficulty?: string | null
          equipment?: string | null
          id?: number
          instructions?: string[] | null
          muscle_group?: string
          name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_workouts: {
        Row: {
          created_at: string | null
          id: number
          user_id: string | null
          workout_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          user_id?: string | null
          workout_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          user_id?: string | null
          workout_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "favorite_workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_workouts_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "popular_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_workouts_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "user_favorite_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_workouts_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_workouts_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts_with_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      fitness_goals: {
        Row: {
          activity_type: string | null
          completed_at: string | null
          created_at: string | null
          current_value: number | null
          end_date: string | null
          goal_type: string
          id: string
          last_updated: string | null
          start_date: string
          status: string | null
          target_unit: string
          target_value: number
          timeframe: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          activity_type?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_value?: number | null
          end_date?: string | null
          goal_type: string
          id?: string
          last_updated?: string | null
          start_date: string
          status?: string | null
          target_unit: string
          target_value: number
          timeframe?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_value?: number | null
          end_date?: string | null
          goal_type?: string
          id?: string
          last_updated?: string | null
          start_date?: string
          status?: string | null
          target_unit?: string
          target_value?: number
          timeframe?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fitness_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      foods: {
        Row: {
          barcode: string | null
          brand: string | null
          calories: number | null
          carbs_g: number | null
          created_at: string
          created_by: string | null
          description: string | null
          fat_g: number | null
          fiber_g: number | null
          id: string
          is_public: boolean | null
          is_verified: boolean | null
          name: string
          protein_g: number | null
          serving_description: string | null
          serving_size: number
          serving_unit: Database["public"]["Enums"]["food_unit"]
          sodium_mg: number | null
          sugar_g: number | null
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          is_public?: boolean | null
          is_verified?: boolean | null
          name: string
          protein_g?: number | null
          serving_description?: string | null
          serving_size?: number
          serving_unit?: Database["public"]["Enums"]["food_unit"]
          sodium_mg?: number | null
          sugar_g?: number | null
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          is_public?: boolean | null
          is_verified?: boolean | null
          name?: string
          protein_g?: number | null
          serving_description?: string | null
          serving_size?: number
          serving_unit?: Database["public"]["Enums"]["food_unit"]
          sodium_mg?: number | null
          sugar_g?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      garmin_connections: {
        Row: {
          created_at: string | null
          garmin_user_id: string | null
          id: string
          is_active: boolean | null
          last_sync: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          garmin_user_id?: string | null
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          garmin_user_id?: string | null
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      goal_embeddings: {
        Row: {
          content_hash: string
          created_at: string | null
          embedding: string
          goal_id: string
          id: string
          metadata: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content_hash: string
          created_at?: string | null
          embedding: string
          goal_id: string
          id?: string
          metadata?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content_hash?: string
          created_at?: string | null
          embedding?: string
          goal_id?: string
          id?: string
          metadata?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_embeddings_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "user_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_log_foods: {
        Row: {
          calories_consumed: number | null
          carbs_consumed: number | null
          created_at: string
          fat_consumed: number | null
          fiber_consumed: number | null
          food_id: string
          id: string
          meal_log_id: string
          protein_consumed: number | null
          quantity: number
          unit: Database["public"]["Enums"]["food_unit"]
        }
        Insert: {
          calories_consumed?: number | null
          carbs_consumed?: number | null
          created_at?: string
          fat_consumed?: number | null
          fiber_consumed?: number | null
          food_id: string
          id?: string
          meal_log_id: string
          protein_consumed?: number | null
          quantity: number
          unit: Database["public"]["Enums"]["food_unit"]
        }
        Update: {
          calories_consumed?: number | null
          carbs_consumed?: number | null
          created_at?: string
          fat_consumed?: number | null
          fiber_consumed?: number | null
          food_id?: string
          id?: string
          meal_log_id?: string
          protein_consumed?: number | null
          quantity?: number
          unit?: Database["public"]["Enums"]["food_unit"]
        }
        Relationships: [
          {
            foreignKeyName: "meal_log_foods_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_log_foods_meal_log_id_fkey"
            columns: ["meal_log_id"]
            isOneToOne: false
            referencedRelation: "meal_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_logs: {
        Row: {
          category: Database["public"]["Enums"]["meal_category"]
          created_at: string
          id: string
          logged_at: string
          name: string | null
          notes: string | null
          total_calories: number | null
          total_carbs_g: number | null
          total_fat_g: number | null
          total_fiber_g: number | null
          total_protein_g: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["meal_category"]
          created_at?: string
          id?: string
          logged_at?: string
          name?: string | null
          notes?: string | null
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          total_fiber_g?: number | null
          total_protein_g?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["meal_category"]
          created_at?: string
          id?: string
          logged_at?: string
          name?: string | null
          notes?: string | null
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          total_fiber_g?: number | null
          total_protein_g?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meal_template_foods: {
        Row: {
          created_at: string
          food_id: string
          id: string
          meal_template_id: string
          quantity: number
          unit: Database["public"]["Enums"]["food_unit"]
        }
        Insert: {
          created_at?: string
          food_id: string
          id?: string
          meal_template_id: string
          quantity: number
          unit: Database["public"]["Enums"]["food_unit"]
        }
        Update: {
          created_at?: string
          food_id?: string
          id?: string
          meal_template_id?: string
          quantity?: number
          unit?: Database["public"]["Enums"]["food_unit"]
        }
        Relationships: [
          {
            foreignKeyName: "meal_template_foods_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_template_foods_meal_template_id_fkey"
            columns: ["meal_template_id"]
            isOneToOne: false
            referencedRelation: "meal_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_templates: {
        Row: {
          category: Database["public"]["Enums"]["meal_category"]
          created_at: string
          description: string | null
          id: string
          name: string
          total_calories: number | null
          total_carbs_g: number | null
          total_fat_g: number | null
          total_fiber_g: number | null
          total_protein_g: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["meal_category"]
          created_at?: string
          description?: string | null
          id?: string
          name: string
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          total_fiber_g?: number | null
          total_protein_g?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["meal_category"]
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          total_fiber_g?: number | null
          total_protein_g?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      personal_records: {
        Row: {
          achieved_date: string
          created_at: string | null
          exercise_id: number | null
          id: number
          improvement_percentage: number | null
          previous_record: number | null
          record_type: string
          user_id: string | null
          value: number
          workout_completion_id: number | null
        }
        Insert: {
          achieved_date?: string
          created_at?: string | null
          exercise_id?: number | null
          id?: number
          improvement_percentage?: number | null
          previous_record?: number | null
          record_type: string
          user_id?: string | null
          value: number
          workout_completion_id?: number | null
        }
        Update: {
          achieved_date?: string
          created_at?: string | null
          exercise_id?: number | null
          id?: number
          improvement_percentage?: number | null
          previous_record?: number | null
          record_type?: string
          user_id?: string | null
          value?: number
          workout_completion_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_records_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_records_workout_completion_id_fkey"
            columns: ["workout_completion_id"]
            isOneToOne: false
            referencedRelation: "workout_completions"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_embeddings: {
        Row: {
          content_hash: string
          created_at: string | null
          embedding: string
          id: string
          metadata: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content_hash: string
          created_at?: string | null
          embedding: string
          id?: string
          metadata?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content_hash?: string
          created_at?: string | null
          embedding?: string
          id?: string
          metadata?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          about_me: string | null
          age: number | null
          areas_for_improvement: string | null
          available_equipment: string[] | null
          created_at: string | null
          dietary_preferences: string[] | null
          equipment_access: string | null
          experience_level:
            | Database["public"]["Enums"]["experience_level"]
            | null
          fitness_goals: string[] | null
          focus_areas: string[] | null
          full_name: string | null
          goal: string | null
          goals_embedding: string | null
          health_conditions: string | null
          id: string
          location: string | null
          motivation_factors: string[] | null
          notification_preferences: Json | null
          onboarding_completed: boolean | null
          physical_limitations: string[] | null
          preferred_activities: string[] | null
          preferred_workout_time: string | null
          primary_goal: string | null
          privacy_settings: Json | null
          session_duration: string | null
          strengths: string | null
          training_frequency: string | null
          updated_at: string | null
          weekly_hours: number | null
        }
        Insert: {
          about_me?: string | null
          age?: number | null
          areas_for_improvement?: string | null
          available_equipment?: string[] | null
          created_at?: string | null
          dietary_preferences?: string[] | null
          equipment_access?: string | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          fitness_goals?: string[] | null
          focus_areas?: string[] | null
          full_name?: string | null
          goal?: string | null
          goals_embedding?: string | null
          health_conditions?: string | null
          id: string
          location?: string | null
          motivation_factors?: string[] | null
          notification_preferences?: Json | null
          onboarding_completed?: boolean | null
          physical_limitations?: string[] | null
          preferred_activities?: string[] | null
          preferred_workout_time?: string | null
          primary_goal?: string | null
          privacy_settings?: Json | null
          session_duration?: string | null
          strengths?: string | null
          training_frequency?: string | null
          updated_at?: string | null
          weekly_hours?: number | null
        }
        Update: {
          about_me?: string | null
          age?: number | null
          areas_for_improvement?: string | null
          available_equipment?: string[] | null
          created_at?: string | null
          dietary_preferences?: string[] | null
          equipment_access?: string | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          fitness_goals?: string[] | null
          focus_areas?: string[] | null
          full_name?: string | null
          goal?: string | null
          goals_embedding?: string | null
          health_conditions?: string | null
          id?: string
          location?: string | null
          motivation_factors?: string[] | null
          notification_preferences?: Json | null
          onboarding_completed?: boolean | null
          physical_limitations?: string[] | null
          preferred_activities?: string[] | null
          preferred_workout_time?: string | null
          primary_goal?: string | null
          privacy_settings?: Json | null
          session_duration?: string | null
          strengths?: string | null
          training_frequency?: string | null
          updated_at?: string | null
          weekly_hours?: number | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          requests: number | null
          reset_at: string
          updated_at: string
          user_id: string | null
          window_seconds: number | null
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          requests?: number | null
          reset_at: string
          updated_at?: string
          user_id?: string | null
          window_seconds?: number | null
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          requests?: number | null
          reset_at?: string
          updated_at?: string
          user_id?: string | null
          window_seconds?: number | null
        }
        Relationships: []
      }
      rest_timer_preferences: {
        Row: {
          auto_start_timer: boolean | null
          created_at: string | null
          default_rest_seconds: number | null
          sound_enabled: boolean | null
          updated_at: string | null
          user_id: string
          vibration_enabled: boolean | null
        }
        Insert: {
          auto_start_timer?: boolean | null
          created_at?: string | null
          default_rest_seconds?: number | null
          sound_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
          vibration_enabled?: boolean | null
        }
        Update: {
          auto_start_timer?: boolean | null
          created_at?: string | null
          default_rest_seconds?: number | null
          sound_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
          vibration_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "rest_timer_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      set_performances: {
        Row: {
          actual_reps: number | null
          created_at: string | null
          exercise_id: number | null
          id: number
          notes: string | null
          rest_taken_seconds: number | null
          rpe: number | null
          session_id: number | null
          set_number: number
          target_reps: number | null
          user_id: string | null
          weight_kg: number | null
        }
        Insert: {
          actual_reps?: number | null
          created_at?: string | null
          exercise_id?: number | null
          id?: number
          notes?: string | null
          rest_taken_seconds?: number | null
          rpe?: number | null
          session_id?: number | null
          set_number: number
          target_reps?: number | null
          user_id?: string | null
          weight_kg?: number | null
        }
        Update: {
          actual_reps?: number | null
          created_at?: string | null
          exercise_id?: number | null
          id?: number
          notes?: string | null
          rest_taken_seconds?: number | null
          rpe?: number | null
          session_id?: number | null
          set_number?: number
          target_reps?: number | null
          user_id?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "set_performances_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_performances_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "active_workout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_performances_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_active_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_performances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      strava_connections: {
        Row: {
          access_token: string
          athlete_data: Json | null
          connected_at: string | null
          expires_at: string
          id: string
          last_sync_at: string | null
          refresh_token: string
          scope: string | null
          strava_athlete_id: number
          sync_enabled: boolean | null
          user_id: string | null
        }
        Insert: {
          access_token: string
          athlete_data?: Json | null
          connected_at?: string | null
          expires_at: string
          id?: string
          last_sync_at?: string | null
          refresh_token: string
          scope?: string | null
          strava_athlete_id: number
          sync_enabled?: boolean | null
          user_id?: string | null
        }
        Update: {
          access_token?: string
          athlete_data?: Json | null
          connected_at?: string | null
          expires_at?: string
          id?: string
          last_sync_at?: string | null
          refresh_token?: string
          scope?: string | null
          strava_athlete_id?: number
          sync_enabled?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "strava_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_context_embeddings: {
        Row: {
          content: string
          content_type: string
          created_at: string
          embedding: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          content: string
          content_type: string
          created_at?: string
          embedding: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          content?: string
          content_type?: string
          created_at?: string
          embedding?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_exercises: {
        Row: {
          category: string | null
          created_at: string | null
          equipment: string | null
          id: number
          instructions: string[] | null
          muscle_group: string | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          equipment?: string | null
          id?: never
          instructions?: string[] | null
          muscle_group?: string | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          equipment?: string | null
          id?: never
          instructions?: string[] | null
          muscle_group?: string | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_exercises_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_food_frequency: {
        Row: {
          created_at: string | null
          favorite: boolean | null
          food_id: string
          id: string
          last_logged_at: string | null
          last_quantity: number | null
          last_unit: Database["public"]["Enums"]["food_unit"] | null
          log_count: number | null
          total_quantity_logged: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          favorite?: boolean | null
          food_id: string
          id?: string
          last_logged_at?: string | null
          last_quantity?: number | null
          last_unit?: Database["public"]["Enums"]["food_unit"] | null
          log_count?: number | null
          total_quantity_logged?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          favorite?: boolean | null
          food_id?: string
          id?: string
          last_logged_at?: string | null
          last_quantity?: number | null
          last_unit?: Database["public"]["Enums"]["food_unit"] | null
          log_count?: number | null
          total_quantity_logged?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_food_frequency_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
        ]
      }
      user_goals: {
        Row: {
          completed_at: string | null
          created_at: string | null
          goal_description: string
          goal_type: Database["public"]["Enums"]["goal_type"]
          id: string
          is_active: boolean | null
          priority: number | null
          progress_notes: string | null
          progress_value: number | null
          status: Database["public"]["Enums"]["goal_status"] | null
          target_date: string | null
          target_unit: string | null
          target_value: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          goal_description: string
          goal_type: Database["public"]["Enums"]["goal_type"]
          id?: string
          is_active?: boolean | null
          priority?: number | null
          progress_notes?: string | null
          progress_value?: number | null
          status?: Database["public"]["Enums"]["goal_status"] | null
          target_date?: string | null
          target_unit?: string | null
          target_value?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          goal_description?: string
          goal_type?: Database["public"]["Enums"]["goal_type"]
          id?: string
          is_active?: boolean | null
          priority?: number | null
          progress_notes?: string | null
          progress_value?: number | null
          status?: Database["public"]["Enums"]["goal_status"] | null
          target_date?: string | null
          target_unit?: string | null
          target_value?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_meal_patterns: {
        Row: {
          created_at: string | null
          day_of_week: number | null
          food_id: string | null
          frequency: number | null
          id: string
          meal_category: Database["public"]["Enums"]["meal_category"] | null
          typical_time: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          day_of_week?: number | null
          food_id?: string | null
          frequency?: number | null
          id?: string
          meal_category?: Database["public"]["Enums"]["meal_category"] | null
          typical_time?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number | null
          food_id?: string | null
          frequency?: number | null
          id?: string
          meal_category?: Database["public"]["Enums"]["meal_category"] | null
          typical_time?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_meal_patterns_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
        ]
      }
      user_nutrition_preferences: {
        Row: {
          allergens: string[] | null
          created_at: string | null
          daily_calorie_goal: number | null
          daily_carbs_goal: number | null
          daily_fat_goal: number | null
          daily_fiber_goal: number | null
          daily_protein_goal: number | null
          default_meal_category:
            | Database["public"]["Enums"]["meal_category"]
            | null
          dietary_restrictions: string[] | null
          id: string
          preferred_units: Database["public"]["Enums"]["food_unit"] | null
          track_micronutrients: boolean | null
          track_water: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allergens?: string[] | null
          created_at?: string | null
          daily_calorie_goal?: number | null
          daily_carbs_goal?: number | null
          daily_fat_goal?: number | null
          daily_fiber_goal?: number | null
          daily_protein_goal?: number | null
          default_meal_category?:
            | Database["public"]["Enums"]["meal_category"]
            | null
          dietary_restrictions?: string[] | null
          id?: string
          preferred_units?: Database["public"]["Enums"]["food_unit"] | null
          track_micronutrients?: boolean | null
          track_water?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allergens?: string[] | null
          created_at?: string | null
          daily_calorie_goal?: number | null
          daily_carbs_goal?: number | null
          daily_fat_goal?: number | null
          daily_fiber_goal?: number | null
          daily_protein_goal?: number | null
          default_meal_category?:
            | Database["public"]["Enums"]["meal_category"]
            | null
          dietary_restrictions?: string[] | null
          id?: string
          preferred_units?: Database["public"]["Enums"]["food_unit"] | null
          track_micronutrients?: boolean | null
          track_water?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_quick_foods: {
        Row: {
          category: string | null
          created_at: string | null
          display_order: number | null
          food_id: string
          id: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          display_order?: number | null
          food_id: string
          id?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          display_order?: number | null
          food_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quick_foods_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          auto_sync_activities: boolean | null
          created_at: string | null
          default_activity_privacy: string | null
          notifications_enabled: boolean | null
          preferred_units: string | null
          preferred_workout_days: string[] | null
          preferred_workout_time: string | null
          updated_at: string | null
          user_id: string
          watch_type: string | null
        }
        Insert: {
          auto_sync_activities?: boolean | null
          created_at?: string | null
          default_activity_privacy?: string | null
          notifications_enabled?: boolean | null
          preferred_units?: string | null
          preferred_workout_days?: string[] | null
          preferred_workout_time?: string | null
          updated_at?: string | null
          user_id: string
          watch_type?: string | null
        }
        Update: {
          auto_sync_activities?: boolean | null
          created_at?: string | null
          default_activity_privacy?: string | null
          notifications_enabled?: boolean | null
          preferred_units?: string | null
          preferred_workout_days?: string[] | null
          preferred_workout_time?: string | null
          updated_at?: string | null
          user_id?: string
          watch_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_workouts: {
        Row: {
          completed: boolean | null
          created_at: string | null
          current_exercise_index: number | null
          current_set_index: number | null
          id: number
          paused_at: string | null
          paused_duration_seconds: number | null
          scheduled_date: string
          started_at: string | null
          status: string | null
          user_id: string | null
          workout_id: number | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          current_exercise_index?: number | null
          current_set_index?: number | null
          id?: number
          paused_at?: string | null
          paused_duration_seconds?: number | null
          scheduled_date: string
          started_at?: string | null
          status?: string | null
          user_id?: string | null
          workout_id?: number | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          current_exercise_index?: number | null
          current_set_index?: number | null
          id?: number
          paused_at?: string | null
          paused_duration_seconds?: number | null
          scheduled_date?: string
          started_at?: string | null
          status?: string | null
          user_id?: string | null
          workout_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_workouts_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "popular_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_workouts_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "user_favorite_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_workouts_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_workouts_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts_with_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          athlete_id: number | null
          created_at: string | null
          error: string | null
          event_type: string
          id: string
          object_id: string | null
          object_type: string | null
          payload: Json | null
          processed: boolean | null
          processed_at: string | null
          source: string
        }
        Insert: {
          athlete_id?: number | null
          created_at?: string | null
          error?: string | null
          event_type: string
          id?: string
          object_id?: string | null
          object_type?: string | null
          payload?: Json | null
          processed?: boolean | null
          processed_at?: string | null
          source: string
        }
        Update: {
          athlete_id?: number | null
          created_at?: string | null
          error?: string | null
          event_type?: string
          id?: string
          object_id?: string | null
          object_type?: string | null
          payload?: Json | null
          processed?: boolean | null
          processed_at?: string | null
          source?: string
        }
        Relationships: []
      }
      workout_completions: {
        Row: {
          completed_at: string | null
          difficulty_rating: number | null
          duration_minutes: number | null
          embedding: string | null
          energy_level: number | null
          id: number
          mood: string | null
          notes: string | null
          rpe: number | null
          started_at: string | null
          total_pause_duration_seconds: number | null
          user_id: string | null
          user_workout_id: number | null
          workout_id: number | null
          workout_rating: number | null
          would_repeat: boolean | null
        }
        Insert: {
          completed_at?: string | null
          difficulty_rating?: number | null
          duration_minutes?: number | null
          embedding?: string | null
          energy_level?: number | null
          id?: number
          mood?: string | null
          notes?: string | null
          rpe?: number | null
          started_at?: string | null
          total_pause_duration_seconds?: number | null
          user_id?: string | null
          user_workout_id?: number | null
          workout_id?: number | null
          workout_rating?: number | null
          would_repeat?: boolean | null
        }
        Update: {
          completed_at?: string | null
          difficulty_rating?: number | null
          duration_minutes?: number | null
          embedding?: string | null
          energy_level?: number | null
          id?: number
          mood?: string | null
          notes?: string | null
          rpe?: number | null
          started_at?: string | null
          total_pause_duration_seconds?: number | null
          user_id?: string | null
          user_workout_id?: number | null
          workout_id?: number | null
          workout_rating?: number | null
          would_repeat?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_completions_user_workout_id_fkey"
            columns: ["user_workout_id"]
            isOneToOne: false
            referencedRelation: "user_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_completions_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "popular_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_completions_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "user_favorite_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_completions_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_completions_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts_with_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercises: {
        Row: {
          exercise_id: number | null
          id: number
          notes: string | null
          order_index: number
          reps: string
          rest_seconds: number | null
          sets: number
          user_exercise_id: number | null
          workout_id: number | null
        }
        Insert: {
          exercise_id?: number | null
          id?: number
          notes?: string | null
          order_index: number
          reps: string
          rest_seconds?: number | null
          sets: number
          user_exercise_id?: number | null
          workout_id?: number | null
        }
        Update: {
          exercise_id?: number | null
          id?: number
          notes?: string | null
          order_index?: number
          reps?: string
          rest_seconds?: number | null
          sets?: number
          user_exercise_id?: number | null
          workout_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_user_exercise_id_fkey"
            columns: ["user_exercise_id"]
            isOneToOne: false
            referencedRelation: "user_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "popular_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "user_favorite_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts_with_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_tags: {
        Row: {
          category: string | null
          created_at: string | null
          id: number
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: number
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      workout_templates: {
        Row: {
          based_on_workout_id: number | null
          created_at: string | null
          description: string | null
          id: number
          is_public: boolean | null
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          based_on_workout_id?: number | null
          created_at?: string | null
          description?: string | null
          id?: number
          is_public?: boolean | null
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          based_on_workout_id?: number | null
          created_at?: string | null
          description?: string | null
          id?: number
          is_public?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_templates_based_on_workout_id_fkey"
            columns: ["based_on_workout_id"]
            isOneToOne: false
            referencedRelation: "popular_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_templates_based_on_workout_id_fkey"
            columns: ["based_on_workout_id"]
            isOneToOne: false
            referencedRelation: "user_favorite_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_templates_based_on_workout_id_fkey"
            columns: ["based_on_workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_templates_based_on_workout_id_fkey"
            columns: ["based_on_workout_id"]
            isOneToOne: false
            referencedRelation: "workouts_with_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_workout_tags: {
        Row: {
          tag_id: number
          workout_id: number
        }
        Insert: {
          tag_id: number
          workout_id: number
        }
        Update: {
          tag_id?: number
          workout_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "workout_workout_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "workout_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_workout_tags_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "popular_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_workout_tags_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "user_favorite_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_workout_tags_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_workout_tags_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts_with_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string | null
          description: string | null
          difficulty: string | null
          duration_minutes: number | null
          estimated_duration_minutes: number | null
          goal: string | null
          id: number
          is_public: boolean
          name: string
          popularity_score: number | null
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          estimated_duration_minutes?: number | null
          goal?: string | null
          id?: number
          is_public?: boolean
          name: string
          popularity_score?: number | null
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          estimated_duration_minutes?: number | null
          goal?: string | null
          id?: number
          is_public?: boolean
          name?: string
          popularity_score?: number | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      popular_workouts: {
        Row: {
          avg_rating: number | null
          completion_count: number | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          duration_minutes: number | null
          estimated_duration_minutes: number | null
          goal: string | null
          id: number | null
          name: string | null
          popularity_score: number | null
          type: string | null
          unique_users: number | null
        }
        Relationships: []
      }
      user_active_sessions: {
        Row: {
          created_at: string | null
          current_exercise_index: number | null
          current_set_index: number | null
          difficulty: string | null
          exercise_completions: Json | null
          id: number | null
          paused_at: string | null
          resumed_at: string | null
          started_at: string | null
          status: string | null
          total_pause_duration_seconds: number | null
          updated_at: string | null
          user_id: string | null
          user_name: string | null
          user_workout_id: number | null
          workout_id: number | null
          workout_name: string | null
          workout_type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "active_workout_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_workout_sessions_user_workout_id_fkey"
            columns: ["user_workout_id"]
            isOneToOne: false
            referencedRelation: "user_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_workout_sessions_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "popular_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_workout_sessions_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "user_favorite_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_workout_sessions_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_workout_sessions_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts_with_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorite_workouts: {
        Row: {
          created_at: string | null
          description: string | null
          difficulty: string | null
          duration_minutes: number | null
          estimated_duration_minutes: number | null
          favorited_at: string | null
          goal: string | null
          id: number | null
          name: string | null
          popularity_score: number | null
          type: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favorite_workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_muscle_group_frequency: {
        Row: {
          frequency: number | null
          last_trained: string | null
          muscle_group: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_pr_summary: {
        Row: {
          exercise_name: string | null
          last_pr_date: string | null
          max_reps: number | null
          max_volume: number | null
          max_weight: number | null
          muscle_group: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_volume_by_date: {
        Row: {
          exercises_performed: number | null
          total_volume: number | null
          user_id: string | null
          workout_date: string | null
          workouts_completed: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts_with_exercises: {
        Row: {
          created_at: string | null
          description: string | null
          difficulty: string | null
          duration_minutes: number | null
          estimated_duration_minutes: number | null
          goal: string | null
          id: number | null
          name: string | null
          popularity_score: number | null
          type: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      calculate_nutrition: {
        Args: {
          base_serving: number
          base_unit: Database["public"]["Enums"]["food_unit"]
          base_value: number
          from_unit: Database["public"]["Enums"]["food_unit"]
          quantity: number
        }
        Returns: number
      }
      calculate_user_stats: {
        Args: { user_id: string }
        Returns: {
          currentstreak: number
          favoriteactivity: string
          goalscompleted: number
          progressthisweek: number
          totalminutes: number
          totalworkouts: number
        }[]
      }
      check_and_record_pr: {
        Args: {
          p_completion_id: number
          p_exercise_id: number
          p_reps: number
          p_user_id: string
          p_weight: number
        }
        Returns: {
          is_pr: boolean
          new_value: number
          old_value: number
          pr_type: string
        }[]
      }
      complete_workout_session: {
        Args: { p_notes?: string; p_rating?: number; p_session_id: number }
        Returns: boolean
      }
      delete_workout_history: {
        Args: { p_user_id: string; p_user_workout_id: number }
        Returns: boolean
      }
      edit_workout_completion: {
        Args: {
          p_completion_id: number
          p_duration_seconds?: number
          p_notes?: string
          p_rating?: number
          p_user_id: string
        }
        Returns: boolean
      }
      find_empty_workouts: {
        Args: Record<PropertyKey, never>
        Returns: {
          has_exercises: boolean
          workout_id: number
          workout_name: string
          workout_type: string
        }[]
      }
      generate_week_workouts: {
        Args: { p_goal: string; p_user_id: string }
        Returns: undefined
      }
      get_dashboard_workouts: {
        Args: { p_user_id: string }
        Returns: {
          description: string
          difficulty: string
          duration_minutes: number
          exercise_count: number
          is_favorite: boolean
          is_public: boolean
          owner_user_id: string
          workout_goal: string
          workout_id: number
          workout_name: string
          workout_type: string
        }[]
      }
      get_meal_suggestions: {
        Args: {
          p_meal_category?: Database["public"]["Enums"]["meal_category"]
          p_user_id: string
        }
        Returns: {
          suggested_foods: Json
          suggestion_reason: string
        }[]
      }
      get_personalized_foods: {
        Args: { p_limit?: number; p_search_query?: string; p_user_id: string }
        Returns: {
          brand: string
          calories: number
          carbs_g: number
          fat_g: number
          food_id: string
          is_favorite: boolean
          last_logged_at: string
          log_count: number
          name: string
          protein_g: number
          relevance_score: number
          serving_size: number
          serving_unit: Database["public"]["Enums"]["food_unit"]
        }[]
      }
      get_rag_context_for_user: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_session_exercises: {
        Args: { p_session_id: number }
        Returns: {
          equipment: string
          exercise_category: string
          exercise_id: number
          exercise_name: string
          last_weight_used: number
          muscle_group: string
          notes: string
          order_index: number
          reps_planned: string
          rest_seconds: number
          sets_completed: number
          sets_planned: number
        }[]
      }
      get_user_workout_history: {
        Args: { p_limit?: number; p_offset?: number; p_user_id: string }
        Returns: {
          completed_at: string
          completion_id: number
          duration_seconds: number
          notes: string
          rating: number
          sets_performed: number
          total_weight_lifted: number
          workout_id: number
          workout_name: string
          workout_type: string
        }[]
      }
      get_user_workout_stats: {
        Args: { p_days?: number; p_user_id: string }
        Returns: {
          avg_workout_duration: number
          current_streak: number
          favorite_muscle_group: string
          total_exercises: number
          total_volume: number
          total_workouts: number
        }[]
      }
      get_weekly_activity_stats: {
        Args: { p_start_date?: string; p_user_id: string }
        Returns: {
          activity_type: string
          avg_heartrate: number
          total_calories: number
          total_count: number
          total_distance_km: number
          total_duration_minutes: number
        }[]
      }
      get_workout_details: {
        Args: { p_workout_id: number }
        Returns: {
          description: string
          difficulty: string
          duration_minutes: number
          exercise_count: number
          workout_goal: string
          workout_id: number
          workout_name: string
          workout_type: string
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete: {
        Args:
          | { content: string; content_type: string; uri: string }
          | { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_get: {
        Args: { data: Json; uri: string } | { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post: {
        Args:
          | { content: string; content_type: string; uri: string }
          | { data: Json; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_put: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      import_strava_activity: {
        Args: { p_activity_data: Json; p_user_id: string }
        Returns: string
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      log_set_performance: {
        Args: {
          p_exercise_id: number
          p_notes?: string
          p_reps?: number
          p_session_id: number
          p_set_number: number
          p_weight?: number
        }
        Returns: number
      }
      match_goal_embeddings: {
        Args: {
          match_count?: number
          match_threshold?: number
          match_user_id: string
          query_embedding: string
        }
        Returns: {
          content_hash: string
          created_at: string
          goal_id: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      match_profile_embeddings: {
        Args: {
          match_count?: number
          match_threshold?: number
          match_user_id: string
          query_embedding: string
        }
        Returns: {
          content_hash: string
          created_at: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      refresh_strava_token: {
        Args: { p_user_id: string }
        Returns: {
          access_token: string
          expires_at: string
        }[]
      }
      search_user_context: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
          target_user_id: string
        }
        Returns: {
          content: string
          content_type: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      search_workouts: {
        Args: {
          p_difficulty?: string
          p_favorites_only?: boolean
          p_max_duration?: number
          p_search_term?: string
          p_type?: string
          p_user_id?: string
        }
        Returns: {
          avg_rating: number
          completion_count: number
          description: string
          difficulty: string
          duration_minutes: number
          is_favorite: boolean
          workout_goal: string
          workout_id: number
          workout_name: string
          workout_type: string
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      start_workout_session: {
        Args: { p_user_id: string; p_workout_id: number }
        Returns: number
      }
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      toggle_favorite_workout: {
        Args: { p_user_id: string; p_workout_id: number }
        Returns: boolean
      }
      toggle_workout_pause: {
        Args: { p_session_id: number }
        Returns: string
      }
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string }
        Returns: string
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      experience_level: "beginner" | "intermediate" | "advanced" | "expert"
      food_unit:
        | "g"
        | "ml"
        | "oz"
        | "cup"
        | "tbsp"
        | "tsp"
        | "serving"
        | "piece"
        | "slice"
      goal_status: "active" | "completed" | "paused" | "archived"
      goal_type:
        | "weight_loss"
        | "muscle_gain"
        | "strength"
        | "endurance"
        | "flexibility"
        | "general_fitness"
        | "sport_specific"
        | "rehabilitation"
        | "habit_formation"
        | "nutrition"
        | "custom"
      meal_category:
        | "breakfast"
        | "lunch"
        | "dinner"
        | "snack"
        | "pre_workout"
        | "post_workout"
        | "other"
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      experience_level: ["beginner", "intermediate", "advanced", "expert"],
      food_unit: [
        "g",
        "ml",
        "oz",
        "cup",
        "tbsp",
        "tsp",
        "serving",
        "piece",
        "slice",
      ],
      goal_status: ["active", "completed", "paused", "archived"],
      goal_type: [
        "weight_loss",
        "muscle_gain",
        "strength",
        "endurance",
        "flexibility",
        "general_fitness",
        "sport_specific",
        "rehabilitation",
        "habit_formation",
        "nutrition",
        "custom",
      ],
      meal_category: [
        "breakfast",
        "lunch",
        "dinner",
        "snack",
        "pre_workout",
        "post_workout",
        "other",
      ],
    },
  },
} as const
