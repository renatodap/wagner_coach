import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  // CSRF protection
  if (state !== 'strava_connect') {
    return NextResponse.redirect('/settings?error=invalid_state');
  }

  if (error) {
    console.error('Strava OAuth error:', error);
    return NextResponse.redirect('/settings?error=strava_auth_failed');
  }

  if (!code) {
    return NextResponse.redirect('/settings?error=missing_code');
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData);
      return NextResponse.redirect('/settings?error=token_exchange_failed');
    }

    // Create Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: Record<string, unknown>) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('User authentication error:', userError);
      return NextResponse.redirect('/auth?error=authentication_required');
    }

    // Store connection in database
    const { error: insertError } = await supabase.from('strava_connections').upsert({
      user_id: user.id,
      strava_athlete_id: tokenData.athlete.id,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: new Date(tokenData.expires_at * 1000).toISOString(),
      athlete_data: tokenData.athlete,
      scope: tokenData.scope,
      connected_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.redirect('/settings?error=database_error');
    }

    // Trigger initial sync
    try {
      await syncStravaActivities(user.id, tokenData.access_token);
    } catch (syncError) {
      console.error('Initial sync failed:', syncError);
      // Don't fail the connection for sync errors
    }

    return NextResponse.redirect('/settings?connected=strava&sync=started');
  } catch (error) {
    console.error('Strava OAuth error:', error);
    return NextResponse.redirect('/settings?error=strava_connection_failed');
  }
}

async function syncStravaActivities(userId: string, accessToken: string) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get() { return undefined; },
        set() {},
        remove() {},
      },
    }
  );

  try {
    // Get recent activities (last 30)
    const response = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=30', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      throw new Error(`Strava API error: ${response.status}`);
    }

    const activities = await response.json();

    for (const activity of activities) {
      try {
        // Use the import function from our migration
        await supabase.rpc('import_strava_activity', {
          p_user_id: userId,
          p_activity_data: activity
        });
      } catch (activityError) {
        console.error(`Failed to import activity ${activity.id}:`, activityError);
        // Continue with other activities
      }
    }

    console.log(`Successfully synced ${activities.length} activities for user ${userId}`);
  } catch (error) {
    console.error('Sync activities error:', error);
    throw error;
  }
}