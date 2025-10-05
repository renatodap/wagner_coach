/**
 * Type definitions for Quick Entry V2
 * Matches backend groq_service_v2.py response format
 */

export type EntryType = "meal" | "workout" | "activity" | "note" | "measurement" | "unknown";

export interface QuickEntryPreviewResponse {
  success: boolean;
  entry_type: EntryType;
  confidence: number;
  data: {
    primary_fields: Record<string, any>;
    secondary_fields: Record<string, any>;
    estimated: boolean;
    needs_clarification: boolean;
  };
  validation: {
    errors: string[];
    warnings: string[];
    missing_critical: string[];
  };
  suggestions: string[];
  semantic_context?: {
    similar_count: number;
    suggestions: Array<{
      similarity: number;
      created_at: string;
      [key: string]: any;
    }>;
  };
  extracted_text?: string;
  error?: string;
}

// Type-specific field interfaces
export interface MealPrimaryFields {
  meal_name: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  calories: number | null;
  protein_g: number | null;
  foods: Array<{
    name: string;
    quantity: string;
  }>;
}

export interface MealSecondaryFields {
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
  foods_detailed?: Array<{
    name: string;
    quantity: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  }>;
  tags?: string[];
}

export interface WorkoutPrimaryFields {
  workout_name: string;
  duration_minutes: number | null;
  exercises: Array<{
    name: string;
    sets: number;
    reps: number | string;
    weight_lbs: number;
    weight_per_side?: number;
    note?: string;
  }>;
}

export interface WorkoutSecondaryFields {
  volume_load?: number;
  muscle_groups?: string[];
  estimated_calories?: number;
  rpe?: number;
  tags?: string[];
}

export interface ActivityPrimaryFields {
  activity_name: string;
  activity_type: string;
  distance_miles?: number;
  distance_km?: number;
  duration_minutes: number;
  pace?: string;
}

export interface ActivitySecondaryFields {
  calories_burned?: number;
  avg_heart_rate?: number;
  rpe?: number;
  tags?: string[];
}

export interface NotePrimaryFields {
  title?: string;
  content: string;
  sentiment?: "positive" | "neutral" | "negative";
  sentiment_score?: number;
}

export interface NoteSecondaryFields {
  detected_themes?: string[];
  related_goals?: string[];
  action_items?: string[];
  tags?: string[];
}

export interface MeasurementPrimaryFields {
  weight_lbs?: number;
  weight_kg?: number;
  body_fat_pct?: number;
}

export interface MeasurementSecondaryFields {
  measurements?: Record<string, number>;
  trend_direction?: "up" | "down" | "stable";
  rate_of_change_weekly?: number;
  tags?: string[];
}
