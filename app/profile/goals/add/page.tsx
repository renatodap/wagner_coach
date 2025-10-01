'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Target, Plus } from 'lucide-react';

export default function AddGoalPage() {
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [goal, setGoal] = useState({
    description: '',
    target_date: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!goal.description || goal.description.length < 3) {
      setError('Please describe your goal (at least 3 characters)');
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch('/api/profile/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goal_type: 'custom',
          description: goal.description,
          target_date: goal.target_date || null,
          priority: 3,
          status: 'active',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details?.join(', ') || error.error || 'Failed to create goal');
      }

      router.push('/profile');
    } catch (error) {
      console.error('Goal creation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to create goal');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-iron-black text-iron-white">
      {/* Header */}
      <header className="border-b border-iron-gray">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/profile')}
              className="text-iron-gray hover:text-iron-orange transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="font-heading text-2xl text-iron-orange uppercase tracking-wider flex items-center gap-2">
              <Target className="w-6 h-6" />
              Add Goal
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Goal Description */}
          <div className="border border-iron-gray p-6">
            <label htmlFor="description" className="block font-heading text-lg text-iron-white mb-2 uppercase">
              What's your goal?
            </label>
            <p className="text-iron-gray text-sm mb-4">
              Be specific. Examples: "Weigh 75kg", "Run 5k in 22 minutes", "Squat 315 lbs"
            </p>
            <input
              id="description"
              type="text"
              value={goal.description}
              onChange={(e) => setGoal({ ...goal, description: e.target.value })}
              placeholder="e.g., Squat 315 lbs"
              className="w-full bg-iron-black border-2 border-iron-gray text-iron-white px-4 py-3 focus:outline-none focus:border-iron-orange transition-colors text-lg"
              required
              maxLength={200}
            />
            <p className="text-iron-gray text-xs mt-2">{goal.description.length}/200 characters</p>
          </div>

          {/* Target Date */}
          <div className="border border-iron-gray p-6">
            <label htmlFor="target_date" className="block font-heading text-lg text-iron-white mb-2 uppercase">
              Target Date (Optional)
            </label>
            <p className="text-iron-gray text-sm mb-4">
              When do you want to achieve this goal?
            </p>
            <input
              id="target_date"
              type="date"
              value={goal.target_date}
              onChange={(e) => setGoal({ ...goal, target_date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-iron-black border-2 border-iron-gray text-iron-white px-4 py-3 focus:outline-none focus:border-iron-orange transition-colors text-lg"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="border-2 border-red-600 bg-red-600/10 p-4">
              <p className="text-red-500">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={() => router.push('/profile')}
              disabled={isSaving}
              className="flex-1 border-2 border-iron-gray text-iron-white font-heading py-4 uppercase tracking-wider hover:bg-iron-gray/20 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !goal.description}
              className="flex-1 bg-iron-orange text-iron-black font-heading py-4 uppercase tracking-wider hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Create Goal
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
