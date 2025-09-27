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

  // Get quick stats
  const today = new Date().toISOString().split('T')[0];

  // Get today's activities count
  const { count: activitiesCount } = await supabase
    .from('activities')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .gte('start_date', `${today}T00:00:00`)
    .lte('start_date', `${today}T23:59:59`);

  // Get today's meals count
  const { count: mealsCount } = await supabase
    .from('meal_logs')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .gte('logged_at', `${today}T00:00:00`)
    .lte('logged_at', `${today}T23:59:59`);

  // Get active workout programs count
  const { count: programsCount } = await supabase
    .from('user_program_enrollments')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('status', 'active');

  // Get upcoming workouts
  const { data: upcomingWorkouts } = await supabase
    .from('user_workouts')
    .select('*, workouts(name, type)')
    .eq('user_id', user.id)
    .eq('status', 'scheduled')
    .gte('scheduled_date', today)
    .order('scheduled_date', { ascending: true })
    .limit(3);

  return (
    <DashboardClient
      profile={profile}
      stats={{
        activitiesToday: activitiesCount || 0,
        mealsToday: mealsCount || 0,
        activePrograms: programsCount || 0
      }}
      upcomingWorkouts={upcomingWorkouts || []}
    />
  );
}