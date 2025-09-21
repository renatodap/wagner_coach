'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MealLogForm } from '@/components/nutrition/MealLogForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import BottomNavigation from '@/app/components/BottomNavigation';

export default function AddMealPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (mealData: any) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/nutrition/meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meal_name: mealData.name,
          meal_category: mealData.meal_type,
          logged_at: new Date().toISOString(),
          calories: mealData.calories ? parseInt(mealData.calories) : undefined,
          protein_g: mealData.protein ? parseFloat(mealData.protein) : undefined,
          carbs_g: mealData.carbs ? parseFloat(mealData.carbs) : undefined,
          fat_g: mealData.fat ? parseFloat(mealData.fat) : undefined,
          fiber_g: mealData.fiber ? parseFloat(mealData.fiber) : undefined,
          notes: mealData.notes || undefined
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save meal');
      }

      // Redirect to nutrition dashboard on success
      router.push('/nutrition');
    } catch (error) {
      console.error('Error saving meal:', error);
      alert(error instanceof Error ? error.message : 'Failed to save meal');
    } finally {
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

      <main className="max-w-2xl mx-auto px-4 py-8 pb-24">
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