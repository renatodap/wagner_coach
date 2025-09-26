import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { IntelligentMealParser } from '@/lib/ai/intelligent-meal-parser';

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

    // Initialize intelligent meal parser with OpenRouter API key
    const openRouterKey = process.env.OPENROUTER_API_KEY;

    if (!openRouterKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured. Natural language parsing unavailable.' },
        { status: 503 }
      );
    }

    console.log('Using Intelligent Meal Parser with Perplexity fallback');
    const parser = new IntelligentMealParser(openRouterKey, supabase);

    // Parse the meal description with database search + Perplexity fallback
    const parsedMeal = await parser.parse(body.description, user.id);

    console.log('Parsed meal result:', {
      foods: parsedMeal.foods.length,
      confidence: parsedMeal.confidence,
      requiresConfirmation: parsedMeal.requiresUserConfirmation,
      warnings: parsedMeal.warnings.length
    });

    // Return the parsed meal data for user confirmation
    // Note: We don't save it to the database yet - that happens after user confirms
    return NextResponse.json({
      parsed: parsedMeal,
      originalDescription: body.description,
      requiresConfirmation: parsedMeal.requiresUserConfirmation,
      warnings: parsedMeal.warnings
    });

  } catch (error) {
    console.error('Meal parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to parse meal description' },
      { status: 500 }
    );
  }
}