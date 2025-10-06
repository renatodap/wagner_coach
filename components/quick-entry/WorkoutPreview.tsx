'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Check, Edit3, TrendingUp, AlertTriangle, Trash2, Plus, GripVertical } from 'lucide-react';
import { WorkoutPrimaryFields, WorkoutSecondaryFields, QuickEntryPreviewResponse } from './types';

interface WorkoutPreviewProps {
  data: QuickEntryPreviewResponse;
  onSave: (editedData: any) => void;
  onEdit: () => void;
}

interface ExerciseSet {
  reps: number;
  weight_lbs: number;
}

interface EditableExercise {
  name: string;
  sets: ExerciseSet[];
  note?: string;
}

export default function WorkoutPreview({ data, onSave, onEdit }: WorkoutPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [rpe, setRpe] = useState(0);
  const [exercises, setExercises] = useState<EditableExercise[]>([]);

  const primary = data.data.primary_fields as WorkoutPrimaryFields;
  const secondary = data.data.secondary_fields as WorkoutSecondaryFields;

  // Initialize state from props
  useEffect(() => {
    setWorkoutName(primary.workout_name || '');
    setDurationMinutes(primary.duration_minutes || 0);
    setRpe(secondary.rpe || 0);

    // Transform exercises from flat structure to per-set structure
    const transformedExercises: EditableExercise[] = (primary.exercises || []).map(ex => {
      const numSets = ex.sets || 3;
      const repsPerSet = typeof ex.reps === 'number' ? ex.reps : parseInt(ex.reps) || 10;
      const weightPerSet = ex.weight_lbs || 0;

      return {
        name: ex.name,
        note: ex.note,
        sets: Array.from({ length: numSets }, () => ({
          reps: repsPerSet,
          weight_lbs: weightPerSet
        }))
      };
    });

    setExercises(transformedExercises);
  }, [primary, secondary]);

  const handleSave = () => {
    // Transform back to backend format
    const backendFormat = {
      workout_name: workoutName,
      duration_minutes: durationMinutes,
      rpe: rpe,
      exercises: exercises.map(ex => ({
        name: ex.name,
        sets: ex.sets.length,
        reps: ex.sets[0]?.reps || 10,  // Use first set's reps as default
        weight_lbs: ex.sets[0]?.weight_lbs || 0,  // Use first set's weight as default
        note: ex.note,
        // Include full sets array for backend
        sets_detail: ex.sets
      }))
    };

    onSave(backendFormat);
  };

  // Exercise editing functions
  const updateExerciseName = (index: number, name: string) => {
    const updated = [...exercises];
    updated[index].name = name;
    setExercises(updated);
  };

  const updateExerciseNote = (index: number, note: string) => {
    const updated = [...exercises];
    updated[index].note = note;
    setExercises(updated);
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight_lbs', value: number) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets[setIndex][field] = value;
    setExercises(updated);
  };

  const addSet = (exerciseIndex: number) => {
    const updated = [...exercises];
    const lastSet = updated[exerciseIndex].sets[updated[exerciseIndex].sets.length - 1];
    updated[exerciseIndex].sets.push({
      reps: lastSet?.reps || 10,
      weight_lbs: lastSet?.weight_lbs || 0
    });
    setExercises(updated);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const updated = [...exercises];
    if (updated[exerciseIndex].sets.length > 1) {
      updated[exerciseIndex].sets.splice(setIndex, 1);
      setExercises(updated);
    }
  };

  const deleteExercise = (index: number) => {
    const updated = exercises.filter((_, i) => i !== index);
    setExercises(updated);
  };

  const addExercise = () => {
    setExercises([...exercises, {
      name: 'New Exercise',
      sets: [{ reps: 10, weight_lbs: 0 }]
    }]);
  };

  // Calculate total volume
  const calculateTotalVolume = () => {
    return exercises.reduce((total, ex) => {
      const exerciseVolume = ex.sets.reduce((sum, set) => sum + (set.reps * set.weight_lbs), 0);
      return total + exerciseVolume;
    }, 0);
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

      <div className="p-6 space-y-6">
        {/* Workout Name */}
        <div>
          <label className="block text-sm font-medium text-iron-gray uppercase tracking-wider mb-2">
            Workout Name
          </label>
          {editMode ? (
            <input
              type="text"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              className="w-full px-4 py-3 bg-iron-black text-iron-white border-2 border-iron-gray rounded-xl focus:ring-2 focus:ring-iron-orange focus:border-iron-orange outline-none text-lg"
              placeholder="Enter workout name"
            />
          ) : (
            <div className="text-2xl font-heading text-iron-orange uppercase">
              {workoutName}
            </div>
          )}
        </div>

        {/* Duration & RPE Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-iron-gray uppercase tracking-wider mb-2">
              Duration
            </label>
            {editMode ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={durationMinutes || ''}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-iron-black text-iron-white border-2 border-iron-gray rounded-xl focus:ring-2 focus:ring-iron-orange focus:border-iron-orange outline-none text-lg"
                  placeholder="45"
                />
                <span className="text-iron-gray text-sm uppercase">min</span>
              </div>
            ) : (
              <div className="bg-iron-orange rounded-xl p-4 text-white text-center">
                <div className="text-4xl font-heading">{durationMinutes || '?'}</div>
                <div className="text-sm opacity-90 mt-1 uppercase tracking-wide">minutes</div>
              </div>
            )}
          </div>

          {/* RPE */}
          <div>
            <label className="block text-sm font-medium text-iron-gray uppercase tracking-wider mb-2">
              RPE (Effort)
            </label>
            {editMode ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={rpe || ''}
                  onChange={(e) => setRpe(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-iron-black text-iron-white border-2 border-iron-gray rounded-xl focus:ring-2 focus:ring-iron-orange focus:border-iron-orange outline-none text-lg"
                  placeholder="1-10"
                />
              </div>
            ) : rpe ? (
              <div className="bg-iron-orange rounded-xl p-4 text-white text-center">
                <div className="text-4xl font-heading">{rpe}/10</div>
                <div className="text-sm opacity-90 mt-1 uppercase tracking-wide">effort</div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Exercises */}
        <div>
          <label className="block text-sm font-medium text-iron-gray uppercase tracking-wider mb-3">
            Exercises
          </label>
          <div className="space-y-3">
            {exercises.map((exercise, exIndex) => (
              <div key={exIndex} className="bg-iron-black/50 rounded-xl p-4 border-2 border-iron-gray">
                {/* Exercise Header */}
                <div className="flex items-start justify-between mb-3">
                  {editMode ? (
                    <input
                      type="text"
                      value={exercise.name}
                      onChange={(e) => updateExerciseName(exIndex, e.target.value)}
                      className="flex-1 px-3 py-2 bg-iron-black text-iron-orange border border-iron-gray rounded-lg focus:ring-2 focus:ring-iron-orange outline-none font-heading text-lg uppercase"
                      placeholder="Exercise name"
                    />
                  ) : (
                    <div className="font-heading text-xl text-iron-orange uppercase">{exercise.name}</div>
                  )}

                  {editMode && (
                    <button
                      onClick={() => deleteExercise(exIndex)}
                      className="ml-3 text-iron-gray hover:text-red-500 transition-colors"
                      aria-label="Delete exercise"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                {/* Sets */}
                {editMode ? (
                  <div className="space-y-2">
                    {exercise.sets.map((set, setIndex) => (
                      <div key={setIndex} className="flex items-center gap-2">
                        <span className="text-iron-gray text-sm font-medium w-12">Set {setIndex + 1}</span>

                        {/* Reps */}
                        <input
                          type="number"
                          value={set.reps}
                          onChange={(e) => updateSet(exIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
                          className="w-20 px-3 py-2 bg-iron-black text-iron-white border border-iron-gray rounded-lg focus:ring-2 focus:ring-iron-orange outline-none text-center"
                          placeholder="reps"
                        />
                        <span className="text-iron-gray text-sm">reps</span>

                        <span className="text-iron-gray">@</span>

                        {/* Weight */}
                        <input
                          type="number"
                          value={set.weight_lbs}
                          onChange={(e) => updateSet(exIndex, setIndex, 'weight_lbs', parseInt(e.target.value) || 0)}
                          className="w-24 px-3 py-2 bg-iron-black text-iron-white border border-iron-gray rounded-lg focus:ring-2 focus:ring-iron-orange outline-none text-center"
                          placeholder="weight"
                        />
                        <span className="text-iron-gray text-sm">lbs</span>

                        {/* Delete Set Button */}
                        {exercise.sets.length > 1 && (
                          <button
                            onClick={() => removeSet(exIndex, setIndex)}
                            className="ml-auto text-iron-gray hover:text-red-500 transition-colors"
                            aria-label="Remove set"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Add Set Button */}
                    <button
                      onClick={() => addSet(exIndex)}
                      className="w-full py-2 mt-2 border border-dashed border-iron-gray rounded-lg text-iron-gray hover:border-iron-orange hover:text-iron-orange transition-colors text-sm uppercase tracking-wide font-medium flex items-center justify-center gap-2"
                    >
                      <Plus size={16} />
                      Add Set
                    </button>
                  </div>
                ) : (
                  // View Mode - Show sets summary
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading text-2xl text-iron-orange">{exercise.sets.length}</span>
                      <span className="text-iron-gray">sets</span>
                    </div>

                    {/* Show each set */}
                    {exercise.sets.map((set, setIndex) => (
                      <div key={setIndex} className="flex items-center gap-2 text-sm">
                        <span className="text-iron-gray w-12">Set {setIndex + 1}:</span>
                        <span className="text-iron-white font-medium">{set.reps} reps</span>
                        <span className="text-iron-gray">@</span>
                        <span className="text-iron-white font-medium">{set.weight_lbs} lbs</span>
                        <span className="text-iron-gray ml-auto">
                          {(set.reps * set.weight_lbs).toLocaleString()} lbs volume
                        </span>
                      </div>
                    ))}

                    {/* Total volume for this exercise */}
                    <div className="bg-iron-orange/20 text-iron-orange px-3 py-1 rounded-full inline-block mt-2 text-xs uppercase tracking-wide font-medium">
                      Exercise Volume: {exercise.sets.reduce((sum, set) => sum + (set.reps * set.weight_lbs), 0).toLocaleString()} lbs 💪
                    </div>
                  </div>
                )}

                {/* Exercise Note */}
                {editMode && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={exercise.note || ''}
                      onChange={(e) => updateExerciseNote(exIndex, e.target.value)}
                      className="w-full px-3 py-2 bg-iron-black text-iron-gray border border-iron-gray rounded-lg focus:ring-2 focus:ring-iron-orange outline-none text-sm italic"
                      placeholder="Add note (optional)"
                    />
                  </div>
                )}
                {!editMode && exercise.note && (
                  <div className="text-iron-gray italic mt-2 text-sm">{exercise.note}</div>
                )}
              </div>
            ))}
          </div>

          {/* Add Exercise Button */}
          {editMode && (
            <button
              onClick={addExercise}
              className="mt-3 w-full py-3 border-2 border-dashed border-iron-gray rounded-xl text-iron-gray hover:border-iron-orange hover:text-iron-orange transition-colors uppercase tracking-wide font-medium flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Add Exercise
            </button>
          )}
        </div>

        {/* Total Volume */}
        {exercises.length > 0 && (
          <div className="bg-iron-orange rounded-xl p-6 text-white text-center">
            <div className="text-sm opacity-90 uppercase tracking-wide">Total Volume</div>
            <div className="text-5xl font-heading mt-2">
              {calculateTotalVolume().toLocaleString()}
            </div>
            <div className="text-sm opacity-90 mt-1 uppercase tracking-wide">lbs 💪</div>
          </div>
        )}

        {/* Progressive Overload Badge */}
        {calculateTotalVolume() > 0 && (
          <div className="flex items-center justify-center gap-2 bg-iron-gray/50 text-iron-orange px-4 py-3 rounded-xl border-2 border-iron-gray">
            <TrendingUp size={20} />
            <span className="font-medium uppercase tracking-wide">
              Solid volume! Keep up the progressive overload.
            </span>
          </div>
        )}

        {/* AI Suggestions */}
        {data.suggestions.length > 0 && (
          <div className="bg-iron-gray/50 border-2 border-iron-gray p-4 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div className="flex-1">
                <p className="font-medium text-iron-orange uppercase tracking-wider text-sm mb-2">AI Tips</p>
                <div className="text-sm text-iron-white space-y-1">
                  {data.suggestions.map((suggestion, i) => (
                    <p key={i}>• {suggestion}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Expand Button */}
        {(secondary.muscle_groups?.length > 0 || secondary.tags?.length > 0) && (
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

        {/* Expanded Section */}
        {expanded && (
          <div className="space-y-4 pt-4 border-t-2 border-iron-gray">
            {/* Muscle Groups */}
            {secondary.muscle_groups && secondary.muscle_groups.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-iron-gray uppercase tracking-wider mb-2">
                  Muscle Groups
                </label>
                <div className="flex flex-wrap gap-2">
                  {secondary.muscle_groups.map((group, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-iron-orange/20 text-iron-orange border border-iron-orange rounded-full text-sm font-medium uppercase tracking-wide"
                    >
                      {group}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            {secondary.estimated_calories && (
              <div>
                <label className="block text-sm font-medium text-iron-gray uppercase tracking-wider mb-2">
                  Stats
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-iron-gray/50 px-4 py-3 rounded-xl">
                    <div className="text-xs text-iron-gray uppercase tracking-wide">Calories Burned</div>
                    <div className="text-2xl font-heading text-iron-orange">{secondary.estimated_calories}</div>
                  </div>
                  <div className="bg-iron-gray/50 px-4 py-3 rounded-xl">
                    <div className="text-xs text-iron-gray uppercase tracking-wide">Recovery Needed</div>
                    <div className="text-2xl font-heading text-iron-orange">36h</div>
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
                  {secondary.tags.map((tag, index) => (
                    <span
                      key={index}
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
              Save Workout
            </button>
            <button
              onClick={() => {
                // Reset to original data
                setWorkoutName(primary.workout_name || '');
                setDurationMinutes(primary.duration_minutes || 0);
                setRpe(secondary.rpe || 0);

                const transformedExercises: EditableExercise[] = (primary.exercises || []).map(ex => {
                  const numSets = ex.sets || 3;
                  const repsPerSet = typeof ex.reps === 'number' ? ex.reps : parseInt(ex.reps) || 10;
                  const weightPerSet = ex.weight_lbs || 0;

                  return {
                    name: ex.name,
                    note: ex.note,
                    sets: Array.from({ length: numSets }, () => ({
                      reps: repsPerSet,
                      weight_lbs: weightPerSet
                    }))
                  };
                });

                setExercises(transformedExercises);
                setEditMode(false);
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
              Save Workout
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
