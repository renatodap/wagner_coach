'use client'

import { useEffect, useState } from 'react'
import { Profile } from '@/lib/types'
import BottomNavigation from '@/app/components/BottomNavigation'
import { CircularProgress } from '@/components/dashboard/CircularProgress'
import { Loader2 } from 'lucide-react'

interface DashboardClientProps {
  profile?: Profile | null
  stats: {
    activitiesToday: number
    mealsToday: number
    activePrograms: number
  }
  upcomingWorkouts: any[]
}

interface NutritionData {
  targets: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  current: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}

export default function DashboardClient({
  profile,
}: DashboardClientProps) {
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchNutritionData() {
      try {
        const response = await fetch('/api/dashboard/nutrition')
        if (response.ok) {
          const data = await response.json()
          setNutritionData(data)
        }
      } catch (error) {
        console.error('Failed to fetch nutrition data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNutritionData()
  }, [])

  const getGreeting = () => {
    const hour = new Date().getHours()
    const name = profile?.full_name?.split(' ')[0] || 'Warrior'

    if (hour < 5) return `Rise and Grind, ${name}`
    if (hour < 12) return `Morning, ${name}`
    if (hour < 17) return `Afternoon, ${name}`
    if (hour < 22) return `Evening, ${name}`
    return `Night Owl Mode, ${name}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-iron-black to-neutral-900 pb-24">
      {/* Header */}
      <div className="bg-iron-black/50 backdrop-blur-sm border-b border-iron-gray/20">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            {getGreeting()}
          </h1>
          <p className="text-iron-gray">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-iron-orange animate-spin" />
          </div>
        ) : nutritionData ? (
          <div className="space-y-12">
            {/* Calories - Large Circle */}
            <div className="flex justify-center">
              <CircularProgress
                value={nutritionData.current.calories}
                max={nutritionData.targets.calories}
                label="Calories"
                size="large"
                color="#ff6b35"
                unit=" cal"
              />
            </div>

            {/* Macros - Smaller Circles */}
            <div className="grid grid-cols-3 gap-6">
              <CircularProgress
                value={nutritionData.current.protein}
                max={nutritionData.targets.protein}
                label="Protein"
                size="small"
                color="#10b981" // green
                unit="g"
              />
              <CircularProgress
                value={nutritionData.current.carbs}
                max={nutritionData.targets.carbs}
                label="Carbs"
                size="small"
                color="#3b82f6" // blue
                unit="g"
              />
              <CircularProgress
                value={nutritionData.current.fat}
                max={nutritionData.targets.fat}
                label="Fat"
                size="small"
                color="#f59e0b" // amber
                unit="g"
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-iron-gray">No nutrition data available</p>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}
