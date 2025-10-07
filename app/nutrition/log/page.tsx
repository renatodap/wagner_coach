'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FoodSearchV2 } from '@/components/nutrition/FoodSearchV2'
import { MealEditor, foodToMealFood, type MealFood } from '@/components/nutrition/MealEditor'
import { createMeal } from '@/lib/api/meals'
import type { Food } from '@/lib/api/foods'
import { createClient } from '@/lib/supabase/client'

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export default function LogMealPage() {
  const router = useRouter()
  const [mealType, setMealType] = useState<MealType>('breakfast')
  const [mealTime, setMealTime] = useState(() => {
    const now = new Date()
    return now.toISOString().slice(0, 16) // Format for datetime-local input
  })
  const [notes, setNotes] = useState('')
  const [foods, setFoods] = useState<MealFood[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleSelectFood(food: Food) {
    // Use last logged quantity/unit if available, otherwise use serving
    const quantity = food.last_quantity || 1
    const unit = food.last_unit || food.serving_unit || 'serving'

    const mealFood = foodToMealFood(food, quantity, unit)
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
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      // Create meal via API
      await createMeal(
        {
          category: mealType,
          logged_at: new Date(mealTime).toISOString(),
          notes: notes || undefined,
          foods: foods.map((f) => ({
            food_id: f.food_id,
            quantity: f.quantity,
            unit: f.unit
          }))
        },
        session.access_token
      )

      setSuccess(true)

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/nutrition')
      }, 2000)
    } catch (err) {
      console.error('Error saving meal:', err)
      setError(err instanceof Error ? err.message : 'Failed to save meal')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-4 min-h-screen flex items-center justify-center">
        <div className="bg-green-50 border-2 border-green-500 text-green-800 p-8 rounded-lg text-center w-full max-w-md">
          <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-4" />
          <p className="text-2xl font-bold mb-2">Meal Logged Successfully!</p>
          <p className="text-green-700">Redirecting to nutrition page...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Log Meal</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Meal Type & Time */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div>
            <Label htmlFor="mealType" className="text-base font-semibold">Meal Type</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMealType(type)}
                  className={`px-4 py-3 rounded-lg font-medium transition-all capitalize ${
                    mealType === type
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="mealTime" className="text-base font-semibold">Time</Label>
            <input
              type="datetime-local"
              id="mealTime"
              value={mealTime}
              onChange={(e) => setMealTime(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Food Search */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <Label className="text-base font-semibold mb-3 block">Search & Add Foods</Label>
          <FoodSearchV2
            onSelectFood={handleSelectFood}
            placeholder="Search for foods (e.g., chicken breast, brown rice)..."
            showRecentFoods={true}
          />
        </div>

        {/* Meal Editor */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <Label className="text-base font-semibold mb-3 block">Foods in This Meal</Label>
          <MealEditor
            foods={foods}
            onFoodsChange={setFoods}
            showTotals={true}
          />
        </div>

        {/* Notes */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <Label htmlFor="notes" className="text-base font-semibold">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Post-workout meal, eating out, meal prep..."
            className="mt-2"
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">{notes.length}/500 characters</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 sticky bottom-4 bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
          <Button
            type="submit"
            disabled={loading || foods.length === 0}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 h-12 text-lg font-semibold"
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
            onClick={() => router.back()}
            disabled={loading}
            className="px-6 h-12"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
