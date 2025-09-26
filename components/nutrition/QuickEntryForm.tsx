'use client';

import React, { useState } from 'react';
import { Zap, AlertCircle, Loader } from 'lucide-react';
import { MealConfirmation } from './MealConfirmation';
import { IntelligentParsedMeal } from '@/lib/ai/intelligent-meal-parser';

interface QuickEntryFormProps {
  onSubmit: (mealData: any) => void;
  onCancel?: () => void;
}

type EntryState = 'input' | 'parsing' | 'confirmation' | 'error';

export function QuickEntryForm({ onSubmit, onCancel }: QuickEntryFormProps) {
  const [entryState, setEntryState] = useState<EntryState>('input');
  const [description, setDescription] = useState('');
  const [parsedMeal, setParsedMeal] = useState<IntelligentParsedMeal | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [originalDescription, setOriginalDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      setError('Please enter a meal description');
      return;
    }

    setEntryState('parsing');
    setError(null);
    setOriginalDescription(description);

    try {
      console.log('🚀 Parsing meal description:', description);

      const response = await fetch('/api/nutrition/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: description.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse meal');
      }

      console.log('✅ Parse result:', data);

      setParsedMeal(data.parsed);
      setWarnings(data.warnings || []);

      if (data.requiresConfirmation) {
        setEntryState('confirmation');
      } else {
        // High confidence, proceed directly
        handleConfirm(data.parsed);
      }
    } catch (error) {
      console.error('❌ Parsing error:', error);
      setError(error instanceof Error ? error.message : 'Failed to parse meal description');
      setEntryState('error');
    }
  };

  const handleConfirm = (confirmedMeal: IntelligentParsedMeal) => {
    console.log('✅ User confirmed meal:', confirmedMeal);

    // Check if we have foods with database IDs vs fallback nutrition
    const foodsWithIds = confirmedMeal.foods.filter(food => food.foodId);
    const fallbackFoods = confirmedMeal.foods.filter(food => !food.foodId);

    if (foodsWithIds.length > 0) {
      // We have some foods in database - create meal with them
      const mealData = {
        name: confirmedMeal.meal_name,
        category: confirmedMeal.category,
        logged_at: confirmedMeal.logged_at,
        notes: `Quick entry: "${originalDescription}"${fallbackFoods.length > 0 ? ` (${fallbackFoods.length} items used estimates)` : ''}`,
        foods: foodsWithIds.map(food => ({
          food_id: food.foodId,
          quantity: food.quantity,
          unit: food.unit
        }))
      };

      console.log('📤 Submitting meal with database foods:', mealData);
      onSubmit(mealData);
    } else {
      // No foods have database IDs - create a simple meal entry with total nutrition
      const mealData = {
        name: confirmedMeal.meal_name,
        category: confirmedMeal.category,
        logged_at: confirmedMeal.logged_at,
        notes: `Quick entry: "${originalDescription}" (estimated nutrition)`,
        // Use the old format for meals without specific food references
        meal_name: confirmedMeal.meal_name,
        meal_category: confirmedMeal.category,
        calories: confirmedMeal.total_calories,
        protein_g: confirmedMeal.total_protein_g,
        carbs_g: confirmedMeal.total_carbs_g,
        fat_g: confirmedMeal.total_fat_g,
        foods: [] // Empty foods array - will use totals instead
      };

      console.log('📤 Submitting meal with estimated nutrition:', mealData);
      onSubmit(mealData);
    }
  };

  const handleReject = () => {
    setEntryState('input');
    setParsedMeal(null);
    setWarnings([]);
    setError(null);
  };

  const handleEdit = (foodIndex: number) => {
    console.log('✏️ User wants to edit food at index:', foodIndex);
    // For now, just show a message. In the future, could open a food editor
    alert('Food editing will be available in the next update. For now, please try a different description or use the manual meal builder.');
  };

  const handleTryAgain = () => {
    setEntryState('input');
    setError(null);
  };

  return (
    <div className="border border-iron-gray p-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="text-iron-orange" size={24} />
        <h2 className="font-heading text-2xl text-iron-orange">QUICK ENTRY</h2>
      </div>

      <p className="text-iron-gray text-sm mb-6">
        Describe your meal in natural language. I'll search our database and the web if needed!
      </p>

      {/* Input State */}
      {entryState === 'input' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-iron-gray text-xs uppercase mb-2">
              What did you eat?
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., chicken avocado protein bowl from subway, 2 eggs and toast, chipotle burrito bowl with double chicken"
              className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
              rows={3}
              maxLength={500}
            />
            <div className="text-iron-gray text-xs mt-1">
              {description.length}/500 characters
            </div>
          </div>

          <div className="bg-iron-black border border-iron-gray/50 p-4">
            <h4 className="text-iron-gray text-xs uppercase mb-2">Examples:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <button
                type="button"
                onClick={() => setDescription('subway outlaw sandwich')}
                className="text-left text-iron-gray hover:text-iron-white transition-colors p-2 hover:bg-iron-gray/10"
              >
                • subway outlaw sandwich
              </button>
              <button
                type="button"
                onClick={() => setDescription('chipotle bowl with double chicken')}
                className="text-left text-iron-gray hover:text-iron-white transition-colors p-2 hover:bg-iron-gray/10"
              >
                • chipotle bowl with double chicken
              </button>
              <button
                type="button"
                onClick={() => setDescription('2 scrambled eggs with toast')}
                className="text-left text-iron-gray hover:text-iron-white transition-colors p-2 hover:bg-iron-gray/10"
              >
                • 2 scrambled eggs with toast
              </button>
              <button
                type="button"
                onClick={() => setDescription('protein shake with banana and peanut butter')}
                className="text-left text-iron-gray hover:text-iron-white transition-colors p-2 hover:bg-iron-gray/10"
              >
                • protein shake with banana
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={!description.trim()}
              className="flex-1 bg-iron-orange text-iron-black font-heading py-3 uppercase tracking-wider hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Zap size={20} />
              Parse Meal
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 border border-iron-gray text-iron-white font-heading py-3 uppercase tracking-wider hover:bg-iron-gray/20 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* Parsing State */}
      {entryState === 'parsing' && (
        <div className="text-center py-12">
          <Loader className="animate-spin text-iron-orange mx-auto mb-4" size={40} />
          <h3 className="text-iron-white font-heading text-lg mb-2">ANALYZING YOUR MEAL</h3>
          <p className="text-iron-gray text-sm mb-2">
            Searching database and web for: "{originalDescription}"
          </p>
          <div className="text-iron-gray text-xs">
            This may take a few seconds...
          </div>
        </div>
      )}

      {/* Confirmation State */}
      {entryState === 'confirmation' && parsedMeal && (
        <MealConfirmation
          parsedMeal={parsedMeal}
          originalDescription={originalDescription}
          warnings={warnings}
          onConfirm={handleConfirm}
          onReject={handleReject}
          onEdit={handleEdit}
        />
      )}

      {/* Error State */}
      {entryState === 'error' && (
        <div className="text-center py-12">
          <AlertCircle className="text-red-400 mx-auto mb-4" size={40} />
          <h3 className="text-red-400 font-heading text-lg mb-2">PARSING FAILED</h3>
          <p className="text-iron-gray text-sm mb-4">
            {error}
          </p>
          <div className="space-y-2">
            <button
              onClick={handleTryAgain}
              className="bg-iron-orange text-iron-black font-heading py-2 px-6 uppercase tracking-wider hover:bg-orange-600 transition-colors"
            >
              Try Again
            </button>
            <p className="text-iron-gray text-xs">
              Or try the manual meal builder instead
            </p>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-6 pt-4 border-t border-iron-gray/30">
        <div className="text-iron-gray text-xs space-y-1">
          <p>💡 <strong>How it works:</strong> I first search our database of 750+ foods</p>
          <p>🌐 <strong>Not found?</strong> I'll search the web and add new foods to your database</p>
          <p>✅ <strong>Always confirm:</strong> Verify nutrition before logging</p>
        </div>
      </div>
    </div>
  );
}