import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/nutrition-goals
 * Get user's active nutrition goals
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get active nutrition goals
    const { data: goals, error: goalsError } = await supabase
      .from('nutrition_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (goalsError) {
      // If no active goals exist, create default ones
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
            daily_sugar_limit_g: 50,
            daily_sodium_limit_mg: 2300,
            daily_water_ml: 2500,
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating default goals:', createError)
          return NextResponse.json(
            { error: 'Failed to create default goals' },
            { status: 500 }
          )
        }

        return NextResponse.json({ data: newGoals })
      }

      console.error('Error fetching goals:', goalsError)
      return NextResponse.json(
        { error: 'Failed to fetch nutrition goals' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: goals })
  } catch (error) {
    console.error('Nutrition goals API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/nutrition-goals
 * Create new nutrition goals
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Deactivate existing active goals (will be done by trigger, but explicit is good)
    await supabase
      .from('nutrition_goals')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('is_active', true)

    // Create new goals
    const { data: newGoals, error: createError } = await supabase
      .from('nutrition_goals')
      .insert({
        user_id: user.id,
        goal_name: body.goal_name || 'My Nutrition Goals',
        goal_type: body.goal_type || 'maintenance',
        is_active: true,
        daily_calories: body.daily_calories,
        daily_protein_g: body.daily_protein_g,
        daily_carbs_g: body.daily_carbs_g,
        daily_fat_g: body.daily_fat_g,
        daily_fiber_g: body.daily_fiber_g || 30,
        daily_sugar_limit_g: body.daily_sugar_limit_g || 50,
        daily_sodium_limit_mg: body.daily_sodium_limit_mg || 2300,
        daily_water_ml: body.daily_water_ml || 2500,
        track_micronutrients: body.track_micronutrients || false,
        goal_notes: body.goal_notes,
        // Micronutrients (optional)
        daily_vitamin_a_mcg: body.daily_vitamin_a_mcg,
        daily_vitamin_c_mg: body.daily_vitamin_c_mg,
        daily_vitamin_d_mcg: body.daily_vitamin_d_mcg,
        daily_vitamin_e_mg: body.daily_vitamin_e_mg,
        daily_vitamin_k_mcg: body.daily_vitamin_k_mcg,
        daily_vitamin_b12_mcg: body.daily_vitamin_b12_mcg,
        daily_folate_mcg: body.daily_folate_mcg,
        daily_calcium_mg: body.daily_calcium_mg,
        daily_iron_mg: body.daily_iron_mg,
        daily_magnesium_mg: body.daily_magnesium_mg,
        daily_potassium_mg: body.daily_potassium_mg,
        daily_zinc_mg: body.daily_zinc_mg,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating goals:', createError)
      return NextResponse.json(
        { error: 'Failed to create nutrition goals' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: newGoals }, { status: 201 })
  } catch (error) {
    console.error('Create nutrition goals error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/nutrition-goals
 * Update active nutrition goals
 */
export async function PUT(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const goalId = body.id

    if (!goalId) {
      return NextResponse.json(
        { error: 'Goal ID is required' },
        { status: 400 }
      )
    }

    // Update goals
    const { data: updatedGoals, error: updateError } = await supabase
      .from('nutrition_goals')
      .update({
        goal_name: body.goal_name,
        goal_type: body.goal_type,
        daily_calories: body.daily_calories,
        daily_protein_g: body.daily_protein_g,
        daily_carbs_g: body.daily_carbs_g,
        daily_fat_g: body.daily_fat_g,
        daily_fiber_g: body.daily_fiber_g,
        daily_sugar_limit_g: body.daily_sugar_limit_g,
        daily_sodium_limit_mg: body.daily_sodium_limit_mg,
        daily_water_ml: body.daily_water_ml,
        track_micronutrients: body.track_micronutrients,
        goal_notes: body.goal_notes,
        // Micronutrients
        daily_vitamin_a_mcg: body.daily_vitamin_a_mcg,
        daily_vitamin_c_mg: body.daily_vitamin_c_mg,
        daily_vitamin_d_mcg: body.daily_vitamin_d_mcg,
        daily_vitamin_e_mg: body.daily_vitamin_e_mg,
        daily_vitamin_k_mcg: body.daily_vitamin_k_mcg,
        daily_vitamin_b12_mcg: body.daily_vitamin_b12_mcg,
        daily_folate_mcg: body.daily_folate_mcg,
        daily_calcium_mg: body.daily_calcium_mg,
        daily_iron_mg: body.daily_iron_mg,
        daily_magnesium_mg: body.daily_magnesium_mg,
        daily_potassium_mg: body.daily_potassium_mg,
        daily_zinc_mg: body.daily_zinc_mg,
      })
      .eq('id', goalId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating goals:', updateError)
      return NextResponse.json(
        { error: 'Failed to update nutrition goals' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: updatedGoals })
  } catch (error) {
    console.error('Update nutrition goals error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
