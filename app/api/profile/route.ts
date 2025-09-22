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
    const supabase = await createClient();

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

    // Calculate stats - handle if database function doesn't exist
    let stats: ProfileStats = {
      totalWorkouts: 0,
      currentStreak: 0,
      goalsCompleted: 0,
      totalMinutes: 0,
      favoriteActivity: 'Not enough data',
      progressThisWeek: 0
    };

    try {
      const { data: statsData } = await supabase
        .rpc('calculate_user_stats', { user_id: user.id });
      if (statsData) {
        stats = statsData;
      }
    } catch (error) {
      // If RPC function doesn't exist, calculate basic stats manually
      console.log('Stats function not found, using defaults');

      // Try to get workout count
      const { count: workoutCount } = await supabase
        .from('workouts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (workoutCount) {
        stats.totalWorkouts = workoutCount;
      }

      // Try to get completed goals count
      const { count: goalsCount } = await supabase
        .from('user_goals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed');

      if (goalsCount) {
        stats.goalsCompleted = goalsCount;
      }
    }

    // Fetch recent activity - handle if table doesn't exist
    let activity: ActivityItem[] = [];
    try {
      const { data: recentActivity } = await supabase
        .from('user_activity')
        .select('id, type, description, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentActivity) {
        activity = recentActivity;
      }
    } catch (error) {
      // If user_activity table doesn't exist, create mock recent activities
      console.log('Activity table not found, using defaults');
      activity = [];
    }

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

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Update profile with new data
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: body.full_name,
        age: body.age,
        location: body.location,
        about_me: body.about_me,
        fitness_goals: body.fitness_goals,
        experience_level: body.experience_level,
        weekly_hours: body.weekly_hours,
        primary_goal: body.primary_goal,
        focus_areas: body.focus_areas,
        health_conditions: body.health_conditions,
        dietary_preferences: body.dietary_preferences,
        equipment_access: body.equipment_access,
        preferred_workout_time: body.preferred_workout_time,
        strengths: body.strengths,
        areas_for_improvement: body.areas_for_improvement,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    // Generate embeddings if primary goal changed
    if (body.primary_goal) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/profile/embeddings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': request.headers.get('Authorization') || ''
          },
          body: JSON.stringify({
            userId: user.id,
            contentType: 'profile',
            content: body.primary_goal,
            metadata: {
              profileId: user.id,
              focusAreas: body.focus_areas
            }
          })
        });
      } catch (err) {
        console.error('Failed to generate profile embedding:', err);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Profile update error:', error);
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