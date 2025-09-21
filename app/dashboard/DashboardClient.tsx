'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  Dumbbell,
  Settings,
  LogOut,
  Clock,
  TrendingUp,
  Star,
  Search,
  Calendar
} from 'lucide-react';
import { Profile } from '@/lib/types';
import ActivityList from '@/components/ActivityList';
import BottomNavigation from '@/app/components/BottomNavigation';

interface Workout {
  id: number;
  name: string;
  type: string;
  goal?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  estimated_duration_minutes: number;
  is_favorite: boolean;
}

interface DashboardClientProps {
  initialWorkouts: Workout[];
  userId: string;
  profile?: Profile | null;
}

export default function DashboardClient({
  initialWorkouts,
  userId,
  profile
}: DashboardClientProps) {
  const [signingOut, setSigningOut] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [workouts, setWorkouts] = useState(initialWorkouts);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

  interface WorkoutExercise {
    id: number;
    workout_id: number;
    exercise_id: number;
    sets: number;
    reps: string;
    rest_seconds: number;
    order_index: number;
    notes?: string;
    exercises?: {
      id: number;
      name: string;
      category: string;
      muscle_group: string;
      equipment?: string;
      difficulty?: string;
    };
  }

  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  const loadWorkoutDetails = async (workout: Workout) => {
    setSelectedWorkout(workout);
    setLoadingExercises(true);

    try {
      // Load workout exercises
      const { data: exercises } = await supabase
        .from('workout_exercises')
        .select(`
          *,
          exercises (
            id,
            name,
            category,
            muscle_group,
            equipment,
            difficulty
          )
        `)
        .eq('workout_id', workout.id)
        .order('order_index');

      setWorkoutExercises(exercises || []);
    } catch (error) {
      console.error('Error loading workout exercises:', error);
    } finally {
      setLoadingExercises(false);
    }
  };

  const startWorkout = async () => {
    if (!selectedWorkout) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: sessionId } = await (supabase as any).rpc('start_workout_session', {
        p_user_id: userId,
        p_workout_id: selectedWorkout.id
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

        {/* Recent Activities */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-8 space-y-8 lg:space-y-0">
          <div className="lg:col-span-2">
            <ActivityList limit={5} />
          </div>
          <div className="border border-iron-gray p-6">
            <h3 className="font-heading text-xl text-iron-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-iron-orange" />
              QUICK STATS
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-iron-gray">This Week</span>
                <span className="text-iron-white font-medium">4 workouts</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-iron-gray">Total Time</span>
                <span className="text-iron-white font-medium">3h 45m</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-iron-gray">Avg. Heart Rate</span>
                <span className="text-iron-white font-medium">142 bpm</span>
              </div>
            </div>
          </div>
        </div>

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
                data-testid={`workout-card-${workout.id}`}
                onClick={() => loadWorkoutDetails(workout)}
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
        <BottomNavigation />
      </main>

      {/* Workout Details Modal */}
      {selectedWorkout && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div data-testid="workout-modal" className="bg-iron-black border border-iron-orange max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h2 className="font-heading text-3xl text-iron-orange mb-2">
                    {selectedWorkout.name}
                  </h2>
                  <p className="text-iron-white">
                    {selectedWorkout.description}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedWorkout(null);
                    setWorkoutExercises([]);
                  }}
                  className="text-iron-gray hover:text-iron-white text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Workout Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="border border-iron-gray p-3">
                  <p className="text-iron-gray text-xs uppercase mb-1">Type</p>
                  <p className="text-iron-white capitalize">
                    {selectedWorkout.type.replace('_', ' ')}
                  </p>
                </div>
                <div className="border border-iron-gray p-3">
                  <p className="text-iron-gray text-xs uppercase mb-1">Difficulty</p>
                  <p className={`capitalize ${getDifficultyColor(selectedWorkout.difficulty).split(' ')[0]}`}>
                    {selectedWorkout.difficulty}
                  </p>
                </div>
                <div className="border border-iron-gray p-3">
                  <p className="text-iron-gray text-xs uppercase mb-1">Duration</p>
                  <p className="text-iron-white">
                    {selectedWorkout.estimated_duration_minutes} min
                  </p>
                </div>
                <div className="border border-iron-gray p-3">
                  <p className="text-iron-gray text-xs uppercase mb-1">Goal</p>
                  <p className="text-iron-white capitalize">
                    {selectedWorkout.goal?.replace('_', ' ') || 'All'}
                  </p>
                </div>
              </div>

              {/* Exercises List */}
              <div className="mb-6">
                <h3 className="font-heading text-xl text-iron-white mb-3">
                  EXERCISES ({workoutExercises.length})
                </h3>

                {loadingExercises ? (
                  <p className="text-iron-gray">Loading exercises...</p>
                ) : workoutExercises.length > 0 ? (
                  <div className="space-y-3">
                    {workoutExercises.map((exercise, index) => (
                      <div
                        key={exercise.id}
                        className="border border-iron-gray p-4 hover:border-iron-orange transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="text-iron-orange font-heading text-lg">
                                {index + 1}.
                              </span>
                              <h4 className="font-heading text-lg text-iron-white">
                                {exercise.exercises?.name || 'Unknown Exercise'}
                              </h4>
                            </div>

                            <div className="flex gap-4 mt-2 text-sm">
                              <span className="text-iron-gray">
                                <span className="text-iron-white">{exercise.sets}</span> sets
                              </span>
                              <span className="text-iron-gray">
                                <span className="text-iron-white">{exercise.reps}</span> reps
                              </span>
                              <span className="text-iron-gray">
                                <span className="text-iron-white">{exercise.rest_seconds || 90}s</span> rest
                              </span>
                            </div>

                            {exercise.notes && (
                              <p className="text-iron-gray text-sm mt-2 italic">
                                {exercise.notes}
                              </p>
                            )}

                            {exercise.exercises && (
                              <div className="flex gap-2 mt-2">
                                <span className="text-xs px-2 py-1 border border-iron-gray text-iron-gray">
                                  {exercise.exercises.muscle_group}
                                </span>
                                {exercise.exercises.equipment && (
                                  <span className="text-xs px-2 py-1 border border-iron-gray text-iron-gray">
                                    {exercise.exercises.equipment}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-iron-gray">No exercises found for this workout</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={startWorkout}
                  disabled={workoutExercises.length === 0}
                  className="flex-1 bg-iron-orange text-iron-black font-heading text-xl py-4 hover:bg-iron-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  START WORKOUT
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(selectedWorkout.id, e);
                  }}
                  className={`px-6 py-4 border ${
                    selectedWorkout.is_favorite
                      ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500'
                      : 'border-iron-gray text-iron-gray hover:border-yellow-500 hover:text-yellow-500'
                  } transition-colors`}
                >
                  <Star className={`w-6 h-6 ${selectedWorkout.is_favorite ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={() => {
                    setSelectedWorkout(null);
                    setWorkoutExercises([]);
                  }}
                  className="px-6 py-4 border border-iron-gray text-iron-gray hover:border-iron-white hover:text-iron-white transition-colors"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}