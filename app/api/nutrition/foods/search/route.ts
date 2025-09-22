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

    // If no query, return popular/all foods
    if (!query) {
      const { data: foods, error } = await supabase
        .from('foods')
        .select('*')
        .or(`is_public.eq.true,is_verified.eq.true${includeUserFoods ? `,created_by.eq.${user.id}` : ''}`)
        .order('is_verified', { ascending: false })
        .order('name')
        .limit(limit);

      if (error) {
        console.error('Error fetching foods:', error);
        return NextResponse.json({ foods: [] });
      }

      return NextResponse.json({ foods: foods || [] });
    }

    // Search for foods by name
    const { data: foods, error } = await supabase
      .from('foods')
      .select('*')
      .or(`is_public.eq.true,is_verified.eq.true${includeUserFoods ? `,created_by.eq.${user.id}` : ''}`)
      .ilike('name', `%${query}%`)
      .order('is_verified', { ascending: false })
      .order('name')
      .limit(limit);

    if (error) {
      console.error('Error searching foods:', error);
      return NextResponse.json({ foods: [] });
    }

    return NextResponse.json({ foods: foods || [] });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}