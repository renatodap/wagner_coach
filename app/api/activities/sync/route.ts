import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface GarminActivity {
  activityId?: number;
  activityName?: string;
  activityType?: { typeKey?: string };
  startTimeLocal?: string;
  startTimeGMT?: string;
  duration?: number;
  elapsedDuration?: number;
  movingDuration?: number;
  distance?: number;
  averageSpeed?: number;
  maxSpeed?: number;
  averageHR?: number;
  maxHR?: number;
  calories?: number;
  elevationGain?: number;
  elevationLoss?: number;
  averagePower?: number;
  maxPower?: number;
  aerobicTrainingEffect?: number;
  anaerobicTrainingEffect?: number;
  trainingStressScore?: number;
  intensityFactor?: number;
  vO2MaxValue?: number;
  deviceId?: number;
  sportTypeKey?: string;
  averageRunningCadenceInStepsPerMinute?: number;
}

interface StravaActivity {
  id: number;
  external_id?: string;
  upload_id?: number;
  athlete?: { id: number };
  name: string;
  distance?: number;
  moving_time?: number;
  elapsed_time?: number;
  total_elevation_gain?: number;
  sport_type?: string;
  type?: string;
  start_date?: string;
  start_date_local?: string;
  timezone?: string;
  start_latlng?: number[];
  end_latlng?: number[];
  achievement_count?: number;
  kudos_count?: number;
  comment_count?: number;
  athlete_count?: number;
  photo_count?: number;
  total_photo_count?: number;
  map?: { id: string; summary_polyline?: string; polyline?: string };
  trainer?: boolean;
  commute?: boolean;
  manual?: boolean;
  private?: boolean;
  visibility?: string;
  flagged?: boolean;
  workout_type?: number;
  average_speed?: number;
  max_speed?: number;
  has_kudoed?: boolean;
  hide_from_home?: boolean;
  gear_id?: string;
  kilojoules?: number;
  average_watts?: number;
  device_watts?: boolean;
  max_watts?: number;
  weighted_average_watts?: number;
  description?: string;
  calories?: number;
  average_heartrate?: number;
  max_heartrate?: number;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { activities, source } = await request.json();

    if (!activities || !Array.isArray(activities)) {
      return NextResponse.json({ error: 'Invalid activities data' }, { status: 400 });
    }

    if (!source || !['strava', 'garmin'].includes(source)) {
      return NextResponse.json({ error: 'Invalid source' }, { status: 400 });
    }

    const processedActivities = [];
    const duplicates = [];
    const errors = [];

    for (const activity of activities) {
      try {
        let activityData;

        if (source === 'garmin') {
          activityData = transformGarminActivity(activity, user.id);
        } else if (source === 'strava') {
          activityData = transformStravaActivity(activity, user.id);
        }

        if (!activityData) {
          errors.push({ activity, error: 'Failed to transform activity' });
          continue;
        }

        // Check for duplicates based on external_id and source
        const { data: existingByExternalId } = await supabase
          .from('activities')
          .select('id, name, start_date')
          .eq('user_id', user.id)
          .eq('external_id', activityData.external_id)
          .eq('source', activityData.source)
          .single();

        if (existingByExternalId) {
          duplicates.push({
            external_id: activityData.external_id,
            name: activityData.name,
            existing_id: existingByExternalId.id
          });
          continue;
        }

        // Also check for duplicates based on timestamp similarity (within 1 minute) and activity type
        // This helps catch activities that might be synced from multiple sources
        const startTime = new Date(activityData.start_date);
        const timeWindowStart = new Date(startTime.getTime() - 60000); // 1 minute before
        const timeWindowEnd = new Date(startTime.getTime() + 60000); // 1 minute after

        const { data: existingByTime } = await supabase
          .from('activities')
          .select('id, name, start_date, source')
          .eq('user_id', user.id)
          .eq('activity_type', activityData.activity_type)
          .gte('start_date', timeWindowStart.toISOString())
          .lte('start_date', timeWindowEnd.toISOString());

        if (existingByTime && existingByTime.length > 0) {
          // Check if the duration is similar (within 10%)
          const similarActivity = existingByTime.find(existing => {
            if (!existing || !activityData.elapsed_time_seconds) return false;

            // If it's from the same source but different external_id, it's not a duplicate
            if (existing.source === activityData.source) return false;

            // For now, just mark as potential duplicate based on time
            // In the future, we could compare duration, distance, etc.
            return true;
          });

          if (similarActivity) {
            duplicates.push({
              external_id: activityData.external_id,
              name: activityData.name,
              existing_id: similarActivity.id,
              reason: 'Similar activity found at same time'
            });
            continue;
          }
        }

        // Insert the activity
        const { data: insertedActivity, error: insertError } = await supabase
          .from('activities')
          .insert(activityData)
          .select()
          .single();

        if (insertError) {
          errors.push({ activity, error: insertError.message });
        } else {
          processedActivities.push(insertedActivity);
        }

      } catch (err) {
        errors.push({
          activity,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    // Update sync status for the source
    if (source === 'garmin') {
      // First check if connection exists
      const { data: existing } = await supabase
        .from('garmin_connections')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existing) {
        // Update existing connection
        await supabase
          .from('garmin_connections')
          .update({
            last_sync: new Date().toISOString(),
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      } else {
        // Create new connection
        await supabase
          .from('garmin_connections')
          .insert({
            user_id: user.id,
            last_sync: new Date().toISOString(),
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedActivities.length,
      duplicates: duplicates.length,
      errors: errors.length,
      details: {
        processedActivities: processedActivities.map(a => ({ id: a.id, name: a.name })),
        duplicates,
        errors: errors.slice(0, 10) // Limit error details
      }
    });

  } catch (error) {
    console.error('Error syncing activities:', error);
    return NextResponse.json(
      { error: 'Failed to sync activities' },
      { status: 500 }
    );
  }
}

function transformGarminActivity(activity: GarminActivity, userId: string) {
  if (!activity.activityId || !activity.startTimeLocal) {
    return null;
  }

  const activityType = activity.sportTypeKey || activity.activityType?.typeKey || 'workout';

  return {
    user_id: userId,
    source: 'garmin',
    external_id: activity.activityId.toString(),
    name: activity.activityName || `${activityType} Activity`,
    activity_type: normalizeActivityType(activityType),
    sport_type: activityType,
    start_date: activity.startTimeGMT || activity.startTimeLocal,
    elapsed_time_seconds: activity.elapsedDuration || activity.duration || 0,
    moving_time_seconds: activity.movingDuration,
    distance_meters: activity.distance,
    average_speed: activity.averageSpeed,
    max_speed: activity.maxSpeed,
    average_heartrate: activity.averageHR,
    max_heartrate: activity.maxHR,
    calories: activity.calories,
    total_elevation_gain: activity.elevationGain,
    average_power: activity.averagePower,
    average_cadence: activity.averageRunningCadenceInStepsPerMinute,
    training_load: activity.trainingStressScore,
    raw_data: activity
  };
}

function transformStravaActivity(activity: StravaActivity, userId: string) {
  if (!activity.id || !activity.start_date) {
    return null;
  }

  return {
    user_id: userId,
    source: 'strava',
    external_id: activity.id.toString(),
    name: activity.name,
    activity_type: normalizeActivityType(activity.type || 'workout'),
    sport_type: activity.sport_type || activity.type,
    start_date: activity.start_date,
    elapsed_time_seconds: activity.elapsed_time || 0,
    moving_time_seconds: activity.moving_time,
    distance_meters: activity.distance,
    average_speed: activity.average_speed,
    max_speed: activity.max_speed,
    average_heartrate: activity.average_heartrate,
    max_heartrate: activity.max_heartrate,
    calories: activity.calories || activity.kilojoules ? Math.round((activity.kilojoules || 0) * 0.239) : undefined,
    total_elevation_gain: activity.total_elevation_gain,
    average_power: activity.average_watts,
    start_lat: activity.start_latlng?.[0],
    start_lng: activity.start_latlng?.[1],
    end_lat: activity.end_latlng?.[0],
    end_lng: activity.end_latlng?.[1],
    raw_data: activity
  };
}

function normalizeActivityType(type: string): string {
  const typeMap: Record<string, string> = {
    'running': 'run',
    'cycling': 'ride',
    'biking': 'ride',
    'swimming': 'swim',
    'strength_training': 'strength_training',
    'weight_training': 'strength_training',
    'walking': 'walk',
    'hiking': 'hike',
    'yoga': 'yoga',
    'trail_running': 'trail_run',
    'mountain_biking': 'mountain_bike_ride',
    'open_water_swimming': 'open_water_swim',
  };

  const normalized = type.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  return typeMap[normalized] || normalized;
}