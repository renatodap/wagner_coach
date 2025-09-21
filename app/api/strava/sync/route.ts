import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { StravaApiClient, refreshStravaToken, StravaActivity } from '@/lib/strava-api';

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
    // Get fresh access token
    const accessToken = await refreshStravaToken(user.id);

    if (!accessToken) {
      return NextResponse.json({
        error: 'No Strava connection found. Please connect your account first.'
      }, { status: 400 });
    }

    const stravaClient = new StravaApiClient(accessToken);

    // Get sync options from request body
    const body = await request.json().catch(() => ({}));
    const {
      syncType = 'recent', // 'recent', 'all', 'range'
      days = 30,
      startDate,
      endDate,
      perPage = 50
    } = body;

    let activities: StravaActivity[] = [];

    if (syncType === 'all') {
      // Fetch ALL activities from user's complete history
      console.log('Starting full history sync...');
      activities = await stravaClient.getAllActivities((progress) => {
        console.log(`Sync progress: ${progress.fetched} activities fetched (page ${progress.page})`);
        if (progress.lastActivityDate) {
          console.log(`Latest activity date: ${progress.lastActivityDate}`);
        }
      });
    } else if (syncType === 'range' && startDate) {
      // Fetch activities within a specific date range
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date();
      console.log(`Syncing activities between ${start.toISOString()} and ${end.toISOString()}`);

      activities = await stravaClient.getAllActivitiesBetween(start, end, (progress) => {
        console.log(`Range sync progress: ${progress.fetched} activities fetched (page ${progress.page})`);
        console.log(`Date range: ${progress.dateRange}`);
      });
    } else {
      // Default: fetch recent activities (original behavior)
      const activitiesPerPage = Math.min(perPage, 200); // Strava limit
      const fetchedActivities = await stravaClient.getActivities(1, activitiesPerPage);

      // Filter activities by date if specified
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      activities = fetchedActivities.filter((activity: { start_date: string }) =>
        new Date(activity.start_date) >= cutoffDate
      );
    }

    const filteredActivities = activities;

    // Import activities using the new unified sync endpoint
    const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/activities/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify({
        activities: filteredActivities,
        source: 'strava'
      })
    });

    if (!syncResponse.ok) {
      throw new Error('Failed to sync activities to database');
    }

    const syncResult = await syncResponse.json();
    const syncedCount = syncResult.processed || 0;
    const errorCount = syncResult.errors || 0;
    const errors = syncResult.details?.errors || [];

    // Update last sync timestamp
    await supabase.from('strava_connections')
      .update({ last_sync_at: new Date() })
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      sync_type: syncType,
      total_activities: filteredActivities.length,
      activities_synced: syncedCount,
      errors: errorCount,
      error_details: errors.length > 0 ? errors.slice(0, 5) : undefined, // Limit error details
      sync_period_days: syncType === 'recent' ? days : null,
      oldest_activity: filteredActivities.length > 0 ? filteredActivities[filteredActivities.length - 1]?.start_date : null,
      newest_activity: filteredActivities.length > 0 ? filteredActivities[0]?.start_date : null,
      sync_duration_ms: Date.now() - new Date().getTime()
    });
  } catch (error) {
    console.error('Strava sync error:', error);

    // Provide helpful error messages
    let errorMessage = 'Sync failed';
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        errorMessage = 'Strava authorization expired. Please reconnect your account.';
      } else if (error.message.includes('403')) {
        errorMessage = 'Strava API rate limit exceeded. Please try again later.';
      } else if (error.message.includes('429')) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json({
      error: errorMessage,
      technical_error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}