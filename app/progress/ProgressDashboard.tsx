'use client'

import type { WorkoutStats, WorkoutCompletion } from '@/lib/types/workout-flows'
import WorkoutHistoryView from '@/app/components/WorkoutHistoryView'
import StatsDashboard from '@/app/components/StatsDashboard'

interface ProgressDashboardProps {
  stats: WorkoutStats
  recentWorkouts: WorkoutCompletion[]
  userId: string
}

export default function ProgressDashboard({ stats, recentWorkouts, userId }: ProgressDashboardProps) {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}.${Math.round((minutes / 60) * 100)}h` : `${minutes}m`
  }

  const formatWeight = (weight: number) => {
    if (weight >= 1000) {
      return `${(weight / 1000).toFixed(1)}k lbs`
    }
    return `${weight.toLocaleString()} lbs`
  }

  // Empty state check
  if (stats.totalCompleted === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12" data-testid="empty-progress-state">
            <div className="text-6xl mb-4">💪</div>
            <h2 className="text-2xl font-bold mb-4">No Progress Yet</h2>
            <p className="text-gray-600">Start your first workout to track progress!</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Progress</h1>
          <p className="text-gray-600">Track your fitness journey</p>
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-blue-600" data-testid="total-completed">
              {stats.totalCompleted}
            </div>
            <div className="text-sm text-gray-600">Workouts</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-green-600" data-testid="current-streak">
              {stats.currentStreak}
            </div>
            <div className="text-sm text-gray-600">Day Streak</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-purple-600" data-testid="total-duration">
              {formatDuration(stats.totalDuration)}
            </div>
            <div className="text-sm text-gray-600">Total Time</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-orange-600" data-testid="average-duration">
              {Math.round(stats.averageDuration / 60)} min
            </div>
            <div className="text-sm text-gray-600">Avg Duration</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-red-600" data-testid="total-weight">
              {formatWeight(stats.totalWeightLifted)}
            </div>
            <div className="text-sm text-gray-600">Total Weight</div>
          </div>
        </div>

        {/* Weekly Frequency Chart */}
        <div className="bg-white rounded-lg shadow p-6" data-testid="frequency-chart">
          <h3 className="text-xl font-semibold mb-4">Weekly Frequency</h3>
          <div className="h-48 bg-gray-100 rounded flex items-center justify-center">
            <div className="text-gray-500">Chart visualization would go here</div>
          </div>
        </div>

        {/* Streaks and Motivation */}
        {stats.currentStreak > 0 && (
          <div className="bg-white rounded-lg shadow p-6" data-testid="streak-motivation">
            <h3 className="text-xl font-semibold mb-4">Streak Power! 🔥</h3>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-2xl font-bold text-orange-500">
                  {stats.currentStreak} days strong!
                </div>
                {stats.longestStreak && (
                  <div className="text-sm text-gray-600">
                    Personal best: {stats.longestStreak} days
                  </div>
                )}
              </div>
              <div className="text-4xl">🏆</div>
            </div>
          </div>
        )}

        {/* Personal Records */}
        <div className="bg-white rounded-lg shadow p-6" data-testid="personal-records">
          <h3 className="text-xl font-semibold mb-4">Personal Records</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded">
              <div className="text-2xl font-bold text-yellow-600">185 lbs</div>
              <div className="text-sm text-gray-600">Bench Press PR</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-600">225 lbs</div>
              <div className="text-sm text-gray-600">Squat PR</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-600">275 lbs</div>
              <div className="text-sm text-gray-600">Deadlift PR</div>
            </div>
          </div>
        </div>

        {/* Insights and Suggestions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6" data-testid="frequency-insights">
            <h3 className="text-xl font-semibold mb-4">Workout Insights</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Most Active Day</span>
                <span className="font-medium">Monday</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Favorite Time</span>
                <span className="font-medium">6:00 AM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Favorite Type</span>
                <span className="font-medium capitalize">{stats.favoriteWorkoutType || 'Push'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6" data-testid="improvement-suggestions">
            <h3 className="text-xl font-semibold mb-4">Suggestions</h3>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded">
                <div className="font-medium text-blue-800">💡 Consistency Tip</div>
                <div className="text-sm text-blue-600">Try scheduling workouts at the same time daily</div>
              </div>
              <div className="p-3 bg-green-50 rounded">
                <div className="font-medium text-green-800">📈 Progress Tip</div>
                <div className="text-sm text-green-600">Increase weight by 2.5-5 lbs when hitting rep targets</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Workouts */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Recent Activity</h3>
            <button className="text-blue-600 hover:text-blue-800 text-sm">
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentWorkouts.slice(0, 5).map((workout) => (
              <div key={workout.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <div className="font-medium">{workout.workout_name}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(workout.completed_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-sm ${i < (workout.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                        data-testid={`workout-rating-${workout.rating}`}
                      >
                        ⭐
                      </span>
                    ))}
                  </div>
                  <div className="text-sm text-gray-600">
                    {Math.round(workout.duration_seconds / 60)} min
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}