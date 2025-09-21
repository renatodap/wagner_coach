import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import WorkoutBuilderClient from '../WorkoutBuilderClient';

export default async function CreateWorkoutPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // Fetch all exercises and user-created exercises
  const { data: exercises } = await supabase.from('exercises').select('*');
  const { data: userExercisesData } = await supabase.from('user_exercises').select('*').eq('user_id', user.id);

  const globalExercises = (exercises || []).map(ex => ({ ...ex, source: 'global' }));
  const userExercises = (userExercisesData || []).map(ex => ({ ...ex, source: 'user' }));


  return (
    <WorkoutBuilderClient
      userId={user.id}
      globalExercises={globalExercises}
      userExercises={userExercises}
    />
  );
}
