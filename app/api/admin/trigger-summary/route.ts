/**
 * Manual Trigger for Summarization
 * For testing and manual runs
 */

import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, weekStart } = await request.json();

    // Use current user if no userId specified
    const targetUserId = userId || user.id;

    // Calculate week start if not provided
    const weekStartDate = weekStart
      ? new Date(weekStart)
      : (() => {
          const date = new Date();
          date.setDate(date.getDate() - 7);
          date.setHours(0, 0, 0, 0);
          return date;
        })();

    // Call the stored procedure
    const { data, error } = await supabase.rpc('generate_weekly_summary', {
      p_user_id: targetUserId,
      p_week_start: weekStartDate.toISOString().split('T')[0],
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Summary generated successfully',
      weekStart: weekStartDate.toISOString(),
      userId: targetUserId,
    });
  } catch (error) {
    console.error('Summary generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary', details: error },
      { status: 500 }
    );
  }
}

// GET endpoint to view summaries
export async function GET(request: Request) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all summaries for the user
    const { data: summaries, error } = await supabase
      .from('user_context_summaries')
      .select('*')
      .eq('user_id', user.id)
      .order('period_end', { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      summaries: summaries || [],
      count: summaries?.length || 0,
    });
  } catch (error) {
    console.error('Fetch summaries error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch summaries', details: error },
      { status: 500 }
    );
  }
}