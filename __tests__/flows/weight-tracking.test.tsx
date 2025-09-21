// Test: Weight Tracking Flow
// Following TDD Step 4: Failing Tests Implementation

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockActiveSession, mockExercises, mockSetPerformances } from '../mocks/workout-data'

// Components that should exist but don't yet (will cause tests to fail)
import ActiveWorkoutClient from '@/app/workout/active/[id]/ActiveWorkoutClient'
import WeightSelector from '@/app/components/WeightSelector'
import SetTracker from '@/app/components/SetTracker'

describe('Weight Tracking Flow', () => {
  const mockUserId = 'test-user-id'
  const mockSessionId = 1

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Weight Input Detection', () => {
    test('detects barbell exercises and shows increment/decrement controls', () => {
      render(
        <WeightSelector
          exercise={mockExercises[0]} // Bench Press (barbell)
          currentWeight={185}
          lastWeight={180}
          onWeightChange={jest.fn()}
        />
      )

      // Should show standard barbell controls
      expect(screen.getByTestId('weight-display')).toHaveTextContent('185')
      expect(screen.getByTestId('increment-5')).toBeInTheDocument()
      expect(screen.getByTestId('increment-10')).toBeInTheDocument()
      expect(screen.getByTestId('decrement-5')).toBeInTheDocument()
      expect(screen.getByTestId('decrement-10')).toBeInTheDocument()
    })

    test('detects dumbbell exercises and shows per-arm weight display', () => {
      render(
        <WeightSelector
          exercise={mockExercises[1]} // Incline Dumbbell Press
          currentWeight={70}
          lastWeight={65}
          onWeightChange={jest.fn()}
        />
      )

      // Should show dumbbell-specific display
      expect(screen.getByTestId('weight-display')).toHaveTextContent('70 lbs (35 each)')
      expect(screen.getByTestId('increment-2.5')).toBeInTheDocument()
      expect(screen.getByTestId('increment-5')).toBeInTheDocument()
    })

    test('detects bodyweight exercises and hides weight controls', () => {
      render(
        <WeightSelector
          exercise={mockExercises[2]} // Push-ups
          currentWeight={undefined}
          lastWeight={undefined}
          onWeightChange={jest.fn()}
        />
      )

      // Should show bodyweight indicator
      expect(screen.getByTestId('bodyweight-indicator')).toHaveTextContent('Bodyweight')
      expect(screen.queryByTestId('weight-display')).not.toBeInTheDocument()
      expect(screen.queryByTestId('increment-5')).not.toBeInTheDocument()
    })

    test('handles cable/machine exercises with 2.5lb increments', () => {
      const cableExercise = {
        ...mockExercises[0],
        equipment: 'cable',
        exercise_name: 'Cable Flyes'
      }

      render(
        <WeightSelector
          exercise={cableExercise}
          currentWeight={50}
          lastWeight={47.5}
          onWeightChange={jest.fn()}
        />
      )

      // Should show fine increment controls
      expect(screen.getByTestId('increment-2.5')).toBeInTheDocument()
      expect(screen.getByTestId('increment-5')).toBeInTheDocument()
      expect(screen.getByTestId('decrement-2.5')).toBeInTheDocument()
    })
  })

  describe('Smart Default Weight Suggestions', () => {
    test('suggests last weight used as default', () => {
      const mockOnWeightChange = jest.fn()

      render(
        <WeightSelector
          exercise={mockExercises[0]}
          currentWeight={185}
          lastWeight={180}
          onWeightChange={mockOnWeightChange}
          autoSuggest={true}
        />
      )

      // Should show last weight suggestion
      expect(screen.getByTestId('last-weight-suggestion')).toHaveTextContent('Last: 180 lbs')

      const usePreviousButton = screen.getByText('Use Previous')
      fireEvent.click(usePreviousButton)

      expect(mockOnWeightChange).toHaveBeenCalledWith(180)
    })

    test('suggests progressive overload increment for strength training', () => {
      const strengthExercise = {
        ...mockExercises[0],
        reps_planned: '3-5' // Low rep = strength
      }

      render(
        <WeightSelector
          exercise={strengthExercise}
          currentWeight={185}
          lastWeight={180}
          onWeightChange={jest.fn()}
          autoSuggest={true}
        />
      )

      // Should suggest 5lb increase for strength training
      expect(screen.getByTestId('progressive-overload-suggestion')).toHaveTextContent('+5 lbs')

      const increaseButton = screen.getByText('+5 lbs')
      expect(increaseButton).toHaveAttribute('title', 'Progressive overload suggestion')
    })

    test('suggests same weight for high-rep training', () => {
      const hypertrophyExercise = {
        ...mockExercises[0],
        reps_planned: '12-15' // High rep = hypertrophy
      }

      render(
        <WeightSelector
          exercise={hypertrophyExercise}
          currentWeight={135}
          lastWeight={135}
          onWeightChange={jest.fn()}
          autoSuggest={true}
        />
      )

      // Should suggest maintaining weight for volume
      expect(screen.getByTestId('maintain-weight-suggestion')).toHaveTextContent('Same weight')
    })

    test('handles first-time exercise with no history', () => {
      const newExercise = {
        ...mockExercises[0],
        last_weight_used: undefined
      }

      render(
        <WeightSelector
          exercise={newExercise}
          currentWeight={undefined}
          lastWeight={undefined}
          onWeightChange={jest.fn()}
          autoSuggest={true}
        />
      )

      // Should show estimated starting weight
      expect(screen.getByTestId('estimated-starting-weight')).toHaveTextContent('Estimated: 95 lbs')
      expect(screen.getByText('First time? Start light')).toBeInTheDocument()
    })
  })

  describe('Weight Adjustment Controls', () => {
    test('increments weight by 5 lbs for barbell exercises', async () => {
      const user = userEvent.setup()
      const mockOnWeightChange = jest.fn()

      render(
        <WeightSelector
          exercise={mockExercises[0]}
          currentWeight={185}
          lastWeight={180}
          onWeightChange={mockOnWeightChange}
        />
      )

      const increment5Button = screen.getByTestId('increment-5')
      await user.click(increment5Button)

      expect(mockOnWeightChange).toHaveBeenCalledWith(190)
    })

    test('decrements weight by 10 lbs for barbell exercises', async () => {
      const user = userEvent.setup()
      const mockOnWeightChange = jest.fn()

      render(
        <WeightSelector
          exercise={mockExercises[0]}
          currentWeight={185}
          lastWeight={180}
          onWeightChange={mockOnWeightChange}
        />
      )

      const decrement10Button = screen.getByTestId('decrement-10')
      await user.click(decrement10Button)

      expect(mockOnWeightChange).toHaveBeenCalledWith(175)
    })

    test('allows manual weight input', async () => {
      const user = userEvent.setup()
      const mockOnWeightChange = jest.fn()

      render(
        <WeightSelector
          exercise={mockExercises[0]}
          currentWeight={185}
          lastWeight={180}
          onWeightChange={mockOnWeightChange}
        />
      )

      const manualInput = screen.getByTestId('manual-weight-input')
      await user.clear(manualInput)
      await user.type(manualInput, '200')
      await user.tab() // Trigger blur event

      expect(mockOnWeightChange).toHaveBeenCalledWith(200)
    })

    test('validates weight input ranges', async () => {
      const user = userEvent.setup()
      const mockOnWeightChange = jest.fn()

      render(
        <WeightSelector
          exercise={mockExercises[0]}
          currentWeight={185}
          lastWeight={180}
          onWeightChange={mockOnWeightChange}
        />
      )

      // Try to input negative weight
      const manualInput = screen.getByTestId('manual-weight-input')
      await user.clear(manualInput)
      await user.type(manualInput, '-50')
      await user.tab()

      // Should show error and not call onChange
      expect(screen.getByTestId('weight-error')).toHaveTextContent('Weight must be positive')
      expect(mockOnWeightChange).not.toHaveBeenCalled()
    })
  })

  describe('Set Completion Tracking', () => {
    test('tracks reps and weight for completed set', async () => {
      const user = userEvent.setup()
      const mockOnSetComplete = jest.fn()

      render(
        <SetTracker
          exercise={mockExercises[0]}
          setNumber={1}
          targetReps="6-8"
          currentWeight={185}
          onSetComplete={mockOnSetComplete}
        />
      )

      // Input actual reps
      const repsInput = screen.getByTestId('reps-input')
      await user.clear(repsInput)
      await user.type(repsInput, '8')

      // Complete the set
      const completeButton = screen.getByText('Complete Set')
      await user.click(completeButton)

      expect(mockOnSetComplete).toHaveBeenCalledWith({
        set_number: 1,
        reps_performed: 8,
        weight_used: 185,
        notes: undefined
      })
    })

    test('allows adding notes to sets', async () => {
      const user = userEvent.setup()
      const mockOnSetComplete = jest.fn()

      render(
        <SetTracker
          exercise={mockExercises[0]}
          setNumber={2}
          targetReps="6-8"
          currentWeight={185}
          onSetComplete={mockOnSetComplete}
        />
      )

      // Add notes
      const notesButton = screen.getByTestId('add-notes-button')
      await user.click(notesButton)

      const notesInput = screen.getByTestId('set-notes-input')
      await user.type(notesInput, 'Felt heavy, form broke down on last rep')

      // Input reps and complete
      const repsInput = screen.getByTestId('reps-input')
      await user.type(repsInput, '6')

      const completeButton = screen.getByText('Complete Set')
      await user.click(completeButton)

      expect(mockOnSetComplete).toHaveBeenCalledWith({
        set_number: 2,
        reps_performed: 6,
        weight_used: 185,
        notes: 'Felt heavy, form broke down on last rep'
      })
    })

    test('validates rep input against target range', async () => {
      const user = userEvent.setup()

      render(
        <SetTracker
          exercise={mockExercises[0]}
          setNumber={1}
          targetReps="6-8"
          currentWeight={185}
          onSetComplete={jest.fn()}
        />
      )

      const repsInput = screen.getByTestId('reps-input')

      // Input reps below target
      await user.clear(repsInput)
      await user.type(repsInput, '3')

      expect(screen.getByTestId('reps-feedback')).toHaveTextContent('Below target range')
      expect(screen.getByTestId('reps-feedback')).toHaveClass('text-amber-600')

      // Input reps in target
      await user.clear(repsInput)
      await user.type(repsInput, '7')

      expect(screen.getByTestId('reps-feedback')).toHaveTextContent('In target range')
      expect(screen.getByTestId('reps-feedback')).toHaveClass('text-green-600')

      // Input reps above target
      await user.clear(repsInput)
      await user.type(repsInput, '12')

      expect(screen.getByTestId('reps-feedback')).toHaveTextContent('Above target range')
      expect(screen.getByTestId('reps-feedback')).toHaveClass('text-blue-600')
    })
  })

  describe('Weight Progression Analysis', () => {
    test('shows weight progression compared to last workout', () => {
      const sessionWithProgress = {
        ...mockActiveSession,
        exercises: mockExercises.map(ex => ({
          ...ex,
          last_weight_used: ex.exercise_id === 1 ? 180 : ex.last_weight_used
        }))
      }

      render(
        <ActiveWorkoutClient
          session={sessionWithProgress}
          userId={mockUserId}
        />
      )

      // Should show progression indicator
      expect(screen.getByTestId('weight-progression')).toHaveTextContent('+5 lbs from last')
      expect(screen.getByTestId('progression-trend')).toHaveClass('text-green-600')
    })

    test('handles weight decrease gracefully', () => {
      const sessionWithDecrease = {
        ...mockActiveSession,
        exercises: mockExercises.map(ex => ({
          ...ex,
          last_weight_used: ex.exercise_id === 1 ? 200 : ex.last_weight_used
        }))
      }

      render(
        <ActiveWorkoutClient
          session={sessionWithDecrease}
          userId={mockUserId}
        />
      )

      // Should show decrease without judgment
      expect(screen.getByTestId('weight-progression')).toHaveTextContent('-15 lbs from last')
      expect(screen.getByTestId('progression-note')).toHaveTextContent('Deload or form focus')
    })

    test('calculates total volume for workout', () => {
      const sessionWithSets = {
        ...mockActiveSession,
        set_performances: mockSetPerformances
      }

      render(
        <ActiveWorkoutClient
          session={sessionWithSets}
          userId={mockUserId}
        />
      )

      // Should calculate total volume (weight × reps)
      const expectedVolume = (185 * 8) + (185 * 7) // 2775 lbs
      expect(screen.getByTestId('total-volume')).toHaveTextContent('2,775 lbs')
    })
  })

  describe('Error Handling', () => {
    test('handles invalid weight inputs gracefully', async () => {
      const user = userEvent.setup()

      render(
        <WeightSelector
          exercise={mockExercises[0]}
          currentWeight={185}
          lastWeight={180}
          onWeightChange={jest.fn()}
        />
      )

      const manualInput = screen.getByTestId('manual-weight-input')

      // Test non-numeric input
      await user.clear(manualInput)
      await user.type(manualInput, 'abc')
      await user.tab()

      expect(screen.getByTestId('weight-error')).toHaveTextContent('Please enter a valid number')
    })

    test('handles missing exercise data gracefully', () => {
      const incompleteExercise = {
        ...mockExercises[0],
        equipment: undefined,
        last_weight_used: undefined
      }

      render(
        <WeightSelector
          exercise={incompleteExercise}
          currentWeight={undefined}
          lastWeight={undefined}
          onWeightChange={jest.fn()}
        />
      )

      // Should still render with defaults
      expect(screen.getByTestId('weight-selector')).toBeInTheDocument()
      expect(screen.getByTestId('manual-weight-input')).toBeInTheDocument()
    })

    test('prevents set completion without required data', () => {
      render(
        <SetTracker
          exercise={mockExercises[0]}
          setNumber={1}
          targetReps="6-8"
          currentWeight={undefined}
          onSetComplete={jest.fn()}
        />
      )

      const completeButton = screen.getByText('Complete Set')
      expect(completeButton).toBeDisabled()
      expect(screen.getByTestId('missing-data-warning')).toHaveTextContent('Set weight to complete')
    })
  })

  describe('Performance Tests', () => {
    test('weight adjustments respond within 100ms', async () => {
      const user = userEvent.setup()
      const mockOnWeightChange = jest.fn()

      render(
        <WeightSelector
          exercise={mockExercises[0]}
          currentWeight={185}
          lastWeight={180}
          onWeightChange={mockOnWeightChange}
        />
      )

      const startTime = performance.now()

      const increment5Button = screen.getByTestId('increment-5')
      await user.click(increment5Button)

      const responseTime = performance.now() - startTime
      expect(responseTime).toBeLessThan(100)
      expect(mockOnWeightChange).toHaveBeenCalled()
    })

    test('set completion saves within 200ms', async () => {
      const user = userEvent.setup()
      const mockOnSetComplete = jest.fn()

      render(
        <SetTracker
          exercise={mockExercises[0]}
          setNumber={1}
          targetReps="6-8"
          currentWeight={185}
          onSetComplete={mockOnSetComplete}
        />
      )

      const repsInput = screen.getByTestId('reps-input')
      await user.type(repsInput, '8')

      const startTime = performance.now()

      const completeButton = screen.getByText('Complete Set')
      await user.click(completeButton)

      const saveTime = performance.now() - startTime
      expect(saveTime).toBeLessThan(200)
      expect(mockOnSetComplete).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    test('weight controls have proper ARIA labels', () => {
      render(
        <WeightSelector
          exercise={mockExercises[0]}
          currentWeight={185}
          lastWeight={180}
          onWeightChange={jest.fn()}
        />
      )

      expect(screen.getByTestId('increment-5')).toHaveAttribute('aria-label', 'Increase weight by 5 pounds')
      expect(screen.getByTestId('decrement-5')).toHaveAttribute('aria-label', 'Decrease weight by 5 pounds')
      expect(screen.getByTestId('manual-weight-input')).toHaveAttribute('aria-label', 'Enter weight manually')
    })

    test('set completion form has proper form labels', () => {
      render(
        <SetTracker
          exercise={mockExercises[0]}
          setNumber={1}
          targetReps="6-8"
          currentWeight={185}
          onSetComplete={jest.fn()}
        />
      )

      expect(screen.getByTestId('reps-input')).toHaveAttribute('aria-label', 'Number of reps completed')
      expect(screen.getByTestId('set-notes-input')).toHaveAttribute('aria-label', 'Optional notes for this set')
    })

    test('supports keyboard navigation', async () => {
      const user = userEvent.setup()

      render(
        <WeightSelector
          exercise={mockExercises[0]}
          currentWeight={185}
          lastWeight={180}
          onWeightChange={jest.fn()}
        />
      )

      // Should be able to tab through controls
      await user.tab()
      expect(screen.getByTestId('decrement-10')).toHaveFocus()

      await user.tab()
      expect(screen.getByTestId('decrement-5')).toHaveFocus()

      await user.tab()
      expect(screen.getByTestId('manual-weight-input')).toHaveFocus()
    })
  })
})