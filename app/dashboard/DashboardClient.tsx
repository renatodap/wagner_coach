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
import { createClient } from '@/lib/supabase/client'
import { API_BASE_URL } from '@/lib/api-config'
import { getMeals } from '@/lib/api/meals'
import { calculateDailyTotals } from '@/lib/utils/nutrition-calculations'

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
        // Get auth token
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.access_token) {
          console.error('No access token available')
          setLoading(false)
          return
        }

        const headers = {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }

        // Fetch nutrition data with client-side fallback
        try {
          const nutritionResponse = await fetch(`${API_BASE_URL}/api/v1/nutrition/summary/today`, { headers })
          if (nutritionResponse.ok) {
            const nutritionData = await nutritionResponse.json()

            // Check if backend returned zeros (backend calculation bug)
            const hasBackendData = nutritionData.current.calories > 0 || nutritionData.current.protein > 0

            if (!hasBackendData) {
              console.warn('⚠️ [Dashboard] Backend nutrition totals are 0, calculating from meals...')

              // Fallback: fetch meals and calculate client-side
              try {
                const today = new Date()
                const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
                const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()

                const mealsResponse = await getMeals({
                  startDate: startOfDay,
                  endDate: endOfDay,
                  token: session.access_token
                })

                const totals = calculateDailyTotals(mealsResponse.meals)
                console.log('✅ [Dashboard] Calculated daily totals client-side:', totals)

                // Update current values with calculated totals
                nutritionData.current = {
                  calories: totals.calories,
                  protein: totals.protein_g,
                  carbs: totals.carbs_g,
                  fat: totals.fat_g
                }
              } catch (calcError) {
                console.error('❌ [Dashboard] Failed to calculate nutrition client-side:', calcError)
              }
            } else {
              console.log('✅ [Dashboard] Using backend nutrition totals')
            }

            setNutritionData(nutritionData)
          } else {
            console.error('Failed to fetch nutrition data:', nutritionResponse.status)
          }
        } catch (err) {
          console.error('Error fetching nutrition data:', err)
        }

        // Fetch activity data
        try {
          const activityResponse = await fetch(`${API_BASE_URL}/api/v1/activities/summary/today`, { headers })
          if (activityResponse.ok) {
            const activityData = await activityResponse.json()
            setActivityData(activityData)
          } else {
            console.error('Failed to fetch activity data:', activityResponse.status)
          }
        } catch (err) {
          console.error('Error fetching activity data:', err)
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
      {/* Header - Compact */}
      <div className="bg-iron-black/50 backdrop-blur-sm border-b border-iron-gray/20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-white mb-1">
            {getGreeting()}
          </h1>
          <p className="text-iron-gray text-sm">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Main Content - Compact Spacing */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-iron-orange animate-spin" />
          </div>
        ) : nutritionData ? (
          <div className="space-y-4">
            {/* First-Time User Consultation Banner - Compact */}
            {hasCompletedConsultation === false && (
              <div className="bg-gradient-to-r from-iron-orange to-orange-600 rounded-lg p-4 border border-orange-400">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-6 w-6 text-white flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">
                      🎯 Complete Your Consultation
                    </h3>
                    <p className="text-sm text-white/90 mb-3">
                      Get AI-powered recommendations tailored to YOUR goals. Unlock personalized meal plans and workout programs.
                    </p>
                    <Button
                      onClick={() => router.push('/consultation')}
                      className="bg-white text-iron-orange hover:bg-gray-100 font-semibold text-sm h-9"
                    >
                      Start Now
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions Section - Simplified to 2 Primary Actions */}
            <div className="bg-iron-black/50 backdrop-blur-sm border border-iron-gray/20 rounded-lg p-4">
              <h2 className="text-base font-semibold text-white mb-3">Quick Actions</h2>

              {/* Primary Actions - 2 Most Important */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => router.push('/nutrition/log')}
                  className="bg-iron-orange hover:bg-iron-orange/90 text-white font-semibold h-auto py-4 flex flex-col items-center gap-2 transition-all hover:scale-105"
                  aria-label="Log a meal manually"
                >
                  <UtensilsCrossed size={24} />
                  <span className="text-sm">Log Meal</span>
                </Button>
                <Button
                  onClick={() => router.push('/coach-v2')}
                  className="bg-iron-orange hover:bg-iron-orange/90 text-white font-semibold h-auto py-4 flex flex-col items-center gap-2 transition-all hover:scale-105"
                  aria-label="Chat with your AI coach"
                >
                  <MessageCircle size={24} />
                  <span className="text-sm">Ask Coach</span>
                </Button>
              </div>
            </div>

            {/* Primary Event Countdown */}
            {primaryEvent && (
              <div>
                <EventCountdownWidget event={primaryEvent} size="medium" showActions={true} />
              </div>
            )}

            {/* Nutrition Progress - Compact */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Today's Nutrition</h2>
                <button
                  onClick={() => router.push('/nutrition')}
                  className="text-xs text-iron-orange hover:text-orange-400 underline"
                >
                  View All
                </button>
              </div>

              {/* Calories - Medium Circle */}
              <div className="flex justify-center">
              <CircularProgress
                value={nutritionData.current.calories}
                max={nutritionData.targets.calories}
                label="Calories"
                size="medium"
                color="#ff6b35"
                unit=" cal"
              />
            </div>

            {/* Macros - Smaller Circles, Reduced Gap */}
            <div className="grid grid-cols-3 gap-3">
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

            {/* Activity Progress - Compact */}
            {activityData && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Today's Activity</h2>
                  <button
                    onClick={() => router.push('/activities/daily')}
                    className="text-xs text-iron-orange hover:text-orange-400 underline"
                  >
                    View All
                  </button>
                </div>

                <div className="bg-iron-black/50 backdrop-blur-sm border border-iron-gray/20 rounded-lg p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="text-center">
                      <p className="text-iron-gray text-xs mb-1">Activities</p>
                      <p className="text-xl font-bold text-white">{activityData.count}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-iron-gray text-xs mb-1">Duration</p>
                      <p className="text-xl font-bold text-white">{formatDuration(activityData.duration)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-iron-gray text-xs mb-1">Calories</p>
                      <p className="text-xl font-bold text-white">{activityData.calories}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-iron-gray text-xs mb-1">Distance</p>
                      <p className="text-xl font-bold text-white">
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

      {/* Floating Action Button Removed - Already in Quick Actions */}

      <BottomNavigation />
    </div>
  )
}
