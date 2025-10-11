'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Upload, Loader2, CheckCircle, XCircle, Lightbulb, RotateCw } from 'lucide-react'
import { validateFile } from '@/lib/utils/file-upload'
import { analyzeImage, formatAnalysisAsText } from '@/lib/services/client-image-analysis'
import { sendMessageStreaming } from '@/lib/api/unified-coach'
import { matchDetectedFoods, type DetectedFood } from '@/lib/api/foods'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import BottomNavigation from '@/app/components/BottomNavigation'

export function MealScanClient() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Memoized analyze function with proper dependencies
  const handleAnalyze = useCallback(async (imageFile?: File) => {
    const fileToAnalyze = imageFile || selectedImage
    if (!fileToAnalyze) return

    setIsAnalyzing(true)
    toast({
      title: '🔍 Analyzing meal...',
      description: 'Detecting food items and matching nutrition',
    })

    try {
      // Step 1: Analyze image with OpenAI Vision (client-side)
      const result = await analyzeImage(fileToAnalyze, '')
      console.log('[MealScanClient] Image analysis result:', result)

      // Step 2: Format analysis as text
      const analysisText = formatAnalysisAsText(result)
      console.log('[MealScanClient] Formatted analysis text:', analysisText)

      // Step 3: Send to unified coach backend
      toast({
        title: '🤖 Processing with AI...',
        description: 'Sending to coach for food detection',
      })

      const stream = sendMessageStreaming({
        message: analysisText,
        conversation_id: null, // Creates new conversation
      })

      // Step 4: Listen for food_detected chunk
      for await (const chunk of stream) {
        console.log('[MealScanClient] Received chunk:', chunk)

        if (chunk.food_detected && chunk.food_detected.is_food) {
          const foodData = chunk.food_detected

          // Step 5: Match foods to database
          toast({
            title: '🔍 Matching foods to database...',
            description: 'Finding nutrition information',
          })

          try {
            // Get auth token
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()

            if (!session?.access_token) {
              throw new Error('Not authenticated')
            }

            // Call backend matching API
            const detectedFoods: DetectedFood[] = foodData.food_items.map(item => ({
              name: item.name,
              quantity: item.quantity || '1',
              unit: item.unit || 'serving'
            }))

            const matchResult = await matchDetectedFoods(detectedFoods, session.access_token)

            // Build meal data with matched foods (V2 format with dual quantity tracking)
            const mealData = {
              meal_type: foodData.meal_type || 'dinner',
              notes: `Detected from image: ${foodData.description}`,
              foods: matchResult.matched_foods.map(food => {
                // Parse detected quantity (e.g., "1 serving" → 1)
                const detectedQty = parseFloat(food.detected_quantity) || 1
                const detectedUnit = food.detected_unit || 'serving'

                // Calculate gram quantity based on detected unit
                let gramQuantity = food.serving_size // Default to food's serving_size
                if (detectedUnit === 'g' || detectedUnit === 'grams') {
                  gramQuantity = detectedQty
                } else if (detectedUnit === 'serving') {
                  gramQuantity = detectedQty * food.serving_size
                } else if (food.household_serving_grams) {
                  gramQuantity = detectedQty * food.household_serving_grams
                } else {
                  // Fallback: assume detected quantity is in servings
                  gramQuantity = detectedQty * food.serving_size
                }

                return {
                  food_id: food.id,
                  name: food.name,
                  brand: food.brand_name,

                  // Dual quantity tracking (V2)
                  serving_quantity: detectedQty,
                  serving_unit: food.serving_unit,
                  gram_quantity: gramQuantity,
                  last_edited_field: 'serving' as const,

                  // Reference data for display
                  serving_size: food.serving_size,
                  food_serving_unit: food.serving_unit,
                  household_serving_size: food.household_serving_grams?.toString(),
                  household_serving_unit: food.household_serving_unit,

                  // Calculated nutrition (MealEditor interface expects these names)
                  calories: food.calories * detectedQty,
                  protein_g: food.protein_g * detectedQty,
                  carbs_g: food.total_carbs_g * detectedQty,
                  fat_g: food.total_fat_g * detectedQty,
                  fiber_g: (food.dietary_fiber_g || 0) * detectedQty
                }
              })
            }

            // Add unmatched foods to notes
            if (matchResult.unmatched_foods.length > 0) {
              mealData.notes += `\n\nCouldn't find in database: ${matchResult.unmatched_foods.map(f => f.name).join(', ')}`
            }

            toast({
              title: '✅ Food matching complete!',
              description: `Matched ${matchResult.matched_foods.length}/${foodData.food_items.length} foods`,
            })

            // Step 6: Redirect to meal log with enriched data
            const params = new URLSearchParams({
              previewData: JSON.stringify(mealData),
              returnTo: '/meal-scan',
              conversationId: chunk.conversation_id || '',
              userMessageId: chunk.message_id,
              logType: 'meal'
            })

            router.push(`/nutrition/log?${params.toString()}`)
            return
          } catch (matchError) {
            // Fallback: redirect with original data (no matches)
            console.error('[MealScanClient] Food matching failed:', matchError)
            toast({
              title: '⚠️ Auto-match failed',
              description: 'Please search for foods manually',
              variant: 'destructive'
            })

            // Still redirect, but without matched nutrition
            const fallbackData = {
              meal_type: foodData.meal_type || 'dinner',
              notes: `Detected from image: ${foodData.description}\n\nDetected foods: ${foodData.food_items.map(item => `${item.name} (${item.quantity} ${item.unit})`).join(', ')}\n\n(Auto-match failed - please search and add foods manually)`,
              foods: []
            }

            const params = new URLSearchParams({
              previewData: JSON.stringify(fallbackData),
              returnTo: '/meal-scan',
              conversationId: chunk.conversation_id || '',
              userMessageId: chunk.message_id,
              logType: 'meal'
            })

            router.push(`/nutrition/log?${params.toString()}`)
            return
          }
        }
      }

      // If we get here, no food was detected
      toast({
        title: '⚠️ No food detected',
        description: 'This doesn\'t appear to be a meal photo. Try taking another picture.',
        variant: 'destructive'
      })
    } catch (error) {
      console.error('[MealScanClient] Analysis failed:', error)
      toast({
        title: '❌ Analysis failed',
        description: error instanceof Error ? error.message : 'Failed to analyze image',
        variant: 'destructive'
      })
    } finally {
      setIsAnalyzing(false)
    }
  }, [selectedImage, toast, router])

  // Auto-detect pending image from camera button
  useEffect(() => {
    // Guard against SSR - only run on client
    if (typeof window === 'undefined') return

    const pendingImage = sessionStorage.getItem('pendingImageUpload')
    const pendingName = sessionStorage.getItem('pendingImageName')

    if (pendingImage && pendingName) {
      console.log('[MealScanClient] Detected pending image from camera button')

      // Convert base64 to File
      fetch(pendingImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], pendingName, { type: blob.type })
          setSelectedImage(file)
          setImagePreview(pendingImage)

          // Clear sessionStorage
          sessionStorage.removeItem('pendingImageUpload')
          sessionStorage.removeItem('pendingImageName')

          // Auto-analyze
          handleAnalyze(file)
        })
        .catch(error => {
          console.error('[MealScanClient] Failed to load pending image:', error)
          toast({
            title: 'Failed to load image',
            description: 'Please try taking the photo again',
            variant: 'destructive'
          })
        })
    }
  }, [handleAnalyze, toast])

  function handleFileSelect(files: FileList | null) {
    if (!files || files.length === 0) return

    const file = files[0]
    const validation = validateFile(file, {
      maxSizeMB: 10,
      allowedTypes: ['image/*']
    })

    if (!validation.valid) {
      toast({
        title: 'Invalid file',
        description: validation.error,
        variant: 'destructive'
      })
      return
    }

    // Set selected image
    setSelectedImage(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    toast({
      title: 'Image selected',
      description: `${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
    })
  }

  function handleReset() {
    setSelectedImage(null)
    setImagePreview(null)
  }

  return (
    <div className="flex flex-col min-h-screen bg-iron-black pb-20">
      {/* Header */}
      <header className="bg-zinc-900 border-b-2 border-iron-orange p-4">
        <h1 className="text-iron-orange font-black text-2xl tracking-tight">
          MEAL SCAN
        </h1>
        <p className="text-iron-gray text-sm mt-1">
          Upload or capture your meal for AI analysis
        </p>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
        {!selectedImage ? (
          <div className="space-y-4">
            {/* Photo Tips */}
            <div className="bg-zinc-900 border border-iron-orange/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-iron-orange mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-iron-white font-semibold text-sm mb-2">Tips for Best Results</h3>
                  <ul className="text-iron-gray text-xs space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-iron-orange mt-0.5">•</span>
                      <span>Take photo from directly above the meal</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-iron-orange mt-0.5">•</span>
                      <span>Ensure good lighting - avoid shadows</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-iron-orange mt-0.5">•</span>
                      <span>Include the entire plate in frame</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-iron-orange mt-0.5">•</span>
                      <span>Separate foods are easier to detect</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-iron-gray rounded-lg p-8 text-center">
              <Camera className="w-16 h-16 mx-auto mb-4 text-iron-gray" />
              <h2 className="text-iron-white text-lg font-medium mb-2">
                Take or Upload a Photo
              </h2>
              <p className="text-iron-gray text-sm mb-6">
                Capture or select an image of your meal for nutritional analysis
              </p>

              <div className="flex flex-col gap-3 max-w-sm mx-auto">
                {/* Camera Capture */}
                <label className="w-full">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                  <div className="bg-iron-orange hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors">
                    <Camera className="w-5 h-5" />
                    Take Photo
                  </div>
                </label>

                {/* File Upload */}
                <label className="w-full">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                  <div className="bg-zinc-800 hover:bg-zinc-700 text-iron-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors border-2 border-iron-gray">
                    <Upload className="w-5 h-5" />
                    Upload from Gallery
                  </div>
                </label>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Image Preview */}
            <div className="relative">
              <img
                src={imagePreview || ''}
                alt="Selected meal"
                className="w-full rounded-lg border-2 border-iron-gray"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Primary Action - Analyze */}
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full bg-iron-orange hover:bg-orange-600 disabled:opacity-50 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Analyze Meal
                  </>
                )}
              </button>

              {/* Secondary Action - Retake */}
              <button
                onClick={handleReset}
                disabled={isAnalyzing}
                className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-iron-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors border-2 border-iron-gray"
              >
                <RotateCw className="w-5 h-5" />
                Retake Photo
              </button>
            </div>
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  )
}
