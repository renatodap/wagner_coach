import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import WorkoutBuilderClient from './WorkoutBuilderClient';

export default async function WorkoutBuilderPage() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth');
  }

  // Fetch exercises for the database
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .order('name');

  // Fetch user's custom exercises
  const { data: customExercises } = await supabase
    .from('user_custom_exercises')
    .select('*')
    .eq('user_id', user.id)
    .order('name');

  return (
    <WorkoutBuilderClient
      exercises={exercises || []}
      customExercises={customExercises || []}
      userId={user.id}
    />
  );
}