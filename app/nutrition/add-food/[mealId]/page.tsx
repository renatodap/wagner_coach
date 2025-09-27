'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Search } from 'lucide-react';
import BottomNavigation from '@/app/components/BottomNavigation';

interface Food {
  id: string;
  name: string;
  brand?: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  serving_size: number;
  unit: string;
}

export default function AddFoodToMealPage() {
  const router = useRouter();
  const params = useParams();
  const mealId = params.mealId as string;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [searching, setSearching] = useState(false);
  const [meal, setMeal] = useState<any>(null);

  useEffect(() => {
    fetchMeal();
  }, [mealId]);

  const fetchMeal = async () => {
    try {
      const response = await fetch(`/api/nutrition/meals/${mealId}`);
      if (!response.ok) throw new Error('Failed to fetch meal');
      const data = await response.json();
      setMeal(data.meal);
    } catch (err) {
      console.error('Error fetching meal:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await fetch(`/api/nutrition/foods/search?query=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Failed to search foods');

      const data = await response.json();
      setSearchResults(data.foods || []);
    } catch (error) {
      console.error('Error searching foods:', error);
      alert('Failed to search foods');
    } finally {
      setSearching(false);
    }
  };

  const handleAddFood = async () => {
    if (!selectedFood) return;

    setSaving(true);
    try {
      const foodToAdd = {
        food_id: selectedFood.id,
        food: selectedFood,
        quantity: parseFloat(quantity),
        unit: selectedFood.unit || 'g'
      };

      // Get the current meal data
      const response = await fetch(`/api/nutrition/meals/${mealId}`);
      if (!response.ok) throw new Error('Failed to fetch meal');

      const data = await response.json();
      const currentMeal = data.meal;

      // Add the new food to the foods array
      const updatedFoods = [...(currentMeal.foods || []), foodToAdd];

      // Recalculate totals
      const totals = updatedFoods.reduce(
        (acc, food) => {
          const foodData = food.food || food;
          const qty = food.quantity || 100;
          const multiplier = qty / (foodData.serving_size || 100);

          return {
            calories: acc.calories + (foodData.calories || 0) * multiplier,
            protein: acc.protein + (foodData.protein_g || 0) * multiplier,
            carbs: acc.carbs + (foodData.carbs_g || 0) * multiplier,
            fat: acc.fat + (foodData.fat_g || 0) * multiplier,
            fiber: acc.fiber + (foodData.fiber_g || 0) * multiplier,
          };
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
      );

      // Update the meal with new food and totals
      const updateResponse = await fetch(`/api/nutrition/meals/${mealId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...currentMeal,
          foods: updatedFoods,
          calories: Math.round(totals.calories),
          protein_g: totals.protein,
          carbs_g: totals.carbs,
          fat_g: totals.fat,
          fiber_g: totals.fiber,
        }),
      });

      if (!updateResponse.ok) throw new Error('Failed to update meal');

      router.push(`/nutrition/edit/${mealId}`);
    } catch (error) {
      console.error('Error adding food to meal:', error);
      alert('Failed to add food to meal');
      setSaving(false);
    }
  };

  const calculateNutrition = (food: Food, qty: string) => {
    const q = parseFloat(qty) || 100;
    const multiplier = q / (food.serving_size || 100);

    return {
      calories: Math.round((food.calories || 0) * multiplier),
      protein: ((food.protein_g || 0) * multiplier).toFixed(1),
      carbs: ((food.carbs_g || 0) * multiplier).toFixed(1),
      fat: ((food.fat_g || 0) * multiplier).toFixed(1),
      fiber: ((food.fiber_g || 0) * multiplier).toFixed(1),
    };
  };

  return (
    <div className="min-h-screen bg-iron-black text-iron-white">
      {/* Header */}
      <header className="border-b border-iron-gray">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href={`/nutrition/edit/${mealId}`}
              className="text-iron-gray hover:text-iron-orange transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="font-heading text-4xl text-iron-orange">ADD FOOD TO MEAL</h1>
          </div>
          {meal && (
            <p className="text-iron-gray mt-2">
              Adding to: {meal.meal_name || 'Meal'}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 pb-24">
        <div className="space-y-6">
          {/* Search */}
          <div className="border border-iron-gray p-6">
            <label className="block text-iron-gray text-xs uppercase mb-2">
              Search Foods
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
                placeholder="e.g., chicken breast, apple, rice"
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                className="bg-iron-orange text-iron-black px-6 py-3 font-heading uppercase tracking-wider hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="border border-iron-gray p-6">
              <label className="block text-iron-gray text-xs uppercase mb-4">
                Search Results
              </label>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {searchResults.map((food) => (
                  <div
                    key={food.id}
                    onClick={() => setSelectedFood(food)}
                    className={`border p-3 cursor-pointer transition-colors ${
                      selectedFood?.id === food.id
                        ? 'border-iron-orange bg-iron-orange/10'
                        : 'border-iron-gray hover:border-iron-orange/50'
                    }`}
                  >
                    <div className="font-medium">{food.name}</div>
                    {food.brand && (
                      <div className="text-sm text-iron-gray">{food.brand}</div>
                    )}
                    <div className="text-xs text-iron-gray mt-1">
                      Per {food.serving_size}g: {food.calories} cal • {food.protein_g}g protein •
                      {food.carbs_g}g carbs • {food.fat_g}g fat
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Food & Quantity */}
          {selectedFood && (
            <div className="border border-iron-gray p-6 space-y-4">
              <div>
                <label className="block text-iron-gray text-xs uppercase mb-2">
                  Selected Food
                </label>
                <div className="border border-iron-orange p-3 bg-iron-orange/10">
                  <div className="font-medium">{selectedFood.name}</div>
                  {selectedFood.brand && (
                    <div className="text-sm text-iron-gray">{selectedFood.brand}</div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-iron-gray text-xs uppercase mb-2">
                  Quantity (grams)
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
                  placeholder="100"
                  min="1"
                  step="1"
                />
              </div>

              <div>
                <label className="block text-iron-gray text-xs uppercase mb-2">
                  Nutrition for {quantity}g
                </label>
                <div className="grid grid-cols-5 gap-2 text-center">
                  {(() => {
                    const nutrition = calculateNutrition(selectedFood, quantity);
                    return (
                      <>
                        <div className="border border-iron-gray p-2">
                          <div className="text-xl font-bold">{nutrition.calories}</div>
                          <div className="text-xs text-iron-gray uppercase">Cal</div>
                        </div>
                        <div className="border border-iron-gray p-2">
                          <div className="text-xl font-bold">{nutrition.protein}</div>
                          <div className="text-xs text-iron-gray uppercase">Protein</div>
                        </div>
                        <div className="border border-iron-gray p-2">
                          <div className="text-xl font-bold">{nutrition.carbs}</div>
                          <div className="text-xs text-iron-gray uppercase">Carbs</div>
                        </div>
                        <div className="border border-iron-gray p-2">
                          <div className="text-xl font-bold">{nutrition.fat}</div>
                          <div className="text-xs text-iron-gray uppercase">Fat</div>
                        </div>
                        <div className="border border-iron-gray p-2">
                          <div className="text-xl font-bold">{nutrition.fiber}</div>
                          <div className="text-xs text-iron-gray uppercase">Fiber</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={handleAddFood}
              disabled={!selectedFood || !quantity || saving}
              className="flex-1 bg-iron-orange text-iron-black font-heading py-3 uppercase tracking-wider hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Food to Meal'}
            </button>
            <Link
              href={`/nutrition/edit/${mealId}`}
              className="flex-1 border border-iron-gray text-iron-white font-heading py-3 uppercase tracking-wider hover:bg-iron-gray/20 transition-colors text-center"
            >
              Cancel
            </Link>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}