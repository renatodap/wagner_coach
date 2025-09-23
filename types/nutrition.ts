// Food Recognition Types
export interface RecognizedFood {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
}

export interface FoodRecognitionResult {
  success: boolean;
  foods: RecognizedFood[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  imageUrl?: string;
  error?: string;
}

// Photo Recognition Types
export interface PhotoCaptureProps {
  onPhotoCapture: (imageData: string) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export interface AIAnalysisProps {
  imageData: string;
  onAnalysisComplete: (mealData: AIAnalysisResult) => void;
  onError: (error: string) => void;
}

export interface AIAnalysisResult {
  foodItems: Array<{
    name: string;
    quantity: string;
    confidence: number;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  }>;
  totalNutrition: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  };
  suggestedMealName: string;
  confidence: number;
}

export interface AIReviewProps {
  aiResult: AIAnalysisResult;
  originalImage: string;
  onConfirm: (finalMealData: MealInsert) => void;
  onReanalyze: () => void;
  onManualEdit: () => void;
}

// API Request/Response Types
export interface AnalyzePhotoRequest {
  imageData: string; // Base64 encoded image
  userId: string;
  mealCategory?: MealType;
  includePortionHelp?: boolean;
}

export interface AnalyzePhotoResponse {
  success: boolean;
  data?: AIAnalysisResult;
  error?: string;
  analysisId: string; // For feedback/correction tracking
}

export interface AnalysisFeedback {
  analysisId: string;
  corrections: Array<{
    originalItem: string;
    correctedItem: string;
    originalNutrition: {
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
      fiber_g: number;
    };
    correctedNutrition: {
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
      fiber_g: number;
    };
    correctionType: 'identification' | 'portion' | 'nutrition';
  }>;
  userSatisfaction: number; // 1-5 rating
}

export interface LogMealAPIResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

// Meal Types
export interface Meal {
  id: string;
  user_id: string;
  name: string;
  meal_type: MealType;
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  fiber_g?: number | null;
  sugar_g?: number | null;
  sodium_mg?: number | null;
  logged_at: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export const MEAL_CATEGORY_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack'
};

export interface MealInsert {
  name: string;
  meal_type: MealType;
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  fiber_g?: number | null;
  sugar_g?: number | null;
  sodium_mg?: number | null;
  logged_at?: string;
  notes?: string | null;
}

export interface MealUpdate {
  name?: string;
  meal_type?: MealType;
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  fiber_g?: number | null;
  sugar_g?: number | null;
  sodium_mg?: number | null;
  logged_at?: string;
  notes?: string | null;
}

export interface NutritionGoals {
  user_id: string;
  daily_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  created_at: string;
  updated_at: string;
}

export interface NutritionTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface NutritionDashboardData {
  today: NutritionTotals;
  goals: NutritionGoals;
  meals: Meal[];
  weeklyAverage: number;
  streakDays: number;
}

export interface DashboardApiResponse {
  data: NutritionDashboardData;
}

export interface MealListProps {
  meals: Meal[];
  onEditMeal?: (meal: Meal) => void;
  onDeleteMeal?: (mealId: string) => void;
  onRelogMeal?: (meal: Meal) => void;
}

export interface MealFormData {
  name: string;
  meal_type: MealType;
  calories: string;
  protein_g: string;
  carbs_g: string;
  fat_g: string;
  notes: string;
}

export function validateMeal(meal: MealInsert): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!meal.name?.trim()) {
    errors.push('Meal name is required');
  }

  if (!meal.meal_type) {
    errors.push('Meal type is required');
  } else if (!MEAL_TYPES.includes(meal.meal_type)) {
    errors.push('Invalid meal type');
  }

  if (meal.calories !== undefined && meal.calories !== null && meal.calories < 0) {
    errors.push('Calories must be a positive number');
  }

  if (meal.protein_g !== undefined && meal.protein_g !== null && meal.protein_g < 0) {
    errors.push('Protein must be a positive number');
  }

  if (meal.carbs_g !== undefined && meal.carbs_g !== null && meal.carbs_g < 0) {
    errors.push('Carbs must be a positive number');
  }

  if (meal.fat_g !== undefined && meal.fat_g !== null && meal.fat_g < 0) {
    errors.push('Fat must be a positive number');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}