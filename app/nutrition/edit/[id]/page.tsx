'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, Trash2 } from 'lucide-react'
import BottomNavigation from '@/app/components/BottomNavigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FoodSearchV2 } from '@/components/nutrition/FoodSearchV2'
import { MealEditor, foodToMealFood, type MealFood } from '@/components/nutrition/MealEditor'
import { getMeal, updateMeal, deleteMeal, type Meal } from '@/lib/api/meals'
import type { Food } from '@/lib/api/foods'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { calculateMealTotals } from '@/lib/utils/nutrition-calculations'

type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other'

export default function EditMealPage() {
  const router = useRouter()
  const params = useParams()
  const mealId = params.id as string
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string>('')

  // Form fields
  const [category, setCategory] = useState<MealCategory>('other')
  const [mealTime, setMealTime] = useState('')
  const [notes, setNotes] = useState('')
  const [foods, setFoods] = useState<MealFood[]>([])

  useEffect(() => {
    fetchMeal()
  }, [mealId])

  const fetchMeal = async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      const meal = await getMeal(mealId, session.access_token)

      console.log('📥 [Edit] Loaded meal:', meal)

      // Populate form fields
      setCategory(meal.category)
      setMealTime(new Date(meal.logged_at).toISOString().slice(0, 16))
      setNotes(meal.notes || '')

      // Convert meal foods to MealFood format
      if (meal.foods && meal.foods.length > 0) {
        const convertedFoods: MealFood[] = meal.foods.map((mealFood) => ({
          food_id: mealFood.food_id,
          name: mealFood.name,
          brand: mealFood.brand_name,

          // Dual quantity tracking (V2)
          serving_quantity: mealFood.serving_quantity,
          serving_unit: mealFood.serving_unit || 'serving',
          gram_quantity: mealFood.gram_quantity,
          last_edited_field: mealFood.last_edited_field,

          // Reference data
          serving_size: mealFood.serving_size,
          food_serving_unit: mealFood.serving_unit || 'g',

          // Nutrition (MealEditor interface expects these names)
          calories: mealFood.calories,
          protein_g: mealFood.protein_g,
          carbs_g: mealFood.carbs_g,
          fat_g: mealFood.fat_g,
          fiber_g: mealFood.fiber_g || 0
        }))
        setFoods(convertedFoods)
      }
    } catch (err) {
      console.error('❌ [Edit] Error fetching meal:', err)
      setError(err instanceof Error ? err.message : 'Failed to load meal')
      toast({
        title: 'Error',
        description: 'Failed to load meal',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  function handleSelectFood(food: Food) {
    const mealFood = foodToMealFood(food, 1, food.serving_unit || 'serving')
    setFoods([...foods, mealFood])
    toast({
      title: 'Food added',
      description: `${food.name} added to meal`
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (foods.length === 0) {
      toast({
        title: 'No foods',
        description: 'Please add at least one food item',
        variant: 'destructive'
      })
      return
    }

    setSaving(true)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      // Build temporary meal for nutrition calculation
      const tempMeal: Meal = {
        id: mealId,
        user_id: 'temp',
        category,
        logged_at: new Date(mealTime).toISOString(),
        notes: notes || undefined,
        total_calories: 0,
        total_protein_g: 0,
        total_carbs_g: 0,
        total_fat_g: 0,
        total_fiber_g: 0,
        total_sugar_g: 0,
        total_sodium_mg: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        foods: foods.map((f) => ({
          id: f.food_id,
          meal_id: mealId,
          food_id: f.food_id,
          serving_quantity: f.serving_quantity,
          serving_unit: f.serving_unit,
          gram_quantity: f.gram_quantity,
          last_edited_field: f.last_edited_field,
          calories: f.calories,
          protein_g: f.protein_g,
          carbs_g: f.carbs_g,  // MealFood uses carbs_g
          fat_g: f.fat_g,      // MealFood uses fat_g
          fiber_g: f.fiber_g,  // MealFood uses fiber_g
          added_at: new Date().toISOString(),
          name: f.name,
          brand_name: f.brand,
          serving_size: f.serving_size,
          serving_unit: f.food_serving_unit
        }))
      }

      // Calculate totals using utility
      const totals = calculateMealTotals(tempMeal)
      console.log('📊 [Edit] Calculated meal totals:', totals)

      // Prepare update request (V2 API format)
      const updateData = {
        category,
        logged_at: new Date(mealTime).toISOString(),
        notes: notes || undefined,
        foods: foods.map((f) => ({
          food_id: f.food_id,
          serving_quantity: f.serving_quantity,
          serving_unit: f.serving_unit,
          gram_quantity: f.gram_quantity,
          last_edited_field: f.last_edited_field
        }))
      }

      await updateMeal(mealId, updateData, session.access_token)

      toast({
        title: 'Meal updated!',
        description: `${totals.calories} cal, ${totals.protein_g.toFixed(1)}g protein`
      })

      router.push('/nutrition')
    } catch (err) {
      console.error('❌ [Edit] Error updating meal:', err)
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update meal',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this meal? This cannot be undone.')) {
      return
    }

    setDeleting(true)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      await deleteMeal(mealId, session.access_token)

      toast({
        title: 'Meal deleted',
        description: 'The meal has been removed from your log'
      })

      router.push('/nutrition')
    } catch (err) {
      console.error('❌ [Edit] Error deleting meal:', err)
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete meal',
        variant: 'destructive'
      })
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-iron-black to-neutral-900 pb-20">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-iron-orange animate-spin" />
          </div>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-iron-black to-neutral-900 pb-20">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-red-900/20 border border-red-500/50 text-red-400 p-6 rounded-lg text-center">
            <p className="font-medium mb-4">{error}</p>
            <Link href="/nutrition">
              <Button className="bg-iron-orange hover:bg-iron-orange/90">
                Back to Nutrition
              </Button>
            </Link>
          </div>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-iron-black to-neutral-900 pb-20">
      {/* Header */}
      <header className="bg-iron-black/50 backdrop-blur-sm border-b border-iron-gray/20">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/nutrition"
              className="text-iron-gray hover:text-iron-orange transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-2xl font-bold text-iron-orange">Edit Meal</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Meal Type & Time */}
          <div className="bg-iron-black/50 backdrop-blur-sm border border-iron-gray/20 rounded-lg p-4 space-y-4">
            <div>
              <Label htmlFor="category" className="text-base font-semibold text-white">
                Meal Type
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
                {(['breakfast', 'lunch', 'dinner', 'snack', 'other'] as MealCategory[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setCategory(type)}
                    className={`px-4 py-3 rounded-lg font-medium transition-all capitalize ${
                      category === type
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
              <Label htmlFor="mealTime" className="text-base font-semibold text-white">
                Time
              </Label>
              <input
                type="datetime-local"
                id="mealTime"
                value={mealTime}
                onChange={(e) => setMealTime(e.target.value)}
                className="w-full bg-neutral-800 border border-iron-gray/30 text-white rounded-lg px-4 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-iron-orange"
              />
            </div>
          </div>

          {/* Food Search */}
          <div className="bg-iron-black/50 backdrop-blur-sm border border-iron-gray/20 rounded-lg p-4">
            <Label className="text-base font-semibold text-white mb-3 block">
              Search & Add Foods
            </Label>
            <FoodSearchV2
              onSelectFood={handleSelectFood}
              placeholder="Search for foods to add..."
              showRecentFoods={true}
            />
          </div>

          {/* Meal Editor */}
          <div className="bg-iron-black/50 backdrop-blur-sm border border-iron-gray/20 rounded-lg p-4">
            <Label className="text-base font-semibold text-white mb-3 block">
              Foods in This Meal
            </Label>
            <MealEditor foods={foods} onFoodsChange={setFoods} showTotals={true} />
          </div>

          {/* Notes */}
          <div className="bg-iron-black/50 backdrop-blur-sm border border-iron-gray/20 rounded-lg p-4">
            <Label htmlFor="notes" className="text-base font-semibold text-white">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about this meal..."
              className="mt-2 bg-neutral-800 border-iron-gray/30 text-white placeholder:text-iron-gray focus:ring-iron-orange"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-iron-gray mt-1">{notes.length}/500 characters</p>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={saving || foods.length === 0}
              className="flex-1 bg-iron-orange hover:bg-iron-orange/90 disabled:bg-iron-gray/30 disabled:text-iron-gray h-12 text-lg font-semibold"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={20} className="mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              disabled={saving || deleting}
              className="border-red-500/50 text-red-400 hover:bg-red-900/20 h-12"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={20} className="mr-2" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </form>
      </main>

      <BottomNavigation />
    </div>
  )
}
