/**
 * Plan Page - 14-Day Program View
 *
 * PLACEHOLDER for Phase 2 of Adaptive Dashboard implementation.
 *
 * This page will eventually display:
 * - 14-day program calendar view
 * - Daily meal plans and workout schedules
 * - Progress tracking for current program day
 * - Ability to navigate between days
 *
 * For now, this is a placeholder to support the new 4-tab bottom navigation.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, Dumbbell, UtensilsCrossed } from 'lucide-react'
import BottomNavigation from '@/app/components/BottomNavigation'

export default function PlanPage() {
  return (
    <div className="min-h-screen bg-iron-black pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-iron-gray to-iron-black p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Your Plan</h1>
        <p className="text-iron-gray text-sm">
          14-day personalized program
        </p>
      </div>

      {/* Coming Soon Content */}
      <div className="p-6 space-y-6">
        <Card className="bg-iron-gray border-iron-gray">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-8 h-8 text-iron-orange" />
              <CardTitle className="text-white">Coming Soon</CardTitle>
            </div>
            <CardDescription className="text-gray-400">
              Your personalized 14-day program view is being built
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-white font-semibold">What's Coming:</h3>

              <div className="flex items-start gap-3 text-sm text-gray-300">
                <Calendar className="w-5 h-5 text-iron-orange mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Calendar View</p>
                  <p className="text-gray-400">See your entire 14-day program at a glance</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm text-gray-300">
                <UtensilsCrossed className="w-5 h-5 text-iron-orange mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Daily Meal Plans</p>
                  <p className="text-gray-400">Pre-planned meals with nutrition targets</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm text-gray-300">
                <Dumbbell className="w-5 h-5 text-iron-orange mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Workout Schedules</p>
                  <p className="text-gray-400">Training days with exercises and sets</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm text-gray-300">
                <Clock className="w-5 h-5 text-iron-orange mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Progress Tracking</p>
                  <p className="text-gray-400">See how you're progressing through your program</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-iron-gray">
              <p className="text-xs text-gray-500">
                In the meantime, access your meals, workouts, and activities from your Profile.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Temporary Navigation Card */}
        <Card className="bg-iron-gray border-iron-gray">
          <CardHeader>
            <CardTitle className="text-white text-lg">Quick Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/nutrition"
              className="flex items-center justify-between p-3 rounded-lg bg-iron-black hover:bg-iron-gray transition-colors"
            >
              <div className="flex items-center gap-3">
                <UtensilsCrossed className="w-5 h-5 text-iron-orange" />
                <span className="text-white font-medium">Meal History</span>
              </div>
              <span className="text-gray-400 text-sm">→</span>
            </a>

            <a
              href="/activities"
              className="flex items-center justify-between p-3 rounded-lg bg-iron-black hover:bg-iron-gray transition-colors"
            >
              <div className="flex items-center gap-3">
                <Dumbbell className="w-5 h-5 text-iron-orange" />
                <span className="text-white font-medium">Activities</span>
              </div>
              <span className="text-gray-400 text-sm">→</span>
            </a>

            <a
              href="/profile"
              className="flex items-center justify-between p-3 rounded-lg bg-iron-black hover:bg-iron-gray transition-colors"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-iron-orange" />
                <span className="text-white font-medium">Profile & Settings</span>
              </div>
              <span className="text-gray-400 text-sm">→</span>
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
