import { Exercise } from './exercise-types';

export interface WorkoutExercise {
  id: number;
  workout_id: number;
  exercise_id: number;
  sets: number;
  reps: string;
  rest_seconds?: number | null;
  order_index: number;
  notes?: string | null;
  exercises?: Exercise; // This is the joined data from the query, can be optional
}
