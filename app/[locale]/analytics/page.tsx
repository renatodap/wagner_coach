'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import BottomNavigation from '@/components/BottomNavigation'
import { TrendingUp, Calendar, Activity, UtensilsCrossed } from 'lucide-react'

/**
 * Analytics Page - Coming Soon
 *
 * Placeholder page for analytics/progress tracking.
 * Currently redirects users to dashboard or shows coming soon message.
 */
export default function AnalyticsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-iron-black text-iron-white">
      {/* Header */}
      <header className="bg-zinc-900 border-b-2 border-iron-orange p-4">
        <h1 className="text-iron-orange font-black text-2xl tracking-tight">
          ANALYTICS
        </h1>
        <p className="text-iron-gray text-sm mt-1">
          Track your progress and insights
        </p>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-6 pb-24">
        <div className="bg-zinc-900 border border-iron-gray rounded-lg p-8 text-center">
          <TrendingUp className="w-16 h-16 text-iron-orange mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Analytics Coming Soon
          </h2>
          <p className="text-iron-gray mb-6">
            We're building comprehensive analytics to track your fitness journey.
            In the meantime, check out your dashboard for today's stats.
          </p>

          {/* Quick Stats Preview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-iron-black p-4 rounded-lg">
              <Calendar className="w-6 h-6 text-iron-orange mx-auto mb-2" />
              <p className="text-xs text-iron-gray">Streak</p>
              <p className="text-2xl font-bold text-white">-</p>
            </div>
            <div className="bg-iron-black p-4 rounded-lg">
              <UtensilsCrossed className="w-6 h-6 text-iron-orange mx-auto mb-2" />
              <p className="text-xs text-iron-gray">Meals This Week</p>
              <p className="text-2xl font-bold text-white">-</p>
            </div>
            <div className="bg-iron-black p-4 rounded-lg">
              <Activity className="w-6 h-6 text-iron-orange mx-auto mb-2" />
              <p className="text-xs text-iron-gray">Workouts</p>
              <p className="text-2xl font-bold text-white">-</p>
            </div>
            <div className="bg-iron-black p-4 rounded-lg">
              <TrendingUp className="w-6 h-6 text-iron-orange mx-auto mb-2" />
              <p className="text-xs text-iron-gray">Adherence</p>
              <p className="text-2xl font-bold text-white">-</p>
            </div>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="bg-iron-orange hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </main>

      <BottomNavigation />
    </div>
  )
}
