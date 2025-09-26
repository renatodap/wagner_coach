import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SafePerplexityParser } from '@/lib/ai/safe-perplexity-parser';

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
    let body: { foodName: string; brand?: string; validate?: boolean };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    if (!body.foodName || typeof body.foodName !== 'string') {
      return NextResponse.json(
        { error: 'foodName is required' },
        { status: 400 }
      );
    }

    // Check if OpenRouter key is configured
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      return NextResponse.json(
        {
          error: 'Web search is not configured',
          fallback: true,
          message: 'Please use the manual food search instead'
        },
        { status: 503 }
      );
    }

    console.log('🌐 Web search request:', {
      foodName: body.foodName,
      brand: body.brand,
      userId: user.id
    });

    // Initialize safe parser with rate limiting and sanity checks
    const parser = new SafePerplexityParser(openRouterKey, supabase, user.id);

    // Search for the food
    const searchResult = await parser.searchForFood(body.foodName, body.brand);

    console.log('📊 Search result:', {
      found: searchResult.found,
      sanityChecksPassed: searchResult.sanityChecksPassed,
      warnings: searchResult.warnings.length,
      cost: searchResult.searchCost
    });

    // If not found or failed sanity checks, return early
    if (!searchResult.found || !searchResult.sanityChecksPassed) {
      return NextResponse.json({
        found: false,
        warnings: searchResult.warnings,
        message: 'Could not find reliable nutrition data. Please add manually or try a different search term.'
      });
    }

    // If user validated the data, save to database
    let savedFoodId = null;
    if (body.validate && searchResult.foodData) {
      const saveResult = await parser.saveToDatabase(searchResult.foodData, true);
      if (saveResult.success) {
        savedFoodId = saveResult.foodId;
        console.log('💾 Saved validated food to database:', savedFoodId);
      } else {
        console.warn('⚠️ Could not save to database:', saveResult.error);
      }
    }

    // Return the result
    return NextResponse.json({
      found: true,
      foodData: searchResult.foodData,
      foodId: savedFoodId,
      requiresValidation: searchResult.requiresValidation,
      warnings: searchResult.warnings,
      searchCost: searchResult.searchCost,
      savedToDatabase: !!savedFoodId
    });

  } catch (error) {
    console.error('Web search error:', error);
    return NextResponse.json(
      {
        error: 'Web search failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check rate limit status
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

    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get user's usage stats
    const { count: dailyCount } = await supabase
      .from('perplexity_searches')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', todayStart.toISOString());

    const { count: monthlyCount } = await supabase
      .from('perplexity_searches')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', monthStart.toISOString());

    const { data: monthCosts } = await supabase
      .from('perplexity_searches')
      .select('search_cost')
      .eq('user_id', user.id)
      .gte('created_at', monthStart.toISOString());

    const totalCost = monthCosts
      ? monthCosts.reduce((sum, record) => sum + (record.search_cost || 0), 0)
      : 0;

    return NextResponse.json({
      limits: {
        daily: { used: dailyCount || 0, limit: 10 },
        monthly: { used: monthlyCount || 0, limit: 100 },
        cost: { used: totalCost, limit: 50 }
      },
      canSearch: (dailyCount || 0) < 10 && (monthlyCount || 0) < 100 && totalCost < 50
    });

  } catch (error) {
    console.error('Rate limit check error:', error);
    return NextResponse.json(
      { error: 'Failed to check rate limits' },
      { status: 500 }
    );
  }
}