'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  TrendingUp,
  Calendar,
  Target,
  CheckCircle,
  Dumbbell,
  Settings,
  Flame,
  PlayCircle,
  PauseCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ExerciseCompletion {
  exercises?: {
    name: string;
  };
  sets_completed: number;
}

interface WorkoutCompletion {
  id: number;
  started_at: string;
  completed_at: string;
  workouts?: {
    name: string;
    difficulty?: string;
  };
  exercise_completions?: ExerciseCompletion[];
}

interface ActiveSession {
  id: number;
  workout_name: string;
  workout_id: number;
  status: 'active' | 'paused';
  started_at: string;
  current_exercise_index: number;
  current_set_index: number;
}

interface ProgressClientProps {
  completions: WorkoutCompletion[];
  stats: {
    totalCompleted: number;
    totalScheduled: number;
    completionRate: number;
    currentStreak: number;
  };
}

export default function ProgressClient({ completions, stats }: ProgressClientProps) {
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchUserAndSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserAndSessions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);

      // Fetch active/paused workout sessions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: sessions } = await (supabase as any)
        .from('user_active_sessions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'paused']);

      if (sessions) {
        setActiveSessions(sessions);
      }
    }
  };

  const resumeWorkout = (sessionId: number) => {
    router.push(`/workout/active/${sessionId}`);
  };

  const formatDuration = (started: string, completed: string) => {
    const start = new Date(started);
    const end = new Date(completed);
    const minutes = Math.floor((end.getTime() - start.getTime()) / 60000);
    return `${minutes} min`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getElapsedTime = (startedAt: string) => {
    const start = new Date(startedAt).getTime();
    const now = Date.now();
    const elapsed = Math.floor((now - start) / 60000);
    return `${elapsed} min elapsed`;
  };

  return (
    <div className="min-h-screen bg-iron-black text-iron-white">
      {/* Header */}
      <header className="border-b border-iron-gray">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-iron-gray hover:text-iron-orange transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </Link>
            <h1 className="font-heading text-2xl text-iron-orange uppercase tracking-wider">
              Progress
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 pb-24 space-y-8">
        {/* Active/Paused Workouts */}
        {activeSessions.length > 0 && (
          <div className="border-2 border-iron-orange p-4 bg-iron-orange/10">
            <h2 className="font-heading text-xl text-iron-orange mb-3">
              WORKOUT IN PROGRESS
            </h2>
            <div className="space-y-2">
              {activeSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex justify-between items-center p-3 bg-iron-black border border-iron-gray"
                >
                  <div className="flex items-center gap-3">
                    {session.status === 'active' ? (
                      <PlayCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <PauseCircle className="w-6 h-6 text-yellow-500" />
                    )}
                    <div>
                      <p className="text-iron-white font-semibold">
                        {session.workout_name}
                      </p>
                      <p className="text-iron-gray text-sm">
                        {getElapsedTime(session.started_at)} • Exercise {session.current_exercise_index + 1} • Set {session.current_set_index + 1}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => resumeWorkout(session.id)}
                    className="px-4 py-2 bg-iron-orange text-iron-black font-heading hover:bg-iron-white transition-colors"
                  >
                    {session.status === 'active' ? 'CONTINUE' : 'RESUME'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-iron-gray p-4">
            <div className="flex items-center gap-2 text-iron-gray mb-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs uppercase">Completed</span>
            </div>
            <p className="font-heading text-3xl text-iron-orange">
              {stats.totalCompleted}
            </p>
            <p className="text-iron-gray text-xs mt-1">
              workouts
            </p>
          </div>

          <div className="border border-iron-gray p-4">
            <div className="flex items-center gap-2 text-iron-gray mb-2">
              <Target className="w-4 h-4" />
              <span className="text-xs uppercase">Success Rate</span>
            </div>
            <p className="font-heading text-3xl text-iron-orange">
              {stats.completionRate}%
            </p>
            <p className="text-iron-gray text-xs mt-1">
              of scheduled
            </p>
          </div>

          <div className="border border-iron-gray p-4">
            <div className="flex items-center gap-2 text-iron-gray mb-2">
              <Flame className="w-4 h-4" />
              <span className="text-xs uppercase">Streak</span>
            </div>
            <p className="font-heading text-3xl text-iron-orange">
              {stats.currentStreak}
            </p>
            <p className="text-iron-gray text-xs mt-1">
              days
            </p>
          </div>

          <div className="border border-iron-gray p-4">
            <div className="flex items-center gap-2 text-iron-gray mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs uppercase">Total</span>
            </div>
            <p className="font-heading text-3xl text-iron-orange">
              {stats.totalScheduled}
            </p>
            <p className="text-iron-gray text-xs mt-1">
              scheduled
            </p>
          </div>
        </div>

        {/* Workout History */}
        <div className="border border-iron-gray p-6">
          <h2 className="font-heading text-2xl text-iron-white mb-6">
            WORKOUT HISTORY
          </h2>

          {completions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-iron-gray">No workouts completed yet</p>
              <Link
                href="/dashboard"
                className="inline-block mt-4 text-iron-orange hover:text-orange-600 transition-colors"
              >
                Start your first workout →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {completions.map((completion) => (
                <div
                  key={completion.id}
                  className="border-b border-iron-gray/30 pb-4 last:border-0"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-heading text-lg text-iron-white">
                        {completion.workouts?.name || 'Workout'}
                      </h3>
                      <p className="text-iron-gray text-sm">
                        {formatDate(completion.completed_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-iron-orange">
                        {formatDuration(completion.started_at, completion.completed_at)}
                      </p>
                      {completion.workouts?.difficulty && (
                        <p className="text-iron-gray text-xs uppercase">
                          {completion.workouts.difficulty}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Exercise Summary */}
                  {completion.exercise_completions && completion.exercise_completions.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {completion.exercise_completions.slice(0, 3).map((exercise, index) => (
                        <div key={index} className="flex items-center gap-2 text-iron-gray text-sm">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span>{exercise.exercises?.name}</span>
                          <span className="text-iron-orange">
                            {exercise.sets_completed} sets
                          </span>
                        </div>
                      ))}
                      {completion.exercise_completions.length > 3 && (
                        <p className="text-iron-gray text-sm">
                          +{completion.exercise_completions.length - 3} more exercises
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Motivational Quote */}
        <div className="border-2 border-iron-orange p-6 text-center">
          <p className="font-heading text-xl text-iron-orange">
            &quot;THE PAIN OF DISCIPLINE WEIGHS OUNCES,&quot;
          </p>
          <p className="font-heading text-xl text-iron-orange mt-2">
            &quot;THE PAIN OF REGRET WEIGHS TONS&quot;
          </p>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-iron-black border-t border-iron-gray">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-3 py-2">
            <Link
              href="/dashboard"
              className="flex flex-col items-center gap-1 py-2 text-iron-gray hover:text-iron-orange transition-colors"
            >
              <Dumbbell className="w-5 h-5" />
              <span className="text-[10px] uppercase">Workout</span>
            </Link>
            <Link
              href="/progress"
              className="flex flex-col items-center gap-1 py-2 text-iron-orange"
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
    </div>
  );
}