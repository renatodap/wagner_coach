'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Save, CheckCircle, Loader2, Clock, Plus, Bookmark, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FoodSearchV2 } from '@/components/nutrition/FoodSearchV2'
import { MealEditor, foodToMealFood, type MealFood } from '@/components/nutrition/MealEditor'
import { createMeal, getRecentMeals, type Meal } from '@/lib/api/meals'
import { getTemplates, createMealFromTemplate, type MealTemplate } from '@/lib/api/templates'
import { confirmLog, cancelLog } from '@/lib/api/unified-coach'
import type { Food } from '@/lib/api/foods'
import { createClient } from '@/lib/supabase/client'
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz'

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other'

function LogMealForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get URL parameters for pre-filled data and return navigation
  const returnTo = searchParams.get('returnTo') || '/nutrition'
  const conversationId = searchParams.get('conversationId')
  const userMessageId = searchParams.get('userMessageId')
  const previewDataStr = searchParams.get('previewData')

  // Determine UI mode: Review (AI-prefilled) vs Manual Entry
  const isReviewMode = Boolean(previewDataStr)

  const [mealType, setMealType] = useState<MealType>('breakfast')
  const [mealTime, setMealTime] = useState('')
  const [userTimezone, setUserTimezone] = useState<string>('UTC')
  const [notes, setNotes] = useState('')
  const [foods, setFoods] = useState<MealFood[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // For manual mode: collapsed sections
  const [showTemplates, setShowTemplates] = useState(false)
  const [showRecentMeals, setShowRecentMeals] = useState(false)
  const [showFoodSearch, setShowFoodSearch] = useState(false)

  // Recent meals for quick-add
  const [recentMeals, setRecentMeals] = useState<Meal[]>([])
  const [loadingRecentMeals, setLoadingRecentMeals] = useState(false)

  // Track if form has unsaved changes
  const hasUnsavedChanges = foods.length > 0

  // Meal templates for quick-select
  const [templates, setTemplates] = useState<MealTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  // Fetch user's timezone from profile and initialize meal time
  useEffect(() => {
    async function fetchUserTimezone() {
      try {
        const supabase = createClient()
        const { data: profile } = await supabase
          .from('profiles')
          .select('timezone')
          .single()

        const timezone = profile?.timezone || 'UTC'
        setUserTimezone(timezone)

        // Initialize meal time in user's timezone
        const now = new Date()
        const formattedTime = formatInTimeZone(now, timezone, "yyyy-MM-dd'T'HH:mm")
        setMealTime(formattedTime)

        // Smart meal type detection based on time (only if not already set by preview data)
        if (!previewDataStr) {
          const hour = now.getHours()
          if (hour >= 6 && hour < 10) {
            setMealType('breakfast')
          } else if (hour >= 11 && hour < 14) {
            setMealType('lunch')
          } else if (hour >= 17 && hour < 21) {
            setMealType('dinner')
          } else {
            setMealType('snack')
          }
        }
      } catch (err) {
        console.error('Failed to fetch user timezone:', err)
        // Fallback to UTC
        setUserTimezone('UTC')
        const now = new Date()
        setMealTime(formatInTimeZone(now, 'UTC', "yyyy-MM-dd'T'HH:mm"))
      }
    }

    fetchUserTimezone()
  }, [])

  // Fetch recent meals for quick-add (skip in review mode)
  useEffect(() => {
    if (isReviewMode) return // Skip if AI already provided foods

    async function fetchRecentMeals() {
      try {
        setLoadingRecentMeals(true)
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.access_token) {
          const meals = await getRecentMeals(session.access_token)
          setRecentMeals(meals)
        }
      } catch (err) {
        console.error('Failed to fetch recent meals:', err)
        // Don't show error - this is optional feature
      } finally {
        setLoadingRecentMeals(false)
      }
    }

    fetchRecentMeals()
  }, [isReviewMode])

  // Fetch meal templates (skip in review mode)
  useEffect(() => {
    if (isReviewMode) return // Skip if AI already provided foods

    async function fetchTemplates() {
      try {
        setLoadingTemplates(true)
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.access_token) {
          const response = await getTemplates({
            limit: 20,
            token: session.access_token
          })
          setTemplates(response.templates)
        }
      } catch (err) {
        console.error('Failed to fetch templates:', err)
        // Don't show error - this is optional feature
      } finally {
        setLoadingTemplates(false)
      }
    }

    fetchTemplates()
  }, [isReviewMode])

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

            // NEW: Dual quantity tracking
            serving_quantity: food.serving_quantity || food.quantity || 1,
            serving_unit: food.serving_unit || (food.unit !== 'g' && food.unit !== 'oz' ? food.unit : null) || null,
            gram_quantity: food.gram_quantity || food.serving_size || 100,
            last_edited_field: food.last_edited_field || 'serving',

            // Food serving info
            serving_size: food.serving_size || 100,
            food_serving_unit: food.food_serving_unit || food.serving_unit || 'g',
            household_serving_size: food.household_serving_size,
            household_serving_unit: food.household_serving_unit,

            // Calculated nutrition
            calories: food.calories || 0,
            protein_g: food.protein_g || 0,
            carbs_g: food.total_carbs_g || food.carbs_g || 0,  // V2: support both for transition
            fat_g: food.total_fat_g || food.fat_g || 0,
            fiber_g: food.dietary_fiber_g || food.fiber_g || 0
          }))
          setFoods(mealFoods)
        }
      } catch (err) {
        console.error('Failed to parse preview data:', err)
      }
    }
  }, [previewDataStr])

  // Prevent accidental navigation away with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !success) {
        e.preventDefault()
        e.returnValue = '' // Chrome requires returnValue to be set
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges, success])

  function handleSelectFood(food: Food) {
    // CRITICAL: Default portion logic (priority order)
    // 1. last_quantity + last_unit (user's previous log of this food)
    // 2. household_serving_size + household_serving_unit (e.g., "1 slice", "1 medium")
    // 3. serving_size + serving_unit (database default, usually 100g)
    // 4. Fallback to 1 serving

    let initialQuantity: number
    let initialField: 'serving' | 'grams'

    if (food.last_quantity && food.last_unit) {
      // User logged this food before - use their last quantity and unit
      initialQuantity = food.last_quantity
      // If last_unit is a household serving unit, use 'serving' field, otherwise 'grams'
      initialField = (food.last_unit === food.household_serving_unit) ? 'serving' : 'grams'
    } else if (food.household_serving_grams && food.household_serving_unit) {
      // V2: Use household serving grams
      initialQuantity = food.household_serving_grams || 1
      initialField = 'serving'
    } else {
      // Fall back to database serving size (typically 100g)
      initialQuantity = food.serving_size || 100
      initialField = 'grams'
    }

    const mealFood = foodToMealFood(food, initialQuantity, initialField)
    setFoods([...foods, mealFood])
  }

  function handleQuickAddMeal(meal: Meal) {
    // Add all foods from the selected recent meal
    const mealFoods: MealFood[] = meal.foods.map(f => ({
      food_id: f.food_id,
      name: f.name,
      brand: f.brand_name || null,
      serving_quantity: f.serving_quantity,
      serving_unit: f.serving_unit,
      gram_quantity: f.gram_quantity,
      last_edited_field: f.last_edited_field,
      serving_size: f.serving_size,
      food_serving_unit: f.serving_unit,
      household_serving_size: undefined,
      household_serving_unit: undefined,
      calories: f.calories,
      protein_g: f.protein_g,
      carbs_g: f.carbs_g,
      fat_g: f.fat_g,
      fiber_g: f.fiber_g
    }))

    setFoods([...foods, ...mealFoods])
    setMealType(meal.category as MealType)
  }

  function handleSelectTemplate(template: MealTemplate) {
    // Add all foods from the selected template
    const templateFoods: MealFood[] = template.items.map(item => ({
      food_id: item.food_id || `temp-${Date.now()}-${Math.random()}`,
      name: item.name,
      brand: null,
      serving_quantity: item.quantity,
      serving_unit: item.unit,
      gram_quantity: item.quantity, // Templates store in grams typically
      last_edited_field: 'grams' as 'grams' | 'serving',
      serving_size: item.quantity,
      food_serving_unit: item.unit,
      household_serving_size: undefined,
      household_serving_unit: undefined,
      // Nutrition will be calculated by MealEditor
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0
    }))

    setFoods([...foods, ...templateFoods])
    setMealType(template.category as MealType)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    console.log('🔵 [Meal Log] handleSubmit called')
    console.log('🔵 [Meal Log] Foods count:', foods.length)

    if (foods.length === 0) {
      console.warn('⚠️ [Meal Log] No foods added')
      setError('Please add at least one food item')
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('🔵 [Meal Log] Getting Supabase session...')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        console.error('❌ [Meal Log] No session or access token')
        throw new Error('Not authenticated')
      }

      console.log('✅ [Meal Log] Session obtained, token length:', session.access_token.length)

      // Prepare meal data - convert datetime-local to UTC using user's timezone
      // CRITICAL: datetime-local input gives us "2025-10-09T14:30"
      // We interpret this as 2:30 PM in the USER'S timezone (not browser timezone)
      // Then convert to UTC for storage
      const localDateTime = new Date(mealTime) // Parse as if in user's timezone
      const utcDateTime = fromZonedTime(localDateTime, userTimezone) // Convert to UTC

      const mealData = {
        category: mealType,
        logged_at: utcDateTime.toISOString(), // Store as UTC in database
        notes: notes || undefined,
        foods: foods.map((f) => ({
          food_id: f.food_id,
          serving_quantity: f.serving_quantity,
          serving_unit: f.serving_unit,
          gram_quantity: f.gram_quantity,
          last_edited_field: f.last_edited_field
        }))
      }

      console.log('📝 [Meal Log] Meal data prepared:', {
        category: mealData.category,
        logged_at: mealData.logged_at,
        foods_count: mealData.foods.length,
        notes_length: mealData.notes?.length || 0
      })

      // If coming from coach, use confirm-log API (which saves and updates conversation)
      if (conversationId && userMessageId) {
        console.log('🤖 [Meal Log] Using confirm-log API (coach flow)')
        await confirmLog({
          conversation_id: conversationId,
          log_data: mealData,
          log_type: 'meal',
          user_message_id: userMessageId
        })
      } else {
        console.log('💾 [Meal Log] Using createMeal API (normal flow)')
        console.log('🌐 [Meal Log] API Base URL:', process.env.NEXT_PUBLIC_API_BASE_URL)

        const result = await createMeal(mealData, session.access_token)
        console.log('✅ [Meal Log] Meal created successfully:', result)
      }

      console.log('🎉 [Meal Log] Setting success state')
      setSuccess(true)

      // Redirect after 1.5 seconds to returnTo URL with query params
      // This allows the coach page to detect return and reload conversation
      setTimeout(() => {
        console.log('🔀 [Meal Log] Redirecting to:', returnTo)
        const redirectUrl = new URL(returnTo, window.location.origin)
        if (conversationId) {
          redirectUrl.searchParams.set('from', 'meal-log')
          redirectUrl.searchParams.set('conversationId', conversationId)
          redirectUrl.searchParams.set('status', 'submitted')
        }
        router.push(redirectUrl.pathname + redirectUrl.search)
      }, 1500)
    } catch (err) {
      console.error('❌ [Meal Log] Error saving meal:', err)
      console.error('❌ [Meal Log] Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      })
      setError(err instanceof Error ? err.message : 'Failed to save meal')
    } finally {
      setLoading(false)
      console.log('🏁 [Meal Log] handleSubmit finished')
    }
  }

  async function handleCancel() {
    // Confirm if there are unsaved changes
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel?\n\nThis will discard your meal log.'
      )
      if (!confirmed) return
    }

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

  // Retry failed save
  function handleRetry() {
    setError(null)
    handleSubmit(new Event('submit') as any)
  }

  // Quick time adjustment
  function setQuickTime(hoursAgo: number) {
    const now = new Date()
    const adjustedTime = new Date(now.getTime() - (hoursAgo * 60 * 60 * 1000))
    const formattedTime = formatInTimeZone(adjustedTime, userTimezone, "yyyy-MM-dd'T'HH:mm")
    setMealTime(formattedTime)
  }

  // Calculate nutrition totals
  const totals = useMemo(() => {
    return foods.reduce(
      (acc, food) => ({
        calories: acc.calories + food.calories,
        protein_g: acc.protein_g + food.protein_g,
        carbs_g: acc.carbs_g + food.carbs_g,
        fat_g: acc.fat_g + food.fat_g,
        fiber_g: acc.fiber_g + food.fiber_g
      }),
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }
    )
  }, [foods])

  // Determine "back to" label
  const getBackToLabel = () => {
    if (returnTo.includes('coach')) return 'Back to Coach'
    if (returnTo.includes('scan')) return 'Back to Meal Scan'
    return 'Back'
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
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">
              {isReviewMode ? 'Review & Confirm Meal' : 'Log Meal'}
            </h1>
            {isReviewMode && (
              <p className="text-sm text-iron-gray mt-1">
                {getBackToLabel()} • Quick review and adjust
              </p>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {isReviewMode ? (
          /* ============ REVIEW MODE (AI-Prefilled) ============ */
          <>
            {/* Nutrition Totals - Prominent at Top */}
            {foods.length > 0 && (
              <div className="bg-iron-orange/10 backdrop-blur-sm border-2 border-iron-orange rounded-lg p-4 sm:p-6">
                <h2 className="text-lg font-bold text-iron-orange mb-3">Total Nutrition</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="text-center">
                    <p className="text-xs text-iron-gray uppercase">Calories</p>
                    <p className="text-2xl sm:text-3xl font-bold text-iron-orange">{Math.round(totals.calories)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-iron-gray uppercase">Protein</p>
                    <p className="text-2xl sm:text-3xl font-bold text-iron-orange">{totals.protein_g.toFixed(1)}g</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-iron-gray uppercase">Carbs</p>
                    <p className="text-2xl sm:text-3xl font-bold text-iron-orange">{totals.carbs_g.toFixed(1)}g</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-iron-gray uppercase">Fat</p>
                    <p className="text-2xl sm:text-3xl font-bold text-iron-orange">{totals.fat_g.toFixed(1)}g</p>
                  </div>
                </div>
              </div>
            )}

            {/* Compact Meal Info */}
            <div className="bg-iron-black/50 backdrop-blur-sm border border-iron-gray/20 rounded-lg p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="text-iron-white font-semibold capitalize">{mealType}</span>
                  <span className="text-iron-gray">•</span>
                  <input
                    type="datetime-local"
                    id="mealTime"
                    value={mealTime}
                    onChange={(e) => setMealTime(e.target.value)}
                    className="bg-transparent border-0 text-iron-gray text-sm focus:outline-none focus:text-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    // Open meal type selector (you could add a modal here)
                    const newType = prompt(`Change meal type (current: ${mealType})\nOptions: breakfast, lunch, dinner, snack, other`)
                    if (newType && ['breakfast', 'lunch', 'dinner', 'snack', 'other'].includes(newType)) {
                      setMealType(newType as MealType)
                    }
                  }}
                  className="text-xs text-iron-gray hover:text-iron-orange transition-colors"
                >
                  Edit meal info
                </button>
              </div>
            </div>

            {/* Foods List - Compact View with Full Editor */}
            <div className="bg-iron-black/50 backdrop-blur-sm border border-iron-gray/20 rounded-lg p-6">
              <Label className="text-base font-semibold text-white mb-3 block">Detected Foods</Label>
              <MealEditor
                foods={foods}
                onFoodsChange={setFoods}
                showTotals={false}
              />
            </div>

            {/* Collapsible: Add More Foods */}
            <div className="bg-iron-black/50 backdrop-blur-sm border border-iron-gray/20 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowFoodSearch(!showFoodSearch)}
                className="w-full flex items-center justify-between p-4 hover:bg-iron-gray/10 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-iron-orange" />
                  <span className="text-white font-medium">Add More Foods</span>
                  <span className="text-sm text-iron-gray">(if AI missed something)</span>
                </div>
                {showFoodSearch ? <ChevronUp className="w-5 h-5 text-iron-gray" /> : <ChevronDown className="w-5 h-5 text-iron-gray" />}
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
            <div className="bg-iron-black/50 backdrop-blur-sm border border-iron-gray/20 rounded-lg p-6">
              <Label htmlFor="notes" className="text-base font-semibold text-white">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Post-workout meal, eating out, meal prep..."
                className="mt-2 bg-neutral-800 border-iron-gray/30 text-white placeholder:text-iron-gray focus:ring-iron-orange"
                rows={2}
                maxLength={500}
              />
              <p className="text-xs text-iron-gray mt-1">{notes.length}/500 characters</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/20 border border-red-500/50 text-red-400 p-4 rounded-lg">
                <p className="font-medium mb-2">Error</p>
                <p className="text-sm mb-3">{error}</p>
                <Button
                  type="button"
                  onClick={handleRetry}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Try Again
                </Button>
              </div>
            )}

            {/* Actions - Prominent */}
            <div className="flex gap-4 sticky bottom-4 bg-iron-black/90 backdrop-blur-sm border-2 border-iron-orange rounded-lg p-4 shadow-2xl">
              <Button
                type="submit"
                disabled={loading || foods.length === 0}
                className="flex-1 bg-iron-orange hover:bg-iron-orange/90 disabled:bg-iron-gray/30 disabled:text-iron-gray h-14 text-lg font-bold"
              >
                {loading ? (
                  <>
                    <div className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle size={22} className="mr-2" />
                    Confirm & Save
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
                className="px-6 h-14 border-iron-gray/30 text-iron-gray hover:bg-iron-gray/20 font-semibold"
              >
                Cancel
              </Button>
            </div>
          </>
        ) : (
          /* ============ MANUAL MODE (Empty Start) ============ */
          <>
            {/* Meal Type & Time */}
            <div className="bg-iron-black/50 backdrop-blur-sm border border-iron-gray/20 rounded-lg p-6 space-y-4">
              <div>
                <Label htmlFor="mealType" className="text-base font-semibold text-white">Meal Type</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
                  {(['breakfast', 'lunch', 'dinner', 'snack', 'other'] as MealType[]).map((type) => (
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
                <div className="flex gap-2 mt-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setQuickTime(0)}
                    className="text-xs px-3 py-1 bg-iron-gray/20 hover:bg-iron-gray/30 text-iron-gray hover:text-white rounded transition-colors"
                  >
                    Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickTime(1)}
                    className="text-xs px-3 py-1 bg-iron-gray/20 hover:bg-iron-gray/30 text-iron-gray hover:text-white rounded transition-colors"
                  >
                    1h ago
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickTime(2)}
                    className="text-xs px-3 py-1 bg-iron-gray/20 hover:bg-iron-gray/30 text-iron-gray hover:text-white rounded transition-colors"
                  >
                    2h ago
                  </button>
                </div>
                <input
                  type="datetime-local"
                  id="mealTime"
                  value={mealTime}
                  onChange={(e) => setMealTime(e.target.value)}
                  className="w-full bg-neutral-800 border border-iron-gray/30 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-iron-orange"
                />
              </div>
            </div>

            {/* How would you like to add foods? - Selection Cards */}
            {foods.length === 0 && (
              <div className="bg-iron-black/50 backdrop-blur-sm border border-iron-gray/20 rounded-lg p-6">
                <Label className="text-base font-semibold text-white mb-4 block">How would you like to add foods?</Label>
                <div className="grid gap-3">
                  {/* Food Search Card */}
                  <button
                    type="button"
                    onClick={() => setShowFoodSearch(!showFoodSearch)}
                    className="flex items-center justify-between p-4 bg-neutral-800 hover:bg-neutral-700 border border-iron-gray/30 hover:border-iron-orange/50 rounded-lg transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🔍</div>
                      <div>
                        <p className="text-white font-medium">Search for Foods</p>
                        <p className="text-xs text-iron-gray mt-0.5">Build meal from scratch</p>
                      </div>
                    </div>
                    {showFoodSearch ? <ChevronUp className="w-5 h-5 text-iron-gray" /> : <ChevronDown className="w-5 h-5 text-iron-gray" />}
                  </button>

                  {/* Templates Card */}
                  {templates.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowTemplates(!showTemplates)}
                      className="flex items-center justify-between p-4 bg-neutral-800 hover:bg-neutral-700 border border-iron-gray/30 hover:border-iron-orange/50 rounded-lg transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">📋</div>
                        <div>
                          <p className="text-white font-medium">Use a Saved Template</p>
                          <p className="text-xs text-iron-gray mt-0.5">Quick-add complete meals</p>
                        </div>
                      </div>
                      {showTemplates ? <ChevronUp className="w-5 h-5 text-iron-gray" /> : <ChevronDown className="w-5 h-5 text-iron-gray" />}
                    </button>
                  )}

                  {/* Recent Meals Card */}
                  {recentMeals.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowRecentMeals(!showRecentMeals)}
                      className="flex items-center justify-between p-4 bg-neutral-800 hover:bg-neutral-700 border border-iron-gray/30 hover:border-iron-orange/50 rounded-lg transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">🔄</div>
                        <div>
                          <p className="text-white font-medium">Log from Recent Meals</p>
                          <p className="text-xs text-iron-gray mt-0.5">Re-log yesterday's food</p>
                        </div>
                      </div>
                      {showRecentMeals ? <ChevronUp className="w-5 h-5 text-iron-gray" /> : <ChevronDown className="w-5 h-5 text-iron-gray" />}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Expanded Sections */}
            {showFoodSearch && (
              <div className="bg-iron-black/50 backdrop-blur-sm border border-iron-gray/20 rounded-lg p-6 overflow-visible">
                <Label className="text-base font-semibold text-white mb-3 block">Search & Add Foods</Label>
                <FoodSearchV2
                  onSelectFood={handleSelectFood}
                  placeholder="Search for foods (e.g., chicken breast, brown rice)..."
                  showRecentFoods={true}
                />
              </div>
            )}

            {showTemplates && templates.length > 0 && (
              <div className="bg-iron-black/50 backdrop-blur-sm border border-iron-gray/20 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Bookmark className="w-5 h-5 text-iron-orange" />
                  <Label className="text-base font-semibold text-white">Saved Templates</Label>
                </div>
                {loadingTemplates ? (
                  <div className="flex items-center gap-2 text-iron-gray">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading templates...</span>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => handleSelectTemplate(template)}
                        className="flex items-center justify-between p-3 bg-neutral-800 hover:bg-neutral-700 border border-iron-gray/30 hover:border-iron-orange/50 rounded-lg transition-all text-left group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-white">
                              {template.name}
                            </span>
                            <span className="text-xs text-iron-gray capitalize">
                              {template.category}
                            </span>
                            {template.is_favorite && (
                              <span className="text-xs text-iron-orange">★</span>
                            )}
                          </div>
                          {template.description && (
                            <div className="text-xs text-iron-gray mb-1 truncate">
                              {template.description}
                            </div>
                          )}
                          <div className="text-xs text-iron-gray truncate">
                            {template.items.map(item => item.name).join(', ')}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-iron-gray">
                            {template.total_calories && <span>{Math.round(template.total_calories)} cal</span>}
                            {template.total_protein_g && <span>{Math.round(template.total_protein_g)}g protein</span>}
                            {template.use_count > 0 && <span className="text-iron-orange">Used {template.use_count}x</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-iron-orange group-hover:text-orange-400">
                          <Plus className="w-5 h-5" />
                          <span className="text-xs font-medium">Add</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {showRecentMeals && recentMeals.length > 0 && (
              <div className="bg-iron-black/50 backdrop-blur-sm border border-iron-gray/20 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-iron-orange" />
                  <Label className="text-base font-semibold text-white">Recent Meals</Label>
                </div>
                {loadingRecentMeals ? (
                  <div className="flex items-center gap-2 text-iron-gray">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading recent meals...</span>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {recentMeals.map((meal) => (
                      <button
                        key={meal.id}
                        type="button"
                        onClick={() => handleQuickAddMeal(meal)}
                        className="flex items-center justify-between p-3 bg-neutral-800 hover:bg-neutral-700 border border-iron-gray/30 hover:border-iron-orange/50 rounded-lg transition-all text-left group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-white capitalize">
                              {meal.name || meal.category}
                            </span>
                            <span className="text-xs text-iron-gray">
                              {new Date(meal.logged_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-xs text-iron-gray truncate">
                            {meal.foods.map(f => f.name).join(', ')}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-iron-gray">
                            {meal.total_calories && <span>{Math.round(meal.total_calories)} cal</span>}
                            {meal.total_protein_g && <span>{Math.round(meal.total_protein_g)}g protein</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-iron-orange group-hover:text-orange-400">
                          <Plus className="w-5 h-5" />
                          <span className="text-xs font-medium">Add</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Meal Editor */}
            {foods.length > 0 && (
              <div className="bg-iron-black/50 backdrop-blur-sm border border-iron-gray/20 rounded-lg p-6">
                <Label className="text-base font-semibold text-white mb-3 block">Foods in This Meal</Label>
                <MealEditor
                  foods={foods}
                  onFoodsChange={setFoods}
                  showTotals={true}
                />
              </div>
            )}

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
                <p className="font-medium mb-2">Error</p>
                <p className="text-sm mb-3">{error}</p>
                <Button
                  type="button"
                  onClick={handleRetry}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Try Again
                </Button>
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
          </>
        )}
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
