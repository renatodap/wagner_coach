'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Copy, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import BottomNavigation from '@/app/components/BottomNavigation';
import { Meal } from '@/types/nutrition';

export default function NutritionHistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mealsByDate, setMealsByDate] = useState<{ [key: string]: Meal[] }>({});
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>('');
  const [dateRange, setDateRange] = useState(7); // Default to last 7 days

  useEffect(() => {
    fetchMealHistory();
  }, [dateRange]);

  const fetchMealHistory = async () => {
    try {
      setLoading(true);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);

      const response = await fetch(
        `/api/nutrition/meals?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch meal history');
      }

      const data = await response.json();
      const meals = data.meals || [];

      // Group meals by date
      const grouped = meals.reduce((acc: { [key: string]: Meal[] }, meal: Meal) => {
        const date = new Date(meal.logged_at).toLocaleDateString();
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(meal);
        return acc;
      }, {});

      setMealsByDate(grouped);

      // Expand today by default
      const today = new Date().toLocaleDateString();
      if (grouped[today]) {
        setExpandedDates(new Set([today]));
      }
    } catch (err) {
      console.error('Error fetching meal history:', err);
      setError('Failed to load meal history');
    } finally {
      setLoading(false);
    }
  };

  const toggleDate = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  const handleCopyMeal = async (meal: Meal) => {
    try {
      const mealCopy = {
        meal_name: meal.meal_name,
        meal_category: meal.meal_category,
        logged_at: new Date().toISOString(),
        calories: meal.calories,
        protein_g: meal.protein_g,
        carbs_g: meal.carbs_g,
        fat_g: meal.fat_g,
        fiber_g: meal.fiber_g,
        notes: meal.notes ? `Copy from ${new Date(meal.logged_at).toLocaleDateString()}: ${meal.notes}` : `Copied from ${new Date(meal.logged_at).toLocaleDateString()}`
      };

      console.log('Copying meal from history:', mealCopy);

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

      // Redirect to nutrition dashboard
      router.push('/nutrition');
    } catch (error) {
      console.error('Error copying meal:', error);
      alert('Failed to copy meal');
    }
  };

  const calculateDayTotals = (meals: Meal[]) => {
    return meals.reduce((acc, meal) => ({
      calories: acc.calories + (meal.calories || 0),
      protein: acc.protein + (meal.protein_g || 0),
      carbs: acc.carbs + (meal.carbs_g || 0),
      fat: acc.fat + (meal.fat_g || 0),
      fiber: acc.fiber + (meal.fiber_g || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-iron-black text-iron-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-iron-gray rounded w-1/3"></div>
            <div className="h-64 bg-iron-gray rounded"></div>
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
              onClick={fetchMealHistory}
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

  const sortedDates = Object.keys(mealsByDate).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="min-h-screen bg-iron-black text-iron-white">
      {/* Header */}
      <header className="border-b border-iron-gray">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/nutrition"
                className="text-iron-gray hover:text-iron-orange transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <h1 className="font-heading text-4xl text-iron-orange">NUTRITION HISTORY</h1>
            </div>

            {/* Date Range Selector */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(Number(e.target.value))}
              className="bg-iron-black border border-iron-gray px-4 py-2 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 pb-24">
        {sortedDates.length === 0 ? (
          <div className="border border-iron-gray p-8 text-center">
            <Calendar className="w-12 h-12 text-iron-gray mx-auto mb-4" />
            <p className="text-iron-gray mb-4">No meals found in the selected period</p>
            <Link
              href="/nutrition/add"
              className="inline-block bg-iron-orange text-iron-black px-6 py-2 font-heading uppercase tracking-wider hover:bg-orange-600 transition-colors"
            >
              Log Your First Meal
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDates.map(dateString => {
              const meals = mealsByDate[dateString];
              const totals = calculateDayTotals(meals);
              const isExpanded = expandedDates.has(dateString);
              const formattedDate = formatDate(dateString);

              return (
                <div key={dateString} className="border border-iron-gray">
                  {/* Date Header */}
                  <button
                    onClick={() => toggleDate(dateString)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-iron-gray/10 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <h2 className="font-heading text-xl text-iron-white text-left">
                          {formattedDate}
                        </h2>
                        <p className="text-iron-gray text-sm text-left">
                          {meals.length} meal{meals.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Day Totals */}
                      <div className="flex gap-3 text-sm">
                        <span className="text-iron-gray">
                          <span className="text-iron-white">{Math.round(totals.calories)}</span> cal
                        </span>
                        <span className="text-iron-gray">
                          <span className="text-iron-white">{Math.round(totals.protein)}</span>g P
                        </span>
                        <span className="text-iron-gray">
                          <span className="text-iron-white">{Math.round(totals.carbs)}</span>g C
                        </span>
                        <span className="text-iron-gray">
                          <span className="text-iron-white">{Math.round(totals.fat)}</span>g F
                        </span>
                      </div>

                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-iron-gray" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-iron-gray" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Meals */}
                  {isExpanded && (
                    <div className="border-t border-iron-gray">
                      {meals.map(meal => (
                        <div
                          key={meal.id}
                          className="px-4 py-3 border-b border-iron-gray/50 last:border-b-0 hover:bg-iron-gray/5"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-iron-white font-medium">
                                  {meal.meal_name}
                                </h3>
                                <span className="text-iron-orange text-xs uppercase">
                                  {meal.meal_category}
                                </span>
                              </div>

                              <p className="text-iron-gray text-sm">
                                {new Date(meal.logged_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>

                              {(meal.calories || meal.protein_g || meal.carbs_g || meal.fat_g) && (
                                <div className="flex gap-4 text-sm mt-2">
                                  {meal.calories && (
                                    <span className="text-iron-gray">
                                      <span className="text-iron-white">{meal.calories}</span> cal
                                    </span>
                                  )}
                                  {meal.protein_g && (
                                    <span className="text-iron-gray">
                                      <span className="text-iron-white">{meal.protein_g}g</span> protein
                                    </span>
                                  )}
                                  {meal.carbs_g && (
                                    <span className="text-iron-gray">
                                      <span className="text-iron-white">{meal.carbs_g}g</span> carbs
                                    </span>
                                  )}
                                  {meal.fat_g && (
                                    <span className="text-iron-gray">
                                      <span className="text-iron-white">{meal.fat_g}g</span> fat
                                    </span>
                                  )}
                                </div>
                              )}

                              {meal.notes && (
                                <p className="text-iron-gray text-sm mt-2">{meal.notes}</p>
                              )}
                            </div>

                            {/* Copy Button */}
                            <button
                              onClick={() => handleCopyMeal(meal)}
                              className="text-iron-gray hover:text-iron-orange transition-colors"
                              title="Copy to today"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}