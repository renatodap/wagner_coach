// Profile System Type Definitions

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type GoalType =
  | 'weight_loss'
  | 'muscle_gain'
  | 'strength'
  | 'endurance'
  | 'flexibility'
  | 'general_fitness'
  | 'sports_performance'
  | 'rehabilitation'
  | 'other';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  age: number | null;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  created_at: string;
  updated_at: string;

  // New extended fields
  about_me: string | null;
  experience_level: ExperienceLevel | null;
  fitness_goals: string[] | null;
  motivation_factors: string[] | null;
  preferred_activities: string[] | null;
  physical_limitations: string[] | null;
  available_equipment: string[] | null;
  training_frequency: string | null;
  session_duration: string | null;
  dietary_preferences: string[] | null;
  height: number | null; // in cm
  weight: number | null; // in kg
  timezone: string | null;
  notification_preferences: NotificationPreferences | null;
}

export interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  workout_reminders: boolean;
  progress_updates: boolean;
  coach_messages: boolean;
  reminder_time: string | null; // HH:MM format
  weekly_summary: boolean;
}

export interface UserGoal {
  id: string;
  user_id: string;
  goal_type: GoalType;
  goal_description: string;
  target_value: number | null;
  target_unit: string | null;
  target_date: string | null; // ISO date string
  priority: number; // 1-5
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileEmbedding {
  id: string;
  user_id: string;
  content_hash: string;
  embedding: number[]; // Vector of 1536 dimensions
  metadata: {
    source_field: string;
    generated_at: string;
    model: string;
  };
  created_at: string;
}

export interface GoalEmbedding {
  id: string;
  goal_id: string;
  user_id: string;
  content_hash: string;
  embedding: number[]; // Vector of 1536 dimensions
  metadata: {
    source_field: string;
    generated_at: string;
    model: string;
  };
  created_at: string;
}

// Input types for creating/updating

export interface ProfileUpdate {
  full_name?: string | null;
  age?: number | null;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  about_me?: string | null;
  experience_level?: ExperienceLevel | null;
  fitness_goals?: string[] | null;
  motivation_factors?: string[] | null;
  preferred_activities?: string[] | null;
  physical_limitations?: string[] | null;
  available_equipment?: string[] | null;
  training_frequency?: string | null;
  session_duration?: string | null;
  dietary_preferences?: string[] | null;
  height?: number | null;
  weight?: number | null;
  timezone?: string | null;
  notification_preferences?: NotificationPreferences | null;
}

export interface UserGoalInsert {
  goal_type: GoalType;
  goal_description: string;
  target_value?: number | null;
  target_unit?: string | null;
  target_date?: string | null;
  priority?: number;
  is_active?: boolean;
}

export interface UserGoalUpdate {
  goal_type?: GoalType;
  goal_description?: string;
  target_value?: number | null;
  target_unit?: string | null;
  target_date?: string | null;
  priority?: number;
  is_active?: boolean;
}

// Context types for AI integration

export interface ProfileContext {
  profile: Profile;
  goals: UserGoal[];
  recentActivity?: {
    lastWorkout: string | null;
    weeklyFrequency: number;
    totalWorkouts: number;
  };
}

export interface ProfileContextWithEmbeddings extends ProfileContext {
  profileEmbeddings: ProfileEmbedding[];
  goalEmbeddings: GoalEmbedding[];
}

// API Response types

export interface ProfileResponse {
  success: boolean;
  data?: Profile;
  error?: string;
}

export interface GoalsResponse {
  success: boolean;
  data?: UserGoal[];
  error?: string;
}

export interface GoalResponse {
  success: boolean;
  data?: UserGoal;
  error?: string;
}

export interface EmbeddingGenerationResponse {
  success: boolean;
  profileEmbeddingsGenerated?: number;
  goalEmbeddingsGenerated?: number;
  error?: string;
}

// Validation schemas (for runtime validation)

export const ProfileValidation = {
  experience_level: ['beginner', 'intermediate', 'advanced'],
  priority: { min: 1, max: 5 },
  height: { min: 50, max: 300 }, // cm
  weight: { min: 20, max: 500 }, // kg
  maxArrayLength: 20,
  maxTextLength: 2000,
};

// Helper type guards

export function isValidExperienceLevel(level: string): level is ExperienceLevel {
  return ['beginner', 'intermediate', 'advanced'].includes(level);
}

export function isValidGoalType(type: string): type is GoalType {
  return [
    'weight_loss',
    'muscle_gain',
    'strength',
    'endurance',
    'flexibility',
    'general_fitness',
    'sports_performance',
    'rehabilitation',
    'other'
  ].includes(type);
}

export function isValidPriority(priority: number): boolean {
  return priority >= 1 && priority <= 5;
}

// Database table names (for type safety)
export const ProfileTables = {
  PROFILES: 'profiles',
  USER_GOALS: 'user_goals',
  PROFILE_EMBEDDINGS: 'profile_embeddings',
  GOAL_EMBEDDINGS: 'goal_embeddings',
} as const;