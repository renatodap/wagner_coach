import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(new URL('/auth?error=verification_failed', requestUrl.origin));
    }

    // Get the user to check their profile
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Check if profile exists (it should, thanks to the trigger)
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

      // Redirect based on onboarding status
      if (profile?.onboarding_completed) {
        return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
      } else {
        return NextResponse.redirect(new URL('/auth/onboarding', requestUrl.origin));
      }
    }
  }

  // If no code or user, redirect to auth page
  return NextResponse.redirect(new URL('/auth', requestUrl.origin));
}
