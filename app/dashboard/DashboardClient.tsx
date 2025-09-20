'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  Calendar,
  ChevronRight,
  Dumbbell,
  Settings,
  LogOut,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';

interface DashboardClientProps {
  profile: any;
  todaysWorkout: any;
  weekWorkouts: any[];
  recentCompletions: any[];
}

export default function DashboardClient({
  profile,
  todaysWorkout,
  weekWorkouts,
  recentCompletions
}: DashboardClientProps) {
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push('/');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 5) return 'RISE AND GRIND';
    if (hour < 12) return 'MORNING WARRIOR';
    if (hour < 17) return 'AFTERNOON ASSAULT';
    if (hour < 22) return 'EVENING CRUSHER';
    return 'MIDNIGHT BEAST';
  };

  const completedThisWeek = weekWorkouts.filter(w => w.completed).length;
  const totalThisWeek = weekWorkouts.filter(w => w.workout_id !== null).length;

  return (
    <div className="min-h-screen bg-iron-black text-iron-white">
      {/* Header */}
      <header className="border-b border-iron-gray">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-heading text-2xl text-iron-orange">IRON DISCIPLINE</h1>
              <p className="text-iron-gray text-sm">
                {getGreeting()}, {profile?.full_name?.toUpperCase() || 'WARRIOR'}
              </p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/settings"
                className="text-iron-gray hover:text-iron-orange transition-colors"
              >
                <Settings className="w-5 h-5" />
              </Link>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="text-iron-gray hover:text-iron-orange transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Today's Workout */}
        {todaysWorkout ? (
          <div className="border-2 border-iron-orange p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="font-heading text-3xl text-iron-orange">
                  TODAY&apos;S MISSION
                </h2>
                <p className="text-iron-gray mt-1">
                  {todaysWorkout.workouts?.name || 'Custom Workout'}
                </p>
              </div>
              {todaysWorkout.completed && (
                <CheckCircle className="w-8 h-8 text-green-500" />
              )}
            </div>

            {!todaysWorkout.completed && todaysWorkout.workouts && (
              <>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-iron-gray">
                    <Clock className="w-4 h-4" />
                    <span>{todaysWorkout.workouts.duration_minutes} minutes</span>
                  </div>
                  <div className="flex items-center gap-2 text-iron-gray">
                    <Dumbbell className="w-4 h-4" />
                    <span>{todaysWorkout.workouts.workout_exercises?.length || 0} exercises</span>
                  </div>
                  <div className="flex items-center gap-2 text-iron-gray">
                    <TrendingUp className="w-4 h-4" />
                    <span className="uppercase">{todaysWorkout.workouts.difficulty}</span>
                  </div>
                </div>

                <Link
                  href={`/workout/${todaysWorkout.id}`}
                  className="flex items-center justify-center gap-2 w-full bg-iron-orange text-iron-black font-heading text-xl py-4 uppercase tracking-widest hover:bg-orange-600 transition-colors"
                >
                  Start Workout
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </>
            )}

            {todaysWorkout.completed && (
              <div className="bg-green-900/20 border border-green-500 p-4">
                <p className="text-green-500 font-heading text-xl">
                  WORKOUT COMPLETED
                </p>
                <p className="text-iron-gray text-sm mt-1">
                  Great job! Rest and recover for tomorrow.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="border-2 border-iron-gray p-6 text-center">
            <h2 className="font-heading text-3xl text-iron-gray mb-2">
              REST DAY
            </h2>
            <p className="text-iron-gray">
              Recovery is part of the process. Stay ready.
            </p>
          </div>
        )}

        {/* Week Progress */}
        <div className="border border-iron-gray p-6">
          <h3 className="font-heading text-2xl text-iron-white mb-4">
            THIS WEEK
          </h3>

          <div className="grid grid-cols-7 gap-2 mb-4">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => {
              const workout = weekWorkouts.find(w => {
                const date = new Date(w.scheduled_date);
                return date.getDay() === index;
              });

              return (
                <div key={index} className="text-center">
                  <p className="text-iron-gray text-xs mb-2">{day}</p>
                  <div className={`h-12 border-2 flex items-center justify-center ${
                    workout?.completed
                      ? 'bg-iron-orange border-iron-orange'
                      : workout?.workout_id
                      ? 'border-iron-gray'
                      : 'border-iron-gray/30'
                  }`}>
                    {workout?.completed && <CheckCircle className="w-5 h-5 text-iron-black" />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center">
            <p className="text-iron-gray">
              {completedThisWeek} of {totalThisWeek} workouts completed
            </p>
            <p className="font-mono text-iron-orange text-lg">
              {totalThisWeek > 0 ? Math.round((completedThisWeek / totalThisWeek) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        {recentCompletions.length > 0 && (
          <div className="border border-iron-gray p-6">
            <h3 className="font-heading text-2xl text-iron-white mb-4">
              RECENT ACTIVITY
            </h3>
            <div className="space-y-3">
              {recentCompletions.map((completion: any) => (
                <div key={completion.id} className="flex justify-between items-center py-2 border-b border-iron-gray/30 last:border-0">
                  <div>
                    <p className="text-iron-white">
                      {completion.workouts?.name || 'Workout'}
                    </p>
                    <p className="text-iron-gray text-sm">
                      {new Date(completion.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-iron-black border-t border-iron-gray">
          <div className="max-w-4xl mx-auto px-4">
            <div className="grid grid-cols-3 py-2">
              <Link
                href="/dashboard"
                className="flex flex-col items-center gap-1 py-2 text-iron-orange"
              >
                <Dumbbell className="w-5 h-5" />
                <span className="text-[10px] uppercase">Workout</span>
              </Link>
              <Link
                href="/progress"
                className="flex flex-col items-center gap-1 py-2 text-iron-gray hover:text-iron-orange transition-colors"
              >
                <Calendar className="w-5 h-5" />
                <span className="text-[10px] uppercase">Progress</span>
              </Link>
              <Link
                href="/settings"
                className="flex flex-col items-center gap-1 py-2 text-iron-gray hover:text-iron-orange transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span className="text-[10px] uppercase">Settings</span>
              </Link>
            </div>
          </div>
        </nav>
      </main>
    </div>
  );
}