'use client'

import { useState } from 'react'
import type { WorkoutExercise, SetPerformance } from '@/lib/types/workout-flows'
import WeightSelector from './WeightSelector'
import SetTracker from './SetTracker'

interface ExerciseDetailProps {
  exercise: WorkoutExercise
  currentSet: number
  onSetComplete: (setPerformance: Omit<SetPerformance, 'id' | 'session_id' | 'completed_at'>) => void
  onPrevious?: () => void
  onNext?: () => void
}

export default function ExerciseDetail({
  exercise,
  currentSet,
  onSetComplete,
  onPrevious,
  onNext
}: ExerciseDetailProps) {
  const [currentWeight, setCurrentWeight] = useState(exercise.last_weight_used || 0)
  const [showWeightSelector, setShowWeightSelector] = useState(false)

  const isBodyweight = exercise.equipment === 'bodyweight'
  const setsRemaining = exercise.sets_planned - exercise.sets_completed
  const isLastSet = currentSet > exercise.sets_planned

  const handleWeightChange = (weight: number) => {
    setCurrentWeight(weight)
  }

  const handleSetComplete = (setData: Omit<SetPerformance, 'id' | 'session_id' | 'completed_at'>) => {
    onSetComplete({
      ...setData,
      exercise_id: exercise.exercise_id,
      weight_used: isBodyweight ? undefined : currentWeight
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6" data-testid="exercise-detail">
      {/* Exercise Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">{exercise.exercise_name}</h2>
        <div className="flex gap-4 text-sm text-gray-600">
          <span className="capitalize">{exercise.muscle_group}</span>
          <span className="capitalize">{exercise.equipment}</span>
          <span>{exercise.sets_planned} sets</span>
          <span>{exercise.reps_planned} reps</span>
        </div>
        {exercise.notes && (
          <p className="text-gray-600 mt-2 italic">{exercise.notes}</p>
        )}
      </div>

      {/* Progress Indicator */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm text-gray-600">
            {exercise.sets_completed} / {exercise.sets_planned} sets
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(exercise.sets_completed / exercise.sets_planned) * 100}%` }}
          />
        </div>
      </div>

      {/* Weight Selection */}
      {!isBodyweight && (
        <div className="mb-6">
          <WeightSelector
            exercise={exercise}
            currentWeight={currentWeight}
            lastWeight={exercise.last_weight_used}
            onWeightChange={handleWeightChange}
            autoSuggest={true}
          />
        </div>
      )}

      {/* Current Set Tracker */}
      {!isLastSet && (
        <div className="mb-6">
          <SetTracker
            exercise={exercise}
            setNumber={currentSet}
            targetReps={exercise.reps_planned}
            currentWeight={currentWeight}
            onSetComplete={handleSetComplete}
          />
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {onPrevious && (
          <button
            onClick={onPrevious}
            data-testid="previous-exercise"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
          >
            ← Previous
          </button>
        )}

        <div className="flex-1" />

        {onNext && (
          <button
            onClick={onNext}
            data-testid="next-exercise"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Next →
          </button>
        )}
      </div>

      {/* Exercise Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">Form Tips</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Maintain proper form throughout the movement</li>
          <li>• Control the weight during both concentric and eccentric phases</li>
          <li>• Rest {exercise.rest_seconds || 90} seconds between sets</li>
          {exercise.equipment === 'barbell' && (
            <li>• Use proper bar path and grip width</li>
          )}
          {exercise.equipment === 'dumbbell' && (
            <li>• Keep dumbbells balanced and controlled</li>
          )}
        </ul>
      </div>
    </div>
  )
}