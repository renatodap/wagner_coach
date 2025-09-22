'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Meal } from '@/types/nutrition';
import { Plus, Apple, Trash2, Edit2, Copy, Clock } from 'lucide-react';
import Link from 'next/link';
import BottomNavigation from '@/app/components/BottomNavigation';

export function NutritionDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [todaysMeals, setTodaysMeals] = useState<Meal[]>([]);
  const [yesterdaysMeals, setYesterdaysMeals] = useState<Meal[]>([]);
  const [error, setError] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchMeals();
  }, []);

  const fetchMeals = async () => {
    try {
      // Fetch today's meals
      const todayResponse = await fetch('/api/nutrition/meals');
      if (!todayResponse.ok) {
        throw new Error('Failed to fetch today\'s meals');
      }
      const todayData = await todayResponse.json();
      setTodaysMeals(todayData.meals || []);

      // Fetch yesterday's meals for copying
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayResponse = await fetch(`/api/nutrition/meals?date=${yesterday.toISOString().split('T')[0]}`);
      if (yesterdayResponse.ok) {
        const yesterdayData = await yesterdayResponse.json();
        setYesterdaysMeals(yesterdayData.meals || []);
      }
    } catch (err) {
      console.error('Error fetching meals:', err);
      setError('Failed to load nutrition data');
    } finally {
      setLoading(false);
    }
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

      if (!response.ok) {
        throw new Error('Failed to delete meal');
      }

      // Remove from local state
      setTodaysMeals(todaysMeals.filter(meal => meal.id !== mealId));
    } catch (error) {
      console.error('Error deleting meal:', error);
      alert('Failed to delete meal');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditMeal = (mealId: string) => {
    router.push(`/nutrition/edit/${mealId}`);
  };

  const handleCopyMeal = async (meal: Meal) => {
    try {
      // Create a copy of the meal for today
      const mealCopy = {
        meal_name: meal.meal_name,
        meal_category: meal.meal_category,
        logged_at: new Date().toISOString(),
        calories: meal.calories,
        protein_g: meal.protein_g,
        carbs_g: meal.carbs_g,
        fat_g: meal.fat_g,
        fiber_g: meal.fiber_g,
        notes: meal.notes ? `Copy of: ${meal.notes}` : 'Copied meal'
      };

      const response = await fetch('/api/nutrition/meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mealCopy),
      });

      if (!response.ok) {
        throw new Error('Failed to copy meal');
      }

      // Refresh meals
      await fetchMeals();
    } catch (error) {
      console.error('Error copying meal:', error);
      alert('Failed to copy meal');
    }
  };

  // Calculate today's totals
  const totals = todaysMeals.reduce((acc, meal) => ({
    calories: acc.calories + (meal.calories || 0),
    protein: acc.protein + (meal.protein_g || 0),
    carbs: acc.carbs + (meal.carbs_g || 0),
    fat: acc.fat + (meal.fat_g || 0),
    fiber: acc.fiber + (meal.fiber_g || 0)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

  // Group meals by category
  const mealsByCategory = todaysMeals.reduce((acc, meal) => {
    const category = meal.meal_category || 'other';
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
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-4xl text-iron-orange">NUTRITION</h1>
            <div className="flex gap-2">
              <Link
                href="/nutrition/history"
                className="text-iron-gray hover:text-iron-orange transition-colors"
                title="View History"
              >
                <Clock className="w-6 h-6" />
              </Link>
              <Link
                href="/nutrition/add"
                className="bg-iron-orange text-iron-black px-4 py-2 font-heading uppercase tracking-wider hover:bg-orange-600 transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Meal
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 pb-24 space-y-8">
        {/* Today's Summary */}
        <div className="border border-iron-gray p-6">
          <h2 className="font-heading text-2xl text-iron-white mb-4 flex items-center gap-2">
            <Apple className="w-5 h-5 text-iron-orange" />
            TODAY&apos;S NUTRITION
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-iron-gray text-xs uppercase">Calories</p>
              <p className="text-2xl font-bold text-iron-white">{Math.round(totals.calories)}</p>
            </div>
            <div>
              <p className="text-iron-gray text-xs uppercase">Protein</p>
              <p className="text-2xl font-bold text-iron-white">{Math.round(totals.protein)}g</p>
            </div>
            <div>
              <p className="text-iron-gray text-xs uppercase">Carbs</p>
              <p className="text-2xl font-bold text-iron-white">{Math.round(totals.carbs)}g</p>
            </div>
            <div>
              <p className="text-iron-gray text-xs uppercase">Fat</p>
              <p className="text-2xl font-bold text-iron-white">{Math.round(totals.fat)}g</p>
            </div>
            <div>
              <p className="text-iron-gray text-xs uppercase">Fiber</p>
              <p className="text-2xl font-bold text-iron-white">{Math.round(totals.fiber)}g</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {yesterdaysMeals.length > 0 && (
          <div>
            <h2 className="font-heading text-xl text-iron-white mb-3">QUICK ACTIONS</h2>
            <div className="border border-iron-gray/50 p-4">
              <p className="text-iron-gray text-sm mb-3">Copy from yesterday:</p>
              <div className="flex flex-wrap gap-2">
                {yesterdaysMeals.slice(0, 3).map((meal) => (
                  <button
                    key={meal.id}
                    onClick={() => handleCopyMeal(meal)}
                    className="text-iron-white bg-iron-gray/20 hover:bg-iron-gray/40 px-3 py-1 text-sm transition-colors flex items-center gap-2"
                  >
                    <Copy className="w-3 h-3" />
                    {meal.meal_name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Today's Meals by Category */}
        <div>
          <h2 className="font-heading text-2xl text-iron-white mb-4">TODAY&apos;S MEALS</h2>

          {!todaysMeals || todaysMeals.length === 0 ? (
            <div className="border border-iron-gray p-8 text-center">
              <p className="text-iron-gray mb-4">No meals logged today</p>
              <Link
                href="/nutrition/add"
                className="inline-block bg-iron-orange text-iron-black px-6 py-2 font-heading uppercase tracking-wider hover:bg-orange-600 transition-colors"
              >
                Log Your First Meal
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {categoryOrder.map(category => {
                const meals = mealsByCategory[category];
                if (!meals || meals.length === 0) return null;

                return (
                  <div key={category}>
                    <h3 className="text-iron-orange font-heading uppercase text-sm mb-2">
                      {category.replace('_', ' ')}
                    </h3>
                    <div className="space-y-3">
                      {meals.map((meal) => (
                        <div key={meal.id} className="border border-iron-gray p-4 hover:border-iron-orange/50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-iron-white font-medium">{meal.meal_name}</h4>
                              <p className="text-iron-gray text-sm">
                                {new Date(meal.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleCopyMeal(meal)}
                                className="text-iron-gray hover:text-iron-orange transition-colors"
                                title="Copy meal"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditMeal(meal.id)}
                                className="text-iron-gray hover:text-iron-orange transition-colors"
                                title="Edit meal"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteMeal(meal.id)}
                                disabled={deletingId === meal.id}
                                className="text-iron-gray hover:text-red-500 transition-colors disabled:opacity-50"
                                title="Delete meal"
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