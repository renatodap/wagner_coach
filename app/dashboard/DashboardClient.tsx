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
  TrendingUp,
  Star,
  Search,
  Filter
} from 'lucide-react';
import { Profile, UserWorkout, WorkoutCompletion } from '@/lib/types';

interface Workout {
  id: number;
  name: string;
  type: string;
  goal: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  estimated_duration_minutes: number;
  is_favorite: boolean;
}

interface DashboardClientProps {
  profile: Profile | null;
  todaysWorkout: UserWorkout | null;
  weekWorkouts: UserWorkout[];
  recentCompletions: WorkoutCompletion[];
  allWorkouts: Workout[];
  userId: string;
}

export default function DashboardClient({
  profile,
  todaysWorkout,
  weekWorkouts,
  recentCompletions,
  allWorkouts,
  userId
}: DashboardClientProps) {
  const [signingOut, setSigningOut] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [workouts, setWorkouts] = useState(allWorkouts);
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

  // Filter workouts based on search and filters
  const filteredWorkouts = workouts.filter(workout => {
    const matchesSearch = searchTerm === '' ||
      workout.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (workout.description && workout.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = selectedType === '' || workout.type === selectedType;
    const matchesFavorites = !showFavoritesOnly || workout.is_favorite;

    return matchesSearch && matchesType && matchesFavorites;
  });

  const toggleFavorite = async (workoutId: number, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const { data } = await (supabase as any).rpc('toggle_favorite_workout', {
        p_user_id: userId,
        p_workout_id: workoutId
      });

      // Update local state
      setWorkouts(workouts.map(w =>
        w.id === workoutId ? { ...w, is_favorite: data } : w
      ));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const startWorkout = async (workoutId: number) => {
    try {
      const { data: sessionId } = await (supabase as any).rpc('start_workout_session', {
        p_user_id: userId,
        p_workout_id: workoutId
      });

      if (sessionId) {
        router.push(`/workout/active/${sessionId}`);
      }
    } catch (error) {
      console.error('Error starting workout:', error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-500 border-green-500';
      case 'intermediate': return 'text-iron-orange border-iron-orange';
      case 'advanced': return 'text-red-500 border-red-500';
      default: return 'text-iron-gray border-iron-gray';
    }
  };

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

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">

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
              {recentCompletions.map((completion) => (
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

        {/* Workout Library */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-heading text-2xl text-iron-white">
              WORKOUT LIBRARY
            </h3>
            <Link
              href="/progress"
              className="text-iron-gray hover:text-iron-orange transition-colors flex items-center gap-1"
            >
              <TrendingUp className="w-4 h-4" />
              View Progress
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="mb-4 space-y-3">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-iron-gray" />
                <input
                  type="text"
                  placeholder="Search workouts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-iron-gray/10 border border-iron-gray pl-10 pr-4 py-2 text-iron-white placeholder-iron-gray focus:border-iron-orange focus:outline-none"
                />
              </div>
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`px-4 py-2 border ${showFavoritesOnly ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'border-iron-gray text-iron-gray'} flex items-center gap-2 hover:border-yellow-500 transition-colors`}
              >
                <Star className={`w-5 h-5 ${showFavoritesOnly ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setSelectedType('')}
                className={`px-3 py-1 border ${selectedType === '' ? 'bg-iron-orange text-iron-black border-iron-orange' : 'border-iron-gray text-iron-gray'} text-sm whitespace-nowrap`}
              >
                All
              </button>
              {['push', 'pull', 'legs', 'upper', 'lower', 'full_body', 'core'].map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1 border ${selectedType === type ? 'bg-iron-orange text-iron-black border-iron-orange' : 'border-iron-gray text-iron-gray'} text-sm whitespace-nowrap`}
                >
                  {type.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Workouts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-20">
            {filteredWorkouts.map((workout) => (
              <div
                key={workout.id}
                onClick={() => startWorkout(workout.id)}
                className="border border-iron-gray p-4 hover:border-iron-orange transition-colors cursor-pointer relative"
              >
                {/* Favorite Star */}
                <button
                  onClick={(e) => toggleFavorite(workout.id, e)}
                  className="absolute top-3 right-3 z-10"
                >
                  <Star
                    className={`w-5 h-5 ${workout.is_favorite ? 'text-yellow-500 fill-current' : 'text-iron-gray'} hover:text-yellow-500 transition-colors`}
                  />
                </button>

                {/* Workout Info */}
                <h4 className="font-heading text-lg text-iron-white mb-2 pr-8">
                  {workout.name}
                </h4>

                <p className="text-iron-gray text-sm mb-3 line-clamp-2">
                  {workout.description || 'No description available'}
                </p>

                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-xs px-2 py-1 border uppercase ${getDifficultyColor(workout.difficulty)}`}>
                    {workout.difficulty}
                  </span>
                  <span className="text-iron-gray text-xs uppercase">
                    {workout.type.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-iron-gray text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{workout.estimated_duration_minutes || 45} min</span>
                </div>
              </div>
            ))}
          </div>

          {filteredWorkouts.length === 0 && (
            <div className="text-center py-8">
              <Dumbbell className="w-16 h-16 text-iron-gray mx-auto mb-4" />
              <p className="text-iron-gray">No workouts found</p>
            </div>
          )}
        </div>

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