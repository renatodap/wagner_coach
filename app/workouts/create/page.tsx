import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CreateWorkoutForm from './CreateWorkoutForm';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default async function CreateWorkoutPage() {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  return (
    <div className="min-h-screen bg-iron-black text-iron-white">
      <header className="border-b border-iron-gray">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            href="/workouts"
            className="flex items-center gap-2 text-iron-gray hover:text-iron-orange transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Workout Library
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-2 mb-8">
          <h1 className="font-heading text-3xl text-iron-orange">
            Create New Workout
          </h1>
          <p className="text-iron-gray">
            Define the details of your new workout template. You can add exercises in the next step.
          </p>
        </div>
        <CreateWorkoutForm userId={user.id} />
      </main>
    </div>
  );
}
