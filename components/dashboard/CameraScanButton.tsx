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
import { analyzeImage, convertToFoodDetected } from '@/lib/services/client-image-analysis'
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

      // Log meal to backend
      const response = await fetch(`${API_BASE_URL}/api/v1/coach/confirm-log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          conversation_id: null, // No conversation context for dashboard scans
          food_detected: foodData,
          user_confirmation: true
        })
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

      {/* Inline Meal Card - Floating at top of screen */}
      {foodDetected && (
        <div className="fixed top-20 left-4 right-4 z-40 animate-in slide-in-from-top duration-300">
          <div className="relative max-w-md mx-auto">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute -top-2 -right-2 z-50 w-8 h-8 bg-iron-black border border-iron-gray rounded-full flex items-center justify-center hover:bg-iron-gray transition-colors"
              aria-label="Dismiss meal card"
            >
              <X className="h-4 w-4 text-white" />
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
