import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  // Webhook verification for Strava
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  console.log('Strava webhook verification:', { mode, token, challenge });

  if (mode === 'subscribe' && token === process.env.STRAVA_VERIFY_TOKEN) {
    console.log('Webhook verified successfully');
    return NextResponse.json({ 'hub.challenge': challenge });
  }

  console.log('Webhook verification failed');
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  // Handle real-time activity updates from Strava
  try {
    const event = await request.json();
    console.log('Strava webhook received:', event);

    // Store the webhook event for debugging
    const supabase = createClient();
    await supabase.from('webhook_events').insert({
      source: 'strava',
      event_type: event.aspect_type,
      object_type: event.object_type,
      object_id: event.object_id?.toString(),
      athlete_id: event.owner_id,
      payload: event,
    });

    // Process activity creation events
    if (event.aspect_type === 'create' && event.object_type === 'activity') {
      await processNewActivity(event.owner_id, event.object_id);
    }

    // Process activity updates
    if (event.aspect_type === 'update' && event.object_type === 'activity') {
      await processActivityUpdate(event.owner_id, event.object_id);
    }

    // Process activity deletions
    if (event.aspect_type === 'delete' && event.object_type === 'activity') {
      await processActivityDeletion(event.owner_id, event.object_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function processNewActivity(athleteId: number, activityId: number) {
  const supabase = createClient();

  try {
    // Find the user by athlete ID
    const { data: connection } = await supabase
      .from('strava_connections')
      .select('user_id, access_token')
      .eq('strava_athlete_id', athleteId)
      .single();

    if (!connection) {
      console.log(`No connection found for athlete ${athleteId}`);
      return;
    }

    // Check if user has auto-sync enabled
    const { data: settings } = await supabase
      .from('user_settings')
      .select('auto_sync_activities')
      .eq('user_id', connection.user_id)
      .single();

    if (settings?.auto_sync_activities === false) {
      console.log(`Auto-sync disabled for user ${connection.user_id}`);
      return;
    }

    // Fetch the activity details from Strava
    const response = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
      headers: { 'Authorization': `Bearer ${connection.access_token}` }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch activity: ${response.status}`);
    }

    const activityData = await response.json();

    // Import the activity
    await supabase.rpc('import_strava_activity', {
      p_user_id: connection.user_id,
      p_activity_data: activityData
    });

    console.log(`Successfully imported new activity ${activityId} for user ${connection.user_id}`);
  } catch (error) {
    console.error(`Failed to process new activity ${activityId}:`, error);
  }
}

async function processActivityUpdate(athleteId: number, activityId: number) {
  // Similar to processNewActivity, but for updates
  console.log(`Processing activity update: athlete ${athleteId}, activity ${activityId}`);
  // For now, just re-import the activity which will update it
  await processNewActivity(athleteId, activityId);
}

async function processActivityDeletion(athleteId: number, activityId: number) {
  const supabase = createClient();

  try {
    // Find the user by athlete ID
    const { data: connection } = await supabase
      .from('strava_connections')
      .select('user_id')
      .eq('strava_athlete_id', athleteId)
      .single();

    if (!connection) {
      console.log(`No connection found for athlete ${athleteId}`);
      return;
    }

    // Delete the activity from our database
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('user_id', connection.user_id)
      .eq('source', 'strava')
      .eq('external_id', activityId.toString());

    if (error) {
      throw error;
    }

    console.log(`Successfully deleted activity ${activityId} for user ${connection.user_id}`);
  } catch (error) {
    console.error(`Failed to process activity deletion ${activityId}:`, error);
  }
}