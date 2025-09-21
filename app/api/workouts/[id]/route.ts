import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { id } = params;

    // Verify user authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete the workout
    // RLS policy will ensure that users can only delete their own workouts
    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting workout:', error);
      return NextResponse.json({ error: 'Failed to delete workout' }, { status: 500 });
    }

    return new Response(null, { status: 204 }); // No Content
  } catch (error) {
    console.error('Delete workout API error:', error);
    return NextResponse.json({ error: 'An error occurred processing your request' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { id } = params;
    const { name, description, difficulty, type, goal, duration_minutes, exercises } = await request.json();

    // Verify user authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update the workout
    // RLS policy will ensure that users can only update their own workouts
    const { data: updatedWorkout, error } = await supabase
      .from('workouts')
      .update({
        name,
        description,
        difficulty,
        type,
        goal,
        duration_minutes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating workout:', error);
      return NextResponse.json({ error: 'Failed to update workout' }, { status: 500 });
    }

    // Step 2: Delete old workout exercises
    const { error: deleteError } = await supabase
        .from('workout_exercises')
        .delete()
        .eq('workout_id', id);

    if (deleteError) {
        console.error('Error deleting old workout exercises:', deleteError);
        // Don't have to fail the whole request, but log it
    }

    // Step 3: Insert new workout exercises
    if (exercises && exercises.length > 0) {
        const exercisesToInsert = exercises.map((ex, index) => ({
            workout_id: id,
            exercise_id: ex.source === 'global' ? ex.id : null,
            user_exercise_id: ex.source === 'user' ? ex.id : null,
            sets: ex.sets,
            reps: ex.reps,
            rest_seconds: ex.rest,
            order_index: index,
        }));

        const { error: insertError } = await supabase
            .from('workout_exercises')
            .insert(exercisesToInsert);

        if (insertError) {
            console.error('Error inserting new workout exercises:', insertError);
            return NextResponse.json({ error: 'Failed to update workout exercises' }, { status: 500 });
        }
    }

    return NextResponse.json(updatedWorkout);
  } catch (error) {
    console.error('Update workout API error:', error);
    return NextResponse.json({ error: 'An error occurred processing your request' }, { status: 500 });
  }
}
