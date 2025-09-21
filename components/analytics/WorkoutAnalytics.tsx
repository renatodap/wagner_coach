'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TrendingUp, Activity, Target, Calendar } from 'lucide-react';

interface WorkoutAnalyticsProps {
  userId: string;
  dateRange?: 'week' | 'month' | 'all';
}

interface VolumeData {
  date: string;
  volume: number;
  exercises: number;
}

interface MuscleGroupData {
  muscleGroup: string;
  count: number;
  percentage: number;
}

export default function WorkoutAnalytics({
  userId,
  dateRange = 'week'
}: WorkoutAnalyticsProps) {
  const [volumeData, setVolumeData] = useState<VolumeData[]>([]);
  const [muscleGroupData, setMuscleGroupData] = useState<MuscleGroupData[]>([]);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [avgSessionTime, setAvgSessionTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, dateRange]);

  const fetchAnalytics = async () => {
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      if (dateRange === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (dateRange === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else {
        startDate.setFullYear(startDate.getFullYear() - 1);
      }

      // Fetch workout completions with exercise details
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: completions } = await (supabase as any)
        .from('workout_completions')
        .select(`
          *,
          exercise_completions (
            *,
            exercises (
              name,
              muscle_group,
              category
            )
          )
        `)
        .eq('user_id', userId)
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString())
        .order('completed_at', { ascending: true });

      if (completions) {
        // Calculate volume data
        const volumeByDate: Record<string, number> = {};
        const muscleGroups: Record<string, number> = {};
        let totalVol = 0;
        let totalTime = 0;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        completions.forEach((completion: any) => {
          const date = new Date(completion.completed_at).toLocaleDateString();
          let dailyVolume = 0;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          completion.exercise_completions?.forEach((exercise: any) => {
            // Calculate volume for this exercise
            const exerciseVolume = exercise.weight_kg?.reduce((sum: number, weight: number, index: number) => {
              return sum + (weight * (exercise.reps_completed?.[index] || 0));
            }, 0) || 0;

            dailyVolume += exerciseVolume;
            totalVol += exerciseVolume;

            // Track muscle groups
            const muscleGroup = exercise.exercises?.muscle_group || 'Other';
            muscleGroups[muscleGroup] = (muscleGroups[muscleGroup] || 0) + 1;
          });

          volumeByDate[date] = (volumeByDate[date] || 0) + dailyVolume;

          // Calculate session time
          if (completion.started_at && completion.completed_at) {
            const duration = new Date(completion.completed_at).getTime() - new Date(completion.started_at).getTime();
            totalTime += duration;
          }
        });

        // Format volume data for display
        const volumeArray = Object.entries(volumeByDate).map(([date, volume]) => ({
          date,
          volume: Math.round(volume),
          exercises: 0 // Will be calculated if needed
        }));

        // Format muscle group data
        const totalMuscleGroupCount = Object.values(muscleGroups).reduce((a, b) => a + b, 0);
        const muscleGroupArray = Object.entries(muscleGroups)
          .map(([muscleGroup, count]) => ({
            muscleGroup,
            count,
            percentage: Math.round((count / totalMuscleGroupCount) * 100)
          }))
          .sort((a, b) => b.count - a.count);

        setVolumeData(volumeArray);
        setMuscleGroupData(muscleGroupArray);
        setTotalWorkouts(completions.length);
        setTotalVolume(Math.round(totalVol));
        setAvgSessionTime(completions.length > 0 ? Math.round(totalTime / completions.length / 60000) : 0);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMaxVolume = () => Math.max(...volumeData.map(d => d.volume), 1);

  if (loading) {
    return (
      <div className="border border-iron-gray p-6">
        <p className="text-iron-gray text-center">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-iron-gray p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-iron-orange" />
            <span className="text-iron-gray text-xs uppercase">Workouts</span>
          </div>
          <p className="font-heading text-3xl text-iron-white">{totalWorkouts}</p>
        </div>

        <div className="border border-iron-gray p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-iron-orange" />
            <span className="text-iron-gray text-xs uppercase">Total Volume</span>
          </div>
          <p className="font-heading text-3xl text-iron-white">
            {(totalVolume / 1000).toFixed(1)}t
          </p>
        </div>

        <div className="border border-iron-gray p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-iron-orange" />
            <span className="text-iron-gray text-xs uppercase">Avg Session</span>
          </div>
          <p className="font-heading text-3xl text-iron-white">{avgSessionTime}m</p>
        </div>

        <div className="border border-iron-gray p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-iron-orange" />
            <span className="text-iron-gray text-xs uppercase">Consistency</span>
          </div>
          <p className="font-heading text-3xl text-iron-white">
            {dateRange === 'week'
              ? Math.round((totalWorkouts / 7) * 100)
              : Math.round((totalWorkouts / 30) * 100)}%
          </p>
        </div>
      </div>

      {/* Volume Chart */}
      {volumeData.length > 0 && (
        <div className="border border-iron-gray p-6">
          <h3 className="font-heading text-xl text-iron-white mb-4">
            VOLUME PROGRESSION
          </h3>
          <div className="space-y-2">
            {volumeData.map((day, index) => (
              <div key={index} className="flex items-center gap-4">
                <span className="text-iron-gray text-xs w-20">
                  {day.date.split('/').slice(0, 2).join('/')}
                </span>
                <div className="flex-1 h-6 bg-iron-gray/20 relative">
                  <div
                    className="absolute left-0 top-0 h-full bg-iron-orange"
                    style={{ width: `${(day.volume / getMaxVolume()) * 100}%` }}
                  />
                </div>
                <span className="text-iron-white text-sm font-mono w-16 text-right">
                  {(day.volume / 1000).toFixed(1)}t
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Muscle Group Distribution */}
      {muscleGroupData.length > 0 && (
        <div className="border border-iron-gray p-6">
          <h3 className="font-heading text-xl text-iron-white mb-4">
            MUSCLE GROUP FOCUS
          </h3>
          <div className="space-y-3">
            {muscleGroupData.slice(0, 5).map((group, index) => (
              <div key={index}>
                <div className="flex justify-between mb-1">
                  <span className="text-iron-white capitalize">{group.muscleGroup}</span>
                  <span className="text-iron-gray text-sm">{group.percentage}%</span>
                </div>
                <div className="h-2 bg-iron-gray/20">
                  <div
                    className="h-full bg-iron-orange"
                    style={{ width: `${group.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progressive Overload Indicator */}
      <div className="border-2 border-iron-orange p-6 bg-iron-orange/5">
        <h3 className="font-heading text-xl text-iron-orange mb-2">
          PROGRESSIVE OVERLOAD
        </h3>
        <p className="text-iron-gray mb-4">
          Your volume has {totalVolume > 0 ? 'increased' : 'started'} this {dateRange}
        </p>
        <div className="flex items-center gap-4">
          <TrendingUp className="w-8 h-8 text-iron-orange" />
          <div>
            <p className="font-heading text-3xl text-iron-white">
              +{Math.round(totalVolume / (totalWorkouts || 1))} kg
            </p>
            <p className="text-iron-gray text-sm">Average per session</p>
          </div>
        </div>
      </div>
    </div>
  );
}