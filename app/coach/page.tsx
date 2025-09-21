import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CoachClient from './CoachClient';

export default async function CoachPage() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth');
  }

  // Get user profile for context
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get previous conversations
  const { data: conversations } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1);

  const previousConversation = conversations?.[0] || null;

  return (
    <CoachClient
      userId={user.id}
      profile={profile}
      previousConversation={previousConversation}
    />
  );
}