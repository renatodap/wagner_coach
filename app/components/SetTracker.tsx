'use client'

import { useState } from 'react'
import type { WorkoutExercise, SetPerformance } from '@/lib/types/workout-flows'

interface SetTrackerProps {
  exercise: WorkoutExercise
  setNumber: number
  targetReps: string
  currentWeight: number
  onSetComplete: (setPerformance: Omit<SetPerformance, 'id' | 'session_id' | 'completed_at'>) => void
}

export default function SetTracker({
  exercise,
  setNumber,
  targetReps,
  currentWeight,
  onSetComplete
}: SetTrackerProps) {
  const [repsPerformed, setRepsPerformed] = useState('')
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const [error, setError] = useState('')

  // Parse target reps range
  const parseTargetReps = (repsStr: string) => {
    const match = repsStr.match(/(\d+)-(\d+)/)
    if (match) {
      return { min: parseInt(match[1]), max: parseInt(match[2]) }
    }
    const single = parseInt(repsStr)
    return isNaN(single) ? { min: 1, max: 15 } : { min: single, max: single }
  }

  const targetRange = parseTargetReps(targetReps)
  const repsNum = parseInt(repsPerformed)

  const getRepsStatus = () => {
    if (!repsPerformed || isNaN(repsNum)) return null

    if (repsNum < targetRange.min) {
      return { status: 'below', message: 'Below target range', color: 'text-amber-600' }
    }
    if (repsNum > targetRange.max) {
      return { status: 'above', message: 'Above target range', color: 'text-blue-600' }
    }
    return { status: 'target', message: 'In target range', color: 'text-green-600' }
  }

  const repsStatus = getRepsStatus()

  const handleCompleteSet = () => {
    if (!repsPerformed || isNaN(repsNum)) {
      setError('Please enter number of reps performed')
      return
    }

    if (repsNum <= 0) {
      setError('Reps must be greater than 0')
      return
    }

    if (!currentWeight && exercise.equipment !== 'bodyweight') {
      setError('Please set weight before completing set')
      return
    }

    setError('')

    onSetComplete({
      exercise_id: exercise.exercise_id,
      set_number: setNumber,
      reps_performed: repsNum,
      weight_used: exercise.equipment === 'bodyweight' ? undefined : currentWeight,
      notes: notes.trim() || undefined
    })

    // Reset form
    setRepsPerformed('')
    setNotes('')
    setShowNotes(false)
  }

  const canComplete = repsPerformed && !isNaN(repsNum) && repsNum > 0 &&
    (currentWeight > 0 || exercise.equipment === 'bodyweight')

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Set {setNumber}</h3>
        <div className="text-sm text-gray-600">
          Target: {targetReps} reps
        </div>
      </div>

      {/* Weight Display */}
      {exercise.equipment !== 'bodyweight' && (
        <div className="mb-4 text-center">
          <div className="text-lg font-semibold text-blue-600">
            {currentWeight > 0 ? `${currentWeight} lbs` : 'Set weight first'}
          </div>
          {!currentWeight && (
            <div className="text-red-500 text-sm" data-testid="missing-data-warning">
              Set weight to complete
            </div>
          )}
        </div>
      )}

      {/* Reps Input */}
      <div className="mb-4">
        <label htmlFor="reps-input" className="block text-sm font-medium text-gray-700 mb-1">
          Reps Performed
        </label>
        <input
          id="reps-input"
          type="number"
          value={repsPerformed}
          onChange={(e) => setRepsPerformed(e.target.value)}
          data-testid="reps-input"
          aria-label="Number of reps completed"
          className="w-full border border-gray-300 rounded px-3 py-2 text-center text-lg"
          placeholder="Enter reps"
          min="0"
        />

        {repsStatus && (
          <div className={`text-sm mt-1 text-center ${repsStatus.color}`} data-testid="reps-feedback">
            {repsStatus.message}
          </div>
        )}
      </div>

      {/* Notes Section */}
      <div className="mb-4">
        {!showNotes ? (
          <button
            onClick={() => setShowNotes(true)}
            data-testid="add-notes-button"
            className="text-blue-600 text-sm hover:text-blue-800"
          >
            + Add notes (optional)
          </button>
        ) : (
          <div>
            <label htmlFor="set-notes" className="block text-sm font-medium text-gray-700 mb-1">
              Set Notes
            </label>
            <textarea
              id="set-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              data-testid="set-notes-input"
              aria-label="Optional notes for this set"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              rows={2}
              placeholder="How did this set feel? Any form notes?"
            />
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 text-red-500 text-sm text-center" data-testid="set-error">
          {error}
        </div>
      )}

      {/* Complete Button */}
      <button
        onClick={handleCompleteSet}
        disabled={!canComplete}
        className="w-full bg-green-600 text-white py-3 px-4 rounded font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Complete Set
      </button>

      {/* Set Summary */}
      {repsPerformed && currentWeight && (
        <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
          <div className="text-center">
            <span className="font-medium">{repsPerformed} reps</span>
            {exercise.equipment !== 'bodyweight' && (
              <span> @ {currentWeight} lbs</span>
            )}
            {notes && (
              <div className="text-gray-600 italic mt-1">&ldquo;{notes}&rdquo;</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}