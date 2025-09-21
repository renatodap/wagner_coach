import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET a single user exercise
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { id } = params;

    const { data: exercise, error } = await supabase
      .from('user_exercises')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    return NextResponse.json(exercise);
  } catch (error) {
    console.error('Fetch single user exercise API error:', error);
    return NextResponse.json({ error: 'An error occurred processing your request' }, { status: 500 });
  }
}

// PUT (update) a user exercise
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { id } = params;
    const { name, category, muscle_group, equipment, instructions } = await request.json();

    const { data: updatedExercise, error } = await supabase
      .from('user_exercises')
      .update({
        name,
        category,
        muscle_group,
        equipment,
        instructions,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user exercise:', error);
      return NextResponse.json({ error: 'Failed to update user exercise' }, { status: 500 });
    }

    return NextResponse.json(updatedExercise);
  } catch (error) {
    console.error('Update user exercise API error:', error);
    return NextResponse.json({ error: 'An error occurred processing your request' }, { status: 500 });
  }
}

// DELETE a user exercise
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { id } = params;

    const { error } = await supabase
      .from('user_exercises')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user exercise:', error);
      return NextResponse.json({ error: 'Failed to delete user exercise' }, { status: 500 });
    }

    return new Response(null, { status: 204 }); // No Content
  } catch (error) {
    console.error('Delete user exercise API error:', error);
    return NextResponse.json({ error: 'An error occurred processing your request' }, { status: 500 });
  }
}
