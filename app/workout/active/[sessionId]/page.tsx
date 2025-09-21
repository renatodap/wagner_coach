import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ActiveWorkoutClient from './ActiveWorkoutClient';

interface PageParams {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function ActiveWorkoutPage({ params }: PageParams) {
  const resolvedParams = await params;
  const sessionId = parseInt(resolvedParams.sessionId);
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth');
  }

  // Get session details
  const { data: session } = await supabase
    .from('active_workout_sessions')
    .select('*, workouts(name)')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single() as { data: { workouts: { name: string } } | null };

  if (!session) {
    redirect('/dashboard');
  }

  // Get exercises for this session using RPC function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: exercises } = await (supabase as any).rpc('get_session_exercises', {
    p_session_id: sessionId
  });

  return (
    <ActiveWorkoutClient
      sessionId={sessionId}
      workoutName={session.workouts?.name || 'Workout'}
      exercises={exercises || []}
    />
  );
}