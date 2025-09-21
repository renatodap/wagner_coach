// Mock data for testing workout user flows
import type {
  Workout,
  WorkoutExercise,
  ActiveWorkoutSession,
  SetPerformance,
  WorkoutCompletion,
  WorkoutStats
} from '@/lib/types/workout-flows'

export const mockWorkouts: Workout[] = [
  {
    id: 1,
    name: 'WAGNER PUSH DAY',
    type: 'push',
    goal: 'build_muscle',
    difficulty: 'intermediate',
    estimated_duration_minutes: 45,
    description: 'Brutal chest, shoulders, and triceps workout',
    is_favorite: true,
    exercise_count: 3
  },
  {
    id: 2,
    name: 'WAGNER PULL DAY',
    type: 'pull',
    goal: 'build_muscle',
    difficulty: 'intermediate',
    estimated_duration_minutes: 45,
    description: 'Back and biceps destruction',
    is_favorite: false,
    exercise_count: 3
  },
  {
    id: 3,
    name: 'BEGINNER BASICS',
    type: 'full_body',
    goal: 'all',
    difficulty: 'beginner',
    estimated_duration_minutes: 30,
    description: 'Perfect starting point for new warriors',
    is_favorite: false,
    exercise_count: 4
  }
]

export const mockExercises: WorkoutExercise[] = [
  {
    exercise_id: 1,
    exercise_name: 'Bench Press',
    exercise_category: 'chest',
    muscle_group: 'chest',
    equipment: 'barbell',
    sets_planned: 4,
    reps_planned: '6-8',
    rest_seconds: 120,
    order_index: 0,
    notes: 'Go heavy or go home',
    sets_completed: 0,
    last_weight_used: 185
  },
  {
    exercise_id: 2,
    exercise_name: 'Incline Dumbbell Press',
    exercise_category: 'chest',
    muscle_group: 'chest',
    equipment: 'dumbbell',
    sets_planned: 3,
    reps_planned: '8-10',
    rest_seconds: 90,
    order_index: 1,
    notes: undefined,
    sets_completed: 0,
    last_weight_used: 70
  },
  {
    exercise_id: 3,
    exercise_name: 'Push-ups',
    exercise_category: 'chest',
    muscle_group: 'chest',
    equipment: 'bodyweight',
    sets_planned: 3,
    reps_planned: '10-15',
    rest_seconds: 60,
    order_index: 2,
    notes: undefined,
    sets_completed: 0,
    last_weight_used: undefined
  }
]

export const mockActiveSession: ActiveWorkoutSession = {
  id: 1,
  user_id: 'test-user-id',
  workout_id: 1,
  workout_name: 'WAGNER PUSH DAY',
  status: 'active',
  started_at: new Date('2025-01-24T10:00:00Z'),
  current_exercise_index: 0,
  current_set: 1,
  elapsed_time_seconds: 0,
  total_pause_duration_seconds: 0,
  exercises: mockExercises
}

export const mockSetPerformances: SetPerformance[] = [
  {
    id: 1,
    session_id: 1,
    exercise_id: 1,
    set_number: 1,
    reps_performed: 8,
    weight_used: 185,
    notes: undefined,
    completed_at: new Date('2025-01-24T10:05:00Z')
  },
  {
    id: 2,
    session_id: 1,
    exercise_id: 1,
    set_number: 2,
    reps_performed: 7,
    weight_used: 185,
    notes: undefined,
    completed_at: new Date('2025-01-24T10:08:00Z')
  }
]

export const mockWorkoutCompletions: WorkoutCompletion[] = [
  {
    id: 1,
    user_id: 'test-user-id',
    workout_id: 1,
    workout_name: 'WAGNER PUSH DAY',
    workout_type: 'push',
    completed_at: new Date('2025-01-23T11:30:00Z'),
    duration_seconds: 2700, // 45 minutes
    rating: 4,
    notes: 'Great workout, felt strong on bench press',
    sets_performed: 10,
    total_weight_lifted: 5250
  },
  {
    id: 2,
    user_id: 'test-user-id',
    workout_id: 2,
    workout_name: 'WAGNER PULL DAY',
    workout_type: 'pull',
    completed_at: new Date('2025-01-22T09:15:00Z'),
    duration_seconds: 2400, // 40 minutes
    rating: 5,
    notes: 'PR on deadlifts!',
    sets_performed: 12,
    total_weight_lifted: 6800
  }
]

export const mockWorkoutStats: WorkoutStats = {
  totalCompleted: 15,
  currentStreak: 3,
  totalDuration: 40500, // 11.25 hours
  averageDuration: 2700, // 45 minutes
  totalWeightLifted: 125000,
  favoriteWorkoutType: 'push'
}

// Test scenarios
export const mockScenarios = {
  emptyWorkoutList: [],
  emptyExerciseList: [],
  singleWorkout: [mockWorkouts[0]],
  bodyweightExercise: mockExercises[2],
  weightedExercise: mockExercises[0],
  completedSession: {
    ...mockActiveSession,
    status: 'completed' as const,
    current_exercise_index: 2,
    current_set: 3
  },
  pausedSession: {
    ...mockActiveSession,
    status: 'paused' as const,
    total_pause_duration_seconds: 300
  }
}

// Helper functions for creating test data
export const createMockWorkout = (overrides: Partial<Workout> = {}): Workout => ({
  ...mockWorkouts[0],
  ...overrides
})

export const createMockExercise = (overrides: Partial<WorkoutExercise> = {}): WorkoutExercise => ({
  ...mockExercises[0],
  ...overrides
})

export const createMockSession = (overrides: Partial<ActiveWorkoutSession> = {}): ActiveWorkoutSession => ({
  ...mockActiveSession,
  ...overrides
})

export const createMockSetPerformance = (overrides: Partial<SetPerformance> = {}): SetPerformance => ({
  ...mockSetPerformances[0],
  ...overrides
})

export const createMockCompletion = (overrides: Partial<WorkoutCompletion> = {}): WorkoutCompletion => ({
  ...mockWorkoutCompletions[0],
  ...overrides
})