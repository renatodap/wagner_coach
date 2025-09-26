import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Food ID is required' },
        { status: 400 }
      );
    }

    // Get the food - allow user's own foods or public/verified foods
    const { data: food, error } = await supabase
      .from('foods')
      .select('*')
      .eq('id', id)
      .or(`created_by.eq.${user.id},is_public.eq.true,is_verified.eq.true`)
      .single();

    if (error) {
      console.error('Error fetching food:', error);
      return NextResponse.json(
        { error: 'Food not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ food });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}