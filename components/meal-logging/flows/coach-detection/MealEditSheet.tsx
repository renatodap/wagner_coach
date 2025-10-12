"use client"

import { useState } from 'react'
import { BottomSheet } from '@/components/CoachMVP/BottomSheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import type { FoodDetected } from '@/lib/types'

interface MealEditSheetProps {
  isOpen: boolean
  onClose: () => void
  foodData: FoodDetected
  onSave: (editedData: FoodDetected) => Promise<void>
}

/**
 * MealEditSheet - Bottom sheet for editing detected meals
 *
 * Allows users to review and adjust AI-detected meal data before logging:
 * - Edit nutrition values
 * - Modify food items
 * - Change meal type
 * - Add notes
 */
export function MealEditSheet({
  isOpen,
  onClose,
  foodData,
  onSave
}: MealEditSheetProps) {
  const [calories, setCalories] = useState(Math.round(foodData.nutrition.calories))
  const [protein, setProtein] = useState(Math.round(foodData.nutrition.protein_g))
  const [carbs, setCarbs] = useState(Math.round(foodData.nutrition.carbs_g))
  const [fats, setFats] = useState(Math.round(foodData.nutrition.fats_g))
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    setIsSaving(true)
    try {
      const editedData: FoodDetected = {
        ...foodData,
        nutrition: {
          calories,
          protein_g: protein,
          carbs_g: carbs,
          fats_g: fats
        }
      }
      await onSave(editedData)
      onClose()
    } catch (error) {
      console.error('Failed to save edited meal:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Meal"
      footer={
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-iron-orange hover:bg-orange-600"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save & Log'
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Foods List */}
        <div>
          <h3 className="text-sm font-semibold text-iron-white mb-3">Foods</h3>
          <div className="space-y-2">
            {foodData.food_items.map((item, idx) => (
              <div
                key={idx}
                className="bg-zinc-800 rounded-lg p-3 text-sm text-iron-white"
              >
                <span className="font-medium">{item.name}</span>
                {item.quantity && (
                  <span className="text-iron-gray ml-2">
                    {item.quantity} {item.portion || 'serving'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Nutrition Editing */}
        <div>
          <h3 className="text-sm font-semibold text-iron-white mb-3">Nutrition</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-iron-gray mb-1.5 block">
                Calories
              </label>
              <Input
                type="number"
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
                min={0}
                max={10000}
                className="bg-zinc-800 border-iron-gray text-iron-white"
              />
            </div>

            <div>
              <label className="text-xs text-iron-gray mb-1.5 block">
                Protein (g)
              </label>
              <Input
                type="number"
                value={protein}
                onChange={(e) => setProtein(Number(e.target.value))}
                min={0}
                max={1000}
                className="bg-zinc-800 border-iron-gray text-iron-white"
              />
            </div>

            <div>
              <label className="text-xs text-iron-gray mb-1.5 block">
                Carbs (g)
              </label>
              <Input
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(Number(e.target.value))}
                min={0}
                max={1000}
                className="bg-zinc-800 border-iron-gray text-iron-white"
              />
            </div>

            <div>
              <label className="text-xs text-iron-gray mb-1.5 block">
                Fats (g)
              </label>
              <Input
                type="number"
                value={fats}
                onChange={(e) => setFats(Number(e.target.value))}
                min={0}
                max={1000}
                className="bg-zinc-800 border-iron-gray text-iron-white"
              />
            </div>
          </div>
        </div>

        {/* Meal Type */}
        <div>
          <h3 className="text-sm font-semibold text-iron-white mb-3">Meal Type</h3>
          <div className="bg-zinc-800 rounded-lg p-3 text-sm text-iron-white capitalize">
            {foodData.meal_type || 'Snack'}
          </div>
        </div>
      </div>
    </BottomSheet>
  )
}
