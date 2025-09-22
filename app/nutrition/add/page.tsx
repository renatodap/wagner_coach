'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MealBuilder } from '@/components/nutrition/MealBuilder';
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
        body: JSON.stringify(mealData),
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
            <h1 className="font-heading text-4xl text-iron-orange">BUILD MEAL</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 pb-24">
        <div className="border border-iron-gray p-6">
          <MealBuilder
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}