import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProgressClient from './ProgressClient';
import WorkoutHistoryClient from './WorkoutHistoryClient';

export default async function ProgressPage() {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // Get all workout completions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: completions } = await (supabase as any)
    .from('workout_completions')
    .select(`
      *,
      workouts (name, difficulty),
      exercise_completions (
        *,
        exercises (name)
      )
    `)
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false });

  // Get all scheduled workouts for stats
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allWorkouts } = await (supabase as any)
    .from('user_workouts')
    .select('*')
    .eq('user_id', user.id)
    .lte('scheduled_date', new Date().toISOString().split('T')[0]);

  // Calculate stats
  const totalScheduled = allWorkouts?.length || 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalCompleted = allWorkouts?.filter((w: any) => w.completed).length || 0;
  const completionRate = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;

  // Get current streak
  let currentStreak = 0;
  const today = new Date();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sortedCompletions = completions?.sort((a: any, b: any) =>
    new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
  ) || [];

  if (sortedCompletions.length > 0) {
    const lastWorkout = new Date(sortedCompletions[0].completed_at);
    const daysSinceLastWorkout = Math.floor((today.getTime() - lastWorkout.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceLastWorkout <= 1) {
      currentStreak = 1;
      let checkDate = new Date(lastWorkout);

      for (let i = 1; i < sortedCompletions.length; i++) {
        const workoutDate = new Date(sortedCompletions[i].completed_at);
        const dayDiff = Math.floor((checkDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));

        if (dayDiff <= 1) {
          currentStreak++;
          checkDate = workoutDate;
        } else {
          break;
        }
      }
    }
  }

  // Get workout history using the new RPC function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: workoutHistory } = await (supabase as any).rpc('get_user_workout_history', {
    p_user_id: user.id,
    p_limit: 50,
    p_offset: 0
  });

  return (
    <div className="min-h-screen bg-iron-black">
      <header className="border-b border-iron-gray">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="font-heading text-4xl text-iron-orange">PROGRESS</h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <ProgressClient
          completions={completions || []}
          stats={{
            totalCompleted,
            totalScheduled,
            completionRate,
            currentStreak
          }}
        />

        <div className="mt-8">
          <h2 className="font-heading text-2xl text-iron-white mb-4">WORKOUT HISTORY</h2>
          <WorkoutHistoryClient
            initialHistory={workoutHistory || []}
            userId={user.id}
          />
        </div>
      </div>
    </div>
  );
}