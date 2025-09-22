import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ManualActivityForm from './ManualActivityForm';

export default async function AddActivityPage() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth');
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
    <ManualActivityForm
      userId={user.id}
      customWorkouts={customWorkouts || []}
      standardWorkouts={standardWorkouts || []}
    />
  );
}