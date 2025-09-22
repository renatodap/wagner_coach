'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import BottomNavigation from '@/app/components/BottomNavigation';

export default function EditMealPage() {
  const router = useRouter();
  const params = useParams();
  const mealId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [meal, setMeal] = useState<any>(null);
  const [error, setError] = useState<string>('');

  // Form fields
  const [mealName, setMealName] = useState('');
  const [category, setCategory] = useState('other');
  const [notes, setNotes] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');

  useEffect(() => {
    fetchMeal();
  }, [mealId]);

  const fetchMeal = async () => {
    try {
      const response = await fetch(`/api/nutrition/meals/${mealId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch meal');
      }

      const data = await response.json();
      const mealData = data.meal;

      // Populate form fields
      setMealName(mealData.meal_name || '');
      setCategory(mealData.meal_category || 'other');
      setNotes(mealData.notes || '');
      setCalories(mealData.calories?.toString() || '');
      setProtein(mealData.protein_g?.toString() || '');
      setCarbs(mealData.carbs_g?.toString() || '');
      setFat(mealData.fat_g?.toString() || '');
      setFiber(mealData.fiber_g?.toString() || '');

      setMeal(mealData);
    } catch (err) {
      console.error('Error fetching meal:', err);
      setError('Failed to load meal');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateData = {
        meal_name: mealName,
        meal_category: category,
        notes: notes || null,
        calories: calories ? parseFloat(calories) : null,
        protein_g: protein ? parseFloat(protein) : null,
        carbs_g: carbs ? parseFloat(carbs) : null,
        fat_g: fat ? parseFloat(fat) : null,
        fiber_g: fiber ? parseFloat(fiber) : null,
      };

      const response = await fetch(`/api/nutrition/meals/${mealId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update meal');
      }

      router.push('/nutrition');
    } catch (error) {
      console.error('Error updating meal:', error);
      alert('Failed to update meal');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-iron-black text-iron-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-iron-gray rounded w-1/3"></div>
            <div className="h-96 bg-iron-gray rounded"></div>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-iron-black text-iron-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="border border-iron-gray p-6 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Link
              href="/nutrition"
              className="bg-iron-orange text-iron-black px-4 py-2 font-heading uppercase tracking-wider hover:bg-orange-600 transition-colors"
            >
              Back to Nutrition
            </Link>
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
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/nutrition"
              className="text-iron-gray hover:text-iron-orange transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="font-heading text-4xl text-iron-orange">EDIT MEAL</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 pb-24">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border border-iron-gray p-6 space-y-6">
            {/* Meal Name */}
            <div>
              <label className="block text-iron-gray text-xs uppercase mb-2">
                Meal Name
              </label>
              <input
                type="text"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
                placeholder="e.g., Breakfast, Post-workout meal"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-iron-gray text-xs uppercase mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
                <option value="pre_workout">Pre-Workout</option>
                <option value="post_workout">Post-Workout</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Nutrition Values */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-iron-gray text-xs uppercase mb-2">
                  Calories
                </label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
                  placeholder="0"
                  step="0.1"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-iron-gray text-xs uppercase mb-2">
                  Protein (g)
                </label>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
                  placeholder="0"
                  step="0.1"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-iron-gray text-xs uppercase mb-2">
                  Carbs (g)
                </label>
                <input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
                  placeholder="0"
                  step="0.1"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-iron-gray text-xs uppercase mb-2">
                  Fat (g)
                </label>
                <input
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
                  placeholder="0"
                  step="0.1"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-iron-gray text-xs uppercase mb-2">
                  Fiber (g)
                </label>
                <input
                  type="number"
                  value={fiber}
                  onChange={(e) => setFiber(e.target.value)}
                  className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
                  placeholder="0"
                  step="0.1"
                  min="0"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-iron-gray text-xs uppercase mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
                placeholder="Any notes about this meal..."
              />
            </div>

            {/* Original Logged Time */}
            {meal && (
              <div className="text-iron-gray text-sm">
                Originally logged: {new Date(meal.logged_at).toLocaleString()}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-iron-orange text-iron-black font-heading py-3 uppercase tracking-wider hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              href="/nutrition"
              className="flex-1 border border-iron-gray text-iron-white font-heading py-3 uppercase tracking-wider hover:bg-iron-gray/20 transition-colors text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}