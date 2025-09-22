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

    // Get Garmin connection status
    const { data: connection } = await supabase
      .from('garmin_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      connected: !!connection,
      last_sync: connection?.last_sync,
      email: connection?.garmin_email
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

    // Test the credentials with the Python API
    const testResponse = await fetch(`${process.env.GARMIN_API_URL || 'http://localhost:3001'}/api/garmin/test`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!testResponse.ok) {
      return NextResponse.json({ error: 'Garmin API not available' }, { status: 503 });
    }

    // Try to sync some activities to validate credentials
    const syncResponse = await fetch(`${process.env.GARMIN_API_URL || 'http://localhost:3001'}/api/garmin/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        userId: user.id,
        daysBack: 1 // Just test with 1 day
      })
    });

    if (!syncResponse.ok) {
      const errorData = await syncResponse.json();
      return NextResponse.json({
        error: errorData.error || 'Failed to connect to Garmin',
        details: errorData.details
      }, { status: 400 });
    }

    // Store connection (encrypt password in production!)
    const { error: upsertError } = await supabase
      .from('garmin_connections')
      .upsert({
        user_id: user.id,
        garmin_email: email,
        encrypted_password: password, // Should be encrypted!
        is_active: true,
        last_sync: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (upsertError) {
      return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully connected to Garmin'
    });

  } catch (error) {
    console.error('Error connecting to Garmin:', error);
    return NextResponse.json({ error: 'Failed to connect' }, { status: 500 });
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

    // Delete Garmin connection
    const { error: deleteError } = await supabase
      .from('garmin_connections')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Disconnected from Garmin'
    });

  } catch (error) {
    console.error('Error disconnecting from Garmin:', error);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}