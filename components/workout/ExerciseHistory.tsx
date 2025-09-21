'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ExerciseHistoryProps {
  exerciseId: number;
  exerciseName: string;
  userId: string;
}

interface HistoryEntry {
  date: string;
  sets: number;
  reps: number[];
  weight: number[];
  maxWeight: number;
}

export default function ExerciseHistory({
  exerciseId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  exerciseName,
  userId
}: ExerciseHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestedWeight, setSuggestedWeight] = useState<number | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchExerciseHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseId]);

  const fetchExerciseHistory = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('exercise_completions')
        .select(`
          *,
          workout_completions!inner(
            completed_at,
            user_id
          )
        `)
        .eq('exercise_id', exerciseId)
        .eq('workout_completions.user_id', userId)
        .order('workout_completions.completed_at', { ascending: false })
        .limit(5);

      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedHistory = data.map((entry: any) => ({
          date: new Date(entry.workout_completions.completed_at).toLocaleDateString(),
          sets: entry.sets_completed,
          reps: entry.reps_completed,
          weight: entry.weight_kg,
          maxWeight: Math.max(...(entry.weight_kg || [0]))
        }));

        setHistory(formattedHistory);

        // Calculate suggested weight (average of last 3 max weights + 2.5kg)
        if (formattedHistory.length > 0) {
          const recentMaxWeights = formattedHistory
            .slice(0, 3)
            .map((h: HistoryEntry) => h.maxWeight)
            .filter((w: number) => w > 0);

          if (recentMaxWeights.length > 0) {
            const avgWeight = recentMaxWeights.reduce((a: number, b: number) => a + b, 0) / recentMaxWeights.length;
            setSuggestedWeight(Math.round(avgWeight / 2.5) * 2.5 + 2.5); // Round to nearest 2.5kg
          }
        }
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = () => {
    if (history.length < 2) return null;

    const currentMax = history[0].maxWeight;
    const previousMax = history[1].maxWeight;

    if (currentMax > previousMax) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (currentMax < previousMax) {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    } else {
      return <Minus className="w-4 h-4 text-iron-gray" />;
    }
  };

  if (loading) {
    return (
      <div className="border border-iron-gray p-4">
        <p className="text-iron-gray text-center">Loading history...</p>
      </div>
    );
  }

  return (
    <div className="border border-iron-gray p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-heading text-xl text-iron-white">
          EXERCISE HISTORY
        </h3>
        {getTrendIcon()}
      </div>

      {suggestedWeight && (
        <div className="mb-4 p-3 bg-iron-orange/10 border border-iron-orange">
          <p className="text-iron-orange text-sm uppercase">
            Suggested Working Weight
          </p>
          <p className="font-heading text-2xl text-iron-white">
            {suggestedWeight} KG
          </p>
          <p className="text-iron-gray text-xs mt-1">
            Based on recent performance
          </p>
        </div>
      )}

      {history.length === 0 ? (
        <p className="text-iron-gray">No previous history for this exercise</p>
      ) : (
        <div className="space-y-3">
          {history.map((entry, index) => (
            <div
              key={index}
              className={`pb-3 ${
                index < history.length - 1 ? 'border-b border-iron-gray/30' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-iron-gray text-sm">{entry.date}</p>
                  <p className="text-iron-white">
                    {entry.sets} sets × {entry.reps.join(', ')} reps
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-iron-orange font-heading text-lg">
                    {entry.maxWeight} KG
                  </p>
                  <p className="text-iron-gray text-xs">
                    Max weight
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-4 pt-4 border-t border-iron-gray/30">
          <p className="text-iron-gray text-xs text-center">
            Showing last {history.length} workout{history.length > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}