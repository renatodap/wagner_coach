'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { Food } from '@/types/nutrition-v2';
import { FoodService } from '@/lib/nutrition/food-service';

interface FoodSearchProps {
  onSelectFood: (food: Food) => void;
  placeholder?: string;
}

export function FoodSearch({ onSelectFood, placeholder = "Search foods..." }: FoodSearchProps) {
  const [query, setQuery] = useState('');
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [foodService] = useState(() => new FoodService());

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        searchFoods(query);
      } else if (query.length === 0) {
        loadPopularFoods();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const loadPopularFoods = async () => {
    setLoading(true);
    try {
      const results = await foodService.searchFoods(undefined, 10);
      setFoods(results);
    } catch (error) {
      console.error('Error loading foods:', error);
      setFoods([]);
    } finally {
      setLoading(false);
    }
  };

  const searchFoods = async (searchQuery: string) => {
    setLoading(true);
    try {
      const results = await foodService.searchFoods(searchQuery, 20);
      setFoods(results);
    } catch (error) {
      console.error('Error searching foods:', error);
      setFoods([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFood = (food: Food) => {
    onSelectFood(food);
    setQuery('');
    setShowResults(false);
  };

  const formatNutrition = (food: Food) => {
    const parts = [];
    if (food.calories) parts.push(`${food.calories} cal`);
    if (food.protein_g) parts.push(`${food.protein_g}g protein`);
    if (food.carbs_g) parts.push(`${food.carbs_g}g carbs`);
    if (food.fat_g) parts.push(`${food.fat_g}g fat`);
    return parts.join(' • ');
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-iron-gray" size={20} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          placeholder={placeholder}
          className="w-full bg-iron-black border border-iron-gray pl-10 pr-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
        />
      </div>

      {showResults && (
        <div className="absolute z-50 w-full mt-1 bg-iron-black border border-iron-gray max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-iron-gray">
              Searching foods...
            </div>
          ) : foods.length > 0 ? (
            <div className="divide-y divide-iron-gray/30">
              {foods.map((food) => (
                <button
                  key={food.id}
                  onClick={() => handleSelectFood(food)}
                  className="w-full p-4 hover:bg-iron-gray/10 transition-colors text-left group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-iron-white group-hover:text-iron-orange transition-colors">
                        {food.name}
                        {food.brand && (
                          <span className="text-iron-gray text-sm ml-2">
                            ({food.brand})
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-iron-gray mt-1">
                        {food.serving_description || `${food.serving_size} ${food.serving_unit}`}
                      </div>
                      <div className="text-xs text-iron-gray mt-1">
                        {formatNutrition(food)}
                      </div>
                    </div>
                    <Plus className="text-iron-gray group-hover:text-iron-orange transition-colors ml-2" size={20} />
                  </div>
                </button>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-4 text-center text-iron-gray">
              No foods found. Try a different search term.
            </div>
          ) : (
            <div className="p-4 text-center text-iron-gray">
              Start typing to search foods
            </div>
          )}
        </div>
      )}
    </div>
  );
}