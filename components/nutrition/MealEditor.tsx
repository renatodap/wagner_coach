'use client'

import React, { useState, useMemo } from 'react'
import { Trash2, Edit2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Food } from '@/lib/api/foods'
import { FoodQuantityEditor } from './FoodQuantityEditor'

// Base weight units available for all foods
const BASE_WEIGHT_UNITS = ['g', 'oz']

export interface MealFood {
  food_id: string
  name: string
  brand?: string | null
  quantity: number
  unit: string
  serving_size: number
  serving_unit: string
  // Household serving fields (e.g., "1 slice", "1 medium")
  household_serving_size?: string
  household_serving_unit?: string
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

// Helper: Format display text for quantity + unit (e.g., "2 slices (214g)")
function formatQuantityDisplay(food: MealFood): string {
  const { quantity, unit, household_serving_unit } = food

  // If using household unit, show both serving and grams
  if (unit === household_serving_unit && household_serving_unit) {
    // Calculate equivalent grams
    const grams = convertToGrams(quantity, unit, food)
    const roundedGrams = Math.round(grams)

    // Pluralize unit if quantity > 1
    const pluralUnit = quantity > 1 ? pluralizeUnit(unit) : unit

    return `${quantity} ${pluralUnit} (${roundedGrams}g)`
  }

  // Otherwise just show the unit
  return `${quantity} ${unit}`
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

  function startEditing(index: number) {
    setEditingIndex(index)
  }

  function cancelEditing() {
    setEditingIndex(null)
  }

  function handleFoodUpdate(index: number, updatedFood: MealFood) {
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
          <div key={index} className="border border-iron-gray/30 rounded-lg p-4 bg-neutral-800 hover:bg-neutral-700/50 transition-all">
            {editingIndex === index ? (
              // Edit mode with new FoodQuantityEditor
              <div className="space-y-3">
                <div className="font-medium text-white mb-3">{food.name}</div>
                <FoodQuantityEditor
                  food={food}
                  onChange={(updatedFood) => handleFoodUpdate(index, updatedFood)}
                  showModeToggle={true}
                  initialMode="servings"
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
                    <div className="text-sm text-iron-gray mt-1">
                      {formatQuantityDisplay(food)}
                    </div>
                    <div className="text-sm text-iron-gray mt-1">
                      {Math.round(food.calories)} cal • {food.protein_g.toFixed(1)}g P • {food.carbs_g.toFixed(1)}g C • {food.fat_g.toFixed(1)}g F
                    </div>
                  </div>
                  <div className="flex gap-2 ml-2">
                    <button
                      onClick={() => startEditing(index)}
                      className="p-2 text-iron-gray hover:text-iron-orange hover:bg-iron-orange/10 rounded transition-colors"
                      aria-label="Edit food"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleRemoveFood(index)}
                      className="p-2 text-iron-gray hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                      aria-label="Remove food"
                    >
                      <Trash2 size={16} />
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
export function foodToMealFood(food: Food, quantity: number = 1, unit?: string): MealFood {
  const selectedUnit = unit || food.serving_unit || 'serving'

  // Calculate nutrition scaling
  const mealFood: MealFood = {
    food_id: food.id,
    name: food.name,
    brand: food.brand_name,
    quantity,
    unit: selectedUnit,
    serving_size: food.serving_size,
    serving_unit: food.serving_unit,
    household_serving_size: food.household_serving_size,
    household_serving_unit: food.household_serving_unit,
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    fiber_g: 0
  }

  const convertedQuantity = convertToBaseUnit(quantity, selectedUnit, mealFood)
  const quantityMultiplier = food.serving_size > 0 ? convertedQuantity / food.serving_size : 1

  // Apply multiplier to nutrition
  mealFood.calories = (food.calories || 0) * quantityMultiplier
  mealFood.protein_g = (food.protein_g || 0) * quantityMultiplier
  mealFood.carbs_g = (food.total_carbs_g || 0) * quantityMultiplier
  mealFood.fat_g = (food.total_fat_g || 0) * quantityMultiplier
  mealFood.fiber_g = (food.dietary_fiber_g || 0) * quantityMultiplier

  return mealFood
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
