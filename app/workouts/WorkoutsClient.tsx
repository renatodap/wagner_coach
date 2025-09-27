'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  Dumbbell,
  Settings,
  LogOut,
  Clock,
  Star,
  Search,
  Plus,
  PlusCircle,
  Filter,
  ChevronDown,
  Globe,
  Lock
} from 'lucide-react';
import { Profile } from '@/lib/types';
import BottomNavigation from '@/app/components/BottomNavigation';
import { Button } from '@/components/ui/button';

interface Workout {
  id: number;
  name: string;
  type: string;
  goal?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  estimated_duration_minutes: number;
  is_favorite: boolean;
  is_public?: boolean;
  user_id?: string;
}

interface WorkoutsClientProps {
  initialWorkouts: Workout[];
  userId: string;
  profile?: Profile | null;
}

export default function WorkoutsClient({
  initialWorkouts,
  userId,
  profile
}: WorkoutsClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [workouts, setWorkouts] = useState(initialWorkouts);
  const [viewMode, setViewMode] = useState<'public' | 'my'>('public');
  const [sortBy, setSortBy] = useState<'name' | 'difficulty' | 'duration' | 'type'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  // Fetch public workouts when switching to public view
  useEffect(() => {
    const fetchPublicWorkouts = async () => {
      if (viewMode === 'public') {
        const { data, error } = await supabase
          .from('workouts')
          .select('*')
          .eq('is_public', true)
          .order('popularity_score', { ascending: false });

        if (data && !error) {
          setWorkouts(data);
        }
      } else {
        // Fetch user's workouts
        const { data, error } = await supabase
          .from('workouts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (data && !error) {
          setWorkouts(data);
        }
      }
    };

    fetchPublicWorkouts();
  }, [viewMode, userId, supabase]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 5) return 'RISE AND GRIND';
    if (hour < 12) return 'MORNING WARRIOR';
    if (hour < 17) return 'AFTERNOON ASSAULT';
    if (hour < 22) return 'EVENING CRUSHER';
    return 'MIDNIGHT BEAST';
  };

  // Filter and sort workouts
  const filteredAndSortedWorkouts = workouts
    .filter(workout => {
      const matchesSearch = searchTerm === '' ||
        workout.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (workout.description && workout.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType = selectedType === '' || workout.type === selectedType;
      const matchesDifficulty = selectedDifficulty === '' || workout.difficulty === selectedDifficulty;
      const matchesFavorites = !showFavoritesOnly || workout.is_favorite;

      return matchesSearch && matchesType && matchesDifficulty && matchesFavorites;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch(sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'difficulty':
          const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
          comparison = (difficultyOrder[a.difficulty] || 0) - (difficultyOrder[b.difficulty] || 0);
          break;
        case 'duration':
          comparison = a.estimated_duration_minutes - b.estimated_duration_minutes;
          break;
        case 'type':
          comparison = (a.type || '').localeCompare(b.type || '');
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const workoutTypes = [
    'push', 'pull', 'legs', 'upper', 'lower',
    'full_body', 'chest', 'back', 'shoulders', 'arms', 'core', 'cardio'
  ];

  const difficultyLevels = ['beginner', 'intermediate', 'advanced'];

  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty) {
      case 'beginner': return 'text-green-500';
      case 'intermediate': return 'text-yellow-500';
      case 'advanced': return 'text-red-500';
      default: return 'text-iron-gray';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const handleToggleFavorite = async (workoutId: number, isFavorite: boolean) => {
    if (isFavorite) {
      await supabase
        .from('favorite_workouts')
        .delete()
        .eq('user_id', userId)
        .eq('workout_id', workoutId);
    } else {
      await supabase
        .from('favorite_workouts')
        .insert({ user_id: userId, workout_id: workoutId });
    }

    // Update local state
    setWorkouts(workouts.map(w =>
      w.id === workoutId ? { ...w, is_favorite: !isFavorite } : w
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-iron-black to-neutral-900">
      {/* Header */}
      <div className="bg-iron-black/50 backdrop-blur-sm border-b border-iron-gray/20 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-white">{getGreeting()}</h1>
            <Link href="/workouts/builder">
              <Button className="bg-iron-orange hover:bg-orange-600">
                <PlusCircle className="w-4 h-4 mr-2" />
                Create
              </Button>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-iron-gray" />
            <input
              type="text"
              placeholder="Search workouts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-iron-gray/20 border border-iron-gray/30 rounded-xl text-white placeholder-iron-gray focus:outline-none focus:border-iron-orange transition-colors"
            />
          </div>

          {/* View Toggle */}
          <div className="bg-iron-gray/20 border border-iron-gray/30 rounded-xl p-1 flex mb-4">
            <button
              onClick={() => setViewMode('public')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all ${
                viewMode === 'public'
                  ? 'bg-iron-orange text-white'
                  : 'text-iron-gray hover:text-white'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span className="font-medium">Public</span>
            </button>
            <button
              onClick={() => setViewMode('my')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all ${
                viewMode === 'my'
                  ? 'bg-iron-orange text-white'
                  : 'text-iron-gray hover:text-white'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span className="font-medium">My Workouts</span>
            </button>
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-iron-gray hover:text-iron-orange transition-colors mb-2"
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filters</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Filters */}
          {showFilters && (
            <div className="bg-iron-gray/10 border border-iron-gray/20 rounded-xl p-4 mb-4 space-y-4">
              {/* Type Filter */}
              <div>
                <label className="text-sm text-iron-gray mb-2 block">Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 bg-iron-black/50 border border-iron-gray/30 rounded-lg text-white focus:outline-none focus:border-iron-orange"
                >
                  <option value="">All Types</option>
                  {workoutTypes.map(type => (
                    <option key={type} value={type}>
                      {type.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="text-sm text-iron-gray mb-2 block">Difficulty</label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full px-3 py-2 bg-iron-black/50 border border-iron-gray/30 rounded-lg text-white focus:outline-none focus:border-iron-orange"
                >
                  <option value="">All Levels</option>
                  {difficultyLevels.map(level => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Options */}
              <div>
                <label className="text-sm text-iron-gray mb-2 block">Sort By</label>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="flex-1 px-3 py-2 bg-iron-black/50 border border-iron-gray/30 rounded-lg text-white focus:outline-none focus:border-iron-orange"
                  >
                    <option value="name">Name</option>
                    <option value="difficulty">Difficulty</option>
                    <option value="duration">Duration</option>
                    <option value="type">Type</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 bg-iron-black/50 border border-iron-gray/30 rounded-lg text-white hover:border-iron-orange transition-colors"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>

              {/* Favorites Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFavoritesOnly}
                  onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-iron-gray/30 bg-iron-black/50 text-iron-orange focus:ring-iron-orange"
                />
                <span className="text-sm text-white">Show Favorites Only</span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Workouts List */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {filteredAndSortedWorkouts.length === 0 ? (
          <div className="text-center py-12">
            <Dumbbell className="w-16 h-16 text-iron-gray mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No workouts found</h3>
            <p className="text-iron-gray mb-6">
              {viewMode === 'my'
                ? "You haven't created any workouts yet"
                : "No public workouts match your filters"}
            </p>
            <Link href="/workouts/builder">
              <Button className="bg-iron-orange hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Workout
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredAndSortedWorkouts.map((workout) => (
              <Link
                key={workout.id}
                href={`/workout/${workout.id}`}
                className="group bg-iron-gray/20 border border-iron-gray/30 rounded-xl p-5 hover:border-iron-orange/50 transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white group-hover:text-iron-orange transition-colors">
                      {workout.name}
                    </h3>
                    {workout.description && (
                      <p className="text-sm text-iron-gray mt-1 line-clamp-2">
                        {workout.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleToggleFavorite(workout.id, workout.is_favorite);
                    }}
                    className="ml-3 p-2 hover:bg-iron-gray/30 rounded-lg transition-colors"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        workout.is_favorite
                          ? 'fill-iron-orange text-iron-orange'
                          : 'text-iron-gray'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-iron-gray">Type:</span>
                    <span className="text-white font-medium">
                      {workout.type?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-iron-gray">Level:</span>
                    <span className={`font-medium ${getDifficultyColor(workout.difficulty)}`}>
                      {workout.difficulty?.charAt(0).toUpperCase() + workout.difficulty?.slice(1)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-iron-gray" />
                    <span className="text-white">
                      {formatDuration(workout.estimated_duration_minutes)}
                    </span>
                  </div>

                  {workout.goal && (
                    <div className="flex items-center gap-1">
                      <span className="text-iron-gray">Goal:</span>
                      <span className="text-white font-medium">
                        {workout.goal.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}