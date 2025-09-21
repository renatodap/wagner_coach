export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export const EXPERIENCE_LEVELS: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];

export function isValidExperienceLevel(value: string): value is ExperienceLevel {
  return EXPERIENCE_LEVELS.includes(value as ExperienceLevel);
}

export type GoalType =
  | 'weight_loss'
  | 'muscle_gain'
  | 'strength'
  | 'endurance'
  | 'flexibility'
  | 'general_fitness'
  | 'sport_specific'
  | 'rehabilitation'
  | 'habit_formation'
  | 'nutrition'
  | 'custom';

export type GoalStatus = 'active' | 'completed' | 'paused' | 'archived';

export const GOAL_TYPES: GoalType[] = [
  'weight_loss',
  'muscle_gain',
  'strength',
  'endurance',
  'flexibility',
  'general_fitness',
  'sport_specific',
  'rehabilitation',
  'habit_formation',
  'nutrition',
  'custom'
];

export function isValidGoalType(value: string): value is GoalType {
  return GOAL_TYPES.includes(value as GoalType);
}

export interface Profile {
  id: string;
  user_id: string;
  full_name?: string | null;
  age?: number | null;
  height?: number | null;
  weight?: number | null;
  about_me?: string | null;
  experience_level?: ExperienceLevel | null;
  fitness_goals?: string[] | null;
  preferred_activities?: string[] | null;
  motivation_factors?: string[] | null;
  physical_limitations?: string[] | null;
  available_equipment?: string[] | null;
  training_frequency?: string | null;
  session_duration?: string | null;
  dietary_preferences?: string[] | null;
  notification_preferences?: Record<string, any> | null;
  privacy_settings?: Record<string, any> | null;
  goals_embedding?: number[] | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdate {
  full_name?: string | null;
  age?: number | null;
  height?: number | null;
  weight?: number | null;
  about_me?: string | null;
  experience_level?: ExperienceLevel | null;
  fitness_goals?: string[] | null;
  preferred_activities?: string[] | null;
  motivation_factors?: string[] | null;
  physical_limitations?: string[] | null;
  available_equipment?: string[] | null;
  training_frequency?: string | null;
  session_duration?: string | null;
  dietary_preferences?: string[] | null;
  notification_preferences?: Record<string, any> | null;
  privacy_settings?: Record<string, any> | null;
}

export interface UserGoal {
  id: string;
  user_id: string;
  goal_type: GoalType;
  goal_description: string;
  target_value?: number | null;
  target_unit?: string | null;
  target_date?: string | null;
  priority: number;
  status: GoalStatus;
  is_active: boolean;
  progress_value?: number | null;
  progress_notes?: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

export interface UserGoalInsert {
  goal_type: GoalType;
  description: string;
  target_value?: number | null;
  target_unit?: string | null;
  target_date?: string | null;
  priority?: number;
  status?: GoalStatus;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ProfileFormData extends ProfileUpdate {
  goals?: UserGoalInsert[];
}

export const ProfileValidation = {
  height: {
    min: 30,
    max: 300
  },
  weight: {
    min: 20,
    max: 500
  },
  maxArrayLength: 20,
  maxTextLength: 2000
} as const;

export function validateProfile(profile: ProfileUpdate): ValidationResult {
  const errors: string[] = [];

  if (profile.age !== undefined && profile.age !== null && (profile.age < 13 || profile.age > 120)) {
    errors.push('Age must be between 13 and 120');
  }

  if (profile.height !== undefined && profile.height !== null && (profile.height < 30 || profile.height > 300)) {
    errors.push('Height must be between 30-300 cm');
  }

  if (profile.weight !== undefined && profile.weight !== null && (profile.weight < 20 || profile.weight > 500)) {
    errors.push('Weight must be between 20-500 kg');
  }

  if (profile.experience_level && !isValidExperienceLevel(profile.experience_level)) {
    errors.push('Invalid experience level');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}