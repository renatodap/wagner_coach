'use client'

import { useState, useEffect } from 'react'
import type { ActiveWorkoutSession } from '@/lib/types/workout-flows'
import WorkoutSummary from './WorkoutSummary'

interface WorkoutCompletionModalProps {
  session: ActiveWorkoutSession
  isOpen: boolean
  onComplete: (completion: { rating?: number; notes?: string }) => void
  onCancel: () => void
  loading?: boolean
  showPostActions?: boolean
}

export default function WorkoutCompletionModal({
  session,
  isOpen,
  onComplete,
  onCancel,
  loading = false,
  showPostActions = false
}: WorkoutCompletionModalProps) {
  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState('')
  const [hoveredStar, setHoveredStar] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      // Focus on first interactive element
      const firstStar = document.getElementById('star-1')
      if (firstStar) {
        firstStar.focus()
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleStarClick = (starNumber: number) => {
    setRating(starNumber)
  }

  const handleStarHover = (starNumber: number) => {
    setHoveredStar(starNumber)
  }

  const handleStarLeave = () => {
    setHoveredStar(0)
  }

  const handleKeyNavigation = (e: React.KeyboardEvent, starNumber: number) => {
    if (e.key === 'ArrowRight' && starNumber < 5) {
      const nextStar = document.getElementById(`star-${starNumber + 1}`)
      nextStar?.focus()
    } else if (e.key === 'ArrowLeft' && starNumber > 1) {
      const prevStar = document.getElementById(`star-${starNumber - 1}`)
      prevStar?.focus()
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      setRating(starNumber)
    }
  }

  const calculateStats = () => {
    const totalSets = session.exercises.reduce((sum, ex) => sum + ex.sets_completed, 0)
    const totalPlannedSets = session.exercises.reduce((sum, ex) => sum + ex.sets_planned, 0)
    const completionPercentage = Math.round((totalSets / totalPlannedSets) * 100)

    // Calculate total volume (simplified - would need actual set performance data)
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
      duration: session.elapsed_time_seconds
    }
  }

  const stats = calculateStats()
  const isPartialWorkout = stats.completionPercentage < 100

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError('')

    try {
      const completion = {
        rating: rating || undefined,
        notes: notes.trim() || undefined,
        duration_seconds: session.elapsed_time_seconds,
        sets_performed: stats.totalSets,
        total_weight_lifted: stats.totalVolume,
        completed: !isPartialWorkout,
        completion_percentage: stats.completionPercentage
      }

      await onComplete(completion)
    } catch (err) {
      setError('Failed to save workout')
      setIsSubmitting(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        data-testid="workout-completion-modal"
        role="dialog"
        aria-labelledby="completion-title"
        aria-describedby="completion-description"
      >
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 id="completion-title" className="text-2xl font-bold mb-2">
              {isPartialWorkout ? 'Workout Partial' : 'Workout Complete!'}
            </h2>
            <p id="completion-description" className="text-gray-600">
              {isPartialWorkout
                ? 'Something is better than nothing!'
                : 'Great job finishing your workout!'
              }
            </p>
            {isPartialWorkout && (
              <div className="mt-2 text-sm text-blue-600" data-testid="encouragement-message">
                Something is better than nothing!
              </div>
            )}
          </div>

          {/* Workout Summary */}
          <div className="mb-6">
            <WorkoutSummary session={session} />
          </div>

          {/* Rating */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Rate Your Workout</h3>
            <div className="flex justify-center gap-1" data-testid="workout-rating">
              {[1, 2, 3, 4, 5].map((starNumber) => (
                <button
                  key={starNumber}
                  id={`star-${starNumber}`}
                  onClick={() => handleStarClick(starNumber)}
                  onMouseEnter={() => handleStarHover(starNumber)}
                  onMouseLeave={handleStarLeave}
                  onKeyDown={(e) => handleKeyNavigation(e, starNumber)}
                  data-testid={`star-${starNumber}`}
                  className={`text-3xl transition-colors ${
                    starNumber <= (hoveredStar || rating)
                      ? 'text-yellow-400 filled'
                      : 'text-gray-300'
                  } hover:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded`}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label htmlFor="workout-notes" className="block text-lg font-semibold mb-3">
              Notes (Optional)
            </label>
            <textarea
              id="workout-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              data-testid="workout-notes"
              className="w-full border border-gray-300 rounded px-3 py-2"
              rows={3}
              placeholder="How did the workout feel? Any notes for next time?"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded" data-testid="save-error">
              {error}
              <button
                onClick={handleSubmit}
                className="ml-2 underline hover:no-underline"
              >
                RETRY
              </button>
            </div>
          )}

          {/* Loading */}
          {(loading || isSubmitting) && (
            <div className="mb-4 text-center" data-testid="completion-loading">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <div className="text-gray-600">Saving workout...</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleSubmit}
              disabled={loading || isSubmitting}
              className="w-full bg-green-600 text-white py-3 px-6 rounded font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPartialWorkout ? 'SAVE PARTIAL WORKOUT' : 'COMPLETE WORKOUT'}
            </button>

            {/* Post Actions */}
            {showPostActions && !isPartialWorkout && (
              <div className="grid grid-cols-3 gap-2 mt-4">
                <button
                  data-testid="start-another-workout"
                  className="py-2 px-3 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  START ANOTHER
                </button>
                <button
                  data-testid="view-history"
                  className="py-2 px-3 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50"
                >
                  VIEW HISTORY
                </button>
                <button
                  data-testid="share-workout"
                  className="py-2 px-3 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50"
                >
                  SHARE
                </button>
              </div>
            )}

            <button
              onClick={onCancel}
              disabled={loading || isSubmitting}
              className="w-full border border-gray-300 text-gray-700 py-2 px-6 rounded font-semibold hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}