/**
 * Nutrition Calculation Utilities
 *
 * Client-side fallback for calculating meal nutrition totals when backend
 * doesn't provide them (bug workaround).
 */

import type { Meal, MealFoodItem } from '../api/meals'

export interface MealNutritionTotals {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
}

/**
 * Calculate meal nutrition totals with smart fallback logic
 *
 * Priority:
 * 1. Use backend-calculated totals if they exist and are non-zero
 * 2. Fall back to client-side calculation from foods array
 * 3. Return zeros if no data available
 *
 * @param meal - Meal object from backend
 * @returns Nutrition totals
 */
export function calculateMealTotals(meal: Meal): MealNutritionTotals {
  // Strategy 1: Use backend totals if they exist and are non-zero
  const hasBackendTotals =
    meal.total_calories > 0 ||
    meal.total_protein_g > 0 ||
    meal.total_carbs_g > 0 ||
    meal.total_fat_g > 0

  if (hasBackendTotals) {
    console.log('✅ [Nutrition Calc] Using backend totals for meal:', meal.id)
    return {
      calories: meal.total_calories || 0,
      protein_g: meal.total_protein_g || 0,
      carbs_g: meal.total_carbs_g || 0,
      fat_g: meal.total_fat_g || 0,
      fiber_g: meal.total_fiber_g || 0
    }
  }

  // Strategy 2: Calculate from foods array if available
  if (meal.foods && meal.foods.length > 0) {
    console.log('⚠️ [Nutrition Calc] Backend totals are 0, calculating from foods for meal:', meal.id, 'Foods count:', meal.foods.length)

    const totals = meal.foods.reduce((acc, food) => ({
      calories: acc.calories + (food.calories || 0),
      protein_g: acc.protein_g + (food.protein_g || 0),
      carbs_g: acc.carbs_g + (food.carbs_g || 0),
      fat_g: acc.fat_g + (food.fat_g || 0),
      fiber_g: acc.fiber_g + (food.fiber_g || 0)
    }), {
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0
    })

    console.log('✅ [Nutrition Calc] Calculated totals:', totals)
    return totals
  }

  // Strategy 3: No data available
  console.warn('⚠️ [Nutrition Calc] No nutrition data available for meal:', meal.id)
  return {
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    fiber_g: 0
  }
}

/**
 * Check if a meal has any nutrition data (either from backend or foods)
 */
export function hasMealNutritionData(meal: Meal): boolean {
  const hasBackendTotals =
    meal.total_calories > 0 ||
    meal.total_protein_g > 0

  const hasFoodsData =
    meal.foods &&
    meal.foods.length > 0 &&
    meal.foods.some(f => f.calories > 0 || f.protein_g > 0)

  return hasBackendTotals || hasFoodsData
}

/**
 * Check if nutrition totals are likely missing (meal exists but all zeros)
 */
export function isMealMissingTotals(meal: Meal): boolean {
  const hasNoBackendTotals =
    meal.total_calories === 0 &&
    meal.total_protein_g === 0 &&
    meal.total_carbs_g === 0 &&
    meal.total_fat_g === 0

  const hasFoods = meal.foods && meal.foods.length > 0

  return hasNoBackendTotals && hasFoods
}

/**
 * Calculate daily nutrition summary from multiple meals
 */
export function calculateDailyTotals(meals: Meal[]): MealNutritionTotals {
  return meals.reduce((acc, meal) => {
    const mealTotals = calculateMealTotals(meal)
    return {
      calories: acc.calories + mealTotals.calories,
      protein_g: acc.protein_g + mealTotals.protein_g,
      carbs_g: acc.carbs_g + mealTotals.carbs_g,
      fat_g: acc.fat_g + mealTotals.fat_g,
      fiber_g: acc.fiber_g + mealTotals.fiber_g
    }
  }, {
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    fiber_g: 0
  })
}
