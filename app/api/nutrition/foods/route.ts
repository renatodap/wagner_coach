import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/nutrition/foods - Create a custom food
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.serving_size || !body.serving_unit) {
      return NextResponse.json(
        { error: 'Name, serving size, and serving unit are required' },
        { status: 400 }
      );
    }

    // Create the food (V2 schema)
    const { data, error } = await supabase
      .from('foods')
      .insert({
        name: body.name,
        brand: body.brand || null,
        barcode: body.barcode || null,
        barcodes: body.barcodes || (body.barcode ? [body.barcode] : null),
        serving_size: body.serving_size,
        serving_unit: body.serving_unit,
        serving_description: body.serving_description || null,
        household_serving_unit: body.household_serving_unit || null,
        household_serving_grams: body.household_serving_grams || null,
        calories: body.calories || null,
        protein_g: body.protein_g || null,
        total_carbs_g: body.total_carbs_g || body.carbs_g || null,
        total_fat_g: body.total_fat_g || body.fat_g || null,
        dietary_fiber_g: body.dietary_fiber_g || body.fiber_g || null,
        sugars_g: body.sugars_g || body.sugar_g || null,
        sodium_mg: body.sodium_mg || null,
        food_type: body.food_type || 'custom',
        is_public: body.is_public || false,
        is_verified: false,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating food:', error);
      throw error;
    }

    return NextResponse.json({ food: data });
  } catch (error) {
    console.error('Error in create food endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to create food' },
      { status: 500 }
    );
  }
}

// GET /api/nutrition/foods - Get user's custom foods
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const includePublic = searchParams.get('includePublic') === 'true';

    // Build query
    let query = supabase
      .from('foods')
      .select('*');

    if (includePublic) {
      // Get user's foods and public foods
      query = query.or(`created_by.eq.${user.id},is_public.eq.true`);
    } else {
      // Get only user's foods
      query = query.eq('created_by', user.id);
    }

    // Execute query
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching foods:', error);
      throw error;
    }

    return NextResponse.json({ foods: data || [] });
  } catch (error) {
    console.error('Error in get foods endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch foods' },
      { status: 500 }
    );
  }
}