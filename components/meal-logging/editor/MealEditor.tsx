'use client'

import React, { useState, useMemo } from 'react'
import { Trash2, Edit2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Food } from '@/lib/meal-logging/api/foods'
import { DualQuantityEditor } from './DualQuantityEditor'
import { FoodQuantityConverter, type FoodEnhanced, type FoodQuantity, type NutritionValues } from '@/lib/meal-logging/utils/food-quantity-converter'

// Base weight units available for all foods
const BASE_WEIGHT_UNITS = ['g', 'oz']

export interface MealFood {
  food_id: string
  name: string
  brand?: string | null
  
  // NEW: Dual quantity tracking
  serving_quantity: number  // e.g., 2.5
  serving_unit: string | null  // e.g., "slice", "medium", null
  gram_quantity: number  // always in grams
  last_edited_field: 'serving' | 'grams'
  
  // Food serving info (for display and conversion)
  serving_size: number
  food_serving_unit: string
  household_serving_size?: string
  household_serving_unit?: string
  
  // Calculated nutrition (from gram_quantity)
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
}

interface MealEditorProps {
  foods: MealFood[]
  onFoodsChange: (foods: MealFood[]) => void
  showTotals?: boolean
}

// Helper: Get available units for a food (household unit + weight units)
function getAvailableUnits(food: MealFood): string[] {
  const units: string[] = []

  // Add household unit first if available (e.g., "slice", "medium")
  if (food.household_serving_unit) {
    units.push(food.household_serving_unit)
  }

  // Always add base weight units
  units.push(...BASE_WEIGHT_UNITS)

  return units
}

// Helper: Format display text for quantity + unit (e.g., "2 slices (56g)")
function formatQuantityDisplay(food: MealFood): string {
  const { serving_quantity, serving_unit, gram_quantity } = food

  // If has serving unit, show both
  if (serving_unit) {
    const formatted = FoodQuantityConverter.formatServingDisplay(serving_quantity, serving_unit)
    return `${formatted} (${gram_quantity.toFixed(0)}g)`
  }

  // Otherwise just show grams
  return `${gram_quantity.toFixed(0)}g`
}

// Helper: Pluralize common household units
function pluralizeUnit(unit: string): string {
  const pluralMap: Record<string, string> = {
    'slice': 'slices',
    'piece': 'pieces',
    'medium': 'medium',  // No plural for size adjectives
    'large': 'large',
    'small': 'small',
    'cup': 'cups',
    'tbsp': 'tbsp',
    'tsp': 'tsp',
    'oz': 'oz',
    'g': 'g'
  }

  return pluralMap[unit] || `${unit}s`  // Default: add 's'
}

// Helper: Convert quantity to grams for display
function convertToGrams(quantity: number, unit: string, food: MealFood): number {
  const convertedQuantity = convertToBaseUnit(quantity, unit, food)
  const quantityMultiplier = food.serving_size > 0 ? convertedQuantity / food.serving_size : 1
  return food.serving_size * quantityMultiplier
}

export function MealEditor({ foods, onFoodsChange, showTotals = true }: MealEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [focusField, setFocusField] = useState<'serving' | 'grams' | null>(null)

  // Calculate totals
  const totals = useMemo(() => {
    return foods.reduce(
      (acc, food) => ({
        calories: acc.calories + food.calories,
        protein_g: acc.protein_g + food.protein_g,
        carbs_g: acc.carbs_g + food.carbs_g,
        fat_g: acc.fat_g + food.fat_g,
        fiber_g: acc.fiber_g + food.fiber_g
      }),
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }
    )
  }, [foods])

  function handleRemoveFood(index: number) {
    const newFoods = foods.filter((_, i) => i !== index)
    onFoodsChange(newFoods)
  }

  function startEditing(index: number, field: 'serving' | 'grams') {
    setEditingIndex(index)
    setFocusField(field)
  }

  function cancelEditing() {
    setEditingIndex(null)
    setFocusField(null)
  }

  function handleFoodUpdate(index: number, quantity: FoodQuantity, nutrition: NutritionValues) {
    const food = foods[index]
    const updatedFood: MealFood = {
      ...food,
      serving_quantity: quantity.servingQuantity,
      serving_unit: quantity.servingUnit,
      gram_quantity: quantity.gramQuantity,
      last_edited_field: quantity.lastEditedField,
      calories: nutrition.calories,
      protein_g: nutrition.protein_g,
      carbs_g: nutrition.carbs_g,
      fat_g: nutrition.fat_g,
      fiber_g: nutrition.fiber_g
    }
    const newFoods = [...foods]
    newFoods[index] = updatedFood
    onFoodsChange(newFoods)
  }

  if (foods.length === 0) {
    return (
      <div className="text-center py-8 text-iron-gray">
        <p>No foods added yet. Search and add foods to your meal above.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Food Items */}
      <div className="space-y-3">
        {foods.map((food, index) => (
          <div key={`${food.food_id}-${index}`} className="border border-iron-gray/30 rounded-lg p-4 bg-neutral-800 hover:bg-neutral-700/50 transition-all">
            {editingIndex === index ? (
              // Edit mode with DualQuantityEditor
              <div className="space-y-3">
                <div className="font-medium text-white mb-3">{food.name}</div>
                {(() => {
                  // Debug logging
                  console.log('🔍 [MealEditor] Editing food:', {
                    name: food.name,
                    serving_size: food.serving_size,
                    food_serving_unit: food.food_serving_unit,
                    household_serving_size: food.household_serving_size,
                    household_serving_unit: food.household_serving_unit,
                    serving_quantity: food.serving_quantity,
                    serving_unit: food.serving_unit,
                    gram_quantity: food.gram_quantity
                  })
                  return null
                })()}
                <DualQuantityEditor
                  food={{
                    id: food.food_id,
                    name: food.name,
                    serving_size: food.serving_size,
                    serving_unit: food.food_serving_unit,
                    household_serving_grams: food.household_serving_size ? parseFloat(food.household_serving_size) : null,
                    household_serving_unit: food.household_serving_unit || null,
                    // Calculate per-serving nutrition (nutrition values stored are for current quantity)
                    // We need to normalize back to per-serving-size values
                    calories: food.serving_size > 0 && food.gram_quantity > 0
                      ? (food.calories * food.serving_size) / food.gram_quantity
                      : food.calories,
                    protein_g: food.serving_size > 0 && food.gram_quantity > 0
                      ? (food.protein_g * food.serving_size) / food.gram_quantity
                      : food.protein_g,
                    total_carbs_g: food.serving_size > 0 && food.gram_quantity > 0
                      ? (food.carbs_g * food.serving_size) / food.gram_quantity
                      : food.carbs_g,
                    total_fat_g: food.serving_size > 0 && food.gram_quantity > 0
                      ? (food.fat_g * food.serving_size) / food.gram_quantity
                      : food.fat_g,
                    dietary_fiber_g: food.serving_size > 0 && food.gram_quantity > 0
                      ? (food.fiber_g * food.serving_size) / food.gram_quantity
                      : food.fiber_g,
                    total_sugars_g: 0,
                    sodium_mg: 0
                  } as FoodEnhanced}
                  initialQuantity={{
                    servingQuantity: food.serving_quantity,
                    servingUnit: food.serving_unit,
                    gramQuantity: food.gram_quantity,
                    lastEditedField: food.last_edited_field
                  }}
                  onChange={(quantity, nutrition) => handleFoodUpdate(index, quantity, nutrition)}
                  focusField={focusField}
                />
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    onClick={cancelEditing}
                    className="flex-1 bg-iron-orange hover:bg-iron-orange/90"
                  >
                    <Check size={16} className="mr-1" />
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              // View mode
              <div>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-white">
                      {food.name}
                      {food.brand && (
                        <span className="text-iron-gray text-sm ml-2 font-normal">
                          ({food.brand})
                        </span>
                      )}
                    </div>

                    {/* Dual Quantity Display - Shows BOTH values prominently */}
                    <div className="flex gap-3 sm:gap-4 mt-2 flex-wrap">
                      {/* Serving quantity - only show if has household serving */}
                      {food.serving_unit && (
                        <div className="flex items-center gap-2 bg-iron-gray/10 px-4 py-3 sm:px-3 sm:py-2 rounded-lg group">
                          <div className="flex items-center gap-1.5 flex-1">
                            <span className="text-iron-gray text-xs uppercase font-medium">{food.serving_unit}:</span>
                            <span className="text-iron-white font-semibold text-base sm:text-sm">
                              {FoodQuantityConverter.formatServingDisplay(food.serving_quantity, food.serving_unit)}
                            </span>
                          </div>
                          <button
                            onClick={() => startEditing(index, 'serving')}
                            className="p-2.5 sm:p-2 rounded-md hover:bg-iron-orange/20 active:scale-95 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                            aria-label="Edit servings"
                          >
                            <Edit2 size={18} className="text-iron-gray group-hover:text-iron-orange transition-colors" />
                          </button>
                        </div>
                      )}

                      {/* Gram quantity - always shown */}
                      <div className="flex items-center gap-2 bg-iron-gray/10 px-4 py-3 sm:px-3 sm:py-2 rounded-lg group">
                        <div className="flex items-center gap-1.5 flex-1">
                          <span className="text-iron-gray text-xs uppercase font-medium">Weight:</span>
                          <span className="text-iron-white font-semibold text-base sm:text-sm">
                            {food.gram_quantity.toFixed(0)}g
                          </span>
                        </div>
                        <button
                          onClick={() => startEditing(index, 'grams')}
                          className="p-2.5 sm:p-2 rounded-md hover:bg-iron-orange/20 active:scale-95 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                          aria-label="Edit weight in grams"
                        >
                          <Edit2 size={18} className="text-iron-gray group-hover:text-iron-orange transition-colors" />
                        </button>
                      </div>
                    </div>

                    {/* Nutrition summary */}
                    <div className="text-sm text-iron-gray mt-2">
                      {Math.round(food.calories)} cal • {food.protein_g.toFixed(1)}g P • {food.carbs_g.toFixed(1)}g C • {food.fat_g.toFixed(1)}g F
                    </div>
                  </div>
                  <div className="flex gap-2 ml-2">
                    <button
                      onClick={() => handleRemoveFood(index)}
                      className="p-2.5 sm:p-2 text-iron-gray hover:text-red-400 hover:bg-red-400/10 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label="Remove food"
                    >
                      <Trash2 size={18} className="sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Totals */}
      {showTotals && (
        <div className="border-2 border-iron-orange rounded-lg p-4 bg-iron-orange/5">
          <h3 className="font-bold text-lg mb-3 text-white">Total Nutrition</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-xs text-iron-gray uppercase">Calories</p>
              <p className="text-2xl font-bold text-iron-orange">{Math.round(totals.calories)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-iron-gray uppercase">Protein</p>
              <p className="text-2xl font-bold text-iron-orange">{totals.protein_g.toFixed(1)}g</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-iron-gray uppercase">Carbs</p>
              <p className="text-2xl font-bold text-iron-orange">{totals.carbs_g.toFixed(1)}g</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-iron-gray uppercase">Fat</p>
              <p className="text-2xl font-bold text-iron-orange">{totals.fat_g.toFixed(1)}g</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-iron-gray uppercase">Fiber</p>
              <p className="text-2xl font-bold text-iron-orange">{totals.fiber_g.toFixed(1)}g</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to convert a Food to a MealFood with initial quantity
export function foodToMealFood(food: Food, initialQuantity: number = 1, initialField: 'serving' | 'grams' = 'serving'): MealFood {
  // Convert to FoodEnhanced format for converter
  const foodEnhanced: FoodEnhanced = {
    id: food.id,
    name: food.name,
    serving_size: food.serving_size,
    serving_unit: food.serving_unit,
    household_serving_grams: food.household_serving_grams || null,
    household_serving_unit: food.household_serving_unit || null,
    calories: food.calories || 0,
    protein_g: food.protein_g || 0,
    total_carbs_g: food.total_carbs_g || 0,
    total_fat_g: food.total_fat_g || 0,
    dietary_fiber_g: food.dietary_fiber_g || 0,
    total_sugars_g: food.total_sugars_g || 0,
    sodium_mg: food.sodium_mg || 0
  }

  // Calculate both quantities using converter
  const quantities = FoodQuantityConverter.calculateQuantities(
    foodEnhanced,
    initialQuantity,
    initialField
  )

  // Calculate nutrition from gram quantity
  const nutrition = FoodQuantityConverter.calculateNutrition(
    foodEnhanced,
    quantities.gramQuantity
  )

  // Build MealFood with dual quantity tracking
  return {
    food_id: food.id,
    name: food.name,
    brand: food.brand_name || null,
    
    // Dual quantity tracking
    serving_quantity: quantities.servingQuantity,
    serving_unit: quantities.servingUnit,
    gram_quantity: quantities.gramQuantity,
    last_edited_field: quantities.lastEditedField,
    
    // Food serving info
    serving_size: food.serving_size,
    food_serving_unit: food.serving_unit,
    household_serving_size: food.household_serving_grams?.toString(),
    household_serving_unit: food.household_serving_unit,
    
    // Calculated nutrition
    calories: nutrition.calories,
    protein_g: nutrition.protein_g,
    carbs_g: nutrition.carbs_g,
    fat_g: nutrition.fat_g,
    fiber_g: nutrition.fiber_g
  }
}

/**
 * Unit conversion function
 * Handles household units (slice, medium, cup) and weight units (g, oz)
 *
 * For household units:
 * - If fromUnit matches household_serving_unit, multiply quantity by serving_size
 * - Example: 2 slices × 107g/slice = 214g
 *
 * For weight units:
 * - Standard conversions (g ↔ oz)
 */
function convertToBaseUnit(quantity: number, fromUnit: string, food: MealFood): number {
  const { serving_size, serving_unit, household_serving_unit } = food

  // If converting FROM household unit (e.g., "slice" → grams)
  if (fromUnit === household_serving_unit && household_serving_unit) {
    // Each household serving equals serving_size grams
    // Example: 2 slices × 107g/slice = 214g
    const grams = quantity * serving_size

    // Convert to target unit if needed
    return convertWeightUnit(grams, 'g', serving_unit)
  }

  // Otherwise, standard weight unit conversion
  return convertWeightUnit(quantity, fromUnit, serving_unit)
}

/**
 * Convert between weight units (g, oz)
 */
function convertWeightUnit(quantity: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) {
    return quantity
  }

  // Convert to grams first
  let grams: number
  switch (fromUnit) {
    case 'g':
      grams = quantity
      break
    case 'oz':
      grams = quantity * 28.3495  // 1 oz = 28.3495g
      break
    default:
      grams = quantity  // Assume grams if unknown
  }

  // Convert from grams to target unit
  switch (toUnit) {
    case 'g':
      return grams
    case 'oz':
      return grams / 28.3495  // grams to oz
    default:
      return grams  // Return grams if unknown target
  }
}
