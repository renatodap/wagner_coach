'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Sparkles, Send, X, Check, AlertCircle } from 'lucide-react';

type EntryType = 'meal' | 'activity' | 'workout' | 'unknown';

interface ParsedEntry {
  type: EntryType;
  data: any;
  confidence: number;
  suggestions?: string[];
}

export default function QuickEntry() {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const router = useRouter();

  const analyzeEntry = async (text: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Call AI to determine entry type and parse data
      const response = await fetch('/api/quick-entry/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze entry');
      }

      const result = await response.json();
      setParsedData(result);
      setShowConfirmation(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isProcessing) {
      analyzeEntry(inputText);
    }
  };

  const confirmEntry = async () => {
    if (!parsedData) return;

    setIsProcessing(true);
    const supabase = createClient();

    try {
      switch (parsedData.type) {
        case 'meal':
          // Save meal to database
          const { error: mealError } = await supabase
            .from('meals')
            .insert({
              user_id: (await supabase.auth.getUser()).data.user?.id,
              meal_name: parsedData.data.name,
              meal_category: parsedData.data.meal_type || 'snack',
              calories: parsedData.data.calories,
              protein_g: parsedData.data.protein_g,
              carbs_g: parsedData.data.carbs_g,
              fat_g: parsedData.data.fat_g,
              fiber_g: parsedData.data.fiber_g,
              logged_at: new Date().toISOString(),
            });

          if (mealError) throw mealError;
          router.push('/nutrition');
          break;

        case 'activity':
          // Save activity to database
          const { error: activityError } = await supabase
            .from('activities')
            .insert({
              user_id: (await supabase.auth.getUser()).data.user?.id,
              activity_name: parsedData.data.name,
              activity_type: parsedData.data.type,
              duration_minutes: parsedData.data.duration,
              calories_burned: parsedData.data.calories,
              notes: parsedData.data.notes,
              activity_date: new Date().toISOString(),
            });

          if (activityError) throw activityError;
          router.push('/activities');
          break;

        case 'workout':
          // Save workout to database
          const { error: workoutError } = await supabase
            .from('workouts')
            .insert({
              user_id: (await supabase.auth.getUser()).data.user?.id,
              name: parsedData.data.name,
              description: parsedData.data.description,
              exercises: parsedData.data.exercises,
              is_public: false,
              created_at: new Date().toISOString(),
            });

          if (workoutError) throw workoutError;
          router.push('/workouts');
          break;

        default:
          throw new Error('Unknown entry type');
      }

      // Reset state after successful save
      setInputText('');
      setParsedData(null);
      setShowConfirmation(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save entry');
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelConfirmation = () => {
    setShowConfirmation(false);
    setParsedData(null);
  };

  const getEntryTypeColor = (type: EntryType) => {
    switch (type) {
      case 'meal': return 'text-green-600';
      case 'activity': return 'text-blue-600';
      case 'workout': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getEntryTypeIcon = (type: EntryType) => {
    switch (type) {
      case 'meal': return '🍽️';
      case 'activity': return '🏃';
      case 'workout': return '💪';
      default: return '❓';
    }
  };

  return (
    <div className="quick-entry-container bg-iron-black border border-iron-gray p-6 rounded-lg">
      <div className="mb-4">
        <h3 className="text-xl font-heading text-iron-orange flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Quick Entry
        </h3>
        <p className="text-sm text-iron-gray mt-1">
          Type anything - a meal, workout, or activity. AI will understand.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Examples: 'Chicken salad with 400 calories', 'Ran 5 miles in 45 minutes', 'Chest day workout with bench press and flies'..."
            className="w-full px-4 py-3 bg-iron-black border border-iron-gray text-iron-white rounded-lg focus:outline-none focus:border-iron-orange transition-colors min-h-[100px] resize-none"
            disabled={isProcessing}
          />
          {isProcessing && (
            <div className="absolute inset-0 bg-iron-black/80 flex items-center justify-center rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-iron-orange"></div>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-500 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-sm text-red-500">{error}</p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!inputText.trim() || isProcessing}
          className="w-full px-4 py-3 bg-iron-orange text-iron-black font-heading uppercase tracking-wider rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Send className="w-5 h-5" />
          Analyze & Add
        </button>
      </form>

      {/* Confirmation Dialog */}
      {showConfirmation && parsedData && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-iron-black border border-iron-gray rounded-lg p-6 max-w-md w-full">
            <div className="mb-4">
              <h4 className="text-lg font-heading text-iron-orange flex items-center gap-2">
                Confirm Entry
              </h4>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-2xl">{getEntryTypeIcon(parsedData.type)}</span>
                <span className={`font-medium ${getEntryTypeColor(parsedData.type)}`}>
                  {parsedData.type.charAt(0).toUpperCase() + parsedData.type.slice(1)}
                </span>
                <span className="text-sm text-iron-gray">
                  ({Math.round(parsedData.confidence * 100)}% confident)
                </span>
              </div>
            </div>

            <div className="mb-6 p-4 bg-iron-gray/10 rounded-lg">
              {parsedData.type === 'meal' && (
                <div className="space-y-2">
                  <p className="text-iron-white font-medium">{parsedData.data.name}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-iron-gray">
                    <div>Calories: {parsedData.data.calories}</div>
                    <div>Protein: {parsedData.data.protein_g}g</div>
                    <div>Carbs: {parsedData.data.carbs_g}g</div>
                    <div>Fat: {parsedData.data.fat_g}g</div>
                  </div>
                </div>
              )}

              {parsedData.type === 'activity' && (
                <div className="space-y-2">
                  <p className="text-iron-white font-medium">{parsedData.data.name}</p>
                  <div className="text-sm text-iron-gray">
                    <div>Duration: {parsedData.data.duration} minutes</div>
                    <div>Calories burned: {parsedData.data.calories}</div>
                  </div>
                </div>
              )}

              {parsedData.type === 'workout' && (
                <div className="space-y-2">
                  <p className="text-iron-white font-medium">{parsedData.data.name}</p>
                  <div className="text-sm text-iron-gray">
                    <div>{parsedData.data.exercises?.length || 0} exercises</div>
                    <div>{parsedData.data.description}</div>
                  </div>
                </div>
              )}
            </div>

            {parsedData.suggestions && parsedData.suggestions.length > 0 && (
              <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-600 rounded-lg">
                <p className="text-sm text-yellow-500">Suggestions:</p>
                <ul className="list-disc list-inside text-sm text-yellow-400 mt-1">
                  {parsedData.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={confirmEntry}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Confirm
              </button>
              <button
                onClick={cancelConfirmation}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 border border-iron-gray text-iron-white rounded-lg hover:bg-iron-gray/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}