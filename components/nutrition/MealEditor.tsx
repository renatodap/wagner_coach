'use client'

import React, { useState, useMemo } from 'react'
import { Trash2, Edit2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Food } from '@/lib/api/foods'

// Common units for food measurement
const COMMON_UNITS = ['g', 'oz', 'cup', 'tbsp', 'tsp', 'serving', 'piece', 'slice']

export interface MealFood {
  food_id: string
  name: string
  brand?: string | null
  quantity: number
  unit: string
  serving_size: number
  serving_unit: string
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

export function MealEditor({ foods, onFoodsChange, showTotals = true }: MealEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editQuantity, setEditQuantity] = useState('')
  const [editUnit, setEditUnit] = useState('')

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
    setEditQuantity(foods[index].quantity.toString())
    setEditUnit(foods[index].unit)
  }

  function cancelEditing() {
    setEditingIndex(null)
    setEditQuantity('')
    setEditUnit('')
  }

  function saveEditing(index: number) {
    const quantity = parseFloat(editQuantity)
    if (isNaN(quantity) || quantity <= 0) {
      return
    }

    const food = foods[index]
    const newFoods = [...foods]

    // Recalculate nutrition based on new quantity/unit
    const scaleFactor = calculateScaleFactor(
      quantity,
      editUnit,
      food.serving_size,
      food.serving_unit
    )

    newFoods[index] = {
      ...food,
      quantity,
      unit: editUnit,
      calories: food.calories * scaleFactor / calculateScaleFactor(food.quantity, food.unit, food.serving_size, food.serving_unit),
      protein_g: food.protein_g * scaleFactor / calculateScaleFactor(food.quantity, food.unit, food.serving_size, food.serving_unit),
      carbs_g: food.carbs_g * scaleFactor / calculateScaleFactor(food.quantity, food.unit, food.serving_size, food.serving_unit),
      fat_g: food.fat_g * scaleFactor / calculateScaleFactor(food.quantity, food.unit, food.serving_size, food.serving_unit),
      fiber_g: food.fiber_g * scaleFactor / calculateScaleFactor(food.quantity, food.unit, food.serving_size, food.serving_unit)
    }

    onFoodsChange(newFoods)
    cancelEditing()
  }

  function calculateScaleFactor(quantity: number, unit: string, servingSize: number, servingUnit: string): number {
    // Simplified scale calculation - just use quantity as multiplier for now
    // In production, this would handle unit conversions properly
    if (unit === 'serving') {
      return quantity
    }
    return quantity / servingSize
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
              // Edit mode
              <div className="space-y-3">
                <div className="font-medium text-white">{food.name}</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor={`quantity-${index}`} className="text-xs text-iron-gray">Quantity</Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      min="0"
                      step="0.1"
                      value={editQuantity}
                      onChange={(e) => setEditQuantity(e.target.value)}
                      className="text-sm bg-iron-black border-iron-gray/30 text-white focus:ring-iron-orange"
                      autoFocus
                    />
                  </div>
                  <div>
                    <Label htmlFor={`unit-${index}`} className="text-xs text-iron-gray">Unit</Label>
                    <select
                      id={`unit-${index}`}
                      value={editUnit}
                      onChange={(e) => setEditUnit(e.target.value)}
                      className="w-full bg-iron-black border border-iron-gray/30 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-iron-orange"
                    >
                      {COMMON_UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => saveEditing(index)}
                    className="flex-1 bg-iron-orange hover:bg-iron-orange/90"
                  >
                    <Check size={16} className="mr-1" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={cancelEditing}
                    className="flex-1 border-iron-gray/30 text-iron-gray hover:bg-iron-gray/20"
                  >
                    <X size={16} className="mr-1" />
                    Cancel
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
                      {food.quantity} {food.unit}
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

  return {
    food_id: food.id,
    name: food.name,
    brand: food.brand_name,
    quantity,
    unit: selectedUnit,
    serving_size: food.serving_size,
    serving_unit: food.serving_unit,
    calories: food.calories || 0,
    protein_g: food.protein_g || 0,
    carbs_g: food.carbs_g || 0,
    fat_g: food.fat_g || 0,
    fiber_g: food.fiber_g || 0
  }
}
