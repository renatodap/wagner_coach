import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Simple encryption for passwords (use proper encryption in production)
function encrypt(text: string): string {
  return Buffer.from(text).toString('base64');
}

function decrypt(text: string): string {
  return Buffer.from(text, 'base64').toString('utf-8');
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, email, password, activities } = await request.json();

    if (action === 'connect') {
      // Store encrypted credentials
      const { error: upsertError } = await supabase
        .from('garmin_connections')
        .upsert({
          user_id: user.id,
          garmin_email: email,
          encrypted_password: encrypt(password),
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (upsertError) {
        console.error('Failed to save Garmin connection:', upsertError);
        return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Garmin connected' });
    }

    if (action === 'sync') {
      console.log(`Saving ${activities?.length || 0} activities to database`);

      // Save activities to database
      const savedActivities = [];
      const errors = [];

      if (!activities || activities.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No activities to sync'
        }, { status: 400 });
      }

      for (const activity of activities) {
        try {
          // Convert activity to our format
          const activityData = {
            user_id: user.id,
            source: 'garmin',
            external_id: String(activity.activityId),
            name: activity.activityName || 'Unnamed Activity',
            activity_type: activity.activityType?.typeKey || 'other',
            start_time: activity.startTimeLocal || activity.startTimeGMT,
            duration: Math.round(activity.duration || 0),
            distance: activity.distance || null,
            calories: activity.calories || null,
            avg_heart_rate: activity.averageHR || null,
            max_heart_rate: activity.maxHR || null,
            elevation_gain: activity.elevationGain || null,
            avg_speed: activity.averageSpeed || null,
            max_speed: activity.maxSpeed || null,
            avg_cadence: activity.averageCadence || null,
            raw_data: activity,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { data, error } = await supabase
            .from('activities')
            .insert(activityData)
            .select()
            .single();

          if (error) {
            // Try update if insert fails (for duplicates)
            if (error.code === '23505' || error.message?.includes('duplicate')) {
              const { data: updateData, error: updateError } = await supabase
                .from('activities')
                .update(activityData)
                .eq('user_id', user.id)
                .eq('source', 'garmin')
                .eq('external_id', String(activity.activityId))
                .select()
                .single();

              if (!updateError && updateData) {
                savedActivities.push(updateData);
              } else if (updateError) {
                console.error('Update error:', updateError);
                errors.push(`Activity ${activity.activityId}: ${updateError.message}`);
              }
            } else {
              console.error('Insert error:', error);
              errors.push(`Activity ${activity.activityId}: ${error.message}`);
            }
          } else {
            savedActivities.push(data);
          }
        } catch (err) {
          console.error('Error saving activity:', err);
          errors.push(`Activity ${activity.activityId}: ${err}`);
        }
      }

      // Update last sync time
      await supabase
        .from('garmin_connections')
        .update({
          last_sync: new Date().toISOString()
        })
        .eq('user_id', user.id);

      return NextResponse.json({
        success: true,
        savedCount: savedActivities.length,
        totalCount: activities.length,
        errors: errors.length > 0 ? errors.slice(0, 5) : undefined
      });
    }

    if (action === 'disconnect') {
      const { error } = await supabase
        .from('garmin_connections')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'status') {
      const { data: connection } = await supabase
        .from('garmin_connections')
        .select('*')
        .eq('user_id', user.id)
        .single();

      return NextResponse.json({
        connected: !!connection,
        email: connection?.garmin_email,
        lastSync: connection?.last_sync
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Garmin API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get connection status and credentials
    const { data: connection } = await supabase
      .from('garmin_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!connection) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      email: connection.garmin_email,
      password: decrypt(connection.encrypted_password),
      lastSync: connection.last_sync
    });

  } catch (error) {
    console.error('Garmin status error:', error);
    return NextResponse.json({ connected: false });
  }
}