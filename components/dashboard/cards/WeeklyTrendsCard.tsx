/**
 * Weekly Trends Card
 *
 * Shows adherence chart, calorie trend, and weekly summary.
 * Priority: 21 (detailed - always), 24 (balanced - evenings/weekends only)
 *
 * Variants:
 * - Full (Detailed): Complete analytics with charts
 * - Summary (Balanced): Key metrics only, shown on weekends or evenings
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, Calendar, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface WeeklyData {
  adherencePercent: number
  averageCalories: number
  targetCalories: number
  mealsLogged: number
  workoutsCompleted: number
  dailyAdherence: Array<{ day: string; percent: number }> // 7 days
}

interface WeeklyTrendsCardProps {
  variant: 'balanced' | 'detailed'
  data?: WeeklyData
}

const DEFAULT_DATA: WeeklyData = {
  adherencePercent: 82,
  averageCalories: 2150,
  targetCalories: 2200,
  mealsLogged: 18,
  workoutsCompleted: 4,
  dailyAdherence: [
    { day: 'Mon', percent: 95 },
    { day: 'Tue', percent: 88 },
    { day: 'Wed', percent: 75 },
    { day: 'Thu', percent: 92 },
    { day: 'Fri', percent: 68 },
    { day: 'Sat', percent: 85 },
    { day: 'Sun', percent: 80 }
  ]
}

export function WeeklyTrendsCard({ variant, data = DEFAULT_DATA }: WeeklyTrendsCardProps) {
  const getAdherenceColor = (percent: number): string => {
    if (percent >= 90) return 'text-green-500'
    if (percent >= 75) return 'text-yellow-500'
    if (percent >= 60) return 'text-orange-500'
    return 'text-red-500'
  }

  const getAdherenceMessage = (percent: number): string => {
    if (percent >= 90) return 'Excellent consistency!'
    if (percent >= 75) return 'Good progress'
    if (percent >= 60) return 'Room for improvement'
    return 'Let\'s refocus'
  }

  if (variant === 'balanced') {
    // Summary version for Balanced persona (evenings/weekends)
    return (
      <Card className="bg-iron-gray border-iron-gray">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-iron-orange" aria-hidden="true" />
              <CardTitle className="text-white text-lg">This Week</CardTitle>
            </div>
            <Link
              href="/analytics"
              className="text-xs text-iron-orange hover:underline"
              aria-label="View detailed analytics"
            >
              Details
            </Link>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Weekly Adherence */}
          <div className="bg-iron-black p-4 rounded-lg text-center">
            <div className={`text-5xl font-bold ${getAdherenceColor(data.adherencePercent)}`}>
              {data.adherencePercent}%
            </div>
            <p className="text-sm text-gray-400 mt-1">
              {getAdherenceMessage(data.adherencePercent)}
            </p>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-iron-black p-3 rounded-lg">
              <div className="text-2xl font-bold text-white">
                {data.mealsLogged}
              </div>
              <div className="text-xs text-gray-400 mt-1">Meals Logged</div>
            </div>

            <div className="bg-iron-black p-3 rounded-lg">
              <div className="text-2xl font-bold text-white">
                {data.workoutsCompleted}
              </div>
              <div className="text-xs text-gray-400 mt-1">Workouts Done</div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Full version for Detailed persona
  return (
    <Card className="bg-iron-gray border-iron-gray">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-iron-orange" aria-hidden="true" />
            <CardTitle className="text-white text-lg">Weekly Analytics</CardTitle>
          </div>
          <Link
            href="/analytics"
            className="text-xs text-iron-orange hover:underline"
            aria-label="View full analytics dashboard"
          >
            View All
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-iron-black p-3 rounded-lg text-center">
            <div className={`text-2xl font-bold ${getAdherenceColor(data.adherencePercent)}`}>
              {data.adherencePercent}%
            </div>
            <div className="text-xs text-gray-400 mt-1">Adherence</div>
          </div>

          <div className="bg-iron-black p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-white">
              {data.mealsLogged}
            </div>
            <div className="text-xs text-gray-400 mt-1">Meals</div>
          </div>

          <div className="bg-iron-black p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-white">
              {data.workoutsCompleted}
            </div>
            <div className="text-xs text-gray-400 mt-1">Workouts</div>
          </div>
        </div>

        {/* Daily Adherence Chart */}
        <div>
          <h4 className="text-sm text-gray-400 mb-3">Daily Adherence</h4>
          <div className="flex items-end justify-between gap-2 h-32">
            {data.dailyAdherence.map((day, index) => {
              const heightPercent = day.percent
              const barColor = day.percent >= 75 ? 'bg-iron-orange' : 'bg-gray-600'

              return (
                <div
                  key={day.day}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  {/* Bar */}
                  <div className="w-full flex flex-col justify-end h-full">
                    <div
                      className={`w-full rounded-t transition-all ${barColor} hover:opacity-80 group relative`}
                      style={{ height: `${heightPercent}%` }}
                      role="img"
                      aria-label={`${day.day}: ${day.percent}% adherence`}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-iron-black px-2 py-1 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {day.percent}%
                      </div>
                    </div>
                  </div>

                  {/* Day label */}
                  <span className="text-xs text-gray-400">{day.day}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Calorie Trend */}
        <div className="bg-iron-black p-3 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Average Calories</span>
            <TrendingUp className="w-4 h-4 text-green-500" aria-hidden="true" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              {data.averageCalories}
            </span>
            <span className="text-sm text-gray-400">
              / {data.targetCalories} target
            </span>
          </div>
          <div className="w-full bg-iron-gray rounded-full h-2 mt-2">
            <div
              className="bg-iron-orange h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, (data.averageCalories / data.targetCalories) * 100)}%` }}
              role="progressbar"
              aria-valuenow={(data.averageCalories / data.targetCalories) * 100}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        {/* View Full Analytics */}
        <Link href="/analytics">
          <Button
            variant="outline"
            className="w-full border-iron-gray bg-iron-black hover:bg-iron-gray text-white"
            aria-label="View full analytics dashboard with charts and insights"
          >
            <BarChart3 className="w-4 h-4 mr-2" aria-hidden="true" />
            View Full Analytics
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
