import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ProfileStats {
  totalWorkouts: number;
  currentStreak: number;
  goalsCompleted: number;
  totalMinutes: number;
  favoriteActivity: string;
  progressThisWeek: number;
}

interface ActivityItem {
  id: string;
  type: 'workout' | 'goal_update' | 'achievement';
  description: string;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404 }
        );
      }
      throw profileError;
    }

    // Calculate stats using database functions
    const { data: statsData, error: statsError } = await supabase
      .rpc('calculate_user_stats', { user_id: user.id });

    const stats: ProfileStats = statsData || {
      totalWorkouts: 0,
      currentStreak: 0,
      goalsCompleted: 0,
      totalMinutes: 0,
      favoriteActivity: 'Not enough data',
      progressThisWeek: 0
    };

    // Fetch recent activity
    const { data: recentActivity, error: activityError } = await supabase
      .from('user_activity')
      .select('id, type, description, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const activity: ActivityItem[] = recentActivity || [];

    // Generate AI recommendations (if needed)
    const recommendations = await generateRecommendations(user.id, profile, stats);

    return NextResponse.json({
      profile,
      stats,
      recentActivity: activity,
      recommendations
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateRecommendations(userId: string, profile: any, stats: ProfileStats) {
  const recommendations = [];

  // Goal-based recommendations
  if (stats.goalsCompleted === 0 && stats.totalWorkouts > 5) {
    recommendations.push({
      type: 'goal',
      title: 'Set Your First Goal',
      description: 'You\'ve been consistent with workouts! Time to set a specific goal.',
      action: 'add_goal',
      priority: 'high',
      basedOn: ['workout_consistency']
    });
  }

  // Streak-based recommendations
  if (stats.currentStreak >= 7) {
    recommendations.push({
      type: 'recovery',
      title: 'Consider a Rest Day',
      description: 'Great streak! Make sure to include recovery in your routine.',
      action: 'schedule_rest',
      priority: 'medium',
      basedOn: ['streak_length']
    });
  }

  // Progress-based recommendations
  if (stats.progressThisWeek < 50) {
    recommendations.push({
      type: 'workout',
      title: 'Boost Your Week',
      description: 'You\'re behind on this week\'s progress. A quick workout can help!',
      action: 'quick_workout',
      priority: 'medium',
      basedOn: ['weekly_progress']
    });
  }

  return recommendations;
}