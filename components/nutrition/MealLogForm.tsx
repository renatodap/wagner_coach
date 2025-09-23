'use client';

import React, { useState } from 'react';
import PhotoCapture from './PhotoCapture';
import AIAnalysis from './AIAnalysis';
import AIReview from './AIReview';
import { Camera, Edit3 } from 'lucide-react';
import { MealInsert, AIAnalysisResult } from '@/types/nutrition';

interface MealLogFormProps {
  onSubmit?: (mealData: any) => void;
  onCancel?: () => void;
}

type EntryMode = 'manual' | 'photo' | 'ai-analysis' | 'ai-review';

export function MealLogForm({ onSubmit, onCancel }: MealLogFormProps) {
  const [entryMode, setEntryMode] = useState<EntryMode>('manual');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [aiResult, setAIResult] = useState<AIAnalysisResult | null>(null);
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

  const handlePhotoCapture = (imageData: string) => {
    setCapturedImage(imageData);
    setEntryMode('ai-analysis');
  };

  const handleAIAnalysisComplete = (result: AIAnalysisResult) => {
    setAIResult(result);
    setEntryMode('ai-review');
  };

  const handleAIError = (error: string) => {
    console.error('AI Analysis error:', error);
    // Fall back to manual entry with a message
    setEntryMode('manual');
  };

  const handleAIConfirm = (finalMealData: MealInsert) => {
    // Convert to the format expected by onSubmit
    setMealData({
      name: finalMealData.name,
      calories: finalMealData.calories?.toString() || '',
      protein: finalMealData.protein_g?.toString() || '',
      carbs: finalMealData.carbs_g?.toString() || '',
      fat: finalMealData.fat_g?.toString() || '',
      fiber: finalMealData.fiber_g?.toString() || '',
      meal_type: finalMealData.meal_type || 'lunch',
      notes: finalMealData.notes || ''
    });

    // Switch to manual mode to show the populated form
    setEntryMode('manual');
  };

  const handleReanalyze = () => {
    setEntryMode('ai-analysis');
  };

  const handleManualEdit = () => {
    setEntryMode('manual');
  };

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

      {/* Entry Mode Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setEntryMode('manual')}
          className={`flex-1 px-4 py-2 font-medium transition-colors ${
            entryMode === 'manual'
              ? 'bg-iron-orange text-iron-black'
              : 'bg-iron-black border border-iron-gray text-iron-gray hover:text-iron-white'
          }`}
        >
          <Edit3 className="inline mr-2" size={16} />
          Manual Entry
        </button>
        <button
          type="button"
          onClick={() => setEntryMode('photo')}
          className={`flex-1 px-4 py-2 font-medium transition-colors ${
            entryMode === 'photo' || entryMode === 'ai-analysis' || entryMode === 'ai-review'
              ? 'bg-iron-orange text-iron-black'
              : 'bg-iron-black border border-iron-gray text-iron-gray hover:text-iron-white'
          }`}
        >
          <Camera className="inline mr-2" size={16} />
          Analyze Photo
        </button>
      </div>

      {/* Photo Capture Mode */}
      {entryMode === 'photo' && (
        <PhotoCapture
          onPhotoCapture={handlePhotoCapture}
          onCancel={() => setEntryMode('manual')}
          isProcessing={false}
        />
      )}

      {/* AI Analysis Mode */}
      {entryMode === 'ai-analysis' && capturedImage && (
        <AIAnalysis
          imageData={capturedImage}
          onAnalysisComplete={handleAIAnalysisComplete}
          onError={handleAIError}
        />
      )}

      {/* AI Review Mode */}
      {entryMode === 'ai-review' && aiResult && capturedImage && (
        <AIReview
          aiResult={aiResult}
          originalImage={capturedImage}
          onConfirm={handleAIConfirm}
          onReanalyze={handleReanalyze}
          onManualEdit={handleManualEdit}
        />
      )}

      {/* Manual Entry Mode */}
      {entryMode === 'manual' && (
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
      )}
    </div>
  );
}