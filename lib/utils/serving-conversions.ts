/**
 * @deprecated This file contains LEGACY serving conversion logic.
 *
 * ⚠️ DO NOT USE THESE FUNCTIONS FOR NEW CODE ⚠️
 *
 * Use `FoodQuantityConverter` from `@/lib/utils/food-quantity-converter` instead.
 *
 * This file is kept for backward compatibility with older components (MealEditor).
 * All nutrition calculations should use the official FoodQuantityConverter which:
 * 1. Uses household_serving_grams directly from the database (no hardcoded values)
 * 2. Calculates nutrition as: multiplier = gram_quantity / serving_size
 * 3. Supports dual quantity tracking (servings + grams)
 *
 * Migration guide:
 * - getGramsPerHouseholdServing() → FoodQuantityConverter.calculateQuantities()
 * - calculateNutritionForGrams() → FoodQuantityConverter.calculateNutrition()
 * - servingsToGrams() → FoodQuantityConverter.calculateQuantities(food, servings, 'serving')
 * - gramsToServings() → FoodQuantityConverter.calculateQuantities(food, grams, 'grams')
 * - formatServingDisplay() → FoodQuantityConverter.formatServingDisplay()
 */

import type { MealFood } from '@/components/nutrition/MealEditor'

/**
 * @deprecated Use FoodQuantityConverter.calculateQuantities() instead.
 *
 * This function has HARDCODED unit conversions which may not match database values.
 * The official converter uses household_serving_grams directly from the database.
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
 * @deprecated Use FoodQuantityConverter.calculateNutrition() instead.
 *
 * The official converter uses the correct formula: multiplier = gram_quantity / serving_size
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
 * @deprecated Use FoodQuantityConverter.calculateQuantities(food, servings, 'serving') instead.
 */
export function servingsToGrams(servings: number, food: MealFood): number {
  const gramsPerServing = getGramsPerHouseholdServing(food)
  return servings * gramsPerServing
}

/**
 * @deprecated Use FoodQuantityConverter.calculateQuantities(food, grams, 'grams') instead.
 */
export function gramsToServings(grams: number, food: MealFood): number {
  const gramsPerServing = getGramsPerHouseholdServing(food)
  return gramsPerServing > 0 ? grams / gramsPerServing : 0
}

/**
 * @deprecated Use FoodQuantityConverter.formatServingDisplay() instead.
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
