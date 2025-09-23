/**
 * Enhanced Context Builder for AI Coach
 * Builds comprehensive context with memory, patterns, and trends
 */

import { createClient } from '@/utils/supabase/server';
import {
  EnhancedUserContext,
  MemoryFact,
  ConversationSummary,
  PreferenceProfile,
  WorkoutPattern,
  NutritionPattern,
  LongTermTrends,
  IContextBuilder,
  WorkoutPreferences,
  NutritionPreferences,
} from '@/types/memory';

export class EnhancedContextBuilder implements IContextBuilder {
  async buildContext(userId: string): Promise<EnhancedUserContext> {
    const supabase = createClient();

    // First try to get enhanced context with memory
    const enhancedResult = await supabase.rpc('get_enhanced_rag_context', { p_user_id: userId });

    if (!enhancedResult.error && enhancedResult.data) {
      // Use the enhanced context directly if available
      const data = enhancedResult.data;
      return {
        profile: data.profile || {},
        recentWorkouts: data.recent_workouts || [],
        recentMeals: data.recent_meals || [],
        recentActivities: data.recent_activities || [],
        goals: data.goals || [],
        workoutPatterns: data.workout_patterns ? [data.workout_patterns] : [],
        nutritionPatterns: data.nutrition_patterns ? [data.nutrition_patterns] : [],
        memoryFacts: data.memory_facts || [],
        conversationSummaries: data.conversation_summaries || [],
        preferenceProfile: data.preference_profile || {
          userId,
          workoutPreferences: {},
          nutritionPreferences: {},
          communicationStyle: {},
          constraints: {},
          motivators: [],
          updatedAt: new Date(),
        },
        longTermTrends: data.progress_trends || {
          workoutFrequencyTrend: { direction: 'stable', changeRate: 0, confidence: 0, periodDays: 30 },
          strengthProgressTrend: { direction: 'stable', changeRate: 0, confidence: 0, periodDays: 30 },
          nutritionAdherenceTrend: { direction: 'stable', changeRate: 0, confidence: 0, periodDays: 14 },
          activityConsistency: 0,
        },
      };
    }

    // Fall back to building context manually if enhanced RPC fails
    const [
      baseContextResult,
      memoryFacts,
      conversationSummaries,
      preferenceProfile,
    ] = await Promise.all([
      // Use standard RPC to get base context
      supabase.rpc('get_rag_context_for_user', { p_user_id: userId }),
      this.getMemoryFacts(userId, 20),
      this.getRecentConversationSummaries(userId, 5),
      this.getPreferenceProfile(userId),
    ]);

    if (baseContextResult.error) {
      console.error('Error fetching base context:', baseContextResult.error);
      // Fall back to basic context
      return this.getFallbackContext(userId);
    }

    // The base RPC returns a table with one row
    const baseContext = baseContextResult.data?.[0] || {};

    // Parse the JSONB fields
    const profile = baseContext.profile_data || {};
    const recentWorkouts = baseContext.recent_workouts || [];
    const recentMeals = baseContext.recent_meals || [];
    const recentActivities = baseContext.strava_activities || [];
    const goals = baseContext.user_goals || [];

    // Build patterns from the base context
    const workoutPatterns = baseContext.workout_patterns ? [baseContext.workout_patterns] : [];
    const nutritionPatterns = baseContext.nutrition_stats ? [{
      mealType: 'all',
      avgCalories: baseContext.nutrition_stats.avg_daily_calories || 0,
      avgProtein: baseContext.nutrition_stats.avg_daily_protein || 0,
      frequency: baseContext.nutrition_stats.meal_frequency || 0,
    }] : [];

    // Compute long-term trends from the data
    const longTermTrends = this.computeLongTermTrends({
      recent_workouts: recentWorkouts,
      recent_meals: recentMeals,
      recent_activities: recentActivities,
      goals: goals,
    });

    return {
      profile,
      recentWorkouts,
      recentMeals,
      recentActivities,
      goals,
      workoutPatterns,
      nutritionPatterns,
      memoryFacts,
      conversationSummaries,
      preferenceProfile,
      longTermTrends,
    };
  }

  async getMemoryFacts(userId: string, limit: number = 20, minConfidence: number = 0.5): Promise<MemoryFact[]> {
    const supabase = createClient();

    const query = supabase
      .from('user_memory_facts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('confidence', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (minConfidence > 0) {
      query.gte('confidence', minConfidence);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching memory facts:', error);
      return [];
    }

    return (data || []).map(fact => ({
      id: fact.id,
      userId: fact.user_id,
      factType: fact.fact_type,
      content: fact.content,
      confidence: fact.confidence,
      source: fact.source,
      metadata: fact.metadata,
      createdAt: new Date(fact.created_at),
      updatedAt: new Date(fact.updated_at),
      expiresAt: fact.expires_at ? new Date(fact.expires_at) : undefined,
      isActive: fact.is_active,
    }));
  }

  async getRecentConversationSummaries(userId: string, limit: number = 5): Promise<ConversationSummary[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('conversation_summaries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching conversation summaries:', error);
      return [];
    }

    return (data || []).map(summary => ({
      id: summary.id,
      userId: summary.user_id,
      conversationId: summary.conversation_id,
      summary: summary.summary,
      keyTopics: summary.key_topics || [],
      extractedFacts: summary.extracted_facts || [],
      actionItems: summary.action_items || [],
      sentiment: summary.sentiment,
      createdAt: new Date(summary.created_at),
    }));
  }

  async getPreferenceProfile(userId: string): Promise<PreferenceProfile> {
    const supabase = createClient();

    // First try to get existing profile
    const { data: existingProfile, error } = await supabase
      .from('user_preference_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingProfile && !error) {
      return {
        userId: existingProfile.user_id,
        workoutPreferences: existingProfile.workout_preferences || {},
        nutritionPreferences: existingProfile.nutrition_preferences || {},
        communicationStyle: existingProfile.communication_style || {},
        constraints: existingProfile.constraints || {},
        motivators: existingProfile.motivators || [],
        coachingNotes: existingProfile.coaching_notes,
        updatedAt: new Date(existingProfile.updated_at),
      };
    }

    // If no profile exists, build one from memory facts
    const facts = await this.getMemoryFacts(userId, 50);
    return this.buildProfileFromFacts(userId, facts);
  }

  private buildProfileFromFacts(userId: string, facts: MemoryFact[]): PreferenceProfile {
    const workoutPreferences: WorkoutPreferences = {};
    const nutritionPreferences: NutritionPreferences = {};
    const constraints: any = {
      injuries: [],
      medicalConditions: [],
      equipmentLimitations: [],
    };
    const motivators: string[] = [];

    for (const fact of facts) {
      // Process workout preferences
      if (fact.factType === 'preference' && fact.metadata) {
        if (fact.metadata.time) {
          workoutPreferences.preferredTime = fact.metadata.time;
        }
        if (fact.metadata.activity) {
          if (fact.content.includes('dislike') || fact.content.includes('hate')) {
            workoutPreferences.avoidedExercises = workoutPreferences.avoidedExercises || [];
            workoutPreferences.avoidedExercises.push(fact.metadata.activity);
          } else {
            workoutPreferences.favoriteExercises = workoutPreferences.favoriteExercises || [];
            workoutPreferences.favoriteExercises.push(fact.metadata.activity);
          }
        }
      }

      // Process constraints
      if (fact.factType === 'constraint') {
        if (fact.metadata?.body_part) {
          constraints.injuries.push({
            bodyPart: fact.metadata.body_part,
            severity: 'moderate',
            restrictions: fact.metadata.avoid || [],
            dateReported: fact.createdAt,
          });
        }
        if (fact.metadata?.allergen) {
          nutritionPreferences.allergies = nutritionPreferences.allergies || [];
          nutritionPreferences.allergies.push(fact.metadata.allergen);
        }
      }

      // Process goals as motivators
      if (fact.factType === 'goal') {
        if (fact.content.includes('muscle')) motivators.push('muscle_gain');
        if (fact.content.includes('weight') || fact.content.includes('fat')) motivators.push('weight_loss');
        if (fact.content.includes('strength')) motivators.push('strength');
      }
    }

    return {
      userId,
      workoutPreferences,
      nutritionPreferences,
      communicationStyle: {
        preferredTone: 'encouraging',
        detailLevel: 'moderate',
      },
      constraints,
      motivators: Array.from(new Set(motivators)),
      updatedAt: new Date(),
    };
  }

  computeLongTermTrends(context: any): LongTermTrends {
    const workoutFrequencyTrend = this.calculateWorkoutFrequencyTrend(context.recent_workouts || []);
    const strengthProgressTrend = this.calculateStrengthProgressTrend(context.recent_workouts || []);
    const nutritionAdherenceTrend = this.calculateNutritionAdherenceTrend(
      context.recent_meals || [],
      context.goals || []
    );
    const activityConsistency = this.calculateActivityConsistency(context.recent_activities || []);

    return {
      workoutFrequencyTrend,
      strengthProgressTrend,
      nutritionAdherenceTrend,
      activityConsistency,
    };
  }

  private calculateWorkoutFrequencyTrend(workouts: any[]): any {
    if (!workouts || workouts.length < 3) {
      return {
        direction: 'stable',
        changeRate: 0,
        confidence: 0.3,
        periodDays: 30,
      };
    }

    // Group workouts by week
    const weeklyCount: Map<number, number> = new Map();
    const now = new Date();

    for (const workout of workouts) {
      const date = new Date(workout.completed_at);
      const weeksAgo = Math.floor((now.getTime() - date.getTime()) / (7 * 24 * 60 * 60 * 1000));
      weeklyCount.set(weeksAgo, (weeklyCount.get(weeksAgo) || 0) + 1);
    }

    // Calculate trend
    const recentWeeks = Array.from(weeklyCount.entries())
      .sort((a, b) => a[0] - b[0])
      .slice(0, 4);

    if (recentWeeks.length < 2) {
      return {
        direction: 'stable',
        changeRate: 0,
        confidence: 0.5,
        periodDays: 30,
      };
    }

    const firstWeekCount = recentWeeks[recentWeeks.length - 1][1];
    const lastWeekCount = recentWeeks[0][1];
    const changeRate = ((lastWeekCount - firstWeekCount) / firstWeekCount) * 100;

    let direction: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (changeRate > 20) direction = 'increasing';
    else if (changeRate < -20) direction = 'decreasing';

    return {
      direction,
      changeRate: Math.abs(changeRate),
      confidence: 0.7 + (recentWeeks.length / 10) * 0.3,
      periodDays: 30,
    };
  }

  private calculateStrengthProgressTrend(workouts: any[]): any {
    // This would analyze weight progression in strength exercises
    // For now, return a simple trend
    return {
      direction: 'stable',
      changeRate: 5,
      confidence: 0.6,
      periodDays: 30,
    };
  }

  private calculateNutritionAdherenceTrend(meals: any[], goals: any[]): any {
    if (!meals || meals.length === 0) {
      return {
        direction: 'stable',
        changeRate: 0,
        confidence: 0.2,
        periodDays: 14,
      };
    }

    // Find calorie goal if exists
    const calorieGoal = goals.find((g: any) =>
      g.goal_type === 'nutrition' || g.title?.toLowerCase().includes('calorie')
    );

    if (!calorieGoal) {
      return {
        direction: 'stable',
        changeRate: 0,
        confidence: 0.5,
        periodDays: 14,
      };
    }

    // Calculate daily adherence
    const targetCalories = calorieGoal.target_value || 2000;
    const dailyCalories: Map<string, number> = new Map();

    for (const meal of meals) {
      const date = new Date(meal.logged_at).toDateString();
      dailyCalories.set(date, (dailyCalories.get(date) || 0) + (meal.calories || 0));
    }

    // Calculate adherence percentage
    let adherentDays = 0;
    for (const [, calories] of dailyCalories) {
      const variance = Math.abs(calories - targetCalories) / targetCalories;
      if (variance < 0.15) adherentDays++; // Within 15% of target
    }

    const adherenceRate = (adherentDays / dailyCalories.size) * 100;

    return {
      direction: adherenceRate > 70 ? 'stable' : 'decreasing',
      changeRate: adherenceRate,
      confidence: 0.7,
      periodDays: 14,
    };
  }

  private calculateActivityConsistency(activities: any[]): number {
    if (!activities || activities.length === 0) return 0;

    // Calculate how consistently the user logs activities
    const dates = activities.map((a: any) => new Date(a.start_date).toDateString());
    const uniqueDates = new Set(dates);

    // Get date range
    const firstDate = new Date(activities[activities.length - 1].start_date);
    const lastDate = new Date(activities[0].start_date);
    const daysDiff = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (24 * 60 * 60 * 1000));

    if (daysDiff === 0) return 1;

    // Consistency is the ratio of active days to total days
    return Math.min(uniqueDates.size / daysDiff, 1);
  }

  private async getFallbackContext(userId: string): Promise<EnhancedUserContext> {
    // Fallback to basic context if enhanced RPC fails
    const supabase = createClient();
    const { data } = await supabase.rpc('get_rag_context_for_user', { p_user_id: userId });

    // Handle table response format
    const baseContext = data?.[0] || {};

    return {
      profile: baseContext.profile_data || {},
      recentWorkouts: baseContext.recent_workouts || [],
      recentMeals: baseContext.recent_meals || [],
      recentActivities: baseContext.strava_activities || [],
      goals: baseContext.user_goals || [],
      workoutPatterns: [],
      nutritionPatterns: [],
      memoryFacts: [],
      conversationSummaries: [],
      preferenceProfile: {
        userId,
        workoutPreferences: {},
        nutritionPreferences: {},
        communicationStyle: {},
        constraints: {},
        motivators: [],
        updatedAt: new Date(),
      },
      longTermTrends: {
        workoutFrequencyTrend: {
          direction: 'stable',
          changeRate: 0,
          confidence: 0,
          periodDays: 30,
        },
        strengthProgressTrend: {
          direction: 'stable',
          changeRate: 0,
          confidence: 0,
          periodDays: 30,
        },
        nutritionAdherenceTrend: {
          direction: 'stable',
          changeRate: 0,
          confidence: 0,
          periodDays: 14,
        },
        activityConsistency: 0,
      },
    };
  }
}