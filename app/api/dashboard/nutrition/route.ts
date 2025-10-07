import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

    // Fetch user's active nutrition goals
    let { data: nutritionGoals, error: goalsError } = await supabase
      .from('nutrition_goals')
      .select('daily_calories, daily_protein_g, daily_carbs_g, daily_fat_g, daily_fiber_g, daily_sugar_limit_g, daily_sodium_limit_mg')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    // If no goals exist, create default ones
    if (goalsError) {
      if (goalsError.code === 'PGRST116') {
        const { data: newGoals, error: createError } = await supabase
          .from('nutrition_goals')
          .insert({
            user_id: user.id,
            goal_name: 'My Nutrition Goals',
            goal_type: 'maintenance',
            is_active: true,
            daily_calories: 2000,
            daily_protein_g: 150,
            daily_carbs_g: 200,
            daily_fat_g: 65,
            daily_fiber_g: 30,
          })
          .select('daily_calories, daily_protein_g, daily_carbs_g, daily_fat_g, daily_fiber_g, daily_sugar_limit_g, daily_sodium_limit_mg')
          .single()

        if (createError) {
          console.error('Error creating default goals:', createError)
          return NextResponse.json(
            { error: 'Failed to create default goals' },
            { status: 500 }
          )
        }

        nutritionGoals = newGoals
      } else {
        console.error('Error fetching nutrition goals:', goalsError)
        return NextResponse.json(
          { error: 'Failed to fetch nutrition goals' },
          { status: 500 }
        )
      }
    }

    const userData = nutritionGoals

    // Fetch today's meal logs and calculate totals
    const { data: mealLogs, error: mealsError } = await supabase
      .from('meal_logs')
      .select('total_calories, total_protein_g, total_carbs_g, total_fat_g')
      .eq('user_id', user.id)
      .gte('logged_at', `${today}T00:00:00.000Z`)
      .lte('logged_at', `${today}T23:59:59.999Z`)

    if (mealsError) {
      console.error('Error fetching meal logs:', mealsError)
      return NextResponse.json(
        { error: 'Failed to fetch meal logs' },
        { status: 500 }
      )
    }

    // Calculate today's totals
    const totals = {
      calories: mealLogs?.reduce((sum, meal) => sum + (Number(meal.total_calories) || 0), 0) || 0,
      protein: mealLogs?.reduce((sum, meal) => sum + (Number(meal.total_protein_g) || 0), 0) || 0,
      carbs: mealLogs?.reduce((sum, meal) => sum + (Number(meal.total_carbs_g) || 0), 0) || 0,
      fat: mealLogs?.reduce((sum, meal) => sum + (Number(meal.total_fat_g) || 0), 0) || 0,
    }

    // Return data
    return NextResponse.json({
      targets: {
        calories: userData?.daily_calories || 2000,
        protein: userData?.daily_protein_g || 150,
        carbs: userData?.daily_carbs_g || 200,
        fat: userData?.daily_fat_g || 65,
      },
      current: {
        calories: Math.round(totals.calories),
        protein: Math.round(totals.protein),
        carbs: Math.round(totals.carbs),
        fat: Math.round(totals.fat),
      },
    })
  } catch (error) {
    console.error('Dashboard nutrition API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
