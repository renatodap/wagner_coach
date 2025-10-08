import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ActivitiesDailyClient from './ActivitiesDailyClient';

export default async function ActivitiesDailyPage() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth');
  }

  return <ActivitiesDailyClient />;
}
