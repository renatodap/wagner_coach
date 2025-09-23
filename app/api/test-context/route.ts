import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getConsolidatedUserContext } from '@/lib/ai/rag';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('[TEST] Checking for user:', user.id);

    // First, let's check if activities exist
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('id, name, activity_type, source, start_date, calories, distance_meters, elapsed_time_seconds')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false })
      .limit(10);

    console.log('[TEST] Activities query result:', {
      count: activities?.length || 0,
      error: activitiesError
    });

    // Try the RPC function
    let rpcResult = null;
    let rpcError = null;
    try {
      const { data, error } = await supabase
        .rpc('get_rag_context_for_user', {
          p_user_id: user.id
        })
        .single();

      rpcResult = data;
      rpcError = error;
    } catch (e) {
      rpcError = e;
    }

    console.log('[TEST] RPC result:', {
      hasData: !!rpcResult,
      error: rpcError,
      activitiesInRPC: rpcResult?.strava_activities?.length || 0
    });

    // Get context through our function
    const context = await getConsolidatedUserContext(user.id, 'test');

    return NextResponse.json({
      success: true,
      userId: user.id,
      directActivities: {
        count: activities?.length || 0,
        sample: activities?.[0] || null,
        error: activitiesError?.message
      },
      rpcFunction: {
        works: !rpcError,
        error: rpcError?.message,
        activitiesCount: rpcResult?.strava_activities?.length || 0,
        sampleActivity: rpcResult?.strava_activities?.[0] || null
      },
      contextFunction: {
        hasProfile: !!context.profile,
        activitiesCount: context.stravaActivities?.length || 0,
        nutritionStats: context.nutritionStats,
        workoutStats: context.workoutStats
      },
      debugInfo: {
        allActivities: activities || [],
        rpcActivities: rpcResult?.strava_activities || [],
        contextActivities: context.stravaActivities || []
      }
    });

  } catch (error) {
    console.error('[TEST] Error:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}