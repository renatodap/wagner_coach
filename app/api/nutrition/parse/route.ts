import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { IntelligentMealParser, IntelligentParsedMeal, ParsedFoodItem } from '@/lib/ai/intelligent-meal-parser';
import type { SupabaseClient } from '@supabase/supabase-js';

// Simple parser for basic meal descriptions without AI
async function parseSimpleMeal(
  description: string,
  supabase: SupabaseClient
): Promise<IntelligentParsedMeal | null> {
  try {
    const normalized = description.toLowerCase().trim();

    // Extract quantity and food name
    const patterns = [
      /(\d+(?:\.\d+)?)\s*(?:g|grams?|oz|ounces?|cups?|tbsp|tablespoons?)?\s*(?:of\s+)?(.+)/,
      /(one|two|three|four|five|six|seven|eight|nine|ten|a|an)\s+(.+)/
    ];

    let quantity = 100; // default
    let foodName = normalized;

    for (const pattern of patterns) {
      const match = normalized.match(pattern);
      if (match) {
        const quantityStr = match[1];
        foodName = match[2].trim();

        // Convert words to numbers
        const wordToNumber: Record<string, number> = {
          'one': 1, 'a': 1, 'an': 1,
          'two': 2, 'three': 3, 'four': 4, 'five': 5,
          'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
        };

        if (quantityStr in wordToNumber) {
          // For items, assume 1 serving (e.g., "one egg" = ~50g)
          quantity = 100; // We'll use the serving size from the database
        } else {
          quantity = parseFloat(quantityStr) || 100;
        }
        break;
      }
    }

    // Clean up food name - remove common words
    foodName = foodName.replace(/^\s*(some|of)\s+/g, '');

    console.log(`Simple parser extracted: ${quantity} of "${foodName}"`);

    // Search in database
    const { data: foods, error } = await supabase
      .from('foods')
      .select('*')
      .or(`name.ilike.%${foodName}%,search_keywords.cs.{${foodName}}`)
      .limit(1);

    if (error || !foods || foods.length === 0) {
      console.log('No food match found for:', foodName);
      return null;
    }

    const food = foods[0];

    // Calculate nutrition based on quantity
    const multiplier = quantity / (food.serving_size || 100);

    const parsedFood: ParsedFoodItem = {
      name: food.name,
      brand: food.brand,
      quantity: quantity,
      unit: food.unit || 'g',
      foodId: food.id,
      nutrition: {
        calories: Math.round((food.calories || 0) * multiplier),
        protein_g: (food.protein_g || 0) * multiplier,
        carbs_g: (food.carbs_g || 0) * multiplier,
        fat_g: (food.fat_g || 0) * multiplier,
        fiber_g: (food.fiber_g || 0) * multiplier
      },
      confidence: 'medium',
      source: 'database',
      needsConfirmation: true
    };

    const now = new Date().toISOString();
    const hour = new Date().getHours();
    let category = 'other';

    if (hour >= 5 && hour < 11) category = 'breakfast';
    else if (hour >= 11 && hour < 14) category = 'lunch';
    else if (hour >= 17 && hour < 21) category = 'dinner';
    else if (hour >= 14 && hour < 17 || hour >= 21) category = 'snack';

    return {
      meal_name: `Quick meal`,
      category,
      logged_at: now,
      foods: [parsedFood],
      total_calories: parsedFood.nutrition.calories,
      total_protein_g: parsedFood.nutrition.protein_g,
      total_carbs_g: parsedFood.nutrition.carbs_g,
      total_fat_g: parsedFood.nutrition.fat_g,
      confidence: 'medium',
      warnings: [],
      requiresUserConfirmation: true
    };

  } catch (error) {
    console.error('Simple parser error:', error);
    return null;
  }
}

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

    // Initialize intelligent meal parser with OpenAI API key
    const openAIKey = process.env.OPENAI_API_KEY;

    if (!openAIKey || openAIKey.trim() === '') {
      // Fallback: Simple parsing without AI
      console.log('No OpenAI API key, using simple fallback parser');

      // Try to parse basic patterns like "1 egg white" or "egg white"
      const simpleResult = await parseSimpleMeal(body.description, supabase);

      if (simpleResult) {
        return NextResponse.json({
          parsed: simpleResult,
          originalDescription: body.description,
          requiresConfirmation: true,
          warnings: ['AI parsing unavailable - using simple pattern matching']
        });
      }

      return NextResponse.json(
        { error: 'Could not parse meal. Please use the manual food search instead.' },
        { status: 400 }
      );
    }

    console.log('Using Intelligent Meal Parser with OpenAI');
    const parser = new IntelligentMealParser(openAIKey, supabase);

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