'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Meal } from '@/types/nutrition';
import { Plus, Apple } from 'lucide-react';
import Link from 'next/link';
import BottomNavigation from '@/app/components/BottomNavigation';

export function NutritionDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [todaysMeals, setTodaysMeals] = useState<Meal[]>([]);
  const [error, setError] = useState<string>('');
  const supabase = createClient();

  useEffect(() => {
    fetchTodaysMeals();
  }, []);

  const fetchTodaysMeals = async () => {
    try {
      const response = await fetch('/api/nutrition/meals');

      if (!response.ok) {
        throw new Error('Failed to fetch meals');
      }

      const data = await response.json();
      setTodaysMeals(data.meals || []);
    } catch (err) {
      console.error('Error fetching meals:', err);
      setError('Failed to load nutrition data');
    } finally {
      setLoading(false);
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
              onClick={fetchTodaysMeals}
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
            <Link
              href="/nutrition/add"
              className="bg-iron-orange text-iron-black px-4 py-2 font-heading uppercase tracking-wider hover:bg-orange-600 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Meal
            </Link>
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

        {/* Today's Meals */}
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
            <div className="space-y-3">
              {todaysMeals.map((meal) => (
                <div key={meal.id} className="border border-iron-gray p-4 hover:border-iron-orange/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-iron-white font-medium">{meal.meal_name}</h3>
                      <p className="text-iron-gray text-sm capitalize">
                        {meal.meal_category} • {new Date(meal.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {(meal.calories || meal.protein_g || meal.carbs_g || meal.fat_g) && (
                    <div className="flex gap-4 text-sm">
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