import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import WorkoutTracker from './WorkoutTracker';

export default async function WorkoutPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // Get the user workout with all exercise details
  const { data: userWorkout } = await supabase
    .from('user_workouts')
    .select(`
      *,
      workouts (
        *,
        workout_exercises (
          *,
          exercises (*)
        )
      )
    `)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (!userWorkout || !userWorkout.workouts) {
    redirect('/dashboard');
  }

  // Sort exercises by order_index
  if (userWorkout.workouts.workout_exercises) {
    userWorkout.workouts.workout_exercises.sort((a: any, b: any) => a.order_index - b.order_index);
  }

  return <WorkoutTracker userWorkout={userWorkout} />;
}