/**
 * Meal Preview Card V2 - Streamlined UX
 *
 * Shows AI-detected meal with two clear options:
 * 1. Quick Log → Save immediately with detected data
 * 2. Edit & Log → Go to full /nutrition/log page to review/edit, then return
 *
 * After either action, coach sends a summary message.
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Edit, X, Loader2, Apple } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { LogPreview } from '@/lib/api/unified-coach'

interface MealPreviewCardV2Props {
  preview: LogPreview
  conversationId: string
  userMessageId: string
  onQuickLog: () => Promise<void>
  onCancel: () => void
}

export function MealPreviewCardV2({
  preview,
  conversationId,
  userMessageId,
  onQuickLog,
  onCancel
}: MealPreviewCardV2Props) {
  const [isLoggingQuick, setIsLoggingQuick] = useState(false)
  const router = useRouter()

  // Extract meal data
  const mealData = preview.data as {
    meal_type?: string
    calories?: number
    protein_g?: number
    carbs_g?: number
    fat_g?: number
    foods?: Array<{ name: string; quantity?: number; unit?: string }>
  }

  async function handleQuickLog() {
    setIsLoggingQuick(true)
    try {
      await onQuickLog()
    } catch (error) {
      console.error('Quick log failed:', error)
    } finally {
      setIsLoggingQuick(false)
    }
  }

  function handleEditAndLog() {
    // Encode preview data and navigation context in URL
    const params = new URLSearchParams({
      previewData: JSON.stringify({
        meal_type: mealData.meal_type || 'lunch',
        foods: mealData.foods || [],
        calories: mealData.calories,
        protein_g: mealData.protein_g,
        carbs_g: mealData.carbs_g,
        fat_g: mealData.fat_g,
        notes: `Detected by AI Coach`
      }),
      returnTo: '/coach',
      conversationId,
      userMessageId,
      logType: 'meal'
    })

    router.push(`/nutrition/log?${params.toString()}`)
  }

  return (
    <Card
      className="
        bg-gradient-to-br from-iron-black to-neutral-900
        border-2 border-iron-orange/50
        p-6 space-y-4
        shadow-2xl
        animate-in slide-in-from-bottom-2 duration-300
      "
      data-testid="meal-preview-card-v2"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-iron-orange/20 border border-iron-orange/50">
            <Apple className="w-6 h-6 text-iron-orange" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-white capitalize">
                {mealData.meal_type || 'Meal'} Detected
              </h3>
              <Badge
                variant={preview.confidence > 0.9 ? 'default' : 'secondary'}
                className="text-xs bg-iron-orange/20 text-iron-orange border border-iron-orange/50"
              >
                {Math.round(preview.confidence * 100)}% confident
              </Badge>
            </div>
            <p className="text-sm text-iron-gray mt-1">
              {preview.summary}
            </p>
          </div>
        </div>

        {/* Cancel button */}
        <button
          onClick={onCancel}
          className="text-iron-gray hover:text-white transition-colors p-1"
          aria-label="Cancel meal logging"
          disabled={isLoggingQuick}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nutrition Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3 border-y border-iron-gray/30">
        {mealData.calories !== undefined && (
          <div className="text-center">
            <p className="text-xs text-iron-gray font-medium uppercase tracking-wide">Calories</p>
            <p className="text-xl font-bold text-white mt-1">{Math.round(mealData.calories)}</p>
          </div>
        )}
        {mealData.protein_g !== undefined && (
          <div className="text-center">
            <p className="text-xs text-iron-gray font-medium uppercase tracking-wide">Protein</p>
            <p className="text-xl font-bold text-white mt-1">{Math.round(mealData.protein_g)}g</p>
          </div>
        )}
        {mealData.carbs_g !== undefined && (
          <div className="text-center">
            <p className="text-xs text-iron-gray font-medium uppercase tracking-wide">Carbs</p>
            <p className="text-xl font-bold text-white mt-1">{Math.round(mealData.carbs_g)}g</p>
          </div>
        )}
        {mealData.fat_g !== undefined && (
          <div className="text-center">
            <p className="text-xs text-iron-gray font-medium uppercase tracking-wide">Fats</p>
            <p className="text-xl font-bold text-white mt-1">{Math.round(mealData.fat_g)}g</p>
          </div>
        )}
      </div>

      {/* Foods List */}
      {mealData.foods && mealData.foods.length > 0 && (
        <div className="bg-iron-gray/20 rounded-lg p-3 border border-iron-gray/30">
          <p className="text-xs text-iron-gray font-medium uppercase tracking-wide mb-2">Foods</p>
          <div className="flex flex-wrap gap-2">
            {mealData.foods.map((food, index) => (
              <span
                key={index}
                className="text-sm text-white bg-iron-black px-3 py-1 rounded-full border border-iron-gray/30"
              >
                {food.name}
                {food.quantity && food.unit && ` (${food.quantity}${food.unit})`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI Reasoning (collapsible) */}
      {preview.reasoning && (
        <details className="text-xs text-iron-gray border-t border-iron-gray/30 pt-3">
          <summary className="cursor-pointer hover:text-white font-medium transition-colors">
            Why was this detected as a meal?
          </summary>
          <p className="mt-2 text-iron-gray/80">
            {preview.reasoning}
          </p>
        </details>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        {/* Quick Log - Primary action (instant save) */}
        <Button
          onClick={handleQuickLog}
          disabled={isLoggingQuick}
          className="
            flex-1
            bg-gradient-to-r from-iron-orange to-orange-600
            hover:from-orange-600 hover:to-iron-orange
            text-white font-bold
            transition-all duration-300
            shadow-lg hover:shadow-xl
            transform hover:scale-105 active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed
            border-2 border-orange-700
          "
          data-testid="quick-log-button"
        >
          {isLoggingQuick ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Logging...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Quick Log
            </>
          )}
        </Button>

        {/* Edit & Log - Secondary action (go to full editor) */}
        <Button
          onClick={handleEditAndLog}
          disabled={isLoggingQuick}
          variant="outline"
          className="
            flex-1
            bg-iron-gray/20
            border-2 border-iron-gray/50
            text-white font-bold
            hover:bg-iron-gray/30
            hover:border-iron-gray
            transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          data-testid="edit-and-log-button"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit & Log
        </Button>
      </div>

      {/* Hint about editing */}
      {preview.confidence < 0.9 && (
        <p className="text-xs text-iron-gray text-center pt-1">
          💡 Confidence is medium. Consider editing for accuracy.
        </p>
      )}
    </Card>
  )
}
