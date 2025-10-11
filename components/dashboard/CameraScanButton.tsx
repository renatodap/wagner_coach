/**
 * CameraScanButton - Floating camera FAB for dashboard
 *
 * Provides quick access to meal photo scanning directly from dashboard.
 * Analyzes image with OpenAI Vision and displays inline meal card.
 */

'use client'

import { useState, useRef } from 'react'
import { Camera, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InlineMealCard } from '@/components/Coach/InlineMealCard'
import { analyzeImage, convertToFoodDetected, matchFoodsToDatabase } from '@/lib/services/client-image-analysis'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import type { FoodDetected } from '@/lib/types'

export function CameraScanButton() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [foodDetected, setFoodDetected] = useState<FoodDetected | null>(null)
  const [isLogged, setIsLogged] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const handleCameraClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log('[CameraScanButton] Image captured, analyzing...')
    setIsAnalyzing(true)
    setFoodDetected(null)
    setIsLogged(false)

    try {
      // Analyze image with OpenAI Vision
      const analysisResult = await analyzeImage(file, '')

      console.log('[CameraScanButton] Analysis result:', analysisResult)

      // Convert to FoodDetected format
      const foodData = convertToFoodDetected(analysisResult)

      if (foodData) {
        console.log('[CameraScanButton] Food detected:', foodData)
        setFoodDetected(foodData)
        toast({
          title: 'Food detected!',
          description: `Found ${foodData.food_items.length} food item(s) with ~${Math.round(foodData.nutrition.calories)} calories`,
          variant: 'default',
        })
      } else {
        console.log('[CameraScanButton] Not food:', analysisResult.description)
        toast({
          title: 'No food detected',
          description: analysisResult.description || 'Please try again with a food image',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('[CameraScanButton] Failed to analyze image:', error)
      toast({
        title: 'Analysis failed',
        description: error instanceof Error ? error.message : 'Failed to analyze image. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsAnalyzing(false)
      // Reset file input so same image can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleLogMeal = async (foodData: FoodDetected) => {
    try {
      console.log('[CameraScanButton] Logging meal:', foodData)

      // Get user session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

      // Match foods to database to get food_ids
      console.log('[CameraScanButton] Matching foods to database...')
      const detectedFoods = foodData.food_items.map(item => ({
        name: item.name,
        quantity: String(item.quantity || '1'),
        unit: item.portion || 'serving'
      }))

      const matchResult = await matchFoodsToDatabase(detectedFoods, session.access_token)
      console.log('[CameraScanButton] Food matching result:', matchResult)

      if (matchResult.matched_foods.length === 0) {
        throw new Error('Could not match any foods to database. Please try manual entry.')
      }

      // Build meal log request with food_ids
      const mealLogRequest = {
        category: foodData.meal_type || 'snack',  // Required field
        logged_at: new Date().toISOString(),
        notes: `Camera scan: ${foodData.description}`,
        foods: matchResult.matched_foods.map(food => ({
          food_id: food.id,
          quantity: food.detected_quantity,
          unit: food.detected_unit
        }))
      }

      console.log('[CameraScanButton] Meal log request:', mealLogRequest)

      // Log meal to backend using direct meals endpoint
      const response = await fetch(`${API_BASE_URL}/api/v1/meals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(mealLogRequest)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[CameraScanButton] Failed to log meal:', response.status, errorText)
        throw new Error(`Failed to log meal: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('[CameraScanButton] Meal logged successfully:', result)

      setIsLogged(true)
      toast({
        title: 'Meal logged!',
        description: `${Math.round(foodData.nutrition.calories)} calories logged successfully`,
        variant: 'default',
      })
    } catch (error) {
      console.error('[CameraScanButton] Failed to log meal:', error)
      toast({
        title: 'Failed to log meal',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      })
      throw error
    }
  }

  const handleDismiss = () => {
    setFoodDetected(null)
    setIsLogged(false)
  }

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageCapture}
        className="hidden"
      />

      {/* Floating Camera FAB */}
      <button
        onClick={handleCameraClick}
        disabled={isAnalyzing}
        className="fixed bottom-24 right-6 z-50 w-16 h-16 bg-iron-orange hover:bg-orange-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Scan meal with camera"
      >
        {isAnalyzing ? (
          <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Camera className="h-6 w-6" />
        )}
      </button>

      {/* Inline Meal Card - Modal Overlay with Dark Backdrop */}
      {foodDetected && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={handleDismiss}
          aria-label="Meal card overlay"
        >
          <div
            className="relative max-w-md w-full animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute -top-2 -right-2 z-50 w-10 h-10 bg-iron-orange border-2 border-iron-white rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors shadow-lg"
              aria-label="Dismiss meal card"
            >
              <X className="h-5 w-5 text-white" />
            </button>

            {/* Meal card */}
            <InlineMealCard
              foodDetected={foodDetected}
              onLogMeal={handleLogMeal}
              isLogged={isLogged}
            />
          </div>
        </div>
      )}
    </>
  )
}
