import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
  NutritionDashboardData,
  NutritionTotals,
  NutritionGoals,
  Meal,
  DashboardApiResponse
} from '@/types/nutrition';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Fetch today's meals (V2: using meal_logs table)
    const { data: todaysMeals, error: mealsError } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('logged_at', `${today}T00:00:00.000Z`)
      .lt('logged_at', `${today}T23:59:59.999Z`)
      .order('logged_at', { ascending: false });

    if (mealsError) {
      console.error('Error fetching meals:', mealsError);
      return NextResponse.json(
        { error: 'Failed to fetch meals' },
        { status: 500 }
      );
    }

    // Calculate today's nutrition totals (V2: using total_* fields from meal_logs)
    const todayTotals: NutritionTotals = {
      calories: todaysMeals?.reduce((sum, meal) => sum + (meal.total_calories || 0), 0) || 0,
      protein_g: todaysMeals?.reduce((sum, meal) => sum + (meal.total_protein_g || 0), 0) || 0,
      carbs_g: todaysMeals?.reduce((sum, meal) => sum + (meal.total_carbs_g || 0), 0) || 0,
      fat_g: todaysMeals?.reduce((sum, meal) => sum + (meal.total_fat_g || 0), 0) || 0,
    };

    // Fetch user's nutrition goals
    const { data: goalsData, error: goalsError } = await supabase
      .from('nutrition_goals')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (goalsError) {
      console.error('Error fetching nutrition goals:', goalsError);

      // Create default goals if they don't exist
      const defaultGoals: Omit<NutritionGoals, 'created_at' | 'updated_at'> = {
        user_id: user.id,
        daily_calories: 2000,
        protein_g: 150,
        carbs_g: 250,
        fat_g: 65,
      };

      const { data: newGoals, error: createGoalsError } = await supabase
        .from('nutrition_goals')
        .insert(defaultGoals)
        .select()
        .single();

      if (createGoalsError) {
        console.error('Error creating default goals:', createGoalsError);
        return NextResponse.json(
          { error: 'Failed to fetch or create nutrition goals' },
          { status: 500 }
        );
      }

      goalsData = newGoals;
    }

    // Calculate weekly average calories (V2: using meal_logs table)
    const { data: weeklyMeals, error: weeklyError } = await supabase
      .from('meal_logs')
      .select('total_calories, logged_at')
      .eq('user_id', user.id)
      .gte('logged_at', `${weekAgo}T00:00:00.000Z`)
      .lt('logged_at', `${today}T23:59:59.999Z`);

    if (weeklyError) {
      console.error('Error fetching weekly meals:', weeklyError);
      return NextResponse.json(
        { error: 'Failed to fetch weekly data' },
        { status: 500 }
      );
    }

    // Group by date and calculate daily totals (V2: using total_calories)
    const dailyTotals = weeklyMeals?.reduce((acc, meal) => {
      const date = meal.logged_at.split('T')[0];
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += meal.total_calories || 0;
      return acc;
    }, {} as Record<string, number>) || {};

    const weeklyAverage = Object.keys(dailyTotals).length > 0
      ? Math.round(Object.values(dailyTotals).reduce((sum, calories) => sum + calories, 0) / Object.keys(dailyTotals).length)
      : 0;

    // Calculate streak days (consecutive days with logged meals)
    let streakDays = 0;
    const sortedDates = Object.keys(dailyTotals).sort().reverse();

    for (let i = 0; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i]);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);

      if (currentDate.toDateString() === expectedDate.toDateString()) {
        streakDays++;
      } else {
        break;
      }
    }

    const dashboardData: NutritionDashboardData = {
      today: todayTotals,
      goals: goalsData,
      meals: todaysMeals || [],
      weeklyAverage,
      streakDays,
    };

    const response: DashboardApiResponse = {
      data: dashboardData,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}