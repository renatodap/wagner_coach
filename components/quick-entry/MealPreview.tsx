'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Check, Edit3, AlertTriangle, Zap, Star } from 'lucide-react';
import { MealPrimaryFields, MealSecondaryFields, QuickEntryPreviewResponse } from './types';

interface MealPreviewProps {
  data: QuickEntryPreviewResponse;
  onSave: (editedData: any) => void;
  onEdit: () => void;
}

export default function MealPreview({ data, onSave, onEdit }: MealPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedFields, setEditedFields] = useState<any>(data.data.primary_fields);

  const primary = data.data.primary_fields as MealPrimaryFields;
  const secondary = data.data.secondary_fields as MealSecondaryFields;

  const updateField = (field: string, value: any) => {
    setEditedFields({ ...editedFields, [field]: value });
  };

  const handleSave = () => {
    onSave(editedFields);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🍽️</span>
          <h3 className="text-lg font-semibold">Meal Entry</h3>
        </div>
        {data.data.estimated && (
          <div className="flex items-center gap-2 bg-amber-500 px-3 py-1 rounded-full text-sm">
            <Zap size={14} />
            <span>Estimated • {Math.round(data.confidence * 100)}% confidence</span>
          </div>
        )}
      </div>

      {/* Warnings */}
      {data.validation.warnings.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 px-6 py-3 flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-amber-900">Needs Clarification</p>
            <ul className="text-sm text-amber-800 mt-1 space-y-1">
              {data.validation.warnings.map((warning, i) => (
                <li key={i}>• {warning}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Critical Missing Data */}
      {data.data.needs_clarification && (
        <div className="bg-red-50 border-l-4 border-red-500 px-6 py-3">
          <p className="text-red-900 font-medium">⚠️ Missing Details</p>
          <p className="text-sm text-red-800 mt-1">
            Add portions for accurate nutrition tracking
          </p>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Meal Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meal Name
          </label>
          {editMode ? (
            <input
              type="text"
              value={editedFields.meal_name || ''}
              onChange={(e) => updateField('meal_name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          ) : (
            <div className="text-lg font-medium text-gray-900">
              {primary.meal_name}
            </div>
          )}
        </div>

        {/* Meal Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meal Type
          </label>
          <div className="flex gap-2">
            {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
              <button
                key={type}
                onClick={() => editMode && updateField('meal_type', type)}
                disabled={!editMode}
                className={`
                  flex-1 py-2 px-4 rounded-lg font-medium transition-all
                  ${
                    (editedFields.meal_type || primary.meal_type) === type
                      ? 'bg-purple-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                  ${!editMode && 'cursor-default'}
                `}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Foods */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Foods
          </label>
          <div className="space-y-2">
            {primary.foods?.map((food, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-lg"
              >
                <span className="text-purple-600">•</span>
                <span className="flex-1">
                  <span className="font-medium">{food.name}</span>
                  {food.quantity && food.quantity !== 'not specified' && (
                    <span className="text-gray-600 ml-2">({food.quantity})</span>
                  )}
                </span>
                {editMode && (
                  <button className="text-gray-400 hover:text-red-500">
                    <Edit3 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Nutrition Cards */}
        {(primary.calories !== null || !data.data.needs_clarification) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Nutrition Summary
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white text-center">
                <div className="text-3xl font-bold">{primary.calories || '?'}</div>
                <div className="text-sm opacity-90 mt-1">Calories</div>
              </div>
              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-4 text-white text-center">
                <div className="text-3xl font-bold">{primary.protein_g || '?'}g</div>
                <div className="text-sm opacity-90 mt-1">Protein</div>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg p-4 text-white text-center">
                <div className="text-3xl font-bold">{secondary.carbs_g || '?'}g</div>
                <div className="text-sm opacity-90 mt-1">Carbs</div>
              </div>
            </div>
          </div>
        )}

        {/* Missing Nutrition - Quick Estimate */}
        {primary.calories === null && data.suggestions.length > 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div className="flex-1">
                <p className="font-medium text-blue-900 mb-2">Quick Estimate</p>
                <div className="text-sm text-blue-800 space-y-1">
                  {data.suggestions.map((suggestion, i) => (
                    <p key={i}>{suggestion}</p>
                  ))}
                </div>
                <button className="mt-3 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                  Use This Estimate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Expand Button */}
        {!data.data.needs_clarification && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp size={20} />
                <span className="font-medium">Less details</span>
              </>
            ) : (
              <>
                <ChevronDown size={20} />
                <span className="font-medium">More details</span>
              </>
            )}
          </button>
        )}

        {/* Expanded Section */}
        {expanded && (
          <div className="space-y-6 pt-4 border-t border-gray-200 animate-in slide-in-from-top">
            {/* Detailed Nutrition */}
            {secondary.fat_g !== undefined && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Detailed Nutrition</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 px-4 py-3 rounded-lg">
                    <div className="text-sm text-gray-600">Fat</div>
                    <div className="text-lg font-semibold text-gray-900">{secondary.fat_g}g</div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 rounded-lg">
                    <div className="text-sm text-gray-600">Fiber</div>
                    <div className="text-lg font-semibold text-gray-900">{secondary.fiber_g || 0}g</div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 rounded-lg">
                    <div className="text-sm text-gray-600">Sugar</div>
                    <div className="text-lg font-semibold text-gray-900">{secondary.sugar_g || 0}g</div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 rounded-lg">
                    <div className="text-sm text-gray-600">Sodium</div>
                    <div className="text-lg font-semibold text-gray-900">{secondary.sodium_mg || 0}mg</div>
                  </div>
                </div>
              </div>
            )}

            {/* Individual Foods Breakdown */}
            {secondary.foods_detailed && secondary.foods_detailed.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Food Breakdown</h4>
                <div className="space-y-3">
                  {secondary.foods_detailed.map((food, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="font-medium text-gray-900 mb-2">
                        {food.name} ({food.quantity})
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">{food.calories}</span>
                          <span className="text-gray-500 text-xs ml-1">cal</span>
                        </div>
                        <div>
                          <span className="text-gray-600">{food.protein_g}g</span>
                          <span className="text-gray-500 text-xs ml-1">PRO</span>
                        </div>
                        <div>
                          <span className="text-gray-600">{food.carbs_g}g</span>
                          <span className="text-gray-500 text-xs ml-1">CARB</span>
                        </div>
                        <div>
                          <span className="text-gray-600">{food.fat_g}g</span>
                          <span className="text-gray-500 text-xs ml-1">FAT</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {secondary.tags && secondary.tags.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {secondary.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Suggestions */}
        {data.suggestions.length > 0 && !data.data.needs_clarification && (
          <div className="bg-green-50 rounded-lg p-4">
            <p className="font-medium text-green-900 mb-2">✨ Insights</p>
            <ul className="text-sm text-green-800 space-y-1">
              {data.suggestions.map((suggestion, i) => (
                <li key={i}>• {suggestion}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
        <button
          onClick={handleSave}
          className="flex-1 bg-green-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
        >
          <Check size={20} />
          Save Entry
        </button>
        <button
          onClick={() => setEditMode(!editMode)}
          className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
        >
          <Edit3 size={20} />
          {editMode ? 'Done Editing' : 'Edit'}
        </button>
      </div>
    </div>
  );
}
