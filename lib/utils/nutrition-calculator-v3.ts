/**
 * Nutrition Calculator V3 - Verified Against Database Schema
 *
 * Handles bidirectional conversion between servings and grams.
 * All nutrition calculations use gramQuantity as source of truth.
 *
 * Schema alignment verified with:
 * - foods table (serving_size, household_serving_grams)
 * - meal_foods table (serving_quantity, gram_quantity, last_edited_field)
 */

import type {
  FoodItem,
  FoodQuantity,
  NutritionValues,
  DetectedFood
} from '@/types/coach-v3'

/**
 * Calculate both serving and gram quantities from user input
 *
 * CRITICAL: This implements bidirectional synchronization.
 * When user edits one field, the other is automatically calculated.
 *
 * @param food - Food item with serving information
 * @param inputQuantity - The value user entered
 * @param inputField - Which field user edited ('serving' or 'grams')
 * @returns Both quantities with lastEditedField tracked
 */
export function calculateQuantities(
  food: FoodItem,
  inputQuantity: number,
  inputField: 'serving' | 'grams'
): FoodQuantity {
  // Validate input
  if (inputQuantity <= 0) {
    throw new Error('Quantity must be positive')
  }

  // Get grams per serving (priority: household > standard)
  const householdGrams = food.household_serving_grams
  const gramsPerServing = householdGrams && householdGrams > 0
    ? householdGrams
    : (food.serving_size || 100)

  // Ensure we have valid serving size
  if (gramsPerServing <= 0) {
    console.warn(`[NutritionCalc] Invalid serving size for ${food.name}, using 100g default`)
  }

  let servingQuantity: number
  let gramQuantity: number

  if (inputField === 'serving') {
    // User edited servings → calculate grams
    servingQuantity = inputQuantity
    gramQuantity = servingQuantity * gramsPerServing
  } else {
    // User edited grams → calculate servings
    gramQuantity = inputQuantity
    servingQuantity = gramQuantity / gramsPerServing
  }

  // Round to reasonable precision
  servingQuantity = Math.round(servingQuantity * 1000) / 1000  // 3 decimal places
  gramQuantity = Math.round(gramQuantity * 10) / 10  // 1 decimal place

  return {
    servingQuantity,
    servingUnit: food.household_serving_unit || 'serving',
    gramQuantity,
    lastEditedField: inputField
  }
}

/**
 * Calculate nutrition values from gram quantity
 *
 * CRITICAL: Nutrition is ALWAYS calculated from grams for consistency.
 * Formula: multiplier = gramQuantity / serving_size
 *          each_macro = food_macro * multiplier
 *
 * @param food - Food item with nutrition per serving_size
 * @param gramQuantity - Quantity in grams
 * @returns Calculated nutrition values
 */
export function calculateNutrition(
  food: FoodItem,
  gramQuantity: number
): NutritionValues {
  const servingSize = food.serving_size || 100

  // Calculate multiplier
  const multiplier = gramQuantity / servingSize

  // Calculate each nutrient and round
  const round = (val: number) => Math.round(val * 10) / 10

  return {
    calories: Math.round((food.calories || 0) * multiplier),
    protein_g: round((food.protein_g || 0) * multiplier),
    carbs_g: round((food.total_carbs_g || 0) * multiplier),
    fat_g: round((food.total_fat_g || 0) * multiplier),
    fiber_g: food.dietary_fiber_g ? round(food.dietary_fiber_g * multiplier) : undefined,
    sugar_g: food.total_sugars_g ? round(food.total_sugars_g * multiplier) : undefined,
    sodium_mg: food.sodium_mg ? round(food.sodium_mg * multiplier) : undefined
  }
}

/**
 * Sum nutrition values from multiple foods
 *
 * @param nutritionList - Array of nutrition values to sum
 * @returns Total nutrition across all foods
 */
export function sumNutrition(nutritionList: NutritionValues[]): NutritionValues {
  const round = (val: number) => Math.round(val * 10) / 10

  const totals = nutritionList.reduce(
    (acc, n) => ({
      calories: acc.calories + (n.calories || 0),
      protein_g: acc.protein_g + (n.protein_g || 0),
      carbs_g: acc.carbs_g + (n.carbs_g || 0),
      fat_g: acc.fat_g + (n.fat_g || 0),
      fiber_g: (acc.fiber_g || 0) + (n.fiber_g || 0),
      sugar_g: (acc.sugar_g || 0) + (n.sugar_g || 0),
      sodium_mg: (acc.sodium_mg || 0) + (n.sodium_mg || 0)
    }),
    {
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sugar_g: 0,
      sodium_mg: 0
    }
  )

  return {
    calories: Math.round(totals.calories),
    protein_g: round(totals.protein_g),
    carbs_g: round(totals.carbs_g),
    fat_g: round(totals.fat_g),
    fiber_g: totals.fiber_g ? round(totals.fiber_g) : undefined,
    sugar_g: totals.sugar_g ? round(totals.sugar_g) : undefined,
    sodium_mg: totals.sodium_mg ? round(totals.sodium_mg) : undefined
  }
}

/**
 * Format serving display with proper pluralization
 *
 * @param quantity - Number of servings
 * @param unit - Serving unit name
 * @returns Formatted string (e.g., "2 slices", "1 breast")
 */
export function formatServingDisplay(quantity: number, unit: string | null): string {
  if (!unit || unit === 'serving') {
    return `${quantity} serving${quantity !== 1 ? 's' : ''}`
  }

  // Pluralization map for common units
  const pluralMap: Record<string, string> = {
    'slice': 'slices',
    'piece': 'pieces',
    'scoop': 'scoops',
    'cup': 'cups',
    'breast': 'breasts',
    'thigh': 'thighs',
    'wing': 'wings',
    'drumstick': 'drumsticks',
    'medium': 'medium',  // No plural
    'small': 'small',
    'large': 'large',
    'whole': 'whole',
    'half': 'halves'
  }

  const displayUnit = quantity === 1 ? unit : (pluralMap[unit] || `${unit}s`)

  // Format quantity: show decimals only if needed
  const formattedQty = quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(1)

  return `${formattedQty} ${displayUnit}`
}

/**
 * Format gram display
 *
 * @param grams - Quantity in grams
 * @returns Formatted string (e.g., "150g")
 */
export function formatGramDisplay(grams: number): string {
  // Format: show 1 decimal if needed
  const formatted = grams % 1 === 0 ? grams.toString() : grams.toFixed(1)
  return `${formatted}g`
}

/**
 * Format combined display (servings + grams)
 *
 * @param quantity - Food quantity object
 * @returns Formatted string (e.g., "2 slices (56g)")
 */
export function formatCombinedDisplay(quantity: FoodQuantity): string {
  const servingDisplay = formatServingDisplay(quantity.servingQuantity, quantity.servingUnit)
  const gramDisplay = formatGramDisplay(quantity.gramQuantity)

  return `${servingDisplay} (${gramDisplay})`
}

/**
 * Recalculate all nutrition for detected foods after quantity change
 *
 * Used when user edits a food quantity inline - updates nutrition immediately.
 *
 * @param detectedFoods - Array of detected foods
 * @returns Updated detected foods with recalculated nutrition
 */
export function recalculateDetectedFoodNutrition(
  detectedFoods: DetectedFood[]
): DetectedFood[] {
  return detectedFoods.map(df => ({
    ...df,
    nutrition: calculateNutrition(df.food, df.quantity.gramQuantity)
  }))
}

/**
 * Validate food quantity constraints
 *
 * @param quantity - Food quantity to validate
 * @throws Error if validation fails
 */
export function validateFoodQuantity(quantity: FoodQuantity): void {
  if (quantity.servingQuantity <= 0) {
    throw new Error('Serving quantity must be positive')
  }

  if (quantity.gramQuantity <= 0) {
    throw new Error('Gram quantity must be positive')
  }

  if (quantity.gramQuantity > 100000) {
    throw new Error('Gram quantity exceeds reasonable limits (100kg)')
  }
}

/**
 * Convert legacy quantity format to new FoodQuantity format
 *
 * For backward compatibility with coach-v2 data
 *
 * @param food - Food item
 * @param legacyQuantity - Old quantity value
 * @param legacyUnit - Old unit value
 * @returns New FoodQuantity object
 */
export function convertLegacyQuantity(
  food: FoodItem,
  legacyQuantity: number,
  legacyUnit: string
): FoodQuantity {
  // If unit is 'g', assume grams were edited
  if (legacyUnit === 'g') {
    return calculateQuantities(food, legacyQuantity, 'grams')
  }

  // Otherwise assume servings were edited
  return calculateQuantities(food, legacyQuantity, 'serving')
}
