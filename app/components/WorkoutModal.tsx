'use client'

import { useState } from 'react'
import type { Workout, WorkoutExercise } from '@/lib/types/workout-flows'

interface WorkoutModalProps {
  workout: Workout
  exercises: WorkoutExercise[]
  isOpen: boolean
  onClose: () => void
  onStart: (workoutId: number) => void
  loading?: boolean
}

export default function WorkoutModal({
  workout,
  exercises,
  isOpen,
  onClose,
  onStart,
  loading = false
}: WorkoutModalProps) {
  const [isStarting, setIsStarting] = useState(false)

  if (!isOpen) return null

  const handleStart = async () => {
    setIsStarting(true)
    try {
      await onStart(workout.id)
    } catch (error) {
      console.error('Failed to start workout:', error)
      setIsStarting(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      data-testid="workout-modal"
    >
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">{workout.name}</h2>
              <p className="text-gray-600">{workout.description}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              data-testid="close-modal"
            >
              ✕
            </button>
          </div>

          {/* Workout Details */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{workout.estimated_duration_minutes}</div>
              <div className="text-sm text-gray-500">min</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 capitalize">{workout.difficulty}</div>
              <div className="text-sm text-gray-500">difficulty</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 capitalize">{workout.type}</div>
              <div className="text-sm text-gray-500">type</div>
            </div>
          </div>

          {/* Exercise List */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Exercises</h3>
            {exercises.length > 0 ? (
              <div className="space-y-3">
                {exercises.map((exercise, index) => (
                  <div key={exercise.exercise_id} className="border rounded p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{exercise.exercise_name}</h4>
                        <p className="text-sm text-gray-600">
                          {exercise.sets_planned} sets × {exercise.reps_planned} reps
                        </p>
                        {exercise.notes && (
                          <p className="text-sm text-gray-500 mt-1">{exercise.notes}</p>
                        )}
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div>{exercise.muscle_group}</div>
                        <div>{exercise.equipment}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No exercises available for this workout</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleStart}
              disabled={loading || isStarting || exercises.length === 0}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading || isStarting ? (
                <div className="flex items-center justify-center">
                  <div
                    className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"
                    data-testid="loading-spinner"
                  ></div>
                  Starting...
                </div>
              ) : (
                'START WORKOUT'
              )}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded font-semibold hover:bg-gray-50"
            >
              CANCEL
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}