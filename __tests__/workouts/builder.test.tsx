import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkoutBuilderClient from '@/app/workouts/WorkoutBuilderClient';

const mockGlobalExercises = [
  { id: 1, name: 'Bench Press', category: 'Strength', muscle_group: 'Chest' },
  { id: 2, name: 'Squat', category: 'Strength', muscle_group: 'Legs' },
];

const mockUserExercises = [
  { id: 1, name: 'My Custom Exercise', category: 'Strength', muscle_group: 'Chest', user_id: 'test-user-id' },
];

describe('WorkoutBuilderClient', () => {
  it('should render the component', () => {
    render(
      <WorkoutBuilderClient
        userId="test-user-id"
        globalExercises={mockGlobalExercises}
        userExercises={mockUserExercises}
      />
    );
    expect(screen.getByText('Create Custom Workout')).toBeInTheDocument();
  });

  it('should add an exercise to the workout', async () => {
    render(
      <WorkoutBuilderClient
        userId="test-user-id"
        globalExercises={mockGlobalExercises}
        userExercises={mockUserExercises}
      />
    );

    const addButton = screen.getAllByText('Add')[0];
    await userEvent.click(addButton);

    const selectedExercisesContainer = screen.getByTestId('selected-exercises');
    expect(within(selectedExercisesContainer).getByText('Bench Press')).toBeInTheDocument();
  });

  it('should remove an exercise from the workout', async () => {
    render(
      <WorkoutBuilderClient
        userId="test-user-id"
        globalExercises={mockGlobalExercises}
        userExercises={mockUserExercises}
      />
    );

    const addButton = screen.getAllByText('Add')[0];
    await userEvent.click(addButton);

    const selectedExercisesContainer = screen.getByTestId('selected-exercises');
    const removeButton = within(selectedExercisesContainer).getByText('Remove');
    await userEvent.click(removeButton);

    await waitFor(() => {
      const found = within(selectedExercisesContainer).queryAllByText('Bench Press');
      expect(found).toHaveLength(0);
    });
  });

  it('should create a new custom exercise', async () => {
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 2, name: 'Newly Created Exercise' }),
    });

    render(
      <WorkoutBuilderClient
        userId="test-user-id"
        globalExercises={mockGlobalExercises}
        userExercises={mockUserExercises}
      />
    );

    const createButton = screen.getByText('Create New');
    await userEvent.click(createButton);

    const nameInput = await screen.findByPlaceholderText('Exercise Name');
    await userEvent.type(nameInput, 'Newly Created Exercise');

    const saveButton = screen.getByRole('button', { name: 'Save' });
    await userEvent.click(saveButton);

    expect(fetch).toHaveBeenCalledWith('/api/user-exercises', expect.any(Object));
  });

  it('should save the workout', async () => {
    global.fetch = jest.fn()
        .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ id: 1 }),
        })
        .mockResolvedValueOnce({
            ok: true,
        });

    render(
        <WorkoutBuilderClient
            userId="test-user-id"
            globalExercises={mockGlobalExercises}
            userExercises={mockUserExercises}
        />
    );

    const saveWorkoutButton = screen.getByText('Save Workout');
    await userEvent.click(saveWorkoutButton);

    expect(fetch).toHaveBeenCalledWith('/api/workouts/create', expect.any(Object));
  });

  it('should render in edit mode with initial data', () => {
    const initialWorkout = {
      id: 1,
      name: 'My Old Workout',
      description: 'An old workout description',
      difficulty: 'beginner',
      type: 'pull',
      exercises: [
        { id: 1, name: 'Pull Ups', instanceId: '1-1', source: 'global', sets: 3, reps: '8', rest: 60 },
      ],
    };

    render(
      <WorkoutBuilderClient
        userId="test-user-id"
        globalExercises={mockGlobalExercises}
        userExercises={mockUserExercises}
        initialWorkout={initialWorkout}
      />
    );

    expect(screen.getByDisplayValue('My Old Workout')).toBeInTheDocument();
    expect(screen.getByDisplayValue('An old workout description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('beginner')).toBeInTheDocument();
    expect(screen.getByDisplayValue('pull')).toBeInTheDocument();
    expect(screen.getByText('Pull Ups')).toBeInTheDocument();
  });
});
