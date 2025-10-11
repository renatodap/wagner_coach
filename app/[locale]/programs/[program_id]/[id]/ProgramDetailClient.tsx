'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  Trophy,
  Calendar,
  Clock,
  Users,
  ChevronRight,
  PlayCircle,
  CheckCircle,
  Lock,
  Dumbbell,
  Target,
  ArrowLeft,
  Star
} from 'lucide-react';
import BottomNavigation from '@/components/BottomNavigation';
import { Button } from '@/components/ui/button';

interface Exercise {
  id: string;
  name: string;
  category_id?: string;
  equipment_id?: string;
  primary_muscle_id?: string;
  difficulty_level?: number;
  is_bodyweight?: boolean;
}

interface DayExercise {
  id: string;
  exercise_id: string;
  order_index: number;
  sets: number;
  reps: string;
  rest_seconds?: number;
  rest_display?: string;
  notes?: string;
  exercises: Exercise;
}

interface ProgramDay {
  id: string;
  day_number: number;
  day_name: string;
  original_day_name?: string;
  day_focus?: string;
  estimated_duration_minutes: number;
  total_exercises: number;
  is_rest_day: boolean;
  day_exercises: DayExercise[];
}

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
  program_days: ProgramDay[];
}

interface ProgramDetailClientProps {
  program: Program;
  enrollment?: any;
  completions: any[];
  userId: string;
}

export default function ProgramDetailClient({
  program,
  enrollment,
  completions,
  userId
}: ProgramDetailClientProps) {
  const [selectedDay, setSelectedDay] = useState(1);
  const router = useRouter();
  const supabase = createClient();

  const currentDay = program.program_days.find(d => d.day_number === selectedDay);
  const isEnrolled = !!enrollment;
  const isDayCompleted = (dayId: string) =>
    completions.some(c => c.day_id === dayId);

  const handleEnroll = async () => {
    const { error } = await supabase
      .from('user_program_enrollments')
      .insert({
        user_id: userId,
        program_id: program.id,
        status: 'active'
      });

    if (!error) {
      router.refresh();
    }
  };

  const handleStartDay = async (dayId: string) => {
    if (!enrollment) {
      await handleEnroll();
    }
    // Navigate to workout session with this day's exercises
    router.push(`/workout/program/${program.id}/day/${dayId}`);
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

  const getCollectionDisplay = (collection: string) => {
    switch(collection) {
      case 'Main_80': return 'Main Routines';
      case 'Functional_40': return 'Functional Training';
      case 'PowerBodybuilding_52': return 'Power Bodybuilding';
      default: return collection;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-iron-black to-neutral-900">
      {/* Header */}
      <div className="bg-iron-black/50 backdrop-blur-sm border-b border-iron-gray/20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            href="/programs"
            className="inline-flex items-center gap-2 text-iron-gray hover:text-iron-orange transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Programs</span>
          </Link>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{program.name}</h1>
              {program.subtitle && (
                <p className="text-iron-gray mb-2">{program.subtitle}</p>
              )}
              <p className="text-sm text-iron-gray italic">{program.original_name}</p>
            </div>
            <Trophy className="w-8 h-8 text-iron-orange" />
          </div>
        </div>
      </div>

      {/* Program Info Cards */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-iron-gray/20 border border-iron-gray/30 rounded-lg p-4">
            <Calendar className="w-5 h-5 text-iron-orange mb-2" />
            <p className="text-2xl font-bold text-white">{program.total_days}</p>
            <p className="text-xs text-iron-gray">Days</p>
          </div>

          <div className="bg-iron-gray/20 border border-iron-gray/30 rounded-lg p-4">
            <Target className="w-5 h-5 text-iron-orange mb-2" />
            <p className={`text-2xl font-bold ${getExperienceColor(program.experience_level)}`}>
              {program.experience_level.charAt(0).toUpperCase()}
            </p>
            <p className="text-xs text-iron-gray">{program.experience_level}</p>
          </div>

          <div className="bg-iron-gray/20 border border-iron-gray/30 rounded-lg p-4">
            <Clock className="w-5 h-5 text-iron-orange mb-2" />
            <p className="text-2xl font-bold text-white">{program.estimated_duration_minutes}</p>
            <p className="text-xs text-iron-gray">Min/Day</p>
          </div>

          <div className="bg-iron-gray/20 border border-iron-gray/30 rounded-lg p-4">
            <Users className="w-5 h-5 text-iron-orange mb-2" />
            <p className="text-2xl font-bold text-white">
              {program.gender === 'men' ? 'M' : program.gender === 'women' ? 'W' : 'U'}
            </p>
            <p className="text-xs text-iron-gray">
              {program.gender === 'men' ? 'Men' : program.gender === 'women' ? 'Women' : 'Unisex'}
            </p>
          </div>
        </div>

        {/* Program Details */}
        <div className="bg-iron-gray/20 border border-iron-gray/30 rounded-xl p-5 mb-6">
          <h3 className="text-lg font-bold text-white mb-3">Program Details</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-iron-gray">Collection</span>
              <span className="text-white">{getCollectionDisplay(program.wagner_collection)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-iron-gray">Category</span>
              <span className="text-white">{getCategoryDisplay(program.wagner_category)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-iron-gray">Type</span>
              <span className="text-white">{program.program_type.replace(/_/g, ' ').toUpperCase()}</span>
            </div>
            {program.focus_areas && program.focus_areas.length > 0 && (
              <div className="flex justify-between">
                <span className="text-iron-gray">Focus</span>
                <span className="text-white">{program.focus_areas.join(', ')}</span>
              </div>
            )}
            {program.average_rating && (
              <div className="flex justify-between">
                <span className="text-iron-gray">Rating</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-white">{program.average_rating.toFixed(1)}</span>
                </div>
              </div>
            )}
            {program.completion_rate && (
              <div className="flex justify-between">
                <span className="text-iron-gray">Completion Rate</span>
                <span className="text-white">{Math.round(program.completion_rate)}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Exercise Overview */}
        <div className="bg-iron-gray/20 border border-iron-gray/30 rounded-xl p-5 mb-6">
          <h3 className="text-lg font-bold text-white mb-3">Program Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-iron-gray text-sm">Total Exercises</p>
              <p className="text-2xl font-bold text-white">
                {program.program_days.reduce((sum, day) => sum + day.day_exercises.length, 0)}
              </p>
            </div>
            <div>
              <p className="text-iron-gray text-sm">Training Days</p>
              <p className="text-2xl font-bold text-white">{program.total_days}</p>
            </div>
            <div>
              <p className="text-iron-gray text-sm">Avg Per Day</p>
              <p className="text-2xl font-bold text-white">
                {Math.round(
                  program.program_days.reduce((sum, day) => sum + day.day_exercises.length, 0) /
                  program.total_days
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Enrollment Status */}
        {!isEnrolled ? (
          <div className="bg-gradient-to-r from-iron-orange/20 to-orange-600/20 border border-iron-orange/30 rounded-xl p-5 mb-6">
            <h3 className="text-lg font-bold text-white mb-2">Ready to Start?</h3>
            <p className="text-iron-gray mb-4">
              Enroll in this program to track your progress and access all workouts.
            </p>
            <Button
              onClick={handleEnroll}
              className="w-full bg-iron-orange hover:bg-orange-600"
            >
              <PlayCircle className="w-5 h-5 mr-2" />
              Enroll in Program
            </Button>
          </div>
        ) : (
          <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-white">Your Progress</h3>
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-iron-gray">Overall Progress</span>
                <span className="text-white">
                  {enrollment.days_completed} of {program.total_days} days
                </span>
              </div>
              <div className="w-full bg-iron-gray/30 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full"
                  style={{
                    width: `${(enrollment.days_completed / program.total_days) * 100}%`
                  }}
                />
              </div>
            </div>
            <p className="text-sm text-iron-gray">
              Status: <span className="text-green-500 font-medium">{enrollment.status}</span>
            </p>
          </div>
        )}

        {/* Day Selector */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-white mb-3">Training Days</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {program.program_days.map((day) => {
              const completed = isDayCompleted(day.id);
              return (
                <button
                  key={day.id}
                  onClick={() => setSelectedDay(day.day_number)}
                  className={`p-3 rounded-lg border transition-all ${
                    selectedDay === day.day_number
                      ? 'bg-iron-orange border-iron-orange text-white'
                      : completed
                      ? 'bg-green-900/30 border-green-500/50 text-green-500'
                      : 'bg-iron-gray/20 border-iron-gray/30 text-iron-gray hover:text-white hover:border-iron-orange/50'
                  }`}
                >
                  <div className="text-xs font-medium mb-1">Day {day.day_number}</div>
                  <div className="text-[10px]">{day.day_name.slice(0, 3)}</div>
                  {completed && <CheckCircle className="w-3 h-3 mx-auto mt-1" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details */}
        {currentDay && (
          <div className="bg-iron-gray/20 border border-iron-gray/30 rounded-xl p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">
                  Day {currentDay.day_number}: {currentDay.day_name}
                </h3>
                {currentDay.day_focus && (
                  <p className="text-iron-gray">{currentDay.day_focus}</p>
                )}
              </div>
              <Button
                onClick={() => handleStartDay(currentDay.id)}
                className="bg-iron-orange hover:bg-orange-600"
                disabled={!isEnrolled && false} // Allow starting even without enrollment
              >
                {isDayCompleted(currentDay.id) ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Redo
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Start
                  </>
                )}
              </Button>
            </div>

            {/* Day Stats */}
            <div className="flex gap-4 mb-4 text-sm">
              <div className="flex items-center gap-1">
                <Dumbbell className="w-4 h-4 text-iron-gray" />
                <span className="text-white">{currentDay.total_exercises} exercises</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-iron-gray" />
                <span className="text-white">{currentDay.estimated_duration_minutes} min</span>
              </div>
            </div>

            {/* Exercises List */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-iron-orange uppercase tracking-wide mb-3">
                Exercises ({currentDay.day_exercises.length})
              </h4>
              {currentDay.day_exercises.length === 0 ? (
                <div className="text-center py-8">
                  <Dumbbell className="w-12 h-12 text-iron-gray mx-auto mb-2" />
                  <p className="text-iron-gray">No exercises added yet</p>
                </div>
              ) : (
                currentDay.day_exercises
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((exercise, index) => (
                    <div
                      key={exercise.id}
                      className="flex items-start gap-4 p-4 bg-iron-black/50 rounded-lg hover:bg-iron-black/70 transition-colors"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-iron-orange to-orange-600 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h5 className="text-white font-semibold mb-1">
                          {exercise.exercises?.name || 'Exercise'}
                        </h5>
                        <div className="flex flex-wrap gap-3 text-sm">
                          <div className="flex items-center gap-1">
                            <span className="text-iron-gray">Sets:</span>
                            <span className="text-iron-orange font-medium">{exercise.sets}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-iron-gray">Reps:</span>
                            <span className="text-iron-orange font-medium">{exercise.reps}</span>
                          </div>
                          {exercise.rest_display && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-iron-gray" />
                              <span className="text-iron-gray">Rest:</span>
                              <span className="text-iron-orange font-medium">{exercise.rest_display}</span>
                            </div>
                          )}
                        </div>
                        {exercise.notes && (
                          <p className="text-xs text-iron-gray italic mt-2 p-2 bg-iron-gray/10 rounded">
                            💡 {exercise.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="pb-24" />
      <BottomNavigation />
    </div>
  );
}