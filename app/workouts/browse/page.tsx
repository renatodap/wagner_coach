import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import BrowseWorkoutsClient from './BrowseWorkoutsClient';

export default async function BrowseWorkoutsPage() {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // Get user's favorited workouts to mark them
  const { data: userFavorites } = await supabase
    .from('user_workout_favorites')
    .select('workout_id')
    .eq('user_id', user.id);

  const favoriteIds = userFavorites?.map(f => f.workout_id) || [];

  // Get all public workouts
  const { data: publicWorkouts } = await supabase
    .from('workouts')
    .select(`
      id,
      name,
      type,
      goal,
      difficulty,
      duration_minutes,
      description,
      equipment_needed,
      muscle_groups,
      is_public,
      created_by,
      created_at
    `)
    .eq('is_public', true)
    .order('name');

  return (
    <BrowseWorkoutsClient
      workouts={publicWorkouts || []}
      favoriteIds={favoriteIds}
      userId={user.id}
    />
  );
}