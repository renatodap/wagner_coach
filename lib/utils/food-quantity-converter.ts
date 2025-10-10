/**
 * Food Quantity Converter - Frontend
 * 
 * Handles bidirectional conversion between servings and grams.
 * Mirrors backend logic for consistent UX.
 * 
 * This is a pure TypeScript module with no dependencies.
 * All calculations happen client-side for instant feedback.
 */

export interface FoodEnhanced {
  id: string
  name: string
  serving_size: number
  serving_unit: string
  household_serving_size: string | null
  household_serving_unit: string | null
  calories: number
  protein_g: number
  total_carbs_g: number
  total_fat_g: number
  dietary_fiber_g: number
  total_sugars_g: number
  sodium_mg: number
}

export interface FoodQuantity {
  servingQuantity: number
  servingUnit: string | null
  gramQuantity: number
  lastEditedField: 'serving' | 'grams'
}

export interface NutritionValues {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  sugar_g: number
  sodium_mg: number
}

export class FoodQuantityConverter {
  /**
   * Calculate both quantities from user input
   * 
   * This is the core conversion function. Given one quantity (either
   * servings or grams), calculate the other quantity.
   * 
   * @param food - The food item with serving information
   * @param inputQuantity - The quantity entered by user
   * @param inputField - Which field was edited ('serving' or 'grams')
   * @returns Object with both serving and gram quantities
   * 
   * @example
   * const bread = {
   *   serving_size: 28,
   *   household_serving_size: "28",
   *   household_serving_unit: "slice"
   * }
   * 
   * const result = FoodQuantityConverter.calculateQuantities(bread, 2, 'serving')
   * // result.gramQuantity === 56
   */
  static calculateQuantities(
    food: FoodEnhanced,
    inputQuantity: number,
    inputField: 'serving' | 'grams'
  ): FoodQuantity {
    // Get grams per serving (priority: household > standard)
    const householdGrams = food.household_serving_size 
      ? parseFloat(food.household_serving_size) 
      : null
    
    let gramsPerServing = householdGrams && householdGrams > 0 
      ? householdGrams 
      : (food.serving_size || 100)
    
    // Ensure valid serving size
    if (gramsPerServing <= 0) {
      console.warn(`Invalid serving size for ${food.name}, using 100g default`)
      gramsPerServing = 100
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
    // Servings: 3 decimal places (0.001 precision)
    // Grams: 1 decimal place (0.1g precision)
    servingQuantity = Math.round(servingQuantity * 1000) / 1000
    gramQuantity = Math.round(gramQuantity * 10) / 10
    
    return {
      servingQuantity,
      servingUnit: food.household_serving_unit || 'serving',
      gramQuantity,
      lastEditedField: inputField
    }
  }
  
  /**
   * Calculate nutrition from gram quantity
   * 
   * CRITICAL: Nutrition is ALWAYS calculated from grams for consistency.
   * This ensures no rounding errors from back-and-forth conversions.
   * 
   * @param food - The food item with nutrition information
   * @param gramQuantity - Quantity in grams
   * @returns Object with calculated nutrition values
   * 
   * @example
   * const chicken = {
   *   serving_size: 100,
   *   calories: 165,
   *   protein_g: 31
   * }
   * 
   * const nutrition = FoodQuantityConverter.calculateNutrition(chicken, 150)
   * // nutrition.calories === 247.5
   * // nutrition.protein_g === 46.5
   */
  static calculateNutrition(
    food: FoodEnhanced,
    gramQuantity: number
  ): NutritionValues {
    let servingSize = food.serving_size || 100
    
    // Ensure valid serving size
    if (servingSize <= 0) {
      console.warn(`Invalid serving size for ${food.name}, using 100g`)
      servingSize = 100
    }
    
    const multiplier = gramQuantity / servingSize
    
    // Helper to round to 1 decimal place
    const round = (val: number) => Math.round(val * 10) / 10
    
    return {
      calories: round((food.calories || 0) * multiplier),
      protein_g: round((food.protein_g || 0) * multiplier),
      carbs_g: round((food.total_carbs_g || 0) * multiplier),
      fat_g: round((food.total_fat_g || 0) * multiplier),
      fiber_g: round((food.dietary_fiber_g || 0) * multiplier),
      sugar_g: round((food.total_sugars_g || 0) * multiplier),
      sodium_mg: round((food.sodium_mg || 0) * multiplier),
    }
  }
  
  /**
   * Format serving display with proper pluralization
   * 
   * @param quantity - Number of servings
   * @param unit - The unit name (can be null)
   * @returns Formatted string like "2 slices" or "1.5 servings"
   * 
   * @example
   * FoodQuantityConverter.formatServingDisplay(2, 'slice')
   * // Returns: "2 slices"
   * 
   * FoodQuantityConverter.formatServingDisplay(1, 'slice')
   * // Returns: "1 slice"
   * 
   * FoodQuantityConverter.formatServingDisplay(1.5, null)
   * // Returns: "1.5 servings"
   */
  static formatServingDisplay(quantity: number, unit: string | null): string {
    if (!unit) {
      const unitDisplay = quantity === 1 ? 'serving' : 'servings'
      return `${this.formatQuantity(quantity)} ${unitDisplay}`
    }
    
    const pluralMap: Record<string, string> = {
      'slice': 'slices',
      'piece': 'pieces',
      'scoop': 'scoops',
      'cup': 'cups',
      'tbsp': 'tbsp',
      'tsp': 'tsp',
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
    }
    
    const displayUnit = quantity === 1 ? unit : (pluralMap[unit.toLowerCase()] || `${unit}s`)
    return `${this.formatQuantity(quantity)} ${displayUnit}`
  }
  
  /**
   * Format quantity number for display (remove trailing zeros)
   * 
   * @param quantity - Number to format
   * @returns Formatted string
   * 
   * @example
   * formatQuantity(2.00)  // Returns: "2"
   * formatQuantity(2.50)  // Returns: "2.5"
   * formatQuantity(2.125) // Returns: "2.125"
   */
  private static formatQuantity(quantity: number): string {
    // Format to max 3 decimal places and remove trailing zeros
    return quantity.toFixed(3).replace(/\.?0+$/, '')
  }
  
  /**
   * Validate quantity value
   * 
   * @param quantity - Quantity to validate
   * @returns True if valid, false otherwise
   */
  static validateQuantity(quantity: number): boolean {
    if (isNaN(quantity)) return false
    if (quantity <= 0) return false
    if (quantity > 100000) return false // 100kg max
    return true
  }
  
  /**
   * Create initial quantity for a food item
   * 
   * Used when first adding a food to a meal.
   * Uses household serving if available, otherwise defaults to 1 serving.
   * 
   * @param food - The food item
   * @param quantity - Initial quantity (default: 1)
   * @param field - Which field to use ('serving' or 'grams', default: 'serving')
   * @returns FoodQuantity object
   */
  static createInitialQuantity(
    food: FoodEnhanced,
    quantity: number = 1,
    field: 'serving' | 'grams' = 'serving'
  ): FoodQuantity {
    return this.calculateQuantities(food, quantity, field)
  }
}
