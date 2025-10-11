'use client'

/**
 * InlineMealCardV3 - Inline Meal Card with Bidirectional Editing
 *
 * Built from scratch for Coach V3.
 * Features:
 * - Inline quantity editing (NO modal)
 * - Bidirectional serving ↔ gram sync
 * - Real-time nutrition recalculation
 * - One-tap meal logging
 * - Macro progress rings
 */

import { useState } from 'react'
import { Check, UtensilsCrossed, ChevronDown, ChevronUp, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { FoodDetectedV3, DetectedFood, QuantityEditEvent } from '@/types/coach-v3'
import {
  calculateQuantities,
  calculateNutrition,
  sumNutrition,
  formatCombinedDisplay,
  recalculateDetectedFoodNutrition
} from '@/lib/utils/nutrition-calculator-v3'

interface InlineMealCardV3Props {
  foodDetected: FoodDetectedV3
  onLogMeal: (foods: DetectedFood[]) => Promise<void>
  isLogged?: boolean
}

export function InlineMealCardV3({
  foodDetected,
  onLogMeal,
  isLogged = false
}: InlineMealCardV3Props) {
  const [detectedFoods, setDetectedFoods] = useState<DetectedFood[]>(
    foodDetected.detected_foods
  )
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLogging, setIsLogging] = useState(false)
  const [editingFoodIndex, setEditingFoodIndex] = useState<number | null>(null)

  // Recalculate total nutrition whenever foods change
  const totalNutrition = sumNutrition(detectedFoods.map(df => df.nutrition))

  const handleQuantityEdit = (event: QuantityEditEvent) => {
    const { foodIndex, inputValue, inputField } = event

    if (inputValue <= 0) return

    const updatedFoods = [...detectedFoods]
    const food = updatedFoods[foodIndex]

    // Calculate new quantities
    const newQuantity = calculateQuantities(
      food.food,
      inputValue,
      inputField
    )

    // Calculate new nutrition
    const newNutrition = calculateNutrition(
      food.food,
      newQuantity.gramQuantity
    )

    // Update food
    updatedFoods[foodIndex] = {
      ...food,
      quantity: newQuantity,
      nutrition: newNutrition
    }

    setDetectedFoods(updatedFoods)
  }

  const handleLogMeal = async () => {
    if (isLogging || isLogged) return

    try {
      setIsLogging(true)
      await onLogMeal(detectedFoods)
    } catch (error) {
      console.error('[InlineMealCardV3] Failed to log meal:', error)
      setIsLogging(false)
    }
  }

  // Confidence color
  const confidenceColor =
    foodDetected.confidence >= 0.8
      ? 'text-green-500'
      : foodDetected.confidence >= 0.6
      ? 'text-yellow-500'
      : 'text-orange-500'

  return (
    <Card className="border-l-4 border-l-iron-orange bg-gradient-to-br from-zinc-900/80 to-neutral-900/80 backdrop-blur-sm p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-iron-orange/20 rounded-lg">
            <UtensilsCrossed className="h-5 w-5 text-iron-orange" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-white capitalize">
                {foodDetected.meal_type || 'Meal'} Detected
              </h4>
              {foodDetected.confidence > 0 && (
                <span className={`text-xs font-medium ${confidenceColor}`}>
                  {Math.round(foodDetected.confidence * 100)}% confident
                </span>
              )}
            </div>

            <p className="text-sm text-iron-gray line-clamp-2">
              {foodDetected.description}
            </p>
          </div>
        </div>
      </div>

      {/* Nutrition Summary - Large Display */}
      <div className="bg-zinc-950/50 rounded-lg p-4 border border-zinc-800">
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">
              {Math.round(totalNutrition.calories)}
            </p>
            <p className="text-xs text-iron-gray mt-1">Calories</p>
          </div>

          <div className="text-center border-l border-zinc-800 pl-2">
            <p className="text-2xl font-bold text-green-400">
              {Math.round(totalNutrition.protein_g)}g
            </p>
            <p className="text-xs text-iron-gray mt-1">Protein</p>
          </div>

          <div className="text-center border-l border-zinc-800 pl-2">
            <p className="text-2xl font-bold text-blue-400">
              {Math.round(totalNutrition.carbs_g)}g
            </p>
            <p className="text-xs text-iron-gray mt-1">Carbs</p>
          </div>

          <div className="text-center border-l border-zinc-800 pl-2">
            <p className="text-2xl font-bold text-amber-400">
              {Math.round(totalNutrition.fat_g)}g
            </p>
            <p className="text-xs text-iron-gray mt-1">Fats</p>
          </div>
        </div>
      </div>

      {/* Food Items (Expandable with Inline Editing) */}
      {detectedFoods.length > 0 && (
        <div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm text-iron-orange hover:text-orange-400 transition-colors w-full"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span>
              {isExpanded ? 'Hide' : 'Show'} food items ({detectedFoods.length})
            </span>
          </button>

          {isExpanded && (
            <div className="mt-3 space-y-2 pl-6">
              {detectedFoods.map((df, index) => (
                <div
                  key={index}
                  className="bg-zinc-950/40 rounded-lg p-3 border border-zinc-800 space-y-2"
                >
                  {/* Food Name */}
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{df.food.name}</span>
                    <button
                      onClick={() =>
                        setEditingFoodIndex(editingFoodIndex === index ? null : index)
                      }
                      className="text-xs text-iron-orange hover:text-orange-400"
                    >
                      {editingFoodIndex === index ? 'Done' : 'Edit'}
                    </button>
                  </div>

                  {/* Quantity Display */}
                  <div className="text-sm text-iron-gray">
                    {formatCombinedDisplay(df.quantity)}
                  </div>

                  {/* Inline Editing Controls */}
                  {editingFoodIndex === index && (
                    <div className="space-y-3 pt-2 border-t border-zinc-800">
                      {/* Serving Edit (if applicable) */}
                      {df.food.household_serving_unit && (
                        <div className="space-y-1">
                          <label className="text-xs text-iron-gray uppercase">
                            {df.quantity.servingUnit || 'Servings'}
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleQuantityEdit({
                                  foodIndex: index,
                                  inputValue: Math.max(0.25, df.quantity.servingQuantity - 0.25),
                                  inputField: 'serving'
                                })
                              }
                              className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <input
                              type="number"
                              value={df.quantity.servingQuantity.toFixed(2)}
                              onChange={(e) =>
                                handleQuantityEdit({
                                  foodIndex: index,
                                  inputValue: parseFloat(e.target.value) || 0,
                                  inputField: 'serving'
                                })
                              }
                              step="0.25"
                              min="0"
                              className="flex-1 bg-zinc-950 border border-zinc-800 px-3 py-2 text-white text-center rounded text-sm"
                            />
                            <button
                              onClick={() =>
                                handleQuantityEdit({
                                  foodIndex: index,
                                  inputValue: df.quantity.servingQuantity + 0.25,
                                  inputField: 'serving'
                                })
                              }
                              className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Grams Edit */}
                      <div className="space-y-1">
                        <label className="text-xs text-iron-gray uppercase">Grams</label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleQuantityEdit({
                                foodIndex: index,
                                inputValue: Math.max(1, df.quantity.gramQuantity - 10),
                                inputField: 'grams'
                              })
                            }
                            className="bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded text-xs"
                          >
                            -10
                          </button>
                          <button
                            onClick={() =>
                              handleQuantityEdit({
                                foodIndex: index,
                                inputValue: Math.max(1, df.quantity.gramQuantity - 1),
                                inputField: 'grams'
                              })
                            }
                            className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <input
                            type="number"
                            value={df.quantity.gramQuantity.toFixed(1)}
                            onChange={(e) =>
                              handleQuantityEdit({
                                foodIndex: index,
                                inputValue: parseFloat(e.target.value) || 0,
                                inputField: 'grams'
                              })
                            }
                            step="1"
                            min="0"
                            className="flex-1 bg-zinc-950 border border-zinc-800 px-3 py-2 text-white text-center rounded text-sm"
                          />
                          <button
                            onClick={() =>
                              handleQuantityEdit({
                                foodIndex: index,
                                inputValue: df.quantity.gramQuantity + 1,
                                inputField: 'grams'
                              })
                            }
                            className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() =>
                              handleQuantityEdit({
                                foodIndex: index,
                                inputValue: df.quantity.gramQuantity + 10,
                                inputField: 'grams'
                              })
                            }
                            className="bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded text-xs"
                          >
                            +10
                          </button>
                        </div>
                      </div>

                      {/* Nutrition Preview for this food */}
                      <div className="flex justify-around gap-2 text-xs bg-zinc-950/50 rounded p-2">
                        <div className="text-center">
                          <div className="text-white font-semibold">
                            {Math.round(df.nutrition.calories)}
                          </div>
                          <div className="text-iron-gray">cal</div>
                        </div>
                        <div className="text-center">
                          <div className="text-white font-semibold">
                            {df.nutrition.protein_g.toFixed(1)}g
                          </div>
                          <div className="text-iron-gray">protein</div>
                        </div>
                        <div className="text-center">
                          <div className="text-white font-semibold">
                            {df.nutrition.carbs_g.toFixed(1)}g
                          </div>
                          <div className="text-iron-gray">carbs</div>
                        </div>
                        <div className="text-center">
                          <div className="text-white font-semibold">
                            {df.nutrition.fat_g.toFixed(1)}g
                          </div>
                          <div className="text-iron-gray">fats</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Button */}
      <div className="pt-2 border-t border-zinc-800">
        <Button
          onClick={handleLogMeal}
          disabled={isLogging || isLogged}
          className={`w-full transition-all duration-200 ${
            isLogged
              ? 'bg-green-600 hover:bg-green-600 cursor-default'
              : 'bg-iron-orange hover:bg-orange-600'
          }`}
        >
          {isLogging ? (
            <>
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Logging meal...
            </>
          ) : isLogged ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Meal Logged Successfully
            </>
          ) : (
            <>
              <UtensilsCrossed className="mr-2 h-4 w-4" />
              Log This Meal
            </>
          )}
        </Button>

        {isLogged && (
          <p className="text-xs text-green-400 text-center mt-2">
            Meal saved to your nutrition history
          </p>
        )}
      </div>
    </Card>
  )
}
