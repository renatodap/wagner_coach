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

    // Fetch user's nutrition targets
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('daily_calorie_target, daily_protein_target_g, daily_carbs_target_g, daily_fat_target_g')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('Error fetching user data:', userError)
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      )
    }

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
        calories: userData.daily_calorie_target || 2000,
        protein: userData.daily_protein_target_g || 150,
        carbs: userData.daily_carbs_target_g || 200,
        fat: userData.daily_fat_target_g || 65,
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
