/**
 * TypeScript types for Consultation API
 *
 * Mirrors backend Pydantic models for type safety
 */

// =====================================================
// SPECIALIST TYPES
// =====================================================

export type SpecialistType =
  | 'unified_coach'
  | 'nutritionist'
  | 'trainer'
  | 'physiotherapist'
  | 'sports_psychologist';

export type ConversationStage =
  | 'introduction'
  | 'discovery'
  | 'health_history'
  | 'goals'
  | 'preferences'
  | 'wrap_up'
  | 'eating_patterns'
  | 'dietary_preferences'
  | 'fitness_background'
  | 'current_routine'
  | 'goals_timeline'
  | 'limitations'
  | 'current_issues'
  | 'injury_history'
  | 'movement_assessment'
  | 'recovery_patterns'
  | 'performance_mindset'
  | 'mental_barriers'
  | 'motivation_factors'
  | 'coping_strategies'
  | 'primary_goals'
  | 'current_state'
  | 'limitations_preferences'
  | 'lifestyle_factors'
  | 'success_metrics';

export type ConsultationStatus = 'active' | 'completed' | 'paused' | 'abandoned';

export type MessageRole = 'user' | 'assistant' | 'system';

// =====================================================
// REQUEST TYPES
// =====================================================

export interface StartConsultationRequest {
  specialist_type: SpecialistType;
}

export interface SendMessageRequest {
  message: string;
}

export interface CompleteConsultationRequest {
  generate_program?: boolean;
}

export interface UpdateRecommendationRequest {
  status: 'accepted' | 'rejected' | 'completed';
  feedback?: string;
  feedback_rating?: number; // 1-5
}

export interface GenerateDailyPlanRequest {
  target_date?: string; // ISO date
}

// =====================================================
// RESPONSE TYPES
// =====================================================

export interface ConsultationSession {
  session_id: string;
  specialist_type: SpecialistType;
  conversation_stage: ConversationStage;
  progress_percentage: number;
  initial_question?: string;
}

export interface ConsultationMessage {
  session_id: string;
  status: 'active' | 'ready_to_complete';
  next_question?: string;
  extracted_data?: Record<string, any>;
  conversation_stage: ConversationStage;
  progress_percentage: number;
  is_complete: boolean;
  wrap_up_message?: string;
  extraction_summary?: ConsultationSummary;

  // Goal-driven consultation fields
  goals_met?: number; // Number of goals completed (e.g., 4)
  goals_total?: number; // Total number of goals (e.g., 10)
  goals_detail?: Record<string, string>; // Goal status map (e.g., {"primary_fitness_goal": "✅ Identified", "measurements": "⏳ Pending"})
  logged_items?: Array<{
    // Items auto-logged during consultation
    type: string; // "meal" or "activity"
    content: string; // "Breakfast: 3 eggs, oatmeal, banana"
  }>;

  // Limit tracking fields
  minutes_elapsed?: number; // Minutes since consultation started
  messages_sent?: number; // Number of messages sent in consultation
  approaching_limit?: boolean; // True if approaching 30 min or 50 messages limit
}

export interface ConsultationSummary {
  health_history?: {
    medical_conditions?: string[];
    medications?: string[];
    supplements?: string[];
    allergies?: string[];
  };
  nutrition_patterns?: {
    meals_per_day?: number;
    meal_times?: string[];
    problem_foods?: string[];
    dining_out_frequency?: string;
  };
  training_history?: {
    years_training?: number;
    previous_programs?: string[];
    experience_level?: string;
  };
  goals?: {
    primary_goal?: string;
    target_weight?: number;
    timeline?: string;
    specific_targets?: string[];
  };
  preferences?: {
    equipment_access?: string[];
    dietary_restrictions?: string[];
    preferred_time?: string;
    workout_environment?: string;
    training_frequency?: number;
  };
  measurements?: {
    current_weight_kg?: number;
    height_cm?: number;
    age?: number;
    biological_sex?: 'male' | 'female';
  };
  lifestyle?: {
    sleep_quality?: number;
    stress_level?: number;
    recovery_ability?: string;
  };
  psychology?: {
    mental_approach?: string;
    confidence_level?: number;
    motivation_factors?: string[];
  };
  _metadata?: {
    specialist_type: SpecialistType;
    total_messages: number;
    session_duration_minutes?: number;
  };
}

export interface CompleteConsultationResponse {
  session_id: string;
  status: 'completed';
  summary: ConsultationSummary;
  program_id?: string;
}

// =====================================================
// RECOMMENDATION TYPES
// =====================================================

export type RecommendationType =
  | 'meal'
  | 'workout'
  | 'rest'
  | 'hydration'
  | 'supplement'
  | 'note'
  | 'check_in';

export type RecommendationStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'completed'
  | 'expired';

export interface MealRecommendation {
  meal_name: string;
  foods: string[];
  preparation?: string;
  estimated_calories: number;
  estimated_protein_g: number;
  estimated_carbs_g?: number;
  estimated_fat_g?: number;
}

export interface WorkoutRecommendation {
  workout_name: string;
  workout_type: string;
  duration_minutes: number;
  exercises?: Array<{
    exercise_name: string;
    sets?: number;
    reps?: string;
    rest_seconds?: number;
    notes?: string;
  }>;
  equipment_needed?: string[];
  warmup_notes?: string;
  cooldown_notes?: string;
  note?: string;
}

export interface Recommendation {
  id: string;
  user_id: string;
  recommendation_date: string; // ISO date
  recommendation_time?: string; // HH:MM:SS
  recommendation_type: RecommendationType;
  content: MealRecommendation | WorkoutRecommendation | Record<string, any>;
  reasoning?: string;
  priority: number; // 1-5
  status: RecommendationStatus;
  based_on_data?: Record<string, any>;
  created_at: string;
  user_feedback?: string;
  feedback_rating?: number;
}

export interface DailyPlan {
  recommendations: Recommendation[];
  summary: {
    total_recommendations: number;
    meals_suggested: number;
    workouts_suggested: number;
    target_calories?: number;
    target_protein_g?: number;
  };
}

export interface NextAction {
  recommendation?: Recommendation;
  time_until_next?: number; // minutes
  message: string;
}

// =====================================================
// COMPONENT PROPS
// =====================================================

export interface ConsultationChatProps {
  onComplete?: (summary: ConsultationSummary, programId?: string) => void;
}

export interface SpecialistSelectionProps {
  onSelect: (specialistType: SpecialistType) => void;
}

export interface StructuredDataPreviewProps {
  summary: ConsultationSummary;
  onEdit?: (category: string, data: any) => void;
  onConfirm?: () => void;
}

export interface DailyRecommendationsProps {
  userId?: string;
  maxRecommendations?: number;
  showAcceptReject?: boolean;
}

// =====================================================
// UTILITY TYPES
// =====================================================

export interface SpecialistInfo {
  type: SpecialistType;
  name: string;
  description: string;
  icon: string;
  color: string;
  expertiseAreas: string[];
}

export const SPECIALISTS: Record<SpecialistType, SpecialistInfo> = {
  unified_coach: {
    type: 'unified_coach',
    name: 'Unified Coach',
    description: 'All-in-one fitness and nutrition expert',
    icon: '🎯',
    color: 'blue',
    expertiseAreas: ['Fitness', 'Nutrition', 'Lifestyle', 'Goals']
  },
  nutritionist: {
    type: 'nutritionist',
    name: 'Nutritionist',
    description: 'Registered dietitian for personalized nutrition guidance',
    icon: '🥗',
    color: 'green',
    expertiseAreas: ['Meal Planning', 'Macros', 'Supplements', 'Diet Strategy']
  },
  trainer: {
    type: 'trainer',
    name: 'Personal Trainer',
    description: 'Certified trainer for customized workout programming',
    icon: '💪',
    color: 'orange',
    expertiseAreas: ['Strength Training', 'Cardio', 'Program Design', 'Form']
  },
  physiotherapist: {
    type: 'physiotherapist',
    name: 'Physiotherapist',
    description: 'Licensed physiotherapist for injury recovery and prevention',
    icon: '🏥',
    color: 'red',
    expertiseAreas: ['Injury Recovery', 'Mobility', 'Pain Management', 'Rehab']
  },
  sports_psychologist: {
    type: 'sports_psychologist',
    name: 'Sports Psychologist',
    description: 'Mental performance and mindset coaching',
    icon: '🧠',
    color: 'purple',
    expertiseAreas: ['Mindset', 'Motivation', 'Mental Toughness', 'Performance']
  }
};

// =====================================================
// ERROR TYPES
// =====================================================

export interface APIError {
  error: string;
  details?: Record<string, any>;
  status_code: number;
}

export class ConsultationError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ConsultationError';
  }
}
