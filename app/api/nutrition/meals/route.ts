import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MealInsert } from '@/types/nutrition';

// Helper function to sanitize input
function sanitizeInput(input: string): string {
  return input.replace(/<[^>]*>?/gm, '').trim();
}

// Validation function
function validateMealData(data: unknown): { valid: boolean; error?: string } {
  // Check required fields
  if (!data.meal_name || typeof data.meal_name !== 'string' || data.meal_name.trim().length === 0) {
    return { valid: false, error: 'meal_name is required' };
  }

  if (data.meal_name.length > 200) {
    return { valid: false, error: 'meal_name must be 200 characters or less' };
  }

  if (!data.meal_category || !['breakfast', 'lunch', 'dinner', 'snack'].includes(data.meal_category)) {
    return { valid: false, error: 'Invalid meal category' };
  }

  if (!data.logged_at) {
    return { valid: false, error: 'logged_at is required' };
  }

  // Validate date
  const loggedAtDate = new Date(data.logged_at);
  if (isNaN(loggedAtDate.getTime())) {
    return { valid: false, error: 'Invalid date format for logged_at' };
  }

  // Validate optional numeric fields
  const numericFields = ['calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g'];
  for (const field of numericFields) {
    if (data[field] !== undefined && data[field] !== null) {
      const value = Number(data[field]);
      if (isNaN(value) || value < 0) {
        return { valid: false, error: `${field} must be a positive number` };
      }
    }
  }

  // Validate notes if provided
  if (data.notes && typeof data.notes === 'string' && data.notes.length > 500) {
    return { valid: false, error: 'notes must be 500 characters or less' };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    // Get Supabase client
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
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate input
    const validation = validateMealData(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Sanitize and prepare data
    const mealData: MealInsert & { user_id: string } = {
      user_id: user.id,
      meal_name: sanitizeInput(body.meal_name),
      meal_category: body.meal_category,
      logged_at: body.logged_at,
      notes: body.notes ? sanitizeInput(body.notes) : null,
      calories: body.calories !== undefined ? Number(body.calories) : null,
      protein_g: body.protein_g !== undefined ? Number(body.protein_g) : null,
      carbs_g: body.carbs_g !== undefined ? Number(body.carbs_g) : null,
      fat_g: body.fat_g !== undefined ? Number(body.fat_g) : null,
      fiber_g: body.fiber_g !== undefined ? Number(body.fiber_g) : null,
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

    // Return success response
    return NextResponse.json(
      { data: insertedMeal },
      { status: 201 }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get Supabase client
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query
    let query = supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(limit);

    // Filter by date if provided
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query = query
        .gte('logged_at', startOfDay.toISOString())
        .lte('logged_at', endOfDay.toISOString());
    }

    // Execute query
    const { data: meals, error: queryError } = await query;

    if (queryError) {
      console.error('Database query error:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch meals' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: meals });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}