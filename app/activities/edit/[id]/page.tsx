import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EditActivityForm from './EditActivityForm';

export default async function EditActivityPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth');
  }

  // Fetch the activity
  const { data: activity, error: activityError } = await supabase
    .from('activities')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (activityError || !activity) {
    redirect('/activities');
  }

  // Fetch user's custom workouts for linking
  const { data: customWorkouts } = await supabase
    .from('user_custom_workouts')
    .select('id, name, type')
    .eq('user_id', user.id)
    .order('name');

  // Fetch standard workouts
  const { data: standardWorkouts } = await supabase
    .from('workouts')
    .select('id, name, type')
    .order('name');

  return (
    <EditActivityForm
      activity={activity}
      userId={user.id}
      customWorkouts={customWorkouts || []}
      standardWorkouts={standardWorkouts || []}
    />
  );
}