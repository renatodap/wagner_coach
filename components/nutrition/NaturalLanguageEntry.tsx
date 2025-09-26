'use client';

import React, { useState } from 'react';
import { Brain, Loader, AlertCircle, Check } from 'lucide-react';
import { Food } from '@/types/nutrition-v2';

interface NaturalLanguageEntryProps {
  onSubmit: (mealData: any) => void;
  onCancel?: () => void;
}

export function NaturalLanguageEntry({ onSubmit, onCancel }: NaturalLanguageEntryProps) {
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedMeal, setParsedMeal] = useState<any>(null);
  const [selectedFoods, setSelectedFoods] = useState<{food: Food, quantity: number}[]>([]);

  const handleParse = async () => {
    if (!description.trim()) return;

    setIsProcessing(true);
    setError(null);
    setParsedMeal(null);
    setSelectedFoods([]);

    try {
      const response = await fetch('/api/nutrition/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to parse meal');
      }

      if (result.parsed && result.parsed.foods) {
        setParsedMeal(result.parsed);

        // Convert parsed foods to selected foods format
        if (result.parsed.foods && result.parsed.foods.length > 0) {
          // Handle foods that might be ParsedFoodItem objects or have nested food objects
          const convertedFoods = result.parsed.foods.map((item: any) => {
            let food: Food;
            let quantity: number;

            if (item.foodId) {
              // This is a ParsedFoodItem with a foodId - need to get the full food object
              food = {
                id: item.foodId,
                name: item.name,
                brand: item.brand,
                serving_size: 1,
                serving_unit: item.unit || 'serving',
                calories: item.nutrition?.calories || 0,
                protein_g: item.nutrition?.protein_g || 0,
                carbs_g: item.nutrition?.carbs_g || 0,
                fat_g: item.nutrition?.fat_g || 0,
                fiber_g: item.nutrition?.fiber_g || 0,
                created_at: '',
                created_by: '',
                is_public: true,
                is_verified: true
              };
              quantity = item.quantity || 1;
            } else if (item.food) {
              // This has a nested food object
              food = item.food;
              quantity = item.quantity || 1;
            } else {
              // Fallback - create a food object from the item
              food = {
                id: item.id || `temp-${Date.now()}`,
                name: item.name,
                brand: item.brand,
                serving_size: 1,
                serving_unit: item.unit || 'serving',
                calories: item.calories || item.nutrition?.calories || 0,
                protein_g: item.protein_g || item.nutrition?.protein_g || 0,
                carbs_g: item.carbs_g || item.nutrition?.carbs_g || 0,
                fat_g: item.fat_g || item.nutrition?.fat_g || 0,
                fiber_g: item.fiber_g || item.nutrition?.fiber_g || 0,
                created_at: '',
                created_by: '',
                is_public: true,
                is_verified: true
              };
              quantity = item.quantity || 1;
            }

            return { food, quantity };
          });

          setSelectedFoods(convertedFoods);
        }
      } else {
        setError('Could not understand your meal description. Please try again with simpler terms.');
      }
    } catch (error) {
      console.error('Parse error:', error);
      setError(error instanceof Error ? error.message : 'Failed to parse meal');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuantityChange = (foodId: string, quantity: number) => {
    setSelectedFoods(selectedFoods.map(item =>
      item.food.id === foodId ? { ...item, quantity } : item
    ));
  };

  const handleRemoveFood = (foodId: string) => {
    setSelectedFoods(selectedFoods.filter(item => item.food.id !== foodId));
  };

  const handleSubmit = () => {
    if (!parsedMeal || selectedFoods.length === 0) {
      setError('Please parse a meal description first');
      return;
    }

    const mealData = {
      name: parsedMeal.name || `Meal: ${description.substring(0, 50)}`,
      category: parsedMeal.category || 'other',
      logged_at: new Date().toISOString(),
      notes: `Natural language: "${description}"`,
      foods: selectedFoods.map(item => ({
        food_id: item.food.id,
        quantity: item.quantity,
        unit: item.food.serving_unit || 'serving'
      }))
    };

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
        <Brain className="text-iron-orange" size={24} />
        <h2 className="font-heading text-2xl text-iron-orange">NATURAL LANGUAGE ENTRY</h2>
      </div>

      <p className="text-iron-gray text-sm mb-6">
        Describe your meal naturally and AI will parse it into foods with proper portions
      </p>

      {/* Description Input */}
      <div className="space-y-4">
        <div>
          <label className="block text-iron-gray text-xs uppercase mb-2">
            Describe your meal
          </label>
          <div className="flex gap-2">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., I had a grilled chicken breast (6oz) with 1 cup of brown rice and steamed broccoli"
              className="flex-1 bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
              rows={3}
              disabled={isProcessing}
            />
            <button
              onClick={handleParse}
              disabled={!description.trim() || isProcessing}
              className="px-4 py-2 bg-iron-orange text-iron-black font-heading uppercase tracking-wider hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader className="animate-spin" size={16} />
                  Parsing...
                </>
              ) : (
                <>
                  <Brain size={16} />
                  Parse with AI
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-start gap-2 p-4 bg-red-900/20 border border-red-400 text-red-300">
            <AlertCircle size={20} className="mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Parsed Results */}
        {parsedMeal && selectedFoods.length > 0 && (
          <div className="border border-iron-orange p-4">
            <div className="flex items-center gap-2 mb-3">
              <Check className="text-green-400" size={20} />
              <h3 className="text-iron-orange font-heading">PARSED MEAL</h3>
            </div>

            {/* Meal Info */}
            {parsedMeal.name && (
              <div className="mb-3 text-iron-white">
                <span className="text-iron-gray text-xs">MEAL NAME: </span>
                {parsedMeal.name}
              </div>
            )}

            {/* Foods List */}
            <div className="space-y-2">
              {selectedFoods.map(item => (
                <div key={item.food.id} className="flex items-center justify-between p-2 bg-iron-black border border-iron-gray">
                  <div className="flex-1">
                    <div className="text-iron-white">
                      {item.food.name}
                      {item.food.brand && <span className="text-iron-gray text-sm ml-1">({item.food.brand})</span>}
                    </div>
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

            {/* Unknown Foods Warning */}
            {parsedMeal.unknownFoods && parsedMeal.unknownFoods.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-600 text-yellow-300">
                <p className="text-sm font-medium mb-1">Some foods couldn't be found:</p>
                <ul className="text-xs list-disc list-inside">
                  {parsedMeal.unknownFoods.map((food: string, index: number) => (
                    <li key={index}>{food}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handleSubmit}
            disabled={!parsedMeal || selectedFoods.length === 0}
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
            <p>🧠 <strong>AI-Powered:</strong> Understands natural language descriptions</p>
            <p>📊 <strong>Smart Matching:</strong> Finds best matches from your food database</p>
            <p>⚡ <strong>Portions:</strong> Extracts quantities and serving sizes automatically</p>
          </div>
        </div>
      </div>
    </div>
  );
}