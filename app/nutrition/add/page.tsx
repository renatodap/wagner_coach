'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import BottomNavigation from '@/app/components/BottomNavigation';

// Dynamic import to avoid SSR issues with browser-specific code
const MealLogForm = dynamic(
  () => import('@/components/nutrition/MealLogForm').then(mod => mod.MealLogForm),
  {
    ssr: false,
    loading: () => <div className="text-iron-gray p-6">Loading form...</div>
  }
);

export default function AddMealPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (mealData: any) => {
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
        <MealLogForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}