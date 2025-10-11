'use client'

/**
 * MealScanClient - Simplified Photo Meal Logging
 *
 * NEW FLOW:
 * 1. User uploads/captures photo
 * 2. Send to /api/v1/meals/photo/analyze
 * 3. Backend: OpenAI → food matching → meal construction
 * 4. Redirect to /meal-photo-confirm with preview data
 * 5. User confirms → backend saves to database
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Upload, Loader2, Lightbulb, RotateCw } from 'lucide-react'
import { validateFile } from '@/lib/utils/file-upload'
import { useToast } from '@/hooks/use-toast'
import BottomNavigation from '@/app/components/BottomNavigation'
import { createClient } from '@/lib/supabase/client'
import { API_BASE_URL } from '@/lib/api-config'
import { analyzeImage } from '@/lib/services/client-image-analysis'

export function MealScanClient() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Memoized analyze function
  const handleAnalyze = useCallback(async (imageFile?: File) => {
    const fileToAnalyze = imageFile || selectedImage
    if (!fileToAnalyze) return

    setIsAnalyzing(true)
    toast({
      title: '🔍 Analyzing meal...',
      description: 'Detecting foods with AI...',
    })

    try {
      // Step 1: Client-side OpenAI Vision analysis (NO nutrition estimates)
      console.log('[MealScanClient] Starting client-side image analysis')
      const analysis = await analyzeImage(fileToAnalyze, '')

      if (!analysis.success || !analysis.is_food) {
        throw new Error(analysis.description || 'No food detected in image')
      }

      if (!analysis.food_items || analysis.food_items.length === 0) {
        throw new Error('No foods detected. Please try a different photo.')
      }

      console.log(`[MealScanClient] Detected ${analysis.food_items.length} foods:`, analysis.food_items)

      toast({
        title: '🔍 Matching nutrition...',
        description: `Found ${analysis.food_items.length} foods, matching with database...`,
      })

      // Step 2: Send food descriptions to backend for database matching
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      // Call backend with TEXT food descriptions (not image)
      const response = await fetch(`${API_BASE_URL}/api/v1/meals/photo/analyze-text`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          food_items: analysis.food_items,
          meal_type: analysis.meal_type || 'lunch',
          description: analysis.description
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Food matching failed')
      }

      const mealPreview = await response.json()

      // Show success
      toast({
        title: '✅ Analysis complete!',
        description: `Detected ${mealPreview.meta.total_foods} foods`,
      })

      // Redirect to confirmation page with preview data
      const params = new URLSearchParams({
        previewData: encodeURIComponent(JSON.stringify(mealPreview))
      })

      router.push(`/meal-photo-confirm?${params.toString()}`)

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
    // Guard against SSR
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
                onClick={() => handleAnalyze()}
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
                    <Camera className="w-5 h-5" />
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
