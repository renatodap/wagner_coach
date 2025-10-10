'use client'

import React, { useState, useEffect } from 'react'
import { Minus, Plus } from 'lucide-react'
import { 
  FoodQuantityConverter, 
  type FoodEnhanced, 
  type FoodQuantity, 
  type NutritionValues 
} from '@/lib/utils/food-quantity-converter'

interface DualQuantityEditorProps {
  food: FoodEnhanced
  initialQuantity: FoodQuantity
  onChange: (quantity: FoodQuantity, nutrition: NutritionValues) => void
}

/**
 * DualQuantityEditor Component
 * 
 * Shows BOTH serving and gram inputs simultaneously.
 * When user edits either field, the other updates automatically.
 * 
 * Features:
 * - Two separate input boxes (servings and grams)
 * - Real-time bidirectional synchronization
 * - Live nutrition preview
 * - +/- buttons for quick adjustments
 * - Proper validation and edge case handling
 */
export function DualQuantityEditor({
  food,
  initialQuantity,
  onChange
}: DualQuantityEditorProps) {
  const [quantity, setQuantity] = useState<FoodQuantity>(initialQuantity)
  const [nutrition, setNutrition] = useState<NutritionValues>(
    FoodQuantityConverter.calculateNutrition(food, initialQuantity.gramQuantity)
  )
  
  // Check if food has household serving unit
  const hasHouseholdServing = Boolean(food.household_serving_unit)
  
  /**
   * Handle serving quantity change
   * User edited the serving input -> calculate new gram quantity
   */
  const handleServingChange = (value: number) => {
    if (!FoodQuantityConverter.validateQuantity(value)) {
      console.warn('Invalid serving quantity:', value)
      return
    }
    
    // Calculate both quantities
    const newQuantity = FoodQuantityConverter.calculateQuantities(
      food,
      value,
      'serving'
    )
    
    // Calculate nutrition from grams
    const newNutrition = FoodQuantityConverter.calculateNutrition(
      food,
      newQuantity.gramQuantity
    )
    
    // Update state
    setQuantity(newQuantity)
    setNutrition(newNutrition)
    
    // Notify parent
    onChange(newQuantity, newNutrition)
  }
  
  /**
   * Handle gram quantity change
   * User edited the gram input -> calculate new serving quantity
   */
  const handleGramChange = (value: number) => {
    if (!FoodQuantityConverter.validateQuantity(value)) {
      console.warn('Invalid gram quantity:', value)
      return
    }
    
    // Calculate both quantities
    const newQuantity = FoodQuantityConverter.calculateQuantities(
      food,
      value,
      'grams'
    )
    
    // Calculate nutrition from grams
    const newNutrition = FoodQuantityConverter.calculateNutrition(
      food,
      newQuantity.gramQuantity
    )
    
    // Update state
    setQuantity(newQuantity)
    setNutrition(newNutrition)
    
    // Notify parent
    onChange(newQuantity, newNutrition)
  }
  
  return (
    <div className="space-y-4">
      {/* Serving Input - Only show if food has household serving */}
      {hasHouseholdServing && (
        <div className="space-y-2">
          <label className="text-xs text-iron-gray uppercase font-medium block">
            {quantity.servingUnit || 'Servings'}
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleServingChange(Math.max(0.25, quantity.servingQuantity - 0.25))}
              className="bg-iron-gray/20 hover:bg-iron-gray/40 px-3 py-2 text-iron-white rounded transition-colors"
              aria-label="Decrease servings by 0.25"
            >
              <Minus size={16} />
            </button>
            <input
              type="number"
              value={quantity.servingQuantity.toFixed(2)}
              onChange={(e) => handleServingChange(parseFloat(e.target.value) || 0)}
              step="0.25"
              min="0"
              className="flex-1 bg-iron-black border border-iron-gray/50 px-4 py-2 text-iron-white text-center rounded focus:outline-none focus:ring-2 focus:ring-iron-orange text-lg font-medium"
            />
            <button
              onClick={() => handleServingChange(quantity.servingQuantity + 0.25)}
              className="bg-iron-gray/20 hover:bg-iron-gray/40 px-3 py-2 text-iron-white rounded transition-colors"
              aria-label="Increase servings by 0.25"
            >
              <Plus size={16} />
            </button>
          </div>
          <p className="text-xs text-iron-gray text-center">
            = {quantity.gramQuantity.toFixed(1)}g
          </p>
        </div>
      )}
      
      {/* Grams Input - Always shown */}
      <div className="space-y-2">
        <label className="text-xs text-iron-gray uppercase font-medium block">
          Grams
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleGramChange(Math.max(1, quantity.gramQuantity - 10))}
            className="bg-iron-gray/20 hover:bg-iron-gray/40 px-3 py-2 text-iron-white rounded transition-colors text-sm"
            aria-label="Decrease by 10g"
          >
            -10
          </button>
          <button
            onClick={() => handleGramChange(Math.max(1, quantity.gramQuantity - 1))}
            className="bg-iron-gray/20 hover:bg-iron-gray/40 px-3 py-2 text-iron-white rounded transition-colors"
            aria-label="Decrease by 1g"
          >
            <Minus size={16} />
          </button>
          <input
            type="number"
            value={quantity.gramQuantity.toFixed(1)}
            onChange={(e) => handleGramChange(parseFloat(e.target.value) || 0)}
            step="1"
            min="0"
            className="flex-1 bg-iron-black border border-iron-gray/50 px-4 py-2 text-iron-white text-center rounded focus:outline-none focus:ring-2 focus:ring-iron-orange text-lg font-medium"
          />
          <button
            onClick={() => handleGramChange(quantity.gramQuantity + 1)}
            className="bg-iron-gray/20 hover:bg-iron-gray/40 px-3 py-2 text-iron-white rounded transition-colors"
            aria-label="Increase by 1g"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={() => handleGramChange(quantity.gramQuantity + 10)}
            className="bg-iron-gray/20 hover:bg-iron-gray/40 px-3 py-2 text-iron-white rounded transition-colors text-sm"
            aria-label="Increase by 10g"
          >
            +10
          </button>
        </div>
        {hasHouseholdServing && (
          <p className="text-xs text-iron-gray text-center">
            ≈ {FoodQuantityConverter.formatServingDisplay(
              quantity.servingQuantity, 
              quantity.servingUnit
            )}
          </p>
        )}
      </div>
      
      {/* Nutrition Preview */}
      <div className="flex justify-around gap-2 text-xs text-iron-gray bg-iron-gray/5 rounded-md p-3 border border-iron-gray/20">
        <div className="text-center">
          <div className="text-iron-white font-bold text-base">
            {Math.round(nutrition.calories)}
          </div>
          <div className="uppercase">cal</div>
        </div>
        <div className="text-center">
          <div className="text-iron-white font-bold text-base">
            {nutrition.protein_g.toFixed(1)}g
          </div>
          <div className="uppercase">protein</div>
        </div>
        <div className="text-center">
          <div className="text-iron-white font-bold text-base">
            {nutrition.carbs_g.toFixed(1)}g
          </div>
          <div className="uppercase">carbs</div>
        </div>
        <div className="text-center">
          <div className="text-iron-white font-bold text-base">
            {nutrition.fat_g.toFixed(1)}g
          </div>
          <div className="uppercase">fat</div>
        </div>
      </div>
    </div>
  )
}
