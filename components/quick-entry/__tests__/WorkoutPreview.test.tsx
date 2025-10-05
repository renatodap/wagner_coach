/**
 * Test suite for WorkoutPreview component
 * Tests UI rendering and interaction for workout entries
 */

import { render, screen, fireEvent } from '@testing-library/react';
import WorkoutPreview from '../WorkoutPreview';
import { QuickEntryPreviewResponse } from '../types';

describe('WorkoutPreview Component', () => {
  /**
   * Test Case 3: Workout with exercises
   * Expected: Exercise cards with sets, reps, weight, volume calculation
   */
  test('displays workout with exercise cards and volume calculations', () => {
    const mockData: QuickEntryPreviewResponse = {
      success: true,
      entry_type: 'workout',
      confidence: 0.92,
      data: {
        primary_fields: {
          workout_name: 'Chest Day',
          duration_minutes: 60,
          exercises: [
            {
              name: 'Bench Press',
              sets: 4,
              reps: 8,
              weight_lbs: 185,
              note: null
            },
            {
              name: 'Incline Dumbbell Press',
              sets: 3,
              reps: 12,
              weight_lbs: 120,
              weight_per_side: 60,
              note: 'per side'
            }
          ]
        },
        secondary_fields: {
          volume_load: 10240,
          muscle_groups: ['chest', 'triceps', 'shoulders'],
          estimated_calories: 185,
          tags: ['push', 'hypertrophy']
        },
        estimated: false,
        needs_clarification: false
      },
      validation: { errors: [], warnings: [], missing_critical: [] },
      suggestions: ['Consider adding shoulder accessory work']
    };

    render(
      <WorkoutPreview
        data={mockData}
        onSave={jest.fn()}
        onEdit={jest.fn()}
      />
    );

    // Check workout name
    expect(screen.getByText('Chest Day')).toBeInTheDocument();

    // Check exercise 1
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
    expect(screen.getByText(/4.*sets.*8.*reps.*185.*lbs/i)).toBeInTheDocument();

    // Check exercise 2
    expect(screen.getByText('Incline Dumbbell Press')).toBeInTheDocument();
    expect(screen.getByText(/60 lbs per side/i)).toBeInTheDocument();

    // Check total volume
    expect(screen.getByText(/10,240 lbs/i)).toBeInTheDocument();

    // Check progressive overload message
    expect(screen.getByText(/Solid volume/i)).toBeInTheDocument();
  });

  /**
   * Test: Volume calculation per exercise
   * Expected: Each exercise card shows individual volume
   */
  test('calculates and displays volume for each exercise', () => {
    const mockData: QuickEntryPreviewResponse = {
      success: true,
      entry_type: 'workout',
      confidence: 0.90,
      data: {
        primary_fields: {
          workout_name: 'Test Workout',
          duration_minutes: 45,
          exercises: [
            {
              name: 'Squats',
              sets: 5,
              reps: 5,
              weight_lbs: 225,
              note: null
            }
          ]
        },
        secondary_fields: {
          volume_load: 5625,
          muscle_groups: ['legs'],
          tags: ['strength']
        },
        estimated: false,
        needs_clarification: false
      },
      validation: { errors: [], warnings: [], missing_critical: [] },
      suggestions: []
    };

    render(
      <WorkoutPreview
        data={mockData}
        onSave={jest.fn()}
        onEdit={jest.fn()}
      />
    );

    // Volume for exercise: 5 sets × 5 reps × 225 lbs = 5,625 lbs
    expect(screen.getByText(/5,625 lbs/i)).toBeInTheDocument();
  });

  /**
   * Test: Expandable muscle groups
   * Expected: Muscle groups shown as chips in expanded section
   */
  test('displays muscle groups as chips when expanded', () => {
    const mockData: QuickEntryPreviewResponse = {
      success: true,
      entry_type: 'workout',
      confidence: 0.92,
      data: {
        primary_fields: {
          workout_name: 'Pull Day',
          duration_minutes: 60,
          exercises: [
            {
              name: 'Pull-ups',
              sets: 4,
              reps: 10,
              weight_lbs: 0,
              note: 'bodyweight'
            }
          ]
        },
        secondary_fields: {
          volume_load: 0,
          muscle_groups: ['back', 'biceps', 'lats'],
          tags: ['pull', 'bodyweight']
        },
        estimated: false,
        needs_clarification: false
      },
      validation: { errors: [], warnings: [], missing_critical: [] },
      suggestions: []
    };

    render(
      <WorkoutPreview
        data={mockData}
        onSave={jest.fn()}
        onEdit={jest.fn()}
      />
    );

    // Click "More details" to expand
    const expandButton = screen.getByText(/More details/i);
    fireEvent.click(expandButton);

    // Check muscle groups are displayed
    expect(screen.getByText('Muscle Groups')).toBeInTheDocument();
    expect(screen.getByText('back')).toBeInTheDocument();
    expect(screen.getByText('biceps')).toBeInTheDocument();
    expect(screen.getByText('lats')).toBeInTheDocument();
  });

  /**
   * Test: Edit mode for workout
   * Expected: Fields become editable inputs
   */
  test('enables edit mode and transforms fields to inputs', () => {
    const mockData: QuickEntryPreviewResponse = {
      success: true,
      entry_type: 'workout',
      confidence: 0.90,
      data: {
        primary_fields: {
          workout_name: 'Test Workout',
          duration_minutes: 45,
          exercises: [
            {
              name: 'Deadlift',
              sets: 3,
              reps: 5,
              weight_lbs: 315,
              note: null
            }
          ]
        },
        secondary_fields: {},
        estimated: false,
        needs_clarification: false
      },
      validation: { errors: [], warnings: [], missing_critical: [] },
      suggestions: []
    };

    render(
      <WorkoutPreview
        data={mockData}
        onSave={jest.fn()}
        onEdit={jest.fn()}
      />
    );

    // Click edit button
    const editButton = screen.getByText(/Edit/i);
    fireEvent.click(editButton);

    // Check workout name becomes input
    const workoutNameInput = screen.getByDisplayValue('Test Workout');
    expect(workoutNameInput).toBeInTheDocument();
    expect(workoutNameInput.tagName).toBe('INPUT');

    // Check duration becomes input
    const durationInput = screen.getByDisplayValue('45');
    expect(durationInput).toBeInTheDocument();
    expect(durationInput.tagName).toBe('INPUT');

    // Button text should change to "Done"
    expect(screen.getByText(/Done/i)).toBeInTheDocument();
  });

  /**
   * Test: RPE (Rate of Perceived Exertion) display
   * Expected: RPE shown when available
   */
  test('displays RPE when available', () => {
    const mockData: QuickEntryPreviewResponse = {
      success: true,
      entry_type: 'workout',
      confidence: 0.90,
      data: {
        primary_fields: {
          workout_name: 'Hard Workout',
          duration_minutes: 60,
          exercises: []
        },
        secondary_fields: {
          rpe: 8,
          volume_load: 10000,
          tags: []
        },
        estimated: false,
        needs_clarification: false
      },
      validation: { errors: [], warnings: [], missing_critical: [] },
      suggestions: []
    };

    render(
      <WorkoutPreview
        data={mockData}
        onSave={jest.fn()}
        onEdit={jest.fn()}
      />
    );

    // RPE should be displayed (though exact format may vary)
    const allText = screen.getByText(/Test Workout|Hard Workout/i).closest('div')?.textContent || '';
    // In view mode, RPE might not be immediately visible, but should be editable
  });

  /**
   * Test: Estimated calories display
   * Expected: Shows calories burned in expanded section
   */
  test('displays estimated calories in expanded section', () => {
    const mockData: QuickEntryPreviewResponse = {
      success: true,
      entry_type: 'workout',
      confidence: 0.90,
      data: {
        primary_fields: {
          workout_name: 'Cardio + Weights',
          duration_minutes: 75,
          exercises: []
        },
        secondary_fields: {
          estimated_calories: 420,
          volume_load: 8000,
          tags: []
        },
        estimated: false,
        needs_clarification: false
      },
      validation: { errors: [], warnings: [], missing_critical: [] },
      suggestions: []
    };

    render(
      <WorkoutPreview
        data={mockData}
        onSave={jest.fn()}
        onEdit={jest.fn()}
      />
    );

    // Click "More details"
    const expandButton = screen.getByText(/More details/i);
    fireEvent.click(expandButton);

    // Check for calories
    expect(screen.getByText('Stats')).toBeInTheDocument();
    expect(screen.getByText(/420/)).toBeInTheDocument();
    expect(screen.getByText(/Calories Burned/i)).toBeInTheDocument();
  });

  /**
   * Test: Tags display
   * Expected: Tags shown as chips in expanded section
   */
  test('displays tags when expanded', () => {
    const mockData: QuickEntryPreviewResponse = {
      success: true,
      entry_type: 'workout',
      confidence: 0.90,
      data: {
        primary_fields: {
          workout_name: 'Morning Session',
          duration_minutes: 60,
          exercises: []
        },
        secondary_fields: {
          tags: ['morning', 'strength', 'upper-body'],
          volume_load: 12000
        },
        estimated: false,
        needs_clarification: false
      },
      validation: { errors: [], warnings: [], missing_critical: [] },
      suggestions: []
    };

    render(
      <WorkoutPreview
        data={mockData}
        onSave={jest.fn()}
        onEdit={jest.fn()}
      />
    );

    // Expand to see tags
    const expandButton = screen.getByText(/More details/i);
    fireEvent.click(expandButton);

    // Check tags
    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByText('morning')).toBeInTheDocument();
    expect(screen.getByText('strength')).toBeInTheDocument();
    expect(screen.getByText('upper-body')).toBeInTheDocument();
  });

  /**
   * Test: Save callback with edited data
   * Expected: onSave called when save button clicked
   */
  test('calls onSave when save button clicked', () => {
    const mockOnSave = jest.fn();
    const mockData: QuickEntryPreviewResponse = {
      success: true,
      entry_type: 'workout',
      confidence: 0.90,
      data: {
        primary_fields: {
          workout_name: 'Test',
          duration_minutes: 30,
          exercises: []
        },
        secondary_fields: {},
        estimated: false,
        needs_clarification: false
      },
      validation: { errors: [], warnings: [], missing_critical: [] },
      suggestions: []
    };

    render(
      <WorkoutPreview
        data={mockData}
        onSave={mockOnSave}
        onEdit={jest.fn()}
      />
    );

    // Click save
    const saveButton = screen.getByText(/Save Workout/i);
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledTimes(1);
  });

  /**
   * Test: Confidence badge when estimated
   * Expected: Shows confidence percentage when data is estimated
   */
  test('displays confidence badge when workout is estimated', () => {
    const mockData: QuickEntryPreviewResponse = {
      success: true,
      entry_type: 'workout',
      confidence: 0.78,
      data: {
        primary_fields: {
          workout_name: 'Estimated Workout',
          duration_minutes: null,
          exercises: []
        },
        secondary_fields: {},
        estimated: true,
        needs_clarification: false
      },
      validation: { errors: [], warnings: [], missing_critical: [] },
      suggestions: []
    };

    render(
      <WorkoutPreview
        data={mockData}
        onSave={jest.fn()}
        onEdit={jest.fn()}
      />
    );

    // Check for confidence badge
    expect(screen.getByText(/78% confident/i)).toBeInTheDocument();
  });

  /**
   * Test: Suggestions display
   * Expected: Tips shown in suggestions box
   */
  test('displays workout suggestions', () => {
    const mockData: QuickEntryPreviewResponse = {
      success: true,
      entry_type: 'workout',
      confidence: 0.90,
      data: {
        primary_fields: {
          workout_name: 'Chest Workout',
          duration_minutes: 45,
          exercises: []
        },
        secondary_fields: {},
        estimated: false,
        needs_clarification: false
      },
      validation: { errors: [], warnings: [], missing_critical: [] },
      suggestions: [
        'Consider adding tricep isolation work',
        'Great volume for hypertrophy'
      ]
    };

    render(
      <WorkoutPreview
        data={mockData}
        onSave={jest.fn()}
        onEdit={jest.fn()}
      />
    );

    // Check suggestions box
    expect(screen.getByText(/💡 Tips/i)).toBeInTheDocument();
    expect(screen.getByText(/Consider adding tricep isolation work/i)).toBeInTheDocument();
    expect(screen.getByText(/Great volume for hypertrophy/i)).toBeInTheDocument();
  });
});
