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

  // Get today's workout
  const today = new Date().toISOString().split('T')[0];
  const { data: todaysWorkout } = await supabase
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
    .eq('user_id', user.id)
    .eq('scheduled_date', today)
    .single();

  // Get this week's workouts for progress
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const { data: weekWorkouts } = await supabase
    .from('user_workouts')
    .select('*')
    .eq('user_id', user.id)
    .gte('scheduled_date', weekStart.toISOString().split('T')[0])
    .lte('scheduled_date', weekEnd.toISOString().split('T')[0])
    .order('scheduled_date');

  // Get recent completions
  const { data: recentCompletions } = await supabase
    .from('workout_completions')
    .select(`
      *,
      workouts (name)
    `)
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })
    .limit(5);

  // Get all workouts with favorites
  const { data: allWorkouts } = await supabase
    .from('workouts')
    .select(`
      *,
      favorite_workouts!left(user_id)
    `)
    .order('name');

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
      todaysWorkout={todaysWorkout}
      weekWorkouts={weekWorkouts || []}
      recentCompletions={recentCompletions || []}
      allWorkouts={workoutsWithFavorites}
      userId={user.id}
    />
  );
}