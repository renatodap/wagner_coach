'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, GripVertical } from 'lucide-react';

export interface ActivitySet {
  set_number: number;
  reps_completed?: number;
  weight_lbs?: number;
  weight_kg?: number;
  rpe?: number;
  rest_seconds?: number;
  completed: boolean;
  notes?: string;
}

export interface ActivityExercise {
  exercise_name: string;
  sets: ActivitySet[];
  order_index: number;
  notes?: string;
}

interface ExerciseSetBuilderProps {
  exercises: ActivityExercise[];
  onChange: (exercises: ActivityExercise[]) => void;
}

export default function ExerciseSetBuilder({ exercises, onChange }: ExerciseSetBuilderProps) {
  const [useKg, setUseKg] = useState(false);

  const addExercise = () => {
    const newExercise: ActivityExercise = {
      exercise_name: '',
      sets: [],
      order_index: exercises.length,
      notes: ''
    };
    onChange([...exercises, newExercise]);
  };

  const removeExercise = (index: number) => {
    const updated = exercises.filter((_, i) => i !== index);
    // Re-index exercises
    updated.forEach((ex, i) => ex.order_index = i);
    onChange(updated);
  };

  const updateExercise = (index: number, field: keyof ActivityExercise, value: any) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const addSet = (exerciseIndex: number) => {
    const exercise = exercises[exerciseIndex];
    const newSet: ActivitySet = {
      set_number: exercise.sets.length + 1,
      reps_completed: undefined,
      weight_lbs: useKg ? undefined : 0,
      weight_kg: useKg ? 0 : undefined,
      rpe: undefined,
      rest_seconds: undefined,
      completed: true,
      notes: ''
    };
    updateExercise(exerciseIndex, 'sets', [...exercise.sets, newSet]);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const exercise = exercises[exerciseIndex];
    const updatedSets = exercise.sets.filter((_, i) => i !== setIndex);
    // Re-number sets
    updatedSets.forEach((set, i) => set.set_number = i + 1);
    updateExercise(exerciseIndex, 'sets', updatedSets);
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: keyof ActivitySet, value: any) => {
    const exercise = exercises[exerciseIndex];
    const updatedSets = [...exercise.sets];
    updatedSets[setIndex] = { ...updatedSets[setIndex], [field]: value };
    updateExercise(exerciseIndex, 'sets', updatedSets);
  };

  return (
    <div className="space-y-6">
      {/* Weight Unit Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-iron-gray uppercase">Exercises & Sets</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-iron-gray">Weight Unit:</span>
          <button
            type="button"
            onClick={() => setUseKg(!useKg)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              !useKg ? 'bg-iron-orange text-iron-black' : 'bg-iron-gray/20 text-iron-gray'
            }`}
          >
            LBS
          </button>
          <button
            type="button"
            onClick={() => setUseKg(!useKg)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              useKg ? 'bg-iron-orange text-iron-black' : 'bg-iron-gray/20 text-iron-gray'
            }`}
          >
            KG
          </button>
        </div>
      </div>

      {/* Exercises List */}
      {exercises.map((exercise, exerciseIndex) => (
        <div key={exerciseIndex} className="border border-iron-gray/30 rounded-lg p-4 space-y-4">
          {/* Exercise Header */}
          <div className="flex items-start gap-3">
            <button type="button" className="cursor-grab mt-3">
              <GripVertical className="w-5 h-5 text-iron-gray" />
            </button>
            <div className="flex-1 space-y-3">
              {/* Exercise Name */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={exercise.exercise_name}
                  onChange={(e) => updateExercise(exerciseIndex, 'exercise_name', e.target.value)}
                  placeholder="Exercise name (e.g., Bench Press)"
                  className="flex-1 bg-iron-black border border-iron-gray px-4 py-2 text-iron-white focus:outline-none focus:border-iron-orange transition-colors rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeExercise(exerciseIndex)}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Sets Table */}
              {exercise.sets.length > 0 && (
                <div className="space-y-2">
                  {/* Table Header */}
                  <div className="grid grid-cols-5 gap-2 text-xs text-iron-gray uppercase font-medium px-2">
                    <div>Set</div>
                    <div>Reps</div>
                    <div>Weight ({useKg ? 'kg' : 'lbs'})</div>
                    <div>RPE</div>
                    <div></div>
                  </div>

                  {/* Sets Rows */}
                  {exercise.sets.map((set, setIndex) => (
                    <div key={setIndex} className="grid grid-cols-5 gap-2 items-center">
                      <div className="text-iron-white font-medium text-center">{set.set_number}</div>
                      <input
                        type="number"
                        value={set.reps_completed || ''}
                        onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps_completed', parseInt(e.target.value) || undefined)}
                        placeholder="12"
                        className="bg-iron-black border border-iron-gray px-2 py-1 text-iron-white text-center focus:outline-none focus:border-iron-orange transition-colors rounded"
                      />
                      <input
                        type="number"
                        step="0.5"
                        value={useKg ? (set.weight_kg || '') : (set.weight_lbs || '')}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || undefined;
                          if (useKg) {
                            updateSet(exerciseIndex, setIndex, 'weight_kg', value);
                            updateSet(exerciseIndex, setIndex, 'weight_lbs', value ? value * 2.20462 : undefined);
                          } else {
                            updateSet(exerciseIndex, setIndex, 'weight_lbs', value);
                            updateSet(exerciseIndex, setIndex, 'weight_kg', value ? value / 2.20462 : undefined);
                          }
                        }}
                        placeholder={useKg ? "60" : "135"}
                        className="bg-iron-black border border-iron-gray px-2 py-1 text-iron-white text-center focus:outline-none focus:border-iron-orange transition-colors rounded"
                      />
                      <input
                        type="number"
                        value={set.rpe || ''}
                        onChange={(e) => updateSet(exerciseIndex, setIndex, 'rpe', parseInt(e.target.value) || undefined)}
                        placeholder="7"
                        min="1"
                        max="10"
                        className="bg-iron-black border border-iron-gray px-2 py-1 text-iron-white text-center focus:outline-none focus:border-iron-orange transition-colors rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removeSet(exerciseIndex, setIndex)}
                        className="p-1 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Set Button */}
              <Button
                type="button"
                onClick={() => addSet(exerciseIndex)}
                variant="outline"
                size="sm"
                className="w-full border-iron-gray text-iron-white hover:bg-iron-gray/20"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Set
              </Button>
            </div>
          </div>
        </div>
      ))}

      {/* Add Exercise Button */}
      <Button
        type="button"
        onClick={addExercise}
        className="w-full bg-iron-orange hover:bg-iron-orange/90 text-iron-black"
      >
        <Plus className="w-5 h-5 mr-2" />
        Add Exercise
      </Button>

      {exercises.length === 0 && (
        <p className="text-center text-iron-gray text-sm py-8">
          No exercises added yet. Click &quot;Add Exercise&quot; to start building your workout.
        </p>
      )}
    </div>
  );
}
