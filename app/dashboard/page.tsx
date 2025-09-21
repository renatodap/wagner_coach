import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get all workouts with favorites
  const { data: allWorkouts, error: workoutsError } = await supabase
    .from('workouts')
    .select(`
      *,
      favorite_workouts!left(user_id)
    `)
    .order('name');

  if (workoutsError) {
    console.error('Error fetching workouts:', workoutsError);
  }
  console.log('Fetched workouts:', allWorkouts);

  // Process workouts to add is_favorite flag
  interface FavoriteWorkout {
    user_id: string;
  }
  interface WorkoutWithFavorites {
    id: number;
    name: string;
    type: string;
    goal: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    description: string | null;
    estimated_duration_minutes: number | null;
    favorite_workouts?: FavoriteWorkout[];
  }
  const workoutsWithFavorites = (allWorkouts as WorkoutWithFavorites[] | null)?.map(workout => ({
    ...workout,
    is_favorite: workout.favorite_workouts?.some((fav: FavoriteWorkout) => fav.user_id === user.id) || false,
    description: workout.description || '',
    estimated_duration_minutes: workout.estimated_duration_minutes || 45
  })) || [];

  return (
    <DashboardClient
      profile={profile}
      allWorkouts={workoutsWithFavorites}
      userId={user.id}
    />
  );
}