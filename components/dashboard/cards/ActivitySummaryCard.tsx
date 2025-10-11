/**
 * Activity Summary Card
 *
 * Shows today's activities with duration, calories, distance.
 * Priority: 16
 *
 * Conditional: Shows for Balanced/Detailed if activities > 0 OR user tracks workouts
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Activity, Bike, Clock, Dumbbell, Flame, MapPin, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface ActivityData {
  id: string
  type: string // 'run' | 'bike' | 'strength' | 'swim' | etc
  name: string
  duration: number // minutes
  calories: number
  distance?: number // miles or km
}

interface ActivitySummaryCardProps {
  activities?: ActivityData[]
  totalCalories?: number
  totalDuration?: number
}

const DEFAULT_ACTIVITIES: ActivityData[] = [
  {
    id: '1',
    type: 'strength',
    name: 'Upper Body Strength',
    duration: 45,
    calories: 280,
  },
  {
    id: '2',
    type: 'run',
    name: 'Morning Run',
    duration: 30,
    calories: 320,
    distance: 3.2
  }
]

export function ActivitySummaryCard({
  activities = DEFAULT_ACTIVITIES,
  totalCalories = 600,
  totalDuration = 75
}: ActivitySummaryCardProps) {
  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'run':
      case 'running':
        return <TrendingUp className="w-4 h-4" aria-hidden="true" />
      case 'bike':
      case 'cycling':
        return <Bike className="w-4 h-4" aria-hidden="true" />
      case 'strength':
      case 'weights':
        return <Dumbbell className="w-4 h-4" aria-hidden="true" />
      default:
        return <Activity className="w-4 h-4" aria-hidden="true" />
    }
  }

  if (activities.length === 0) {
    return (
      <Card className="bg-iron-gray border-iron-gray">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-iron-orange" aria-hidden="true" />
              <CardTitle className="text-white text-lg">Today's Activities</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Dumbbell className="w-12 h-12 text-gray-600 mx-auto mb-3" aria-hidden="true" />
            <p className="text-gray-400 text-sm mb-3">No activities logged yet today</p>
            <Link href="/activities/log">
              <Button
                className="bg-iron-orange hover:bg-orange-600 text-white"
                aria-label="Log your first activity"
              >
                Log Activity
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-iron-gray border-iron-gray">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-iron-orange" aria-hidden="true" />
            <CardTitle className="text-white text-lg">Today's Activities</CardTitle>
          </div>
          <Link
            href="/activities"
            className="text-xs text-iron-orange hover:underline"
            aria-label="View activity history"
          >
            View All
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-iron-black p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-white">{activities.length}</div>
            <div className="text-xs text-gray-400 mt-1">Activities</div>
          </div>

          <div className="bg-iron-black p-3 rounded-lg text-center">
            <div className="flex items-center justify-center gap-1">
              <Clock className="w-4 h-4 text-iron-orange" aria-hidden="true" />
              <span className="text-2xl font-bold text-white">{totalDuration}</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">Minutes</div>
          </div>

          <div className="bg-iron-black p-3 rounded-lg text-center">
            <div className="flex items-center justify-center gap-1">
              <Flame className="w-4 h-4 text-orange-500" aria-hidden="true" />
              <span className="text-2xl font-bold text-white">{totalCalories}</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">Calories</div>
          </div>
        </div>

        {/* Activity List */}
        <div className="space-y-2">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center gap-3 p-3 bg-iron-black rounded-lg hover:bg-iron-gray transition-colors"
            >
              {/* Icon */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-iron-orange/20 flex items-center justify-center text-iron-orange">
                {getActivityIcon(activity.type)}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-white truncate">
                  {activity.name}
                </h4>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                  <span>{activity.duration} min</span>
                  <span>•</span>
                  <span>{activity.calories} cal</span>
                  {activity.distance && (
                    <>
                      <span>•</span>
                      <span>{activity.distance} mi</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Log More Button */}
        <Link href="/activities/log">
          <Button
            variant="outline"
            className="w-full border-iron-gray bg-iron-black hover:bg-iron-gray text-white"
            aria-label="Log another activity"
          >
            <Activity className="w-4 h-4 mr-2" aria-hidden="true" />
            Log Activity
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
