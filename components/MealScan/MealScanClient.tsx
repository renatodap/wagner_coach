'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Upload, Loader2, CheckCircle, XCircle } from 'lucide-react'
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

  async function handleAnalyze() {
    if (!selectedImage) return

    setIsAnalyzing(true)
    toast({
      title: '🔍 Analyzing meal...',
      description: 'Detecting food items and matching nutrition',
    })

    try {
      // Step 1: Analyze image with OpenAI Vision (client-side)
      const result = await analyzeImage(selectedImage, '')
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

            // Build meal data with matched foods
            const mealData = {
              meal_type: foodData.meal_type || 'dinner',
              notes: `Detected from image: ${foodData.description}`,
              foods: matchResult.matched_foods.map(food => ({
                food_id: food.id,
                name: food.name,
                brand: food.brand_name,
                quantity: food.detected_quantity,
                unit: food.detected_unit,
                serving_size: food.serving_size,
                serving_unit: food.serving_unit,
                calories: food.calories,
                protein_g: food.protein_g,
                carbs_g: food.carbs_g,
                fat_g: food.fat_g,
                fiber_g: food.fiber_g
              }))
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
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-iron-white font-medium py-3 px-6 rounded-lg transition-colors border-2 border-iron-gray"
              >
                Choose Different Photo
              </button>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex-1 bg-iron-orange hover:bg-orange-600 disabled:opacity-50 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>Analyze Meal</>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  )
}
