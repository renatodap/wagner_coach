// Test: Progress Management Flow
// Following TDD Step 4: Failing Tests Implementation

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockWorkouts, mockWorkoutCompletions, mockWorkoutStats } from '../mocks/workout-data'

// Components that should exist but don't yet (will cause tests to fail)
import ProgressDashboard from '@/app/progress/ProgressDashboard'
import WorkoutHistoryView from '@/app/components/WorkoutHistoryView'
import StatsDashboard from '@/app/components/StatsDashboard'
import WorkoutEditor from '@/app/components/WorkoutEditor'

describe('Progress Management Flow', () => {
  const mockUserId = 'test-user-id'
  const mockOnEdit = jest.fn()
  const mockOnDelete = jest.fn()
  const mockOnSave = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Progress Dashboard', () => {
    test('displays overall workout statistics', () => {
      render(
        <ProgressDashboard
          stats={mockWorkoutStats}
          recentWorkouts={mockWorkoutCompletions}
          userId={mockUserId}
        />
      )

      // Should show key stats
      expect(screen.getByTestId('total-completed')).toHaveTextContent('15')
      expect(screen.getByTestId('current-streak')).toHaveTextContent('3')
      expect(screen.getByTestId('total-duration')).toHaveTextContent('11.25 hours')
      expect(screen.getByTestId('average-duration')).toHaveTextContent('45 min')
      expect(screen.getByTestId('total-weight')).toHaveTextContent('125,000 lbs')
    })

    test('shows weekly workout frequency chart', () => {
      render(
        <ProgressDashboard
          stats={mockWorkoutStats}
          recentWorkouts={mockWorkoutCompletions}
          userId={mockUserId}
        />
      )

      expect(screen.getByTestId('frequency-chart')).toBeInTheDocument()
      expect(screen.getByText('Weekly Frequency')).toBeInTheDocument()
    })

    test('displays recent workout completions', () => {
      render(
        <ProgressDashboard
          stats={mockWorkoutStats}
          recentWorkouts={mockWorkoutCompletions.slice(0, 5)}
          userId={mockUserId}
        />
      )

      // Should show recent workouts
      expect(screen.getByText('WAGNER PUSH DAY')).toBeInTheDocument()
      expect(screen.getByText('WAGNER PULL DAY')).toBeInTheDocument()
      expect(screen.getByTestId('workout-rating-4')).toBeInTheDocument()
      expect(screen.getByTestId('workout-rating-5')).toBeInTheDocument()
    })

    test('shows personal records section', () => {
      render(
        <ProgressDashboard
          stats={mockWorkoutStats}
          recentWorkouts={mockWorkoutCompletions}
          userId={mockUserId}
        />
      )

      expect(screen.getByTestId('personal-records')).toBeInTheDocument()
      expect(screen.getByText('Personal Records')).toBeInTheDocument()
    })

    test('handles empty progress state', () => {
      const emptyStats = {
        totalCompleted: 0,
        currentStreak: 0,
        totalDuration: 0,
        averageDuration: 0,
        totalWeightLifted: 0,
        favoriteWorkoutType: null
      }

      render(
        <ProgressDashboard
          stats={emptyStats}
          recentWorkouts={[]}
          userId={mockUserId}
        />
      )

      expect(screen.getByTestId('empty-progress-state')).toBeInTheDocument()
      expect(screen.getByText('Start your first workout to track progress!')).toBeInTheDocument()
    })
  })

  describe('Workout History View', () => {
    test('displays workout history in chronological order', () => {
      render(
        <WorkoutHistoryView
          workouts={mockWorkoutCompletions}
          userId={mockUserId}
        />
      )

      const workoutItems = screen.getAllByTestId(/workout-history-item-/)
      expect(workoutItems).toHaveLength(2)

      // Should be in reverse chronological order (newest first)
      expect(workoutItems[0]).toHaveTextContent('WAGNER PUSH DAY')
      expect(workoutItems[1]).toHaveTextContent('WAGNER PULL DAY')
    })

    test('allows filtering by workout type', async () => {
      const user = userEvent.setup()

      render(
        <WorkoutHistoryView
          workouts={mockWorkoutCompletions}
          userId={mockUserId}
        />
      )

      const filterSelect = screen.getByTestId('workout-type-filter')
      await user.selectOptions(filterSelect, 'push')

      // Should only show push workouts
      expect(screen.getByText('WAGNER PUSH DAY')).toBeInTheDocument()
      expect(screen.queryByText('WAGNER PULL DAY')).not.toBeInTheDocument()
    })

    test('allows filtering by date range', async () => {
      const user = userEvent.setup()

      render(
        <WorkoutHistoryView
          workouts={mockWorkoutCompletions}
          userId={mockUserId}
        />
      )

      const dateFilter = screen.getByTestId('date-range-filter')
      await user.selectOptions(dateFilter, 'last-7-days')

      // Should filter based on date range
      expect(screen.getByTestId('filtered-results')).toBeInTheDocument()
    })

    test('shows workout details on item click', async () => {
      const user = userEvent.setup()

      render(
        <WorkoutHistoryView
          workouts={mockWorkoutCompletions}
          userId={mockUserId}
        />
      )

      const firstWorkout = screen.getByTestId('workout-history-item-1')
      await user.click(firstWorkout)

      // Should expand details
      expect(screen.getByTestId('workout-details-1')).toBeInTheDocument()
      expect(screen.getByText('45 minutes')).toBeInTheDocument()
      expect(screen.getByText('10 sets')).toBeInTheDocument()
      expect(screen.getByText('5,250 lbs')).toBeInTheDocument()
    })

    test('allows searching workouts by name', async () => {
      const user = userEvent.setup()

      render(
        <WorkoutHistoryView
          workouts={mockWorkoutCompletions}
          userId={mockUserId}
        />
      )

      const searchInput = screen.getByTestId('workout-search')
      await user.type(searchInput, 'PUSH')

      expect(screen.getByText('WAGNER PUSH DAY')).toBeInTheDocument()
      expect(screen.queryByText('WAGNER PULL DAY')).not.toBeInTheDocument()
    })
  })

  describe('Workout Editing', () => {
    test('opens edit modal for workout modification', async () => {
      const user = userEvent.setup()

      render(
        <WorkoutHistoryView
          workouts={mockWorkoutCompletions}
          userId={mockUserId}
          onEdit={mockOnEdit}
        />
      )

      const editButton = screen.getByTestId('edit-workout-1')
      await user.click(editButton)

      expect(screen.getByTestId('workout-editor-modal')).toBeInTheDocument()
    })

    test('allows editing workout notes', async () => {
      const user = userEvent.setup()

      render(
        <WorkoutEditor
          workout={mockWorkoutCompletions[0]}
          isOpen={true}
          onSave={mockOnSave}
          onCancel={jest.fn()}
        />
      )

      const notesTextarea = screen.getByTestId('workout-notes-editor')
      await user.clear(notesTextarea)
      await user.type(notesTextarea, 'Updated notes: Great session with perfect form')

      const saveButton = screen.getByText('SAVE CHANGES')
      await user.click(saveButton)

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: 'Updated notes: Great session with perfect form'
        })
      )
    })

    test('allows editing workout rating', async () => {
      const user = userEvent.setup()

      render(
        <WorkoutEditor
          workout={mockWorkoutCompletions[0]}
          isOpen={true}
          onSave={mockOnSave}
          onCancel={jest.fn()}
        />
      )

      const fifthStar = screen.getByTestId('edit-star-5')
      await user.click(fifthStar)

      const saveButton = screen.getByText('SAVE CHANGES')
      await user.click(saveButton)

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          rating: 5
        })
      )
    })

    test('prevents saving invalid edits', async () => {
      const user = userEvent.setup()

      render(
        <WorkoutEditor
          workout={mockWorkoutCompletions[0]}
          isOpen={true}
          onSave={mockOnSave}
          onCancel={jest.fn()}
        />
      )

      // Try to set invalid rating
      const ratingInput = screen.getByTestId('manual-rating-input')
      await user.clear(ratingInput)
      await user.type(ratingInput, '6') // Invalid: ratings are 1-5

      const saveButton = screen.getByText('SAVE CHANGES')
      expect(saveButton).toBeDisabled()
      expect(screen.getByTestId('rating-error')).toHaveTextContent('Rating must be between 1-5')
    })

    test('shows edit history for workout', () => {
      const workoutWithEdits = {
        ...mockWorkoutCompletions[0],
        edit_history: [
          {
            edited_at: new Date('2025-01-24T12:00:00Z'),
            field: 'notes',
            old_value: 'Great workout',
            new_value: 'Great workout, felt strong on bench press'
          }
        ]
      }

      render(
        <WorkoutEditor
          workout={workoutWithEdits}
          isOpen={true}
          onSave={mockOnSave}
          onCancel={jest.fn()}
        />
      )

      expect(screen.getByTestId('edit-history')).toBeInTheDocument()
      expect(screen.getByText('Modified notes')).toBeInTheDocument()
    })
  })

  describe('Workout Deletion', () => {
    test('shows delete confirmation dialog', async () => {
      const user = userEvent.setup()

      render(
        <WorkoutHistoryView
          workouts={mockWorkoutCompletions}
          userId={mockUserId}
          onDelete={mockOnDelete}
        />
      )

      const deleteButton = screen.getByTestId('delete-workout-1')
      await user.click(deleteButton)

      expect(screen.getByTestId('delete-confirmation-dialog')).toBeInTheDocument()
      expect(screen.getByText('This action cannot be undone')).toBeInTheDocument()
    })

    test('confirms deletion with workout name', async () => {
      const user = userEvent.setup()

      render(
        <WorkoutHistoryView
          workouts={mockWorkoutCompletions}
          userId={mockUserId}
          onDelete={mockOnDelete}
        />
      )

      const deleteButton = screen.getByTestId('delete-workout-1')
      await user.click(deleteButton)

      const confirmInput = screen.getByTestId('delete-confirmation-input')
      await user.type(confirmInput, 'WAGNER PUSH DAY')

      const confirmDeleteButton = screen.getByText('DELETE WORKOUT')
      expect(confirmDeleteButton).toBeEnabled()

      await user.click(confirmDeleteButton)

      expect(mockOnDelete).toHaveBeenCalledWith(1)
    })

    test('prevents deletion without exact name match', async () => {
      const user = userEvent.setup()

      render(
        <WorkoutHistoryView
          workouts={mockWorkoutCompletions}
          userId={mockUserId}
          onDelete={mockOnDelete}
        />
      )

      const deleteButton = screen.getByTestId('delete-workout-1')
      await user.click(deleteButton)

      const confirmInput = screen.getByTestId('delete-confirmation-input')
      await user.type(confirmInput, 'wrong name')

      const confirmDeleteButton = screen.getByText('DELETE WORKOUT')
      expect(confirmDeleteButton).toBeDisabled()
    })
  })

  describe('Statistics Dashboard', () => {
    test('displays strength progression charts', () => {
      render(
        <StatsDashboard
          stats={mockWorkoutStats}
          workouts={mockWorkoutCompletions}
          userId={mockUserId}
        />
      )

      expect(screen.getByTestId('strength-progression-chart')).toBeInTheDocument()
      expect(screen.getByText('Strength Progression')).toBeInTheDocument()
    })

    test('shows volume progression over time', () => {
      render(
        <StatsDashboard
          stats={mockWorkoutStats}
          workouts={mockWorkoutCompletions}
          userId={mockUserId}
        />
      )

      expect(screen.getByTestId('volume-progression-chart')).toBeInTheDocument()
      expect(screen.getByText('Weekly Volume')).toBeInTheDocument()
    })

    test('displays workout consistency heatmap', () => {
      render(
        <StatsDashboard
          stats={mockWorkoutStats}
          workouts={mockWorkoutCompletions}
          userId={mockUserId}
        />
      )

      expect(screen.getByTestId('consistency-heatmap')).toBeInTheDocument()
      expect(screen.getByText('Workout Consistency')).toBeInTheDocument()
    })

    test('shows favorite workout type analysis', () => {
      render(
        <StatsDashboard
          stats={mockWorkoutStats}
          workouts={mockWorkoutCompletions}
          userId={mockUserId}
        />
      )

      expect(screen.getByTestId('workout-type-breakdown')).toBeInTheDocument()
      expect(screen.getByText('Favorite Type: Push')).toBeInTheDocument()
    })

    test('calculates and shows personal bests', () => {
      render(
        <StatsDashboard
          stats={mockWorkoutStats}
          workouts={mockWorkoutCompletions}
          userId={mockUserId}
        />
      )

      expect(screen.getByTestId('personal-bests')).toBeInTheDocument()
      expect(screen.getByText('Personal Bests')).toBeInTheDocument()
    })
  })

  describe('Data Export', () => {
    test('allows exporting workout history as CSV', async () => {
      const user = userEvent.setup()

      render(
        <WorkoutHistoryView
          workouts={mockWorkoutCompletions}
          userId={mockUserId}
        />
      )

      const exportButton = screen.getByTestId('export-csv-button')
      await user.click(exportButton)

      // Should trigger download
      expect(screen.getByTestId('export-success')).toHaveTextContent('Export started')
    })

    test('allows exporting statistics as JSON', async () => {
      const user = userEvent.setup()

      render(
        <StatsDashboard
          stats={mockWorkoutStats}
          workouts={mockWorkoutCompletions}
          userId={mockUserId}
        />
      )

      const exportStatsButton = screen.getByTestId('export-stats-button')
      await user.click(exportStatsButton)

      expect(screen.getByTestId('export-format-dialog')).toBeInTheDocument()

      const jsonOption = screen.getByTestId('export-json')
      await user.click(jsonOption)

      const downloadButton = screen.getByText('DOWNLOAD')
      await user.click(downloadButton)

      expect(screen.getByTestId('download-started')).toBeInTheDocument()
    })

    test('handles export errors gracefully', async () => {
      const user = userEvent.setup()

      // Mock export function to fail
      jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Export failed'))

      render(
        <WorkoutHistoryView
          workouts={mockWorkoutCompletions}
          userId={mockUserId}
        />
      )

      const exportButton = screen.getByTestId('export-csv-button')
      await user.click(exportButton)

      await waitFor(() => {
        expect(screen.getByTestId('export-error')).toHaveTextContent('Export failed')
      })
    })
  })

  describe('Progress Insights', () => {
    test('shows workout frequency insights', () => {
      render(
        <ProgressDashboard
          stats={mockWorkoutStats}
          recentWorkouts={mockWorkoutCompletions}
          userId={mockUserId}
        />
      )

      expect(screen.getByTestId('frequency-insights')).toBeInTheDocument()
      expect(screen.getByText('Workout Insights')).toBeInTheDocument()
    })

    test('provides motivational streaks information', () => {
      const streakStats = {
        ...mockWorkoutStats,
        currentStreak: 7,
        longestStreak: 12
      }

      render(
        <ProgressDashboard
          stats={streakStats}
          recentWorkouts={mockWorkoutCompletions}
          userId={mockUserId}
        />
      )

      expect(screen.getByTestId('streak-motivation')).toBeInTheDocument()
      expect(screen.getByText('7 days strong!')).toBeInTheDocument()
      expect(screen.getByText('Personal best: 12 days')).toBeInTheDocument()
    })

    test('shows improvement suggestions', () => {
      render(
        <ProgressDashboard
          stats={mockWorkoutStats}
          recentWorkouts={mockWorkoutCompletions}
          userId={mockUserId}
        />
      )

      expect(screen.getByTestId('improvement-suggestions')).toBeInTheDocument()
      expect(screen.getByText('Suggestions')).toBeInTheDocument()
    })

    test('identifies workout pattern trends', () => {
      render(
        <StatsDashboard
          stats={mockWorkoutStats}
          workouts={mockWorkoutCompletions}
          userId={mockUserId}
        />
      )

      expect(screen.getByTestId('pattern-analysis')).toBeInTheDocument()
      expect(screen.getByText('Your Patterns')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    test('handles missing workout data gracefully', () => {
      render(
        <WorkoutHistoryView
          workouts={[]}
          userId={mockUserId}
        />
      )

      expect(screen.getByTestId('no-workouts-message')).toHaveTextContent('No workouts yet')
      expect(screen.getByText('Start your first workout!')).toBeInTheDocument()
    })

    test('handles corrupt workout data', () => {
      const corruptWorkouts = [
        {
          ...mockWorkoutCompletions[0],
          duration_seconds: null,
          rating: undefined
        }
      ]

      render(
        <WorkoutHistoryView
          workouts={corruptWorkouts}
          userId={mockUserId}
        />
      )

      // Should still display with fallback values
      expect(screen.getByTestId('workout-history-item-1')).toBeInTheDocument()
      expect(screen.getByText('Duration: --')).toBeInTheDocument()
      expect(screen.getByTestId('rating-not-available')).toBeInTheDocument()
    })

    test('handles edit save failures', async () => {
      const user = userEvent.setup()
      const mockOnSaveError = jest.fn().mockRejectedValue(new Error('Save failed'))

      render(
        <WorkoutEditor
          workout={mockWorkoutCompletions[0]}
          isOpen={true}
          onSave={mockOnSaveError}
          onCancel={jest.fn()}
        />
      )

      const saveButton = screen.getByText('SAVE CHANGES')
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByTestId('save-error')).toHaveTextContent('Failed to save changes')
      })

      expect(screen.getByText('RETRY')).toBeInTheDocument()
    })
  })

  describe('Performance Tests', () => {
    test('progress dashboard loads within 500ms', () => {
      const startTime = performance.now()

      render(
        <ProgressDashboard
          stats={mockWorkoutStats}
          recentWorkouts={mockWorkoutCompletions}
          userId={mockUserId}
        />
      )

      expect(screen.getByTestId('total-completed')).toBeInTheDocument()

      const loadTime = performance.now() - startTime
      expect(loadTime).toBeLessThan(500)
    })

    test('workout history filters respond within 200ms', async () => {
      const user = userEvent.setup()

      render(
        <WorkoutHistoryView
          workouts={mockWorkoutCompletions}
          userId={mockUserId}
        />
      )

      const startTime = performance.now()

      const filterSelect = screen.getByTestId('workout-type-filter')
      await user.selectOptions(filterSelect, 'push')

      const filterTime = performance.now() - startTime
      expect(filterTime).toBeLessThan(200)
    })
  })

  describe('Accessibility', () => {
    test('progress charts have proper ARIA labels', () => {
      render(
        <StatsDashboard
          stats={mockWorkoutStats}
          workouts={mockWorkoutCompletions}
          userId={mockUserId}
        />
      )

      const chart = screen.getByTestId('strength-progression-chart')
      expect(chart).toHaveAttribute('aria-label', 'Strength progression over time')
      expect(chart).toHaveAttribute('role', 'img')
    })

    test('workout history supports keyboard navigation', async () => {
      const user = userEvent.setup()

      render(
        <WorkoutHistoryView
          workouts={mockWorkoutCompletions}
          userId={mockUserId}
        />
      )

      // Should be able to tab through workout items
      await user.tab()
      expect(screen.getByTestId('workout-history-item-1')).toHaveFocus()

      await user.tab()
      expect(screen.getByTestId('workout-history-item-2')).toHaveFocus()
    })

    test('delete confirmation has proper focus management', async () => {
      const user = userEvent.setup()

      render(
        <WorkoutHistoryView
          workouts={mockWorkoutCompletions}
          userId={mockUserId}
          onDelete={mockOnDelete}
        />
      )

      const deleteButton = screen.getByTestId('delete-workout-1')
      await user.click(deleteButton)

      // Focus should move to confirmation input
      expect(screen.getByTestId('delete-confirmation-input')).toHaveFocus()
    })
  })
})