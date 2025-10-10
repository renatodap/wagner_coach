// =====================================================
// NUTRITION V2 TYPE DEFINITIONS
// =====================================================

// ============= ENUMS =============

export type FoodUnit = 'g' | 'ml' | 'oz' | 'cup' | 'tbsp' | 'tsp' | 'serving' | 'piece' | 'slice';

export type FoodType = 'ingredient' | 'dish' | 'branded' | 'restaurant';

export type MealCategory =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'snack'
  | 'other';

// ============= DATABASE TYPES =============

// Foods table - Aligned with V2 Schema
export interface Food {
  id: string;
  
  // Basic Info
  name: string;
  food_type: FoodType;
  brand_name?: string | null;
  restaurant_name?: string | null;
  description?: string | null;
  
  // Barcode Support
  barcode_upc?: string | null;
  barcode_ean?: string | null;
  barcode_type?: string | null; // 'upc-a', 'upc-e', 'ean-13', 'ean-8'
  
  // Editing Control
  allow_gram_editing: boolean;
  
  // Serving Information
  serving_size: number;
  serving_unit: string;
  household_serving_unit?: string | null;
  household_serving_grams?: number | null;
  servings_per_container?: number | null;
  
  // Macronutrients (per serving_size)
  calories: number;
  protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  
  // Carbs Breakdown
  dietary_fiber_g?: number | null;
  total_sugars_g?: number | null;
  added_sugars_g?: number | null;
  sugar_alcohols_g?: number | null;
  
  // Fats Breakdown
  saturated_fat_g?: number | null;
  trans_fat_g?: number | null;
  monounsaturated_fat_g?: number | null;
  polyunsaturated_fat_g?: number | null;
  omega3_mg?: number | null;
  omega6_mg?: number | null;
  cholesterol_mg?: number | null;
  
  // Essential Minerals
  sodium_mg?: number | null;
  potassium_mg?: number | null;
  calcium_mg?: number | null;
  iron_mg?: number | null;
  magnesium_mg?: number | null;
  zinc_mg?: number | null;
  
  // Essential Vitamins
  vitamin_a_mcg?: number | null;
  vitamin_c_mg?: number | null;
  vitamin_d_mcg?: number | null;
  vitamin_e_mg?: number | null;
  vitamin_k_mcg?: number | null;
  vitamin_b6_mg?: number | null;
  vitamin_b12_mcg?: number | null;
  folate_mcg?: number | null;
  
  // Other Nutrients
  caffeine_mg?: number | null;
  alcohol_g?: number | null;
  water_g?: number | null;
  
  // Tags & Categories
  allergens?: string[] | null;
  dietary_flags?: string[] | null;
  ingredients?: string[] | null;
  
  // Data Quality & Source
  source?: string | null;
  external_id?: string | null;
  data_quality_score?: number | null;
  verified: boolean;
  verified_by?: string | null;
  verified_at?: string | null;
  
  // Ownership & Privacy
  is_public: boolean;
  created_by?: string | null;
  is_recipe?: boolean | null;
  
  // Usage Stats
  popularity_score?: number | null;
  global_use_count?: number | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// Meals table (renamed from MealLog for consistency with schema)
export interface Meal {
  id: string;
  user_id: string;
  
  // Meal Info
  name?: string | null;
  category: MealCategory;
  logged_at: string;
  notes?: string | null;
  
  // Source tracking
  created_from_template_id?: string | null;
  copied_from_date?: string | null;
  
  // Total Nutrition (calculated)
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  total_fiber_g: number;
  total_sugar_g: number;
  total_sodium_mg: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// Alias for backwards compatibility
export type MealLog = Meal;

// Meal foods table - with DUAL QUANTITY TRACKING
export interface MealFood {
  id: string;
  meal_id: string;
  food_id: string;
  
  // DUAL QUANTITY TRACKING (critical!)
  serving_quantity: number;
  serving_unit?: string | null;
  gram_quantity: number;
  last_edited_field: 'serving' | 'grams';
  
  // Calculated Nutrition
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number | null;
  sugar_g?: number | null;
  sodium_mg?: number | null;
  
  // Order in meal
  display_order?: number | null;
  
  added_at: string;
  
  // Relations
  food?: Food;
}

// Alias for backwards compatibility
export type MealLogFood = MealFood;

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
  template_id: string;
  food_id: string;
  
  // Dual quantity tracking
  serving_quantity: number;
  serving_unit?: string | null;
  gram_quantity: number;
  
  // Order in template
  display_order?: number | null;
  
  created_at: string;
  
  // Relations
  food?: Food;
}

// ============= API REQUEST/RESPONSE TYPES =============

// Creating a new food
export interface CreateFoodRequest {
  name: string;
  food_type?: FoodType;
  brand_name?: string;
  restaurant_name?: string;
  description?: string;
  
  // Barcode
  barcode_upc?: string;
  barcode_ean?: string;
  
  // Serving
  serving_size: number;
  serving_unit: string;
  household_serving_unit?: string;
  household_serving_grams?: number;
  
  // Macros
  calories?: number;
  protein_g?: number;
  total_carbs_g?: number;
  total_fat_g?: number;
  dietary_fiber_g?: number;
  total_sugars_g?: number;
  sodium_mg?: number;
  
  // Optional micronutrients
  saturated_fat_g?: number;
  trans_fat_g?: number;
  cholesterol_mg?: number;
  potassium_mg?: number;
  
  // Tags
  allergens?: string[];
  dietary_flags?: string[];
  
  is_public?: boolean;
}

// Creating a meal with foods (dual quantity tracking)
export interface CreateMealRequest {
  name?: string;
  category: MealCategory;
  logged_at: string;
  notes?: string;
  foods: {
    food_id: string;
    serving_quantity: number;
    serving_unit?: string;
    gram_quantity: number;
    last_edited_field: 'serving' | 'grams';
  }[];
}

// Alias for backwards compatibility
export type CreateMealLogRequest = CreateMealRequest;

// Quick add single food (simplified meal)
export interface QuickAddFoodRequest {
  food_id: string;
  serving_quantity: number;
  serving_unit?: string;
  gram_quantity: number;
  last_edited_field?: 'serving' | 'grams';
  category?: MealCategory;
  logged_at?: string;
}

// Creating a meal template
export interface CreateMealTemplateRequest {
  name: string;
  category: MealCategory;
  description?: string;
  tags?: string[];
  foods: {
    food_id: string;
    serving_quantity: number;
    serving_unit?: string;
    gram_quantity: number;
  }[];
}

// Search parameters
export interface FoodSearchParams {
  query?: string;
  food_type?: FoodType;
  brand_name?: string;
  restaurant_name?: string;
  barcode?: string;
  minProtein?: number;
  maxCalories?: number;
  allergens?: string[];
  dietary_flags?: string[];
  verified?: boolean;
  is_public?: boolean;
  created_by?: string;
  limit?: number;
  offset?: number;
}

// ============= DISPLAY/UI TYPES =============

// Meal with expanded food details
export interface MealWithFoods extends Meal {
  foods: (MealFood & {
    food: Food;
  })[];
}

// Alias for backwards compatibility
export type MealLogWithFoods = MealWithFoods;

// Template with expanded food details
export interface MealTemplateWithFoods extends MealTemplate {
  foods: (MealTemplateFood & {
    food: Food;
  })[];
}

// Daily nutrition summary
export interface DailyNutritionSummary {
  id: string;
  user_id: string;
  date: string;
  
  // Totals by meal category
  breakfast_calories: number;
  lunch_calories: number;
  dinner_calories: number;
  snacks_calories: number;
  
  // Daily totals
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  total_fiber_g: number;
  total_sugar_g: number;
  total_sodium_mg: number;
  
  // Meal counts
  meals_logged: number;
  foods_logged: number;
  
  // Water tracking
  water_ml: number;
  
  created_at: string;
  updated_at: string;
  
  // Optional expanded data
  meals?: MealWithFoods[];
}

// Food with calculated nutrition for display
export interface FoodWithCalculatedNutrition extends Food {
  // Quantity being displayed
  display_serving_quantity: number;
  display_serving_unit?: string;
  display_gram_quantity: number;
  
  // Calculated values for this quantity
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
  user_id: string;
  daily_calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  created_at: string;
  updated_at: string;
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

// ============= USER PREFERENCES & FAVORITES =============

// User favorite foods
export interface UserFavoriteFood {
  id: string;
  user_id: string;
  food_id: string;
  favorited_at: string;
  
  // Relations
  food?: Food;
}

// Food preferences (usage patterns)
export interface FoodPreference {
  id: string;
  user_id: string;
  food_id: string;
  
  // Last used quantities
  last_serving_quantity?: number | null;
  last_serving_unit?: string | null;
  last_gram_quantity?: number | null;
  last_used_at: string;
  
  // Usage patterns
  use_count: number;
  last_meal_category?: string | null;
  typical_meal_categories?: string[] | null;
  
  // Smart suggestions
  is_frequent: boolean;
  is_recent: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Relations
  food?: Food;
}
