import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Sync health data from Garmin Connect
 *
 * This endpoint:
 * 1. Authenticates the user via Supabase
 * 2. Gets stored Garmin credentials from integrations table
 * 3. Forwards the sync request to Python backend with auth token
 * 4. Returns the sync results
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated session
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    const user = session?.user;

    if (authError || !user || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Garmin integration from database
    const { data: integration, error: dbError } = await supabase
      .from('integrations')
      .select('provider_email, access_token, is_active')
      .eq('user_id', user.id)
      .eq('provider', 'garmin')
      .single();

    if (dbError || !integration) {
      return NextResponse.json({
        error: 'Garmin not connected',
        details: 'Please connect your Garmin account first'
      }, { status: 404 });
    }

    if (!integration.is_active) {
      return NextResponse.json({
        error: 'Garmin connection inactive',
        details: 'Please reconnect your Garmin account'
      }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();
    const { days_back = 7 } = body;

    // Forward to Python backend with authentication
    const backendUrl = process.env.GARMIN_BACKEND_URL || 'http://localhost:8000';

    console.log(`[Garmin Sync] Syncing ${days_back} days for user ${user.id}`);

    const response = await fetch(`${backendUrl}/api/v1/garmin/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        email: integration.provider_email,
        password: integration.access_token, // Note: Should be encrypted in production!
        days_back,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[Garmin Sync] Backend error:`, data);
      return NextResponse.json(data, { status: response.status });
    }

    // Update last_sync_at timestamp
    await supabase
      .from('integrations')
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: 'success',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('provider', 'garmin');

    console.log(`[Garmin Sync] Successfully synced ${data.total_synced || 0} records`);

    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('[Garmin Sync] Unexpected error:', error);

    // Try to update sync status to failed
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from('integrations')
          .update({
            last_sync_status: 'failed',
            last_sync_error: error instanceof Error ? error.message : 'Unknown error',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .eq('provider', 'garmin');
      }
    } catch (updateError) {
      console.error('[Garmin Sync] Failed to update sync status:', updateError);
    }

    return NextResponse.json({
      error: 'Failed to sync Garmin data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
