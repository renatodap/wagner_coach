'use client'

import { useState } from 'react'
import type { WorkoutCompletion } from '@/lib/types/workout-flows'

interface WorkoutHistoryViewProps {
  workouts: WorkoutCompletion[]
  userId: string
  onEdit?: (workout: WorkoutCompletion) => void
  onDelete?: (workoutId: number) => void
}

export default function WorkoutHistoryView({
  workouts,
  userId,
  onEdit,
  onDelete
}: WorkoutHistoryViewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [dateRange, setDateRange] = useState('')
  const [expandedWorkout, setExpandedWorkout] = useState<number | null>(null)
  const [editingWorkout, setEditingWorkout] = useState<WorkoutCompletion | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ workoutId: number; name: string } | null>(null)
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('')

  // Filter workouts
  const filteredWorkouts = workouts.filter(workout => {
    const matchesSearch = searchTerm === '' ||
      workout.workout_name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = selectedType === '' || workout.workout_type === selectedType

    const matchesDate = dateRange === '' || (() => {
      const workoutDate = new Date(workout.completed_at)
      const now = new Date()

      switch (dateRange) {
        case 'last-7-days':
          return workoutDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        case 'last-30-days':
          return workoutDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        case 'last-90-days':
          return workoutDate >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        default:
          return true
      }
    })()

    return matchesSearch && matchesType && matchesDate
  }).sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())

  const handleWorkoutClick = (workoutId: number) => {
    setExpandedWorkout(expandedWorkout === workoutId ? null : workoutId)
  }

  const handleEdit = (workout: WorkoutCompletion) => {
    setEditingWorkout(workout)
    if (onEdit) onEdit(workout)
  }

  const handleDelete = (workout: WorkoutCompletion) => {
    setDeleteConfirmation({ workoutId: workout.id, name: workout.workout_name })
    setDeleteConfirmationInput('')
  }

  const handleConfirmDelete = () => {
    if (!deleteConfirmation) return

    if (deleteConfirmationInput === deleteConfirmation.name) {
      if (onDelete) onDelete(deleteConfirmation.workoutId)
      setDeleteConfirmation(null)
      setDeleteConfirmationInput('')
    }
  }

  const handleSaveEdit = (updatedWorkout: WorkoutCompletion) => {
    // In real implementation, this would save to database
    console.log('Saving workout edit:', updatedWorkout)
    setEditingWorkout(null)
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes} minutes`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleExportCSV = async () => {
    try {
      // Mock CSV export
      const csvData = workouts.map(w => ({
        Date: formatDate(w.completed_at.toISOString()),
        Workout: w.workout_name,
        Duration: Math.round(w.duration_seconds / 60),
        Rating: w.rating || '',
        Sets: w.sets_performed,
        Weight: w.total_weight_lifted,
        Notes: w.notes || ''
      }))

      console.log('Exporting CSV:', csvData)

      // Show success message
      const successDiv = document.createElement('div')
      successDiv.setAttribute('data-testid', 'export-success')
      successDiv.textContent = 'Export started'
      document.body.appendChild(successDiv)

      setTimeout(() => document.body.removeChild(successDiv), 3000)
    } catch (error) {
      console.error('Export failed:', error)

      // Show error message
      const errorDiv = document.createElement('div')
      errorDiv.setAttribute('data-testid', 'export-error')
      errorDiv.textContent = 'Export failed'
      document.body.appendChild(errorDiv)

      setTimeout(() => document.body.removeChild(errorDiv), 3000)
    }
  }

  if (workouts.length === 0) {
    return (
      <div className="text-center py-12" data-testid="no-workouts-message">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-xl font-semibold mb-2">No workouts yet</h3>
        <p className="text-gray-600">Start your first workout!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search workouts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="workout-search"
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <button
            onClick={handleExportCSV}
            data-testid="export-csv-button"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Export CSV
          </button>
        </div>

        <div className="flex gap-4">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            data-testid="workout-type-filter"
            className="border border-gray-300 rounded px-3 py-2"
          >
            <option value="">All Types</option>
            <option value="push">Push</option>
            <option value="pull">Pull</option>
            <option value="legs">Legs</option>
            <option value="full_body">Full Body</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            data-testid="date-range-filter"
            className="border border-gray-300 rounded px-3 py-2"
          >
            <option value="">All Time</option>
            <option value="last-7-days">Last 7 Days</option>
            <option value="last-30-days">Last 30 Days</option>
            <option value="last-90-days">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Filtered Results Info */}
      {(searchTerm || selectedType || dateRange) && (
        <div className="text-sm text-gray-600" data-testid="filtered-results">
          Showing {filteredWorkouts.length} of {workouts.length} workouts
        </div>
      )}

      {/* Workout List */}
      <div className="space-y-4">
        {filteredWorkouts.map((workout) => (
          <div key={workout.id} className="bg-white border rounded-lg shadow">
            {/* Workout Header */}
            <div
              className="p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => handleWorkoutClick(workout.id)}
              data-testid={`workout-history-item-${workout.id}`}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleWorkoutClick(workout.id)
                }
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{workout.workout_name}</h3>
                  <div className="flex gap-4 text-sm text-gray-600 mt-1">
                    <span>{formatDate(workout.completed_at.toISOString())}</span>
                    <span>Duration: {workout.duration_seconds ? formatDuration(workout.duration_seconds) : '--'}</span>
                    <span>{workout.sets_performed} sets</span>
                    <span>{workout.total_weight_lifted?.toLocaleString()} lbs</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Rating */}
                  {workout.rating ? (
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${i < (workout.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                        >
                          ⭐
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm" data-testid="rating-not-available">
                      No rating
                    </div>
                  )}

                  {/* Action Buttons */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEdit(workout)
                    }}
                    data-testid={`edit-workout-${workout.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(workout)
                    }}
                    data-testid={`delete-workout-${workout.id}`}
                    className="text-red-600 hover:text-red-800 text-sm px-2 py-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedWorkout === workout.id && (
              <div className="border-t p-4 bg-gray-50" data-testid={`workout-details-${workout.id}`}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-600">Duration</div>
                    <div className="font-semibold">{formatDuration(workout.duration_seconds)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Sets</div>
                    <div className="font-semibold">{workout.sets_performed} sets</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total Weight</div>
                    <div className="font-semibold">{workout.total_weight_lifted?.toLocaleString()} lbs</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Type</div>
                    <div className="font-semibold capitalize">{workout.workout_type}</div>
                  </div>
                </div>

                {workout.notes && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Notes</div>
                    <div className="text-sm bg-white p-3 rounded border">
                      {workout.notes}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit Modal - Placeholder */}
      {editingWorkout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Edit Workout</h3>
            <p className="text-gray-600 mb-4">
              Workout editing is not yet implemented.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setEditingWorkout(null)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full" data-testid="delete-confirmation-dialog">
            <h3 className="text-lg font-semibold mb-4">Delete Workout</h3>
            <p className="text-gray-600 mb-4">
              This action cannot be undone. Type the workout name to confirm:
            </p>
            <div className="mb-4">
              <div className="font-medium mb-2">{deleteConfirmation.name}</div>
              <input
                type="text"
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                data-testid="delete-confirmation-input"
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Type workout name here"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteConfirmationInput !== deleteConfirmation.name}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                DELETE WORKOUT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}