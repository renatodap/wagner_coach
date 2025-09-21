export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface ProfileUpdate {
  id?: string;
  email?: string;
  full_name?: string;
  age?: number;
  height?: number;
  weight?: number;
  experience_level?: ExperienceLevel;
  fitness_goals?: string[];
  motivation_factors?: string[];
  preferred_activities?: string[];
  physical_limitations?: string[];
  available_equipment?: string[];
  dietary_preferences?: string[];
  about_me?: string;
  avatar_url?: string;
  updated_at?: string;
}

export interface UserGoalInsert {
  id?: string;
  user_id?: string;
  goal_type: GoalType;
  target_value?: number;
  target_date?: string;
  description?: string;
  status?: 'active' | 'paused' | 'completed';
  created_at?: string;
  updated_at?: string;
}

export type GoalType =
  | 'weight_loss'
  | 'muscle_gain'
  | 'endurance'
  | 'strength'
  | 'flexibility'
  | 'general_fitness'
  | 'sport_specific'
  | 'recovery'
  | 'custom';

export const ProfileValidation = {
  height: {
    min: 100,
    max: 250
  },
  weight: {
    min: 30,
    max: 300
  },
  maxArrayLength: 50,
  maxTextLength: 1000
};

export function isValidExperienceLevel(level: any): level is ExperienceLevel {
  return ['beginner', 'intermediate', 'advanced'].includes(level);
}