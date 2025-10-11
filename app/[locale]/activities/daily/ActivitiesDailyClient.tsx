'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getActivities } from '@/lib/api/activities';
import type { ActivityResponse } from '@/types/activity';
import {
  Plus,
  Dumbbell,
  Trash2,
  Edit2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Flame,
  TrendingUp,
  MapPin,
  Heart
} from 'lucide-react';
import Link from 'next/link';
import BottomNavigation from '@/components/BottomNavigation';

export default function ActivitiesDailyClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [todaysActivities, setTodaysActivities] = useState<ActivityResponse[]>([]);
  const [error, setError] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadActivities();
  }, [selectedDate]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError('');

      // Get JWT token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please log in to view activities');
        setLoading(false);
        return;
      }

      // Format selected date as start/end of day
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Fetch selected date's activities
      const response = await getActivities({
        start_date: startOfDay.toISOString(),
        end_date: endOfDay.toISOString(),
        limit: 100
      });

      setTodaysActivities(response.activities || []);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to load activity data');
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = () => {
    const today = new Date();
    return selectedDate.toDateString() === today.toDateString();
  };

  const formatSelectedDate = () => {
    const today = new Date();
    if (selectedDate.toDateString() === today.toDateString()) {
      return 'TODAY';
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (selectedDate.toDateString() === yesterday.toDateString()) {
      return 'YESTERDAY';
    }

    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: selectedDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    }).toUpperCase();
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) {
      return;
    }

    setDeletingId(activityId);
    try {
      const { deleteActivity } = await import('@/lib/api/activities');
      await deleteActivity(activityId);

      // Remove from local state
      setTodaysActivities(todaysActivities.filter(activity => activity.id !== activityId));
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete activity');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditActivity = (activityId: string) => {
    router.push(`/activities/edit/${activityId}`);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDistance = (meters: number | null) => {
    if (!meters) return null;
    const km = meters / 1000;
    if (km >= 1) {
      return `${km.toFixed(2)} km`;
    }
    return `${meters.toFixed(0)} m`;
  };

  // Calculate today's totals
  const totals = todaysActivities.reduce((acc, activity) => ({
    duration: acc.duration + (activity.elapsed_time_seconds || 0),
    calories: acc.calories + (activity.calories || 0),
    distance: acc.distance + (activity.distance_meters || 0),
    count: acc.count + 1
  }), { duration: 0, calories: 0, distance: 0, count: 0 });

  const getActivityIcon = (activityType: string) => {
    const type = activityType.toLowerCase();
    if (type.includes('run')) return '🏃';
    if (type.includes('bike') || type.includes('ride')) return '🚴';
    if (type.includes('swim')) return '🏊';
    if (type.includes('walk')) return '🚶';
    if (type.includes('strength') || type.includes('weight')) return '💪';
    if (type.includes('yoga')) return '🧘';
    if (type.includes('hiit')) return '⚡';
    return '🏋️';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-iron-black text-iron-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-iron-gray rounded w-1/3"></div>
            <div className="h-32 bg-iron-gray rounded"></div>
            <div className="h-64 bg-iron-gray rounded"></div>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-iron-black text-iron-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="border border-iron-gray p-6 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={loadActivities}
              className="bg-iron-orange text-iron-black px-4 py-2 font-heading uppercase tracking-wider hover:bg-orange-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-iron-black text-iron-white">
      {/* Header */}
      <header className="border-b border-iron-gray">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl text-iron-orange">DAILY ACTIVITIES</h1>
            <div className="flex gap-1 sm:gap-2">
              <Link
                href="/activities/add"
                className="bg-iron-orange text-iron-black px-2 sm:px-4 py-2 font-heading text-xs sm:text-sm uppercase tracking-wider hover:bg-orange-600 transition-colors flex items-center gap-1 sm:gap-2"
                aria-label="Add activity"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Add Activity</span>
                <span className="sm:hidden">Add</span>
              </Link>
            </div>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={goToPreviousDay}
              className="text-iron-gray hover:text-iron-orange transition-colors p-1 sm:p-2 hover:bg-iron-gray/10 rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Previous day"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
              <h2 className="font-heading text-sm sm:text-base lg:text-xl text-iron-white text-center">
                {formatSelectedDate()}
              </h2>
              {!isToday() && (
                <button
                  onClick={goToToday}
                  className="text-xs sm:text-sm text-iron-orange hover:text-orange-400 underline whitespace-nowrap"
                >
                  Today
                </button>
              )}
            </div>

            <button
              onClick={goToNextDay}
              className="text-iron-gray hover:text-iron-orange transition-colors p-1 sm:p-2 hover:bg-iron-gray/10 rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Next day"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8 pb-24 space-y-6 sm:space-y-8">
        {/* Summary */}
        <div className="border border-iron-gray p-4 sm:p-6">
          <h2 className="font-heading text-lg sm:text-xl lg:text-2xl text-iron-white mb-3 sm:mb-4 flex items-center gap-2">
            <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 text-iron-orange" />
            {isToday() ? "TODAY'S" : formatSelectedDate()} ACTIVITY
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <p className="text-iron-gray text-xs uppercase">Workouts</p>
              <p className="text-xl sm:text-2xl font-bold text-iron-white">{totals.count}</p>
            </div>
            <div>
              <p className="text-iron-gray text-xs uppercase">Duration</p>
              <p className="text-xl sm:text-2xl font-bold text-iron-white">
                {formatDuration(totals.duration)}
              </p>
            </div>
            <div>
              <p className="text-iron-gray text-xs uppercase">Calories</p>
              <p className="text-xl sm:text-2xl font-bold text-iron-white">{Math.round(totals.calories)}</p>
            </div>
            <div>
              <p className="text-iron-gray text-xs uppercase">Distance</p>
              <p className="text-xl sm:text-2xl font-bold text-iron-white">
                {totals.distance > 0 ? formatDistance(totals.distance) : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Activities List */}
        <div>
          <h2 className="font-heading text-lg sm:text-xl lg:text-2xl text-iron-white mb-3 sm:mb-4">
            {isToday() ? "TODAY'S" : formatSelectedDate()} ACTIVITIES
          </h2>

          {!todaysActivities || todaysActivities.length === 0 ? (
            <div className="border border-iron-gray p-6 sm:p-8 text-center">
              <p className="text-iron-gray mb-3 sm:mb-4 text-sm sm:text-base">
                No activities logged {isToday() ? 'today' : 'for this date'}
              </p>
              {isToday() && (
                <Link
                  href="/activities/add"
                  className="inline-block bg-iron-orange text-iron-black px-4 sm:px-6 py-2 font-heading text-sm sm:text-base uppercase tracking-wider hover:bg-orange-600 transition-colors"
                >
                  Log Your First Activity
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {todaysActivities.map((activity) => (
                <div key={activity.id} className="border border-iron-gray p-3 sm:p-4 hover:border-iron-orange/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between sm:block">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">{getActivityIcon(activity.activity_type)}</span>
                            <h4 className="text-iron-white font-medium text-sm sm:text-base truncate pr-2 sm:pr-0">
                              {activity.name}
                            </h4>
                          </div>
                          <p className="text-iron-gray text-xs sm:text-sm">
                            {new Date(activity.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {activity.source && ` • ${activity.source}`}
                          </p>
                        </div>
                        {/* Mobile Action Buttons */}
                        <div className="flex gap-1 sm:hidden">
                          <button
                            onClick={() => handleEditActivity(activity.id)}
                            className="text-iron-gray hover:text-iron-orange transition-colors p-2 min-w-[36px] min-h-[36px] flex items-center justify-center"
                            title="Edit activity"
                            aria-label="Edit activity"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteActivity(activity.id)}
                            disabled={deletingId === activity.id}
                            className="text-iron-gray hover:text-red-500 transition-colors disabled:opacity-50 p-2 min-w-[36px] min-h-[36px] flex items-center justify-center"
                            title="Delete activity"
                            aria-label="Delete activity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Activity Stats */}
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs sm:text-sm mt-2">
                        {activity.elapsed_time_seconds > 0 && (
                          <span className="text-iron-gray whitespace-nowrap flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span className="text-iron-white">{formatDuration(activity.elapsed_time_seconds)}</span>
                          </span>
                        )}
                        {activity.distance_meters && activity.distance_meters > 0 && (
                          <span className="text-iron-gray whitespace-nowrap flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span className="text-iron-white">{formatDistance(activity.distance_meters)}</span>
                          </span>
                        )}
                        {activity.calories && activity.calories > 0 && (
                          <span className="text-iron-gray whitespace-nowrap flex items-center gap-1">
                            <Flame className="w-3 h-3" />
                            <span className="text-iron-white">{Math.round(activity.calories)}</span> cal
                          </span>
                        )}
                        {activity.average_heart_rate && activity.average_heart_rate > 0 && (
                          <span className="text-iron-gray whitespace-nowrap flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            <span className="text-iron-white">{Math.round(activity.average_heart_rate)}</span> bpm
                          </span>
                        )}
                      </div>

                      {activity.notes && (
                        <p className="text-iron-gray text-xs sm:text-sm mt-2 line-clamp-2">{activity.notes}</p>
                      )}
                    </div>

                    {/* Desktop Action Buttons */}
                    <div className="hidden sm:flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleEditActivity(activity.id)}
                        className="text-iron-gray hover:text-iron-orange transition-colors p-2"
                        title="Edit activity"
                        aria-label="Edit activity"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteActivity(activity.id)}
                        disabled={deletingId === activity.id}
                        className="text-iron-gray hover:text-red-500 transition-colors disabled:opacity-50 p-2"
                        title="Delete activity"
                        aria-label="Delete activity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
