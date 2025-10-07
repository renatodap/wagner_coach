'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getMeals, type Meal } from '@/lib/api/meals';
import { Plus, Apple, Trash2, Edit2, Copy, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import BottomNavigation from '@/app/components/BottomNavigation';
import { QuickMealEntry } from './QuickMealEntry';

export function NutritionDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [todaysMeals, setTodaysMeals] = useState<Meal[]>([]);
  const [yesterdaysMeals, setYesterdaysMeals] = useState<Meal[]>([]);
  const [error, setError] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadMeals() {
      try {
        setLoading(true);
        setError('');

        // Get JWT token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('Please log in to view meals');
          setLoading(false);
          return;
        }

        // Format selected date as start/end of day
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Fetch selected date's meals using Python backend
        const todayData = await getMeals({
          startDate: startOfDay.toISOString(),
          endDate: endOfDay.toISOString(),
          token: session.access_token
        });
        setTodaysMeals(todayData.meals || []);

        // Fetch previous day's meals for copying
        const yesterday = new Date(selectedDate);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStart = new Date(yesterday);
        yesterdayStart.setHours(0, 0, 0, 0);
        const yesterdayEnd = new Date(yesterday);
        yesterdayEnd.setHours(23, 59, 59, 999);

        try {
          const yesterdayData = await getMeals({
            startDate: yesterdayStart.toISOString(),
            endDate: yesterdayEnd.toISOString(),
            token: session.access_token
          });
          setYesterdaysMeals(yesterdayData.meals || []);
        } catch (err) {
          // Yesterday's meals are optional, don't fail if they're not available
          console.log('No meals from previous day');
        }
      } catch (err) {
        console.error('Error fetching meals:', err);
        setError('Failed to load nutrition data');
      } finally {
        setLoading(false);
      }
    }

    loadMeals();
  }, [selectedDate]);

  const fetchMeals = async () => {
    try {
      setLoading(true);
      setError('');

      // Get JWT token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please log in to view meals');
        setLoading(false);
        return;
      }

      // Format selected date as start/end of day
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Fetch selected date's meals using Python backend
      const todayData = await getMeals({
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString(),
        token: session.access_token
      });
      setTodaysMeals(todayData.meals || []);

      // Fetch previous day's meals for copying
      const yesterday = new Date(selectedDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStart = new Date(yesterday);
      yesterdayStart.setHours(0, 0, 0, 0);
      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);

      try {
        const yesterdayData = await getMeals({
          startDate: yesterdayStart.toISOString(),
          endDate: yesterdayEnd.toISOString(),
          token: session.access_token
        });
        setYesterdaysMeals(yesterdayData.meals || []);
      } catch (err) {
        // Yesterday's meals are optional
        console.log('No meals from previous day');
      }
    } catch (err) {
      console.error('Error fetching meals:', err);
      setError('Failed to load nutrition data');
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

  const handleDeleteMeal = async (mealId: string) => {
    if (!confirm('Are you sure you want to delete this meal?')) {
      return;
    }

    setDeletingId(mealId);
    try {
      const response = await fetch(`/api/nutrition/meals/${mealId}`, {
        method: 'DELETE',
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        data = { error: `Server returned ${response.status}: ${text || response.statusText}` };
      }

      if (!response.ok) {
        console.error('Delete failed:', data);
        throw new Error(data.error || 'Failed to delete meal');
      }

      // Remove from local state
      setTodaysMeals(todaysMeals.filter(meal => meal.id !== mealId));
    } catch (error) {
      console.error('Error deleting meal:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete meal');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditMeal = (mealId: string) => {
    router.push(`/nutrition/edit/${mealId}`);
  };

  const handleCopyMeal = async (meal: Meal) => {
    try {
      // Create a copy of the meal for the selected date with current time
      const copyTime = new Date(selectedDate);
      copyTime.setHours(new Date().getHours(), new Date().getMinutes(), new Date().getSeconds());

      const mealCopy = {
        meal_name: meal.name || 'Meal',
        meal_category: meal.category,
        logged_at: copyTime.toISOString(),
        calories: meal.total_calories,
        protein_g: meal.total_protein_g,
        carbs_g: meal.total_carbs_g,
        fat_g: meal.total_fat_g,
        fiber_g: meal.total_fiber_g,
        notes: meal.notes ? `${meal.notes} (copied)` : 'Copied from previous meal'
      };

      console.log('Copying meal:', mealCopy);

      const response = await fetch('/api/nutrition/meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mealCopy),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('Copy meal error:', responseData);
        throw new Error(responseData?.error || 'Failed to copy meal');
      }

      console.log('Meal copied successfully:', responseData);

      // Refresh meals
      await fetchMeals();
    } catch (error) {
      console.error('Error copying meal:', error);
      alert('Failed to copy meal');
    }
  };

  // Calculate today's totals
  const totals = todaysMeals.reduce((acc, meal) => ({
    calories: acc.calories + (meal.total_calories || 0),
    protein: acc.protein + (meal.total_protein_g || 0),
    carbs: acc.carbs + (meal.total_carbs_g || 0),
    fat: acc.fat + (meal.total_fat_g || 0),
    fiber: acc.fiber + (meal.total_fiber_g || 0)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

  // Group meals by category
  const mealsByCategory = todaysMeals.reduce((acc, meal) => {
    const category = meal.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(meal);
    return acc;
  }, {} as Record<string, Meal[]>);

  const categoryOrder = ['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout', 'other'];

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
              onClick={fetchMeals}
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
            <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl text-iron-orange">NUTRITION</h1>
            <div className="flex gap-1 sm:gap-2">
              <Link
                href="/nutrition/history"
                className="text-iron-gray hover:text-iron-orange transition-colors p-2 sm:p-1"
                title="View History"
                aria-label="View history"
              >
                <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              </Link>
              <QuickMealEntry onMealAdded={fetchMeals} />
              <Link
                href="/nutrition/add"
                className="bg-iron-orange text-iron-black px-2 sm:px-4 py-2 font-heading text-xs sm:text-sm uppercase tracking-wider hover:bg-orange-600 transition-colors flex items-center gap-1 sm:gap-2"
                aria-label="Add meal"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Add Meal</span>
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
            <Apple className="w-4 h-4 sm:w-5 sm:h-5 text-iron-orange" />
            {isToday() ? "TODAY'S" : formatSelectedDate()} NUTRITION
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <div>
              <p className="text-iron-gray text-xs uppercase">Calories</p>
              <p className="text-xl sm:text-2xl font-bold text-iron-white">{Math.round(totals.calories)}</p>
            </div>
            <div>
              <p className="text-iron-gray text-xs uppercase">Protein</p>
              <p className="text-xl sm:text-2xl font-bold text-iron-white">{Math.round(totals.protein)}g</p>
            </div>
            <div>
              <p className="text-iron-gray text-xs uppercase">Carbs</p>
              <p className="text-xl sm:text-2xl font-bold text-iron-white">{Math.round(totals.carbs)}g</p>
            </div>
            <div>
              <p className="text-iron-gray text-xs uppercase">Fat</p>
              <p className="text-xl sm:text-2xl font-bold text-iron-white">{Math.round(totals.fat)}g</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-iron-gray text-xs uppercase">Fiber</p>
              <p className="text-xl sm:text-2xl font-bold text-iron-white">{Math.round(totals.fiber)}g</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {yesterdaysMeals.length > 0 && (
          <div>
            <h2 className="font-heading text-lg sm:text-xl text-iron-white mb-2 sm:mb-3">QUICK ACTIONS</h2>
            <div className="border border-iron-gray/50 p-3 sm:p-4">
              <p className="text-iron-gray text-xs sm:text-sm mb-2 sm:mb-3">Copy from previous day to {isToday() ? 'today' : formatSelectedDate().toLowerCase()}:</p>
              <div className="flex flex-wrap gap-2">
                {yesterdaysMeals.slice(0, 3).map((meal) => (
                  <button
                    key={meal.id}
                    onClick={() => handleCopyMeal(meal)}
                    className="text-iron-white bg-iron-gray/20 hover:bg-iron-gray/40 px-2 sm:px-3 py-1 text-xs sm:text-sm transition-colors flex items-center gap-1 sm:gap-2 min-h-[36px]"
                  >
                    <Copy className="w-3 h-3" />
                    <span className="truncate max-w-[120px] sm:max-w-none">{meal.name || 'Meal'}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Meals by Category */}
        <div>
          <h2 className="font-heading text-lg sm:text-xl lg:text-2xl text-iron-white mb-3 sm:mb-4">
            {isToday() ? "TODAY'S" : formatSelectedDate()} MEALS
          </h2>

          {!todaysMeals || todaysMeals.length === 0 ? (
            <div className="border border-iron-gray p-6 sm:p-8 text-center">
              <p className="text-iron-gray mb-3 sm:mb-4 text-sm sm:text-base">
                No meals logged {isToday() ? 'today' : 'for this date'}
              </p>
              {isToday() && (
                <Link
                  href="/nutrition/add"
                  className="inline-block bg-iron-orange text-iron-black px-4 sm:px-6 py-2 font-heading text-sm sm:text-base uppercase tracking-wider hover:bg-orange-600 transition-colors"
                >
                  Log Your First Meal
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {categoryOrder.map(category => {
                const meals = mealsByCategory[category];
                if (!meals || meals.length === 0) return null;

                return (
                  <div key={category}>
                    <h3 className="text-iron-orange font-heading uppercase text-xs sm:text-sm mb-2">
                      {category.replace('_', ' ')}
                    </h3>
                    <div className="space-y-3">
                      {meals.map((meal) => (
                        <div key={meal.id} className="border border-iron-gray p-3 sm:p-4 hover:border-iron-orange/50 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between sm:block">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-iron-white font-medium text-sm sm:text-base truncate pr-2 sm:pr-0">{meal.name || 'Meal'}</h4>
                                  <p className="text-iron-gray text-xs sm:text-sm mt-0.5">
                                    {new Date(meal.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                                {/* Mobile Action Buttons */}
                                <div className="flex gap-1 sm:hidden">
                                  <button
                                    onClick={() => handleCopyMeal(meal)}
                                    className="text-iron-gray hover:text-iron-orange transition-colors p-2 min-w-[36px] min-h-[36px] flex items-center justify-center"
                                    title="Copy meal"
                                    aria-label="Copy meal"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleEditMeal(meal.id)}
                                    className="text-iron-gray hover:text-iron-orange transition-colors p-2 min-w-[36px] min-h-[36px] flex items-center justify-center"
                                    title="Edit meal"
                                    aria-label="Edit meal"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMeal(meal.id)}
                                    disabled={deletingId === meal.id}
                                    className="text-iron-gray hover:text-red-500 transition-colors disabled:opacity-50 p-2 min-w-[36px] min-h-[36px] flex items-center justify-center"
                                    title="Delete meal"
                                    aria-label="Delete meal"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {(meal.total_calories || meal.total_protein_g || meal.total_carbs_g || meal.total_fat_g) && (
                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs sm:text-sm mt-2">
                                  {meal.total_calories > 0 && (
                                    <span className="text-iron-gray whitespace-nowrap">
                                      <span className="text-iron-white">{Math.round(meal.total_calories)}</span> cal
                                    </span>
                                  )}
                                  {meal.total_protein_g > 0 && (
                                    <span className="text-iron-gray whitespace-nowrap">
                                      <span className="text-iron-white">{Math.round(meal.total_protein_g)}g</span> protein
                                    </span>
                                  )}
                                  {meal.total_carbs_g > 0 && (
                                    <span className="text-iron-gray whitespace-nowrap">
                                      <span className="text-iron-white">{Math.round(meal.total_carbs_g)}g</span> carbs
                                    </span>
                                  )}
                                  {meal.total_fat_g > 0 && (
                                    <span className="text-iron-gray whitespace-nowrap">
                                      <span className="text-iron-white">{Math.round(meal.total_fat_g)}g</span> fat
                                    </span>
                                  )}
                                </div>
                              )}

                              {meal.notes && (
                                <p className="text-iron-gray text-xs sm:text-sm mt-2 line-clamp-2">{meal.notes}</p>
                              )}
                            </div>

                            {/* Desktop Action Buttons */}
                            <div className="hidden sm:flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => handleCopyMeal(meal)}
                                className="text-iron-gray hover:text-iron-orange transition-colors p-2"
                                title="Copy meal"
                                aria-label="Copy meal"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditMeal(meal.id)}
                                className="text-iron-gray hover:text-iron-orange transition-colors p-2"
                                title="Edit meal"
                                aria-label="Edit meal"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteMeal(meal.id)}
                                disabled={deletingId === meal.id}
                                className="text-iron-gray hover:text-red-500 transition-colors disabled:opacity-50 p-2"
                                title="Delete meal"
                                aria-label="Delete meal"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}