import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get the connection first to revoke the token
    const { data: connection } = await supabase
      .from('strava_connections')
      .select('access_token')
      .eq('user_id', user.id)
      .single();

    // Revoke the Strava token
    if (connection?.access_token) {
      try {
        await fetch('https://www.strava.com/oauth/deauthorize', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${connection.access_token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (revokeError) {
        console.error('Failed to revoke Strava token:', revokeError);
        // Continue with local cleanup even if revoke fails
      }
    }

    // Delete the connection from our database
    const { error: deleteError } = await supabase
      .from('strava_connections')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Failed to delete Strava connection:', deleteError);
      return NextResponse.json({
        error: 'Failed to disconnect from Strava'
      }, { status: 500 });
    }

    // Optionally, mark Strava activities as disconnected rather than deleting them
    // This preserves user's historical data
    await supabase
      .from('activities')
      .update({
        notes: 'Imported from Strava (connection now removed)',
        updated_at: new Date()
      })
      .eq('user_id', user.id)
      .eq('source', 'strava');

    return NextResponse.json({
      success: true,
      message: 'Successfully disconnected from Strava'
    });
  } catch (error) {
    console.error('Strava disconnect error:', error);
    return NextResponse.json({
      error: 'Failed to disconnect from Strava'
    }, { status: 500 });
  }
}