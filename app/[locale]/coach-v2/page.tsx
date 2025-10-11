/**
 * Coach V2 - Minimal Test Page
 *
 * Stripped-down coach interface to test mobile button functionality.
 * Built from scratch with zero legacy code to isolate touch issues.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SimpleChatClient } from '@/components/CoachV2/SimpleChatClient'

export const metadata = {
  title: 'Coach V2 (Test) | Wagner Coach',
  description: 'Minimal coach interface for mobile testing',
}

export default async function CoachV2Page() {
  // Get authenticated user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <SimpleChatClient />
}
