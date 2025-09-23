/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server';
import { UserContext, WorkoutContext, ProgressContext } from '@/lib/types/coaching';

/**
 * PHASE 2: PERFORMANCE OPTIMIZATION
 * Get consolidated user context using a single RPC call
 * This replaces all individual database queries with one optimized function
 */
export async function getConsolidatedUserContext(userId: string, query: string): Promise<UserContext> {
  const supabase = await createClient();

  // Single RPC call that returns all necessary context data
  const { data, error } = await supabase
    .rpc('get_rag_context_for_user', {
      p_user_id: userId
    })
    .single();

  if (error) {
    console.error('Error fetching consolidated context:', error);
    // Return minimal context on error
    return {
      profile: null,
      workoutStats: {
        totalWorkouts: 0,
        weeklyAverage: 0,
        favoriteTypes: [],
        experienceLevel: 'beginner',
        workoutsThisWeek: 0,
        workoutsThisMonth: 0,
        avgWorkoutDuration: 0
      },
      recentWorkouts: [],
      progress: {
        trends: [],
        personalRecords: [],
        achievements: []
      },
      goals: [],
      stravaActivities: []
    };
  }

  // Parse the consolidated data from RPC
  const contextData = data || {};

  // Build workout context from RPC data
  const workoutContext: WorkoutContext = {
    recentWorkouts: contextData.recent_workouts || [],
    favoriteWorkouts: contextData.favorite_workouts_list || [],
    personalRecords: contextData.personal_records || [],
    workoutPatterns: contextData.workout_patterns || {},
    performanceHistory: [] // Can be added if needed
  };

  // Build progress context from RPC data
  const progressContext: ProgressContext = {
    trends: contextData.progress_trends ? [
      {
        metric: 'workout_frequency',
        direction: contextData.progress_trends.workout_frequency_trend || 'stable',
        percentage: 0
      },
      {
        metric: 'avg_rating',
        direction: contextData.progress_trends.avg_rating_trend?.recent > contextData.progress_trends.avg_rating_trend?.previous
          ? 'up' : contextData.progress_trends.avg_rating_trend?.recent < contextData.progress_trends.avg_rating_trend?.previous
          ? 'down' : 'stable',
        percentage: contextData.progress_trends.avg_rating_trend?.recent || 0
      }
    ] : [],
    personalRecords: contextData.personal_records || [],
    achievements: [], // Can be calculated if needed
    milestones: [] // Can be calculated if needed
  };

  // Search for relevant embeddings if available
  let relevantContext: any[] = [];
  try {
    const searchResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/embeddings/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        userId,
        limit: 5
      })
    });

    if (searchResponse.ok) {
      const searchResults = await searchResponse.json();
      relevantContext = searchResults.results || [];
    }
  } catch (error) {
    console.error('Error searching embeddings:', error);
  }

  // Build the complete user context
  const userContext: UserContext = {
    profile: contextData.profile_data || null,
    workoutStats: {
      totalWorkouts: contextData.total_workouts || 0,
      weeklyAverage: contextData.workouts_this_week || 0,
      favoriteTypes: contextData.favorite_workout_types || [],
      experienceLevel: contextData.experience_level || 'beginner',
      workoutsThisWeek: contextData.workouts_this_week || 0,
      workoutsThisMonth: contextData.workouts_this_month || 0,
      avgWorkoutDuration: contextData.avg_workout_duration || 0
    },
    recentWorkouts: contextData.recent_workouts || [],
    progress: progressContext,
    goals: contextData.user_goals || [],
    stravaActivities: contextData.strava_activities || [],
    workoutContext,
    progressContext,
    relevantContext,
    // Add nutrition data from enhanced RPC function
    nutritionStats: contextData.nutrition_stats || {},
    recentMeals: contextData.recent_meals || [],
    nutritionGoals: contextData.nutrition_goals || {},
    dietaryPreferences: contextData.dietary_preferences || {}
  };

  return userContext;
}

/**
 * Legacy function for backward compatibility
 * Redirects to the consolidated function
 */
export async function getUserContext(userId: string, query: string): Promise<UserContext> {
  return getConsolidatedUserContext(userId, query);
}

/**
 * Legacy function for backward compatibility
 * Redirects to the consolidated function
 */
export async function getEnhancedUserContext(userId: string, query: string): Promise<UserContext> {
  return getConsolidatedUserContext(userId, query);
}