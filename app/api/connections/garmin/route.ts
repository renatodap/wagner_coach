import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Garmin integration status
    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'garmin')
      .single();

    return NextResponse.json({
      connected: !!integration && integration.is_active,
      last_sync: integration?.last_sync_at,
      email: integration?.provider_email
    });

  } catch (error) {
    console.error('Error checking Garmin connection:', error);
    return NextResponse.json({ error: 'Failed to check connection' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    console.log(`[Garmin Connect] Saving connection for user ${user.id}`);

    // Store connection in integrations table
    // Note: In production, password should be encrypted using a secrets management service
    const { error: upsertError } = await supabase
      .from('integrations')
      .upsert({
        user_id: user.id,
        provider: 'garmin',
        provider_email: email,
        access_token: password, // TODO: Encrypt this in production!
        is_active: true,
        connected_at: new Date().toISOString(),
        last_sync_at: null,
        sync_enabled: true,
        sync_settings: {
          sync_sleep: true,
          sync_hrv: true,
          sync_stress: true,
          sync_activities: true,
          auto_sync: true
        },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,provider'
      });

    if (upsertError) {
      console.error('[Garmin Connect] Failed to save connection:', upsertError);
      return NextResponse.json({
        error: 'Failed to save connection',
        details: upsertError.message
      }, { status: 500 });
    }

    console.log(`[Garmin Connect] Connection saved successfully`);

    return NextResponse.json({
      success: true,
      message: 'Successfully connected to Garmin'
    });

  } catch (error) {
    console.error('[Garmin Connect] Error:', error);
    return NextResponse.json({
      error: 'Failed to connect',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[Garmin Disconnect] Removing connection for user ${user.id}`);

    // Delete Garmin integration
    const { error: deleteError } = await supabase
      .from('integrations')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', 'garmin');

    if (deleteError) {
      console.error('[Garmin Disconnect] Failed:', deleteError);
      return NextResponse.json({
        error: 'Failed to disconnect',
        details: deleteError.message
      }, { status: 500 });
    }

    console.log(`[Garmin Disconnect] Successfully disconnected`);

    return NextResponse.json({
      success: true,
      message: 'Disconnected from Garmin'
    });

  } catch (error) {
    console.error('[Garmin Disconnect] Error:', error);
    return NextResponse.json({
      error: 'Failed to disconnect',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}