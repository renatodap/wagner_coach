import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MealParser } from '@/lib/ai/meal-parser';

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
    let body: { description: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    if (!body.description || typeof body.description !== 'string') {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    // Initialize meal parser with OpenAI API key if available
    const apiKey = process.env.OPENAI_API_KEY;
    const parser = new MealParser(apiKey);

    // Parse the meal description
    const parsedMeal = await parser.parseMealDescription(body.description);

    // Return the parsed meal data for user confirmation
    // Note: We don't save it to the database yet - that happens after user confirms
    return NextResponse.json({
      parsed: parsedMeal,
      originalDescription: body.description
    });

  } catch (error) {
    console.error('Meal parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to parse meal description' },
      { status: 500 }
    );
  }
}