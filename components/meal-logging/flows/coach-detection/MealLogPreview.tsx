'use client'

import { useState, useEffect } from 'react'
import { Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FoodSearchV2 } from '@/components/nutrition/FoodSearchV2'
import { MealEditor, foodToMealFood, type MealFood } from '@/components/nutrition/MealEditor'
import type { Food } from '@/lib/meal-logging/api/foods'
import { calculateMealTotals, type MealNutritionTotals } from '@/lib/meal-logging/utils/nutrition-calculations'
import type { Meal } from '@/lib/meal-logging/api/meals'

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

interface MealLogPreviewProps {
  initialData: {
    primary_fields: {
      meal_type?: string
      meal_name?: string
      foods?: Array<{
        food_id?: string
        name: string
        quantity?: number
        unit?: string
        serving_size?: number
        serving_unit?: string
        calories?: number
        protein_g?: number
        carbs_g?: number
        fat_g?: number
        fiber_g?: number
      }>
      logged_at?: string
      notes?: string
    }
  }
  onSave: (editedData: any) => Promise<void>
  onCancel: () => void
}

export function MealLogPreview({ initialData, onSave, onCancel }: MealLogPreviewProps) {
  const primary = initialData.primary_fields

  // Initialize state from AI-detected data
  const [mealType, setMealType] = useState<MealType>(
    (primary.meal_type as MealType) || 'lunch'
  )
  const [mealTime, setMealTime] = useState(() => {
    if (primary.logged_at) {
      return new Date(primary.logged_at).toISOString().slice(0, 16)
    }
    const now = new Date()
    return now.toISOString().slice(0, 16)
  })
  const [notes, setNotes] = useState(primary.notes || '')
  const [foods, setFoods] = useState<MealFood[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Convert AI-detected foods to MealFood format (V2 dual quantity)
  useEffect(() => {
    if (primary.foods && primary.foods.length > 0) {
      const convertedFoods: MealFood[] = primary.foods.map((food) => {
        const servingQty = food.quantity || 1
        const servingSize = food.serving_size || 100
        const gramQty = servingQty * servingSize

        return {
          food_id: food.food_id || `temp-${Date.now()}-${Math.random()}`,
          name: food.name,
          brand: null,

          // Dual quantity tracking (V2)
          serving_quantity: servingQty,
          serving_unit: food.serving_unit || 'serving',
          gram_quantity: gramQty,
          last_edited_field: 'serving' as const,

          // Reference data
          serving_size: servingSize,
          food_serving_unit: food.serving_unit || 'g',

          // Nutrition (MealEditor interface expects these names)
          calories: food.calories || 0,
          protein_g: food.protein_g || 0,
          carbs_g: (food as any).total_carbs_g || food.carbs_g || 0,
          fat_g: (food as any).total_fat_g || food.fat_g || 0,
          fiber_g: (food as any).dietary_fiber_g || food.fiber_g || 0
        }
      })
      setFoods(convertedFoods)
    }
  }, [primary.foods])

  function handleSelectFood(food: Food) {
    // Add newly searched food to the meal
    const mealFood = foodToMealFood(food, 1, food.serving_unit || 'serving')
    setFoods([...foods, mealFood])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (foods.length === 0) {
      setError('Please add at least one food item')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Build temporary meal object for nutrition calculation
      const tempMeal: Meal = {
        id: 'temp',
        user_id: 'temp',
        category: mealType,
        logged_at: new Date(mealTime).toISOString(),
        notes: notes || undefined,
        total_calories: 0,
        total_protein_g: 0,
        total_carbs_g: 0,
        total_fat_g: 0,
        total_fiber_g: 0,
        total_sugar_g: 0,
        total_sodium_mg: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        foods: foods.map((f) => ({
          id: f.food_id,
          meal_id: 'temp',
          food_id: f.food_id,
          serving_quantity: f.serving_quantity,
          serving_unit: f.serving_unit,
          gram_quantity: f.gram_quantity,
          last_edited_field: f.last_edited_field,
          calories: f.calories,
          protein_g: f.protein_g,
          carbs_g: f.carbs_g,  // MealFood uses carbs_g
          fat_g: f.fat_g,      // MealFood uses fat_g
          fiber_g: f.fiber_g,  // MealFood uses fiber_g
          added_at: new Date().toISOString(),
          name: f.name,
          brand_name: f.brand,
          serving_size: f.serving_size,
          serving_unit: f.food_serving_unit
        }))
      }

      // Calculate totals using utility (client-side fallback)
      const totals = calculateMealTotals(tempMeal)
      console.log('📊 [MealLogPreview] Calculated meal totals:', totals)

      // Format data for saving (V2 API format)
      const dataToSave = {
        category: mealType,
        logged_at: new Date(mealTime).toISOString(),
        notes: notes || undefined,
        foods: foods.map((f) => ({
          food_id: f.food_id,
          serving_quantity: f.serving_quantity,
          serving_unit: f.serving_unit,
          gram_quantity: f.gram_quantity,
          last_edited_field: f.last_edited_field
        })),
        // Include calculated totals
        ...totals
      }

      await onSave(dataToSave)
    } catch (err) {
      console.error('Error saving meal:', err)
      setError(err instanceof Error ? err.message : 'Failed to save meal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-iron-black to-neutral-900 rounded-3xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-iron-black/50 backdrop-blur-sm border-b border-iron-gray/20 px-6 py-4">
        <h2 className="text-xl font-bold text-white">Log Meal</h2>
        <p className="text-sm text-iron-gray mt-1">
          AI detected a meal log. Review and edit before saving.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Meal Type & Time */}
        <div className="bg-iron-black/50 backdrop-blur-sm border border-iron-gray/20 rounded-lg p-4 space-y-4">
          <div>
            <Label htmlFor="mealType" className="text-base font-semibold text-white">
              Meal Type
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMealType(type)}
                  className={`px-4 py-3 rounded-lg font-medium transition-all capitalize ${
                    mealType === type
                      ? 'bg-iron-orange text-white shadow-md'
                      : 'bg-iron-gray/20 text-iron-gray hover:bg-iron-gray/30'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="mealTime" className="text-base font-semibold text-white">
              Time
            </Label>
            <input
              type="datetime-local"
              id="mealTime"
              value={mealTime}
              onChange={(e) => setMealTime(e.target.value)}
              className="w-full bg-neutral-800 border border-iron-gray/30 text-white rounded-lg px-4 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-iron-orange"
            />
          </div>
        </div>

        {/* Food Search */}
        <div className="bg-iron-black/50 backdrop-blur-sm border border-iron-gray/20 rounded-lg p-4">
          <Label className="text-base font-semibold text-white mb-3 block">
            Search & Add Foods
          </Label>
          <FoodSearchV2
            onSelectFood={handleSelectFood}
            placeholder="Search for foods to add (e.g., chicken breast, brown rice)..."
            showRecentFoods={true}
          />
        </div>

        {/* Meal Editor */}
        <div className="bg-iron-black/50 backdrop-blur-sm border border-iron-gray/20 rounded-lg p-4">
          <Label className="text-base font-semibold text-white mb-3 block">
            Foods in This Meal
          </Label>
          <MealEditor foods={foods} onFoodsChange={setFoods} showTotals={true} />
        </div>

        {/* Notes */}
        <div className="bg-iron-black/50 backdrop-blur-sm border border-iron-gray/20 rounded-lg p-4">
          <Label htmlFor="notes" className="text-base font-semibold text-white">
            Notes (Optional)
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Post-workout meal, eating out, meal prep..."
            className="mt-2 bg-neutral-800 border-iron-gray/30 text-white placeholder:text-iron-gray focus:ring-iron-orange"
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-iron-gray mt-1">{notes.length}/500 characters</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 text-red-400 p-4 rounded-lg">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 sticky bottom-4 bg-iron-black/90 backdrop-blur-sm border border-iron-gray/20 rounded-lg p-4 shadow-lg">
          <Button
            type="submit"
            disabled={loading || foods.length === 0}
            className="flex-1 bg-iron-orange hover:bg-iron-orange/90 disabled:bg-iron-gray/30 disabled:text-iron-gray h-12 text-lg font-semibold"
          >
            {loading ? (
              <>
                <div className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save size={20} className="mr-2" />
                Save Meal
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="px-6 h-12 border-iron-gray/30 text-iron-gray hover:bg-iron-gray/20"
          >
            <X size={20} className="mr-2" />
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
