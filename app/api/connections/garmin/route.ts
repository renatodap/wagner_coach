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

    // For now, we'll test the credentials directly with garminconnect
    // since the Python API server might not be running
    try {
      // Try a simple test import of the Python library
      const { execSync } = require('child_process');

      // Create a test Python script inline
      const testScript = `
import sys
import json
from garminconnect import Garmin

try:
    garmin = Garmin('${email}', '${password.replace(/'/g, "\\'")}')
    garmin.login()
    print(json.dumps({"success": True}))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`;

      const result = execSync(`python -c "${testScript.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, {
        encoding: 'utf8',
        maxBuffer: 1024 * 1024
      });

      const testResult = JSON.parse(result);

      if (!testResult.success) {
        return NextResponse.json({
          error: 'Failed to connect to Garmin',
          details: testResult.error
        }, { status: 400 });
      }

    } catch (error: any) {
      // If Python execution fails, try the API endpoint as fallback
      console.log('Direct Python test failed, trying API endpoint...');

      const testResponse = await fetch(`${process.env.GARMIN_API_URL || 'http://localhost:3001'}/api/v1/garmin/test-connection`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }).catch(() => null);

      if (!testResponse || !testResponse.ok) {
        return NextResponse.json({
          error: 'Garmin API not available. Please ensure Python and garminconnect are installed.',
          details: 'Run: pip install garminconnect'
        }, { status: 503 });
      }

      // Try to validate credentials via API
      const syncResponse = await fetch(`${process.env.GARMIN_API_URL || 'http://localhost:3001'}/api/v1/garmin/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          userId: user.id,
          daysBack: 1
        })
      });

      if (!syncResponse.ok) {
        const errorData = await syncResponse.json();
        return NextResponse.json({
          error: errorData.error || 'Failed to connect to Garmin',
          details: errorData.details
        }, { status: 400 });
      }
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