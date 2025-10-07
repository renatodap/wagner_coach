'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import BottomNavigation from '@/app/components/BottomNavigation'
import { useToast } from '@/hooks/use-toast'

interface NutritionGoals {
  id: string
  goal_name: string
  goal_type: string
  daily_calories: number
  daily_protein_g: number
  daily_carbs_g: number
  daily_fat_g: number
  daily_fiber_g: number
  daily_sugar_limit_g: number
  daily_sodium_limit_mg: number
  daily_water_ml: number
  track_micronutrients: boolean
  goal_notes?: string
}

export default function NutritionGoalsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [goals, setGoals] = useState<NutritionGoals | null>(null)
  const [formData, setFormData] = useState<Partial<NutritionGoals>>({})

  useEffect(() => {
    loadGoals()
  }, [])

  async function loadGoals() {
    try {
      const response = await fetch('/api/nutrition-goals')
      if (response.ok) {
        const { data } = await response.json()
        setGoals(data)
        setFormData(data)
      }
    } catch (error) {
      console.error('Failed to load goals:', error)
      toast({
        title: 'Error',
        description: 'Failed to load nutrition goals',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!goals || !formData) return

    setSaving(true)
    try {
      const response = await fetch('/api/nutrition-goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: goals.id,
          ...formData,
        }),
      })

      if (response.ok) {
        const { data } = await response.json()
        setGoals(data)
        setFormData(data)
        toast({
          title: 'Saved!',
          description: 'Your nutrition goals have been updated',
        })
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      console.error('Failed to save goals:', error)
      toast({
        title: 'Error',
        description: 'Failed to save nutrition goals',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof NutritionGoals, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-iron-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-iron-orange animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-iron-black to-neutral-900 pb-24">
      {/* Header */}
      <div className="bg-iron-black/50 backdrop-blur-sm border-b border-iron-gray/20 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-iron-white hover:text-iron-orange transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            <h1 className="text-xl font-bold text-white">Nutrition Goals</h1>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-iron-orange hover:bg-orange-600 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Goal Type */}
        <div className="bg-iron-gray/20 border border-iron-gray/30 rounded-lg p-6">
          <h2 className="text-lg font-bold text-white mb-4">Goal Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { value: 'cutting', label: 'Cutting', desc: 'Calorie deficit' },
              { value: 'bulking', label: 'Bulking', desc: 'Calorie surplus' },
              { value: 'maintenance', label: 'Maintenance', desc: 'Maintain weight' },
              { value: 'performance', label: 'Performance', desc: 'Athletic focus' },
              { value: 'custom', label: 'Custom', desc: 'Your own targets' },
            ].map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => handleChange('goal_type', value)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.goal_type === value
                    ? 'border-iron-orange bg-iron-orange/20 text-white'
                    : 'border-iron-gray/30 bg-iron-gray/10 text-iron-gray hover:border-iron-orange/50'
                }`}
              >
                <div className="font-bold text-sm">{label}</div>
                <div className="text-xs mt-1 opacity-75">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Macros */}
        <div className="bg-iron-gray/20 border border-iron-gray/30 rounded-lg p-6">
          <h2 className="text-lg font-bold text-white mb-4">Daily Macros</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-iron-gray mb-2">
                Calories
              </label>
              <input
                type="number"
                value={formData.daily_calories || ''}
                onChange={(e) => handleChange('daily_calories', parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-iron-black border border-iron-gray/30 rounded-lg text-white focus:border-iron-orange focus:outline-none"
                min="1000"
                max="10000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-iron-gray mb-2">
                Protein (g)
              </label>
              <input
                type="number"
                value={formData.daily_protein_g || ''}
                onChange={(e) => handleChange('daily_protein_g', parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-iron-black border border-iron-gray/30 rounded-lg text-white focus:border-iron-orange focus:outline-none"
                min="50"
                max="500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-iron-gray mb-2">
                Carbs (g)
              </label>
              <input
                type="number"
                value={formData.daily_carbs_g || ''}
                onChange={(e) => handleChange('daily_carbs_g', parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-iron-black border border-iron-gray/30 rounded-lg text-white focus:border-iron-orange focus:outline-none"
                min="50"
                max="800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-iron-gray mb-2">
                Fat (g)
              </label>
              <input
                type="number"
                value={formData.daily_fat_g || ''}
                onChange={(e) => handleChange('daily_fat_g', parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-iron-black border border-iron-gray/30 rounded-lg text-white focus:border-iron-orange focus:outline-none"
                min="20"
                max="300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-iron-gray mb-2">
                Fiber (g)
              </label>
              <input
                type="number"
                value={formData.daily_fiber_g || ''}
                onChange={(e) => handleChange('daily_fiber_g', parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-iron-black border border-iron-gray/30 rounded-lg text-white focus:border-iron-orange focus:outline-none"
                min="10"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-iron-gray mb-2">
                Water (ml)
              </label>
              <input
                type="number"
                value={formData.daily_water_ml || ''}
                onChange={(e) => handleChange('daily_water_ml', parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-iron-black border border-iron-gray/30 rounded-lg text-white focus:border-iron-orange focus:outline-none"
                min="1000"
                max="10000"
                step="100"
              />
            </div>
          </div>
        </div>

        {/* Limits */}
        <div className="bg-iron-gray/20 border border-iron-gray/30 rounded-lg p-6">
          <h2 className="text-lg font-bold text-white mb-4">Daily Limits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-iron-gray mb-2">
                Sugar Limit (g)
              </label>
              <input
                type="number"
                value={formData.daily_sugar_limit_g || ''}
                onChange={(e) => handleChange('daily_sugar_limit_g', parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-iron-black border border-iron-gray/30 rounded-lg text-white focus:border-iron-orange focus:outline-none"
                min="0"
                max="200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-iron-gray mb-2">
                Sodium Limit (mg)
              </label>
              <input
                type="number"
                value={formData.daily_sodium_limit_mg || ''}
                onChange={(e) => handleChange('daily_sodium_limit_mg', parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-iron-black border border-iron-gray/30 rounded-lg text-white focus:border-iron-orange focus:outline-none"
                min="500"
                max="5000"
                step="100"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-iron-gray/20 border border-iron-gray/30 rounded-lg p-6">
          <h2 className="text-lg font-bold text-white mb-4">Notes</h2>
          <textarea
            value={formData.goal_notes || ''}
            onChange={(e) => handleChange('goal_notes', e.target.value)}
            placeholder="Add any notes about your nutrition goals..."
            rows={4}
            className="w-full px-4 py-2 bg-iron-black border border-iron-gray/30 rounded-lg text-white focus:border-iron-orange focus:outline-none resize-none"
          />
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}
