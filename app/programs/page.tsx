import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProgramsClient from './ProgramsClient';

export default async function ProgramsPage() {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get all Wagner programs
  const { data: programs, error } = await supabase
    .from('workout_programs')
    .select(`
      *,
      user_program_enrollments!left(
        id,
        status,
        current_day,
        days_completed
      )
    `)
    .eq('is_public', true)
    .eq('is_verified', true)
    .order('popularity_score', { ascending: false });

  if (error) {
    console.error('Error fetching programs:', error);
  }

  // Process programs to include enrollment info for current user
  const programsWithEnrollment = programs?.map(program => ({
    ...program,
    enrollment: program.user_program_enrollments?.find(
      (e: any) => e.user_id === user.id
    ) || null,
    user_program_enrollments: undefined
  })) || [];

  // Get Wagner's collection stats
  const collections = {
    'Main_80': { name: 'Main Routines', count: 80 },
    'Functional_40': { name: 'Functional Training', count: 40 },
    'PowerBodybuilding_52': { name: 'Power Bodybuilding', count: 52 }
  };

  return (
    <ProgramsClient
      profile={profile}
      programs={programsWithEnrollment}
      collections={collections}
      userId={user.id}
    />
  );
}