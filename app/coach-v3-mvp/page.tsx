/**
 * Coach V3 Page - Server Component with Auth
 *
 * Text-only AI coaching interface built from scratch.
 * No images, no voice, pure conversational AI.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CoachV3Client } from '@/components/CoachV3MVP/CoachV3Client'

export const metadata = {
  title: 'Coach V3 MVP | Wagner Coach',
  description: 'MVP AI-powered fitness and nutrition coaching interface'
}

export default async function CoachV3Page() {
  // Server-side auth check
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <CoachV3Client />
}
