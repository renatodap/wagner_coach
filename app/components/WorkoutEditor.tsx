'use client'

import { useState } from 'react'
import type { WorkoutCompletion } from '@/lib/types/workout-flows'

interface WorkoutEditorProps {
  workout: WorkoutCompletion
  isOpen: boolean
  onSave: (workout: WorkoutCompletion) => void
  onCancel: () => void
}

interface EditHistory {
  edited_at: string
  field: string
  old_value: string
  new_value: string
}

interface ExtendedWorkoutCompletion extends WorkoutCompletion {
  edit_history?: EditHistory[]
}

export default function WorkoutEditor({ workout, isOpen, onSave, onCancel }: WorkoutEditorProps) {
  const [editedWorkout, setEditedWorkout] = useState(workout)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  if (!isOpen) return null

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (editedWorkout.rating && (editedWorkout.rating < 1 || editedWorkout.rating > 5)) {
      newErrors.rating = 'Rating must be between 1-5'
    }

    if (editedWorkout.duration_seconds && editedWorkout.duration_seconds < 0) {
      newErrors.duration = 'Duration must be positive'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setSaving(true)
    setSaveError('')

    try {
      await onSave(editedWorkout)
    } catch (error) {
      setSaveError('Failed to save changes')
      setSaving(false)
    }
  }

  const handleStarClick = (rating: number) => {
    setEditedWorkout(prev => ({ ...prev, rating }))
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel()
    }
  }

  // Mock edit history
  const extendedWorkout = workout as ExtendedWorkoutCompletion
  const editHistory: EditHistory[] = extendedWorkout.edit_history || []

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        data-testid="workout-editor-modal"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Edit Workout</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Workout Details */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Workout Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Workout Name
                  </label>
                  <input
                    type="text"
                    value={editedWorkout.workout_name}
                    onChange={(e) =>
                      setEditedWorkout(prev => ({ ...prev, workout_name: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={new Date(editedWorkout.completed_at).toISOString().split('T')[0]}
                    onChange={(e) =>
                      setEditedWorkout(prev => ({ ...prev, completed_at: new Date(e.target.value) }))
                    }
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Rating
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleStarClick(star)}
                    data-testid={`edit-star-${star}`}
                    className={`text-3xl transition-colors ${
                      star <= (editedWorkout.rating || 0)
                        ? 'text-yellow-400 filled'
                        : 'text-gray-300'
                    } hover:text-yellow-400`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              {errors.rating && (
                <div className="text-red-500 text-sm mt-1" data-testid="rating-error">
                  {errors.rating}
                </div>
              )}

              {/* Manual Rating Input */}
              <div className="mt-2">
                <label className="block text-sm text-gray-600 mb-1">
                  Or enter manually (1-5):
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={editedWorkout.rating || ''}
                  onChange={(e) =>
                    setEditedWorkout(prev => ({ ...prev, rating: parseInt(e.target.value) || undefined }))
                  }
                  data-testid="manual-rating-input"
                  className="w-20 border border-gray-300 rounded px-3 py-1 text-sm"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="workout-notes-editor" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="workout-notes-editor"
                value={editedWorkout.notes || ''}
                onChange={(e) =>
                  setEditedWorkout(prev => ({ ...prev, notes: e.target.value }))
                }
                data-testid="workout-notes-editor"
                className="w-full border border-gray-300 rounded px-3 py-2"
                rows={4}
                placeholder="Add your workout notes here..."
              />
            </div>

            {/* Performance Stats */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Performance</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={Math.round(editedWorkout.duration_seconds / 60)}
                    onChange={(e) =>
                      setEditedWorkout(prev => ({ ...prev, duration_seconds: parseInt(e.target.value) * 60 || 0 }))
                    }
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    min="0"
                  />
                  {errors.duration && (
                    <div className="text-red-500 text-sm mt-1">{errors.duration}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sets Performed
                  </label>
                  <input
                    type="number"
                    value={editedWorkout.sets_performed || 0}
                    onChange={(e) =>
                      setEditedWorkout(prev => ({ ...prev, sets_performed: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Weight (lbs)
                  </label>
                  <input
                    type="number"
                    value={editedWorkout.total_weight_lifted || 0}
                    onChange={(e) =>
                      setEditedWorkout(prev => ({ ...prev, total_weight_lifted: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Edit History */}
            {editHistory.length > 0 && (
              <div data-testid="edit-history">
                <h3 className="text-lg font-semibold mb-3">Edit History</h3>
                <div className="space-y-2">
                  {editHistory.map((edit, index) => (
                    <div key={index} className="text-sm p-3 bg-gray-50 rounded">
                      <div className="font-medium">Modified {edit.field}</div>
                      <div className="text-gray-600">
                        {new Date(edit.edited_at).toLocaleDateString()} at{' '}
                        {new Date(edit.edited_at).toLocaleTimeString()}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {edit.old_value} → {edit.new_value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save Error */}
            {saveError && (
              <div className="p-3 bg-red-100 text-red-700 rounded" data-testid="save-error">
                {saveError}
                <button
                  onClick={handleSave}
                  className="ml-2 underline hover:no-underline"
                >
                  RETRY
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={onCancel}
                disabled={saving}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || Object.keys(errors).length > 0}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'SAVE CHANGES'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}