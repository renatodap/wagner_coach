// =====================================================
// NUTRITION V2 TYPE DEFINITIONS
// =====================================================

// ============= ENUMS =============

export type FoodUnit = 'g' | 'ml' | 'oz' | 'cup' | 'tbsp' | 'tsp' | 'serving' | 'piece' | 'slice';

export type MealCategory =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'snack'
  | 'pre_workout'
  | 'post_workout'
  | 'other';

// ============= DATABASE TYPES =============

// Foods table
export interface Food {
  id: string;
  name: string;
  brand?: string | null;
  barcode?: string | null;
  description?: string | null;

  // Serving information
  serving_size: number;
  serving_unit: FoodUnit;
  serving_description?: string | null;

  // Nutrition per serving
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  fiber_g?: number | null;
  sugar_g?: number | null;
  sodium_mg?: number | null;

  // Metadata
  created_by?: string | null;
  is_verified: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// Meal logs table
export interface MealLog {
  id: string;
  user_id: string;
  name?: string | null;
  category: MealCategory;
  logged_at: string;
  notes?: string | null;

  // Template tracking (NEW)
  template_id?: string | null;
  created_from_template?: boolean | null;

  // Calculated totals
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  total_fiber_g: number;

  created_at: string;
  updated_at: string;
}

// Meal log foods table
export interface MealLogFood {
  id: string;
  meal_log_id: string;

  // Item can be food OR template (NEW)
  item_type: 'food' | 'template';
  food_id?: string | null;
  template_id?: string | null;
  order_index?: number;

  // Quantity consumed
  quantity: number;
  unit: FoodUnit;

  // Calculated nutrition
  calories_consumed?: number | null;
  protein_consumed?: number | null;
  carbs_consumed?: number | null;
  fat_consumed?: number | null;
  fiber_consumed?: number | null;

  created_at: string;

  // Relations
  food?: Food;
}

// Meal templates table
export interface MealTemplate {
  id: string;
  user_id: string;
  name: string;
  category: MealCategory;
  description?: string | null;

  // Usage tracking (NEW)
  is_favorite?: boolean;
  use_count?: number;
  last_used_at?: string | null;
  tags?: string[] | null;

  // Calculated totals
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  total_fiber_g: number;

  created_at: string;
  updated_at: string;
}

// Meal template foods table
export interface MealTemplateFood {
  id: string;
  meal_template_id: string;

  // Item can be food OR template (NEW - recursive templates)
  item_type: 'food' | 'template';
  food_id?: string | null;
  child_template_id?: string | null;
  order_index?: number;

  quantity: number;
  unit: FoodUnit;
  created_at: string;

  // Relations
  food?: Food;
}

// ============= API REQUEST/RESPONSE TYPES =============

// Creating a new food
export interface CreateFoodRequest {
  name: string;
  brand?: string;
  barcode?: string;
  description?: string;
  serving_size: number;
  serving_unit: FoodUnit;
  serving_description?: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
  is_public?: boolean;
}

// Creating a meal log with foods
export interface CreateMealLogRequest {
  name?: string;
  category: MealCategory;
  logged_at: string;
  notes?: string;
  foods: {
    item_type?: 'food' | 'template';  // NEW: defaults to 'food'
    food_id?: string;  // Required if item_type='food'
    template_id?: string;  // Required if item_type='template'
    quantity: number;
    unit: FoodUnit;
  }[];
}

// Quick add single food (simplified meal log)
export interface QuickAddFoodRequest {
  food_id: string;
  quantity: number;
  unit: FoodUnit;
  category?: MealCategory;
  logged_at?: string;
}

// Creating a meal template
export interface CreateMealTemplateRequest {
  name: string;
  category: MealCategory;
  description?: string;
  tags?: string[];  // NEW
  foods: {
    item_type?: 'food' | 'template';  // NEW: defaults to 'food'
    food_id?: string;  // Required if item_type='food'
    child_template_id?: string;  // Required if item_type='template'
    quantity: number;
    unit: FoodUnit;
  }[];
}

// Search parameters
export interface FoodSearchParams {
  query?: string;
  category?: string;
  minProtein?: number;
  maxCalories?: number;
  isVerified?: boolean;
  includeUserFoods?: boolean;
  limit?: number;
  offset?: number;
}

// ============= DISPLAY/UI TYPES =============

// Meal log with expanded food details
export interface MealLogWithFoods extends MealLog {
  foods: (MealLogFood & {
    food: Food;
  })[];
}

// Template with expanded food details
export interface MealTemplateWithFoods extends MealTemplate {
  foods: (MealTemplateFood & {
    food: Food;
  })[];
}

// Daily nutrition summary
export interface DailyNutritionSummary {
  date: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  total_fiber_g: number;
  meal_count: number;
  meals: MealLogWithFoods[];
}

// Food with calculated nutrition for display
export interface FoodWithCalculatedNutrition extends Food {
  quantity: number;
  unit: FoodUnit;
  calculated_calories: number;
  calculated_protein_g: number;
  calculated_carbs_g: number;
  calculated_fat_g: number;
  calculated_fiber_g: number;
}

// Common serving sizes for UI
export interface ServingOption {
  label: string;
  quantity: number;
  unit: FoodUnit;
  calories: number;
}

// Nutrition goals for comparison
export interface NutritionGoals {
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
}

// Analytics types
export interface NutritionAnalytics {
  period: 'daily' | 'weekly' | 'monthly';
  average_calories: number;
  average_protein_g: number;
  average_carbs_g: number;
  average_fat_g: number;
  average_fiber_g: number;
  total_meals_logged: number;
  most_consumed_foods: {
    food: Food;
    count: number;
    total_quantity: number;
  }[];
  meal_timing_pattern: {
    category: MealCategory;
    average_time: string;
    count: number;
  }[];
}

// ============= FORM/INPUT TYPES =============

// Meal builder state
export interface MealBuilderState {
  name?: string;
  category: MealCategory;
  logged_at: Date;
  notes?: string;
  foods: {
    food: Food;
    quantity: number;
    unit: FoodUnit;
    tempId: string; // For UI tracking before save
  }[];
}

// Food search result
export interface FoodSearchResult {
  foods: Food[];
  total: number;
  limit: number;
  offset: number;
}

// ============= UTILITY TYPES =============

// For converting between units
export interface UnitConversion {
  from: FoodUnit;
  to: FoodUnit;
  factor: number;
}

// Common food categories for filtering
export type FoodCategory =
  | 'protein'
  | 'carbohydrate'
  | 'fat'
  | 'vegetable'
  | 'fruit'
  | 'dairy'
  | 'grain'
  | 'beverage'
  | 'supplement'
  | 'other';

// Validation errors
export interface NutritionValidationError {
  field: string;
  message: string;
}

// API Response wrapper
export interface NutritionApiResponse<T> {
  data?: T;
  error?: string;
  validationErrors?: NutritionValidationError[];
}