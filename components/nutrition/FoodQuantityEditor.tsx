'use client'

import React, { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import type { MealFood } from './MealEditor'
import {
  getGramsPerHouseholdServing,
  gramsToServings,
  servingsToGrams,
  calculateNutritionForGrams,
  formatServingDisplay,
} from '@/lib/utils/serving-conversions'

interface FoodQuantityEditorProps {
  food: MealFood
  onChange: (updated: MealFood) => void
  /** Show mode toggle (default: true) */
  showModeToggle?: boolean
  /** Initial input mode (default: 'servings') */
  initialMode?: 'servings' | 'grams'
}

/**
 * FoodQuantityEditor
 * 
 * Dual-input component that allows users to adjust food quantity in either:
 * 1. Common servings (slices, scoops, medium, etc.) - more intuitive
 * 2. Grams - precise measurement
 * 
 * Features:
 * - Bidirectional conversion (servings ↔ grams)
 * - Real-time nutrition calculations
 * - +/- buttons for quick adjustments
 * - Direct input for precise values
 * - Graceful fallback for foods without household servings
 */
export function FoodQuantityEditor({
  food,
  onChange,
  showModeToggle = true,
  initialMode = 'servings',
}: FoodQuantityEditorProps) {
  const hasHouseholdServing = Boolean(food.household_serving_unit)
  const [inputMode, setInputMode] = useState<'servings' | 'grams'>(
    hasHouseholdServing ? initialMode : 'grams'
  )

  // Get conversion data
  const gramsPerServing = getGramsPerHouseholdServing(food)
  
  // Current quantity is always stored in grams
  const currentGrams = food.quantity
  const currentServings = gramsToServings(currentGrams, food)

  // Calculate nutrition per gram for real-time preview
  const servingSize = food.serving_size || 100
  const nutritionPerGram = {
    calories: (food.calories || 0) / servingSize,
    protein: (food.protein_g || 0) / servingSize,
    carbs: (food.carbs_g || 0) / servingSize,
    fat: (food.fat_g || 0) / servingSize,
    fiber: (food.fiber_g || 0) / servingSize,
  }

  // Update handlers
  const handleServingsChange = (newServings: number) => {
    const newGrams = servingsToGrams(newServings, food)
    updateFoodQuantity(newGrams)
  }

  const handleGramsChange = (newGrams: number) => {
    updateFoodQuantity(newGrams)
  }

  const updateFoodQuantity = (newGrams: number) => {
    // Ensure positive values
    const grams = Math.max(1, newGrams)
    
    // Recalculate nutrition
    const nutrition = calculateNutritionForGrams(food, grams)
    
    onChange({
      ...food,
      quantity: grams,
      unit: 'g',
      calories: nutrition.calories,
      protein_g: nutrition.protein_g,
      carbs_g: nutrition.carbs_g,
      fat_g: nutrition.fat_g,
      fiber_g: nutrition.fiber_g,
    })
  }

  return (
    <div className="space-y-3">
      {/* Mode Toggle - only show if food has household serving */}
      {showModeToggle && hasHouseholdServing && (
        <div className="flex gap-2 text-xs font-medium">
          <button
            onClick={() => setInputMode('servings')}
            className={`px-3 py-1 rounded transition-colors ${
              inputMode === 'servings'
                ? 'bg-iron-orange text-white'
                : 'text-iron-gray hover:text-white'
            }`}
          >
            Common Servings
          </button>
          <span className="text-iron-gray self-center">|</span>
          <button
            onClick={() => setInputMode('grams')}
            className={`px-3 py-1 rounded transition-colors ${
              inputMode === 'grams'
                ? 'bg-iron-orange text-white'
                : 'text-iron-gray hover:text-white'
            }`}
          >
            Grams
          </button>
        </div>
      )}

      {/* Input Controls */}
      {inputMode === 'servings' && hasHouseholdServing ? (
        // Common servings input
        <div>
          <label className="text-xs text-iron-gray uppercase font-medium block mb-2">
            {food.household_serving_unit || 'Servings'}
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleServingsChange(Math.max(0.25, currentServings - 0.25))}
              className="bg-iron-gray/20 hover:bg-iron-gray/40 px-4 py-3 text-iron-white rounded-md transition-colors flex-shrink-0"
              aria-label="Decrease servings"
            >
              <Minus size={18} />
            </button>
            <input
              type="number"
              value={currentServings.toFixed(2)}
              onChange={(e) => handleServingsChange(parseFloat(e.target.value) || 0)}
              step="0.25"
              min="0"
              className="flex-1 bg-iron-black border border-iron-gray/50 px-4 py-3 text-iron-white text-center rounded-md focus:outline-none focus:ring-2 focus:ring-iron-orange text-lg font-medium"
            />
            <button
              onClick={() => handleServingsChange(currentServings + 0.25)}
              className="bg-iron-gray/20 hover:bg-iron-gray/40 px-4 py-3 text-iron-white rounded-md transition-colors flex-shrink-0"
              aria-label="Increase servings"
            >
              <Plus size={18} />
            </button>
          </div>
          <p className="text-xs text-iron-gray mt-2 text-center">
            = {currentGrams.toFixed(0)}g
          </p>
        </div>
      ) : (
        // Grams input
        <div>
          <label className="text-xs text-iron-gray uppercase font-medium block mb-2">
            Grams
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleGramsChange(Math.max(1, currentGrams - 10))}
              className="bg-iron-gray/20 hover:bg-iron-gray/40 px-3 py-3 text-iron-white rounded-md transition-colors text-sm flex-shrink-0"
              aria-label="Decrease by 10g"
            >
              -10
            </button>
            <button
              onClick={() => handleGramsChange(Math.max(1, currentGrams - 1))}
              className="bg-iron-gray/20 hover:bg-iron-gray/40 px-3 py-3 text-iron-white rounded-md transition-colors flex-shrink-0"
              aria-label="Decrease by 1g"
            >
              <Minus size={16} />
            </button>
            <input
              type="number"
              value={currentGrams.toFixed(0)}
              onChange={(e) => handleGramsChange(parseFloat(e.target.value) || 0)}
              step="1"
              min="0"
              className="flex-1 bg-iron-black border border-iron-gray/50 px-4 py-3 text-iron-white text-center rounded-md focus:outline-none focus:ring-2 focus:ring-iron-orange text-lg font-medium"
            />
            <button
              onClick={() => handleGramsChange(currentGrams + 1)}
              className="bg-iron-gray/20 hover:bg-iron-gray/40 px-3 py-3 text-iron-white rounded-md transition-colors flex-shrink-0"
              aria-label="Increase by 1g"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => handleGramsChange(currentGrams + 10)}
              className="bg-iron-gray/20 hover:bg-iron-gray/40 px-3 py-3 text-iron-white rounded-md transition-colors text-sm flex-shrink-0"
              aria-label="Increase by 10g"
            >
              +10
            </button>
          </div>
          {hasHouseholdServing && (
            <p className="text-xs text-iron-gray mt-2 text-center">
              ≈ {formatServingDisplay(parseFloat(currentServings.toFixed(2)), food.household_serving_unit!)}
            </p>
          )}
        </div>
      )}

      {/* Nutrition Preview */}
      <div className="flex justify-around gap-2 text-xs text-iron-gray bg-iron-gray/5 rounded-md p-3 border border-iron-gray/20">
        <div className="text-center">
          <div className="text-iron-white font-bold text-base">
            {Math.round(nutritionPerGram.calories * currentGrams)}
          </div>
          <div className="uppercase">cal</div>
        </div>
        <div className="text-center">
          <div className="text-iron-white font-bold text-base">
            {(nutritionPerGram.protein * currentGrams).toFixed(1)}g
          </div>
          <div className="uppercase">protein</div>
        </div>
        <div className="text-center">
          <div className="text-iron-white font-bold text-base">
            {(nutritionPerGram.carbs * currentGrams).toFixed(1)}g
          </div>
          <div className="uppercase">carbs</div>
        </div>
        <div className="text-center">
          <div className="text-iron-white font-bold text-base">
            {(nutritionPerGram.fat * currentGrams).toFixed(1)}g
          </div>
          <div className="uppercase">fat</div>
        </div>
      </div>
    </div>
  )
}
