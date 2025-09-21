'use client'

import { useState } from 'react'
import type { WorkoutExercise } from '@/lib/types/workout-flows'

interface WeightSelectorProps {
  exercise: WorkoutExercise
  currentWeight: number
  lastWeight?: number
  onWeightChange: (weight: number) => void
  autoSuggest?: boolean
}

export default function WeightSelector({
  exercise,
  currentWeight,
  lastWeight,
  onWeightChange,
  autoSuggest = false
}: WeightSelectorProps) {
  const [inputValue, setInputValue] = useState(currentWeight.toString())
  const [error, setError] = useState('')

  // Determine equipment-specific increments
  const getIncrements = () => {
    switch (exercise.equipment) {
      case 'barbell':
        return [5, 10, 25]
      case 'dumbbell':
        return [2.5, 5, 10]
      case 'cable':
      case 'machine':
        return [2.5, 5, 10]
      default:
        return [5, 10]
    }
  }

  const increments = getIncrements()

  const handleIncrement = (amount: number) => {
    const newWeight = currentWeight + amount
    onWeightChange(newWeight)
    setInputValue(newWeight.toString())
    setError('')
  }

  const handleDecrement = (amount: number) => {
    const newWeight = Math.max(0, currentWeight - amount)
    onWeightChange(newWeight)
    setInputValue(newWeight.toString())
    setError('')
  }

  const handleManualInput = (value: string) => {
    setInputValue(value)
    const numValue = parseFloat(value)

    if (isNaN(numValue)) {
      setError('Please enter a valid number')
      return
    }

    if (numValue < 0) {
      setError('Weight must be positive')
      return
    }

    setError('')
    onWeightChange(numValue)
  }

  const handleUsePrevious = () => {
    if (lastWeight) {
      onWeightChange(lastWeight)
      setInputValue(lastWeight.toString())
      setError('')
    }
  }

  const getProgressiveOverloadSuggestion = () => {
    if (!lastWeight) return null

    // Parse rep range to determine if it's strength or hypertrophy focused
    const repsRange = exercise.reps_planned
    const isStrength = repsRange.includes('3-') || repsRange.includes('4-') || repsRange.includes('5-')

    if (isStrength) {
      return { weight: lastWeight + 5, reason: 'Progressive overload suggestion' }
    }

    return { weight: lastWeight, reason: 'Same weight' }
  }

  const suggestion = autoSuggest ? getProgressiveOverloadSuggestion() : null

  const formatDumbbellWeight = (weight: number) => {
    if (exercise.equipment === 'dumbbell') {
      return `${weight} lbs (${weight / 2} each)`
    }
    return `${weight} lbs`
  }

  const getEstimatedStartingWeight = () => {
    // Rough estimates based on exercise type
    switch (exercise.exercise_name.toLowerCase()) {
      case 'bench press':
        return 95
      case 'squat':
        return 95
      case 'deadlift':
        return 135
      default:
        return 45
    }
  }

  if (exercise.equipment === 'bodyweight') {
    return (
      <div className="bg-gray-50 rounded p-4" data-testid="bodyweight-indicator">
        <div className="text-center text-gray-600 font-medium">
          Bodyweight
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-lg p-4" data-testid="weight-selector">
      <h3 className="font-semibold mb-3">Weight Selection</h3>

      {/* Current Weight Display */}
      <div className="text-center mb-4">
        <div className="text-3xl font-bold text-blue-600" data-testid="weight-display">
          {formatDumbbellWeight(currentWeight)}
        </div>
        {error && (
          <div className="text-red-500 text-sm mt-1" data-testid="weight-error">
            {error}
          </div>
        )}
      </div>

      {/* Quick Increment/Decrement */}
      <div className="grid grid-cols-6 gap-2 mb-4">
        {increments.map(amount => (
          <button
            key={`dec-${amount}`}
            onClick={() => handleDecrement(amount)}
            data-testid={`decrement-${amount}`}
            aria-label={`Decrease weight by ${amount} pounds`}
            className="bg-red-100 text-red-700 py-2 px-3 rounded text-sm font-medium hover:bg-red-200"
          >
            -{amount}
          </button>
        ))}
        {increments.map(amount => (
          <button
            key={`inc-${amount}`}
            onClick={() => handleIncrement(amount)}
            data-testid={`increment-${amount}`}
            aria-label={`Increase weight by ${amount} pounds`}
            className="bg-green-100 text-green-700 py-2 px-3 rounded text-sm font-medium hover:bg-green-200"
          >
            +{amount}
          </button>
        ))}
      </div>

      {/* Manual Input */}
      <div className="mb-4">
        <label htmlFor="manual-weight" className="block text-sm font-medium text-gray-700 mb-1">
          Manual Entry
        </label>
        <input
          id="manual-weight"
          type="number"
          value={inputValue}
          onChange={(e) => handleManualInput(e.target.value)}
          data-testid="manual-weight-input"
          aria-label="Enter weight manually"
          className="w-full border border-gray-300 rounded px-3 py-2 text-center"
          placeholder="Enter weight"
        />
      </div>

      {/* Suggestions */}
      {autoSuggest && (
        <div className="space-y-2">
          {lastWeight && (
            <button
              onClick={handleUsePrevious}
              className="w-full bg-gray-100 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-200"
            >
              <div data-testid="last-weight-suggestion">Last: {lastWeight} lbs</div>
              <div className="text-xs">Use Previous</div>
            </button>
          )}

          {suggestion && (
            <button
              onClick={() => onWeightChange(suggestion.weight)}
              className="w-full bg-blue-100 text-blue-700 py-2 px-3 rounded text-sm hover:bg-blue-200"
              title={suggestion.reason}
            >
              <div data-testid={suggestion.weight > (lastWeight || 0) ? 'progressive-overload-suggestion' : 'maintain-weight-suggestion'}>
                {suggestion.weight > (lastWeight || 0) ? `+${suggestion.weight - (lastWeight || 0)} lbs` : 'Same weight'}
              </div>
              <div className="text-xs">{suggestion.reason}</div>
            </button>
          )}

          {!lastWeight && (
            <div className="bg-yellow-100 text-yellow-700 py-2 px-3 rounded text-sm">
              <div data-testid="estimated-starting-weight">
                Estimated: {getEstimatedStartingWeight()} lbs
              </div>
              <div className="text-xs">First time? Start light</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}