// Test: Workout Completion Flow
// Following TDD Step 4: Failing Tests Implementation

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockActiveSession, mockSetPerformances, mockWorkoutCompletions } from '../mocks/workout-data'

// Components that should exist but don't yet (will cause tests to fail)
import ActiveWorkoutClient from '@/app/workout/active/[id]/ActiveWorkoutClient'
import WorkoutCompletionModal from '@/app/components/WorkoutCompletionModal'
import WorkoutSummary from '@/app/components/WorkoutSummary'

describe('Workout Completion Flow', () => {
  const mockUserId = 'test-user-id'
  const mockOnComplete = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Finish Workout Path', () => {
    test('shows finish button when all exercises completed', () => {
      const completedSession = {
        ...mockActiveSession,
        current_exercise_index: 2, // Last exercise
        exercises: mockActiveSession.exercises.map(ex => ({
          ...ex,
          sets_completed: ex.sets_planned
        }))
      }

      render(
        <ActiveWorkoutClient
          session={completedSession}
          userId={mockUserId}
        />
      )

      expect(screen.getByTestId('finish-workout-button')).toBeInTheDocument()
      expect(screen.getByText('FINISH WORKOUT')).toBeEnabled()
    })

    test('allows early finish with partial completion', () => {
      const partialSession = {
        ...mockActiveSession,
        current_exercise_index: 1,
        exercises: mockActiveSession.exercises.map((ex, index) => ({
          ...ex,
          sets_completed: index === 0 ? ex.sets_planned : 1 // First exercise done, second partial
        }))
      }

      render(
        <ActiveWorkoutClient
          session={partialSession}
          userId={mockUserId}
        />
      )

      expect(screen.getByTestId('finish-early-button')).toBeInTheDocument()
      expect(screen.getByText('FINISH EARLY')).toBeEnabled()
    })

    test('opens completion modal when finish button clicked', async () => {
      const user = userEvent.setup()

      const completedSession = {
        ...mockActiveSession,
        exercises: mockActiveSession.exercises.map(ex => ({
          ...ex,
          sets_completed: ex.sets_planned
        }))
      }

      render(
        <ActiveWorkoutClient
          session={completedSession}
          userId={mockUserId}
        />
      )

      const finishButton = screen.getByTestId('finish-workout-button')
      await user.click(finishButton)

      expect(screen.getByTestId('workout-completion-modal')).toBeInTheDocument()
    })

    test('completion modal shows workout summary', () => {
      const completedSession = {
        ...mockActiveSession,
        elapsed_time_seconds: 2700, // 45 minutes
        set_performances: mockSetPerformances
      }

      render(
        <WorkoutCompletionModal
          session={completedSession}
          isOpen={true}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      )

      // Should show workout stats
      expect(screen.getByTestId('workout-duration')).toHaveTextContent('45:00')
      expect(screen.getByTestId('total-sets')).toHaveTextContent('2 sets')
      expect(screen.getByTestId('total-volume')).toHaveTextContent('2,775 lbs')
      expect(screen.getByTestId('workout-name')).toHaveTextContent('WAGNER PUSH DAY')
    })

    test('allows rating workout 1-5 stars', async () => {
      const user = userEvent.setup()

      render(
        <WorkoutCompletionModal
          session={mockActiveSession}
          isOpen={true}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      )

      const starRating = screen.getByTestId('workout-rating')
      expect(starRating).toBeInTheDocument()

      // Click 4th star
      const fourthStar = screen.getByTestId('star-4')
      await user.click(fourthStar)

      expect(fourthStar).toHaveClass('filled')
      expect(screen.getByTestId('star-5')).not.toHaveClass('filled')
    })

    test('allows adding workout notes', async () => {
      const user = userEvent.setup()

      render(
        <WorkoutCompletionModal
          session={mockActiveSession}
          isOpen={true}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      )

      const notesTextarea = screen.getByTestId('workout-notes')
      await user.type(notesTextarea, 'Great workout! Felt strong on bench press. Increase weight next time.')

      expect(notesTextarea).toHaveValue('Great workout! Felt strong on bench press. Increase weight next time.')
    })

    test('saves workout completion with all data', async () => {
      const user = userEvent.setup()

      render(
        <WorkoutCompletionModal
          session={mockActiveSession}
          isOpen={true}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      )

      // Rate workout
      const fourthStar = screen.getByTestId('star-4')
      await user.click(fourthStar)

      // Add notes
      const notesTextarea = screen.getByTestId('workout-notes')
      await user.type(notesTextarea, 'Solid workout, good progress')

      // Complete workout
      const completeButton = screen.getByText('COMPLETE WORKOUT')
      await user.click(completeButton)

      expect(mockOnComplete).toHaveBeenCalledWith({
        rating: 4,
        notes: 'Solid workout, good progress',
        duration_seconds: expect.any(Number),
        sets_performed: expect.any(Number),
        total_weight_lifted: expect.any(Number)
      })
    })

    test('shows loading state during save', () => {
      render(
        <WorkoutCompletionModal
          session={mockActiveSession}
          isOpen={true}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          loading={true}
        />
      )

      const completeButton = screen.getByText('COMPLETE WORKOUT')
      expect(completeButton).toBeDisabled()
      expect(screen.getByTestId('completion-loading')).toBeInTheDocument()
    })
  })

  describe('Cancel Workout Path', () => {
    test('shows cancel button throughout workout', () => {
      render(
        <ActiveWorkoutClient
          session={mockActiveSession}
          userId={mockUserId}
        />
      )

      expect(screen.getByTestId('cancel-workout-button')).toBeInTheDocument()
      expect(screen.getByText('CANCEL')).toBeEnabled()
    })

    test('shows confirmation dialog on cancel', async () => {
      const user = userEvent.setup()

      render(
        <ActiveWorkoutClient
          session={mockActiveSession}
          userId={mockUserId}
        />
      )

      const cancelButton = screen.getByTestId('cancel-workout-button')
      await user.click(cancelButton)

      expect(screen.getByTestId('cancel-confirmation-dialog')).toBeInTheDocument()
      expect(screen.getByText('Are you sure you want to cancel this workout?')).toBeInTheDocument()
    })

    test('preserves session data on cancel confirmation', async () => {
      const user = userEvent.setup()

      render(
        <ActiveWorkoutClient
          session={mockActiveSession}
          userId={mockUserId}
        />
      )

      const cancelButton = screen.getByTestId('cancel-workout-button')
      await user.click(cancelButton)

      const confirmCancelButton = screen.getByText('YES, CANCEL WORKOUT')
      await user.click(confirmCancelButton)

      // Should save partial progress
      expect(screen.getByTestId('saving-partial-progress')).toBeInTheDocument()
    })

    test('returns to dashboard on cancel confirm', async () => {
      const user = userEvent.setup()
      const mockPush = jest.fn()

      // Mock router
      jest.mocked(require('next/navigation').useRouter).mockReturnValue({
        push: mockPush,
        replace: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
        prefetch: jest.fn(),
      })

      render(
        <ActiveWorkoutClient
          session={mockActiveSession}
          userId={mockUserId}
        />
      )

      const cancelButton = screen.getByTestId('cancel-workout-button')
      await user.click(cancelButton)

      const confirmCancelButton = screen.getByText('YES, CANCEL WORKOUT')
      await user.click(confirmCancelButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    test('allows resume from cancel dialog', async () => {
      const user = userEvent.setup()

      render(
        <ActiveWorkoutClient
          session={mockActiveSession}
          userId={mockUserId}
        />
      )

      const cancelButton = screen.getByTestId('cancel-workout-button')
      await user.click(cancelButton)

      const resumeButton = screen.getByText('KEEP GOING')
      await user.click(resumeButton)

      // Dialog should close, workout should continue
      expect(screen.queryByTestId('cancel-confirmation-dialog')).not.toBeInTheDocument()
      expect(screen.getByTestId('active-workout')).toBeInTheDocument()
    })
  })

  describe('Partial Workout Handling', () => {
    test('calculates completion percentage', () => {
      const partialSession = {
        ...mockActiveSession,
        exercises: mockActiveSession.exercises.map((ex, index) => ({
          ...ex,
          sets_completed: index === 0 ? ex.sets_planned : Math.floor(ex.sets_planned / 2)
        }))
      }

      render(
        <WorkoutSummary session={partialSession} />
      )

      // Should show partial completion stats
      expect(screen.getByTestId('completion-percentage')).toHaveTextContent('60%') // Approximate
      expect(screen.getByTestId('completion-status')).toHaveTextContent('Partial workout')
    })

    test('saves partial workout as incomplete', async () => {
      const user = userEvent.setup()

      const partialSession = {
        ...mockActiveSession,
        exercises: mockActiveSession.exercises.map(ex => ({
          ...ex,
          sets_completed: 1 // Only 1 set completed per exercise
        }))
      }

      render(
        <WorkoutCompletionModal
          session={partialSession}
          isOpen={true}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      )

      const completeButton = screen.getByText('SAVE PARTIAL WORKOUT')
      await user.click(completeButton)

      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          completed: false,
          completion_percentage: expect.any(Number)
        })
      )
    })

    test('shows encouragement for partial workouts', () => {
      const partialSession = {
        ...mockActiveSession,
        exercises: mockActiveSession.exercises.map(ex => ({
          ...ex,
          sets_completed: Math.floor(ex.sets_planned / 2)
        }))
      }

      render(
        <WorkoutCompletionModal
          session={partialSession}
          isOpen={true}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByTestId('encouragement-message')).toHaveTextContent('Something is better than nothing!')
    })
  })

  describe('Post-Workout Actions', () => {
    test('offers option to start another workout', () => {
      render(
        <WorkoutCompletionModal
          session={mockActiveSession}
          isOpen={true}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          showPostActions={true}
        />
      )

      expect(screen.getByTestId('start-another-workout')).toBeInTheDocument()
      expect(screen.getByText('START ANOTHER')).toBeEnabled()
    })

    test('offers option to view workout history', () => {
      render(
        <WorkoutCompletionModal
          session={mockActiveSession}
          isOpen={true}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          showPostActions={true}
        />
      )

      expect(screen.getByTestId('view-history')).toBeInTheDocument()
      expect(screen.getByText('VIEW HISTORY')).toBeEnabled()
    })

    test('shows share workout option', () => {
      render(
        <WorkoutCompletionModal
          session={mockActiveSession}
          isOpen={true}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          showPostActions={true}
        />
      )

      expect(screen.getByTestId('share-workout')).toBeInTheDocument()
      expect(screen.getByText('SHARE')).toBeEnabled()
    })
  })

  describe('Workout Statistics Display', () => {
    test('displays personal records if achieved', () => {
      const prSession = {
        ...mockActiveSession,
        personal_records: [
          {
            exercise_name: 'Bench Press',
            record_type: 'max_weight',
            old_value: 180,
            new_value: 185
          }
        ]
      }

      render(
        <WorkoutSummary session={prSession} />
      )

      expect(screen.getByTestId('personal-records')).toBeInTheDocument()
      expect(screen.getByText('New PR!')).toBeInTheDocument()
      expect(screen.getByText('Bench Press: 185 lbs (+5)')).toBeInTheDocument()
    })

    test('shows volume progression from last workout', () => {
      const progressSession = {
        ...mockActiveSession,
        volume_progression: {
          current: 5250,
          previous: 4800,
          change: 450
        }
      }

      render(
        <WorkoutSummary session={progressSession} />
      )

      expect(screen.getByTestId('volume-progression')).toHaveTextContent('+450 lbs')
      expect(screen.getByTestId('progression-indicator')).toHaveClass('text-green-600')
    })

    test('calculates and displays workout efficiency', () => {
      const efficientSession = {
        ...mockActiveSession,
        elapsed_time_seconds: 2700, // 45 minutes
        total_pause_duration_seconds: 300, // 5 minutes paused
        estimated_duration_minutes: 45
      }

      render(
        <WorkoutSummary session={efficientSession} />
      )

      // Should show actual vs estimated time
      expect(screen.getByTestId('workout-efficiency')).toHaveTextContent('On target')
      expect(screen.getByTestId('active-time')).toHaveTextContent('40:00') // 45 - 5 minutes pause
    })
  })

  describe('Error Handling', () => {
    test('handles save errors gracefully', async () => {
      const user = userEvent.setup()
      const mockOnCompleteError = jest.fn().mockRejectedValue(new Error('Save failed'))

      render(
        <WorkoutCompletionModal
          session={mockActiveSession}
          isOpen={true}
          onComplete={mockOnCompleteError}
          onCancel={mockOnCancel}
        />
      )

      const completeButton = screen.getByText('COMPLETE WORKOUT')
      await user.click(completeButton)

      await waitFor(() => {
        expect(screen.getByTestId('save-error')).toHaveTextContent('Failed to save workout')
      })

      // Should offer retry option
      expect(screen.getByText('RETRY')).toBeInTheDocument()
    })

    test('handles missing session data gracefully', () => {
      const incompleteSession = {
        ...mockActiveSession,
        exercises: []
      }

      render(
        <WorkoutCompletionModal
          session={incompleteSession}
          isOpen={true}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      )

      // Should show minimal completion interface
      expect(screen.getByTestId('minimal-completion')).toBeInTheDocument()
      expect(screen.getByText('No exercises completed')).toBeInTheDocument()
    })

    test('prevents completion without required data', () => {
      const invalidSession = {
        ...mockActiveSession,
        elapsed_time_seconds: 0
      }

      render(
        <WorkoutCompletionModal
          session={invalidSession}
          isOpen={true}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      )

      const completeButton = screen.getByText('COMPLETE WORKOUT')
      expect(completeButton).toBeDisabled()
      expect(screen.getByTestId('invalid-session-warning')).toBeInTheDocument()
    })
  })

  describe('Performance Tests', () => {
    test('completion modal opens within 200ms', async () => {
      const user = userEvent.setup()

      render(
        <ActiveWorkoutClient
          session={mockActiveSession}
          userId={mockUserId}
        />
      )

      const startTime = performance.now()

      const finishButton = screen.getByTestId('finish-early-button')
      await user.click(finishButton)

      await waitFor(() => {
        expect(screen.getByTestId('workout-completion-modal')).toBeInTheDocument()
      })

      const openTime = performance.now() - startTime
      expect(openTime).toBeLessThan(200)
    })

    test('workout save completes within 1 second', async () => {
      const user = userEvent.setup()

      render(
        <WorkoutCompletionModal
          session={mockActiveSession}
          isOpen={true}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      )

      const startTime = performance.now()

      const completeButton = screen.getByText('COMPLETE WORKOUT')
      await user.click(completeButton)

      const saveTime = performance.now() - startTime
      expect(saveTime).toBeLessThan(1000)
    })
  })

  describe('Accessibility', () => {
    test('completion modal has proper focus management', async () => {
      const user = userEvent.setup()

      render(
        <WorkoutCompletionModal
          session={mockActiveSession}
          isOpen={true}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      )

      // Focus should be on first interactive element
      expect(screen.getByTestId('star-1')).toHaveFocus()
    })

    test('star rating supports keyboard navigation', async () => {
      const user = userEvent.setup()

      render(
        <WorkoutCompletionModal
          session={mockActiveSession}
          isOpen={true}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      )

      // Should be able to use arrow keys
      await user.keyboard('[ArrowRight][ArrowRight][ArrowRight]') // Move to 4th star
      await user.keyboard('[Space]') // Select star

      expect(screen.getByTestId('star-4')).toHaveClass('filled')
    })

    test('completion dialog has proper ARIA attributes', () => {
      render(
        <WorkoutCompletionModal
          session={mockActiveSession}
          isOpen={true}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      )

      const modal = screen.getByTestId('workout-completion-modal')
      expect(modal).toHaveAttribute('role', 'dialog')
      expect(modal).toHaveAttribute('aria-labelledby', 'completion-title')
      expect(modal).toHaveAttribute('aria-describedby', 'completion-description')
    })
  })
})