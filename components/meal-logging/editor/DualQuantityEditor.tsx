'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Minus, Plus, Info } from 'lucide-react'
import {
  FoodQuantityConverter,
  type FoodEnhanced,
  type FoodQuantity,
  type NutritionValues
} from '@/lib/meal-logging/utils/food-quantity-converter'

interface DualQuantityEditorProps {
  food: FoodEnhanced
  initialQuantity: FoodQuantity
  onChange: (quantity: FoodQuantity, nutrition: NutritionValues) => void
  focusField?: 'serving' | 'grams' | null
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
  onChange,
  focusField = null
}: DualQuantityEditorProps) {
  const [quantity, setQuantity] = useState<FoodQuantity>(initialQuantity)
  const [nutrition, setNutrition] = useState<NutritionValues>(
    FoodQuantityConverter.calculateNutrition(food, initialQuantity.gramQuantity)
  )

  // Refs for auto-focus
  const servingInputRef = useRef<HTMLInputElement>(null)
  const gramsInputRef = useRef<HTMLInputElement>(null)

  // Check if food has household serving unit
  const hasHouseholdServing = Boolean(food.household_serving_unit)

  // Auto-focus and select text based on focusField
  useEffect(() => {
    if (focusField === 'serving' && servingInputRef.current) {
      setTimeout(() => {
        servingInputRef.current?.focus()
        servingInputRef.current?.select()
      }, 100)
    } else if (focusField === 'grams' && gramsInputRef.current) {
      setTimeout(() => {
        gramsInputRef.current?.focus()
        gramsInputRef.current?.select()
      }, 100)
    }
  }, [focusField])
  
  // Debug logging
  console.log('🎨 [DualQuantityEditor] Rendering:', {
    food_name: food.name,
    household_serving_unit: food.household_serving_unit,
    hasHouseholdServing,
    initialQuantity,
    currentQuantity: quantity
  })
  
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
      {/* Info banner explaining dual sync - Mobile optimized */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 sm:p-2.5 flex items-start gap-2">
        <Info size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm sm:text-xs text-blue-400">
          <strong>Dual Editing:</strong> {hasHouseholdServing ? 'Edit servings or grams - syncs automatically' : 'Edit grams to adjust quantity'}
        </p>
      </div>

      {/* Serving Input - Only show if food has household serving */}
      {hasHouseholdServing && (
        <div className="space-y-2">
          <label className={`text-xs uppercase font-medium block flex items-center gap-2 transition-colors ${
            focusField === 'serving' ? 'text-iron-orange' : 'text-iron-gray'
          }`}>
            <span>{quantity.servingUnit || 'Servings'}</span>
            {focusField === 'serving' && (
              <span className="text-iron-orange text-xs font-semibold animate-pulse">← EDIT THIS</span>
            )}
          </label>
          <div className="flex items-center gap-2 sm:gap-1.5">
            <button
              onClick={() => handleServingChange(Math.max(0.25, quantity.servingQuantity - 0.25))}
              className="bg-iron-gray/20 hover:bg-iron-gray/40 active:scale-95 p-2.5 sm:p-2 text-iron-white rounded transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Decrease servings by 0.25"
            >
              <Minus size={18} className="sm:w-4 sm:h-4" />
            </button>
            <input
              ref={servingInputRef}
              type="number"
              inputMode="decimal"
              value={quantity.servingQuantity.toFixed(2)}
              onChange={(e) => handleServingChange(parseFloat(e.target.value) || 0)}
              step="0.25"
              min="0"
              className={`flex-1 bg-iron-black border px-4 py-3 sm:py-2 text-iron-white text-center rounded focus:outline-none text-lg sm:text-base font-medium transition-all ${
                focusField === 'serving'
                  ? 'border-iron-orange ring-4 ring-iron-orange/30 scale-105 shadow-lg shadow-iron-orange/20'
                  : 'border-iron-gray/50 focus:ring-2 focus:ring-iron-orange'
              }`}
            />
            <button
              onClick={() => handleServingChange(quantity.servingQuantity + 0.25)}
              className="bg-iron-gray/20 hover:bg-iron-gray/40 active:scale-95 p-2.5 sm:p-2 text-iron-white rounded transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Increase servings by 0.25"
            >
              <Plus size={18} className="sm:w-4 sm:h-4" />
            </button>
          </div>
          <p className="text-xs text-iron-gray text-center">
            = {quantity.gramQuantity.toFixed(1)}g
          </p>
        </div>
      )}
      
      {/* Grams Input - Always shown */}
      <div className="space-y-2">
        <label className={`text-xs uppercase font-medium block flex items-center gap-2 transition-colors ${
          focusField === 'grams' ? 'text-iron-orange' : 'text-iron-gray'
        }`}>
          <span>Grams</span>
          {focusField === 'grams' && (
            <span className="text-iron-orange text-xs font-semibold animate-pulse">← EDIT THIS</span>
          )}
        </label>
        <div className="flex items-center gap-2 sm:gap-1.5">
          <button
            onClick={() => handleGramChange(Math.max(1, quantity.gramQuantity - 10))}
            className="bg-iron-gray/20 hover:bg-iron-gray/40 active:scale-95 px-2.5 sm:px-2 py-2.5 sm:py-2 text-iron-white rounded transition-all text-sm sm:text-xs min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Decrease by 10g"
          >
            -10
          </button>
          <button
            onClick={() => handleGramChange(Math.max(1, quantity.gramQuantity - 1))}
            className="bg-iron-gray/20 hover:bg-iron-gray/40 active:scale-95 p-2.5 sm:p-2 text-iron-white rounded transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Decrease by 1g"
          >
            <Minus size={18} className="sm:w-4 sm:h-4" />
          </button>
          <input
            ref={gramsInputRef}
            type="number"
            inputMode="decimal"
            value={quantity.gramQuantity.toFixed(1)}
            onChange={(e) => handleGramChange(parseFloat(e.target.value) || 0)}
            step="1"
            min="0"
            className={`flex-1 bg-iron-black border px-4 py-3 sm:py-2 text-iron-white text-center rounded focus:outline-none text-lg sm:text-base font-medium transition-all ${
              focusField === 'grams'
                ? 'border-iron-orange ring-4 ring-iron-orange/30 scale-105 shadow-lg shadow-iron-orange/20'
                : 'border-iron-gray/50 focus:ring-2 focus:ring-iron-orange'
            }`}
          />
          <button
            onClick={() => handleGramChange(quantity.gramQuantity + 1)}
            className="bg-iron-gray/20 hover:bg-iron-gray/40 active:scale-95 p-2.5 sm:p-2 text-iron-white rounded transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Increase by 1g"
          >
            <Plus size={18} className="sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={() => handleGramChange(quantity.gramQuantity + 10)}
            className="bg-iron-gray/20 hover:bg-iron-gray/40 active:scale-95 px-2.5 sm:px-2 py-2.5 sm:py-2 text-iron-white rounded transition-all text-sm sm:text-xs min-w-[44px] min-h-[44px] flex items-center justify-center"
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
