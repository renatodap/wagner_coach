import { createClient } from '@/lib/supabase/client';
import { redirect } from 'next/navigation';
import ActivitiesClient from './ActivitiesClient';

export default async function ActivitiesPage() {
  const supabase = createClient();

  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth');
  }

  return <ActivitiesClient />;
}