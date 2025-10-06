/**
 * Unified Coach Page
 *
 * Single interface for AI Coach - replaces AI Chat + Quick Entry.
 * Auto-detects chat vs logging with proactive assistance.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UnifiedCoachClient } from '@/components/Coach/UnifiedCoachClient'

export const metadata = {
  title: 'Coach | Wagner Coach',
  description: 'Your AI fitness and nutrition coach - chat, log meals, track workouts, all in one place',
}

export default async function CoachPage() {
  // Get authenticated user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // TODO: Load most recent conversation ID (Phase 2 - conversation history)
  // For now, always start new conversation
  const initialConversationId = null

  return (
    <UnifiedCoachClient
      userId={user.id}
      initialConversationId={initialConversationId}
    />
  )
}
