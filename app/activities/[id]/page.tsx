import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ActivityDetailClient from './ActivityDetailClient';

export default async function ActivityDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth');
  }

  // Fetch activity data
  const { data: activity, error: activityError } = await supabase
    .from('activities')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (activityError || !activity) {
    redirect('/activities');
  }

  return <ActivityDetailClient activity={activity} />;
}