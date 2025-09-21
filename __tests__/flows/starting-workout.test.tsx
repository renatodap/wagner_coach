// Test: Starting a Workout Flow
// Following TDD Step 4: Failing Tests Implementation

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockWorkouts, mockExercises } from '../mocks/workout-data'

// Components that should exist but don't yet (will cause tests to fail)
import DashboardClient from '@/app/dashboard/DashboardClient'
import WorkoutModal from '@/app/components/WorkoutModal'

describe('Starting a Workout Flow', () => {
  const mockUserId = 'test-user-id'
  const mockOnStart = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Dashboard Component', () => {
    test('renders workout list with proper data', () => {
      render(
        <DashboardClient
          initialWorkouts={mockWorkouts}
          userId={mockUserId}
        />
      )

      // Should display all workouts
      expect(screen.getByText('WAGNER PUSH DAY')).toBeInTheDocument()
      expect(screen.getByText('WAGNER PULL DAY')).toBeInTheDocument()
      expect(screen.getByText('BEGINNER BASICS')).toBeInTheDocument()

      // Should show workout details
      expect(screen.getByText('45 min')).toBeInTheDocument()
      expect(screen.getByText('intermediate')).toBeInTheDocument()
      expect(screen.getByText('push')).toBeInTheDocument()
    })

    test('filters workouts with exercises only', () => {
      const workoutsWithoutExercises = [
        ...mockWorkouts,
        {
          id: 4,
          name: 'EMPTY WORKOUT',
          type: 'full_body' as const,
          goal: 'all' as const,
          difficulty: 'beginner' as const,
          estimated_duration_minutes: 30,
          description: 'No exercises',
          is_favorite: false,
          exercise_count: 0
        }
      ]

      render(
        <DashboardClient
          initialWorkouts={workoutsWithoutExercises}
          userId={mockUserId}
        />
      )

      // Should NOT display workout with 0 exercises
      expect(screen.queryByText('EMPTY WORKOUT')).not.toBeInTheDocument()

      // Should still display workouts with exercises
      expect(screen.getByText('WAGNER PUSH DAY')).toBeInTheDocument()
    })

    test('handles empty workout list state', () => {
      render(
        <DashboardClient
          initialWorkouts={[]}
          userId={mockUserId}
        />
      )

      expect(screen.getByText(/no workouts/i)).toBeInTheDocument()
    })

    test('displays workout cards with correct information', () => {
      render(
        <DashboardClient
          initialWorkouts={mockWorkouts}
          userId={mockUserId}
        />
      )

      const pushDayCard = screen.getByTestId('workout-card-1')
      expect(pushDayCard).toHaveTextContent('WAGNER PUSH DAY')
      expect(pushDayCard).toHaveTextContent('45 min')
      expect(pushDayCard).toHaveTextContent('intermediate')
      expect(pushDayCard).toHaveTextContent('Brutal chest, shoulders, and triceps workout')
    })
  })

  describe('Workout Modal', () => {
    test('opens modal when workout card clicked', async () => {
      const user = userEvent.setup()

      render(
        <DashboardClient
          initialWorkouts={mockWorkouts}
          userId={mockUserId}
        />
      )

      const workoutCard = screen.getByTestId('workout-card-1')
      await user.click(workoutCard)

      // Modal should be visible
      expect(screen.getByTestId('workout-modal')).toBeInTheDocument()
      expect(screen.getByText('WAGNER PUSH DAY')).toBeInTheDocument()
    })

    test('displays exercise list with sets and reps', () => {
      render(
        <WorkoutModal
          workout={mockWorkouts[0]}
          exercises={mockExercises}
          isOpen={true}
          onClose={jest.fn()}
          onStart={mockOnStart}
        />
      )

      // Should show all exercises
      expect(screen.getByText('Bench Press')).toBeInTheDocument()
      expect(screen.getByText('Incline Dumbbell Press')).toBeInTheDocument()
      expect(screen.getByText('Push-ups')).toBeInTheDocument()

      // Should show sets and reps
      expect(screen.getByText('4 sets × 6-8 reps')).toBeInTheDocument()
      expect(screen.getByText('3 sets × 8-10 reps')).toBeInTheDocument()
      expect(screen.getByText('3 sets × 10-15 reps')).toBeInTheDocument()
    })

    test('shows total duration and difficulty', () => {
      render(
        <WorkoutModal
          workout={mockWorkouts[0]}
          exercises={mockExercises}
          isOpen={true}
          onClose={jest.fn()}
          onStart={mockOnStart}
        />
      )

      expect(screen.getByText('45 min')).toBeInTheDocument()
      expect(screen.getByText('intermediate')).toBeInTheDocument()
    })

    test('closes modal on cancel or outside click', async () => {
      const user = userEvent.setup()
      const mockOnClose = jest.fn()

      render(
        <WorkoutModal
          workout={mockWorkouts[0]}
          exercises={mockExercises}
          isOpen={true}
          onClose={mockOnClose}
          onStart={mockOnStart}
        />
      )

      // Click cancel button
      const cancelButton = screen.getByText('CANCEL')
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    test('calls start workout function on START button', async () => {
      const user = userEvent.setup()

      render(
        <WorkoutModal
          workout={mockWorkouts[0]}
          exercises={mockExercises}
          isOpen={true}
          onClose={jest.fn()}
          onStart={mockOnStart}
        />
      )

      const startButton = screen.getByText('START WORKOUT')
      await user.click(startButton)

      expect(mockOnStart).toHaveBeenCalledWith(1) // workout id
    })

    test('shows loading state during start', () => {
      render(
        <WorkoutModal
          workout={mockWorkouts[0]}
          exercises={mockExercises}
          isOpen={true}
          onClose={jest.fn()}
          onStart={mockOnStart}
          loading={true}
        />
      )

      const startButton = screen.getByText('START WORKOUT')
      expect(startButton).toBeDisabled()
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })

  describe('Integration Tests', () => {
    test('workout selection opens modal with correct data', async () => {
      const user = userEvent.setup()

      render(
        <DashboardClient
          initialWorkouts={mockWorkouts}
          userId={mockUserId}
        />
      )

      // Click the first workout
      const workoutCard = screen.getByTestId('workout-card-1')
      await user.click(workoutCard)

      // Modal should open with correct workout data
      await waitFor(() => {
        expect(screen.getByTestId('workout-modal')).toBeInTheDocument()
      })

      expect(screen.getByText('WAGNER PUSH DAY')).toBeInTheDocument()
      expect(screen.getByText('Bench Press')).toBeInTheDocument()
    })

    test('modal start button creates session and redirects', async () => {
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
        <DashboardClient
          initialWorkouts={mockWorkouts}
          userId={mockUserId}
        />
      )

      // Open modal
      const workoutCard = screen.getByTestId('workout-card-1')
      await user.click(workoutCard)

      // Click start
      const startButton = screen.getByText('START WORKOUT')
      await user.click(startButton)

      // Should redirect to active workout page
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/workout/active/1')
      })
    })

    test('modal cancel returns to dashboard state', async () => {
      const user = userEvent.setup()

      render(
        <DashboardClient
          initialWorkouts={mockWorkouts}
          userId={mockUserId}
        />
      )

      // Open modal
      const workoutCard = screen.getByTestId('workout-card-1')
      await user.click(workoutCard)

      // Modal should be open
      expect(screen.getByTestId('workout-modal')).toBeInTheDocument()

      // Cancel modal
      const cancelButton = screen.getByText('CANCEL')
      await user.click(cancelButton)

      // Modal should be closed
      await waitFor(() => {
        expect(screen.queryByTestId('workout-modal')).not.toBeInTheDocument()
      })

      // Should still see dashboard
      expect(screen.getByText('WAGNER PUSH DAY')).toBeInTheDocument()
    })
  })

  describe('Performance Tests', () => {
    test('dashboard loads within acceptable time', async () => {
      const startTime = performance.now()

      render(
        <DashboardClient
          initialWorkouts={mockWorkouts}
          userId={mockUserId}
        />
      )

      // Check that content is rendered
      expect(screen.getByText('WAGNER PUSH DAY')).toBeInTheDocument()

      const loadTime = performance.now() - startTime
      expect(loadTime).toBeLessThan(100) // Should render in under 100ms
    })

    test('modal opens within acceptable time', async () => {
      const user = userEvent.setup()

      render(
        <DashboardClient
          initialWorkouts={mockWorkouts}
          userId={mockUserId}
        />
      )

      const workoutCard = screen.getByTestId('workout-card-1')

      const startTime = performance.now()
      await user.click(workoutCard)

      // Modal should appear quickly
      await waitFor(() => {
        expect(screen.getByTestId('workout-modal')).toBeInTheDocument()
      })

      const openTime = performance.now() - startTime
      expect(openTime).toBeLessThan(50) // Should open in under 50ms
    })
  })

  describe('Error Handling', () => {
    test('handles workout data loading errors gracefully', () => {
      // Mock console.error to avoid noise in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <DashboardClient
          initialWorkouts={[]}
          userId={mockUserId}
        />
      )

      // Should show empty state instead of crashing
      expect(screen.getByText(/no workouts/i)).toBeInTheDocument()

      consoleSpy.mockRestore()
    })

    test('handles missing exercise data gracefully', () => {
      render(
        <WorkoutModal
          workout={mockWorkouts[0]}
          exercises={[]}
          isOpen={true}
          onClose={jest.fn()}
          onStart={mockOnStart}
        />
      )

      // Should show message about no exercises
      expect(screen.getByText(/no exercises/i)).toBeInTheDocument()

      // Start button should be disabled
      const startButton = screen.getByText('START WORKOUT')
      expect(startButton).toBeDisabled()
    })
  })
})