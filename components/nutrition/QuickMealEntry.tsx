'use client';

import React, { useState } from 'react';
import { Sparkles, AlertCircle, Check, X, Edit2, Loader2 } from 'lucide-react';
import { ParsedMeal } from '@/lib/ai/meal-parser';

interface QuickMealEntryProps {
  onMealAdded: () => void;
}

export function QuickMealEntry({ onMealAdded }: QuickMealEntryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedMeal, setParsedMeal] = useState<ParsedMeal | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMeal, setEditedMeal] = useState<ParsedMeal | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async () => {
    if (!description.trim()) return;

    setIsParsing(true);
    setError(null);

    try {
      const response = await fetch('/api/nutrition/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description }),
      });

      if (!response.ok) {
        throw new Error('Failed to parse meal description');
      }

      const data = await response.json();
      setParsedMeal(data.parsed);
      setEditedMeal(data.parsed);
    } catch (err) {
      console.error('Error parsing meal:', err);
      setError('Failed to understand the meal description. Please try again or add manually.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirm = async () => {
    if (!parsedMeal) return;

    setIsSaving(true);
    setError(null);

    try {
      const mealData = isEditing ? editedMeal : parsedMeal;

      // Use the simple format that works with the existing API
      const formattedMealData = {
        meal_name: mealData?.meal_name || 'Meal',
        meal_category: mealData?.meal_category || 'other',
        logged_at: mealData?.logged_at || new Date().toISOString(),
        calories: mealData?.calories,
        protein_g: mealData?.protein_g,
        carbs_g: mealData?.carbs_g,
        fat_g: mealData?.fat_g,
        fiber_g: mealData?.fiber_g,
        notes: mealData?.notes
      };

      console.log('Saving meal:', formattedMealData);

      const response = await fetch('/api/nutrition/meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedMealData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('Meal save error:', responseData);
        throw new Error(responseData?.error || `Failed to save meal: ${response.statusText}`);
      }

      console.log('Meal saved successfully:', responseData);

      // Reset state
      setDescription('');
      setParsedMeal(null);
      setEditedMeal(null);
      setIsEditing(false);
      setIsOpen(false);

      // Notify parent to refresh
      onMealAdded();
    } catch (err) {
      console.error('Error saving meal:', err);
      setError('Failed to save meal. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDescription('');
    setParsedMeal(null);
    setEditedMeal(null);
    setIsEditing(false);
    setError(null);
  };

  const handleClose = () => {
    handleCancel();
    setIsOpen(false);
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="bg-iron-black border border-iron-orange text-iron-orange px-4 py-2 font-heading uppercase tracking-wider hover:bg-iron-orange hover:text-iron-black transition-colors flex items-center gap-2"
      >
        <Sparkles className="w-5 h-5" />
        Quick Entry
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-iron-black border border-iron-gray max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-iron-gray p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl text-iron-orange flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              QUICK MEAL ENTRY
            </h2>
            <button
              onClick={handleClose}
              className="text-iron-gray hover:text-iron-orange transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!parsedMeal ? (
            // Input Phase
            <>
              <div className="space-y-2">
                <label className="block text-iron-gray text-xs uppercase">
                  Describe what you ate
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Examples:
• I just ate an apple
• Had 3 eggs and 2 wheat toasts for breakfast today at 9am
• Last night, I had 200g of chicken breast for dinner at 5pm
• A bowl of pasta with meat sauce"
                  rows={6}
                  className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white placeholder-iron-gray/50 focus:outline-none focus:border-iron-orange transition-colors resize-none"
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={handleParse}
                  disabled={!description.trim() || isParsing}
                  className="flex-1 bg-iron-orange text-iron-black font-heading py-3 uppercase tracking-wider hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isParsing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Parse Meal
                    </>
                  )}
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 border border-iron-gray text-iron-white font-heading py-3 uppercase tracking-wider hover:bg-iron-gray/20 transition-colors"
                >
                  Cancel
                </button>
              </div>

              <p className="text-iron-gray text-xs text-center">
                AI will parse your description and extract meal details
              </p>
            </>
          ) : (
            // Confirmation Phase
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-iron-white font-medium">Parsed Meal Details</h3>
                  {parsedMeal.confidence && (
                    <span className={`text-xs px-2 py-1 uppercase ${
                      parsedMeal.confidence === 'high' ? 'text-green-500 border-green-500' :
                      parsedMeal.confidence === 'medium' ? 'text-yellow-500 border-yellow-500' :
                      'text-red-500 border-red-500'
                    } border`}>
                      {parsedMeal.confidence} confidence
                    </span>
                  )}
                </div>

                {/* Original Description */}
                <div className="bg-iron-gray/20 p-3 text-sm text-iron-gray italic">
                  "{description}"
                </div>

                {/* Parsed Details */}
                <div className="border border-iron-gray p-4 space-y-3">
                  {isEditing ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <div>
                        <label className="block text-iron-gray text-xs uppercase mb-1">Name</label>
                        <input
                          type="text"
                          value={editedMeal?.meal_name || ''}
                          onChange={(e) => setEditedMeal(prev => prev ? {...prev, meal_name: e.target.value} : null)}
                          className="w-full bg-iron-black border border-iron-gray px-3 py-2 text-iron-white text-sm focus:outline-none focus:border-iron-orange"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-iron-gray text-xs uppercase mb-1">Category</label>
                          <select
                            value={editedMeal?.meal_category || 'other'}
                            onChange={(e) => setEditedMeal(prev => prev ? {...prev, meal_category: e.target.value as any} : null)}
                            className="w-full bg-iron-black border border-iron-gray px-3 py-2 text-iron-white text-sm focus:outline-none focus:border-iron-orange"
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
                          <label className="block text-iron-gray text-xs uppercase mb-1">Time</label>
                          <input
                            type="datetime-local"
                            value={editedMeal?.logged_at ? new Date(editedMeal.logged_at).toISOString().slice(0, 16) : ''}
                            onChange={(e) => setEditedMeal(prev => prev ? {...prev, logged_at: new Date(e.target.value).toISOString()} : null)}
                            className="w-full bg-iron-black border border-iron-gray px-3 py-2 text-iron-white text-sm focus:outline-none focus:border-iron-orange"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div>
                          <label className="block text-iron-gray text-xs uppercase mb-1">Calories</label>
                          <input
                            type="number"
                            value={editedMeal?.calories || ''}
                            onChange={(e) => setEditedMeal(prev => prev ? {...prev, calories: e.target.value ? parseFloat(e.target.value) : null} : null)}
                            className="w-full bg-iron-black border border-iron-gray px-3 py-2 text-iron-white text-sm focus:outline-none focus:border-iron-orange"
                            placeholder="0"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-iron-gray text-xs uppercase mb-1">Protein (g)</label>
                          <input
                            type="number"
                            value={editedMeal?.protein_g || ''}
                            onChange={(e) => setEditedMeal(prev => prev ? {...prev, protein_g: e.target.value ? parseFloat(e.target.value) : null} : null)}
                            className="w-full bg-iron-black border border-iron-gray px-3 py-2 text-iron-white text-sm focus:outline-none focus:border-iron-orange"
                            placeholder="0"
                            min="0"
                            step="0.1"
                          />
                        </div>
                        <div>
                          <label className="block text-iron-gray text-xs uppercase mb-1">Carbs (g)</label>
                          <input
                            type="number"
                            value={editedMeal?.carbs_g || ''}
                            onChange={(e) => setEditedMeal(prev => prev ? {...prev, carbs_g: e.target.value ? parseFloat(e.target.value) : null} : null)}
                            className="w-full bg-iron-black border border-iron-gray px-3 py-2 text-iron-white text-sm focus:outline-none focus:border-iron-orange"
                            placeholder="0"
                            min="0"
                            step="0.1"
                          />
                        </div>
                        <div>
                          <label className="block text-iron-gray text-xs uppercase mb-1">Fat (g)</label>
                          <input
                            type="number"
                            value={editedMeal?.fat_g || ''}
                            onChange={(e) => setEditedMeal(prev => prev ? {...prev, fat_g: e.target.value ? parseFloat(e.target.value) : null} : null)}
                            className="w-full bg-iron-black border border-iron-gray px-3 py-2 text-iron-white text-sm focus:outline-none focus:border-iron-orange"
                            placeholder="0"
                            min="0"
                            step="0.1"
                          />
                        </div>
                        <div>
                          <label className="block text-iron-gray text-xs uppercase mb-1">Fiber (g)</label>
                          <input
                            type="number"
                            value={editedMeal?.fiber_g || ''}
                            onChange={(e) => setEditedMeal(prev => prev ? {...prev, fiber_g: e.target.value ? parseFloat(e.target.value) : null} : null)}
                            className="w-full bg-iron-black border border-iron-gray px-3 py-2 text-iron-white text-sm focus:outline-none focus:border-iron-orange"
                            placeholder="0"
                            min="0"
                            step="0.1"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditedMeal(parsedMeal);
                        }}
                        className="text-iron-gray hover:text-iron-orange text-sm transition-colors"
                      >
                        Cancel Editing
                      </button>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-iron-white font-medium">{parsedMeal.meal_name}</p>
                          <p className="text-iron-gray text-sm">
                            {parsedMeal.meal_category.replace('_', ' ')} • {formatDate(parsedMeal.logged_at)}
                          </p>
                        </div>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="text-iron-gray hover:text-iron-orange transition-colors"
                          title="Edit details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>

                      {(parsedMeal.calories || parsedMeal.protein_g || parsedMeal.carbs_g || parsedMeal.fat_g) && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-iron-gray/50">
                          {parsedMeal.calories !== null && (
                            <div>
                              <p className="text-iron-gray text-xs uppercase">Calories</p>
                              <p className="text-iron-white text-lg font-bold">{parsedMeal.calories}</p>
                            </div>
                          )}
                          {parsedMeal.protein_g !== null && (
                            <div>
                              <p className="text-iron-gray text-xs uppercase">Protein</p>
                              <p className="text-iron-white text-lg font-bold">{parsedMeal.protein_g}g</p>
                            </div>
                          )}
                          {parsedMeal.carbs_g !== null && (
                            <div>
                              <p className="text-iron-gray text-xs uppercase">Carbs</p>
                              <p className="text-iron-white text-lg font-bold">{parsedMeal.carbs_g}g</p>
                            </div>
                          )}
                          {parsedMeal.fat_g !== null && (
                            <div>
                              <p className="text-iron-gray text-xs uppercase">Fat</p>
                              <p className="text-iron-white text-lg font-bold">{parsedMeal.fat_g}g</p>
                            </div>
                          )}
                          {parsedMeal.fiber_g !== null && (
                            <div>
                              <p className="text-iron-gray text-xs uppercase">Fiber</p>
                              <p className="text-iron-white text-lg font-bold">{parsedMeal.fiber_g}g</p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Assumptions */}
                {parsedMeal.assumptions && parsedMeal.assumptions.length > 0 && (
                  <div className="bg-yellow-900/20 border border-yellow-600/50 p-3 space-y-2">
                    <p className="text-yellow-500 text-sm font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Assumptions Made
                    </p>
                    <ul className="text-yellow-500/80 text-xs space-y-1">
                      {parsedMeal.assumptions.map((assumption, idx) => (
                        <li key={idx}>• {assumption}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleConfirm}
                    disabled={isSaving}
                    className="flex-1 bg-iron-orange text-iron-black font-heading py-3 uppercase tracking-wider hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Confirm & Save
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="flex-1 border border-iron-gray text-iron-white font-heading py-3 uppercase tracking-wider hover:bg-iron-gray/20 transition-colors disabled:opacity-50"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}