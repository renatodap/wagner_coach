'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Check, Edit3, TrendingUp, AlertTriangle } from 'lucide-react';
import { WorkoutPrimaryFields, WorkoutSecondaryFields, QuickEntryPreviewResponse } from './types';

interface WorkoutPreviewProps {
  data: QuickEntryPreviewResponse;
  onSave: (editedData: any) => void;
  onEdit: () => void;
}

export default function WorkoutPreview({ data, onSave, onEdit }: WorkoutPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedFields, setEditedFields] = useState<any>(data.data.primary_fields);

  const primary = data.data.primary_fields as WorkoutPrimaryFields;
  const secondary = data.data.secondary_fields as WorkoutSecondaryFields;

  const updateField = (field: string, value: any) => {
    setEditedFields({ ...editedFields, [field]: value });
  };

  const handleSave = () => {
    onSave(editedFields);
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
              value={editedFields.workout_name || ''}
              onChange={(e) => updateField('workout_name', e.target.value)}
              className="w-full px-4 py-3 bg-iron-black text-iron-white border-2 border-iron-gray rounded-xl focus:ring-2 focus:ring-iron-orange focus:border-iron-orange outline-none text-lg"
              placeholder="Enter workout name"
            />
          ) : (
            <div className="text-2xl font-heading text-iron-orange uppercase">
              {primary.workout_name}
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
                  value={editedFields.duration_minutes || ''}
                  onChange={(e) => updateField('duration_minutes', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-iron-black text-iron-white border-2 border-iron-gray rounded-xl focus:ring-2 focus:ring-iron-orange focus:border-iron-orange outline-none text-lg"
                  placeholder="45"
                />
                <span className="text-iron-gray text-sm uppercase">min</span>
              </div>
            ) : (
              <div className="bg-iron-orange rounded-xl p-4 text-white text-center">
                <div className="text-4xl font-heading">{primary.duration_minutes || '?'}</div>
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
                  value={editedFields.rpe || secondary.rpe || ''}
                  onChange={(e) => updateField('rpe', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-iron-black text-iron-white border-2 border-iron-gray rounded-xl focus:ring-2 focus:ring-iron-orange focus:border-iron-orange outline-none text-lg"
                  placeholder="1-10"
                />
              </div>
            ) : secondary.rpe ? (
              <div className="bg-iron-orange rounded-xl p-4 text-white text-center">
                <div className="text-4xl font-heading">{secondary.rpe}/10</div>
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
            {primary.exercises?.map((exercise, index) => (
              <div key={index} className="bg-iron-black/50 rounded-xl p-4 border-2 border-iron-gray">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-heading text-xl text-iron-orange uppercase">{exercise.name}</div>
                  {editMode && (
                    <button className="text-iron-gray hover:text-red-500 transition-colors">
                      <Edit3 size={16} />
                    </button>
                  )}
                </div>
                <div className="text-sm text-iron-white space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-2xl text-iron-orange">{exercise.sets}</span>
                    <span className="text-iron-gray">sets ×</span>
                    <span className="font-heading text-2xl text-iron-orange">{exercise.reps}</span>
                    <span className="text-iron-gray">reps @</span>
                    <span className="font-heading text-2xl text-iron-orange">{exercise.weight_lbs}</span>
                    <span className="text-iron-gray">lbs</span>
                  </div>
                  {exercise.weight_per_side && (
                    <div className="text-iron-gray text-xs">
                      ({exercise.weight_per_side} lbs per side)
                    </div>
                  )}
                  {exercise.note && (
                    <div className="text-iron-gray italic mt-2">{exercise.note}</div>
                  )}
                  <div className="bg-iron-orange/20 text-iron-orange px-3 py-1 rounded-full inline-block mt-2 text-xs uppercase tracking-wide font-medium">
                    Volume: {(exercise.sets * (typeof exercise.reps === 'number' ? exercise.reps : 8) * exercise.weight_lbs).toLocaleString()} lbs 💪
                  </div>
                </div>
              </div>
            ))}
          </div>
          {editMode && (
            <button className="mt-3 w-full py-3 border-2 border-dashed border-iron-gray rounded-xl text-iron-gray hover:border-iron-orange hover:text-iron-orange transition-colors uppercase tracking-wide font-medium">
              + Add Exercise
            </button>
          )}
        </div>

        {/* Total Volume */}
        {secondary.volume_load && (
          <div className="bg-iron-orange rounded-xl p-6 text-white text-center">
            <div className="text-sm opacity-90 uppercase tracking-wide">Total Volume</div>
            <div className="text-5xl font-heading mt-2">
              {secondary.volume_load.toLocaleString()}
            </div>
            <div className="text-sm opacity-90 mt-1 uppercase tracking-wide">lbs 💪</div>
          </div>
        )}

        {/* Progressive Overload Badge */}
        {secondary.volume_load && (
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
                setEditedFields(data.data.primary_fields);
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
