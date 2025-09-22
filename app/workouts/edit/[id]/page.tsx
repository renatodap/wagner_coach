import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EditWorkoutClient from './EditWorkoutClient';
import { Workout } from '@/lib/types/workout-types';
import { Exercise } from '@/lib/types/exercise-types';
import { WorkoutExercise } from '@/lib/types/workout-exercise-types';

type EditWorkoutPageProps = {
  params: {
    id: string;
  };
};

// Re-usable function to fetch workout and check ownership
async function getWorkoutForEdit(supabase: ReturnType<typeof createClient>, workoutId: number, userId: string) {
  const { data: workout, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('id', workoutId)
    .single();

  if (error || !workout) {
    console.error('Error fetching workout or workout not found', error);
    return null;
  }

  // Security check: Only the owner can edit.
  if (workout.user_id !== userId) {
    return null;
  }

  return workout as Workout;
}

export default async function EditWorkoutPage({ params }: EditWorkoutPageProps) {
  const supabase = await createClient();
  const workoutId = parseInt(params.id, 10);

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  if (isNaN(workoutId)) {
    redirect('/workouts');
  }

  const workout = await getWorkoutForEdit(supabase, workoutId, user.id);

  if (!workout) {
    redirect('/workouts');
  }

  // Fetch associated exercises
  const { data: workoutExercisesData, error: exercisesError } = await supabase
    .from('workout_exercises')
    .select('*, exercises(*)')
    .eq('workout_id', workoutId)
    .order('order_index');

  const workoutExercises: WorkoutExercise[] = workoutExercisesData || [];

  if (exercisesError) {
    console.error('Error fetching workout exercises', exercisesError);
    // Continue with an empty list, the client can show an error
  }

  // Fetch all available exercises for the user to add
  const { data: allExercisesData, error: allExercisesError } = await supabase
    .from('exercises')
    .select('*')
    .or(`user_id.eq.${user.id},user_id.is.null`);

  const allExercises: Exercise[] = allExercisesData || [];

  if (allExercisesError) {
    console.error('Error fetching all exercises', allExercisesError);
  }

  return (
    <EditWorkoutClient
      workout={workout}
      initialWorkoutExercises={workoutExercises}
      allExercises={allExercises}
      userId={user.id}
    />
  );
}
