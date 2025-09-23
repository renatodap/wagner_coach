import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Helper function to check if table exists
async function tableExists(supabase: any, tableName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);

    // If no error, table exists
    return !error;
  } catch {
    return false;
  }
}

// GET endpoint - fetch user's meals
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check which schema we're using
    const hasNewSchema = await tableExists(supabase, 'meal_logs');
    const hasOldSchema = await tableExists(supabase, 'meals');

    // If new schema exists, use it
    if (hasNewSchema) {
      // Parse query parameters
      const { searchParams } = new URL(request.url);
      const date = searchParams.get('date');
      const limit = parseInt(searchParams.get('limit') || '50');

      // Build query for new schema
      let query = supabase
        .from('meal_logs')
        .select(`
          *,
          foods:meal_log_foods(
            *,
            food:foods(*)
          )
        `)
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false })
        .limit(limit);

      // Filter by date if provided
      if (date) {
        // Parse the date string (YYYY-MM-DD) and create start/end times
        const [year, month, day] = date.split('-').map(Number);
        const startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
        const endDate = new Date(year, month - 1, day, 23, 59, 59, 999);

        query = query
          .gte('logged_at', startDate.toISOString())
          .lte('logged_at', endDate.toISOString());
      } else {
        // Default to today's meals
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

        query = query
          .gte('logged_at', startOfDay.toISOString())
          .lte('logged_at', endOfDay.toISOString());
      }

      const { data: meals, error } = await query;

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch meals' },
          { status: 500 }
        );
      }

      // Transform to match old format if needed
      const transformedMeals = meals?.map(meal => ({
        id: meal.id,
        meal_name: meal.name || 'Meal',
        meal_category: meal.category,
        logged_at: meal.logged_at,
        notes: meal.notes,
        calories: meal.total_calories,
        protein_g: meal.total_protein_g,
        carbs_g: meal.total_carbs_g,
        fat_g: meal.total_fat_g,
        fiber_g: meal.total_fiber_g,
        created_at: meal.created_at,
        foods: meal.foods
      }));

      return NextResponse.json({ meals: transformedMeals || [] });
    }

    // Fallback to old schema if it exists
    if (hasOldSchema) {
      const { searchParams } = new URL(request.url);
      const date = searchParams.get('date');
      const limit = parseInt(searchParams.get('limit') || '50');

      let query = supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false })
        .limit(limit);

      if (date) {
        // Parse the date string (YYYY-MM-DD) and create start/end times
        const [year, month, day] = date.split('-').map(Number);
        const startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
        const endDate = new Date(year, month - 1, day, 23, 59, 59, 999);

        query = query
          .gte('logged_at', startDate.toISOString())
          .lte('logged_at', endDate.toISOString());
      } else {
        // Default to today's meals
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

        query = query
          .gte('logged_at', startOfDay.toISOString())
          .lte('logged_at', endOfDay.toISOString());
      }

      const { data: meals, error } = await query;

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch meals' },
          { status: 500 }
        );
      }

      return NextResponse.json({ meals: meals || [] });
    }

    // No schema exists yet
    console.log('No nutrition tables found in database. Please run migrations.');
    return NextResponse.json({ meals: [] });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST endpoint - create a new meal
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Check which schema we're using
    const hasNewSchema = await tableExists(supabase, 'meal_logs');
    const hasOldSchema = await tableExists(supabase, 'meals');

    // Use new schema if available
    if (hasNewSchema) {
      // Handle quick add (single food) vs full meal
      if (body.food_id) {
        // Quick add single food
        const { data: meal, error: mealError } = await supabase
          .from('meal_logs')
          .insert({
            user_id: user.id,
            name: body.name || 'Quick Meal',
            category: body.category || 'snack',
            logged_at: body.logged_at || new Date().toISOString(),
            notes: body.notes,
            total_calories: body.calories || 0,
            total_protein_g: body.protein_g || 0,
            total_carbs_g: body.carbs_g || 0,
            total_fat_g: body.fat_g || 0,
            total_fiber_g: body.fiber_g || 0
          })
          .select()
          .single();

        if (mealError) {
          console.error('Error creating meal:', mealError);
          return NextResponse.json(
            { error: 'Failed to create meal' },
            { status: 500 }
          );
        }

        // Add the food to the meal
        const { error: foodError } = await supabase
          .from('meal_log_foods')
          .insert({
            meal_log_id: meal.id,
            food_id: body.food_id,
            quantity: body.quantity || 1,
            unit: body.unit || 'serving'
          });

        if (foodError) {
          console.error('Error adding food to meal:', foodError);
          return NextResponse.json(
            { error: 'Failed to add food to meal' },
            { status: 500 }
          );
        }

        return NextResponse.json({ data: meal }, { status: 201 });
      } else if (body.foods && Array.isArray(body.foods)) {
        // Full meal with multiple foods - calculate totals
        let totalCalories = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;
        let totalFiber = 0;

        // Get food details to calculate totals
        for (const food of body.foods) {
          if (food.food_id) {
            const { data: foodData } = await supabase
              .from('foods')
              .select('calories, protein_g, carbs_g, fat_g, fiber_g')
              .eq('id', food.food_id)
              .single();

            if (foodData) {
              const quantity = food.quantity || 1;
              totalCalories += (foodData.calories || 0) * quantity;
              totalProtein += (foodData.protein_g || 0) * quantity;
              totalCarbs += (foodData.carbs_g || 0) * quantity;
              totalFat += (foodData.fat_g || 0) * quantity;
              totalFiber += (foodData.fiber_g || 0) * quantity;
            }
          }
        }

        const { data: meal, error: mealError } = await supabase
          .from('meal_logs')
          .insert({
            user_id: user.id,
            name: body.name || 'Meal',
            category: body.category || 'other',
            logged_at: body.logged_at || new Date().toISOString(),
            notes: body.notes,
            total_calories: totalCalories,
            total_protein_g: totalProtein,
            total_carbs_g: totalCarbs,
            total_fat_g: totalFat,
            total_fiber_g: totalFiber
          })
          .select()
          .single();

        if (mealError) {
          console.error('Error creating meal:', mealError);
          return NextResponse.json(
            { error: 'Failed to create meal' },
            { status: 500 }
          );
        }

        // Add all foods to the meal
        const foodInserts = body.foods.map((food: any) => ({
          meal_log_id: meal.id,
          food_id: food.food_id,
          quantity: food.quantity || 1,
          unit: food.unit || 'serving'
        }));

        const { error: foodError } = await supabase
          .from('meal_log_foods')
          .insert(foodInserts);

        if (foodError) {
          console.error('Error adding foods to meal:', foodError);
          return NextResponse.json(
            { error: 'Failed to add foods to meal' },
            { status: 500 }
          );
        }

        return NextResponse.json({ data: meal }, { status: 201 });
      }
    }

    // Fallback to old schema
    if (hasOldSchema) {
      // Validate required fields
      if (!body.meal_name || !body.meal_category) {
        return NextResponse.json(
          { error: 'meal_name and meal_category are required' },
          { status: 400 }
        );
      }

      // Sanitize input
      const mealData = {
        user_id: user.id,
        meal_name: body.meal_name.trim(),
        meal_category: body.meal_category,
        logged_at: body.logged_at || new Date().toISOString(),
        notes: body.notes?.trim(),
        calories: body.calories ? Number(body.calories) : null,
        protein_g: body.protein_g ? Number(body.protein_g) : null,
        carbs_g: body.carbs_g ? Number(body.carbs_g) : null,
        fat_g: body.fat_g ? Number(body.fat_g) : null,
        fiber_g: body.fiber_g ? Number(body.fiber_g) : null,
      };

      // Insert into database
      const { data: insertedMeal, error: insertError } = await supabase
        .from('meals')
        .insert(mealData)
        .select()
        .single();

      if (insertError) {
        console.error('Database error:', insertError);
        return NextResponse.json(
          { error: 'Failed to create meal' },
          { status: 500 }
        );
      }

      return NextResponse.json({ data: insertedMeal }, { status: 201 });
    }

    // No schema exists
    return NextResponse.json(
      { error: 'No nutrition tables found. Please run database migrations.' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}