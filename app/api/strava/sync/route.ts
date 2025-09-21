import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { StravaApiClient, refreshStravaToken } from '@/lib/strava-api';

export async function POST(request: NextRequest) {
  const supabase = createClient();

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
    const daysToSync = body.days || 30;
    const activitiesPerPage = Math.min(body.perPage || 50, 200); // Strava limit

    // Fetch recent activities
    const activities = await stravaClient.getActivities(1, activitiesPerPage);

    // Filter activities by date if specified
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToSync);

    const filteredActivities = activities.filter((activity: { start_date: string }) =>
      new Date(activity.start_date) >= cutoffDate
    );

    // Import activities
    let syncedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const activity of filteredActivities) {
      try {
        await supabase.rpc('import_strava_activity', {
          p_user_id: user.id,
          p_activity_data: activity
        });
        syncedCount++;
      } catch (error) {
        errorCount++;
        errors.push(`Activity ${activity.id}: ${error}`);
        console.error(`Failed to import activity ${activity.id}:`, error);
      }
    }

    // Update last sync timestamp
    await supabase.from('strava_connections')
      .update({ last_sync_at: new Date() })
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      total_activities: filteredActivities.length,
      activities_synced: syncedCount,
      errors: errorCount,
      error_details: errors.length > 0 ? errors.slice(0, 5) : undefined, // Limit error details
      sync_period_days: daysToSync
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