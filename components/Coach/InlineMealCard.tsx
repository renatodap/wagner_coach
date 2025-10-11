"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Check, UtensilsCrossed, Sparkles, ChevronDown, ChevronUp, Edit } from 'lucide-react'
import { MealEditSheet } from './MealEditSheet'
import type { FoodDetected } from '@/lib/types'

interface InlineMealCardProps {
  foodDetected: FoodDetected
  onLogMeal?: (data: FoodDetected) => void
  isLoading?: boolean
  isLogged?: boolean
}

/**
 * InlineMealCard - Interactive meal card rendered inline in coach chat
 *
 * Shows detected food with nutrition breakdown and "Log Meal" button
 * Expandable to show individual food items
 */
export function InlineMealCard({
  foodDetected,
  onLogMeal,
  isLoading = false,
  isLogged = false
}: InlineMealCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [currentData, setCurrentData] = useState(foodDetected)
  const [isSaving, setIsSaving] = useState(false)

  const { nutrition, food_items, meal_type, confidence, description } = currentData

  const handleLogMeal = async () => {
    if (onLogMeal && !isLogged && !isSaving) {
      console.log('[InlineMealCard] Logging meal:', currentData)
      try {
        setIsSaving(true)
        await onLogMeal(currentData)
        console.log('[InlineMealCard] Meal logged successfully')
      } catch (error) {
        console.error('[InlineMealCard] Failed to log meal:', error)
        setIsSaving(false)
      }
    }
  }

  const handleEditSave = async (editedData: FoodDetected) => {
    console.log('[InlineMealCard] Saving edited data:', editedData)
    setCurrentData(editedData)
    if (onLogMeal && !isLogged && !isSaving) {
      try {
        setIsSaving(true)
        await onLogMeal(editedData)
        console.log('[InlineMealCard] Edited meal logged successfully')
      } catch (error) {
        console.error('[InlineMealCard] Failed to log edited meal:', error)
        setIsSaving(false)
      }
    }
  }

  // Format confidence percentage
  const confidencePercent = Math.round(confidence * 100)

  // Determine confidence color
  const confidenceColor = confidence >= 0.8
    ? 'text-green-600'
    : confidence >= 0.6
    ? 'text-yellow-600'
    : 'text-orange-600'

  return (
    <Card className="border-l-4 border-l-iron-orange bg-gradient-to-br from-iron-black/50 to-neutral-900/50 backdrop-blur-sm p-4 space-y-3 transition-all duration-200 hover:shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-iron-orange/20 rounded-lg">
            <UtensilsCrossed className="h-5 w-5 text-iron-orange" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-white">
                {meal_type ? meal_type.charAt(0).toUpperCase() + meal_type.slice(1) : 'Meal'} Detected
              </h4>
              {confidence > 0 && (
                <span className={`text-xs font-medium ${confidenceColor}`}>
                  {confidencePercent}% confident
                </span>
              )}
            </div>

            <p className="text-sm text-iron-gray line-clamp-2">
              {description || 'Food detected in your message'}
            </p>
          </div>
        </div>
      </div>

      {/* Nutrition Summary - Large Display */}
      <div className="bg-iron-black/30 rounded-lg p-4 border border-iron-gray/20">
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">
              {Math.round(nutrition.calories)}
            </p>
            <p className="text-xs text-iron-gray mt-1">Calories</p>
          </div>

          <div className="text-center border-l border-iron-gray/20 pl-2">
            <p className="text-2xl font-bold text-green-400">
              {Math.round(nutrition.protein_g)}g
            </p>
            <p className="text-xs text-iron-gray mt-1">Protein</p>
          </div>

          <div className="text-center border-l border-iron-gray/20 pl-2">
            <p className="text-2xl font-bold text-blue-400">
              {Math.round(nutrition.carbs_g)}g
            </p>
            <p className="text-xs text-iron-gray mt-1">Carbs</p>
          </div>

          <div className="text-center border-l border-iron-gray/20 pl-2">
            <p className="text-2xl font-bold text-amber-400">
              {Math.round(nutrition.fats_g)}g
            </p>
            <p className="text-xs text-iron-gray mt-1">Fats</p>
          </div>
        </div>
      </div>

      {/* Food Items (Expandable) */}
      {food_items && food_items.length > 0 && (
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
              {isExpanded ? 'Hide' : 'Show'} food items ({food_items.length})
            </span>
          </button>

          {isExpanded && (
            <div className="mt-3 space-y-2 pl-6">
              {food_items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm bg-iron-black/20 rounded-lg p-2 border border-iron-gray/10"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-iron-orange" />
                    <span className="text-white font-medium">{item.name}</span>
                    {item.portion && (
                      <span className="text-iron-gray">({item.portion})</span>
                    )}
                  </div>

                  {item.calories !== undefined && (
                    <span className="text-iron-gray">
                      {Math.round(item.calories)} cal
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-2 border-t border-iron-gray/20 flex gap-2">
        {!isLogged && (
          <Button
            onClick={() => setIsEditOpen(true)}
            disabled={isLoading}
            variant="outline"
            className="border-iron-gray text-iron-white hover:bg-iron-gray/20"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        )}

        <Button
          onClick={handleLogMeal}
          disabled={isLoading || isLogged || isSaving}
          className={`flex-1 transition-all duration-200 ${
            isLogged
              ? 'bg-green-600 hover:bg-green-600 cursor-default'
              : 'bg-iron-orange hover:bg-iron-orange/90'
          }`}
        >
          {(isLoading || isSaving) ? (
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
          <p className="text-xs text-green-400 text-center mt-2 w-full">
            This meal has been saved to your nutrition history
          </p>
        )}
      </div>

      {/* Edit Sheet */}
      <MealEditSheet
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        foodData={currentData}
        onSave={handleEditSave}
      />
    </Card>
  )
}
