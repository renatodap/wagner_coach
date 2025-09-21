import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET all user exercises
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: exercises, error } = await supabase
      .from('user_exercises')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching user exercises:', error);
      return NextResponse.json({ error: 'Failed to fetch user exercises' }, { status: 500 });
    }

    return NextResponse.json(exercises);

  } catch (error) {
    console.error('Fetch user exercises API error:', error);
    return NextResponse.json({ error: 'An error occurred processing your request' }, { status: 500 });
  }
}

// POST a new user exercise
export async function POST(request: NextRequest) {
  try {
    const { name, category, muscle_group, equipment, instructions } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Exercise name is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify user authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: newExercise, error } = await supabase
      .from('user_exercises')
      .insert({
        user_id: user.id,
        name,
        category,
        muscle_group,
        equipment,
        instructions,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user exercise:', error);
      return NextResponse.json({ error: 'Failed to create user exercise' }, { status: 500 });
    }

    return NextResponse.json(newExercise, { status: 201 });

  } catch (error) {
    console.error('Create user exercise API error:', error);
    return NextResponse.json({ error: 'An error occurred processing your request' }, { status: 500 });
  }
}
