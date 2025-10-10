import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
  RelogMealData,
  MealInsert,
  RelogApiResponse
} from '@/types/nutrition';

export async function POST(request: NextRequest) {
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

    // Parse request body
    let relogData: RelogMealData;
    try {
      relogData = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!relogData.original_meal_id || !relogData.new_logged_at) {
      return NextResponse.json(
        { error: 'Missing required fields: original_meal_id, new_logged_at' },
        { status: 400 }
      );
    }

    // Fetch the original meal
    const { data: originalMeal, error: fetchError } = await supabase
      .from('meals')
      .select('*')
      .eq('id', relogData.original_meal_id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !originalMeal) {
      console.error('Error fetching original meal:', fetchError);
      return NextResponse.json(
        { error: 'Original meal not found or access denied' },
        { status: 404 }
      );
    }

    // Create new meal entry based on original
    const newMealData: MealInsert = {
      meal_name: originalMeal.meal_name,
      meal_category: originalMeal.meal_category,
      logged_at: relogData.new_logged_at,
      notes: relogData.notes || originalMeal.notes,
      calories: originalMeal.calories,
      protein_g: originalMeal.protein_g,
      // V2: support both old and new field names
      carbs_g: originalMeal.total_carbs_g || originalMeal.carbs_g,
      fat_g: originalMeal.total_fat_g || originalMeal.fat_g,
    };

    // Insert new meal
    const { data: newMeal, error: insertError } = await supabase
      .from('meals')
      .insert([{
        user_id: user.id,
        ...newMealData,
        // Add re-log tracking fields if available
        original_meal_id: relogData.original_meal_id,
        relog_count: 0, // New meal starts with 0 relog count
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting new meal:', insertError);
      return NextResponse.json(
        { error: 'Failed to create new meal entry' },
        { status: 500 }
      );
    }

    // Increment relog count on original meal (if column exists)
    const { error: updateError } = await supabase
      .from('meals')
      .update({
        relog_count: (originalMeal.relog_count || 0) + 1
      })
      .eq('id', relogData.original_meal_id)
      .eq('user_id', user.id);

    if (updateError) {
      console.warn('Could not update relog count:', updateError);
      // Don't fail the request if this update fails
    }

    const response: RelogApiResponse = {
      data: newMeal,
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Relog API error:', error);
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