'use client';

import React, { useState } from 'react';
import { AlertTriangle, Check, X, Edit2 } from 'lucide-react';
import { IntelligentParsedMeal, ParsedFoodItem } from '@/lib/ai/intelligent-meal-parser';

interface MealConfirmationProps {
  parsedMeal: IntelligentParsedMeal;
  originalDescription: string;
  warnings: string[];
  onConfirm: (confirmedMeal: IntelligentParsedMeal) => void;
  onReject: () => void;
  onEdit: (foodIndex: number) => void;
}

export function MealConfirmation({
  parsedMeal,
  originalDescription,
  warnings,
  onConfirm,
  onReject,
  onEdit
}: MealConfirmationProps) {
  const [editedMeal, setEditedMeal] = useState<IntelligentParsedMeal>(parsedMeal);

  const updateFood = (index: number, updates: Partial<ParsedFoodItem>) => {
    const updated = { ...editedMeal };
    updated.foods[index] = { ...updated.foods[index], ...updates };

    // Recalculate totals
    const totals = updated.foods.reduce((acc, food) => ({
      calories: acc.calories + food.nutrition.calories,
      protein: acc.protein + food.nutrition.protein_g,
      carbs: acc.carbs + food.nutrition.carbs_g,
      fat: acc.fat + food.nutrition.fat_g
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    updated.total_calories = totals.calories;
    updated.total_protein_g = totals.protein;
    updated.total_carbs_g = totals.carbs;
    updated.total_fat_g = totals.fat;

    setEditedMeal(updated);
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-red-400';
      default: return 'text-iron-gray';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'database': return '🗄️';
      case 'perplexity': return '🌐';
      case 'estimate': return '💭';
      default: return '❓';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border border-iron-gray p-4">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="text-yellow-400 mt-1 flex-shrink-0" size={20} />
          <div>
            <h3 className="text-iron-orange font-heading text-lg">PLEASE CONFIRM</h3>
            <p className="text-iron-gray text-sm mt-1">
              I parsed: <span className="text-iron-white">"{originalDescription}"</span>
            </p>
            <p className="text-iron-gray text-sm">
              Confidence: <span className={getConfidenceColor(editedMeal.confidence)}>
                {editedMeal.confidence.toUpperCase()}
              </span>
            </p>
          </div>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="bg-yellow-900/20 border border-yellow-600/30 p-3 mb-4">
            <h4 className="text-yellow-400 text-sm font-medium mb-2">Warnings:</h4>
            <ul className="text-yellow-200 text-xs space-y-1">
              {warnings.map((warning, i) => (
                <li key={i}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Parsed Foods */}
      <div className="space-y-3">
        <h4 className="text-iron-orange font-heading">DETECTED FOODS</h4>
        {editedMeal.foods.map((food, index) => (
          <div key={index} className="border border-iron-gray p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-iron-white font-medium">
                    {food.name}
                    {food.brand && (
                      <span className="text-iron-gray text-sm ml-2">({food.brand})</span>
                    )}
                  </span>
                  <span className="text-xs" title={`Source: ${food.source}`}>
                    {getSourceIcon(food.source)}
                  </span>
                  <span className={`text-xs ${getConfidenceColor(food.confidence)}`}>
                    {food.confidence}
                  </span>
                </div>

                <div className="text-iron-gray text-sm mt-1">
                  {food.quantity} {food.unit}
                </div>

                {food.needsConfirmation && (
                  <div className={`border p-2 mt-2 ${
                    food.fallbackNutrition
                      ? 'bg-yellow-900/20 border-yellow-600/30'
                      : 'bg-red-900/20 border-red-600/30'
                  }`}>
                    <p className={`text-xs ${
                      food.fallbackNutrition
                        ? 'text-yellow-200'
                        : 'text-red-200'
                    }`}>
                      {food.fallbackNutrition
                        ? '⚠️ Using estimated nutrition (could not save to database). Please verify accuracy.'
                        : '⚠️ This nutrition data was found via web search. Please verify it\'s accurate.'
                      }
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => onEdit(index)}
                className="text-iron-gray hover:text-iron-orange transition-colors"
                title="Edit this food"
              >
                <Edit2 size={16} />
              </button>
            </div>

            {/* Nutrition Info */}
            <div className="grid grid-cols-4 gap-3 text-sm">
              <div>
                <div className="text-iron-gray text-xs">Calories</div>
                <div className="text-iron-white font-bold">{Math.round(food.nutrition.calories)}</div>
              </div>
              <div>
                <div className="text-iron-gray text-xs">Protein</div>
                <div className="text-iron-white font-bold">{food.nutrition.protein_g}g</div>
              </div>
              <div>
                <div className="text-iron-gray text-xs">Carbs</div>
                <div className="text-iron-white font-bold">{food.nutrition.carbs_g}g</div>
              </div>
              <div>
                <div className="text-iron-gray text-xs">Fat</div>
                <div className="text-iron-white font-bold">{food.nutrition.fat_g}g</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border border-iron-orange p-4">
        <div className="font-heading text-iron-orange mb-3">MEAL TOTALS</div>
        <div className="grid grid-cols-4 gap-3 text-sm">
          <div>
            <div className="text-iron-gray text-xs">Total Calories</div>
            <div className="text-iron-white font-bold text-lg">{Math.round(editedMeal.total_calories)}</div>
          </div>
          <div>
            <div className="text-iron-gray text-xs">Total Protein</div>
            <div className="text-iron-white font-bold text-lg">{Math.round(editedMeal.total_protein_g)}g</div>
          </div>
          <div>
            <div className="text-iron-gray text-xs">Total Carbs</div>
            <div className="text-iron-white font-bold text-lg">{Math.round(editedMeal.total_carbs_g)}g</div>
          </div>
          <div>
            <div className="text-iron-gray text-xs">Total Fat</div>
            <div className="text-iron-white font-bold text-lg">{Math.round(editedMeal.total_fat_g)}g</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={() => onConfirm(editedMeal)}
          className="flex-1 bg-green-600 text-white font-heading py-3 px-4 uppercase tracking-wider hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
        >
          <Check size={20} />
          Looks Good - Save Meal
        </button>
        <button
          onClick={onReject}
          className="flex-1 bg-red-600 text-white font-heading py-3 px-4 uppercase tracking-wider hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
        >
          <X size={20} />
          Not Right - Try Again
        </button>
      </div>

      <div className="text-center">
        <p className="text-iron-gray text-xs">
          💡 Foods found via web search are added to your database when possible. Estimated nutrition is used as fallback.
        </p>
      </div>
    </div>
  );
}