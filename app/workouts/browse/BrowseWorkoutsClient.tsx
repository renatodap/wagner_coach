'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Search,
  Filter,
  Star,
  Clock,
  Dumbbell,
  Target,
  ChevronLeft,
  X
} from 'lucide-react';
import Link from 'next/link';
import BottomNavigation from '@/app/components/BottomNavigation';

interface Workout {
  id: number;
  name: string;
  type: string;
  goal: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration_minutes: number;
  description?: string;
  equipment_needed?: string[];
  muscle_groups?: string[];
  is_public: boolean;
  created_by?: string;
  created_at: string;
}

interface BrowseWorkoutsClientProps {
  workouts: Workout[];
  favoriteIds: number[];
  userId: string;
}

export default function BrowseWorkoutsClient({
  workouts,
  favoriteIds: initialFavoriteIds,
  userId
}: BrowseWorkoutsClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [favoriteIds, setFavoriteIds] = useState<number[]>(initialFavoriteIds);
  const [favoriting, setFavoriting] = useState<number | null>(null);

  // Filter workouts based on search and filters
  const filteredWorkouts = workouts.filter(workout => {
    const matchesSearch = workout.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          workout.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || workout.type === selectedType;
    const matchesDifficulty = selectedDifficulty === 'all' || workout.difficulty === selectedDifficulty;

    return matchesSearch && matchesType && matchesDifficulty;
  });

  // Get unique workout types
  const workoutTypes = Array.from(new Set(workouts.map(w => w.type)));

  const toggleFavorite = async (workoutId: number) => {
    setFavoriting(workoutId);

    try {
      if (favoriteIds.includes(workoutId)) {
        // Remove from favorites
        const { error } = await supabase
          .from('user_workout_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('workout_id', workoutId);

        if (!error) {
          setFavoriteIds(favoriteIds.filter(id => id !== workoutId));
        }
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('user_workout_favorites')
          .insert({
            user_id: userId,
            workout_id: workoutId
          });

        if (!error) {
          setFavoriteIds([...favoriteIds, workoutId]);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setFavoriting(null);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-500 border-green-500';
      case 'intermediate': return 'text-yellow-500 border-yellow-500';
      case 'advanced': return 'text-red-500 border-red-500';
      default: return 'text-iron-gray border-iron-gray';
    }
  };

  return (
    <div className="min-h-screen bg-iron-black text-iron-white">
      {/* Header */}
      <header className="border-b border-iron-gray sticky top-0 bg-iron-black z-30">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="text-iron-gray hover:text-iron-orange transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h1 className="font-heading text-2xl text-iron-orange">BROWSE PUBLIC WORKOUTS</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 pb-24">
        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-iron-gray w-5 h-5" />
            <input
              type="text"
              placeholder="Search workouts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-iron-gray/10 border border-iron-gray pl-10 pr-4 py-3 text-iron-white placeholder-iron-gray/50 focus:outline-none focus:border-iron-orange transition-colors"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-iron-gray" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-iron-gray/10 border border-iron-gray px-3 py-2 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
              >
                <option value="all">All Types</option>
                {workoutTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>

              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="bg-iron-gray/10 border border-iron-gray px-3 py-2 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
              >
                <option value="all">All Difficulties</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div className="ml-auto text-iron-gray">
              {filteredWorkouts.length} workout{filteredWorkouts.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>

        {/* Workouts Grid */}
        {filteredWorkouts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-iron-gray mb-4">No workouts found matching your criteria</p>
            {(searchQuery || selectedType !== 'all' || selectedDifficulty !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('all');
                  setSelectedDifficulty('all');
                }}
                className="text-iron-orange hover:text-orange-600 underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkouts.map(workout => (
              <div
                key={workout.id}
                className="border border-iron-gray hover:border-iron-orange/50 transition-all p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-heading text-lg text-iron-white flex-1 mr-2">
                    {workout.name}
                  </h3>
                  <button
                    onClick={() => toggleFavorite(workout.id)}
                    disabled={favoriting === workout.id}
                    className={`transition-colors ${
                      favoriteIds.includes(workout.id)
                        ? 'text-iron-orange'
                        : 'text-iron-gray hover:text-iron-orange'
                    }`}
                  >
                    <Star
                      className={`w-5 h-5 ${
                        favoriteIds.includes(workout.id) ? 'fill-current' : ''
                      }`}
                    />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-iron-gray">
                      <Dumbbell className="w-4 h-4" />
                      {workout.type.replace('_', ' ')}
                    </span>
                    <span className="flex items-center gap-1 text-iron-gray">
                      <Clock className="w-4 h-4" />
                      {workout.duration_minutes} min
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 border ${getDifficultyColor(workout.difficulty)}`}>
                      {workout.difficulty.toUpperCase()}
                    </span>
                    {workout.goal && (
                      <span className="flex items-center gap-1 text-xs text-iron-gray">
                        <Target className="w-3 h-3" />
                        {workout.goal}
                      </span>
                    )}
                  </div>

                  {workout.description && (
                    <p className="text-iron-gray text-sm line-clamp-2">
                      {workout.description}
                    </p>
                  )}

                  {workout.equipment_needed && workout.equipment_needed.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {workout.equipment_needed.slice(0, 3).map((equipment, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 bg-iron-gray/20 text-iron-gray">
                          {equipment}
                        </span>
                      ))}
                      {workout.equipment_needed.length > 3 && (
                        <span className="text-xs px-2 py-1 text-iron-gray">
                          +{workout.equipment_needed.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/workouts/${workout.id}`}
                    className="flex-1 text-center bg-iron-gray/20 hover:bg-iron-gray/30 text-iron-white px-3 py-2 text-sm transition-colors"
                  >
                    View Details
                  </Link>
                  {favoriteIds.includes(workout.id) && (
                    <button
                      onClick={() => router.push('/activities/add')}
                      className="flex-1 text-center bg-iron-orange/20 hover:bg-iron-orange/30 text-iron-orange px-3 py-2 text-sm transition-colors"
                    >
                      Use in Activity
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}