import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import WorkoutsDailyClient from './WorkoutsDailyClient';

export default async function WorkoutsDailyPage() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth');
  }

  return <WorkoutsDailyClient />;
}
