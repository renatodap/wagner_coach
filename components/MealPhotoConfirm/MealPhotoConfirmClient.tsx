'use client'

/**
 * MealPhotoConfirmClient
 *
 * Main component for the photo meal confirmation page.
 * Displays detected foods and allows user to confirm or cancel.
 */

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { DetectedFoodCard, type DetectedFood } from './DetectedFoodCard'
import BottomNavigation from '@/app/components/BottomNavigation'
import { createClient } from '@/lib/supabase/client'
import { API_BASE_URL } from '@/lib/api-config'

interface MealPreview {
  preview_id: string
  meal_type: string
  description: string
  logged_at: string
  foods: DetectedFood[]
  totals: {
    calories: number
    protein_g: number
    carbs_g: number
    fat_g: number
    fiber_g: number
  }
  meta: {
    total_foods: number
    analysis_description: string
  }
}

export function MealPhotoConfirmClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [mealPreview, setMealPreview] = useState<MealPreview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Load meal preview from URL params
    const previewData = searchParams.get('previewData')

    if (!previewData) {
      toast({
        title: 'No meal data',
        description: 'Please scan a meal first',
        variant: 'destructive'
      })
      router.push('/meal-scan')
      return
    }

    try {
      const preview: MealPreview = JSON.parse(decodeURIComponent(previewData))
      setMealPreview(preview)
    } catch (error) {
      console.error('Failed to parse meal preview:', error)
      toast({
        title: 'Error loading meal',
        description: 'Invalid meal data',
        variant: 'destructive'
      })
      router.push('/meal-scan')
    } finally {
      setIsLoading(false)
    }
  }, [searchParams, toast, router])

  async function handleSave() {
    if (!mealPreview) return

    setIsSaving(true)
    toast({
      title: '💾 Saving meal...',
      description: 'Adding to your food log'
    })

    try {
      // Get auth token
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      // Call confirm API
      const response = await fetch(`${API_BASE_URL}/api/v1/meals/photo/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          preview_id: mealPreview.preview_id,
          meal_type: mealPreview.meal_type,
          description: mealPreview.description,
          logged_at: mealPreview.logged_at,
          foods: mealPreview.foods,
          notes: `Photo-detected meal: ${mealPreview.meta.analysis_description}`
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to save meal')
      }

      const savedMeal = await response.json()

      toast({
        title: '✅ Meal saved!',
        description: `${mealPreview.totals.calories.toFixed(0)} calories logged`,
      })

      // Redirect to nutrition page or dashboard
      router.push('/nutrition')
    } catch (error) {
      console.error('Failed to save meal:', error)
      toast({
        title: '❌ Save failed',
        description: error instanceof Error ? error.message : 'Failed to save meal',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  function handleCancel() {
    router.push('/dashboard')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-iron-black">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-iron-orange animate-spin mx-auto mb-4" />
          <p className="text-iron-gray">Loading meal preview...</p>
        </div>
      </div>
    )
  }

  if (!mealPreview) {
    return null
  }

  return (
    <div className="min-h-screen bg-iron-black pb-32">
      {/* Header */}
      <header className="bg-zinc-900 border-b-2 border-iron-orange p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={handleCancel}
            className="text-iron-gray hover:text-iron-white transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-iron-orange font-black text-xl tracking-tight">
            CONFIRM YOUR MEAL
          </h1>
        </div>
        <p className="text-iron-gray text-sm ml-8">
          Review detected foods • {mealPreview.meta.total_foods} items
        </p>
      </header>

      {/* Main Content */}
      <main className="p-4 max-w-2xl mx-auto space-y-4">
        {/* Meal Info Card */}
        <div className="bg-zinc-900 border border-iron-gray/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-iron-white font-semibold text-sm capitalize">
                {mealPreview.meal_type}
              </h2>
              <p className="text-iron-gray text-xs mt-0.5">
                {mealPreview.meta.analysis_description}
              </p>
            </div>
          </div>
        </div>

        {/* Detected Foods */}
        <div className="space-y-3">
          <h3 className="text-iron-white font-semibold text-sm px-1">
            Detected Foods ({mealPreview.foods.length})
          </h3>

          {mealPreview.foods.map((food, index) => (
            <DetectedFoodCard
              key={`${food.food_id}-${index}`}
              food={food}
              index={index}
            />
          ))}
        </div>

        {/* Nutrition Summary */}
        <div className="bg-zinc-900 border-2 border-iron-orange/50 rounded-lg p-4">
          <h3 className="text-iron-white font-semibold text-sm mb-3">
            Total Nutrition
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-iron-orange">
                {Math.round(mealPreview.totals.calories)}
              </div>
              <div className="text-iron-gray text-xs mt-1">Calories</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {mealPreview.totals.protein_g.toFixed(1)}g
              </div>
              <div className="text-iron-gray text-xs mt-1">Protein</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {mealPreview.totals.carbs_g.toFixed(1)}g
              </div>
              <div className="text-iron-gray text-xs mt-1">Carbs</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {mealPreview.totals.fat_g.toFixed(1)}g
              </div>
              <div className="text-iron-gray text-xs mt-1">Fat</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-iron-orange hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors text-base"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Save Meal
              </>
            )}
          </button>

          {/* Cancel Button */}
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-iron-white font-medium py-4 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors border-2 border-iron-gray text-base"
          >
            <XCircle className="w-5 h-5" />
            Cancel
          </button>
        </div>
      </main>

      <BottomNavigation />
    </div>
  )
}
