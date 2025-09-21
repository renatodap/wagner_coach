import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import WorkoutsClient from './WorkoutsClient';

export default async function WorkoutsPage() {
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

  // Get all workouts using the secure RPC function that filters out empty workouts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allWorkouts, error: workoutsError } = await (supabase as any)
    .rpc('get_dashboard_workouts', {
      p_user_id: user.id
    });

  if (workoutsError) {
    console.error('Error fetching workouts:', workoutsError);
  }

  // Process workouts from RPC function response
  interface DashboardWorkout {
    workout_id: number;
    workout_name: string;
    workout_type: string;
    workout_goal: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    duration_minutes: number;
    description: string;
    is_favorite: boolean;
    exercise_count: number;
  }

  // Map RPC response to expected format
  const workoutsWithFavorites = (allWorkouts as DashboardWorkout[] | null)?.map(workout => ({
    id: workout.workout_id,
    name: workout.workout_name,
    type: workout.workout_type,
    goal: workout.workout_goal,
    difficulty: workout.difficulty,
    description: workout.description || 'No description available',
    estimated_duration_minutes: workout.duration_minutes || 45,
    is_favorite: workout.is_favorite || false
  })) || [];

  return (
    <WorkoutsClient
      profile={profile}
      initialWorkouts={workoutsWithFavorites}
      userId={user.id}
    />
  );
}