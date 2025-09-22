import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Get search parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    const includeUserFoods = searchParams.get('includeUserFoods') !== 'false';

    // First, check if user_food_frequency table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('user_food_frequency')
      .select('food_id')
      .limit(1);

    const hasFrequencyTracking = !tableError;

    // Get user's frequently logged foods if table exists
    let personalizedFoods = [];
    let excludeIds = [];

    if (hasFrequencyTracking) {
      // Get user's frequently logged foods
      const { data: frequentFoods, error: freqError } = await supabase
        .from('user_food_frequency')
        .select(`
          food_id,
          log_count,
          last_logged_at,
          last_quantity,
          last_unit,
          favorite,
          foods!inner (*)
        `)
        .eq('user_id', user.id)
        .order('favorite', { ascending: false })
        .order('log_count', { ascending: false })
        .order('last_logged_at', { ascending: false })
        .limit(100); // Get more to filter

      if (frequentFoods && frequentFoods.length > 0) {
        // Filter by search query if provided
        const filtered = frequentFoods.filter(item =>
          !query ||
          item.foods.name.toLowerCase().includes(query.toLowerCase()) ||
          (item.foods.brand && item.foods.brand.toLowerCase().includes(query.toLowerCase()))
        );

        // Take top results for personalized section
        personalizedFoods = filtered.slice(0, Math.floor(limit * 0.6)).map(item => ({
          ...item.foods,
          _personalized: true,
          _log_count: item.log_count,
          _last_logged: item.last_logged_at,
          _last_quantity: item.last_quantity,
          _last_unit: item.last_unit,
          _is_favorite: item.favorite,
          _relevance: item.favorite ? 10000 : (item.log_count * 100)
        }));

        excludeIds = personalizedFoods.map(f => f.id);
      }
    }

    // Calculate remaining limit for general search
    const remainingLimit = limit - personalizedFoods.length;

    // Get additional foods from main database if needed
    if (remainingLimit > 0) {
      let searchQuery = supabase
        .from('foods')
        .select('*')
        .or(`is_public.eq.true,is_verified.eq.true${includeUserFoods ? `,created_by.eq.${user.id}` : ''}`);

      // Apply search filter
      if (query) {
        searchQuery = searchQuery.or(`name.ilike.%${query}%,brand.ilike.%${query}%`);
      }

      // Exclude already shown personalized foods
      if (excludeIds.length > 0) {
        searchQuery = searchQuery.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      const { data: additionalFoods, error: searchError } = await searchQuery
        .order('is_verified', { ascending: false })
        .order('name')
        .limit(remainingLimit);

      if (additionalFoods) {
        // Combine results with personalized foods first
        const allFoods = [
          ...personalizedFoods,
          ...additionalFoods.map(f => ({ ...f, _personalized: false, _relevance: 0 }))
        ];

        return NextResponse.json({
          foods: allFoods,
          personalized: personalizedFoods.length > 0,
          frequentCount: personalizedFoods.length
        });
      }
    }

    return NextResponse.json({
      foods: personalizedFoods,
      personalized: personalizedFoods.length > 0,
      frequentCount: personalizedFoods.length
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}