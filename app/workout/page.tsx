'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, Filter, Star, Clock, Dumbbell, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Workout {
  id: number;
  name: string;
  type: string;
  goal: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  estimated_duration_minutes: number;
  is_favorite: boolean;
  avg_rating: number;
  completion_count: number;
}

interface WorkoutFilters {
  search: string;
  type: string;
  difficulty: string;
  maxDuration: number | null;
  favoritesOnly: boolean;
}

export default function WorkoutSelectionPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [filters, setFilters] = useState<WorkoutFilters>({
    search: '',
    type: '',
    difficulty: '',
    maxDuration: null,
    favoritesOnly: false
  });

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (userId) {
      fetchWorkouts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, filters]);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
    }
  };

  const fetchWorkouts = async () => {
    try {
      setLoading(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).rpc('search_workouts', {
        p_search_term: filters.search || null,
        p_type: filters.type || null,
        p_difficulty: filters.difficulty || null,
        p_max_duration: filters.maxDuration,
        p_favorites_only: filters.favoritesOnly,
        p_user_id: userId
      });

      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedWorkouts = data.map((w: any) => ({
          id: w.workout_id,
          name: w.workout_name,
          type: w.workout_type,
          goal: w.workout_goal,
          difficulty: w.difficulty,
          description: w.description || 'No description available',
          estimated_duration_minutes: w.duration_minutes || 45,
          is_favorite: w.is_favorite || false,
          avg_rating: w.avg_rating || 0,
          completion_count: w.completion_count || 0
        }));
        setWorkouts(formattedWorkouts);
      }
    } catch (error) {
      console.error('Error fetching workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (workoutId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) return;

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

  const startWorkout = async (workoutId: number) => {
    if (!userId) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  if (loading) {
    return (
      <div className="min-h-screen bg-iron-black flex items-center justify-center">
        <p className="text-iron-gray">Loading workouts...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-iron-black">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-heading text-4xl text-iron-white mb-2">
            SELECT WORKOUT
          </h1>
          <p className="text-iron-gray">Choose your battle for today</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-iron-gray" />
              <input
                type="text"
                placeholder="Search workouts..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full bg-iron-gray/10 border border-iron-gray pl-10 pr-4 py-3 text-iron-white placeholder-iron-gray focus:border-iron-orange focus:outline-none"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 border ${showFilters ? 'bg-iron-orange text-iron-black border-iron-orange' : 'border-iron-gray text-iron-gray'} flex items-center gap-2 hover:border-iron-orange transition-colors`}
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
            <button
              onClick={() => setFilters({ ...filters, favoritesOnly: !filters.favoritesOnly })}
              className={`px-4 py-3 border ${filters.favoritesOnly ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'border-iron-gray text-iron-gray'} flex items-center gap-2 hover:border-yellow-500 transition-colors`}
            >
              <Star className={`w-5 h-5 ${filters.favoritesOnly ? 'fill-current' : ''}`} />
              Favorites
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="border border-iron-gray p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="bg-iron-gray/10 border border-iron-gray px-3 py-2 text-iron-white focus:border-iron-orange focus:outline-none"
                >
                  <option value="">All Types</option>
                  <option value="push">Push</option>
                  <option value="pull">Pull</option>
                  <option value="legs">Legs</option>
                  <option value="upper">Upper Body</option>
                  <option value="lower">Lower Body</option>
                  <option value="full_body">Full Body</option>
                  <option value="core">Core</option>
                </select>

                <select
                  value={filters.difficulty}
                  onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                  className="bg-iron-gray/10 border border-iron-gray px-3 py-2 text-iron-white focus:border-iron-orange focus:outline-none"
                >
                  <option value="">All Difficulties</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>

                <select
                  value={filters.maxDuration || ''}
                  onChange={(e) => setFilters({ ...filters, maxDuration: e.target.value ? parseInt(e.target.value) : null })}
                  className="bg-iron-gray/10 border border-iron-gray px-3 py-2 text-iron-white focus:border-iron-orange focus:outline-none"
                >
                  <option value="">Any Duration</option>
                  <option value="30">Under 30 min</option>
                  <option value="45">Under 45 min</option>
                  <option value="60">Under 60 min</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Workouts List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workouts.map((workout) => (
            <div
              key={workout.id}
              onClick={() => setSelectedWorkout(workout)}
              className="border border-iron-gray p-4 hover:border-iron-orange transition-colors cursor-pointer relative"
            >
              {/* Favorite Star */}
              <button
                onClick={(e) => toggleFavorite(workout.id, e)}
                className="absolute top-4 right-4 z-10"
              >
                <Star
                  className={`w-5 h-5 ${workout.is_favorite ? 'text-yellow-500 fill-current' : 'text-iron-gray'} hover:text-yellow-500 transition-colors`}
                />
              </button>

              {/* Workout Info */}
              <h3 className="font-heading text-xl text-iron-white mb-2 pr-8">
                {workout.name}
              </h3>

              <p className="text-iron-gray text-sm mb-3 line-clamp-2">
                {workout.description}
              </p>

              <div className="flex items-center gap-3 mb-3">
                <span className={`text-xs px-2 py-1 border uppercase ${getDifficultyColor(workout.difficulty)}`}>
                  {workout.difficulty}
                </span>
                <span className="text-iron-gray text-xs uppercase">
                  {workout.type.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-center justify-between text-iron-gray text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{workout.estimated_duration_minutes} min</span>
                </div>
                {workout.completion_count > 0 && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>{workout.completion_count} times</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {workouts.length === 0 && (
          <div className="text-center py-12">
            <Dumbbell className="w-16 h-16 text-iron-gray mx-auto mb-4" />
            <p className="text-iron-gray">No workouts found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Workout Details Modal */}
      {selectedWorkout && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-iron-black border border-iron-orange max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="font-heading text-3xl text-iron-orange">
                  {selectedWorkout.name}
                </h2>
                <button
                  onClick={() => setSelectedWorkout(null)}
                  className="text-iron-gray hover:text-iron-white"
                >
                  ✕
                </button>
              </div>

              <p className="text-iron-white mb-4">
                {selectedWorkout.description}
              </p>

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
                    {selectedWorkout.goal}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => startWorkout(selectedWorkout.id)}
                  className="flex-1 bg-iron-orange text-iron-black font-heading text-xl py-4 hover:bg-iron-white transition-colors"
                >
                  START WORKOUT
                </button>
                <button
                  onClick={() => setSelectedWorkout(null)}
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