'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import BottomNavigation from '@/app/components/BottomNavigation';

// Dynamic imports to avoid SSR issues with browser-specific code
const MealLogForm = dynamic(
  () => import('@/components/nutrition/MealLogForm').then(mod => mod.MealLogForm),
  {
    ssr: false,
    loading: () => <div className="text-iron-gray p-6">Loading form...</div>
  }
);

const NaturalLanguageEntry = dynamic(
  () => import('@/components/nutrition/NaturalLanguageEntry').then(mod => mod.NaturalLanguageEntry),
  {
    ssr: false,
    loading: () => <div className="text-iron-gray p-6">Loading AI parser...</div>
  }
);

const MealBuilder = dynamic(
  () => import('@/components/nutrition/MealBuilder').then(mod => mod.MealBuilder),
  {
    ssr: false,
    loading: () => <div className="text-iron-gray p-6">Loading meal builder...</div>
  }
);

export default function AddMealPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useAdvancedBuilder, setUseAdvancedBuilder] = useState(true); // Default to food selection

  const handleMealBuilderSubmit = async (mealData: any) => {
    setIsSubmitting(true);

    try {
      // The API now expects the correct format for meal_logs table
      const formattedData = {
        name: mealData.name || `Meal with ${mealData.foods?.length || 0} items`,
        category: mealData.category || 'other',
        logged_at: mealData.logged_at || new Date().toISOString(),
        notes: mealData.notes || null,
        foods: mealData.foods || [] // The foods array with food_id, quantity, unit
      };

      console.log('Saving meal with foods:', formattedData);

      const response = await fetch('/api/nutrition/meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('Meal save error:', responseData);
        throw new Error(responseData.error || 'Failed to save meal');
      }

      console.log('Meal saved successfully:', responseData);
      router.push('/nutrition');
    } catch (error) {
      console.error('Error saving meal:', error);
      alert(error instanceof Error ? error.message : 'Failed to save meal');
      setIsSubmitting(false);
    }
  };

  const handleSimpleSubmit = async (mealData: any) => {
    setIsSubmitting(true);

    try {
      // Transform the data to match the API format
      const formattedData = {
        meal_name: mealData.name || 'Meal',
        meal_category: mealData.meal_type || 'other',
        logged_at: new Date().toISOString(),
        calories: mealData.calories ? parseFloat(mealData.calories) : null,
        protein_g: mealData.protein ? parseFloat(mealData.protein) : null,
        carbs_g: mealData.carbs ? parseFloat(mealData.carbs) : null,
        fat_g: mealData.fat ? parseFloat(mealData.fat) : null,
        fiber_g: mealData.fiber ? parseFloat(mealData.fiber) : null,
        notes: mealData.notes || null
      };

      console.log('Saving meal:', formattedData);

      const response = await fetch('/api/nutrition/meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('Meal save error:', responseData);
        throw new Error(responseData.error || 'Failed to save meal');
      }

      console.log('Meal saved successfully:', responseData);

      // Redirect to nutrition dashboard on success
      router.push('/nutrition');
    } catch (error) {
      console.error('Error saving meal:', error);
      alert(error instanceof Error ? error.message : 'Failed to save meal');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/nutrition');
  };

  return (
    <div className="min-h-screen bg-iron-black text-iron-white">
      {/* Header */}
      <header className="border-b border-iron-gray">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/nutrition"
              className="text-iron-gray hover:text-iron-orange transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="font-heading text-4xl text-iron-orange">ADD MEAL</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 pb-24">
        {/* Toggle between simple and advanced modes */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setUseAdvancedBuilder(true)}
            className={`px-4 py-2 font-medium transition-colors ${
              useAdvancedBuilder
                ? 'bg-iron-orange text-iron-black'
                : 'bg-iron-black border border-iron-gray text-iron-gray hover:text-iron-white'
            }`}
          >
            Build from Foods
          </button>
          <button
            onClick={() => setUseAdvancedBuilder(false)}
            className={`px-4 py-2 font-medium transition-colors ${
              !useAdvancedBuilder
                ? 'bg-iron-orange text-iron-black'
                : 'bg-iron-black border border-iron-gray text-iron-gray hover:text-iron-white'
            }`}
          >
AI Natural Language
          </button>
        </div>

        {useAdvancedBuilder ? (
          <MealBuilder
            onSubmit={handleMealBuilderSubmit}
            onCancel={handleCancel}
          />
        ) : (
          <NaturalLanguageEntry
            onSubmit={handleMealBuilderSubmit}
            onCancel={handleCancel}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}