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
        }
        Update: {
          preferred_workout_days?: string[]
          preferred_workout_time?: string | null
          notifications_enabled?: boolean
          updated_at?: string
        }
      }
    }
  }
}