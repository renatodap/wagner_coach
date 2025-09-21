// Test: During Workout Flow (Active Session)
// Following TDD Step 4: Failing Tests Implementation

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  mockActiveSession,
  mockExercises,
  mockSetPerformances,
  createMockSession,
  createMockExercise
} from '../mocks/workout-data'

// Components that should exist but don't yet (will cause tests to fail)
import ActiveWorkoutClient from '@/app/workout/active/[sessionId]/ActiveWorkoutClient'
import ExerciseList from '@/app/components/ExerciseList'
import ExerciseDetail from '@/app/components/ExerciseDetail'
import WorkoutControls from '@/app/components/WorkoutControls'
import RestTimer from '@/app/components/RestTimer'

describe('During Workout Flow (Active Session)', () => {
  const mockSessionId = 1
  const mockOnSetComplete = jest.fn()
  const mockOnExerciseClick = jest.fn()
  const mockOnSkipExercise = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('ActiveWorkoutClient Component', () => {
    test('renders exercise list with correct opacity states', () => {
      const sessionWithProgress = createMockSession({
        current_exercise_index: 1, // Second exercise is current
        current_set: 2
      })

      render(
        <ActiveWorkoutClient
          sessionId={mockSessionId}
          initialSession={sessionWithProgress}
          initialExercises={mockExercises}
        />
      )

      // First exercise should be completed (green/faded)
      const firstExercise = screen.getByTestId('exercise-0')
      expect(firstExercise).toHaveClass('opacity-75', 'border-green-600')

      // Second exercise should be current (orange highlight)
      const secondExercise = screen.getByTestId('exercise-1')
      expect(secondExercise).toHaveClass('border-iron-orange', 'bg-iron-orange/10')

      // Third exercise should be upcoming (gray/low opacity)
      const thirdExercise = screen.getByTestId('exercise-2')
      expect(thirdExercise).toHaveClass('opacity-50', 'border-iron-gray')
    })

    test('highlights current exercise with orange styling', () => {
      render(
        <ActiveWorkoutClient
          sessionId={mockSessionId}
          initialSession={mockActiveSession}
          initialExercises={mockExercises}
        />
      )

      const currentExercise = screen.getByTestId('exercise-0')
      expect(currentExercise).toHaveClass('border-iron-orange')
      expect(currentExercise).toHaveClass('bg-iron-orange/10')
    })

    test('shows completed exercises with green and checkmark', () => {
      const completedSession = createMockSession({
        current_exercise_index: 2 // Third exercise is current, first two completed
      })

      render(
        <ActiveWorkoutClient
          sessionId={mockSessionId}
          initialSession={completedSession}
          initialExercises={mockExercises}
        />
      )

      const firstExercise = screen.getByTestId('exercise-0')
      expect(firstExercise).toHaveClass('border-green-600')
      expect(firstExercise).toHaveClass('opacity-75')

      // Should show checkmark icon
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument()
    })

    test('displays upcoming exercises with reduced opacity', () => {
      render(
        <ActiveWorkoutClient
          sessionId={mockSessionId}
          initialSession={mockActiveSession}
          initialExercises={mockExercises}
        />
      )

      // Second and third exercises should be upcoming
      const secondExercise = screen.getByTestId('exercise-1')
      const thirdExercise = screen.getByTestId('exercise-2')

      expect(secondExercise).toHaveClass('opacity-50')
      expect(thirdExercise).toHaveClass('opacity-50')
    })

    test('handles set completion with weight and reps', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

      render(
        <ActiveWorkoutClient
          sessionId={mockSessionId}
          initialSession={mockActiveSession}
          initialExercises={mockExercises}
        />
      )

      // Enter weight and reps
      const weightInput = screen.getByLabelText(/weight/i)
      const repsInput = screen.getByLabelText(/reps/i)

      await user.type(weightInput, '185')
      await user.type(repsInput, '8')

      // Complete set
      const completeButton = screen.getByText('COMPLETE SET')
      await user.click(completeButton)

      // Should call set completion function
      await waitFor(() => {
        expect(mockOnSetComplete).toHaveBeenCalledWith({
          session_id: mockSessionId,
          exercise_id: 1,
          set_number: 1,
          reps_performed: 8,
          weight_used: 185
        })
      })
    })

    test('manages rest timer countdown correctly', async () => {
      render(
        <ActiveWorkoutClient
          sessionId={mockSessionId}
          initialSession={mockActiveSession}
          initialExercises={mockExercises}
        />
      )

      // Complete a set to trigger rest timer
      const completeButton = screen.getByText('COMPLETE SET')
      fireEvent.click(completeButton)

      // Should show rest timer
      await waitFor(() => {
        expect(screen.getByTestId('rest-timer')).toBeInTheDocument()
      })

      // Should show countdown (120 seconds for bench press)
      expect(screen.getByText('2:00')).toBeInTheDocument()

      // Advance timer by 1 second
      act(() => {
        jest.advanceTimersByTime(1000)
      })

      // Should update countdown
      expect(screen.getByText('1:59')).toBeInTheDocument()
    })

    test('auto-advances set counter after completion', async () => {
      const user = userEvent.setup()

      render(
        <ActiveWorkoutClient
          sessionId={mockSessionId}
          initialSession={mockActiveSession}
          initialExercises={mockExercises}
        />
      )

      // Should start on set 1
      expect(screen.getByText('SET 1 of 4')).toBeInTheDocument()

      // Complete set
      const completeButton = screen.getByText('COMPLETE SET')
      await user.click(completeButton)

      // After rest timer, should advance to set 2
      await waitFor(() => {
        expect(screen.getByText('SET 2 of 4')).toBeInTheDocument()
      })
    })

    test('auto-advances to next exercise after final set', async () => {
      const user = userEvent.setup()
      const sessionOnLastSet = createMockSession({
        current_set: 4 // Last set of bench press (4 sets total)
      })

      render(
        <ActiveWorkoutClient
          sessionId={mockSessionId}
          initialSession={sessionOnLastSet}
          initialExercises={mockExercises}
        />
      )

      // Should be on bench press set 4
      expect(screen.getByText('SET 4 of 4')).toBeInTheDocument()
      expect(screen.getByText('Bench Press')).toBeInTheDocument()

      // Complete final set
      const completeButton = screen.getByText('COMPLETE SET')
      await user.click(completeButton)

      // Should advance to next exercise (Incline Dumbbell Press)
      await waitFor(() => {
        expect(screen.getByText('Incline Dumbbell Press')).toBeInTheDocument()
        expect(screen.getByText('SET 1 of 3')).toBeInTheDocument()
      })
    })
  })

  describe('Exercise Navigation', () => {
    test('normal progression: set -> rest -> next set', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

      render(
        <ActiveWorkoutClient
          sessionId={mockSessionId}
          initialSession={mockActiveSession}
          initialExercises={mockExercises}
        />
      )

      // Complete set 1
      const completeButton = screen.getByText('COMPLETE SET')
      await user.click(completeButton)

      // Should show rest timer
      expect(screen.getByTestId('rest-timer')).toBeInTheDocument()
      expect(screen.getByText('REST BETWEEN SETS')).toBeInTheDocument()

      // Wait for rest or skip
      const startNextSetButton = screen.getByText('START NEXT SET')
      await user.click(startNextSetButton)

      // Should be on set 2
      expect(screen.getByText('SET 2 of 4')).toBeInTheDocument()
    })

    test('skip sets moves immediately to next exercise', async () => {
      const user = userEvent.setup()

      render(
        <ActiveWorkoutClient
          sessionId={mockSessionId}
          initialSession={mockActiveSession}
          initialExercises={mockExercises}
        />
      )

      // Should be on bench press
      expect(screen.getByText('Bench Press')).toBeInTheDocument()

      // Click skip link
      const skipButton = screen.getByText(/skip remaining sets/i)
      await user.click(skipButton)

      // Should move to next exercise
      await waitFor(() => {
        expect(screen.getByText('Incline Dumbbell Press')).toBeInTheDocument()
        expect(screen.getByText('SET 1 of 3')).toBeInTheDocument()
      })
    })

    test('direct jump navigates to clicked exercise', async () => {
      const user = userEvent.setup()

      render(
        <ActiveWorkoutClient
          sessionId={mockSessionId}
          initialSession={mockActiveSession}
          initialExercises={mockExercises}
        />
      )

      // Should be on first exercise
      expect(screen.getByText('Bench Press')).toBeInTheDocument()

      // Click third exercise in sidebar
      const thirdExercise = screen.getByTestId('exercise-2')
      await user.click(thirdExercise)

      // Should jump to third exercise
      await waitFor(() => {
        expect(screen.getByText('Push-ups')).toBeInTheDocument()
        expect(screen.getByText('SET 1 of 3')).toBeInTheDocument()
      })
    })

    test('saves progress when jumping between exercises', async () => {
      const user = userEvent.setup()

      render(
        <ActiveWorkoutClient
          sessionId={mockSessionId}
          initialSession={mockActiveSession}
          initialExercises={mockExercises}
        />
      )

      // Complete a set
      const weightInput = screen.getByLabelText(/weight/i)
      const repsInput = screen.getByLabelText(/reps/i)

      await user.type(weightInput, '185')
      await user.type(repsInput, '8')

      const completeButton = screen.getByText('COMPLETE SET')
      await user.click(completeButton)

      // Jump to another exercise
      const thirdExercise = screen.getByTestId('exercise-2')
      await user.click(thirdExercise)

      // Jump back to first exercise
      const firstExercise = screen.getByTestId('exercise-0')
      await user.click(firstExercise)

      // Should show completed set information
      expect(screen.getByText(/Set 1: 185 lbs × 8 reps/)).toBeInTheDocument()
    })

    test('maintains state during navigation', async () => {
      const user = userEvent.setup()

      render(
        <ActiveWorkoutClient
          sessionId={mockSessionId}
          initialSession={mockActiveSession}
          initialExercises={mockExercises}
        />
      )

      // Enter some data but don't complete set
      const weightInput = screen.getByLabelText(/weight/i)
      await user.type(weightInput, '185')

      // Navigate to another exercise
      const secondExercise = screen.getByTestId('exercise-1')
      await user.click(secondExercise)

      // Navigate back
      const firstExercise = screen.getByTestId('exercise-0')
      await user.click(firstExercise)

      // Weight input should be cleared (fresh start for set)
      const weightInputAfter = screen.getByLabelText(/weight/i)
      expect(weightInputAfter).toHaveValue('')
    })
  })

  describe('Weight Tracking', () => {
    test('shows weight input for barbell/dumbbell exercises', () => {
      render(
        <ExerciseDetail
          exercise={mockExercises[0]} // Bench Press (barbell)
          currentSet={1}
          onSetComplete={mockOnSetComplete}
          onSkipExercise={mockOnSkipExercise}
        />
      )

      expect(screen.getByLabelText(/weight/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/weight/i)).toBeVisible()
    })

    test('hides weight input for bodyweight exercises initially', () => {
      render(
        <ExerciseDetail
          exercise={mockExercises[2]} // Push-ups (bodyweight)
          currentSet={1}
          onSetComplete={mockOnSetComplete}
          onSkipExercise={mockOnSkipExercise}
        />
      )

      expect(screen.queryByLabelText(/weight/i)).not.toBeInTheDocument()
      expect(screen.getByText(/add weight tracking/i)).toBeInTheDocument()
    })

    test('reveals weight input when "add weight" clicked', async () => {
      const user = userEvent.setup()

      render(
        <ExerciseDetail
          exercise={mockExercises[2]} // Push-ups (bodyweight)
          currentSet={1}
          onSetComplete={mockOnSetComplete}
          onSkipExercise={mockOnSkipExercise}
        />
      )

      // Weight input should be hidden initially
      expect(screen.queryByLabelText(/weight/i)).not.toBeInTheDocument()

      // Click "add weight tracking"
      const addWeightButton = screen.getByText(/add weight tracking/i)
      await user.click(addWeightButton)

      // Weight input should now be visible
      expect(screen.getByLabelText(/weight/i)).toBeInTheDocument()
    })

    test('uses previous weight as placeholder', () => {
      render(
        <ExerciseDetail
          exercise={mockExercises[0]} // Bench Press
          currentSet={1}
          onSetComplete={mockOnSetComplete}
          onSkipExercise={mockOnSkipExercise}
          previousWeight={185}
        />
      )

      const weightInput = screen.getByLabelText(/weight/i)
      expect(weightInput).toHaveAttribute('placeholder', '185')
    })

    test('accepts decimal weight values', async () => {
      const user = userEvent.setup()

      render(
        <ExerciseDetail
          exercise={mockExercises[1]} // Incline Dumbbell Press
          currentSet={1}
          onSetComplete={mockOnSetComplete}
          onSkipExercise={mockOnSkipExercise}
        />
      )

      const weightInput = screen.getByLabelText(/weight/i)
      await user.type(weightInput, '67.5')

      expect(weightInput).toHaveValue('67.5')
    })

    test('validates positive numbers only', async () => {
      const user = userEvent.setup()

      render(
        <ExerciseDetail
          exercise={mockExercises[0]}
          currentSet={1}
          onSetComplete={mockOnSetComplete}
          onSkipExercise={mockOnSkipExercise}
        />
      )

      const weightInput = screen.getByLabelText(/weight/i)
      await user.type(weightInput, '-50')

      // Should show validation error
      expect(screen.getByText(/weight must be positive/i)).toBeInTheDocument()

      // Complete button should be disabled
      const completeButton = screen.getByText('COMPLETE SET')
      expect(completeButton).toBeDisabled()
    })
  })

  describe('Timer Management', () => {
    test('timer starts automatically on workout start', () => {
      render(
        <ActiveWorkoutClient
          sessionId={mockSessionId}
          initialSession={mockActiveSession}
          initialExercises={mockExercises}
        />
      )

      // Should show timer in header
      expect(screen.getByTestId('workout-timer')).toBeInTheDocument()
      expect(screen.getByText('0:00')).toBeInTheDocument()

      // Advance time
      act(() => {
        jest.advanceTimersByTime(5000) // 5 seconds
      })

      expect(screen.getByText('0:05')).toBeInTheDocument()
    })

    test('timer accuracy within acceptable range', () => {
      render(
        <ActiveWorkoutClient
          sessionId={mockSessionId}
          initialSession={mockActiveSession}
          initialExercises={mockExercises}
        />
      )

      const startTime = Date.now()

      // Advance by exactly 60 seconds
      act(() => {
        jest.advanceTimersByTime(60000)
      })

      // Should show 1:00
      expect(screen.getByText('1:00')).toBeInTheDocument()

      // Timer should be accurate within 1 second
      const displayedTime = screen.getByTestId('workout-timer').textContent
      expect(displayedTime).toBe('1:00')
    })
  })

  describe('Rest Timer Component', () => {
    test('displays countdown correctly', () => {
      render(
        <RestTimer
          timeRemaining={120}
          nextExercise={mockExercises[0]}
          nextSet={2}
          onSkipRest={jest.fn()}
          onSkipToNextExercise={jest.fn()}
        />
      )

      expect(screen.getByText('2:00')).toBeInTheDocument()
      expect(screen.getByText('REST BETWEEN SETS')).toBeInTheDocument()
      expect(screen.getByText(/Set 2 of 4 - Bench Press/)).toBeInTheDocument()
    })

    test('provides skip options during rest', async () => {
      const user = userEvent.setup()
      const mockSkipRest = jest.fn()
      const mockSkipToNext = jest.fn()

      render(
        <RestTimer
          timeRemaining={120}
          nextExercise={mockExercises[0]}
          nextSet={2}
          onSkipRest={mockSkipRest}
          onSkipToNextExercise={mockSkipToNext}
        />
      )

      // Should have both skip options
      const startNextSet = screen.getByText('START NEXT SET')
      const skipToNext = screen.getByText('SKIP TO NEXT EXERCISE')

      await user.click(startNextSet)
      expect(mockSkipRest).toHaveBeenCalled()

      await user.click(skipToNext)
      expect(mockSkipToNext).toHaveBeenCalled()
    })
  })

  describe('Performance Tests', () => {
    test('exercise navigation completes within 200ms', async () => {
      const user = userEvent.setup()

      render(
        <ActiveWorkoutClient
          sessionId={mockSessionId}
          initialSession={mockActiveSession}
          initialExercises={mockExercises}
        />
      )

      const startTime = performance.now()

      const secondExercise = screen.getByTestId('exercise-1')
      await user.click(secondExercise)

      await waitFor(() => {
        expect(screen.getByText('Incline Dumbbell Press')).toBeInTheDocument()
      })

      const navigationTime = performance.now() - startTime
      expect(navigationTime).toBeLessThan(200)
    })

    test('set completion saves within 1 second', async () => {
      const user = userEvent.setup()

      render(
        <ActiveWorkoutClient
          sessionId={mockSessionId}
          initialSession={mockActiveSession}
          initialExercises={mockExercises}
        />
      )

      const startTime = performance.now()

      const completeButton = screen.getByText('COMPLETE SET')
      await user.click(completeButton)

      // Should start rest timer quickly
      await waitFor(() => {
        expect(screen.getByTestId('rest-timer')).toBeInTheDocument()
      })

      const saveTime = performance.now() - startTime
      expect(saveTime).toBeLessThan(1000)
    })
  })
})