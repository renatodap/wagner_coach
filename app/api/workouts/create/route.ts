import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { name, description, difficulty, type, goal, duration_minutes } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Workout name is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify user authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Insert the new workout
    const { data: newWorkout, error } = await supabase
      .from('workouts')
      .insert({
        user_id: user.id,
        name,
        description,
        difficulty,
        type,
        goal,
        duration_minutes,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating workout:', error);
      return NextResponse.json({ error: 'Failed to create workout' }, { status: 500 });
    }

    return NextResponse.json(newWorkout, { status: 201 });

  } catch (error) {
    console.error('Create workout API error:', error);
    return NextResponse.json({ error: 'An error occurred processing your request' }, { status: 500 });
  }
}
