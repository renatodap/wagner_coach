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
import { analyzeImage, formatAnalysisAsText } from '@/lib/services/client-image-analysis'
import { sendMessageStreaming, confirmLog } from '@/lib/api/unified-coach'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import type { FoodDetected } from '@/lib/types'

export function CameraScanButton() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [foodDetected, setFoodDetected] = useState<FoodDetected | null>(null)
  const [isLogged, setIsLogged] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [userMessageId, setUserMessageId] = useState<string | null>(null)
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
    setConversationId(null)
    setUserMessageId(null)

    try {
      // Step 1: Analyze image with OpenAI Vision (client-side)
      toast({
        title: '🔍 Analyzing meal...',
        description: 'Detecting food items',
      })

      const analysisResult = await analyzeImage(file, '')
      console.log('[CameraScanButton] Analysis result:', analysisResult)

      if (!analysisResult.success || !analysisResult.is_food) {
        toast({
          title: 'No food detected',
          description: analysisResult.description || 'Please try again with a food image',
          variant: 'destructive',
        })
        return
      }

      // Step 2: Format analysis as [SYSTEM_CONTEXT] text
      const analysisText = formatAnalysisAsText(analysisResult)
      console.log('[CameraScanButton] Formatted analysis text:', analysisText)

      // Step 3: Send to unified coach backend
      toast({
        title: '🤖 Processing with coach...',
        description: 'Getting nutrition data',
      })

      const stream = sendMessageStreaming({
        message: analysisText,
        conversation_id: null, // Creates new conversation
      })

      // Step 4: Listen for food_detected chunk
      for await (const chunk of stream) {
        console.log('[CameraScanButton] Received chunk:', chunk)

        if (chunk.food_detected && chunk.food_detected.is_food) {
          // Save conversation context for later logging
          setConversationId(chunk.conversation_id || null)
          setUserMessageId(chunk.message_id || null)

          // Show meal card with food data from unified coach
          setFoodDetected(chunk.food_detected)

          console.log('[CameraScanButton] Food detected from coach:', chunk.food_detected)
          toast({
            title: '✅ Food detected!',
            description: `Found ${chunk.food_detected.food_items.length} food item(s) with ~${Math.round(chunk.food_detected.nutrition.calories)} calories`,
            variant: 'default',
          })
          break
        }
      }

      // If no food detected in stream
      if (!conversationId) {
        toast({
          title: 'No food detected',
          description: 'Please try again with a food image',
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
    if (!conversationId || !userMessageId) {
      toast({
        title: 'Error',
        description: 'Missing conversation context. Please try scanning again.',
        variant: 'destructive',
      })
      return
    }

    try {
      console.log('[CameraScanButton] Logging meal via unified coach:', foodData)

      // Use unified coach confirmLog endpoint
      await confirmLog({
        conversation_id: conversationId,
        user_message_id: userMessageId,
        log_type: 'meal',
        log_data: {
          category: foodData.meal_type || 'snack',
          logged_at: new Date().toISOString(),
          total_calories: foodData.nutrition.calories,
          total_protein_g: foodData.nutrition.protein_g,
          total_carbs_g: foodData.nutrition.carbs_g,
          total_fat_g: foodData.nutrition.fats_g,
          foods: foodData.food_items.map(item => ({
            name: item.name,
            quantity: item.quantity || 1,
            unit: item.portion || 'serving',
            calories: item.calories,
            protein_g: item.protein_g,
            carbs_g: item.carbs_g,
            fats_g: item.fats_g
          })),
          notes: foodData.description || 'Camera scan from dashboard'
        }
      })

      console.log('[CameraScanButton] Meal logged successfully via unified coach')

      setIsLogged(true)
      toast({
        title: '✅ Meal logged!',
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
