'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import DashboardClient from './DashboardClient';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    activitiesToday: 0,
    mealsToday: 0,
    activePrograms: 0
  });
  const [upcomingWorkouts, setUpcomingWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push('/auth');
          return;
        }

        setUser(user);

        // Get user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        setProfile(profileData);

        // Get quick stats
        const today = new Date().toISOString().split('T')[0];

        // Get today's activities count
        const { count: activitiesCount } = await supabase
          .from('activities')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('start_date', `${today}T00:00:00`)
          .lte('start_date', `${today}T23:59:59`);

        // Get today's meals count
        const { count: mealsCount } = await supabase
          .from('meal_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('logged_at', `${today}T00:00:00`)
          .lte('logged_at', `${today}T23:59:59`);

        // Get active workout programs count
        const { count: programsCount } = await supabase
          .from('user_program_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'active');

        setStats({
          activitiesToday: activitiesCount || 0,
          mealsToday: mealsCount || 0,
          activePrograms: programsCount || 0
        });

        // Get upcoming workouts
        const { data: workoutsData } = await supabase
          .from('user_workouts')
          .select('*, workouts(name, type)')
          .eq('user_id', user.id)
          .eq('status', 'scheduled')
          .gte('scheduled_date', today)
          .order('scheduled_date', { ascending: true })
          .limit(3);

        setUpcomingWorkouts(workoutsData || []);

      } catch (err) {
        console.error('Dashboard error:', err);
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-iron-black text-iron-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-heading text-iron-orange">LOADING...</h1>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-iron-black text-iron-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-heading text-iron-orange">REDIRECTING...</h1>
        </div>
      </div>
    );
  }

  return (
    <DashboardClient
      profile={profile}
      stats={stats}
      upcomingWorkouts={upcomingWorkouts}
    />
  );
}
