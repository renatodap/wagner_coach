'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  Trophy,
  Search,
  Filter,
  ChevronDown,
  Globe,
  Lock,
  Clock,
  Users,
  TrendingUp,
  Star,
  CheckCircle,
  PlayCircle,
  Calendar
} from 'lucide-react';
import { Profile } from '@/lib/types';
import BottomNavigation from '@/app/components/BottomNavigation';
import { Button } from '@/components/ui/button';

interface Program {
  id: string;
  name: string;
  original_name: string;
  subtitle?: string;
  description?: string;
  wagner_category: string;
  wagner_collection: string;
  routine_number: number;
  total_days: number;
  program_type: string;
  gender: string;
  experience_level: string;
  focus_areas?: string[];
  difficulty_level: number;
  estimated_duration_minutes: number;
  popularity_score: number;
  completion_rate?: number;
  average_rating?: number;
  is_public: boolean;
  enrollment?: {
    id: string;
    status: string;
    current_day: number;
    days_completed: number;
  } | null;
}

interface ProgramsClientProps {
  programs: Program[];
  userId: string;
  profile?: Profile | null;
  collections: Record<string, { name: string; count: number }>;
}

export default function ProgramsClient({
  programs,
  userId,
  profile,
  collections
}: ProgramsClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [viewMode, setViewMode] = useState<'all' | 'enrolled'>('all');
  const [sortBy, setSortBy] = useState<'popularity' | 'name' | 'difficulty' | 'rating'>('popularity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'MORNING TRAINING';
    if (hour < 17) return 'AFTERNOON POWER';
    return 'EVENING GAINS';
  };

  // Filter and sort programs
  const filteredAndSortedPrograms = programs
    .filter(program => {
      // View mode filter
      if (viewMode === 'enrolled' && !program.enrollment) return false;

      // Search filter
      const matchesSearch = searchTerm === '' ||
        program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (program.description && program.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        program.original_name.toLowerCase().includes(searchTerm.toLowerCase());

      // Collection filter
      const matchesCollection = selectedCollection === '' || program.wagner_collection === selectedCollection;

      // Category filter
      const matchesCategory = selectedCategory === '' || program.wagner_category === selectedCategory;

      // Level filter
      const matchesLevel = selectedLevel === '' || program.experience_level === selectedLevel;

      // Gender filter
      const matchesGender = selectedGender === '' || program.gender === selectedGender || program.gender === 'unisex';

      return matchesSearch && matchesCollection && matchesCategory && matchesLevel && matchesGender;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch(sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'difficulty':
          comparison = a.difficulty_level - b.difficulty_level;
          break;
        case 'rating':
          comparison = (a.average_rating || 0) - (b.average_rating || 0);
          break;
        case 'popularity':
        default:
          comparison = a.popularity_score - b.popularity_score;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Get unique categories
  const categories = Array.from(new Set(programs.map(p => p.wagner_category))).sort();

  const getDifficultyColor = (level: number) => {
    if (level <= 3) return 'text-green-500';
    if (level <= 7) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getExperienceColor = (level: string) => {
    switch(level) {
      case 'beginner': return 'text-green-500';
      case 'intermediate': return 'text-yellow-500';
      case 'advanced': return 'text-red-500';
      default: return 'text-iron-gray';
    }
  };

  const getCategoryDisplay = (category: string) => {
    const parts = category.split('_');
    if (parts[0] === 'Homens') return `Men's ${parts[1]}`;
    if (parts[0] === 'Mulheres') return `Women's ${parts[1]}`;
    return category.replace(/_/g, ' ');
  };

  const handleEnrollToggle = async (programId: string, enrollment: any) => {
    if (enrollment) {
      // Unenroll
      await supabase
        .from('user_program_enrollments')
        .delete()
        .eq('id', enrollment.id);
    } else {
      // Enroll
      await supabase
        .from('user_program_enrollments')
        .insert({
          user_id: userId,
          program_id: programId,
          status: 'active'
        });
    }

    // Refresh page
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-iron-black to-neutral-900">
      {/* Header */}
      <div className="bg-iron-black/50 backdrop-blur-sm border-b border-iron-gray/20 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{getGreeting()}</h1>
              <p className="text-sm text-iron-gray">Wagner's 172 Professional Programs</p>
            </div>
            <Trophy className="w-8 h-8 text-iron-orange" />
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-iron-gray" />
            <input
              type="text"
              placeholder="Search programs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-iron-gray/20 border border-iron-gray/30 rounded-xl text-white placeholder-iron-gray focus:outline-none focus:border-iron-orange transition-colors"
            />
          </div>

          {/* View Toggle */}
          <div className="bg-iron-gray/20 border border-iron-gray/30 rounded-xl p-1 flex mb-4">
            <button
              onClick={() => setViewMode('all')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all ${
                viewMode === 'all'
                  ? 'bg-iron-orange text-white'
                  : 'text-iron-gray hover:text-white'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span className="font-medium">All Programs</span>
            </button>
            <button
              onClick={() => setViewMode('enrolled')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all ${
                viewMode === 'enrolled'
                  ? 'bg-iron-orange text-white'
                  : 'text-iron-gray hover:text-white'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">My Programs</span>
            </button>
          </div>

          {/* Collection Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            <button
              onClick={() => setSelectedCollection('')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                selectedCollection === ''
                  ? 'bg-iron-orange text-white'
                  : 'bg-iron-gray/20 text-iron-gray hover:text-white'
              }`}
            >
              All ({programs.length})
            </button>
            {Object.entries(collections).map(([key, value]) => (
              <button
                key={key}
                onClick={() => setSelectedCollection(key)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  selectedCollection === key
                    ? 'bg-iron-orange text-white'
                    : 'bg-iron-gray/20 text-iron-gray hover:text-white'
                }`}
              >
                {value.name} ({value.count})
              </button>
            ))}
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-iron-gray hover:text-iron-orange transition-colors mb-2"
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm">Advanced Filters</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="bg-iron-gray/10 border border-iron-gray/20 rounded-xl p-4 mb-4 space-y-4">
              {/* Category Filter */}
              <div>
                <label className="text-sm text-iron-gray mb-2 block">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-iron-black/50 border border-iron-gray/30 rounded-lg text-white focus:outline-none focus:border-iron-orange"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {getCategoryDisplay(cat)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Gender Filter */}
              <div>
                <label className="text-sm text-iron-gray mb-2 block">Gender</label>
                <select
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value)}
                  className="w-full px-3 py-2 bg-iron-black/50 border border-iron-gray/30 rounded-lg text-white focus:outline-none focus:border-iron-orange"
                >
                  <option value="">All</option>
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="unisex">Unisex</option>
                </select>
              </div>

              {/* Experience Level Filter */}
              <div>
                <label className="text-sm text-iron-gray mb-2 block">Experience Level</label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full px-3 py-2 bg-iron-black/50 border border-iron-gray/30 rounded-lg text-white focus:outline-none focus:border-iron-orange"
                >
                  <option value="">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
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
                    <option value="popularity">Popularity</option>
                    <option value="name">Name</option>
                    <option value="difficulty">Difficulty</option>
                    <option value="rating">Rating</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 bg-iron-black/50 border border-iron-gray/30 rounded-lg text-white hover:border-iron-orange transition-colors"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Programs Grid */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {filteredAndSortedPrograms.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-iron-gray mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No programs found</h3>
            <p className="text-iron-gray">
              {viewMode === 'enrolled'
                ? "You haven't enrolled in any programs yet"
                : "No programs match your filters"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredAndSortedPrograms.map((program) => (
              <div
                key={program.id}
                className="bg-iron-gray/20 border border-iron-gray/30 rounded-xl p-5 hover:border-iron-orange/50 transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-white">
                        {program.name}
                      </h3>
                      {program.enrollment && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                    {program.subtitle && (
                      <p className="text-sm text-iron-gray">
                        {program.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Enroll/Start Button */}
                  <div className="ml-3">
                    {program.enrollment ? (
                      <Link href={`/programs/${program.id}`}>
                        <Button className="bg-green-600 hover:bg-green-700">
                          <PlayCircle className="w-4 h-4 mr-2" />
                          Continue
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        onClick={() => handleEnrollToggle(program.id, program.enrollment)}
                        className="bg-iron-orange hover:bg-orange-600"
                      >
                        Enroll
                      </Button>
                    )}
                  </div>
                </div>

                {/* Program Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-iron-gray">Days</p>
                    <p className="text-sm font-medium text-white">
                      {program.total_days} Days
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-iron-gray">Level</p>
                    <p className={`text-sm font-medium ${getExperienceColor(program.experience_level)}`}>
                      {program.experience_level.charAt(0).toUpperCase() + program.experience_level.slice(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-iron-gray">Gender</p>
                    <p className="text-sm font-medium text-white">
                      {program.gender === 'men' ? 'Men' : program.gender === 'women' ? 'Women' : 'Unisex'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-iron-gray">Duration</p>
                    <p className="text-sm font-medium text-white">
                      {program.estimated_duration_minutes} min
                    </p>
                  </div>
                </div>

                {/* Progress Bar (if enrolled) */}
                {program.enrollment && (
                  <div className="mb-3">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-iron-gray">Progress</span>
                      <span className="text-white">
                        Day {program.enrollment.current_day} of {program.total_days}
                      </span>
                    </div>
                    <div className="w-full bg-iron-gray/30 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-iron-orange to-orange-600 h-2 rounded-full"
                        style={{
                          width: `${(program.enrollment.days_completed / program.total_days) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                  {program.average_rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-white">{program.average_rating.toFixed(1)}</span>
                    </div>
                  )}
                  {program.completion_rate && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-white">{Math.round(program.completion_rate)}% completion</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-iron-gray" />
                    <span className="text-iron-gray">{getCategoryDisplay(program.wagner_category)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}