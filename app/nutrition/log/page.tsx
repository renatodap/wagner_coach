'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

interface FoodItem {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fats: number
}

export default function LogMealPage() {
  const router = useRouter()
  const [mealType, setMealType] = useState<MealType>('breakfast')
  const [foodItems, setFoodItems] = useState<FoodItem[]>([
    { id: '1', name: '', calories: 0, protein: 0, carbs: 0, fats: 0 }
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Real-time totals calculation
  const totals = useMemo(() => {
    return foodItems.reduce(
      (acc, item) => ({
        calories: acc.calories + (item.calories || 0),
        protein: acc.protein + (item.protein || 0),
        carbs: acc.carbs + (item.carbs || 0),
        fats: acc.fats + (item.fats || 0)
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    )
  }, [foodItems])

  const addFoodItem = () => {
    setFoodItems([
      ...foodItems,
      { id: Date.now().toString(), name: '', calories: 0, protein: 0, carbs: 0, fats: 0 }
    ])
  }

  const removeFoodItem = (id: string) => {
    if (foodItems.length > 1) {
      setFoodItems(foodItems.filter(item => item.id !== id))
    }
  }

  const updateFoodItem = (id: string, field: keyof FoodItem, value: string | number) => {
    setFoodItems(foodItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    const validFoodItems = foodItems.filter(item => item.name.trim())
    if (validFoodItems.length === 0) {
      setError('Please add at least one food item')
      return
    }

    // Check if all valid food items have some nutritional data
    const hasNutritionData = validFoodItems.every(
      item => item.calories > 0 || item.protein > 0 || item.carbs > 0 || item.fats > 0
    )

    if (!hasNutritionData) {
      setError('Please enter nutritional information for all food items')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // For INCREMENT 3: Just simulate save with console log
      // In a real implementation, this would call a backend API
      console.log('Saving meal:', {
        mealType,
        foodItems: validFoodItems,
        totals,
        timestamp: new Date().toISOString()
      })

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))

      setSuccess(true)

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/nutrition')
      }, 2000)

    } catch (err) {
      console.error('Error saving meal:', err)
      setError(err instanceof Error ? err.message : 'Failed to save meal')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-green-100 border border-green-400 text-green-700 p-4 rounded-lg text-center">
          <p className="text-lg font-bold mb-2">Meal Logged Successfully!</p>
          <p>Redirecting to nutrition page...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Log Meal</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Meal Type Selector */}
        <div>
          <Label htmlFor="mealType">Meal Type</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setMealType(type)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                  mealType === type
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Food Items */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Food Items</h2>
            <Button type="button" onClick={addFoodItem} variant="outline">
              + Add Food
            </Button>
          </div>

          <div className="space-y-4">
            {foodItems.map((item, index) => (
              <div key={item.id} className="border p-4 rounded-lg bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-medium">Food {index + 1}</h3>
                  {foodItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFoodItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor={`food-name-${item.id}`}>Food Name</Label>
                    <Input
                      id={`food-name-${item.id}`}
                      value={item.name}
                      onChange={(e) => updateFoodItem(item.id, 'name', e.target.value)}
                      placeholder="e.g., Chicken Breast, Brown Rice"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor={`food-calories-${item.id}`}>Calories</Label>
                    <Input
                      id={`food-calories-${item.id}`}
                      type="number"
                      min="0"
                      value={item.calories || ''}
                      onChange={(e) => updateFoodItem(item.id, 'calories', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor={`food-protein-${item.id}`}>Protein (g)</Label>
                    <Input
                      id={`food-protein-${item.id}`}
                      type="number"
                      min="0"
                      step="0.1"
                      value={item.protein || ''}
                      onChange={(e) => updateFoodItem(item.id, 'protein', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`food-carbs-${item.id}`}>Carbs (g)</Label>
                    <Input
                      id={`food-carbs-${item.id}`}
                      type="number"
                      min="0"
                      step="0.1"
                      value={item.carbs || ''}
                      onChange={(e) => updateFoodItem(item.id, 'carbs', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`food-fats-${item.id}`}>Fats (g)</Label>
                    <Input
                      id={`food-fats-${item.id}`}
                      type="number"
                      min="0"
                      step="0.1"
                      value={item.fats || ''}
                      onChange={(e) => updateFoodItem(item.id, 'fats', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Totals */}
        <div className="border-2 border-green-500 p-4 rounded-lg bg-green-50">
          <h3 className="font-bold text-lg mb-3">Total Macros</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Calories</p>
              <p className="text-2xl font-bold text-green-600">{totals.calories.toFixed(0)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Protein</p>
              <p className="text-2xl font-bold text-green-600">{totals.protein.toFixed(1)}g</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Carbs</p>
              <p className="text-2xl font-bold text-green-600">{totals.carbs.toFixed(1)}g</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Fats</p>
              <p className="text-2xl font-bold text-green-600">{totals.fats.toFixed(1)}g</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Saving...' : 'Save Meal'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
