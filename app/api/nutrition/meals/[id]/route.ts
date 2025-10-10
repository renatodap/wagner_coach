import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// Simplified DELETE that tries both tables
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Meal ID is required' },
        { status: 400 }
      );
    }

    console.log('Attempting to delete meal:', id, 'for user:', user.id);

    // Try to delete from meals table first (old schema)
    const { error: mealsError } = await supabase
      .from('meals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (!mealsError) {
      console.log('Successfully deleted from meals table');
      return NextResponse.json({ message: 'Meal deleted successfully' }, { status: 200 });
    }

    console.log('Not in meals table, trying meal_logs:', mealsError.message);

    // Try meal_logs table (new schema)
    const { error: mealLogsError } = await supabase
      .from('meal_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (!mealLogsError) {
      console.log('Successfully deleted from meal_logs table');
      return NextResponse.json({ message: 'Meal deleted successfully' }, { status: 200 });
    }

    console.error('Failed to delete from both tables:', {
      meals: mealsError.message,
      meal_logs: mealLogsError.message
    });

    return NextResponse.json(
      { error: `Could not delete meal. It may not exist or you may not have permission.` },
      { status: 404 }
    );

  } catch (error) {
    console.error('Delete meal API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET a single meal
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Meal ID is required' },
        { status: 400 }
      );
    }

    // Try meal_logs first (new schema)
    const { data: mealLog, error: mealLogError } = await supabase
      .from('meal_logs')
      .select(`
        *,
        meal_log_foods (
          *,
          food:foods (*)
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (mealLog && !mealLogError) {
      // Transform to match old format (support both V1 and V2 field names)
      const transformed = {
        id: mealLog.id,
        meal_name: mealLog.name || 'Meal',
        meal_category: mealLog.category,
        logged_at: mealLog.logged_at,
        notes: mealLog.notes,
        calories: mealLog.total_calories,
        protein_g: mealLog.total_protein_g,
        // V2: support both old and new field names
        carbs_g: mealLog.total_carbs_g,
        total_carbs_g: mealLog.total_carbs_g,
        fat_g: mealLog.total_fat_g,
        total_fat_g: mealLog.total_fat_g,
        fiber_g: mealLog.total_fiber_g,
        dietary_fiber_g: mealLog.total_fiber_g,
        foods: mealLog.meal_log_foods
      };
      return NextResponse.json({ meal: transformed });
    }

    // Try old meals table
    const { data: meal, error: mealError } = await supabase
      .from('meals')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (meal && !mealError) {
      return NextResponse.json({ meal });
    }

    return NextResponse.json(
      { error: 'Meal not found' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Get meal API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// UPDATE a meal
export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Meal ID is required' },
        { status: 400 }
      );
    }

    const updateData = await request.json();

    // If foods array is provided, handle the update differently
    if (updateData.foods && Array.isArray(updateData.foods)) {
      // First try meal_logs table
      const { data: existingMealLog } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (existingMealLog) {
        // Delete existing meal_log_foods entries
        await supabase
          .from('meal_log_foods')
          .delete()
          .eq('meal_log_id', id);

        // Insert new meal_log_foods entries
        if (updateData.foods.length > 0) {
          const mealLogFoods = updateData.foods.map((food: any) => ({
            meal_log_id: id,
            food_id: food.food_id || food.food?.id || food.id,
            quantity: food.quantity || 100,
            unit: food.unit || 'g'
          }));

          await supabase
            .from('meal_log_foods')
            .insert(mealLogFoods);
        }

        // Update meal_logs with new totals
        const { data: updatedMealLog, error: updateError } = await supabase
          .from('meal_logs')
          .update({
            name: updateData.meal_name,
            category: updateData.meal_category,
            notes: updateData.notes,
            total_calories: updateData.calories,
            total_protein_g: updateData.protein_g,
            total_carbs_g: updateData.carbs_g,
            total_fat_g: updateData.fat_g,
            total_fiber_g: updateData.fiber_g,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (!updateError) {
          return NextResponse.json({ data: updatedMealLog });
        }
      }

      // Try old meals table - just update normally
      const { data: meal, error: mealError } = await supabase
        .from('meals')
        .update({
          meal_name: updateData.meal_name,
          meal_category: updateData.meal_category,
          notes: updateData.notes,
          calories: updateData.calories,
          protein_g: updateData.protein_g,
          carbs_g: updateData.carbs_g,
          fat_g: updateData.fat_g,
          fiber_g: updateData.fiber_g,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (meal && !mealError) {
        return NextResponse.json({ data: meal });
      }
    } else {
      // Normal update without foods array
      // Try to update in meal_logs first
      const { data: mealLog, error: mealLogError } = await supabase
        .from('meal_logs')
        .update({
          name: updateData.meal_name,
          category: updateData.meal_category,
          notes: updateData.notes,
          total_calories: updateData.calories,
          total_protein_g: updateData.protein_g,
          total_carbs_g: updateData.carbs_g,
          total_fat_g: updateData.fat_g,
          total_fiber_g: updateData.fiber_g,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (mealLog && !mealLogError) {
        return NextResponse.json({ data: mealLog });
      }

      // Try old meals table
      const { data: meal, error: mealError } = await supabase
        .from('meals')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (meal && !mealError) {
        return NextResponse.json({ data: meal });
      }
    }

    return NextResponse.json(
      { error: 'Meal not found or update failed' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Update meal API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}