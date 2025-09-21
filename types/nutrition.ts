// Nutrition Type Definitions

export type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// Complete meal object from database
export interface Meal {
  id: string;
  user_id: string;
  meal_name: string;
  meal_category: MealCategory;
  logged_at: string; // ISO 8601 timestamp
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Data required to create a new meal
export interface MealInsert {
  meal_name: string;
  meal_category: MealCategory;
  logged_at: string;
  notes?: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
}

// Form data for meal logging
export interface MealFormData {
  meal_name: string;
  meal_category: MealCategory | '';
  logged_at: Date;
  notes: string;
}

// Props for MealLogForm component
export interface MealLogFormProps {
  initialData?: Partial<MealFormData>;
  onSubmit: (data: MealInsert) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// Props for MealList component
export interface MealListProps {
  meals: Meal[];
  onRelogMeal?: (meal: Meal) => void;
  isLoading?: boolean;
}

// Props for MealListItem component
export interface MealListItemProps {
  meal: Meal;
  onRelog?: () => void;
}

// Props for NutritionSummary component
export interface NutritionSummaryProps {
  meals: Meal[];
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
}

// Nutrition totals for summary display
export interface NutritionTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

// API response types
export interface MealApiResponse {
  data?: Meal;
  error?: string;
}

export interface MealsListApiResponse {
  data?: Meal[];
  error?: string;
}

// Supabase table types
export interface Database {
  public: {
    Tables: {
      meals: {
        Row: Meal;
        Insert: MealInsert;
        Update: Partial<MealInsert>;
      };
    };
  };
}

// Validation schema types
export interface MealValidationErrors {
  meal_name?: string;
  meal_category?: string;
  logged_at?: string;
  notes?: string;
}

// Helper type for meal categories with display labels
export const MEAL_CATEGORY_LABELS: Record<MealCategory, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack'
};

// Helper function type definitions
export type CalculateNutritionTotals = (meals: Meal[]) => NutritionTotals;
export type FormatMealTime = (timestamp: string) => string;
export type ValidateMealForm = (data: MealFormData) => MealValidationErrors | null;

// ========== PHOTO RECOGNITION TYPES ==========

// Photo Recognition Types
export interface FoodRecognitionResult {
  imageId: string;
  foods: RecognizedFood[];
  totalNutrition: NutritionInfo;
  confidence: number;
  timestamp: string;
}

export interface RecognizedFood {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  nutrition: NutritionInfo;
  confidence: number;
  category?: string;
}

export interface NutritionInfo {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
}

// Photo Upload Props
export interface PhotoUploadProps {
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
  isProcessing?: boolean;
  error?: string;
  maxSizeInBytes?: number;
  acceptedFormats?: string[];
}

// Photo Recognition Result Props
export interface PhotoRecognitionResultProps {
  result: FoodRecognitionResult | null;
  onAccept: (editedResult: FoodRecognitionResult) => void;
  onReject: () => void;
  isLoading?: boolean;
}

// Recognition Review Props
export interface NutritionReviewProps {
  foods: RecognizedFood[];
  onConfirm: (foods: RecognizedFood[]) => void;
  onCancel: () => void;
  onEditFood: (foodId: string, updates: Partial<RecognizedFood>) => void;
  onRemoveFood: (foodId: string) => void;
  onAddFood: () => void;
}

// API Request/Response Types
export interface RecognizeImageRequest {
  image: string; // base64 encoded
  userId: string;
}

export interface RecognizeImageResponse {
  success: boolean;
  data?: FoodRecognitionResult;
  error?: string;
  cached?: boolean;
}

// LogMeal API Types (External Service)
export interface LogMealAPIResponse {
  recognition_results: {
    food_items: Array<{
      food_id: string;
      name: string;
      prob: number;
      quantity: number;
      unit: string;
    }>;
  };
  nutritional_info: {
    total_calories: number;
    total_proteins: number;
    total_carbs: number;
    total_fats: number;
  };
}

// Image Processing Types
export interface ImageCompressionOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: 'jpeg' | 'png' | 'webp';
}

export interface ProcessedImage {
  file: File;
  base64: string;
  preview: string;
  size: number;
  dimensions: {
    width: number;
    height: number;
  };
}