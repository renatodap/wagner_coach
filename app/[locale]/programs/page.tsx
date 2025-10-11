'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Dumbbell, Calendar, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import BottomNavigation from '@/components/BottomNavigation';

interface ActiveProgram {
  program_id: string;
  current_day: number;
  total_days: number;
  start_date: string;
  end_date: string;
  duration_weeks: number;
}

interface CalendarDay {
  day_number: number;
  day_date: string;
  day_name: string;
  is_completed: boolean;
  meal_count: number;
  workout_count: number;
  completed_meals: number;
  completed_workouts: number;
}

export default function ProgramsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeProgram, setActiveProgram] = useState<ActiveProgram | null>(null);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [currentWeek, setCurrentWeek] = useState(0);

  useEffect(() => {
    fetchActiveProgram();
  }, []);

  useEffect(() => {
    if (activeProgram) {
      fetchCalendarData();
    }
  }, [activeProgram, currentWeek, viewMode]);

  async function fetchActiveProgram() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Query Supabase for active AI program
      const { data: program, error } = await supabase
        .from('ai_generated_programs')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching program:', error);
        setLoading(false);
        return;
      }

      if (program) {
        setActiveProgram({
          program_id: program.id,
          current_day: program.current_day || 1,
          total_days: program.total_days,
          start_date: program.start_date,
          end_date: program.end_date,
          duration_weeks: program.duration_weeks
        });
      }
    } catch (error) {
      console.error('Error fetching active program:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCalendarData() {
    if (!activeProgram) return;

    try {
      const supabase = createClient();

      // Calculate day range based on view mode
      let startDay = 1;
      let endDay = activeProgram.total_days;

      if (viewMode === 'weekly') {
        startDay = currentWeek * 7 + 1;
        endDay = Math.min(startDay + 6, activeProgram.total_days);
      } else if (viewMode === 'monthly') {
        startDay = Math.floor(currentWeek / 4) * 28 + 1;
        endDay = Math.min(startDay + 27, activeProgram.total_days);
      } else {
        // daily - show current day
        startDay = activeProgram.current_day;
        endDay = activeProgram.current_day;
      }

      // Fetch program days with workout and meal counts
      const { data: days, error } = await supabase
        .from('ai_program_days')
        .select(`
          *,
          workouts:ai_program_workouts(count),
          meals:ai_program_meals(count)
        `)
        .eq('program_id', activeProgram.program_id)
        .gte('day_number', startDay)
        .lte('day_number', endDay)
        .order('day_number', { ascending: true });

      if (error) {
        console.error('Error fetching calendar:', error);
        return;
      }

      // Transform data to match CalendarDay interface
      const calendarData: CalendarDay[] = (days || []).map(day => ({
        day_number: day.day_number,
        day_date: day.day_date,
        day_name: day.day_name || '',
        is_completed: day.is_completed || false,
        meal_count: day.meals?.[0]?.count || 0,
        workout_count: day.workouts?.[0]?.count || 0,
        completed_meals: 0, // TODO: track completed meals
        completed_workouts: 0 // TODO: track completed workouts
      }));

      setCalendarDays(calendarData);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    }
  }

  async function startProgramGeneration() {
    router.push('/programs/create');
  }

  function handleDayClick(dayNumber: number) {
    if (activeProgram) {
      router.push(`/programs/${activeProgram.program_id}/day/${dayNumber}`);
    }
  }

  function goToPreviousPeriod() {
    if (currentWeek > 0) {
      setCurrentWeek(currentWeek - 1);
    }
  }

  function goToNextPeriod() {
    if (!activeProgram) return;
    const maxWeeks = Math.ceil(activeProgram.total_days / 7);
    if (currentWeek < maxWeeks - 1) {
      setCurrentWeek(currentWeek + 1);
    }
  }

  function getProgressPercentage(day: CalendarDay): number {
    const total = day.meal_count + day.workout_count;
    const completed = day.completed_meals + day.completed_workouts;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-iron-black flex items-center justify-center">
        <div className="text-iron-white">Loading...</div>
      </div>
    );
  }

  if (!activeProgram) {
    return (
      <div className="min-h-screen bg-iron-black p-4">
        <div className="max-w-2xl mx-auto pt-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-iron-gray hover:text-iron-orange transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <Dumbbell className="w-8 h-8 text-iron-orange" />
            <h1 className="font-heading text-3xl text-iron-white">AI PROGRAMS</h1>
          </div>

          {/* Empty State */}
          <div className="bg-iron-black border-2 border-iron-gray p-8 text-center">
            <Calendar className="w-16 h-16 text-iron-gray mx-auto mb-4" />
            <h2 className="text-xl text-iron-white mb-2">No Active Program</h2>
            <p className="text-iron-gray mb-6">
              Create a personalized 12-week fitness and nutrition program tailored to your goals.
            </p>
            <button
              onClick={startProgramGeneration}
              className="bg-iron-orange hover:bg-orange-600 text-white font-bold py-3 px-8 transition-colors"
            >
              CREATE NEW PROGRAM
            </button>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-iron-black p-4 pb-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-iron-gray hover:text-iron-orange transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <Dumbbell className="w-8 h-8 text-iron-orange" />
            <div>
              <h1 className="font-heading text-3xl text-iron-white">MY PROGRAM</h1>
              <p className="text-sm text-iron-gray">
                Week {Math.ceil(activeProgram.current_day / 7)} of {activeProgram.duration_weeks} • Day {activeProgram.current_day} of {activeProgram.total_days}
              </p>
            </div>
          </div>
          <button
            onClick={startProgramGeneration}
            className="bg-iron-orange hover:bg-orange-600 text-iron-black font-heading px-6 py-3 uppercase tracking-wider transition-colors"
          >
            Create New Program
          </button>
        </div>

        {/* View Mode Selector */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setViewMode('daily'); setCurrentWeek(Math.floor((activeProgram.current_day - 1) / 7)); }}
            className={`px-4 py-2 font-bold transition-colors ${
              viewMode === 'daily'
                ? 'bg-iron-orange text-white'
                : 'bg-iron-black border-2 border-iron-gray text-iron-white hover:border-iron-orange'
            }`}
          >
            DAILY
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-4 py-2 font-bold transition-colors ${
              viewMode === 'weekly'
                ? 'bg-iron-orange text-white'
                : 'bg-iron-black border-2 border-iron-gray text-iron-white hover:border-iron-orange'
            }`}
          >
            WEEKLY
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-4 py-2 font-bold transition-colors ${
              viewMode === 'monthly'
                ? 'bg-iron-orange text-white'
                : 'bg-iron-black border-2 border-iron-gray text-iron-white hover:border-iron-orange'
            }`}
          >
            MONTHLY
          </button>
        </div>

        {/* Navigation */}
        {viewMode !== 'daily' && (
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goToPreviousPeriod}
              disabled={currentWeek === 0}
              className="p-2 text-iron-white hover:text-iron-orange disabled:text-iron-gray disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="text-iron-white font-bold">
              {viewMode === 'weekly' ? `Week ${currentWeek + 1}` : `Month ${Math.floor(currentWeek / 4) + 1}`}
            </span>
            <button
              onClick={goToNextPeriod}
              disabled={currentWeek >= Math.ceil(activeProgram.total_days / 7) - 1}
              className="p-2 text-iron-white hover:text-iron-orange disabled:text-iron-gray disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Calendar Grid */}
        <div className={`grid gap-4 ${
          viewMode === 'daily' ? 'grid-cols-1' :
          viewMode === 'weekly' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' :
          'grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7'
        }`}>
          {calendarDays.map((day) => {
            const progress = getProgressPercentage(day);
            const isToday = day.day_number === activeProgram.current_day;
            const isPast = day.day_number < activeProgram.current_day;

            return (
              <button
                key={day.day_number}
                onClick={() => handleDayClick(day.day_number)}
                className={`p-4 border-2 text-left hover:border-iron-orange transition-colors ${
                  isToday
                    ? 'border-iron-orange bg-iron-orange/10'
                    : day.is_completed
                    ? 'border-green-600 bg-green-600/10'
                    : isPast
                    ? 'border-iron-gray/50 bg-iron-gray/5'
                    : 'border-iron-gray'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-xs text-iron-gray">Day {day.day_number}</div>
                    <div className="text-sm font-bold text-iron-white">{day.day_name}</div>
                  </div>
                  {day.is_completed && (
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  )}
                </div>

                <div className="text-xs text-iron-gray mb-1">
                  {new Date(day.day_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>

                <div className="space-y-1 text-xs">
                  <div className="text-iron-gray">
                    {day.completed_meals}/{day.meal_count} meals
                  </div>
                  <div className="text-iron-gray">
                    {day.completed_workouts}/{day.workout_count} workouts
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-2 h-1 bg-iron-gray/30 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      progress === 100 ? 'bg-green-500' : 'bg-iron-orange'
                    }`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
}
