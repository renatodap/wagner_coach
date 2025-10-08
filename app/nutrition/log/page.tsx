'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Save, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FoodSearchV2 } from '@/components/nutrition/FoodSearchV2'
import { MealEditor, foodToMealFood, type MealFood } from '@/components/nutrition/MealEditor'
import { createMeal } from '@/lib/api/meals'
import { confirmLog, cancelLog } from '@/lib/api/unified-coach'
import type { Food } from '@/lib/api/foods'
import { createClient } from '@/lib/supabase/client'

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

function LogMealForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get URL parameters for pre-filled data and return navigation
  const returnTo = searchParams.get('returnTo') || '/nutrition'
  const conversationId = searchParams.get('conversationId')
  const userMessageId = searchParams.get('userMessageId')
  const previewDataStr = searchParams.get('previewData')

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

  // Pre-fill data from URL parameters (from coach meal preview)
  useEffect(() => {
    if (previewDataStr) {
      try {
        const previewData = JSON.parse(previewDataStr)

        if (previewData.meal_type) {
          setMealType(previewData.meal_type as MealType)
        }

        if (previewData.notes) {
          setNotes(previewData.notes)
        }

        // Convert preview foods to MealFood format
        if (previewData.foods && Array.isArray(previewData.foods)) {
          const mealFoods: MealFood[] = previewData.foods.map((food: any) => ({
            food_id: food.food_id || `temp-${Date.now()}-${Math.random()}`,
            name: food.name,
            brand: food.brand || null,
            quantity: food.quantity || 1,
            unit: food.unit || 'serving',
            serving_size: food.serving_size || 100,
            serving_unit: food.serving_unit || 'g',
            calories: food.calories || 0,
            protein_g: food.protein_g || 0,
            carbs_g: food.carbs_g || 0,
            fat_g: food.fat_g || 0,
            fiber_g: food.fiber_g || 0
          }))
          setFoods(mealFoods)
        }
      } catch (err) {
        console.error('Failed to parse preview data:', err)
      }
    }
  }, [previewDataStr])

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

      // Prepare meal data
      const mealData = {
        category: mealType,
        logged_at: new Date(mealTime).toISOString(),
        notes: notes || undefined,
        foods: foods.map((f) => ({
          food_id: f.food_id,
          quantity: f.quantity,
          unit: f.unit
        }))
      }

      // If coming from coach, use confirm-log API (which saves and updates conversation)
      if (conversationId && userMessageId) {
        await confirmLog({
          conversation_id: conversationId,
          log_data: mealData,
          log_type: 'meal',
          user_message_id: userMessageId
        })
      } else {
        // Otherwise, just create meal normally
        await createMeal(mealData, session.access_token)
      }

      setSuccess(true)

      // Redirect after 1.5 seconds to returnTo URL with query params
      // This allows the coach page to detect return and reload conversation
      setTimeout(() => {
        const redirectUrl = new URL(returnTo, window.location.origin)
        if (conversationId) {
          redirectUrl.searchParams.set('from', 'meal-log')
          redirectUrl.searchParams.set('conversationId', conversationId)
          redirectUrl.searchParams.set('status', 'submitted')
        }
        router.push(redirectUrl.pathname + redirectUrl.search)
      }, 1500)
    } catch (err) {
      console.error('Error saving meal:', err)
      setError(err instanceof Error ? err.message : 'Failed to save meal')
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel() {
    // If coming from coach, call cancel API to add acknowledgment message
    if (conversationId && userMessageId) {
      try {
        await cancelLog({
          conversation_id: conversationId,
          user_message_id: userMessageId
        })
      } catch (err) {
        console.error('Failed to cancel log:', err)
        // Continue with redirect even if API call fails
      }
    }

    // Redirect to returnTo URL with query params
    const redirectUrl = new URL(returnTo, window.location.origin)
    if (conversationId) {
      redirectUrl.searchParams.set('from', 'meal-log')
      redirectUrl.searchParams.set('conversationId', conversationId)
      redirectUrl.searchParams.set('status', 'cancelled')
    }
    router.push(redirectUrl.pathname + redirectUrl.search)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-iron-black to-neutral-900 flex items-center justify-center p-4">
        <div className="bg-iron-black/50 backdrop-blur-sm border-2 border-iron-orange p-8 rounded-lg text-center w-full max-w-md">
          <CheckCircle className="mx-auto h-16 w-16 text-iron-orange mb-4" />
          <p className="text-2xl font-bold text-white mb-2">Meal Logged Successfully!</p>
          <p className="text-iron-gray">
            {conversationId ? 'Returning to coach...' : 'Redirecting to nutrition page...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-iron-black to-neutral-900 pb-24">
      {/* Header */}
      <div className="bg-iron-black/50 backdrop-blur-sm border-b border-iron-gray/20">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-iron-gray/20 rounded-lg transition-colors text-white"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-white">Log Meal</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Meal Type & Time */}
        <div className="bg-iron-black/50 backdrop-blur-sm border border-iron-gray/20 rounded-lg p-6 space-y-4">
          <div>
            <Label htmlFor="mealType" className="text-base font-semibold text-white">Meal Type</Label>
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
            <Label htmlFor="mealTime" className="text-base font-semibold text-white">Time</Label>
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
        <div className="bg-iron-black/50 backdrop-blur-sm border border-iron-gray/20 rounded-lg p-6">
          <Label className="text-base font-semibold text-white mb-3 block">Search & Add Foods</Label>
          <FoodSearchV2
            onSelectFood={handleSelectFood}
            placeholder="Search for foods (e.g., chicken breast, brown rice)..."
            showRecentFoods={true}
          />
        </div>

        {/* Meal Editor */}
        <div className="bg-iron-black/50 backdrop-blur-sm border border-iron-gray/20 rounded-lg p-6">
          <Label className="text-base font-semibold text-white mb-3 block">Foods in This Meal</Label>
          <MealEditor
            foods={foods}
            onFoodsChange={setFoods}
            showTotals={true}
          />
        </div>

        {/* Notes */}
        <div className="bg-iron-black/50 backdrop-blur-sm border border-iron-gray/20 rounded-lg p-6">
          <Label htmlFor="notes" className="text-base font-semibold text-white">Notes (Optional)</Label>
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
            onClick={handleCancel}
            disabled={loading}
            className="px-6 h-12 border-iron-gray/30 text-iron-gray hover:bg-iron-gray/20"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}

// Loading fallback for Suspense boundary
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-iron-black to-neutral-900 flex items-center justify-center p-4">
      <div className="bg-iron-black/50 backdrop-blur-sm border-2 border-iron-orange p-8 rounded-lg text-center w-full max-w-md">
        <Loader2 className="mx-auto h-16 w-16 text-iron-orange mb-4 animate-spin" />
        <p className="text-xl font-bold text-white mb-2">Loading...</p>
        <p className="text-iron-gray">Preparing meal log form</p>
      </div>
    </div>
  )
}

// Export default page wrapped in Suspense for useSearchParams
export default function LogMealPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LogMealForm />
    </Suspense>
  )
}
