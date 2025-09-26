'use client';

import React, { useState } from 'react';
import { Zap, Search, AlertTriangle } from 'lucide-react';
import { FoodSearch } from './FoodSearch';
import { Food } from '@/types/nutrition-v2';

interface SafeQuickEntryProps {
  onSubmit: (mealData: any) => void;
  onCancel?: () => void;
}

export function SafeQuickEntry({ onSubmit, onCancel }: SafeQuickEntryProps) {
  const [description, setDescription] = useState('');
  const [suggestedFoods, setSuggestedFoods] = useState<Food[]>([]);
  const [selectedFoods, setSelectedFoods] = useState<{food: Food, quantity: number}[]>([]);
  const [showingSuggestions, setShowingSuggestions] = useState(false);

  // Extract likely food items from description using simple pattern matching
  const extractFoodKeywords = (desc: string): string[] => {
    const text = desc.toLowerCase();
    const commonFoods = [
      'chicken', 'beef', 'pork', 'salmon', 'tuna', 'egg', 'eggs',
      'rice', 'bread', 'pasta', 'oats', 'quinoa', 'potato',
      'apple', 'banana', 'orange', 'berries', 'avocado',
      'broccoli', 'spinach', 'carrots', 'tomato',
      'cheese', 'milk', 'yogurt', 'protein', 'shake'
    ];

    return commonFoods.filter(food =>
      text.includes(food) || text.includes(food + 's')
    );
  };

  const handleGetSuggestions = async () => {
    if (!description.trim()) return;

    setShowingSuggestions(true);

    // Extract keywords from description
    const keywords = extractFoodKeywords(description);

    if (keywords.length === 0) {
      setSuggestedFoods([]);
      return;
    }

    // Search for each keyword in database
    try {
      const allSuggestions: Food[] = [];

      for (const keyword of keywords) {
        try {
          const response = await fetch(`/api/nutrition/foods/search?q=${encodeURIComponent(keyword)}&limit=3`);
          if (response.ok) {
            const data = await response.json();
            allSuggestions.push(...(data.foods || []));
          } else {
            console.error('Food search failed:', response.status, response.statusText);
          }
        } catch (err) {
          console.error('Error searching for keyword:', keyword, err);
        }
      }

      // Remove duplicates and limit to top suggestions
      const uniqueFoods = allSuggestions.filter((food, index, self) =>
        index === self.findIndex(f => f.id === food.id)
      ).slice(0, 8);

      setSuggestedFoods(uniqueFoods);
    } catch (error) {
      console.error('Error searching foods:', error);
      setSuggestedFoods([]);
    }
  };

  const handleAddFood = (food: Food) => {
    if (selectedFoods.some(item => item.food.id === food.id)) return;

    setSelectedFoods([...selectedFoods, {
      food,
      quantity: food.serving_size || 1
    }]);
  };

  const handleRemoveFood = (foodId: string) => {
    setSelectedFoods(selectedFoods.filter(item => item.food.id !== foodId));
  };

  const handleQuantityChange = (foodId: string, quantity: number) => {
    setSelectedFoods(selectedFoods.map(item =>
      item.food.id === foodId ? { ...item, quantity } : item
    ));
  };

  const handleSubmit = () => {
    if (selectedFoods.length === 0) {
      alert('Please add at least one food item');
      return;
    }

    const mealData = {
      name: `Quick meal: ${description.substring(0, 50)}`,
      category: 'other',
      logged_at: new Date().toISOString(),
      notes: `Quick entry: "${description}"`,
      foods: selectedFoods.map(item => ({
        food_id: item.food.id,
        quantity: item.quantity,
        unit: item.food.serving_unit || 'serving'
      }))
    };

    console.log('Submitting meal from SafeQuickEntry:', mealData);
    onSubmit(mealData);
  };

  const calculateTotals = () => {
    return selectedFoods.reduce((acc, item) => {
      const multiplier = item.quantity / (item.food.serving_size || 1);
      return {
        calories: acc.calories + (item.food.calories || 0) * multiplier,
        protein: acc.protein + (item.food.protein_g || 0) * multiplier,
        carbs: acc.carbs + (item.food.carbs_g || 0) * multiplier,
        fat: acc.fat + (item.food.fat_g || 0) * multiplier
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const totals = calculateTotals();

  return (
    <div className="border border-iron-gray p-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="text-iron-orange" size={24} />
        <h2 className="font-heading text-2xl text-iron-orange">SMART QUICK ENTRY</h2>
      </div>

      <p className="text-iron-gray text-sm mb-6">
        Describe your meal and I'll suggest foods from our database (no AI guessing!)
      </p>

      {/* Description Input */}
      <div className="space-y-4">
        <div>
          <label className="block text-iron-gray text-xs uppercase mb-2">
            What did you eat?
          </label>
          <div className="flex gap-2">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., grilled chicken breast with rice and broccoli, scrambled eggs with toast, protein shake with banana"
              className="flex-1 bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
              rows={2}
            />
            <button
              onClick={handleGetSuggestions}
              disabled={!description.trim()}
              className="px-4 py-2 bg-iron-orange text-iron-black font-heading uppercase tracking-wider hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Search size={16} />
              Find Foods
            </button>
          </div>
        </div>

        {/* Suggested Foods */}
        {showingSuggestions && (
          <div className="border border-iron-gray p-4">
            <h3 className="text-iron-orange font-heading mb-3">SUGGESTED FOODS FROM DATABASE</h3>

            {suggestedFoods.length === 0 ? (
              <div className="text-center py-4">
                <AlertTriangle className="text-yellow-400 mx-auto mb-2" size={32} />
                <p className="text-iron-gray">
                  No matching foods found in database. Try different keywords or use the manual food builder.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {suggestedFoods.map(food => (
                  <button
                    key={food.id}
                    onClick={() => handleAddFood(food)}
                    disabled={selectedFoods.some(item => item.food.id === food.id)}
                    className="p-3 border border-iron-gray hover:border-iron-orange transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="text-iron-white font-medium">
                      {food.name}
                      {food.brand && <span className="text-iron-gray text-sm ml-1">({food.brand})</span>}
                    </div>
                    <div className="text-iron-gray text-xs">
                      {food.calories} cal per {food.serving_size}{food.serving_unit}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selected Foods */}
        {selectedFoods.length > 0 && (
          <div className="border border-iron-orange p-4">
            <h3 className="text-iron-orange font-heading mb-3">SELECTED FOODS</h3>
            <div className="space-y-2">
              {selectedFoods.map(item => (
                <div key={item.food.id} className="flex items-center justify-between p-2 bg-iron-black border border-iron-gray">
                  <div className="flex-1">
                    <div className="text-iron-white">{item.food.name}</div>
                    <div className="text-iron-gray text-sm">
                      {item.food.calories} cal per {item.food.serving_size}{item.food.serving_unit}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.food.id, parseFloat(e.target.value) || 0)}
                      className="w-16 bg-iron-black border border-iron-gray px-2 py-1 text-iron-white text-sm text-center"
                      min="0"
                      step="0.1"
                    />
                    <span className="text-iron-gray text-sm">{item.food.serving_unit}</span>
                    <button
                      onClick={() => handleRemoveFood(item.food.id)}
                      className="text-red-400 hover:text-red-300 text-sm px-2"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 pt-4 border-t border-iron-gray">
              <div className="font-heading text-iron-orange mb-2">MEAL TOTALS</div>
              <div className="grid grid-cols-4 gap-3 text-sm">
                <div>
                  <div className="text-iron-gray text-xs">Calories</div>
                  <div className="text-iron-white font-bold">{Math.round(totals.calories)}</div>
                </div>
                <div>
                  <div className="text-iron-gray text-xs">Protein</div>
                  <div className="text-iron-white font-bold">{Math.round(totals.protein)}g</div>
                </div>
                <div>
                  <div className="text-iron-gray text-xs">Carbs</div>
                  <div className="text-iron-white font-bold">{Math.round(totals.carbs)}g</div>
                </div>
                <div>
                  <div className="text-iron-gray text-xs">Fat</div>
                  <div className="text-iron-white font-bold">{Math.round(totals.fat)}g</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handleSubmit}
            disabled={selectedFoods.length === 0}
            className="flex-1 bg-iron-orange text-iron-black font-heading py-3 uppercase tracking-wider hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Log Meal ({selectedFoods.length} foods)
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 border border-iron-gray text-iron-white font-heading py-3 uppercase tracking-wider hover:bg-iron-gray/20 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Info */}
        <div className="text-center">
          <div className="text-iron-gray text-xs space-y-1">
            <p>✅ <strong>Safe:</strong> Only uses foods from your verified database</p>
            <p>🎯 <strong>Accurate:</strong> No AI guessing - real nutrition data only</p>
            <p>⚡ <strong>Fast:</strong> No external API calls or delays</p>
          </div>
        </div>
      </div>
    </div>
  );
}