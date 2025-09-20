export interface Profile {
  id: string;
  full_name?: string;
  goal?: 'build_muscle' | 'lose_weight' | 'gain_strength';
  onboarding_completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Exercise {
  id: number;
  name: string;
  category: string;
  muscle_group: string;
  equipment?: string;
  difficulty?: string;
  instructions?: string[];
}

export interface Workout {
  id: number;
  name: string;
  type: string;
  goal?: string;
  duration_minutes?: number;
  difficulty?: string;
  created_at?: string;
  workout_exercises?: WorkoutExercise[];
}

export interface WorkoutExercise {
  id: number;
  workout_id: number;
  exercise_id: number;
  sets: number;
  reps: string;
  rest_seconds?: number;
  order_index: number;
  notes?: string;
  exercises?: Exercise;
}

export interface UserWorkout {
  id: number;
  user_id: string;
  workout_id?: number;
  scheduled_date: string;
  completed: boolean;
  created_at?: string;
  workouts?: Workout;
}

export interface WorkoutCompletion {
  id: number;
  user_id: string;
  user_workout_id: number;
  workout_id?: number;
  started_at?: string;
  completed_at: string;
  notes?: string;
  workouts?: Workout;
  exercise_completions?: ExerciseCompletion[];
}

export interface ExerciseCompletion {
  id: number;
  completion_id: number;
  exercise_id: number;
  sets_completed?: number;
  reps_completed?: number[];
  weight_kg?: number[];
  notes?: string;
  exercises?: Exercise;
}