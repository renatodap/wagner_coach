import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ManualActivityForm from './ManualActivityForm';

export default async function AddActivityPage() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth');
  }

  // Fetch user's private/custom workouts
  const { data: customWorkouts } = await supabase
    .from('user_custom_workouts')
    .select('id, name, type')
    .eq('user_id', user.id)
    .order('name');

  // Fetch only favorited public workouts
  const { data: favoritedWorkouts } = await supabase
    .from('user_workout_favorites')
    .select(`
      workout_id,
      workouts!inner (
        id,
        name,
        type
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Transform favorited workouts to expected format
  const standardWorkouts = favoritedWorkouts?.map(fav => ({
    id: fav.workouts.id,
    name: fav.workouts.name,
    type: fav.workouts.type
  })) || [];

  return (
    <ManualActivityForm
      userId={user.id}
      customWorkouts={customWorkouts || []}
      standardWorkouts={standardWorkouts || []}
    />
  );
}