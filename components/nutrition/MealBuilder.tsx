'use client';

import React, { useState } from 'react';
import { FoodSearch } from './FoodSearch';
import { Food, FoodUnit, MealCategory } from '@/types/nutrition-v2';
import { Trash2, Edit2, Plus } from 'lucide-react';

interface MealFood {
  food: Food;
  quantity: number;
  unit: FoodUnit;
  tempId: string;
}

interface MealBuilderProps {
  onSubmit: (meal: {
    name?: string;
    category: MealCategory;
    logged_at: string;
    notes?: string;
    foods: {
      food_id: string;
      quantity: number;
      unit: FoodUnit;
    }[];
  }) => void;
  onCancel?: () => void;
  initialDate?: Date;
}

export function MealBuilder({ onSubmit, onCancel, initialDate = new Date() }: MealBuilderProps) {
  const [mealName, setMealName] = useState('');
  const [category, setCategory] = useState<MealCategory>('other');
  const [loggedAt, setLoggedAt] = useState(initialDate);
  const [notes, setNotes] = useState('');
  const [foods, setFoods] = useState<MealFood[]>([]);
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [editingFood, setEditingFood] = useState<string | null>(null);

  // Calculate totals
  const totals = foods.reduce((acc, item) => {
    const multiplier = calculateMultiplier(item.quantity, item.unit, item.food.serving_size, item.food.serving_unit);
    return {
      calories: acc.calories + (item.food.calories || 0) * multiplier,
      protein: acc.protein + (item.food.protein_g || 0) * multiplier,
      carbs: acc.carbs + (item.food.carbs_g || 0) * multiplier,
      fat: acc.fat + (item.food.fat_g || 0) * multiplier,
      fiber: acc.fiber + (item.food.fiber_g || 0) * multiplier,
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

  function calculateMultiplier(quantity: number, unit: FoodUnit, servingSize: number, servingUnit: FoodUnit): number {
    // Simplified - in production you'd have proper unit conversion
    if (unit === servingUnit) {
      return quantity / servingSize;
    }
    // Add more conversion logic as needed
    return quantity / servingSize;
  }

  const handleAddFood = (food: Food) => {
    const newFood: MealFood = {
      food,
      quantity: food.serving_size,
      unit: food.serving_unit,
      tempId: Date.now().toString()
    };
    setFoods([...foods, newFood]);
    setShowFoodSearch(false);
  };

  const handleUpdateQuantity = (tempId: string, quantity: number, unit: FoodUnit) => {
    setFoods(foods.map(f =>
      f.tempId === tempId ? { ...f, quantity, unit } : f
    ));
    setEditingFood(null);
  };

  const handleRemoveFood = (tempId: string) => {
    setFoods(foods.filter(f => f.tempId !== tempId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (foods.length === 0) {
      alert('Please add at least one food to your meal');
      return;
    }

    onSubmit({
      name: mealName || undefined,
      category,
      logged_at: loggedAt.toISOString(),
      notes: notes || undefined,
      foods: foods.map(f => ({
        food_id: f.food.id,
        quantity: f.quantity,
        unit: f.unit
      }))
    });
  };

  const formatDateTime = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Meal Info */}
      <div className="space-y-4">
        <div>
          <label className="block text-iron-gray text-xs uppercase mb-2">
            Meal Name (Optional)
          </label>
          <input
            type="text"
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            placeholder="e.g., Post-workout lunch"
            className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-iron-gray text-xs uppercase mb-2">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as MealCategory)}
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

          <div>
            <label className="block text-iron-gray text-xs uppercase mb-2">
              Date & Time *
            </label>
            <input
              type="datetime-local"
              value={formatDateTime(loggedAt)}
              onChange={(e) => setLoggedAt(new Date(e.target.value))}
              className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Foods Section */}
      <div className="border border-iron-gray p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-iron-orange font-heading text-lg">FOODS</h3>
          <button
            type="button"
            onClick={() => setShowFoodSearch(true)}
            className="bg-iron-orange text-iron-black px-4 py-2 font-heading text-sm uppercase tracking-wider hover:bg-orange-600 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Food
          </button>
        </div>

        {/* Food Search */}
        {showFoodSearch && (
          <div className="mb-4">
            <FoodSearch onSelectFood={handleAddFood} />
            <button
              type="button"
              onClick={() => setShowFoodSearch(false)}
              className="mt-2 text-iron-gray text-sm hover:text-iron-white"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Foods List */}
        {foods.length === 0 ? (
          <div className="text-center py-8 text-iron-gray">
            No foods added yet. Click "Add Food" to search and add foods to your meal.
          </div>
        ) : (
          <div className="space-y-3">
            {foods.map((item) => (
              <div key={item.tempId} className="border border-iron-gray/50 p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-iron-white font-medium">
                      {item.food.name}
                      {item.food.brand && (
                        <span className="text-iron-gray text-sm ml-2">
                          {item.food.brand}
                        </span>
                      )}
                    </div>

                    {/* Quantity Editor */}
                    {editingFood === item.tempId ? (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const newQuantity = parseFloat(e.target.value) || 0;
                            handleUpdateQuantity(item.tempId, newQuantity, item.unit);
                          }}
                          className="w-20 bg-iron-black border border-iron-orange px-2 py-1 text-iron-white text-sm"
                          step="0.1"
                          min="0"
                        />
                        <select
                          value={item.unit}
                          onChange={(e) => handleUpdateQuantity(item.tempId, item.quantity, e.target.value as FoodUnit)}
                          className="bg-iron-black border border-iron-orange px-2 py-1 text-iron-white text-sm"
                        >
                          <option value="g">g</option>
                          <option value="ml">ml</option>
                          <option value="oz">oz</option>
                          <option value="cup">cup</option>
                          <option value="tbsp">tbsp</option>
                          <option value="tsp">tsp</option>
                          <option value="serving">serving</option>
                          <option value="piece">piece</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => setEditingFood(null)}
                          className="text-iron-orange text-sm"
                        >
                          Done
                        </button>
                      </div>
                    ) : (
                      <div className="text-iron-gray text-sm mt-1">
                        {item.quantity} {item.unit}
                        <button
                          type="button"
                          onClick={() => setEditingFood(item.tempId)}
                          className="ml-2 text-iron-gray hover:text-iron-orange"
                        >
                          <Edit2 className="w-3 h-3 inline" />
                        </button>
                      </div>
                    )}

                    {/* Nutrition for this quantity */}
                    <div className="text-iron-gray text-xs mt-1">
                      {(() => {
                        const mult = calculateMultiplier(item.quantity, item.unit, item.food.serving_size, item.food.serving_unit);
                        return [
                          item.food.calories && `${Math.round((item.food.calories || 0) * mult)} cal`,
                          item.food.protein_g && `${Math.round((item.food.protein_g || 0) * mult)}g protein`,
                          item.food.carbs_g && `${Math.round((item.food.carbs_g || 0) * mult)}g carbs`,
                          item.food.fat_g && `${Math.round((item.food.fat_g || 0) * mult)}g fat`,
                        ].filter(Boolean).join(' • ');
                      })()}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveFood(item.tempId)}
                    className="text-iron-gray hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Totals */}
        {foods.length > 0 && (
          <div className="mt-4 pt-4 border-t border-iron-gray">
            <div className="font-heading text-iron-orange mb-2">TOTALS</div>
            <div className="grid grid-cols-5 gap-2 text-sm">
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
              <div>
                <div className="text-iron-gray text-xs">Fiber</div>
                <div className="text-iron-white font-bold">{Math.round(totals.fiber)}g</div>
              </div>
            </div>
          </div>
        )}
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

      {/* Actions */}
      <div className="flex gap-4">
        <button
          type="submit"
          className="flex-1 bg-iron-orange text-iron-black font-heading py-3 uppercase tracking-wider hover:bg-orange-600 transition-colors"
        >
          Save Meal
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
  );
}