import type { MealFood } from '@/components/nutrition/MealEditor'

/**
 * Calculate grams per household serving
 * 
 * This function extracts the actual weight in grams for one household serving.
 * Examples:
 * - Pizza: 1 slice = 120g
 * - Banana: 1 medium = 118g
 * - Protein: 1 scoop = 30g
 * 
 * @param food - The food item with household serving data
 * @returns The weight in grams for one household serving
 */
export function getGramsPerHouseholdServing(food: MealFood): number {
  // If household serving data exists, use it
  if (food.household_serving_size && food.household_serving_unit) {
    const servingMultiplier = parseFloat(food.household_serving_size) || 1
    
    // Common conversion estimates (fallback if actual weight not provided)
    const unitToGrams: Record<string, number> = {
      'slice': 120,       // Average pizza/bread slice
      'medium': 118,      // Average medium fruit (banana, apple, etc.)
      'small': 90,        // Average small fruit
      'large': 150,       // Average large fruit
      'extra large': 180, // Extra large fruit
      'scoop': 30,        // Standard protein powder scoop
      'cup': 195,         // Cooked rice/pasta cup
      'piece': 100,       // Generic piece
      'serving': 100,     // Generic serving
      'oz': 28.35,        // Ounce conversion
      'tbsp': 15,         // Tablespoon
      'tsp': 5,           // Teaspoon
      'bar': 40,          // Protein/granola bar
      'packet': 30,       // Single-serve packet
      'bottle': 500,      // Standard bottle
      'can': 355,         // Standard can
      'container': 200,   // Container
      'handful': 30,      // Handful of nuts/chips
    }
    
    // Check if we have a conversion for this unit
    const gramsPerUnit = unitToGrams[food.household_serving_unit.toLowerCase()]
    
    if (gramsPerUnit) {
      return servingMultiplier * gramsPerUnit
    }
    
    // If no conversion found, use serving_size directly
    // This assumes household_serving_size is a ratio to serving_size
    // Example: serving_size=100g, household_serving_size="1.2" → 120g
    return food.serving_size * servingMultiplier
  }
  
  // Fallback to serving_size if available
  return food.serving_size || 100
}

/**
 * Calculate nutrition for a given quantity in grams
 * 
 * @param food - The food item
 * @param grams - The quantity in grams
 * @returns Object with calculated nutrition values
 */
export function calculateNutritionForGrams(
  food: MealFood,
  grams: number
): {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
} {
  const servingSize = food.serving_size || 100
  const multiplier = grams / servingSize
  
  return {
    calories: (food.calories || 0) * multiplier,
    protein_g: (food.protein_g || 0) * multiplier,
    carbs_g: (food.carbs_g || 0) * multiplier,
    fat_g: (food.fat_g || 0) * multiplier,
    fiber_g: (food.fiber_g || 0) * multiplier,
  }
}

/**
 * Convert servings to grams
 * 
 * @param servings - Number of household servings
 * @param food - The food item
 * @returns Weight in grams
 */
export function servingsToGrams(servings: number, food: MealFood): number {
  const gramsPerServing = getGramsPerHouseholdServing(food)
  return servings * gramsPerServing
}

/**
 * Convert grams to servings
 * 
 * @param grams - Weight in grams
 * @param food - The food item
 * @returns Number of household servings
 */
export function gramsToServings(grams: number, food: MealFood): number {
  const gramsPerServing = getGramsPerHouseholdServing(food)
  return gramsPerServing > 0 ? grams / gramsPerServing : 0
}

/**
 * Format serving display with pluralization
 * 
 * @param servings - Number of servings
 * @param unit - The unit name
 * @returns Formatted string (e.g., "1 slice", "2 slices")
 */
export function formatServingDisplay(servings: number, unit: string): string {
  const pluralMap: Record<string, string> = {
    'slice': 'slices',
    'piece': 'pieces',
    'scoop': 'scoops',
    'cup': 'cups',
    'bar': 'bars',
    'packet': 'packets',
    'bottle': 'bottles',
    'can': 'cans',
    'container': 'containers',
    'handful': 'handfuls',
    // Size adjectives don't pluralize
    'medium': 'medium',
    'small': 'small',
    'large': 'large',
    'extra large': 'extra large',
    // Weight units
    'oz': 'oz',
    'g': 'g',
    'tbsp': 'tbsp',
    'tsp': 'tsp',
  }
  
  const displayUnit = servings === 1 ? unit : (pluralMap[unit] || `${unit}s`)
  return `${servings} ${displayUnit}`
}
