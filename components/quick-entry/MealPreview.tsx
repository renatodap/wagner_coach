'use client';

import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Check, Edit3, AlertTriangle, X, Plus, Minus } from 'lucide-react';
import { MealPrimaryFields, MealSecondaryFields, QuickEntryPreviewResponse } from './types';

interface MealPreviewProps {
  data: QuickEntryPreviewResponse;
  onSave: (editedData: any) => void;
  onEdit: () => void;
}

interface FoodItem {
  name: string;
  quantity: string;
  servings?: number;  // Multiplier for scaling nutrition
  calories?: number;  // Base nutrition per original quantity
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
}

export default function MealPreview({ data, onSave, onEdit }: MealPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedFields, setEditedFields] = useState<any>(data.data.primary_fields);
  const [editingFoodIndex, setEditingFoodIndex] = useState<number | null>(null);
  const [editingFood, setEditingFood] = useState<FoodItem>({ name: '', quantity: '' });

  const primary = data.data.primary_fields as MealPrimaryFields;
  const secondary = data.data.secondary_fields as MealSecondaryFields;

  // Calculate totals from foods array with servings multiplier
  const calculatedTotals = useMemo(() => {
    const foods = editedFields.foods || [];

    const totals = {
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0
    };

    foods.forEach((food: any) => {
      // Only sum if food has nutrition data (object with calories)
      if (typeof food === 'object' && food.calories !== undefined) {
        const servings = food.servings || 1.0;  // Default to 1 serving
        totals.calories += (food.calories || 0) * servings;
        totals.protein_g += (food.protein_g || 0) * servings;
        totals.carbs_g += (food.carbs_g || 0) * servings;
        totals.fat_g += (food.fat_g || 0) * servings;
        totals.fiber_g += (food.fiber_g || 0) * servings;
      }
    });

    return totals;
  }, [editedFields.foods]);

  // Use calculated totals if foods have nutrition, otherwise fall back to primary fields
  const displayTotals = useMemo(() => {
    const hasFoodNutrition = editedFields.foods?.some((f: any) =>
      typeof f === 'object' && f.calories !== undefined
    );

    if (hasFoodNutrition) {
      return calculatedTotals;
    }

    // Fallback to original totals
    return {
      calories: primary.calories,
      protein_g: primary.protein_g,
      carbs_g: secondary.carbs_g,
      fat_g: primary.fat_g || secondary.fat_g,
      fiber_g: secondary.fiber_g
    };
  }, [calculatedTotals, primary, secondary, editedFields.foods]);

  const updateField = (field: string, value: any) => {
    setEditedFields({ ...editedFields, [field]: value });
  };

  const startEditingFood = (index: number) => {
    const food = editedFields.foods[index];
    setEditingFoodIndex(index);

    // Handle both string format (old) and object format (new with nutrition)
    if (typeof food === 'string') {
      setEditingFood({
        name: food,
        quantity: 'not specified',
        servings: 1.0
      });
    } else {
      setEditingFood({
        name: food.name || '',
        quantity: food.quantity || 'not specified',
        servings: food.servings || 1.0,
        calories: food.calories,
        protein_g: food.protein_g,
        carbs_g: food.carbs_g,
        fat_g: food.fat_g,
        fiber_g: food.fiber_g
      });
    }
  };

  const adjustServings = (delta: number) => {
    setEditingFood(prev => ({
      ...prev,
      servings: Math.max(0.25, (prev.servings || 1.0) + delta)
    }));
  };

  const saveEditedFood = () => {
    if (editingFoodIndex !== null) {
      const updatedFoods = [...editedFields.foods];
      // Preserve nutrition data when editing
      updatedFoods[editingFoodIndex] = {
        ...editingFood,
        name: editingFood.name,
        quantity: editingFood.quantity
      };
      updateField('foods', updatedFoods);
      setEditingFoodIndex(null);
      setEditingFood({ name: '', quantity: '' });
    }
  };

  const addNewFood = () => {
    const newFood: FoodItem = {
      name: 'New food',
      quantity: '1 serving',
      servings: 1.0,
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0
    };
    updateField('foods', [...(editedFields.foods || []), newFood]);
  };

  const removeFood = (index: number) => {
    const updatedFoods = editedFields.foods.filter((_: any, i: number) => i !== index);
    updateField('foods', updatedFoods);
  };

  const handleSave = () => {
    // Include calculated totals when saving
    const dataToSave = {
      ...editedFields,
      calories: displayTotals.calories,
      protein_g: displayTotals.protein_g,
      carbs_g: displayTotals.carbs_g,
      fat_g: displayTotals.fat_g,
      fiber_g: displayTotals.fiber_g
    };
    onSave(dataToSave);
  };

  const mealTypeEmojis: Record<string, string> = {
    breakfast: '🍳',
    lunch: '🥗',
    dinner: '🍽️',
    snack: '🍎'
  };

  return (
    <div className="bg-iron-gray/30 border-2 border-iron-gray rounded-3xl overflow-hidden shadow-2xl">
      {/* Warnings */}
      {data.validation.warnings.length > 0 && (
        <div className="bg-amber-900/20 border-b-2 border-amber-600 px-6 py-3 flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-amber-400">Needs Clarification</p>
            <ul className="text-sm text-amber-300 mt-1 space-y-1">
              {data.validation.warnings.map((warning, i) => (
                <li key={i}>• {warning}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Critical Missing Data */}
      {data.data.needs_clarification && (
        <div className="bg-red-900/20 border-b-2 border-red-600 px-6 py-3">
          <p className="text-red-400 font-medium">⚠️ Missing Details</p>
          <p className="text-sm text-red-300 mt-1">
            Add portions for accurate nutrition tracking
          </p>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Meal Name */}
        <div>
          <label className="block text-sm font-medium text-iron-gray uppercase tracking-wider mb-2">
            Meal Name
          </label>
          {editMode ? (
            <input
              type="text"
              value={editedFields.meal_name || ''}
              onChange={(e) => updateField('meal_name', e.target.value)}
              className="w-full px-4 py-3 bg-iron-black text-iron-white border-2 border-iron-gray rounded-xl focus:ring-2 focus:ring-iron-orange focus:border-iron-orange outline-none text-lg"
              placeholder="Enter meal name"
            />
          ) : (
            <div className="text-2xl font-heading text-iron-orange uppercase">
              {primary.meal_name}
            </div>
          )}
        </div>

        {/* Meal Type */}
        <div>
          <label className="block text-sm font-medium text-iron-gray uppercase tracking-wider mb-2">
            Meal Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
              <button
                key={type}
                onClick={() => editMode && updateField('meal_type', type)}
                disabled={!editMode}
                className={`
                  py-3 px-4 rounded-xl font-medium transition-all text-sm uppercase tracking-wide
                  ${
                    (editedFields.meal_type || primary.meal_type) === type
                      ? 'bg-iron-orange text-white shadow-lg'
                      : 'bg-iron-gray text-iron-white hover:bg-iron-gray/70'
                  }
                  ${!editMode && 'cursor-default'}
                `}
              >
                <span className="mr-1 text-lg">{mealTypeEmojis[type]}</span>
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Foods - Editable */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-iron-gray uppercase tracking-wider">
              Foods
            </label>
            {editMode && (
              <button
                onClick={addNewFood}
                className="text-xs flex items-center gap-1 px-2 py-1 bg-iron-orange text-white rounded-lg hover:bg-iron-orange/80 transition-colors"
              >
                <Plus size={14} />
                Add Food
              </button>
            )}
          </div>
          <div className="space-y-2">
            {(editedFields.foods || []).map((food: any, index: number) => (
              <div key={index}>
                {editMode && editingFoodIndex === index ? (
                  // Editing mode for this food item
                  <div className="bg-iron-black/50 px-4 py-3 rounded-xl border-2 border-iron-orange space-y-2">
                    <input
                      type="text"
                      value={editingFood.name}
                      onChange={(e) => setEditingFood({ ...editingFood, name: e.target.value })}
                      placeholder="Food name"
                      className="w-full px-3 py-2 bg-iron-gray text-iron-white border border-iron-gray rounded-lg focus:border-iron-orange outline-none"
                    />

                    {/* Servings Adjuster */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-iron-gray">Amount:</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => adjustServings(-0.5)}
                            className="p-2 bg-iron-gray hover:bg-iron-gray/70 text-iron-white rounded-lg transition-colors"
                            aria-label="Decrease amount"
                          >
                            <Minus size={16} />
                          </button>
                          <div className="px-4 py-2 bg-iron-black border border-iron-gray rounded-lg min-w-[80px] text-center">
                            <span className="text-iron-white font-medium">{editingFood.servings?.toFixed(1)}×</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => adjustServings(0.5)}
                            className="p-2 bg-iron-gray hover:bg-iron-gray/70 text-iron-white rounded-lg transition-colors"
                            aria-label="Increase amount"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-iron-gray text-right">
                        = {editingFood.quantity} × {editingFood.servings?.toFixed(1)}
                      </div>

                      {/* Show calculated nutrition for this food */}
                      {editingFood.calories !== undefined && (
                        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-iron-gray/30">
                          <div className="text-center">
                            <div className="text-iron-orange font-bold">{Math.round((editingFood.calories || 0) * (editingFood.servings || 1))}</div>
                            <div className="text-xs text-iron-gray">cal</div>
                          </div>
                          <div className="text-center">
                            <div className="text-iron-orange font-bold">{Math.round((editingFood.protein_g || 0) * (editingFood.servings || 1))}g</div>
                            <div className="text-xs text-iron-gray">pro</div>
                          </div>
                          <div className="text-center">
                            <div className="text-iron-orange font-bold">{Math.round((editingFood.carbs_g || 0) * (editingFood.servings || 1))}g</div>
                            <div className="text-xs text-iron-gray">carb</div>
                          </div>
                          <div className="text-center">
                            <div className="text-iron-orange font-bold">{Math.round((editingFood.fat_g || 0) * (editingFood.servings || 1))}g</div>
                            <div className="text-xs text-iron-gray">fat</div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={saveEditedFood}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1 text-sm"
                      >
                        <Check size={16} />
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingFoodIndex(null);
                          setEditingFood({ name: '', quantity: '' });
                        }}
                        className="flex-1 px-3 py-2 bg-iron-gray text-iron-white rounded-lg hover:bg-iron-gray/70 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display mode
                  <div className="flex items-center gap-3 bg-iron-black/50 px-4 py-3 rounded-xl border border-iron-gray">
                    <span className="text-iron-orange text-xl">•</span>
                    <span className="flex-1">
                      <span className="font-medium text-iron-white">
                        {typeof food === 'string' ? food : food.name}
                      </span>
                      {typeof food === 'object' && food.quantity && food.quantity !== 'not specified' && (
                        <span className="text-iron-gray ml-2">
                          ({food.quantity}
                          {food.servings && food.servings !== 1.0 && ` × ${food.servings.toFixed(1)}`})
                        </span>
                      )}
                      {/* Show calculated nutrition in display mode */}
                      {typeof food === 'object' && food.calories !== undefined && (
                        <div className="text-xs text-iron-gray mt-1 flex gap-3">
                          <span>{Math.round((food.calories || 0) * (food.servings || 1))} cal</span>
                          <span>{Math.round((food.protein_g || 0) * (food.servings || 1))}g pro</span>
                          <span>{Math.round((food.carbs_g || 0) * (food.servings || 1))}g carb</span>
                          <span>{Math.round((food.fat_g || 0) * (food.servings || 1))}g fat</span>
                        </div>
                      )}
                    </span>
                    {editMode && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditingFood(index)}
                          className="text-iron-gray hover:text-iron-orange transition-colors"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => removeFood(index)}
                          className="text-iron-gray hover:text-red-500 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Nutrition Cards */}
        {(displayTotals.calories !== null || !data.data.needs_clarification) && (
          <div>
            <label className="block text-sm font-medium text-iron-gray uppercase tracking-wider mb-3">
              Nutrition Summary
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-iron-orange rounded-xl p-4 text-white text-center">
                <div className="text-4xl font-heading">{Math.round(displayTotals.calories) || '?'}</div>
                <div className="text-sm opacity-90 mt-1 uppercase tracking-wide">Calories</div>
              </div>
              <div className="bg-iron-orange rounded-xl p-4 text-white text-center">
                <div className="text-4xl font-heading">{Math.round(displayTotals.protein_g) || '?'}g</div>
                <div className="text-sm opacity-90 mt-1 uppercase tracking-wide">Protein</div>
              </div>
              <div className="bg-iron-orange rounded-xl p-4 text-white text-center">
                <div className="text-4xl font-heading">{Math.round(displayTotals.carbs_g) || '?'}g</div>
                <div className="text-sm opacity-90 mt-1 uppercase tracking-wide">Carbs</div>
              </div>
            </div>
          </div>
        )}

        {/* AI Suggestions */}
        {data.suggestions.length > 0 && !data.data.needs_clarification && (
          <div className="bg-iron-gray/50 border-2 border-iron-gray p-4 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div className="flex-1">
                <p className="font-medium text-iron-orange uppercase tracking-wider text-sm mb-2">AI Insights</p>
                <div className="text-sm text-iron-white space-y-1">
                  {data.suggestions.map((suggestion, i) => (
                    <p key={i}>• {suggestion}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Expand Button for Details */}
        {!data.data.needs_clarification && (secondary.fat_g !== undefined || secondary.tags?.length > 0) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-2 text-iron-gray hover:text-iron-white py-2 rounded-xl hover:bg-iron-gray/30 transition-colors uppercase tracking-wide text-sm font-medium"
          >
            {expanded ? (
              <>
                <ChevronUp size={20} />
                <span>Less details</span>
              </>
            ) : (
              <>
                <ChevronDown size={20} />
                <span>More details</span>
              </>
            )}
          </button>
        )}

        {/* Expanded Details */}
        {expanded && (
          <div className="space-y-4 pt-4 border-t-2 border-iron-gray">
            {/* Detailed Nutrition */}
            {secondary.fat_g !== undefined && (
              <div>
                <label className="block text-sm font-medium text-iron-gray uppercase tracking-wider mb-2">
                  Detailed Nutrition
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-iron-gray/50 px-4 py-3 rounded-xl">
                    <div className="text-xs text-iron-gray uppercase tracking-wide">Fat</div>
                    <div className="text-2xl font-heading text-iron-orange">{secondary.fat_g}g</div>
                  </div>
                  <div className="bg-iron-gray/50 px-4 py-3 rounded-xl">
                    <div className="text-xs text-iron-gray uppercase tracking-wide">Fiber</div>
                    <div className="text-2xl font-heading text-iron-orange">{secondary.fiber_g || 0}g</div>
                  </div>
                  <div className="bg-iron-gray/50 px-4 py-3 rounded-xl">
                    <div className="text-xs text-iron-gray uppercase tracking-wide">Sugar</div>
                    <div className="text-2xl font-heading text-iron-orange">{secondary.sugar_g || 0}g</div>
                  </div>
                  <div className="bg-iron-gray/50 px-4 py-3 rounded-xl">
                    <div className="text-xs text-iron-gray uppercase tracking-wide">Sodium</div>
                    <div className="text-2xl font-heading text-iron-orange">{secondary.sodium_mg || 0}mg</div>
                  </div>
                </div>
              </div>
            )}

            {/* Tags */}
            {secondary.tags && secondary.tags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-iron-gray uppercase tracking-wider mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {secondary.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-iron-orange/20 text-iron-orange border border-iron-orange rounded-full text-sm font-medium uppercase tracking-wide"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 p-6 pt-0">
        {editMode ? (
          <>
            <button
              onClick={() => {
                handleSave();
                setEditMode(false);
              }}
              className="flex-1 bg-iron-orange text-white py-4 px-4 rounded-xl font-bold hover:bg-iron-orange/80 transition-all flex items-center justify-center gap-2 uppercase tracking-wide shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95"
            >
              <Check size={20} />
              Save Meal
            </button>
            <button
              onClick={() => {
                setEditedFields(data.data.primary_fields);
                setEditMode(false);
                setEditingFoodIndex(null);
              }}
              className="flex-1 bg-iron-gray text-iron-white py-4 px-4 rounded-xl font-bold hover:bg-iron-gray/80 transition-colors uppercase tracking-wide"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleSave}
              className="flex-1 bg-iron-orange text-white py-4 px-4 rounded-xl font-bold hover:bg-iron-orange/80 transition-all flex items-center justify-center gap-2 uppercase tracking-wide shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95"
            >
              <Check size={20} />
              Save Meal
            </button>
            <button
              onClick={() => setEditMode(true)}
              className="flex-1 bg-iron-gray text-iron-white py-4 px-4 rounded-xl font-bold hover:bg-iron-gray/80 transition-colors flex items-center justify-center gap-2 uppercase tracking-wide"
            >
              <Edit3 size={20} />
              Edit
            </button>
          </>
        )}
      </div>
    </div>
  );
}
