'use client';

import React, { useState } from 'react';

interface MealLogFormProps {
  onSubmit?: (mealData: any) => void;
  onCancel?: () => void;
}

export function MealLogForm({ onSubmit, onCancel }: MealLogFormProps) {
  const [mealData, setMealData] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: '',
    meal_type: 'breakfast',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(mealData);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setMealData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="border border-iron-gray p-6">
      <h2 className="font-heading text-2xl text-iron-orange mb-2">LOG A MEAL</h2>
      <p className="text-iron-gray text-sm mb-6">Add nutritional information for your meal</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="block text-iron-gray text-xs uppercase">
            Meal Name *
          </label>
          <input
            id="name"
            type="text"
            value={mealData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
            placeholder="Enter meal name"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="meal_type" className="block text-iron-gray text-xs uppercase">
            Meal Type *
          </label>
          <select
            id="meal_type"
            value={mealData.meal_type}
            onChange={(e) => handleInputChange('meal_type', e.target.value)}
            className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
          >
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="calories" className="block text-iron-gray text-xs uppercase">
              Calories
            </label>
            <input
              id="calories"
              type="number"
              value={mealData.calories}
              onChange={(e) => handleInputChange('calories', e.target.value)}
              className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="protein" className="block text-iron-gray text-xs uppercase">
              Protein (g)
            </label>
            <input
              id="protein"
              type="number"
              value={mealData.protein}
              onChange={(e) => handleInputChange('protein', e.target.value)}
              className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
              placeholder="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="carbs" className="block text-iron-gray text-xs uppercase">
              Carbs (g)
            </label>
            <input
              id="carbs"
              type="number"
              value={mealData.carbs}
              onChange={(e) => handleInputChange('carbs', e.target.value)}
              className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="fat" className="block text-iron-gray text-xs uppercase">
              Fat (g)
            </label>
            <input
              id="fat"
              type="number"
              value={mealData.fat}
              onChange={(e) => handleInputChange('fat', e.target.value)}
              className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
              placeholder="0"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="fiber" className="block text-iron-gray text-xs uppercase">
            Fiber (g)
          </label>
          <input
            id="fiber"
            type="number"
            value={mealData.fiber}
            onChange={(e) => handleInputChange('fiber', e.target.value)}
            className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="notes" className="block text-iron-gray text-xs uppercase">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            value={mealData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={3}
            className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors min-h-[80px]"
            placeholder="Add any notes about your meal..."
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            className="flex-1 bg-iron-orange text-iron-black font-heading py-3 uppercase tracking-wider hover:bg-orange-600 transition-colors"
          >
            Log Meal
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
    </div>
  );
}