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

export interface LogMealAPIResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}