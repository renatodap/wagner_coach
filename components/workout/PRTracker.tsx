'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Trophy, Award, Zap } from 'lucide-react';

interface PRTrackerProps {
  exerciseId: number;
  exerciseName: string;
  currentWeight: number;
  currentReps: number;
  userId: string;
  onPRBroken?: (prType: string) => void;
}

interface PersonalRecord {
  maxWeight: number;
  maxReps: number;
  maxVolume: number;
  maxWeightDate?: string;
  maxRepsDate?: string;
  maxVolumeDate?: string;
}

export default function PRTracker({
  exerciseId,
  exerciseName,
  currentWeight,
  currentReps,
  userId,
  onPRBroken
}: PRTrackerProps) {
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord | null>(null);
  const [newPRs, setNewPRs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchPersonalRecords();
  }, [exerciseId]);

  useEffect(() => {
    checkForNewPRs();
  }, [currentWeight, currentReps, personalRecords]);

  const fetchPersonalRecords = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('exercise_completions')
        .select(`
          weight_kg,
          reps_completed,
          workout_completions!inner(
            user_id,
            completed_at
          )
        `)
        .eq('exercise_id', exerciseId)
        .eq('workout_completions.user_id', userId);

      if (data && data.length > 0) {
        let maxWeight = 0;
        let maxReps = 0;
        let maxVolume = 0;
        let maxWeightDate = '';
        let maxRepsDate = '';
        let maxVolumeDate = '';

        data.forEach((entry: any) => {
          const entryMaxWeight = Math.max(...(entry.weight_kg || [0]));
          const entryMaxReps = Math.max(...(entry.reps_completed || [0]));
          const entryVolume = entry.weight_kg?.reduce((sum: number, weight: number, index: number) => {
            return sum + (weight * (entry.reps_completed?.[index] || 0));
          }, 0) || 0;

          if (entryMaxWeight > maxWeight) {
            maxWeight = entryMaxWeight;
            maxWeightDate = entry.workout_completions.completed_at;
          }
          if (entryMaxReps > maxReps) {
            maxReps = entryMaxReps;
            maxRepsDate = entry.workout_completions.completed_at;
          }
          if (entryVolume > maxVolume) {
            maxVolume = entryVolume;
            maxVolumeDate = entry.workout_completions.completed_at;
          }
        });

        setPersonalRecords({
          maxWeight,
          maxReps,
          maxVolume,
          maxWeightDate,
          maxRepsDate,
          maxVolumeDate
        });
      }
    } catch (error) {
      console.error('Error fetching PRs:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkForNewPRs = () => {
    if (!personalRecords || currentWeight === 0 || currentReps === 0) return;

    const prs: string[] = [];
    const currentVolume = currentWeight * currentReps;

    if (currentWeight > personalRecords.maxWeight) {
      prs.push('Weight');
    }
    if (currentReps > personalRecords.maxReps) {
      prs.push('Reps');
    }
    if (currentVolume > personalRecords.maxVolume) {
      prs.push('Volume');
    }

    if (prs.length > 0 && prs.toString() !== newPRs.toString()) {
      setNewPRs(prs);
      setShowCelebration(true);
      prs.forEach(pr => onPRBroken?.(pr));

      // Hide celebration after 5 seconds
      setTimeout(() => setShowCelebration(false), 5000);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <>
      {/* PR Status Bar */}
      <div className="border border-iron-gray p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-iron-gray text-xs uppercase">Personal Records</span>
          <Trophy className="w-4 h-4 text-iron-orange" />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className={`p-2 ${newPRs.includes('Weight') ? 'bg-iron-orange/20 border border-iron-orange' : 'bg-iron-gray/10'}`}>
            <p className="text-iron-gray text-xs">Max Weight</p>
            <p className="font-heading text-lg text-iron-white">
              {personalRecords?.maxWeight || 0} kg
            </p>
            {newPRs.includes('Weight') && (
              <p className="text-iron-orange text-xs animate-pulse">NEW!</p>
            )}
          </div>

          <div className={`p-2 ${newPRs.includes('Reps') ? 'bg-iron-orange/20 border border-iron-orange' : 'bg-iron-gray/10'}`}>
            <p className="text-iron-gray text-xs">Max Reps</p>
            <p className="font-heading text-lg text-iron-white">
              {personalRecords?.maxReps || 0}
            </p>
            {newPRs.includes('Reps') && (
              <p className="text-iron-orange text-xs animate-pulse">NEW!</p>
            )}
          </div>

          <div className={`p-2 ${newPRs.includes('Volume') ? 'bg-iron-orange/20 border border-iron-orange' : 'bg-iron-gray/10'}`}>
            <p className="text-iron-gray text-xs">Max Vol</p>
            <p className="font-heading text-lg text-iron-white">
              {Math.round(personalRecords?.maxVolume || 0)}
            </p>
            {newPRs.includes('Volume') && (
              <p className="text-iron-orange text-xs animate-pulse">NEW!</p>
            )}
          </div>
        </div>
      </div>

      {/* Celebration Modal */}
      {showCelebration && newPRs.length > 0 && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-iron-black border-4 border-iron-orange p-8 max-w-sm mx-4">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Award className="w-20 h-20 text-iron-orange animate-bounce" />
                  <Zap className="w-8 h-8 text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
                </div>
              </div>

              <h2 className="font-heading text-4xl text-iron-orange mb-2">
                NEW PR!
              </h2>

              <p className="text-iron-white text-lg mb-4">
                {exerciseName}
              </p>

              <div className="space-y-2">
                {newPRs.includes('Weight') && (
                  <p className="text-iron-white">
                    <span className="text-iron-orange font-heading text-2xl">
                      {currentWeight} KG
                    </span>
                    <span className="text-iron-gray text-sm ml-2">
                      (Previous: {personalRecords?.maxWeight || 0} kg)
                    </span>
                  </p>
                )}
                {newPRs.includes('Reps') && (
                  <p className="text-iron-white">
                    <span className="text-iron-orange font-heading text-2xl">
                      {currentReps} REPS
                    </span>
                    <span className="text-iron-gray text-sm ml-2">
                      (Previous: {personalRecords?.maxReps || 0})
                    </span>
                  </p>
                )}
                {newPRs.includes('Volume') && (
                  <p className="text-iron-white">
                    <span className="text-iron-orange font-heading text-2xl">
                      {currentWeight * currentReps} VOLUME
                    </span>
                    <span className="text-iron-gray text-sm ml-2">
                      (Previous: {Math.round(personalRecords?.maxVolume || 0)})
                    </span>
                  </p>
                )}
              </div>

              <p className="text-iron-orange font-heading text-xl mt-6 animate-pulse">
                BEAST MODE ACTIVATED!
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-in-out;
        }
      `}</style>
    </>
  );
}