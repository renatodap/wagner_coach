import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteContext {
  params: {
    id: string;
  };
}

// Helper to check if a table exists
async function tableExists(supabase: any, tableName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.from(tableName).select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const { id } = context.params;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate meal ID
    if (!id) {
      return NextResponse.json(
        { error: 'Meal ID is required' },
        { status: 400 }
      );
    }

    // Check which table structure we're using
    const hasNewSchema = await tableExists(supabase, 'meal_logs');

    if (hasNewSchema) {
      // New schema - delete from meal_logs (cascade will handle meal_log_foods)
      const { error } = await supabase
        .from('meal_logs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting meal from meal_logs:', error);
        return NextResponse.json(
          { error: 'Failed to delete meal' },
          { status: 500 }
        );
      }
    } else {
      // Old schema - verify meal exists and belongs to user
      const { data: meal, error: fetchError } = await supabase
        .from('meals')
        .select('id, user_id')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !meal) {
        return NextResponse.json(
          { error: 'Meal not found or access denied' },
          { status: 404 }
        );
      }

      // Delete from meals table
      const { error: deleteError } = await supabase
        .from('meals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error deleting meal from meals table:', deleteError);
        return NextResponse.json(
          { error: 'Failed to delete meal' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { message: 'Meal deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Delete meal API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const { id } = context.params;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate meal ID
    if (!id) {
      return NextResponse.json(
        { error: 'Meal ID is required' },
        { status: 400 }
      );
    }

    // Check which table structure we're using
    const hasNewSchema = await tableExists(supabase, 'meal_logs');

    if (hasNewSchema) {
      // New schema - fetch from meal_logs with foods
      const { data: meal, error } = await supabase
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

      if (error || !meal) {
        return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
      }

      // Transform for compatibility
      const transformed = {
        id: meal.id,
        meal_name: meal.name || meal.meal_log_foods?.map((f: any) => f.food?.name).filter(Boolean).join(', ') || 'Meal',
        meal_category: meal.category,
        logged_at: meal.logged_at,
        notes: meal.notes,
        calories: meal.total_calories,
        protein_g: meal.total_protein_g,
        carbs_g: meal.total_carbs_g,
        fat_g: meal.total_fat_g,
        fiber_g: meal.total_fiber_g,
        foods: meal.meal_log_foods
      };

      return NextResponse.json({ meal: transformed });
    } else {
      // Old schema - fetch from meals table
      const { data: meal, error: fetchError } = await supabase
        .from('meals')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !meal) {
        return NextResponse.json(
          { error: 'Meal not found or access denied' },
          { status: 404 }
        );
      }

      return NextResponse.json({ meal });
    }

  } catch (error) {
    console.error('Get meal API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const { id } = context.params;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate meal ID
    if (!id) {
      return NextResponse.json(
        { error: 'Meal ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    let updateData;
    try {
      updateData = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // Check which table structure we're using
    const hasNewSchema = await tableExists(supabase, 'meal_logs');

    if (hasNewSchema) {
      // New schema - verify meal exists and belongs to user
      const { data: existingMeal, error: fetchError } = await supabase
        .from('meal_logs')
        .select('id, user_id')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !existingMeal) {
        return NextResponse.json(
          { error: 'Meal not found or access denied' },
          { status: 404 }
        );
      }

      // Update the meal in meal_logs table
      const { data: updatedMeal, error: updateError } = await supabase
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

      if (updateError) {
        console.error('Error updating meal:', updateError);
        return NextResponse.json(
          { error: 'Failed to update meal' },
          { status: 500 }
        );
      }

      return NextResponse.json({ data: updatedMeal });
    } else {
      // Old schema - verify meal exists and belongs to user
      const { data: existingMeal, error: fetchError } = await supabase
        .from('meals')
        .select('id, user_id')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !existingMeal) {
        return NextResponse.json(
          { error: 'Meal not found or access denied' },
          { status: 404 }
        );
      }

      // Update the meal
      const { data: updatedMeal, error: updateError } = await supabase
        .from('meals')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating meal:', updateError);
        return NextResponse.json(
          { error: 'Failed to update meal' },
          { status: 500 }
        );
      }

      return NextResponse.json({ data: updatedMeal });
    }

  } catch (error) {
    console.error('Update meal API error:', error);
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