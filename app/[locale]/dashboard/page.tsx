/**
 * Dashboard Page - Adaptive Dashboard Phase 4
 *
 * This page now uses the DashboardEngine component which orchestrates
 * the adaptive dashboard based on user persona (simple/balanced/detailed).
 *
 * The dashboard adapts to:
 * - User's explicit preference (from consultation or settings)
 * - User's behavior patterns (tracked by behavior-tracker)
 * - Current context (time, program day, events, etc.)
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { DashboardEngine } from '@/components/dashboard/DashboardEngine'
import { CameraScanButton } from '@/components/dashboard/CameraScanButton'
import BottomNavigation from '@/components/BottomNavigation'
import type { DashboardVariant } from '@/lib/types/dashboard'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [variant, setVariant] = useState<DashboardVariant>('balanced')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          router.push('/auth')
          return
        }

        setUser(user)

        // Get user profile with dashboard preference
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name, dashboard_preference')
          .eq('id', user.id)
          .single()

        setProfile(profileData)

        // Set dashboard variant from profile or default to balanced
        if (profileData?.dashboard_preference) {
          setVariant(profileData.dashboard_preference as DashboardVariant)
        }

      } catch (err) {
        console.error('Dashboard error:', err)
        router.push('/auth')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-iron-black text-iron-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <h1 className="text-4xl font-heading text-iron-orange mb-2">WAGNER COACH</h1>
            <p className="text-sm text-gray-400">Loading your personalized dashboard...</p>
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

  return (
    <div className="min-h-screen bg-iron-black">
      {/* Header */}
      <div className="bg-gradient-to-b from-iron-gray to-iron-black p-6 sticky top-0 z-10 border-b border-iron-gray">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-1">
            Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-sm text-gray-400">
            {variant === 'simple' && 'Your next action awaits'}
            {variant === 'balanced' && 'Here\'s your day at a glance'}
            {variant === 'detailed' && 'Your complete performance dashboard'}
          </p>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-4xl mx-auto p-6 pb-24">
        <DashboardEngine
          userId={user.id}
          variant={variant}
        />
      </div>

      {/* Floating Camera Scan Button */}
      <CameraScanButton />

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
