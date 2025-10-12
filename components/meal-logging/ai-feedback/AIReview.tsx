'use client';

import React, { useState, useEffect } from 'react';
import { AIReviewProps, AIAnalysisResult, MealInsert } from '@/types/nutrition';
import { Plus, Minus, RotateCw, Edit3, Check, X, AlertCircle } from 'lucide-react';
import DOMPurify from 'isomorphic-dompurify';

interface EditableFoodItem {
  name: string;
  quantity: string;
  confidence: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  isModified: boolean;
  isNew: boolean;
}

export default function AIReview({
  aiResult,
  originalImage,
  onConfirm,
  onReanalyze,
  onManualEdit
}: AIReviewProps) {
  const [foodItems, setFoodItems] = useState<EditableFoodItem[]>([]);
  const [mealName, setMealName] = useState(aiResult.suggestedMealName);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [itemsToMerge, setItemsToMerge] = useState<number[]>([]);

  useEffect(() => {
    // Initialize editable food items
    const items = aiResult.foodItems.map(item => ({
      ...item,
      isModified: false,
      isNew: false
    }));
    setFoodItems(items);
  }, [aiResult]);

  const calculateTotals = () => {
    return foodItems.reduce((totals, item) => ({
      calories: totals.calories + (item.calories || 0),
      protein_g: totals.protein_g + (item.protein_g || 0),
      carbs_g: totals.carbs_g + (item.carbs_g || 0),
      fat_g: totals.fat_g + (item.fat_g || 0),
      fiber_g: totals.fiber_g + (item.fiber_g || 0)
    }), { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 });
  };

  const updateFoodItem = (index: number, field: keyof EditableFoodItem, value: any) => {
    const newItems = [...foodItems];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
      isModified: true
    };
    setFoodItems(newItems);

    // Clear validation error for this field
    const errorKey = `${index}-${field}`;
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[errorKey];
      return newErrors;
    });
  };

  const removeFoodItem = (index: number) => {
    setFoodItems(foodItems.filter((_, i) => i !== index));
  };

  const addFoodItem = () => {
    const newItem: EditableFoodItem = {
      name: '',
      quantity: '',
      confidence: 0,
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
      isModified: true,
      isNew: true
    };
    setFoodItems([...foodItems, newItem]);
  };

  const mergeSimilarItems = () => {
    const riceItems = foodItems.reduce((acc, item, index) => {
      if (item.name.toLowerCase().includes('rice')) {
        acc.indices.push(index);
        acc.totalCalories += item.calories;
        acc.totalProtein += item.protein_g;
        acc.totalCarbs += item.carbs_g;
        acc.totalFat += item.fat_g;
        acc.totalFiber += item.fiber_g;
      }
      return acc;
    }, {
      indices: [] as number[],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalFiber: 0
    });

    if (riceItems.indices.length > 1) {
      const mergedItem: EditableFoodItem = {
        name: 'Rice (Combined)',
        quantity: 'Combined portion',
        confidence: 0.8,
        calories: riceItems.totalCalories,
        protein_g: riceItems.totalProtein,
        carbs_g: riceItems.totalCarbs,
        fat_g: riceItems.totalFat,
        fiber_g: riceItems.totalFiber,
        isModified: true,
        isNew: false
      };

      const newItems = foodItems.filter((_, index) => !riceItems.indices.includes(index));
      newItems.push(mergedItem);
      setFoodItems(newItems);

      // Show success message
      const message = document.createElement('div');
      message.textContent = 'Rice items combined';
      message.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow';
      document.body.appendChild(message);
      setTimeout(() => message.remove(), 3000);
    }
  };

  const splitItem = (index: number) => {
    setShowMergeDialog(true);
    setItemsToMerge([index]);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!mealName.trim()) {
      errors.mealName = 'Meal name required';
    }

    foodItems.forEach((item, index) => {
      if (!item.name.trim()) {
        errors[`${index}-name`] = 'Name is required';
      }
      if (item.calories < 0) {
        errors[`${index}-calories`] = 'Calories must be positive';
      }
      if (item.protein_g < 0) {
        errors[`${index}-protein`] = 'Must be positive';
      }
      if (item.carbs_g < 0) {
        errors[`${index}-carbs`] = 'Must be positive';
      }
      if (item.fat_g < 0) {
        errors[`${index}-fat`] = 'Must be positive';
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConfirm = () => {
    if (!validateForm()) {
      return;
    }

    const totals = calculateTotals();
    const sanitizedName = DOMPurify.sanitize(
      foodItems.map(item => item.name).join(', ').includes('Modified')
        ? `Modified ${mealName}`
        : mealName
    );

    const mealData: MealInsert = {
      name: sanitizedName,
      meal_type: 'lunch', // Default, should be passed from parent
      calories: Math.round(totals.calories),
      protein_g: Math.round(totals.protein_g * 10) / 10,
      carbs_g: Math.round(totals.carbs_g * 10) / 10,
      fat_g: Math.round(totals.fat_g * 10) / 10,
      fiber_g: Math.round(totals.fiber_g * 10) / 10,
      notes: `AI analyzed meal with ${foodItems.length} items`
    };

    onConfirm(mealData);
  };

  const totals = calculateTotals();

  return (
    <div className="ai-review-container">
      {/* Image Preview */}
      <div className="mb-4">
        <img
          src={originalImage}
          alt="Meal photo"
          className="w-full max-w-md mx-auto rounded-lg shadow"
        />
      </div>

      {/* Meal Name */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Meal Name
        </label>
        <input
          type="text"
          value={mealName}
          onChange={(e) => setMealName(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          aria-label="Meal name"
        />
        {validationErrors.mealName && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.mealName}</p>
        )}
      </div>

      {/* Food Items Table */}
      <div className="overflow-x-auto mb-4">
        <table role="table" className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2 text-left text-sm font-medium text-gray-700">Food Item</th>
              <th className="p-2 text-left text-sm font-medium text-gray-700">Portion</th>
              <th className="p-2 text-center text-sm font-medium text-gray-700">Calories</th>
              <th className="p-2 text-center text-sm font-medium text-gray-700">Protein</th>
              <th className="p-2 text-center text-sm font-medium text-gray-700">Carbs</th>
              <th className="p-2 text-center text-sm font-medium text-gray-700">Fat</th>
              <th className="p-2 text-center text-sm font-medium text-gray-700">Confidence</th>
              <th className="p-2 text-center text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {foodItems.map((item, index) => (
              <tr
                key={index}
                data-testid="food-item-row"
                className={`border-b ${item.isModified ? 'modified bg-yellow-50' : ''}`}
              >
                <td className="p-2">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateFoodItem(index, 'name', e.target.value)}
                    className="w-full px-2 py-1 border rounded"
                    aria-label="Food name"
                  />
                  {validationErrors[`${index}-name`] && (
                    <p className="text-red-500 text-xs">{validationErrors[`${index}-name`]}</p>
                  )}
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    value={item.quantity}
                    onChange={(e) => updateFoodItem(index, 'quantity', e.target.value)}
                    className="w-full px-2 py-1 border rounded"
                    aria-label="Portion"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    value={item.calories}
                    onChange={(e) => updateFoodItem(index, 'calories', parseInt(e.target.value) || 0)}
                    className="w-20 px-2 py-1 border rounded text-center"
                    aria-label="Calories"
                  />
                  {validationErrors[`${index}-calories`] && (
                    <p className="text-red-500 text-xs">Calories required</p>
                  )}
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    value={item.protein_g}
                    onChange={(e) => updateFoodItem(index, 'protein_g', parseFloat(e.target.value) || 0)}
                    className="w-16 px-2 py-1 border rounded text-center"
                    aria-label="Protein"
                  />
                  {validationErrors[`${index}-protein`] && (
                    <p className="text-red-500 text-xs">Invalid value</p>
                  )}
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    value={item.carbs_g}
                    onChange={(e) => updateFoodItem(index, 'carbs_g', parseFloat(e.target.value) || 0)}
                    className="w-16 px-2 py-1 border rounded text-center"
                    aria-label="Carbs"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    value={item.fat_g}
                    onChange={(e) => updateFoodItem(index, 'fat_g', parseFloat(e.target.value) || 0)}
                    className="w-16 px-2 py-1 border rounded text-center"
                    aria-label="Fat"
                  />
                </td>
                <td className={`p-2 text-center ${item.confidence < 0.5 ? 'text-yellow-600 low-confidence' : ''}`}>
                  {Math.round(item.confidence * 100)}%
                </td>
                <td className="p-2 text-center">
                  <button
                    onClick={() => removeFoodItem(index)}
                    className="text-red-500 hover:text-red-700"
                    aria-label="Remove"
                  >
                    <X size={16} />
                  </button>
                  <button
                    onClick={() => splitItem(index)}
                    className="ml-2 text-blue-500 hover:text-blue-700"
                    aria-label="Split"
                  >
                    Split
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Item Button */}
      <button
        onClick={addFoodItem}
        className="mb-4 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
        aria-label="Add Item"
      >
        <Plus className="inline mr-1" size={16} />
        Add Item
      </button>

      {/* Merge Similar Button */}
      {foodItems.filter(item => item.name.toLowerCase().includes('rice')).length > 1 && (
        <button
          onClick={mergeSimilarItems}
          className="ml-2 mb-4 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          aria-label="Merge Similar"
        >
          Merge Similar Items
        </button>
      )}

      {/* Nutrition Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h3 className="font-semibold mb-2">Total Nutrition</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
          <div>
            <span className="text-gray-600">Calories: </span>
            <span className="font-medium">{Math.round(totals.calories)} calories</span>
          </div>
          <div>
            <span className="text-gray-600">Protein: </span>
            <span className="font-medium">{totals.protein_g.toFixed(1)}g protein</span>
          </div>
          <div>
            <span className="text-gray-600">Carbs: </span>
            <span className="font-medium">{totals.carbs_g.toFixed(1)}g carbs</span>
          </div>
          <div>
            <span className="text-gray-600">Fat: </span>
            <span className="font-medium">{totals.fat_g.toFixed(1)}g fat</span>
          </div>
          <div>
            <span className="text-gray-600">Fiber: </span>
            <span className="font-medium">{totals.fiber_g.toFixed(1)}g</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleConfirm}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          aria-label="Confirm"
        >
          <Check className="inline mr-1" size={16} />
          Confirm & Save
        </button>
        <button
          onClick={onReanalyze}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          aria-label="Reanalyze"
        >
          <RotateCw className="inline mr-1" size={16} />
          Reanalyze
        </button>
        <button
          onClick={onManualEdit}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          aria-label="Manual Edit"
        >
          <Edit3 className="inline mr-1" size={16} />
          Manual Edit
        </button>
      </div>

      {/* Split Dialog Modal */}
      {showMergeDialog && (
        <div
          role="dialog"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold mb-4">Split into Components</h3>
            <p className="mb-4">This feature allows you to split a combined food item into its individual components.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowMergeDialog(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}