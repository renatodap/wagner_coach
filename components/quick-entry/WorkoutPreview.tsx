'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Check, Edit3, TrendingUp, Zap } from 'lucide-react';
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

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💪</span>
          <h3 className="text-lg font-semibold">Workout Entry</h3>
        </div>
        {data.data.estimated && (
          <div className="flex items-center gap-2 bg-amber-500 px-3 py-1 rounded-full text-sm">
            <Zap size={14} />
            <span>{Math.round(data.confidence * 100)}% confident</span>
          </div>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Workout Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Workout Name
          </label>
          <input
            type="text"
            value={editedFields.workout_name || primary.workout_name}
            onChange={(e) => setEditedFields({ ...editedFields, workout_name: e.target.value })}
            disabled={!editMode}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
          />
        </div>

        {/* Duration & RPE */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={editedFields.duration_minutes || primary.duration_minutes || ''}
                onChange={(e) => setEditedFields({ ...editedFields, duration_minutes: parseInt(e.target.value) })}
                disabled={!editMode}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                placeholder="45"
              />
              <span className="text-gray-600">min</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              RPE (Effort)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={secondary.rpe || ''}
              disabled={!editMode}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
              placeholder="1-10"
            />
          </div>
        </div>

        {/* Exercises */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Exercises
          </label>
          <div className="space-y-3">
            {primary.exercises?.map((exercise, index) => (
              <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-semibold text-gray-900">{exercise.name}</div>
                  {editMode && (
                    <button className="text-gray-400 hover:text-red-500">
                      <Edit3 size={16} />
                    </button>
                  )}
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  <div>
                    <span className="font-medium">{exercise.sets}</span> sets ×
                    <span className="font-medium ml-1">{exercise.reps}</span> reps @
                    <span className="font-medium ml-1">{exercise.weight_lbs} lbs</span>
                  </div>
                  {exercise.weight_per_side && (
                    <div className="text-gray-600">
                      ({exercise.weight_per_side} lbs per side)
                    </div>
                  )}
                  {exercise.note && (
                    <div className="text-gray-600 italic">{exercise.note}</div>
                  )}
                  <div className="text-blue-600 font-medium mt-2">
                    Volume: {(exercise.sets * (typeof exercise.reps === 'number' ? exercise.reps : 8) * exercise.weight_lbs).toLocaleString()} lbs
                  </div>
                </div>
              </div>
            ))}
          </div>
          {editMode && (
            <button className="mt-3 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors">
              + Add Exercise
            </button>
          )}
        </div>

        {/* Total Volume */}
        {secondary.volume_load && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-4 text-white text-center">
            <div className="text-sm opacity-90">Total Volume</div>
            <div className="text-4xl font-bold mt-1">
              {secondary.volume_load.toLocaleString()} lbs 💪
            </div>
          </div>
        )}

        {/* Progressive Overload Badge */}
        {secondary.volume_load && (
          <div className="flex items-center justify-center gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-lg">
            <TrendingUp size={20} />
            <span className="font-medium">
              Solid volume! Keep up the progressive overload.
            </span>
          </div>
        )}

        {/* Expand Button */}
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

        {/* Expanded Section */}
        {expanded && (
          <div className="space-y-6 pt-4 border-t border-gray-200">
            {/* Muscle Groups */}
            {secondary.muscle_groups && secondary.muscle_groups.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Muscle Groups</h4>
                <div className="flex flex-wrap gap-2">
                  {secondary.muscle_groups.map((group, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium capitalize"
                    >
                      {group}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Stats</h4>
              <div className="grid grid-cols-2 gap-3">
                {secondary.estimated_calories && (
                  <div className="bg-gray-50 px-4 py-3 rounded-lg">
                    <div className="text-sm text-gray-600">Calories Burned</div>
                    <div className="text-lg font-semibold text-gray-900">{secondary.estimated_calories}</div>
                  </div>
                )}
                <div className="bg-gray-50 px-4 py-3 rounded-lg">
                  <div className="text-sm text-gray-600">Recovery Needed</div>
                  <div className="text-lg font-semibold text-gray-900">36 hours</div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {secondary.tags && secondary.tags.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {secondary.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
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
        {data.suggestions.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="font-medium text-blue-900 mb-2">💡 Tips</p>
            <ul className="text-sm text-blue-800 space-y-1">
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
          onClick={() => onSave(editedFields)}
          className="flex-1 bg-green-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
        >
          <Check size={20} />
          Save Workout
        </button>
        <button
          onClick={() => setEditMode(!editMode)}
          className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
        >
          <Edit3 size={20} />
          {editMode ? 'Done' : 'Edit'}
        </button>
      </div>
    </div>
  );
}
