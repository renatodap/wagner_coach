'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus } from 'lucide-react';
import { Food } from '@/types/nutrition-v2';

interface FoodSearchProps {
  onSelectFood: (food: Food) => void;
  placeholder?: string;
}

export function FoodSearch({ onSelectFood, placeholder = "Search foods..." }: FoodSearchProps) {
  const [query, setQuery] = useState('');
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

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
      const response = await fetch('/api/nutrition/foods/search?limit=10');
      if (response.ok) {
        const data = await response.json();
        setFoods(data.foods || []);
      }
    } catch (error) {
      console.error('Error loading foods:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchFoods = async (searchQuery: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/nutrition/foods/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setFoods(data.foods || []);
      }
    } catch (error) {
      console.error('Error searching foods:', error);
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
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-iron-gray w-5 h-5" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => {
            setShowResults(true);
            if (foods.length === 0 && query.length === 0) {
              loadPopularFoods();
            }
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 bg-iron-black border border-iron-gray text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
        />
      </div>

      {/* Search Results */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-iron-black border border-iron-gray max-h-96 overflow-y-auto z-50">
          {loading ? (
            <div className="p-4 text-center text-iron-gray">
              Searching...
            </div>
          ) : foods.length === 0 ? (
            <div className="p-4 text-center">
              {query.length >= 2 ? (
                <div>
                  <p className="text-iron-gray mb-3">No foods found</p>
                  <a
                    href="/nutrition/foods/create"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-iron-orange hover:text-orange-600 text-sm"
                  >
                    Create custom food →
                  </a>
                </div>
              ) : (
                <p className="text-iron-gray">Start typing to search</p>
              )}
            </div>
          ) : (
            <>
              {query.length === 0 && (
                <div className="px-4 py-2 text-iron-gray text-xs uppercase border-b border-iron-gray">
                  Popular Foods
                </div>
              )}
              {foods.map((food) => (
                <button
                  key={food.id}
                  onClick={() => handleSelectFood(food)}
                  className="w-full px-4 py-3 hover:bg-iron-gray/20 transition-colors text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-iron-white font-medium">
                        {food.name}
                        {food.brand && (
                          <span className="text-iron-gray text-sm ml-2">
                            {food.brand}
                          </span>
                        )}
                      </div>
                      <div className="text-iron-gray text-sm">
                        {food.serving_size} {food.serving_unit}
                        {food.serving_description && ` (${food.serving_description})`}
                      </div>
                      <div className="text-iron-gray text-xs mt-1">
                        {formatNutrition(food)}
                      </div>
                    </div>
                    <Plus className="w-5 h-5 text-iron-gray group-hover:text-iron-orange transition-colors" />
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {showResults && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
}