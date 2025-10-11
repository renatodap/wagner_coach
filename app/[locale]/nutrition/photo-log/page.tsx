'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Upload, Loader2, CheckCircle, RotateCw, ArrowLeft, Lightbulb, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { analyzeImage } from '@/lib/services/client-image-analysis'
import { matchDetectedFoods, type DetectedFood, type MatchedFood } from '@/lib/api/foods'
import { createMeal } from '@/lib/api/meals'
import { MealEditor, foodToMealFood, type MealFood } from '@/components/nutrition/MealEditor'
import { FoodSearchV2 } from '@/components/nutrition/FoodSearchV2'
import { formatInTimeZone } from 'date-fns-tz'
import type { Food } from '@/lib/api/foods'
import { useToast } from '@/hooks/use-toast'

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other'

type AnalysisState = 'idle' | 'analyzing' | 'matching' | 'confirmed' | 'saving' | 'success' | 'error'

export default function PhotoMealLogPage() {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [analysisState, setAnalysisState] = useState<AnalysisState>('idle')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Meal data
  const [mealType, setMealType] = useState<MealType>('dinner')
  const [mealTime, setMealTime] = useState('')
  const [userTimezone, setUserTimezone] = useState<string>('UTC')
  const [foods, setFoods] = useState<MealFood[]>([])
  const [notes, setNotes] = useState('')

  // For adding additional foods
  const [showFoodSearch, setShowFoodSearch] = useState(false)

  // Initialize timezone and meal time
  useEffect(() => {
    async function init() {
      try {
        const supabase = createClient()
        const { data: profile } = await supabase
          .from('profiles')
          .select('timezone')
          .single()

        const timezone = profile?.timezone || 'UTC'
        setUserTimezone(timezone)

        const now = new Date()
        const formattedTime = formatInTimeZone(now, timezone, "yyyy-MM-dd'T'HH:mm")
        setMealTime(formattedTime)

        // Smart meal type detection
        const hour = now.getHours()
        if (hour >= 6 && hour < 10) setMealType('breakfast')
        else if (hour >= 11 && hour < 14) setMealType('lunch')
        else if (hour >= 17 && hour < 21) setMealType('dinner')
        else setMealType('snack')
      } catch (err) {
        console.error('Init failed:', err)
        setUserTimezone('UTC')
        setMealTime(formatInTimeZone(new Date(), 'UTC', "yyyy-MM-dd'T'HH:mm"))
      }
    }

    init()
  }, [])

  // Check for pending image from camera button (via sessionStorage)
  useEffect(() => {
    const pendingImage = sessionStorage.getItem('pendingImageUpload')
    const pendingName = sessionStorage.getItem('pendingImageName')

    if (pendingImage && pendingName) {
      // Convert base64 to File
      fetch(pendingImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], pendingName, { type: blob.type })
          setSelectedImage(file)
          setImagePreview(pendingImage)

          // Clear from sessionStorage
          sessionStorage.removeItem('pendingImageUpload')
          sessionStorage.removeItem('pendingImageName')

          // Auto-analyze
          handleAnalyze(file, pendingImage)
        })
    }
  }, [])

  function handleFileSelect(files: FileList | null) {
    if (!files || files.length === 0) return

    const file = files[0]

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please select an image file',
        variant: 'destructive'
      })
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 10MB',
        variant: 'destructive'
      })
      return
    }

    setSelectedImage(file)
    setError(null)

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

  async function handleAnalyze(imageFile?: File, preview?: string) {
    const file = imageFile || selectedImage
    if (!file) return

    setAnalysisState('analyzing')
    setError(null)

    toast({
      title: '🔍 Analyzing meal...',
      description: 'Detecting food items',
    })

    try {
      // Step 1: Analyze image with OpenAI Vision
      console.log('[PhotoLog] Starting image analysis...')
      const result = await analyzeImage(file, '')

      console.log('[PhotoLog] Analysis result:', result)

      if (!result.success || !result.is_food) {
        setError(result.description || 'No food detected in image')
        setAnalysisState('error')
        toast({
          title: '⚠️ No food detected',
          description: 'This doesn\'t appear to be a meal photo. Try another image.',
          variant: 'destructive'
        })
        return
      }

      // Step 2: Match foods to database
      setAnalysisState('matching')
      toast({
        title: '🔍 Matching foods...',
        description: 'Finding nutrition information',
      })

      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      const detectedFoods: DetectedFood[] = (result.food_items || []).map(item => ({
        name: item.name,
        quantity: item.quantity?.toString() || '1',
        unit: item.unit || 'serving'
      }))

      console.log('[PhotoLog] Detected foods:', detectedFoods)

      const matchResult = await matchDetectedFoods(detectedFoods, session.access_token)

      console.log('[PhotoLog] Match result:', matchResult)

      // Step 3: Convert matched foods to MealFood format
      const mealFoods: MealFood[] = matchResult.matched_foods.map((food: MatchedFood) => {
        // Parse detected quantity
        const detectedQty = food.detected_quantity || 1
        const detectedUnit = food.detected_unit || 'serving'

        // Calculate gram quantity from detected amount
        let gramQuantity = food.serving_size
        if (detectedUnit === 'g' || detectedUnit === 'grams') {
          gramQuantity = detectedQty
        } else if (detectedUnit === 'serving' || !food.household_serving_grams) {
          gramQuantity = detectedQty * food.serving_size
        } else {
          // Detected unit is household serving (e.g., "breast", "slice")
          gramQuantity = detectedQty * (food.household_serving_grams || food.serving_size)
        }

        // Calculate nutrition multiplier
        const multiplier = gramQuantity / food.serving_size

        // Calculate nutrition for this quantity
        const calculatedNutrition = {
          calories: (food.calories || 0) * multiplier,
          protein_g: (food.protein_g || 0) * multiplier,
          carbs_g: (food.total_carbs_g || 0) * multiplier,
          fat_g: (food.total_fat_g || 0) * multiplier,
          fiber_g: (food.dietary_fiber_g || 0) * multiplier
        }

        return {
          food_id: food.id,
          name: food.name,
          brand: food.brand_name || null,

          // Dual quantity tracking
          serving_quantity: detectedQty,
          serving_unit: food.household_serving_unit || null,
          gram_quantity: gramQuantity,
          last_edited_field: 'serving' as const,

          // Food reference data
          serving_size: food.serving_size,
          food_serving_unit: food.serving_unit,
          household_serving_size: food.household_serving_grams?.toString(),
          household_serving_unit: food.household_serving_unit,

          // Calculated nutrition
          ...calculatedNutrition
        }
      })

      setFoods(mealFoods)

      // Update notes with unmatched foods
      if (matchResult.unmatched_foods.length > 0) {
        const unmatchedNames = matchResult.unmatched_foods.map(f => f.name).join(', ')
        setNotes(`Detected from image: ${result.description}\n\nCouldn't find in database: ${unmatchedNames}`)
      } else {
        setNotes(`Detected from image: ${result.description}`)
      }

      setAnalysisState('confirmed')

      toast({
        title: '✅ Analysis complete!',
        description: `Found ${matchResult.matched_foods.length}/${detectedFoods.length} foods`,
      })

    } catch (err) {
      console.error('[PhotoLog] Analysis failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to analyze image')
      setAnalysisState('error')

      toast({
        title: '❌ Analysis failed',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'destructive'
      })
    }
  }

  function handleReset() {
    setSelectedImage(null)
    setImagePreview(null)
    setFoods([])
    setNotes('')
    setAnalysisState('idle')
    setError(null)
    setShowFoodSearch(false)
  }

  function handleSelectFood(food: Food) {
    const initialQuantity = food.last_quantity || food.household_serving_grams || food.serving_size || 1
    const initialField = food.household_serving_unit ? 'serving' : 'grams'
    const mealFood = foodToMealFood(food, initialQuantity, initialField)
    setFoods([...foods, mealFood])
  }

  async function handleSave() {
    if (foods.length === 0) {
      toast({
        title: 'No foods added',
        description: 'Please add at least one food item',
        variant: 'destructive'
      })
      return
    }

    setAnalysisState('saving')
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
        foods: foods.map(f => ({
          food_id: f.food_id,
          serving_quantity: f.serving_quantity,
          serving_unit: f.serving_unit,
          gram_quantity: f.gram_quantity,
          last_edited_field: f.last_edited_field
        }))
      }

      console.log('[PhotoLog] Saving meal:', mealData)

      await createMeal(mealData, session.access_token)

      setAnalysisState('success')

      toast({
        title: '✅ Meal logged!',
        description: 'Redirecting to dashboard...',
      })

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/en/dashboard')
      }, 2000)

    } catch (err) {
      console.error('[PhotoLog] Save failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to save meal')
      setAnalysisState('confirmed') // Back to confirmed state

      toast({
        title: '❌ Failed to save',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'destructive'
      })
    }
  }

  // Calculate totals
  const totals = foods.reduce(
    (acc, food) => ({
      calories: acc.calories + food.calories,
      protein_g: acc.protein_g + food.protein_g,
      carbs_g: acc.carbs_g + food.carbs_g,
      fat_g: acc.fat_g + food.fat_g,
      fiber_g: acc.fiber_g + food.fiber_g
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }
  )

  // Success state
  if (analysisState === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-iron-black to-neutral-900 flex items-center justify-center p-4">
        <div className="bg-iron-black/50 backdrop-blur-sm border-2 border-iron-orange p-8 rounded-lg text-center w-full max-w-md">
          <CheckCircle className="mx-auto h-16 w-16 text-iron-orange mb-4" />
          <p className="text-2xl font-bold text-white mb-2">Meal Logged!</p>
          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin inline-block w-4 h-4 border-2 border-iron-orange border-t-transparent rounded-full" />
              <p className="text-sm text-iron-gray">Redirecting to dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-iron-black to-neutral-900 pb-24">
      {/* Header */}
      <header className="bg-iron-black/50 backdrop-blur-sm border-b border-iron-gray/20">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-iron-gray/20 rounded-lg transition-colors text-white"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">
              📸 Photo Meal Log
            </h1>
            <p className="text-sm text-iron-gray mt-1">
              Snap, analyze, confirm - that's it!
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Idle/Error State: Upload Interface */}
        {(analysisState === 'idle' || analysisState === 'error') && !selectedImage && (
          <>
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
            <div className="border-2 border-dashed border-iron-gray rounded-lg p-8 text-center bg-iron-black/30">
              <Camera className="w-16 h-16 mx-auto mb-4 text-iron-gray" />
              <h2 className="text-iron-white text-lg font-medium mb-2">
                Take or Upload a Photo
              </h2>
              <p className="text-iron-gray text-sm mb-6">
                AI will automatically detect foods and calculate nutrition
              </p>

              <div className="flex flex-col gap-3 max-w-sm mx-auto">
                {/* Camera Capture */}
                <label className="w-full">
                  <input
                    ref={fileInputRef}
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

            {/* Error Display */}
            {error && (
              <div className="bg-red-900/20 border border-red-500/50 text-red-400 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Analysis Failed</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Preview & Analyze */}
        {selectedImage && imagePreview && analysisState === 'idle' && (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={imagePreview}
                alt="Selected meal"
                className="w-full rounded-lg border-2 border-iron-gray"
              />
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => handleAnalyze()}
                className="w-full bg-iron-orange hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 h-12 text-lg"
              >
                <CheckCircle className="w-5 h-5" />
                Analyze Meal
              </Button>

              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-iron-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 border-2 border-iron-gray h-12"
              >
                <RotateCw className="w-5 h-5" />
                Retake Photo
              </Button>
            </div>
          </div>
        )}

        {/* Analyzing State */}
        {(analysisState === 'analyzing' || analysisState === 'matching') && (
          <div className="bg-iron-black/50 backdrop-blur-sm border border-iron-orange/30 rounded-lg p-8 text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-iron-orange animate-spin" />
            <p className="text-xl font-bold text-white mb-2">
              {analysisState === 'analyzing' ? '🔍 Analyzing meal...' : '🔎 Matching foods...'}
            </p>
            <p className="text-sm text-iron-gray">
              {analysisState === 'analyzing'
                ? 'Detecting food items with AI'
                : 'Finding nutrition information in database'}
            </p>
          </div>
        )}

        {/* Confirmed State: Review & Edit */}
        {analysisState === 'confirmed' && (
          <>
            {/* Preview Image (Compact) */}
            {imagePreview && (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Meal photo"
                  className="w-full max-h-60 object-cover rounded-lg border border-iron-gray/30"
                />
              </div>
            )}

            {/* Nutrition Totals */}
            {foods.length > 0 && (
              <div className="bg-iron-orange/10 backdrop-blur-sm border-2 border-iron-orange rounded-lg p-6">
                <h2 className="text-lg font-bold text-iron-orange mb-3">Detected Nutrition</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-iron-gray uppercase">Calories</p>
                    <p className="text-3xl font-bold text-iron-orange">{Math.round(totals.calories)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-iron-gray uppercase">Protein</p>
                    <p className="text-3xl font-bold text-iron-orange">{totals.protein_g.toFixed(1)}g</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-iron-gray uppercase">Carbs</p>
                    <p className="text-3xl font-bold text-iron-orange">{totals.carbs_g.toFixed(1)}g</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-iron-gray uppercase">Fat</p>
                    <p className="text-3xl font-bold text-iron-orange">{totals.fat_g.toFixed(1)}g</p>
                  </div>
                </div>
              </div>
            )}

            {/* Meal Type & Time */}
            <div className="bg-iron-black/50 backdrop-blur-sm border border-iron-gray/20 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-iron-gray uppercase mb-2 block">Meal Type</label>
                  <select
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value as MealType)}
                    className="w-full bg-neutral-800 border border-iron-gray/30 text-white rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-iron-gray uppercase mb-2 block">Time</label>
                  <input
                    type="datetime-local"
                    value={mealTime}
                    onChange={(e) => setMealTime(e.target.value)}
                    className="w-full bg-neutral-800 border border-iron-gray/30 text-white rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Detected Foods - Editable */}
            <div className="bg-iron-black/50 backdrop-blur-sm border border-iron-gray/20 rounded-lg p-6">
              <h3 className="text-base font-semibold text-white mb-3">Detected Foods</h3>
              <MealEditor
                foods={foods}
                onFoodsChange={setFoods}
                showTotals={false}
              />
            </div>

            {/* Add More Foods */}
            <div className="bg-iron-black/50 backdrop-blur-sm border border-iron-gray/20 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowFoodSearch(!showFoodSearch)}
                className="w-full flex items-center justify-between p-4 hover:bg-iron-gray/10 transition-colors"
              >
                <span className="text-white font-medium">Add More Foods</span>
                <span className="text-sm text-iron-gray">(if AI missed something)</span>
              </button>
              {showFoodSearch && (
                <div className="p-4 border-t border-iron-gray/20">
                  <FoodSearchV2
                    onSelectFood={handleSelectFood}
                    placeholder="Search for additional foods..."
                    showRecentFoods={true}
                  />
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-iron-black/50 backdrop-blur-sm border border-iron-gray/20 rounded-lg p-4">
              <label className="text-xs text-iron-gray uppercase mb-2 block">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this meal..."
                className="w-full bg-neutral-800 border border-iron-gray/30 text-white rounded-lg px-3 py-2 text-sm min-h-[80px]"
                maxLength={500}
              />
              <p className="text-xs text-iron-gray mt-1">{notes.length}/500</p>
            </div>

            {/* Actions */}
            <div className="flex gap-4 sticky bottom-4 bg-iron-black/90 backdrop-blur-sm border-2 border-iron-orange rounded-lg p-4 shadow-2xl">
              <Button
                onClick={handleSave}
                disabled={analysisState === 'saving' || foods.length === 0}
                className="flex-1 bg-iron-orange hover:bg-iron-orange/90 disabled:bg-iron-gray/30 disabled:text-iron-gray h-14 text-lg font-bold"
              >
                {analysisState === 'saving' ? (
                  <>
                    <div className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle size={22} className="mr-2" />
                    Save Meal
                  </>
                )}
              </Button>
              <Button
                onClick={handleReset}
                disabled={analysisState === 'saving'}
                variant="outline"
                className="px-6 h-14 border-iron-gray/30 text-iron-gray hover:bg-iron-gray/20 font-semibold"
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
