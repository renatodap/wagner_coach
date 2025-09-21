import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { workout_id, exercises } = await request.json();

    if (!workout_id || !exercises || !Array.isArray(exercises)) {
      return NextResponse.json({ error: 'Workout ID and exercises are required' }, { status: 400 });
    }

    const supabase = await createClient();

    const exercisesToInsert = exercises.map((ex, index) => ({
      workout_id,
      exercise_id: ex.source === 'global' ? ex.id : null,
      user_exercise_id: ex.source === 'user' ? ex.id : null,
      sets: ex.sets,
      reps: ex.reps,
      rest_seconds: ex.rest,
      order_index: index,
    }));

    const { error } = await supabase
      .from('workout_exercises')
      .insert(exercisesToInsert);

    if (error) {
      console.error('Error saving workout exercises:', error);
      return NextResponse.json({ error: 'Failed to save workout exercises' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Workout exercises saved successfully' }, { status: 201 });

  } catch (error) {
    console.error('Save workout exercises API error:', error);
    return NextResponse.json({ error: 'An error occurred processing your request' }, { status: 500 });
  }
}
