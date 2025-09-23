/**
 * Context Compressor for AI Coach
 * Compresses large context to fit within token limits while preserving important information
 */

import {
  EnhancedUserContext,
  CompressedContext,
  MemoryFact,
  IContextCompressor,
} from '@/types/memory';

export class ContextCompressor implements IContextCompressor {
  private readonly MAX_TOKENS = 100000; // Gemini 2.0 Flash can handle 1M tokens!
  private readonly CHARS_PER_TOKEN = 4; // Approximate

  async compressContext(
    context: EnhancedUserContext,
    maxTokens: number = this.MAX_TOKENS
  ): Promise<CompressedContext> {
    // First prioritize the context
    const prioritized = this.prioritizeContext(context);

    // Create summaries for large data sets
    const workoutSummary = this.summarizeWorkouts(context.recentWorkouts);
    const nutritionSummary = this.summarizeNutrition(context.recentMeals);
    const activitySummary = this.summarizeActivities(context.recentActivities);

    // Build compressed context
    let compressed: CompressedContext = {
      profile: prioritized.profile,
      currentGoals: prioritized.currentGoals,
      workoutSummary,
      nutritionSummary,
      activitySummary,
      recentWorkouts: prioritized.recentWorkouts,
      todaysMeals: prioritized.todaysMeals,
      relevantFacts: prioritized.relevantFacts,
      keyPreferences: prioritized.keyPreferences,
      trends: context.longTermTrends,
    };

    // Check token count and truncate if needed
    compressed = this.truncateToTokenLimit(compressed, maxTokens);

    return compressed;
  }

  prioritizeContext(context: EnhancedUserContext): any {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter to today's meals
    const todaysMeals = context.recentMeals.filter(meal => {
      const mealDate = new Date(meal.logged_at);
      mealDate.setHours(0, 0, 0, 0);
      return mealDate.getTime() === today.getTime();
    });

    // Get only active goals
    const currentGoals = context.goals.filter(g => g.isActive !== false);

    // Get most recent workouts (limit to 10)
    const recentWorkouts = context.recentWorkouts
      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
      .slice(0, 10);

    // Select high-confidence, relevant facts
    const relevantFacts = this.selectRelevantFacts(context.memoryFacts);

    // Extract key preferences
    const keyPreferences = {
      workoutPreferences: context.preferenceProfile?.workoutPreferences || {},
      nutritionPreferences: context.preferenceProfile?.nutritionPreferences || {},
      constraints: context.preferenceProfile?.constraints || {},
    };

    return {
      profile: context.profile,
      currentGoals,
      recentWorkouts,
      todaysMeals,
      relevantFacts,
      keyPreferences,
    };
  }

  summarizeWorkouts(workouts: any[]): string {
    if (!workouts || workouts.length === 0) {
      return 'No recent workouts recorded.';
    }

    // Count workout types
    const typeCounts: Record<string, number> = {};
    let totalDuration = 0;
    const morningCount = workouts.filter(w => {
      const hour = new Date(w.completed_at).getHours();
      return hour >= 5 && hour < 12;
    }).length;

    for (const workout of workouts) {
      const type = workout.workout_type || 'general';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
      totalDuration += workout.duration_minutes || 0;
    }

    // Build summary
    const avgDuration = Math.round(totalDuration / workouts.length);
    const mainType = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    let summary = `Completed ${workouts.length} workouts in the past period. `;
    summary += `Primary focus: ${mainType} (${typeCounts[mainType]} sessions). `;
    summary += `Average duration: ${avgDuration} minutes. `;

    if (morningCount > workouts.length * 0.6) {
      summary += 'Consistent morning workout pattern. ';
    }

    // Check for consistency
    const dates = workouts.map(w => new Date(w.completed_at).toDateString());
    const uniqueDates = new Set(dates).size;
    if (uniqueDates > workouts.length * 0.8) {
      summary += 'Good consistency with regular training. ';
    }

    return summary.trim();
  }

  summarizeNutrition(meals: any[]): string {
    if (!meals || meals.length === 0) {
      return 'No recent meals logged.';
    }

    // Calculate totals and averages
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    const mealTypes: Record<string, number> = {};

    for (const meal of meals) {
      totalCalories += meal.calories || 0;
      totalProtein += meal.protein_g || 0;
      totalCarbs += meal.carbs_g || 0;
      totalFat += meal.fat_g || 0;

      const type = meal.meal_type || 'meal';
      mealTypes[type] = (mealTypes[type] || 0) + 1;
    }

    // Calculate daily averages
    const days = new Set(meals.map(m => new Date(m.logged_at).toDateString())).size;
    const avgDailyCalories = Math.round(totalCalories / days);
    const avgDailyProtein = Math.round(totalProtein / days);

    let summary = `Tracked ${meals.length} meals over ${days} days. `;
    summary += `Daily averages: ${avgDailyCalories} calories, ${avgDailyProtein}g protein. `;

    // Add meal type breakdown
    const typeBreakdown = Object.entries(mealTypes)
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ');
    summary += `Meal distribution: ${typeBreakdown}. `;

    // Check for regular logging
    if (days > 5 && meals.length / days >= 3) {
      summary += 'Consistent meal tracking. ';
    }

    return summary.trim();
  }

  summarizeActivities(activities: any[]): string {
    if (!activities || activities.length === 0) {
      return 'No recent activities recorded.';
    }

    // Group by activity type
    const typeCounts: Record<string, number> = {};
    let totalDistance = 0;
    let totalDuration = 0;
    let totalCalories = 0;

    for (const activity of activities) {
      const type = activity.activity_type || 'other';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
      totalDistance += activity.distance_km || 0;
      totalDuration += activity.duration_minutes || 0;
      totalCalories += activity.calories_burned || 0;
    }

    const mainActivity = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    let summary = `Logged ${activities.length} activities. `;
    summary += `Primary activity: ${mainActivity} (${typeCounts[mainActivity]} times). `;

    if (totalDistance > 0) {
      summary += `Total distance: ${totalDistance.toFixed(1)}km. `;
    }
    if (totalDuration > 0) {
      summary += `Total time: ${Math.round(totalDuration / 60)} hours. `;
    }
    if (totalCalories > 0) {
      summary += `Calories burned: ${Math.round(totalCalories)}. `;
    }

    return summary.trim();
  }

  selectRelevantFacts(facts: MemoryFact[], query?: string): MemoryFact[] {
    if (!facts || facts.length === 0) return [];

    // Filter by confidence
    let relevant = facts.filter(f => f.confidence >= 0.5);

    // Always include constraints (injuries, allergies)
    const constraints = facts.filter(f => f.factType === 'constraint');
    const nonConstraints = relevant.filter(f => f.factType !== 'constraint');

    // If we have a query, prioritize facts related to it
    if (query) {
      const queryLower = query.toLowerCase();
      nonConstraints.sort((a, b) => {
        const aRelevance = this.calculateRelevance(a.content, queryLower);
        const bRelevance = this.calculateRelevance(b.content, queryLower);
        return bRelevance - aRelevance;
      });
    } else {
      // Otherwise, sort by confidence and recency
      nonConstraints.sort((a, b) => {
        // First by confidence
        if (Math.abs(a.confidence - b.confidence) > 0.1) {
          return b.confidence - a.confidence;
        }
        // Then by recency
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    // Combine constraints (always included) with top non-constraints
    return [...constraints, ...nonConstraints.slice(0, 15)];
  }

  private calculateRelevance(content: string, query: string): number {
    const contentLower = content.toLowerCase();
    const queryWords = query.split(/\s+/);

    let relevance = 0;
    for (const word of queryWords) {
      if (contentLower.includes(word)) {
        relevance += 1;
      }
    }

    // Check for nutrition-related query
    if (query.includes('nutrition') || query.includes('diet') || query.includes('meal')) {
      if (content.includes('vegetarian') || content.includes('calorie') || content.includes('protein')) {
        relevance += 2;
      }
    }

    // Check for workout-related query
    if (query.includes('workout') || query.includes('exercise') || query.includes('train')) {
      if (content.includes('morning') || content.includes('gym') || content.includes('workout')) {
        relevance += 2;
      }
    }

    return relevance;
  }

  private truncateToTokenLimit(compressed: any, maxTokens: number): CompressedContext {
    const jsonString = JSON.stringify(compressed);
    const estimatedTokens = Math.ceil(jsonString.length / this.CHARS_PER_TOKEN);

    if (estimatedTokens <= maxTokens) {
      return compressed;
    }

    // Progressively remove less important data
    const truncated = { ...compressed };

    // First, shorten summaries
    if (truncated.workoutSummary && truncated.workoutSummary.length > 200) {
      truncated.workoutSummary = truncated.workoutSummary.substring(0, 200) + '...';
    }
    if (truncated.nutritionSummary && truncated.nutritionSummary.length > 200) {
      truncated.nutritionSummary = truncated.nutritionSummary.substring(0, 200) + '...';
    }
    if (truncated.activitySummary && truncated.activitySummary.length > 200) {
      truncated.activitySummary = truncated.activitySummary.substring(0, 200) + '...';
    }

    // Then reduce recent workouts
    if (truncated.recentWorkouts.length > 5) {
      truncated.recentWorkouts = truncated.recentWorkouts.slice(0, 5);
    }

    // Reduce facts if needed
    if (truncated.relevantFacts.length > 10) {
      truncated.relevantFacts = truncated.relevantFacts.slice(0, 10);
    }

    // Final check
    const finalString = JSON.stringify(truncated);
    const finalTokens = Math.ceil(finalString.length / this.CHARS_PER_TOKEN);

    if (finalTokens > maxTokens) {
      // Last resort: truncate the entire JSON string
      const maxChars = maxTokens * this.CHARS_PER_TOKEN;
      const truncatedString = finalString.substring(0, maxChars - 10) + '"}}}'; // Ensure valid JSON
      try {
        return JSON.parse(truncatedString);
      } catch {
        // If parsing fails, return minimal context
        return {
          profile: compressed.profile,
          currentGoals: compressed.currentGoals.slice(0, 2),
          workoutSummary: 'Recent workouts tracked',
          nutritionSummary: 'Meals logged',
          activitySummary: 'Activities recorded',
          recentWorkouts: [],
          todaysMeals: compressed.todaysMeals.slice(0, 3),
          relevantFacts: compressed.relevantFacts.slice(0, 5),
          keyPreferences: compressed.keyPreferences,
          trends: compressed.trends,
        };
      }
    }

    return truncated;
  }
}