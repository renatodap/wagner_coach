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

// ========== ENHANCED AI PHOTO RECOGNITION TYPES ==========

// AI Analysis Result (comprehensive interface for all AI services)
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

// PhotoCapture Component Props
export interface PhotoCaptureProps {
  onPhotoCapture: (imageData: string) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

// AIAnalysis Component Props
export interface AIAnalysisProps {
  imageData: string;
  onAnalysisComplete: (mealData: AIAnalysisResult) => void;
  onError: (error: string) => void;
}

// AIReview Component Props
export interface AIReviewProps {
  aiResult: AIAnalysisResult;
  originalImage: string;
  onConfirm: (finalMealData: MealInsert) => void;
  onReanalyze: () => void;
  onManualEdit: () => void;
}

// API Request/Response Types for Photo Analysis
export interface AnalyzePhotoRequest {
  imageData: string; // Base64 encoded image
  userId: string;
  mealCategory?: MealCategory;
  includePortionHelp?: boolean;
}

export interface AnalyzePhotoResponse {
  success: boolean;
  data?: AIAnalysisResult;
  error?: string;
  analysisId: string; // For feedback/correction tracking
}

// Analysis Feedback Types
export interface AnalysisFeedback {
  analysisId: string;
  corrections: Array<{
    originalItem: string;
    correctedItem: string;
    originalNutrition: NutritionInfo;
    correctedNutrition: NutritionInfo;
    correctionType: 'identification' | 'portion' | 'nutrition';
  }>;
  userSatisfaction: number; // 1-5 rating
}

// Database Types for Photo Analysis
export interface MealPhotoAnalysis {
  id: string;
  user_id: string;
  meal_id?: string;
  image_url: string;
  ai_response: AIAnalysisResult;
  user_corrections?: AnalysisFeedback;
  confidence_score: number;
  processing_time_ms: number;
  ai_service_used: string;
  created_at: string;
  updated_at: string;
}

export interface UserAIPreferences {
  user_id: string;
  preferred_portion_units: 'imperial' | 'metric';
  dietary_restrictions: string[];
  common_foods: string[];
  correction_count: number;
  satisfaction_rating?: number;
  created_at: string;
  updated_at: string;
}

// Extended Database Schema
export interface DatabaseWithAI extends Database {
  public: {
    Tables: Database['public']['Tables'] & {
      meal_photo_analyses: {
        Row: MealPhotoAnalysis;
        Insert: Omit<MealPhotoAnalysis, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<MealPhotoAnalysis, 'id' | 'user_id' | 'created_at'>>;
      };
      user_ai_preferences: {
        Row: UserAIPreferences;
        Insert: Omit<UserAIPreferences, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserAIPreferences, 'user_id' | 'created_at'>>;
      };
    };
  };
}

// Image Upload Types
export interface ImageUploadRequest {
  file: File;
  userId: string;
  compressionOptions?: ImageCompressionOptions;
}

export interface ImageUploadResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
  expiresAt: string;
}

// AI Service Configuration
export interface AIServiceConfig {
  provider: 'openai' | 'anthropic' | 'logmeal';
  apiKey: string;
  maxRetries: number;
  timeoutMs: number;
  fallbackProvider?: 'openai' | 'anthropic' | 'logmeal';
}

// USDA API Integration Types
export interface USDAFoodItem {
  fdcId: number;
  description: string;
  foodNutrients: Array<{
    nutrientId: number;
    nutrientName: string;
    value: number;
    unitName: string;
  }>;
}

export interface USDASearchResponse {
  foods: USDAFoodItem[];
  totalHits: number;
  currentPage: number;
  totalPages: number;
}

// Error Types
export interface AIAnalysisError {
  code: 'AI_SERVICE_ERROR' | 'IMAGE_PROCESSING_ERROR' | 'VALIDATION_ERROR' | 'TIMEOUT_ERROR';
  message: string;
  details?: any;
  retryable: boolean;
}

// Enhanced MealLogForm Props with AI Integration
export interface EnhancedMealLogFormProps extends MealLogFormProps {
  enablePhotoAnalysis?: boolean;
  initialAIAnalysis?: AIAnalysisResult;
  onPhotoAnalysisRequest?: () => void;
}

// Photo Analysis Workflow State
export interface PhotoAnalysisWorkflowState {
  step: 'capture' | 'processing' | 'review' | 'editing' | 'complete';
  imageData?: string;
  analysisResult?: AIAnalysisResult;
  userEdits?: Partial<MealInsert>;
  error?: string;
  isLoading: boolean;
}

// Helper Types for Form Integration
export type FormDataSource = 'manual' | 'ai' | 'mixed';

export interface MealFormDataWithSource extends MealFormData {
  dataSource: FormDataSource;
  aiAnalysisId?: string;
  confidenceScore?: number;
  userModified: boolean;
}

// Performance Monitoring Types
export interface PhotoAnalysisMetrics {
  analysisId: string;
  userId: string;
  imageSize: number;
  processingTime: number;
  aiService: string;
  confidence: number;
  userSatisfaction?: number;
  correctionsMade: number;
  timestamp: string;
}