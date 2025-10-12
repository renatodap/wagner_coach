/**
 * MVP Dashboard Page - Simple and Clean
 *
 * This is the MVP baseline dashboard with:
 * - Personalized greeting header with user's first name
 * - Simple card-based layout
 * - Essential quick actions
 * - Recent activity summary
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import BottomNavigationMVP from '@/app/components/BottomNavigationMVP'
import { CameraButton } from '@/components/meal-logging/flows/photo-scan/CameraButton'
import { useToast } from '@/hooks/use-toast'
import {
  Calendar,
  Activity,
  TrendingUp,
  MessageSquare,
  Camera,
  Apple,
  Dumbbell,
  Heart,
  Plus,
  Utensils
} from 'lucide-react'

interface UserProfile {
  id: string
  full_name: string | null
}

interface QuickActionCard {
  title: string
  description: string
  icon: any
  href: string
  color: string
}

export default function DashboardMVPPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState('Welcome back')
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    // Set greeting based on time of day
    const hour = new Date().getHours()
    if (hour < 12) {
      setGreeting('Good morning')
    } else if (hour < 18) {
      setGreeting('Good afternoon')
    } else {
      setGreeting('Good evening')
    }

    async function loadUserData() {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          router.push('/auth')
          return
        }

        setUser(user)

        // Get user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('id', user.id)
          .single()

        setProfile(profileData)

      } catch (err) {
        console.error('Dashboard error:', err)
        router.push('/auth')
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [router, supabase])

  // Handle manual meal logging
  function handleManualMealLog() {
    router.push('/nutrition/log')
  }

  // Handle photo meal logging
  async function handlePhotoMealLog(file: File) {
    setIsProcessingImage(true)
    try {
      // Convert file to base64
      const reader = new FileReader()
      const base64Image = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      // Store image in session storage for the meal logging page
      sessionStorage.setItem('pendingMealImage', base64Image)

      // Navigate to nutrition log page which will handle the image analysis
      router.push('/nutrition/log?mode=photo')

      toast({
        title: 'Processing photo',
        description: 'Analyzing your meal...',
      })
    } catch (error) {
      console.error('Failed to process image:', error)
      toast({
        title: 'Failed to process photo',
        description: 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setIsProcessingImage(false)
    }
  }

  const quickActions: QuickActionCard[] = [
    {
      title: 'Log Workout',
      description: 'Record your training',
      icon: Dumbbell,
      href: '/coach-v3-mvp',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Check Program',
      description: 'View today\'s plan',
      icon: Calendar,
      href: '/plan',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Talk to Coach',
      description: 'Ask anything',
      icon: MessageSquare,
      href: '/coach-v3-mvp',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'View Progress',
      description: 'Check your stats',
      icon: TrendingUp,
      href: '/analytics',
      color: 'from-indigo-500 to-indigo-600'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-iron-black text-iron-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <h1 className="text-4xl font-heading text-iron-orange mb-2">WAGNER COACH</h1>
            <p className="text-sm text-gray-400">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-iron-black text-iron-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-heading text-iron-orange">REDIRECTING...</h1>
        </div>
      </div>
    )
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'Champion'

  return (
    <div className="min-h-screen bg-iron-black pb-24">
      {/* Personalized Header */}
      <div className="bg-gradient-to-b from-iron-gray to-iron-black p-6 sticky top-0 z-10 border-b border-iron-gray">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-1">
            {greeting}, {firstName}!
          </h1>
          <p className="text-sm text-gray-400">
            Ready to crush your goals today?
          </p>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">

        {/* Meal Logging Actions */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4">Log Your Meals</h2>
          <div className="grid grid-cols-2 gap-4">

            {/* Manual Meal Logging Button */}
            <button
              onClick={handleManualMealLog}
              className="relative overflow-hidden rounded-xl p-6 text-left transition-transform hover:scale-105 active:scale-95"
              aria-label="Manual meal entry"
            >
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-90" />

              {/* Content */}
              <div className="relative z-10">
                <Plus className="w-8 h-8 text-white mb-3" aria-hidden="true" />
                <h3 className="text-lg font-bold text-white mb-1">Manual Entry</h3>
                <p className="text-sm text-white/80">Type what you ate</p>
              </div>
            </button>

            {/* Photo Meal Logging Button */}
            <div className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-orange-500 to-orange-600 opacity-90">
              <div className="relative z-10">
                <Camera className="w-8 h-8 text-white mb-3" aria-hidden="true" />
                <h3 className="text-lg font-bold text-white mb-1">Photo Scan</h3>
                <p className="text-sm text-white/80 mb-4">Take or upload photo</p>

                {/* Camera Button */}
                <div className="flex justify-center">
                  <div className="bg-white/20 rounded-lg p-2 hover:bg-white/30 transition-colors">
                    <CameraButton
                      onImageSelected={handlePhotoMealLog}
                      disabled={isProcessingImage}
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Quick Actions Grid */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.title}
                  onClick={() => router.push(action.href)}
                  className="relative overflow-hidden rounded-xl p-6 text-left transition-transform hover:scale-105 active:scale-95"
                  aria-label={action.description}
                >
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-90`} />

                  {/* Content */}
                  <div className="relative z-10">
                    <Icon className="w-8 h-8 text-white mb-3" aria-hidden="true" />
                    <h3 className="text-lg font-bold text-white mb-1">{action.title}</h3>
                    <p className="text-sm text-white/80">{action.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* Today's Summary */}
        <section className="bg-iron-gray rounded-xl p-6 border border-iron-gray">
          <h2 className="text-xl font-bold text-white mb-4">Today at a Glance</h2>
          <div className="space-y-4">

            {/* Nutrition */}
            <div className="flex items-center gap-4 p-4 bg-iron-black rounded-lg">
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Apple className="w-6 h-6 text-iron-orange" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-400">Nutrition</h3>
                <p className="text-lg font-bold text-white">Log your first meal</p>
              </div>
            </div>

            {/* Activity */}
            <div className="flex items-center gap-4 p-4 bg-iron-black rounded-lg">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-400" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-400">Activity</h3>
                <p className="text-lg font-bold text-white">No workouts logged yet</p>
              </div>
            </div>

            {/* Recovery */}
            <div className="flex items-center gap-4 p-4 bg-iron-black rounded-lg">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Heart className="w-6 h-6 text-green-400" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-400">Recovery</h3>
                <p className="text-lg font-bold text-white">Track your sleep & HRV</p>
              </div>
            </div>

          </div>
        </section>

        {/* Progress Card */}
        <section className="bg-gradient-to-br from-iron-orange to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold mb-1">Your Progress</h2>
              <p className="text-sm text-white/80">Keep up the momentum</p>
            </div>
            <TrendingUp className="w-8 h-8" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Weekly Goal</span>
              <span className="font-bold">0%</span>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: '0%' }} />
            </div>
            <p className="text-xs text-white/80 mt-2">
              Start tracking to see your progress here
            </p>
          </div>
        </section>

      </div>

      {/* Bottom Navigation */}
      <BottomNavigationMVP />
    </div>
  )
}
