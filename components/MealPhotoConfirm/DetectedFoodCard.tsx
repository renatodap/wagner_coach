'use client'

/**
 * DetectedFoodCard
 *
 * Displays a single detected food item with nutrition information
 * for the photo meal confirmation page.
 *
 * Shows:
 * - Food name and brand
 * - Amount in grams and common unit
 * - Key macros (calories, protein, carbs, fat)
 * - Match confidence indicator
 */

import { ChefHat, TrendingUp } from 'lucide-react'

export interface DetectedFood {
  food_id: string
  name: string
  brand?: string | null
  grams: number
  common_unit_amount: number
  common_unit: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  match_confidence?: number
}

interface DetectedFoodCardProps {
  food: DetectedFood
  index: number
}

export function DetectedFoodCard({ food, index }: DetectedFoodCardProps) {
  // Confidence indicator color
  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-400'
    if (confidence >= 0.9) return 'text-green-500'
    if (confidence >= 0.7) return 'text-yellow-500'
    return 'text-orange-500'
  }

  const confidenceLabel = (confidence?: number) => {
    if (!confidence) return ''
    if (confidence >= 0.9) return 'High confidence'
    if (confidence >= 0.7) return 'Medium confidence'
    return 'Low confidence'
  }

  return (
    <div className="bg-zinc-900 border border-iron-gray/30 rounded-lg p-4 hover:border-iron-orange/50 transition-colors">
      {/* Header - Food Name */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <ChefHat className="w-4 h-4 text-iron-orange flex-shrink-0" />
            <h3 className="text-iron-white font-semibold text-sm">
              {food.name}
            </h3>
          </div>
          {food.brand && (
            <p className="text-iron-gray text-xs ml-6">
              {food.brand}
            </p>
          )}
        </div>

        {/* Match confidence indicator */}
        {food.match_confidence && (
          <div className={`flex items-center gap-1 ${getConfidenceColor(food.match_confidence)}`}>
            <TrendingUp className="w-3 h-3" />
            <span className="text-[10px] font-medium">
              {Math.round(food.match_confidence * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Quantity Display */}
      <div className="bg-zinc-800 rounded-md p-3 mb-3">
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold text-iron-orange">
            {food.grams}
            <span className="text-sm text-iron-gray ml-1">g</span>
          </div>
          <div className="text-iron-gray text-sm">
            ({food.common_unit_amount} {food.common_unit})
          </div>
        </div>
      </div>

      {/* Macros Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Calories */}
        <div className="bg-zinc-800/50 rounded px-2 py-1.5">
          <div className="text-iron-gray text-[10px] mb-0.5">Calories</div>
          <div className="text-iron-white font-semibold">
            {Math.round(food.calories)}
          </div>
        </div>

        {/* Protein */}
        <div className="bg-zinc-800/50 rounded px-2 py-1.5">
          <div className="text-iron-gray text-[10px] mb-0.5">Protein</div>
          <div className="text-green-400 font-semibold">
            {food.protein_g.toFixed(1)}g
          </div>
        </div>

        {/* Carbs */}
        <div className="bg-zinc-800/50 rounded px-2 py-1.5">
          <div className="text-iron-gray text-[10px] mb-0.5">Carbs</div>
          <div className="text-blue-400 font-semibold">
            {food.carbs_g.toFixed(1)}g
          </div>
        </div>

        {/* Fat */}
        <div className="bg-zinc-800/50 rounded px-2 py-1.5">
          <div className="text-iron-gray text-[10px] mb-0.5">Fat</div>
          <div className="text-yellow-400 font-semibold">
            {food.fat_g.toFixed(1)}g
          </div>
        </div>
      </div>

      {/* Low confidence warning */}
      {food.match_confidence && food.match_confidence < 0.7 && (
        <div className="mt-2 text-[10px] text-orange-400">
          ⚠️ {confidenceLabel(food.match_confidence)} - please verify
        </div>
      )}
    </div>
  )
}
