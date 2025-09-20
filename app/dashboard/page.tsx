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

  return (
    <DashboardClient
      profile={profile}
      todaysWorkout={todaysWorkout}
      weekWorkouts={weekWorkouts || []}
      recentCompletions={recentCompletions || []}
    />
  );
}