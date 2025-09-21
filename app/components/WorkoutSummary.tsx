'use client'

import type { ActiveWorkoutSession } from '@/lib/types/workout-flows'

interface PersonalRecord {
  exercise_name: string
  new_value: number
  old_value: number
}

interface VolumeProgression {
  total_weight: number
  percentage_increase: number
  change: number
}

interface ExtendedSession extends ActiveWorkoutSession {
  personal_records?: PersonalRecord[]
  volume_progression?: VolumeProgression
  estimated_duration_minutes?: number
}

interface WorkoutSummaryProps {
  session: ActiveWorkoutSession
}

export default function WorkoutSummary({ session }: WorkoutSummaryProps) {
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:00`
    }
    return `${mins}:${(seconds % 60).toString().padStart(2, '0')}`
  }

  const calculateStats = () => {
    const totalSets = session.exercises.reduce((sum, ex) => sum + ex.sets_completed, 0)
    const totalPlannedSets = session.exercises.reduce((sum, ex) => sum + ex.sets_planned, 0)
    const completionPercentage = Math.round((totalSets / totalPlannedSets) * 100)

    // Calculate estimated volume (would use actual set performance data in real implementation)
    const totalVolume = session.exercises.reduce((sum, ex) => {
      const avgWeight = ex.last_weight_used || 0
      const avgReps = parseInt(ex.reps_planned.split('-')[0]) || 0
      return sum + (avgWeight * avgReps * ex.sets_completed)
    }, 0)

    return {
      totalSets,
      totalPlannedSets,
      completionPercentage,
      totalVolume,
      exercisesCompleted: session.exercises.filter(ex => ex.sets_completed > 0).length,
      totalExercises: session.exercises.length
    }
  }

  const stats = calculateStats()
  const activeTime = session.elapsed_time_seconds - (session.total_pause_duration_seconds || 0)

  // Check for personal records (mock data)
  const extendedSession = session as ExtendedSession
  const hasPersonalRecords = extendedSession.personal_records?.length ?? 0 > 0
  const personalRecords = extendedSession.personal_records || []

  // Check for volume progression (mock data)
  const volumeProgression = extendedSession.volume_progression

  const formatWorkoutName = () => {
    return session.workout_name || 'Untitled Workout'
  }

  return (
    <div className="space-y-4">
      {/* Workout Name */}
      <div className="text-center">
        <h3 className="text-xl font-bold" data-testid="workout-name">
          {formatWorkoutName()}
        </h3>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-blue-600" data-testid="workout-duration">
            {formatDuration(session.elapsed_time_seconds)}
          </div>
          <div className="text-sm text-gray-600">Duration</div>
        </div>

        <div>
          <div className="text-2xl font-bold text-green-600" data-testid="total-sets">
            {stats.totalSets} sets
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>

        <div>
          <div className="text-2xl font-bold text-purple-600" data-testid="total-volume">
            {stats.totalVolume.toLocaleString()} lbs
          </div>
          <div className="text-sm text-gray-600">Volume</div>
        </div>
      </div>

      {/* Completion Status */}
      <div className="text-center">
        <div className="text-lg font-semibold" data-testid="completion-percentage">
          {stats.completionPercentage}% Complete
        </div>
        <div className="text-sm text-gray-600" data-testid="completion-status">
          {stats.completionPercentage === 100 ? 'Full workout' : 'Partial workout'}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${stats.completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Exercise Breakdown */}
      <div>
        <h4 className="font-semibold mb-2">Exercise Summary</h4>
        <div className="space-y-2">
          {session.exercises.map((exercise, index) => (
            <div key={exercise.exercise_id} className="flex justify-between items-center text-sm">
              <span className="font-medium">{exercise.exercise_name}</span>
              <span className={`${exercise.sets_completed >= exercise.sets_planned ? 'text-green-600' : 'text-amber-600'}`}>
                {exercise.sets_completed}/{exercise.sets_planned} sets
                {exercise.sets_completed >= exercise.sets_planned && ' ✓'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Personal Records */}
      {hasPersonalRecords && (
        <div data-testid="personal-records">
          <h4 className="font-semibold mb-2 text-yellow-600">🏆 New PR!</h4>
          <div className="space-y-1">
            {personalRecords.map((pr: PersonalRecord, index: number) => (
              <div key={index} className="text-sm text-green-600">
                {pr.exercise_name}: {pr.new_value} lbs (+{pr.new_value - pr.old_value})
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Volume Progression */}
      {volumeProgression && (
        <div>
          <h4 className="font-semibold mb-2">Progress vs Last Workout</h4>
          <div className="flex justify-between items-center text-sm">
            <span>Total Volume</span>
            <span className={`font-medium ${volumeProgression.change > 0 ? 'text-green-600' : volumeProgression.change < 0 ? 'text-red-600' : 'text-gray-600'}`} data-testid="volume-progression">
              {volumeProgression.change > 0 ? '+' : ''}{volumeProgression.change} lbs
            </span>
          </div>
          <div className={`text-xs mt-1 ${volumeProgression.change > 0 ? 'text-green-600' : 'text-gray-600'}`} data-testid="progression-indicator">
            {volumeProgression.change > 0 ? 'Great progress!' : 'Steady work'}
          </div>
        </div>
      )}

      {/* Workout Efficiency */}
      <div>
        <h4 className="font-semibold mb-2">Efficiency</h4>
        <div className="flex justify-between items-center text-sm">
          <span>Active Time</span>
          <span className="font-medium" data-testid="active-time">
            {formatDuration(activeTime)}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span>Estimated Duration</span>
          <span className="font-medium">
            {extendedSession.estimated_duration_minutes || 45} min
          </span>
        </div>
        <div className="text-xs text-gray-600 mt-1" data-testid="workout-efficiency">
          {Math.abs(session.elapsed_time_seconds / 60 - (extendedSession.estimated_duration_minutes || 45)) < 5
            ? 'On target'
            : session.elapsed_time_seconds / 60 > (extendedSession.estimated_duration_minutes || 45)
              ? 'Took longer than planned'
              : 'Finished early'
          }
        </div>
      </div>

      {/* Empty State Handling */}
      {stats.totalSets === 0 && (
        <div className="text-center py-4" data-testid="minimal-completion">
          <div className="text-gray-500">No exercises completed</div>
          <div className="text-sm text-gray-400 mt-1">
            Better luck next time!
          </div>
        </div>
      )}

      {/* Validation Warning */}
      {session.elapsed_time_seconds === 0 && (
        <div className="bg-red-100 text-red-700 p-3 rounded text-sm" data-testid="invalid-session-warning">
          ⚠️ Invalid session data detected. Cannot complete workout.
        </div>
      )}
    </div>
  )
}