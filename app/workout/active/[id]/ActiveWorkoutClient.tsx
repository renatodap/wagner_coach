'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { ActiveWorkoutSession, SetPerformance } from '@/lib/types/workout-flows'
import ExerciseDetail from '@/app/components/ExerciseDetail'
import SetTimer from '@/app/components/SetTimer'
import WorkoutCompletionModal from '@/app/components/WorkoutCompletionModal'

interface ActiveWorkoutClientProps {
  session: ActiveWorkoutSession
  userId: string
}

export default function ActiveWorkoutClient({ session, userId }: ActiveWorkoutClientProps) {
  const router = useRouter()
  const [currentSession, setCurrentSession] = useState(session)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(session.elapsed_time_seconds)
  const [isTimerRunning, setIsTimerRunning] = useState(true)

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  const currentExercise = currentSession.exercises[currentSession.current_exercise_index]
  const isLastExercise = currentSession.current_exercise_index === currentSession.exercises.length - 1
  const allExercisesCompleted = currentSession.exercises.every(ex => ex.sets_completed >= ex.sets_planned)

  const handleNextExercise = () => {
    if (!isLastExercise) {
      setCurrentSession(prev => ({
        ...prev,
        current_exercise_index: prev.current_exercise_index + 1,
        current_set: 1
      }))
    }
  }

  const handlePreviousExercise = () => {
    if (currentSession.current_exercise_index > 0) {
      setCurrentSession(prev => ({
        ...prev,
        current_exercise_index: prev.current_exercise_index - 1,
        current_set: 1
      }))
    }
  }

  const handleJumpToExercise = (exerciseIndex: number) => {
    setCurrentSession(prev => ({
      ...prev,
      current_exercise_index: exerciseIndex,
      current_set: 1
    }))
  }

  const handleSetComplete = (setPerformance: Omit<SetPerformance, 'id' | 'session_id' | 'completed_at'>) => {
    // Update exercise completion
    setCurrentSession(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, index) =>
        index === prev.current_exercise_index
          ? { ...ex, sets_completed: ex.sets_completed + 1 }
          : ex
      ),
      current_set: prev.current_set + 1
    }))
  }

  const handlePauseTimer = () => {
    setIsTimerRunning(false)
  }

  const handleResumeTimer = () => {
    setIsTimerRunning(true)
  }

  const handleFinishWorkout = () => {
    setShowCompletionModal(true)
  }

  const handleFinishEarly = () => {
    setShowCompletionModal(true)
  }

  const handleCancelWorkout = () => {
    setShowCancelDialog(true)
  }

  const handleConfirmCancel = async () => {
    // Save partial progress
    setShowCancelDialog(false)
    router.push('/dashboard')
  }

  const handleResume = () => {
    setShowCancelDialog(false)
  }

  const handleWorkoutComplete = async (completion: { rating?: number; notes?: string }) => {
    try {
      // Save workout completion
      console.log('Workout completed:', completion)
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to save workout completion:', error)
    }
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="active-workout">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">{currentSession.workout_name}</h1>
            <p className="text-sm text-gray-600">
              Exercise {currentSession.current_exercise_index + 1} of {currentSession.exercises.length}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold" data-testid="workout-timer">
              {formatTime(elapsedTime)}
            </div>
            <div className="text-sm text-gray-600">
              {isTimerRunning ? 'Running' : 'Paused'}
            </div>
          </div>
        </div>
      </div>

      {/* Exercise Navigation */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex gap-2 overflow-x-auto">
          {currentSession.exercises.map((exercise, index) => (
            <button
              key={exercise.exercise_id}
              data-testid={`exercise-nav-${index}`}
              onClick={() => handleJumpToExercise(index)}
              className={`px-3 py-1 rounded text-sm whitespace-nowrap ${
                index === currentSession.current_exercise_index
                  ? 'bg-blue-600 text-white'
                  : exercise.sets_completed >= exercise.sets_planned
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {exercise.exercise_name}
              {exercise.sets_completed >= exercise.sets_planned && ' ✓'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4">
        {currentExercise && (
          <ExerciseDetail
            exercise={currentExercise}
            currentSet={currentSession.current_set}
            onSetComplete={handleSetComplete}
            onPrevious={currentSession.current_exercise_index > 0 ? handlePreviousExercise : undefined}
            onNext={!isLastExercise ? handleNextExercise : undefined}
          />
        )}

        {/* Timer Controls */}
        <div className="mt-6">
          <SetTimer
            isRunning={isTimerRunning}
            onPause={handlePauseTimer}
            onResume={handleResumeTimer}
            restSeconds={currentExercise?.rest_seconds || 90}
          />
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex gap-3">
          <button
            onClick={handleCancelWorkout}
            data-testid="cancel-workout-button"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
          >
            CANCEL
          </button>

          {allExercisesCompleted ? (
            <button
              onClick={handleFinishWorkout}
              data-testid="finish-workout-button"
              className="flex-1 bg-green-600 text-white py-2 px-6 rounded font-semibold hover:bg-green-700"
            >
              FINISH WORKOUT
            </button>
          ) : (
            <button
              onClick={handleFinishEarly}
              data-testid="finish-early-button"
              className="flex-1 bg-blue-600 text-white py-2 px-6 rounded font-semibold hover:bg-blue-700"
            >
              FINISH EARLY
            </button>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full" data-testid="cancel-confirmation-dialog">
            <h3 className="text-lg font-semibold mb-4">Cancel Workout?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel this workout? Your progress will be saved.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleResume}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-50"
              >
                KEEP GOING
              </button>
              <button
                onClick={handleConfirmCancel}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
              >
                YES, CANCEL WORKOUT
              </button>
            </div>
            <div className="mt-2 text-center">
              <div className="text-sm text-gray-500" data-testid="saving-partial-progress">
                Saving partial progress...
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {showCompletionModal && (
        <WorkoutCompletionModal
          session={currentSession}
          isOpen={showCompletionModal}
          onComplete={handleWorkoutComplete}
          onCancel={() => setShowCompletionModal(false)}
        />
      )}
    </div>
  )
}