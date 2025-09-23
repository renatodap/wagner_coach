/**
 * Cron Job: Auto-Summarize User Data
 * Runs daily to create summaries for tiered context
 *
 * Schedule: Daily at 3:00 AM UTC
 * Vercel Cron: Add to vercel.json
 */

import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

export async function GET(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();

    // Get all users who have data to summarize
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id');

    if (usersError) {
      throw usersError;
    }

    const results = {
      processed: 0,
      errors: 0,
      summaries_created: 0,
    };

    // Process each user
    for (const user of users || []) {
      try {
        // Generate weekly summary for last week
        const lastWeekStart = new Date();
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        lastWeekStart.setHours(0, 0, 0, 0);

        await generateWeeklySummary(user.id, lastWeekStart);

        // Check if we need to generate monthly summary
        const today = new Date();
        if (today.getDate() === 1) { // First day of month
          await generateMonthlySummary(user.id);
        }

        // Check if we need to generate quarterly summary
        if (isFirstDayOfQuarter(today)) {
          await generateQuarterlySummary(user.id);
        }

        results.processed++;
        results.summaries_created++;
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
        results.errors++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Summarization complete',
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Summarization failed', details: error },
      { status: 500 }
    );
  }
}

async function generateWeeklySummary(userId: string, weekStart: Date) {
  const supabase = createClient();

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  // Get activities for the week
  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .gte('start_date', weekStart.toISOString())
    .lte('start_date', weekEnd.toISOString());

  // Get meals for the week
  const { data: meals } = await supabase
    .from('meals')
    .select('*')
    .eq('user_id', userId)
    .gte('logged_at', weekStart.toISOString())
    .lte('logged_at', weekEnd.toISOString());

  // Calculate activity summary
  const activitySummary = calculateActivitySummary(activities || []);
  const nutritionSummary = calculateNutritionSummary(meals || []);

  // Insert or update summary
  const { error } = await supabase
    .from('user_context_summaries')
    .upsert({
      user_id: userId,
      period_type: 'weekly',
      period_start: weekStart.toISOString().split('T')[0],
      period_end: weekEnd.toISOString().split('T')[0],
      activity_summary: activitySummary,
      nutrition_summary: nutritionSummary,
    }, {
      onConflict: 'user_id,period_type,period_start,period_end'
    });

  if (error) {
    console.error('Error saving weekly summary:', error);
    throw error;
  }
}

async function generateMonthlySummary(userId: string) {
  const supabase = createClient();

  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const monthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
  const monthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);

  // Get weekly summaries for the month
  const { data: weeklySummaries } = await supabase
    .from('user_context_summaries')
    .select('*')
    .eq('user_id', userId)
    .eq('period_type', 'weekly')
    .gte('period_start', monthStart.toISOString().split('T')[0])
    .lte('period_end', monthEnd.toISOString().split('T')[0]);

  // Aggregate weekly summaries into monthly
  const activitySummary = aggregateActivitySummaries(weeklySummaries || []);
  const nutritionSummary = aggregateNutritionSummaries(weeklySummaries || []);

  // Get achievements and challenges from milestones
  const { data: milestones } = await supabase
    .from('user_milestones')
    .select('*')
    .eq('user_id', userId)
    .gte('occurred_at', monthStart.toISOString().split('T')[0])
    .lte('occurred_at', monthEnd.toISOString().split('T')[0]);

  const achievements = milestones
    ?.filter(m => ['achievement', 'pr', 'goal_completed'].includes(m.milestone_type))
    .map(m => m.title) || [];

  const challenges = milestones
    ?.filter(m => ['injury', 'setback'].includes(m.milestone_type))
    .map(m => m.title) || [];

  // Insert monthly summary
  await supabase
    .from('user_context_summaries')
    .upsert({
      user_id: userId,
      period_type: 'monthly',
      period_start: monthStart.toISOString().split('T')[0],
      period_end: monthEnd.toISOString().split('T')[0],
      activity_summary: activitySummary,
      nutrition_summary: nutritionSummary,
      key_achievements: achievements,
      challenges_faced: challenges,
    }, {
      onConflict: 'user_id,period_type,period_start,period_end'
    });
}

async function generateQuarterlySummary(userId: string) {
  const supabase = createClient();

  const lastQuarter = getLastQuarterDates();

  // Get monthly summaries for the quarter
  const { data: monthlySummaries } = await supabase
    .from('user_context_summaries')
    .select('*')
    .eq('user_id', userId)
    .eq('period_type', 'monthly')
    .gte('period_start', lastQuarter.start.toISOString().split('T')[0])
    .lte('period_end', lastQuarter.end.toISOString().split('T')[0]);

  // Aggregate monthly summaries
  const activitySummary = aggregateActivitySummaries(monthlySummaries || []);
  const nutritionSummary = aggregateNutritionSummaries(monthlySummaries || []);

  // Get all achievements and challenges for the quarter
  const allAchievements: string[] = [];
  const allChallenges: string[] = [];

  monthlySummaries?.forEach(summary => {
    if (summary.key_achievements) {
      allAchievements.push(...summary.key_achievements);
    }
    if (summary.challenges_faced) {
      allChallenges.push(...summary.challenges_faced);
    }
  });

  // Insert quarterly summary
  await supabase
    .from('user_context_summaries')
    .upsert({
      user_id: userId,
      period_type: 'quarterly',
      period_start: lastQuarter.start.toISOString().split('T')[0],
      period_end: lastQuarter.end.toISOString().split('T')[0],
      activity_summary: activitySummary,
      nutrition_summary: nutritionSummary,
      key_achievements: allAchievements,
      challenges_faced: allChallenges,
    }, {
      onConflict: 'user_id,period_type,period_start,period_end'
    });
}

// Helper functions

function calculateActivitySummary(activities: any[]) {
  if (activities.length === 0) {
    return { total: 0 };
  }

  const byType: Record<string, number> = {};
  let totalDuration = 0;
  let totalDistance = 0;
  let totalCalories = 0;
  let totalHeartRate = 0;
  let heartRateCount = 0;

  activities.forEach(activity => {
    const type = activity.activity_type || 'other';
    byType[type] = (byType[type] || 0) + 1;

    totalDuration += activity.elapsed_time_seconds || 0;
    totalDistance += (activity.distance_meters || 0) / 1000;
    totalCalories += activity.calories || 0;

    if (activity.average_heartrate) {
      totalHeartRate += activity.average_heartrate;
      heartRateCount++;
    }
  });

  return {
    total: activities.length,
    by_type: byType,
    avg_duration_min: Math.round(totalDuration / activities.length / 60),
    total_duration_hours: Math.round(totalDuration / 3600),
    total_distance_km: Math.round(totalDistance * 10) / 10,
    avg_heart_rate: heartRateCount > 0 ? Math.round(totalHeartRate / heartRateCount) : null,
    total_calories: totalCalories,
    consistency_score: calculateConsistency(activities),
  };
}

function calculateNutritionSummary(meals: any[]) {
  if (meals.length === 0) {
    return { meals_logged: 0 };
  }

  const dailyTotals: Record<string, any> = {};

  meals.forEach(meal => {
    const day = new Date(meal.logged_at).toDateString();
    if (!dailyTotals[day]) {
      dailyTotals[day] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    dailyTotals[day].calories += meal.calories || 0;
    dailyTotals[day].protein += meal.protein_g || 0;
    dailyTotals[day].carbs += meal.carbs_g || 0;
    dailyTotals[day].fat += meal.fat_g || 0;
  });

  const days = Object.values(dailyTotals);
  const avgCalories = days.reduce((sum, d) => sum + d.calories, 0) / days.length;
  const avgProtein = days.reduce((sum, d) => sum + d.protein, 0) / days.length;
  const avgCarbs = days.reduce((sum, d) => sum + d.carbs, 0) / days.length;
  const avgFat = days.reduce((sum, d) => sum + d.fat, 0) / days.length;

  return {
    meals_logged: meals.length,
    days_tracked: days.length,
    avg_daily_calories: Math.round(avgCalories),
    avg_daily_protein_g: Math.round(avgProtein),
    avg_daily_carbs_g: Math.round(avgCarbs),
    avg_daily_fat_g: Math.round(avgFat),
    meal_frequency: Math.round((meals.length / days.length) * 10) / 10,
  };
}

function aggregateActivitySummaries(summaries: any[]) {
  if (summaries.length === 0) {
    return { total: 0 };
  }

  let total = 0;
  const byType: Record<string, number> = {};
  let totalDurationHours = 0;
  let totalDistanceKm = 0;
  let totalCalories = 0;

  summaries.forEach(summary => {
    const activity = summary.activity_summary || {};
    total += activity.total || 0;

    if (activity.by_type) {
      Object.entries(activity.by_type).forEach(([type, count]) => {
        byType[type] = (byType[type] || 0) + (count as number);
      });
    }

    totalDurationHours += activity.total_duration_hours || 0;
    totalDistanceKm += activity.total_distance_km || 0;
    totalCalories += activity.total_calories || 0;
  });

  return {
    total,
    by_type: byType,
    total_duration_hours: totalDurationHours,
    total_distance_km: Math.round(totalDistanceKm * 10) / 10,
    total_calories: totalCalories,
    avg_per_week: Math.round(total / summaries.length),
  };
}

function aggregateNutritionSummaries(summaries: any[]) {
  if (summaries.length === 0) {
    return { meals_logged: 0 };
  }

  let totalMeals = 0;
  let totalDays = 0;
  const avgCalories: number[] = [];
  const avgProtein: number[] = [];

  summaries.forEach(summary => {
    const nutrition = summary.nutrition_summary || {};
    totalMeals += nutrition.meals_logged || 0;
    totalDays += nutrition.days_tracked || 0;

    if (nutrition.avg_daily_calories) {
      avgCalories.push(nutrition.avg_daily_calories);
    }
    if (nutrition.avg_daily_protein_g) {
      avgProtein.push(nutrition.avg_daily_protein_g);
    }
  });

  return {
    total_meals_logged: totalMeals,
    total_days_tracked: totalDays,
    avg_daily_calories: avgCalories.length > 0
      ? Math.round(avgCalories.reduce((a, b) => a + b, 0) / avgCalories.length)
      : 0,
    avg_daily_protein_g: avgProtein.length > 0
      ? Math.round(avgProtein.reduce((a, b) => a + b, 0) / avgProtein.length)
      : 0,
  };
}

function calculateConsistency(activities: any[]) {
  if (activities.length === 0) return 0;

  const dates = activities.map(a => new Date(a.start_date).toDateString());
  const uniqueDates = new Set(dates);

  const firstDate = new Date(activities[activities.length - 1].start_date);
  const lastDate = new Date(activities[0].start_date);
  const daysDiff = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (24 * 60 * 60 * 1000));

  if (daysDiff === 0) return 1;

  return Math.round((uniqueDates.size / daysDiff) * 100) / 100;
}

function isFirstDayOfQuarter(date: Date): boolean {
  const month = date.getMonth();
  const day = date.getDate();

  return day === 1 && (month === 0 || month === 3 || month === 6 || month === 9);
}

function getLastQuarterDates(): { start: Date; end: Date } {
  const today = new Date();
  const currentQuarter = Math.floor(today.getMonth() / 3);
  const lastQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1;
  const year = currentQuarter === 0 ? today.getFullYear() - 1 : today.getFullYear();

  const start = new Date(year, lastQuarter * 3, 1);
  const end = new Date(year, (lastQuarter + 1) * 3, 0);

  return { start, end };
}