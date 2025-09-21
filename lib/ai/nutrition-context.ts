import { createClient } from '@/lib/supabase/server';
import {
  NutritionTotals,
  NutritionGoals,
  Meal,
  WeeklyNutritionData
} from '@/types/nutrition';

export interface NutritionContext {
  todayTotals: NutritionTotals;
  goals: NutritionGoals;
  recentMeals: Meal[];
  weeklyTrends: {
    averageCalories: number;
    goalAdherence: number;
    patterns: string[];
    dailyData: WeeklyNutritionData[];
  };
  recommendations: string[];
  streakDays: number;
  habits: {
    preferredMealTimes: string[];
    commonFoods: string[];
    weeklyPattern: string;
  };
}

export async function getNutritionContext(userId: string): Promise<NutritionContext> {
  const supabase = createClient();

  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Fetch today's meals and totals
  const { data: todaysMeals } = await supabase
    .from('meals')
    .select('*')
    .eq('user_id', userId)
    .gte('logged_at', `${today}T00:00:00.000Z`)
    .lt('logged_at', `${today}T23:59:59.999Z`)
    .order('logged_at', { ascending: false });

  // Calculate today's totals
  const todayTotals: NutritionTotals = {
    calories: todaysMeals?.reduce((sum, meal) => sum + (meal.calories || 0), 0) || 0,
    protein_g: todaysMeals?.reduce((sum, meal) => sum + (meal.protein_g || 0), 0) || 0,
    carbs_g: todaysMeals?.reduce((sum, meal) => sum + (meal.carbs_g || 0), 0) || 0,
    fat_g: todaysMeals?.reduce((sum, meal) => sum + (meal.fat_g || 0), 0) || 0,
  };

  // Fetch nutrition goals
  const { data: goalsData } = await supabase
    .from('nutrition_goals')
    .select('*')
    .eq('user_id', userId)
    .single();

  const goals: NutritionGoals = goalsData || {
    user_id: userId,
    daily_calories: 2000,
    protein_g: 150,
    carbs_g: 250,
    fat_g: 65,
  };

  // Fetch recent meals (last 7 days)
  const { data: recentMeals } = await supabase
    .from('meals')
    .select('*')
    .eq('user_id', userId)
    .gte('logged_at', `${weekAgo}T00:00:00.000Z`)
    .order('logged_at', { ascending: false })
    .limit(20);

  // Fetch weekly data
  const { data: weeklyMeals } = await supabase
    .from('meals')
    .select('calories, protein_g, carbs_g, fat_g, logged_at, meal_name, meal_category')
    .eq('user_id', userId)
    .gte('logged_at', `${weekAgo}T00:00:00.000Z`)
    .order('logged_at', { ascending: false });

  // Calculate weekly trends
  const weeklyTrends = calculateWeeklyTrends(weeklyMeals || [], goals);

  // Fetch monthly data for habits analysis
  const { data: monthlyMeals } = await supabase
    .from('meals')
    .select('meal_name, meal_category, logged_at')
    .eq('user_id', userId)
    .gte('logged_at', `${monthAgo}T00:00:00.000Z`)
    .order('logged_at', { ascending: false });

  // Analyze habits
  const habits = analyzeNutritionHabits(monthlyMeals || []);

  // Calculate streak days
  const streakDays = calculateStreakDays(weeklyMeals || []);

  // Generate recommendations
  const recommendations = generateNutritionRecommendations(
    todayTotals,
    goals,
    weeklyTrends,
    habits
  );

  return {
    todayTotals,
    goals,
    recentMeals: recentMeals || [],
    weeklyTrends,
    recommendations,
    streakDays,
    habits,
  };
}

function calculateWeeklyTrends(
  weeklyMeals: any[],
  goals: NutritionGoals
): NutritionContext['weeklyTrends'] {
  // Group by date
  const dailyTotals: Record<string, WeeklyNutritionData> = {};

  weeklyMeals.forEach(meal => {
    const date = meal.logged_at.split('T')[0];
    if (!dailyTotals[date]) {
      dailyTotals[date] = {
        date,
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        meal_count: 0,
      };
    }

    dailyTotals[date].calories += meal.calories || 0;
    dailyTotals[date].protein_g += meal.protein_g || 0;
    dailyTotals[date].carbs_g += meal.carbs_g || 0;
    dailyTotals[date].fat_g += meal.fat_g || 0;
    dailyTotals[date].meal_count += 1;
  });

  const dailyData = Object.values(dailyTotals).sort((a, b) => a.date.localeCompare(b.date));

  // Calculate averages
  const averageCalories = dailyData.length > 0
    ? Math.round(dailyData.reduce((sum, day) => sum + day.calories, 0) / dailyData.length)
    : 0;

  // Calculate goal adherence
  const daysWithGoals = dailyData.filter(day =>
    day.calories >= goals.daily_calories * 0.8 &&
    day.calories <= goals.daily_calories * 1.2
  ).length;
  const goalAdherence = dailyData.length > 0 ? (daysWithGoals / dailyData.length) * 100 : 0;

  // Detect patterns
  const patterns = detectNutritionPatterns(dailyData);

  return {
    averageCalories,
    goalAdherence,
    patterns,
    dailyData,
  };
}

function analyzeNutritionHabits(monthlyMeals: any[]): NutritionContext['habits'] {
  // Analyze meal times
  const mealTimes = monthlyMeals.map(meal => {
    const hour = new Date(meal.logged_at).getHours();
    return hour;
  });

  const timeRanges = ['Morning (6-10)', 'Midday (11-14)', 'Evening (15-19)', 'Night (20-23)'];
  const timeFrequency: Record<string, number> = {};

  mealTimes.forEach(hour => {
    if (hour >= 6 && hour <= 10) timeFrequency['Morning (6-10)'] = (timeFrequency['Morning (6-10)'] || 0) + 1;
    else if (hour >= 11 && hour <= 14) timeFrequency['Midday (11-14)'] = (timeFrequency['Midday (11-14)'] || 0) + 1;
    else if (hour >= 15 && hour <= 19) timeFrequency['Evening (15-19)'] = (timeFrequency['Evening (15-19)'] || 0) + 1;
    else if (hour >= 20 && hour <= 23) timeFrequency['Night (20-23)'] = (timeFrequency['Night (20-23)'] || 0) + 1;
  });

  const preferredMealTimes = Object.entries(timeFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([time]) => time);

  // Analyze common foods
  const foodFrequency: Record<string, number> = {};
  monthlyMeals.forEach(meal => {
    const food = meal.meal_name?.toLowerCase() || '';
    foodFrequency[food] = (foodFrequency[food] || 0) + 1;
  });

  const commonFoods = Object.entries(foodFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([food]) => food);

  // Analyze weekly pattern
  const dayOfWeekFrequency: Record<number, number> = {};
  monthlyMeals.forEach(meal => {
    const dayOfWeek = new Date(meal.logged_at).getDay();
    dayOfWeekFrequency[dayOfWeek] = (dayOfWeekFrequency[dayOfWeek] || 0) + 1;
  });

  const weekdays = Object.entries(dayOfWeekFrequency)
    .filter(([day]) => parseInt(day) >= 1 && parseInt(day) <= 5)
    .reduce((sum, [, count]) => sum + count, 0);

  const weekends = Object.entries(dayOfWeekFrequency)
    .filter(([day]) => parseInt(day) === 0 || parseInt(day) === 6)
    .reduce((sum, [, count]) => sum + count, 0);

  const weeklyPattern = weekdays > weekends ? 'More active on weekdays' :
                      weekends > weekdays ? 'More active on weekends' : 'Consistent throughout week';

  return {
    preferredMealTimes,
    commonFoods,
    weeklyPattern,
  };
}

function detectNutritionPatterns(dailyData: WeeklyNutritionData[]): string[] {
  const patterns: string[] = [];

  if (dailyData.length < 3) return patterns;

  // Check for consistency
  const calorieVariation = calculateVariation(dailyData.map(d => d.calories));
  if (calorieVariation < 0.2) {
    patterns.push('Consistent daily calorie intake');
  } else if (calorieVariation > 0.5) {
    patterns.push('Highly variable calorie intake');
  }

  // Check for weekend vs weekday patterns
  const weekdayCalories = dailyData
    .filter(d => {
      const dayOfWeek = new Date(d.date).getDay();
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    })
    .map(d => d.calories);

  const weekendCalories = dailyData
    .filter(d => {
      const dayOfWeek = new Date(d.date).getDay();
      return dayOfWeek === 0 || dayOfWeek === 6;
    })
    .map(d => d.calories);

  if (weekdayCalories.length > 0 && weekendCalories.length > 0) {
    const weekdayAvg = weekdayCalories.reduce((a, b) => a + b, 0) / weekdayCalories.length;
    const weekendAvg = weekendCalories.reduce((a, b) => a + b, 0) / weekendCalories.length;

    if (weekendAvg > weekdayAvg * 1.2) {
      patterns.push('Higher intake on weekends');
    } else if (weekdayAvg > weekendAvg * 1.2) {
      patterns.push('Higher intake on weekdays');
    }
  }

  // Check for trending
  if (dailyData.length >= 5) {
    const firstHalf = dailyData.slice(0, Math.floor(dailyData.length / 2));
    const secondHalf = dailyData.slice(Math.floor(dailyData.length / 2));

    const firstAvg = firstHalf.reduce((sum, d) => sum + d.calories, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.calories, 0) / secondHalf.length;

    if (secondAvg > firstAvg * 1.1) {
      patterns.push('Increasing calorie trend');
    } else if (firstAvg > secondAvg * 1.1) {
      patterns.push('Decreasing calorie trend');
    }
  }

  return patterns;
}

function calculateVariation(values: number[]): number {
  if (values.length === 0) return 0;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
  const standardDeviation = Math.sqrt(variance);

  return standardDeviation / mean;
}

function calculateStreakDays(weeklyMeals: any[]): number {
  const dailyMealCounts: Record<string, number> = {};

  weeklyMeals.forEach(meal => {
    const date = meal.logged_at.split('T')[0];
    dailyMealCounts[date] = (dailyMealCounts[date] || 0) + 1;
  });

  const sortedDates = Object.keys(dailyMealCounts).sort().reverse();
  let streak = 0;

  for (let i = 0; i < sortedDates.length; i++) {
    const currentDate = new Date(sortedDates[i]);
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() - i);

    if (currentDate.toDateString() === expectedDate.toDateString() && dailyMealCounts[sortedDates[i]] >= 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function generateNutritionRecommendations(
  todayTotals: NutritionTotals,
  goals: NutritionGoals,
  weeklyTrends: NutritionContext['weeklyTrends'],
  habits: NutritionContext['habits']
): string[] {
  const recommendations: string[] = [];

  // Today's progress recommendations
  const calorieProgress = todayTotals.calories / goals.daily_calories;
  const proteinProgress = todayTotals.protein_g / goals.protein_g;

  if (calorieProgress < 0.6) {
    recommendations.push("You're behind on calories today. Consider adding a nutritious snack.");
  } else if (calorieProgress > 1.2) {
    recommendations.push("You've exceeded your calorie goal. Consider lighter meals for the rest of the day.");
  }

  if (proteinProgress < 0.6) {
    recommendations.push("Your protein intake is low today. Try adding lean protein sources to your remaining meals.");
  }

  // Weekly trend recommendations
  if (weeklyTrends.goalAdherence < 50) {
    recommendations.push("Your weekly goal adherence is low. Try meal planning to stay on track.");
  }

  if (weeklyTrends.patterns.includes('Highly variable calorie intake')) {
    recommendations.push("Your calorie intake varies significantly. Consider establishing a more consistent eating routine.");
  }

  if (weeklyTrends.patterns.includes('Higher intake on weekends')) {
    recommendations.push("You tend to eat more on weekends. Plan healthy weekend meals to maintain your goals.");
  }

  // Habit-based recommendations
  if (habits.commonFoods.length < 3) {
    recommendations.push("Try expanding your food variety for better nutritional balance.");
  }

  if (habits.preferredMealTimes.includes('Night (20-23)')) {
    recommendations.push("You eat late frequently. Consider shifting calories to earlier in the day for better metabolism.");
  }

  // Default encouragement
  if (recommendations.length === 0) {
    recommendations.push("You're doing great! Keep up the consistent nutrition tracking.");
  }

  return recommendations.slice(0, 3); // Limit to top 3 recommendations
}