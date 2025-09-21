import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProgressDashboard from './ProgressDashboard';
import { mockWorkoutStats, mockWorkoutCompletions } from '@/__tests__/mocks/workout-data';
import BottomNavigation from '@/app/components/BottomNavigation';

export default async function ProgressPage() {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // For now, using mock data until we implement the full data layer
  // In production, this would fetch real workout completion data
  const stats = mockWorkoutStats;
  const recentWorkouts = mockWorkoutCompletions;

  return (
    <div className="min-h-screen bg-iron-black">
      <header className="border-b border-iron-gray">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="font-heading text-4xl text-iron-orange">PROGRESS</h1>
        </div>
      </header>

      <div className="pb-20">
        <ProgressDashboard
          stats={stats}
          recentWorkouts={recentWorkouts}
          userId={user.id}
        />
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}