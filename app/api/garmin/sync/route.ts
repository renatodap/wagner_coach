import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
      // Try to get from stored connection
      const { data: connection } = await supabase
        .from('garmin_connections')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!connection) {
        return NextResponse.json({ error: 'No Garmin credentials provided' }, { status: 400 });
      }

      // Use stored credentials (should be decrypted in production)
      const storedEmail = connection.garmin_email;
      const storedPassword = connection.encrypted_password;

      if (!storedEmail || !storedPassword) {
        return NextResponse.json({ error: 'Invalid stored credentials' }, { status: 400 });
      }

      return syncWithPython(storedEmail, storedPassword, user.id, supabase);
    }

    return syncWithPython(email, password, user.id, supabase);

  } catch (error) {
    console.error('Garmin sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

async function syncWithPython(email: string, password: string, userId: string, supabase: any) {
  try {
    // Create Python script to fetch activities
    const pythonScript = `
import json
import sys
from datetime import datetime, timedelta
from garminconnect import Garmin

try:
    # Login to Garmin
    garmin = Garmin('${email.replace(/'/g, "\\'")}', '${password.replace(/'/g, "\\'")}')
    garmin.login()

    # Get activities from last 30 days
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=30)

    activities = garmin.get_activities_by_date(
        start_date.isoformat(),
        end_date.isoformat()
    )

    # Process activities
    processed = []
    for activity in activities:
        processed.append({
            'activityId': str(activity.get('activityId', '')),
            'activityName': activity.get('activityName', ''),
            'activityType': activity.get('activityType', {}),
            'eventType': activity.get('eventType', {}),
            'startTimeLocal': activity.get('startTimeLocal'),
            'startTimeGMT': activity.get('startTimeGMT'),
            'duration': activity.get('duration', 0),
            'elapsedDuration': activity.get('elapsedDuration', 0),
            'movingDuration': activity.get('movingDuration', 0),
            'distance': activity.get('distance', 0),
            'averageSpeed': activity.get('averageSpeed', 0),
            'maxSpeed': activity.get('maxSpeed', 0),
            'averageHR': activity.get('averageHR'),
            'maxHR': activity.get('maxHR'),
            'calories': activity.get('calories'),
            'elevationGain': activity.get('elevationGain'),
            'elevationLoss': activity.get('elevationLoss'),
            'averagePower': activity.get('averagePower'),
            'maxPower': activity.get('maxPower'),
            'averageCadence': activity.get('averageRunningCadenceInStepsPerMinute') or activity.get('averageBikingCadenceInRevPerMinute'),
            'deviceName': activity.get('deviceName'),
            'raw_data': activity
        })

    print(json.dumps({'success': True, 'activities': processed}))

except Exception as e:
    print(json.dumps({'success': False, 'error': str(e)}))
    sys.exit(1)
`;

    // Execute Python script
    const { stdout, stderr } = await execAsync(
      `python -c "${pythonScript.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`,
      {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large activity lists
        timeout: 30000 // 30 second timeout
      }
    );

    if (stderr) {
      console.error('Python stderr:', stderr);
    }

    const result = JSON.parse(stdout);

    if (!result.success) {
      return NextResponse.json({
        error: 'Failed to fetch Garmin activities',
        details: result.error
      }, { status: 400 });
    }

    // Process and save activities
    let syncedCount = 0;
    let duplicates = 0;
    const errors: string[] = [];

    for (const activity of result.activities) {
      try {
        const { data, error } = await supabase.rpc('import_garmin_activity', {
          p_user_id: userId,
          p_activity_data: activity
        });

        if (!error) {
          syncedCount++;
        } else if (error.message?.includes('duplicate')) {
          duplicates++;
        } else {
          errors.push(`Activity ${activity.activityId}: ${error.message}`);
        }
      } catch (err) {
        console.error('Activity import error:', err);
        errors.push(`Activity ${activity.activityId}: ${err}`);
      }
    }

    // Update last sync time
    await supabase
      .from('garmin_connections')
      .upsert({
        user_id: userId,
        garmin_email: email,
        encrypted_password: password, // Should be encrypted in production
        last_sync: new Date().toISOString(),
        is_active: true,
        updated_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      syncedCount,
      duplicates,
      totalActivities: result.activities.length,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
      message: `Synced ${syncedCount} new activities from Garmin (${duplicates} duplicates skipped)`
    });

  } catch (error: any) {
    console.error('Python execution error:', error);

    // Check if it's a Python/library issue
    if (error.message?.includes('ModuleNotFoundError')) {
      return NextResponse.json({
        error: 'Garmin library not installed',
        details: 'Please run: pip install garminconnect'
      }, { status: 503 });
    }

    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      return NextResponse.json({
        error: 'Invalid Garmin credentials',
        details: 'Please check your email and password'
      }, { status: 401 });
    }

    return NextResponse.json({
      error: 'Failed to sync with Garmin',
      details: error.message
    }, { status: 500 });
  }
}