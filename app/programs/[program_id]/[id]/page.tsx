import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import ProgramDetailClient from './ProgramDetailClient';

export default async function ProgramDetailPage({
  params
}: {
  params: { id: string }
}) {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // Get program details with days and exercises
  const { data: program, error } = await supabase
    .from('workout_programs')
    .select(`
      *,
      program_days!inner(
        *,
        day_exercises(
          *,
          exercises(
            id,
            name,
            category_id,
            equipment_id,
            primary_muscle_id,
            difficulty_level,
            is_bodyweight
          )
        )
      )
    `)
    .eq('id', params.id)
    .single();

  if (error || !program) {
    notFound();
  }

  // Get user's enrollment status
  const { data: enrollment } = await supabase
    .from('user_program_enrollments')
    .select('*')
    .eq('user_id', user.id)
    .eq('program_id', params.id)
    .single();

  // Get program completions by this user
  const { data: completions } = await supabase
    .from('program_day_completions')
    .select('*')
    .eq('user_id', user.id)
    .eq('enrollment_id', enrollment?.id);

  return (
    <ProgramDetailClient
      program={program}
      enrollment={enrollment}
      completions={completions || []}
      userId={user.id}
    />
  );
}