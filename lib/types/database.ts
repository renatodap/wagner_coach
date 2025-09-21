// Database record types for AI Coach feature

export interface WorkoutCompletionRecord {
  id: number;
  user_id: string;
  workout_id: number;
  started_at: string;
  completed_at: string;
  duration_minutes?: number;
  notes?: string;
  workout_rating?: number;
  workouts?: {
    name: string;
    type: string;
    goal?: string;
    difficulty?: string;
  };
}

export interface PersonalRecordRow {
  id: number;
  user_id: string;
  exercise_id: number;
  record_type: string;
  value: number;
  achieved_date: string;
  previous_record?: number;
  exercises?: {
    name: string;
  };
}

export interface FavoriteWorkoutRow {
  id: number;
  user_id: string;
  workout_id: number;
  workouts?: {
    name: string;
    type: string;
  };
}

export interface ConversationRecord {
  id: string;
  user_id: string;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    timestamp: Date;
  }>;
  created_at: string;
  updated_at: string;
}

export interface ProfileRecord {
  id: string;
  full_name?: string;
  goal?: 'build_muscle' | 'lose_weight' | 'gain_strength';
  onboarding_completed?: boolean;
  created_at: string;
  updated_at: string;
}