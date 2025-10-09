'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Upload, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { validateFile } from '@/lib/utils/file-upload'
import { analyzeImage, formatAnalysisAsText } from '@/lib/services/client-image-analysis'
import { createMeal } from '@/lib/api/meals'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import BottomNavigation from '@/app/components/BottomNavigation'

interface AnalysisResult {
  text: string
  timestamp: Date
  data?: any // Raw analysis data
}

export function MealScanClient() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [isSaving, setIsSaving] = useState(false)
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
    setAnalysis(null)

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
      description: 'This may take a few seconds',
    })

    try {
      const result = await analyzeImage(selectedImage, '')
      const analysisText = formatAnalysisAsText(result)

      setAnalysis({
        text: analysisText,
        timestamp: new Date(),
        data: result
      })

      toast({
        title: '✅ Analysis complete',
        description: 'Your meal has been analyzed',
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
    setAnalysis(null)
  }

  async function handleSaveMeal() {
    if (!analysis?.data) return

    setIsSaving(true)
    toast({
      title: '💾 Saving meal...',
      description: 'Creating meal log entry',
    })

    try {
      // Get auth token
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      const analysisData = analysis.data

      // Calculate totals from detected food items
      let totalCalories = 0
      let totalProtein = 0
      let totalCarbs = 0
      let totalFat = 0

      if (analysisData.nutrition) {
        totalCalories = analysisData.nutrition.calories || 0
        totalProtein = analysisData.nutrition.protein_g || 0
        totalCarbs = analysisData.nutrition.carbs_g || 0
        totalFat = analysisData.nutrition.fat_g || 0
      }

      // Create meal log
      const mealData = {
        meal_type: analysisData.meal_type || 'snack',
        logged_at: new Date().toISOString(),
        calories: Math.round(totalCalories),
        protein_g: Math.round(totalProtein * 10) / 10,
        carbs_g: Math.round(totalCarbs * 10) / 10,
        fat_g: Math.round(totalFat * 10) / 10,
        notes: `AI detected: ${analysisData.food_items?.map((f: any) => f.name).join(', ') || 'meal from photo'}`,
      }

      await createMeal(mealData, session.access_token)

      toast({
        title: '✅ Meal logged!',
        description: `${totalCalories} calories saved`,
      })

      // Navigate to dashboard or meal history
      router.push('/dashboard')
    } catch (error) {
      console.error('[MealScanClient] Save failed:', error)
      toast({
        title: '❌ Failed to save meal',
        description: error instanceof Error ? error.message : 'Failed to save meal log',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
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

            {/* Analysis Result */}
            {analysis && (
              <div className="bg-zinc-900 border-2 border-iron-orange rounded-lg p-4">
                <div className="flex items-start gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <h3 className="text-iron-white font-medium">Analysis Complete</h3>
                </div>
                <div className="text-iron-white text-sm whitespace-pre-wrap">
                  {analysis.text}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-iron-white font-medium py-3 px-6 rounded-lg transition-colors border-2 border-iron-gray"
                >
                  Choose Different Photo
                </button>
                {!analysis && (
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
                )}
              </div>
              {analysis && (
                <button
                  onClick={handleSaveMeal}
                  disabled={isSaving}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving Meal...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Log This Meal
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  )
}
