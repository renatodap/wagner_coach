import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import WorkoutBuilderClient from '@/app/workouts/WorkoutBuilderClient';
import { notFound } from 'next/navigation';

export default async function EditWorkoutPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { id } = params;

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // Fetch the workout
  const { data: workout, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !workout) {
    notFound();
  }

  // Ensure the user owns this workout
  if (workout.user_id !== user.id) {
    notFound();
  }

  // Fetch the exercises for the workout
  const { data: workoutExercises } = await supabase
    .from('workout_exercises')
    .select('*, exercises(*), user_exercises(*)')
    .eq('workout_id', id);

  // Fetch all global and user exercises for the library
  const { data: globalExercises } = await supabase.from('exercises').select('*');
  const { data: userExercisesList } = await supabase.from('user_exercises').select('*').eq('user_id', user.id);

  // Combine and format the workout exercises
  const initialExercises = (workoutExercises || []).map(we => {
    const exercise = we.exercises || we.user_exercises;
    return {
      ...exercise,
      instanceId: `${exercise.id}-${Math.random()}`,
      source: we.exercise_id ? 'global' : 'user',
      sets: we.sets,
      reps: we.reps,
      rest: we.rest_seconds,
    };
  });

  const initialWorkoutData = {
    ...workout,
    exercises: initialExercises,
  };

  return (
    <WorkoutBuilderClient
      userId={user.id}
      globalExercises={(globalExercises || []).map(ex => ({ ...ex, source: 'global' }))}
      userExercises={(userExercisesList || []).map(ex => ({ ...ex, source: 'user' }))}
      initialWorkout={initialWorkoutData}
    />
  );
}
