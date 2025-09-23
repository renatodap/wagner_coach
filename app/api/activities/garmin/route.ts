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
      console.log(`[Garmin Sync] Received request to save ${activities?.length || 0} activities`);
      console.log(`[Garmin Sync] User ID: ${user.id}`);

      // Save activities to database
      const savedActivities = [];
      const errors = [];

      if (!activities || activities.length === 0) {
        console.log('[Garmin Sync] No activities provided in request');
        return NextResponse.json({
          success: false,
          error: 'No activities to sync'
        }, { status: 400 });
      }

      console.log(`[Garmin Sync] Processing ${activities.length} activities...`);

      for (const activity of activities) {
        try {
          // Convert activity to our format - matching the actual database schema
          const activityData = {
            user_id: user.id,
            source: 'garmin',
            external_id: String(activity.activityId),
            name: activity.activityName || 'Unnamed Activity',
            activity_type: activity.activityType?.typeKey || 'other',
            sport_type: activity.activityType?.typeKey || null,
            start_date: activity.startTimeLocal || activity.startTimeGMT,
            timezone: activity.timeZoneId || null,
            utc_offset: activity.beginTimestamp ?
              Math.round((new Date(activity.startTimeLocal).getTime() - activity.beginTimestamp) / 1000) : null,

            // Time metrics
            elapsed_time_seconds: Math.round(activity.elapsedDuration || activity.duration || 0),
            moving_time_seconds: Math.round(activity.movingDuration || activity.duration || 0),

            // Distance and speed
            distance_meters: activity.distance || null,
            average_speed: activity.averageSpeed ? (activity.averageSpeed / 3.6) : null, // Convert km/h to m/s
            max_speed: activity.maxSpeed ? (activity.maxSpeed / 3.6) : null, // Convert km/h to m/s

            // Elevation
            total_elevation_gain: activity.elevationGain || null,
            total_elevation_loss: activity.elevationLoss || null,
            elevation_high: activity.maxElevation || null,
            elevation_low: activity.minElevation || null,

            // Heart rate
            average_heartrate: activity.averageHR || null,
            max_heartrate: activity.maxHR || null,
            min_heartrate: activity.minHR || null,

            // Power metrics
            average_power: activity.averagePower || null,
            max_power: activity.maxPower || null,
            normalized_power: activity.normPower || null,
            intensity_factor: activity.intensityFactor || null,
            tss: activity.trainingStressScore || null,
            kilojoules: activity.kiloCalories ? (activity.kiloCalories * 4.184) : null, // Convert kcal to kJ

            // Cadence
            average_cadence: activity.averageCadence ||
                           activity.averageRunningCadenceInStepsPerMinute ||
                           activity.averageBikingCadenceInRevPerMinute || null,
            max_cadence: activity.maxRunningCadenceInStepsPerMinute ||
                        activity.maxBikingCadenceInRevPerMinute || null,

            // Running specific
            average_stride_length: activity.avgStrideLength ? (activity.avgStrideLength / 100) : null, // cm to m
            average_vertical_oscillation: activity.avgVerticalOscillation || null,
            average_ground_contact_time: activity.avgGroundContactTime || null,
            average_ground_contact_balance: activity.avgGroundContactBalance || null,
            average_vertical_ratio: activity.avgVerticalRatio || null,

            // Swimming specific
            pool_length: activity.poolLength || null,
            total_strokes: activity.strokes || null,
            average_swolf: activity.avgSwolf || null,
            lap_count: activity.lapCount || null,

            // Performance metrics
            calories: activity.calories || null,
            training_load: activity.trainingLoad || null,
            aerobic_training_effect: activity.aerobicTrainingEffect || null,
            anaerobic_training_effect: activity.anaerobicTrainingEffect || null,
            recovery_time_hours: activity.recoveryTimeMinutes ?
              Math.round(activity.recoveryTimeMinutes / 60) : null,
            vo2max_estimate: activity.vO2MaxValue || null,

            // Device info
            device_name: activity.deviceName || null,

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
            console.log(`[Garmin Sync] Insert error for activity ${activity.activityId}:`, error.code, error.message);

            // Try update if insert fails (for duplicates)
            if (error.code === '23505' || error.message?.includes('duplicate')) {
              console.log(`[Garmin Sync] Attempting update for duplicate activity ${activity.activityId}`);

              const { data: updateData, error: updateError } = await supabase
                .from('activities')
                .update(activityData)
                .eq('user_id', user.id)
                .eq('source', 'garmin')
                .eq('external_id', String(activity.activityId))
                .select()
                .single();

              if (!updateError && updateData) {
                console.log(`[Garmin Sync] Successfully updated activity ${activity.activityId}`);
                savedActivities.push(updateData);
              } else if (updateError) {
                console.error(`[Garmin Sync] Update failed for activity ${activity.activityId}:`, updateError);
                errors.push(`Activity ${activity.activityId}: ${updateError.message}`);
              }
            } else {
              console.error(`[Garmin Sync] Failed to insert activity ${activity.activityId}:`, error);
              errors.push(`Activity ${activity.activityId}: ${error.message}`);
            }
          } else {
            console.log(`[Garmin Sync] Successfully saved activity ${activity.activityId}`);
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

      console.log(`[Garmin Sync] Sync complete: ${savedActivities.length} saved, ${errors.length} errors out of ${activities.length} total`);
      if (errors.length > 0) {
        console.log('[Garmin Sync] First 5 errors:', errors.slice(0, 5));
      }

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