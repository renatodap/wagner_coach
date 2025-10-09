'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Profile } from '@/lib/types'
import BottomNavigation from '@/app/components/BottomNavigation'
import { CircularProgress } from '@/components/dashboard/CircularProgress'
import { EventCountdownWidget } from '@/components/Events/EventCountdownWidget'
import { Loader2, Plus, UtensilsCrossed, Activity, MessageCircle, Sparkles, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { checkConsultationStatus } from '@/lib/api/consultation'
import { getPrimaryEventCountdown } from '@/lib/api/events'
import type { EventCountdown } from '@/types/event'

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

interface ActivityData {
  count: number
  duration: number
  calories: number
  distance: number
}

export default function DashboardClient({
  profile,
}: DashboardClientProps) {
  const router = useRouter()
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null)
  const [activityData, setActivityData] = useState<ActivityData | null>(null)
  const [primaryEvent, setPrimaryEvent] = useState<EventCountdown | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasCompletedConsultation, setHasCompletedConsultation] = useState<boolean | null>(null)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch nutrition data
        const nutritionResponse = await fetch('/api/dashboard/nutrition')
        if (nutritionResponse.ok) {
          const nutritionData = await nutritionResponse.json()
          setNutritionData(nutritionData)
        }

        // Fetch activity data
        const activityResponse = await fetch('/api/dashboard/activities')
        if (activityResponse.ok) {
          const activityData = await activityResponse.json()
          setActivityData(activityData)
        }

        // Check if user has completed consultation
        try {
          const consultationStatus = await checkConsultationStatus()
          setHasCompletedConsultation(consultationStatus.has_completed)
        } catch (error) {
          console.error('Failed to check consultation status:', error)
          // Default to null (don't show banner on error)
        }

        // Fetch primary event countdown
        try {
          const eventCountdown = await getPrimaryEventCountdown()
          setPrimaryEvent(eventCountdown)
        } catch (error) {
          // No primary event or error - not critical
          console.log('No primary event or failed to fetch')
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
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

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatDistance = (meters: number) => {
    const km = meters / 1000
    if (km >= 1) {
      return `${km.toFixed(2)} km`
    }
    return `${meters.toFixed(0)} m`
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
          <div className="space-y-8">
            {/* First-Time User Consultation Banner */}
            {hasCompletedConsultation === false && (
              <div className="bg-gradient-to-r from-iron-orange to-orange-600 rounded-lg p-6 border border-orange-400">
                <div className="flex items-start gap-4">
                  <Sparkles className="h-8 w-8 text-white flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">
                      🎯 Complete Your Personalized Consultation
                    </h3>
                    <p className="text-white/90 mb-4">
                      Get AI-powered recommendations tailored to YOUR goals, preferences, and lifestyle.
                      This 5-minute consultation will unlock personalized meal plans, workout programs, and daily recommendations.
                    </p>
                    <Button
                      onClick={() => router.push('/consultation')}
                      className="bg-white text-iron-orange hover:bg-gray-100 font-semibold"
                    >
                      Start Consultation Now
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions Section */}
            <div className="bg-iron-black/50 backdrop-blur-sm border border-iron-gray/20 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>

              {/* Primary Actions - 3 Button Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button
                  onClick={() => router.push('/nutrition/log')}
                  className="bg-iron-orange hover:bg-iron-orange/90 text-white font-semibold h-auto py-6 flex flex-col items-center gap-2 transition-all hover:scale-105"
                  aria-label="Log a meal manually"
                >
                  <UtensilsCrossed size={28} />
                  <span>Log Meal</span>
                </Button>
                <Button
                  onClick={() => router.push('/meal-scan')}
                  className="bg-gradient-to-br from-iron-orange to-orange-600 hover:from-iron-orange/90 hover:to-orange-600/90 text-white font-semibold h-auto py-6 flex flex-col items-center gap-2 transition-all hover:scale-105"
                  aria-label="Scan a meal with your camera"
                >
                  <Camera size={28} />
                  <span>Scan Meal</span>
                </Button>
                <Button
                  onClick={() => router.push('/coach-v2')}
                  className="bg-iron-orange hover:bg-iron-orange/90 text-white font-semibold h-auto py-6 flex flex-col items-center gap-2 transition-all hover:scale-105"
                  aria-label="Chat with your AI coach"
                >
                  <MessageCircle size={28} />
                  <span>Ask Coach</span>
                </Button>
              </div>

              {/* Secondary Actions */}
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Button
                  onClick={() => router.push('/activities/log')}
                  variant="outline"
                  className="border-iron-gray/30 text-white hover:bg-iron-gray/20 h-auto py-3 flex flex-col items-center gap-1.5"
                  aria-label="Log an activity or workout"
                >
                  <Activity size={20} />
                  <span className="text-sm">Log Activity</span>
                </Button>
                <Button
                  onClick={() => router.push('/consultation')}
                  variant="outline"
                  className="border-iron-gray/30 text-white hover:bg-iron-gray/20 h-auto py-3 flex flex-col items-center gap-1.5"
                  aria-label="Start a consultation with a specialist"
                >
                  <Sparkles size={20} />
                  <span className="text-sm">Consultation</span>
                </Button>
              </div>
            </div>

            {/* Primary Event Countdown */}
            {primaryEvent && (
              <div>
                <EventCountdownWidget event={primaryEvent} size="medium" showActions={true} />
              </div>
            )}

            {/* Nutrition Progress */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Today's Nutrition</h2>
                <button
                  onClick={() => router.push('/nutrition')}
                  className="text-sm text-iron-orange hover:text-orange-400 underline"
                >
                  View All
                </button>
              </div>

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

            {/* Activity Progress */}
            {activityData && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Today's Activity</h2>
                  <button
                    onClick={() => router.push('/activities/daily')}
                    className="text-sm text-iron-orange hover:text-orange-400 underline"
                  >
                    View All
                  </button>
                </div>

                <div className="bg-iron-black/50 backdrop-blur-sm border border-iron-gray/20 rounded-lg p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-iron-gray text-sm mb-1">Activities</p>
                      <p className="text-2xl font-bold text-white">{activityData.count}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-iron-gray text-sm mb-1">Duration</p>
                      <p className="text-2xl font-bold text-white">{formatDuration(activityData.duration)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-iron-gray text-sm mb-1">Calories</p>
                      <p className="text-2xl font-bold text-white">{activityData.calories}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-iron-gray text-sm mb-1">Distance</p>
                      <p className="text-2xl font-bold text-white">
                        {activityData.distance > 0 ? formatDistance(activityData.distance) : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-iron-gray">No nutrition data available</p>
          </div>
        )}
      </div>

      {/* Floating Action Button - Log Meal */}
      <button
        onClick={() => router.push('/nutrition/log')}
        className="fixed bottom-20 right-4 z-40 bg-iron-orange hover:bg-iron-orange/90 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110 focus-visible:ring-2 focus-visible:ring-iron-orange focus-visible:ring-offset-2"
        aria-label="Log a meal"
      >
        <UtensilsCrossed size={24} />
      </button>

      <BottomNavigation />
    </div>
  )
}
