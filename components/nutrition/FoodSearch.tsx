'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 384, openUpward: false });
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  // Component mounted check (for portal)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update dropdown position when it opens or window resizes
  useEffect(() => {
    if (showResults && inputRef.current) {
      updateDropdownPosition();
    }

    const handleResize = () => {
      if (showResults && inputRef.current) {
        updateDropdownPosition();
      }
    };

    const handleScroll = () => {
      if (showResults && inputRef.current) {
        updateDropdownPosition();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [showResults]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        // Check if click is not on the dropdown portal
        const dropdownElement = document.getElementById('food-search-dropdown');
        if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
          setShowResults(false);
        }
      }
    };

    if (showResults) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showResults]);

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

  const updateDropdownPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownMaxHeight = 384; // 96 * 4 (max-h-96 in Tailwind)
      const padding = 16; // Extra padding for safety

      // Decide if we should open upward or downward
      const shouldOpenUpward = spaceBelow < dropdownMaxHeight + padding && spaceAbove > spaceBelow;

      // Calculate actual max height based on available space
      const availableSpace = shouldOpenUpward ? spaceAbove : spaceBelow;
      const calculatedMaxHeight = Math.min(dropdownMaxHeight, availableSpace - padding);

      setDropdownPosition({
        top: shouldOpenUpward ? rect.top + window.scrollY : rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        maxHeight: Math.max(200, calculatedMaxHeight), // Minimum 200px
        openUpward: shouldOpenUpward,
      });
    }
  };

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
    if (food.calories) parts.push(`${Math.round(food.calories)} cal`);
    if (food.protein_g) parts.push(`${food.protein_g.toFixed(1)}g protein`);
    if (food.total_carbs_g) parts.push(`${food.total_carbs_g.toFixed(1)}g carbs`);
    if (food.total_fat_g) parts.push(`${food.total_fat_g.toFixed(1)}g fat`);
    return parts.join(' • ');
  };

  const getFoodTypeBadge = (food: Food) => {
    const typeColors = {
      'ingredient': 'bg-green-500/20 text-green-400',
      'dish': 'bg-blue-500/20 text-blue-400',
      'branded': 'bg-purple-500/20 text-purple-400',
      'restaurant': 'bg-orange-500/20 text-orange-400'
    };
    const color = typeColors[food.food_type] || 'bg-gray-500/20 text-gray-400';
    return food.food_type ? (
      <span className={`text-xs px-2 py-0.5 rounded ${color}`}>
        {food.food_type}
      </span>
    ) : null;
  };

  const dropdownContent = showResults && mounted && (
    <div
      id="food-search-dropdown"
      style={{
        position: 'fixed',
        top: dropdownPosition.openUpward ? 'auto' : `${dropdownPosition.top}px`,
        bottom: dropdownPosition.openUpward ? `${window.innerHeight - dropdownPosition.top}px` : 'auto',
        left: `${dropdownPosition.left}px`,
        width: `${dropdownPosition.width}px`,
        maxHeight: `${dropdownPosition.maxHeight}px`,
        zIndex: 9999,
      }}
      className={`bg-iron-black border border-iron-gray overflow-y-auto shadow-2xl ${dropdownPosition.openUpward ? 'mb-1' : 'mt-1'}`}
    >
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
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-iron-white group-hover:text-iron-orange transition-colors">
                      {food.name}
                      {food.brand_name && (
                        <span className="text-iron-gray text-sm ml-2">
                          ({food.brand_name})
                        </span>
                      )}
                    </div>
                    {getFoodTypeBadge(food)}
                  </div>
                  <div className="text-xs text-iron-gray mt-1">
                    {food.household_serving_unit 
                      ? `${food.household_serving_grams}g per ${food.household_serving_unit}`
                      : `${food.serving_size}${food.serving_unit}`}
                  </div>
                  <div className="text-xs text-iron-gray mt-1">
                    {formatNutrition(food)}
                  </div>
                  {food.allergens && food.allergens.length > 0 && (
                    <div className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      ⚠️ {food.allergens.join(', ')}
                    </div>
                  )}
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
  );

  return (
    <>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-iron-gray" size={20} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          placeholder={placeholder}
          className="w-full bg-iron-black border border-iron-gray pl-10 pr-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
        />
      </div>

      {mounted && typeof window !== 'undefined' && createPortal(
        dropdownContent,
        document.body
      )}
    </>
  );
}