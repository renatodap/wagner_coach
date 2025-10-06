'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Check, Edit3, AlertTriangle, Zap, Activity as ActivityIcon } from 'lucide-react';
import { ActivityPrimaryFields, ActivitySecondaryFields, QuickEntryPreviewResponse } from './types';

interface ActivityPreviewProps {
  data: QuickEntryPreviewResponse;
  onSave: (editedData: any) => void;
  onEdit: () => void;
}

export default function ActivityPreview({ data, onSave, onEdit }: ActivityPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedFields, setEditedFields] = useState<any>(data.data.primary_fields);

  const primary = data.data.primary_fields as ActivityPrimaryFields;
  const secondary = data.data.secondary_fields as ActivitySecondaryFields;

  const updateField = (field: string, value: any) => {
    setEditedFields({ ...editedFields, [field]: value });
  };

  const handleSave = () => {
    onSave(editedFields);
  };

  const activityTypes = ['running', 'cycling', 'swimming', 'walking', 'hiking', 'other'];
  const activityEmojis: Record<string, string> = {
    running: '🏃',
    cycling: '🚴',
    swimming: '🏊',
    walking: '🚶',
    hiking: '🥾',
    other: '🏋️'
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{activityEmojis[primary.activity_type] || '🏃'}</span>
          <h3 className="text-lg font-semibold">Activity Entry</h3>
        </div>
        {data.data.estimated && (
          <div className="flex items-center gap-2 bg-amber-500 px-3 py-1 rounded-full text-sm">
            <Zap size={14} />
            <span>Estimated • {Math.round(data.confidence * 100)}% confidence</span>
          </div>
        )}
      </div>

      {/* Warnings */}
      {data.validation.warnings.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 px-6 py-3 flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-amber-900">Needs Clarification</p>
            <ul className="text-sm text-amber-800 mt-1 space-y-1">
              {data.validation.warnings.map((warning, i) => (
                <li key={i}>• {warning}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Critical Missing Data */}
      {data.data.needs_clarification && (
        <div className="bg-red-50 border-l-4 border-red-500 px-6 py-3">
          <p className="text-red-900 font-medium">⚠️ Missing Details</p>
          <p className="text-sm text-red-800 mt-1">
            Add duration or distance for better tracking
          </p>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Activity Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Activity Name
          </label>
          {editMode ? (
            <input
              type="text"
              value={editedFields.activity_name || ''}
              onChange={(e) => updateField('activity_name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          ) : (
            <div className="text-lg font-medium text-gray-900">
              {primary.activity_name}
            </div>
          )}
        </div>

        {/* Activity Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Activity Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {activityTypes.map((type) => (
              <button
                key={type}
                onClick={() => editMode && updateField('activity_type', type)}
                disabled={!editMode}
                className={`
                  py-2 px-4 rounded-lg font-medium transition-all text-sm
                  ${
                    (editedFields.activity_type || primary.activity_type) === type
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                  ${!editMode && 'cursor-default'}
                `}
              >
                <span className="mr-1">{activityEmojis[type]}</span>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Duration & Distance Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration
            </label>
            {editMode ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={editedFields.duration_minutes || ''}
                  onChange={(e) => updateField('duration_minutes', parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="30"
                />
                <span className="text-gray-600 text-sm">min</span>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white text-center">
                <div className="text-3xl font-bold">{primary.duration_minutes || '?'}</div>
                <div className="text-sm opacity-90 mt-1">minutes</div>
              </div>
            )}
          </div>

          {/* Distance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Distance
            </label>
            {editMode ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={editedFields.distance_miles || ''}
                  onChange={(e) => updateField('distance_miles', parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="4.0"
                />
                <span className="text-gray-600 text-sm">mi</span>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white text-center">
                <div className="text-3xl font-bold">
                  {primary.distance_miles !== undefined && primary.distance_miles !== null
                    ? primary.distance_miles.toFixed(1)
                    : '?'}
                </div>
                <div className="text-sm opacity-90 mt-1">miles</div>
              </div>
            )}
          </div>
        </div>

        {/* Pace (if available) */}
        {primary.pace && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏱️</span>
              <div>
                <p className="font-medium text-blue-900">Pace</p>
                <p className="text-lg text-blue-800">{primary.pace}</p>
              </div>
            </div>
          </div>
        )}

        {/* Calories & RPE Grid */}
        {!data.data.needs_clarification && (secondary.calories_burned || secondary.rpe) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Additional Metrics
            </label>
            <div className="grid grid-cols-2 gap-4">
              {secondary.calories_burned && (
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white text-center">
                  <div className="text-3xl font-bold">{secondary.calories_burned}</div>
                  <div className="text-sm opacity-90 mt-1">Calories</div>
                </div>
              )}
              {secondary.rpe && (
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white text-center">
                  <div className="text-3xl font-bold">{secondary.rpe}/10</div>
                  <div className="text-sm opacity-90 mt-1">RPE</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Suggestions */}
        {data.suggestions.length > 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div className="flex-1">
                <p className="font-medium text-blue-900 mb-2">AI Suggestions</p>
                <div className="text-sm text-blue-800 space-y-1">
                  {data.suggestions.map((suggestion, i) => (
                    <p key={i}>{suggestion}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Expand Button for Secondary Details */}
        {!data.data.needs_clarification && secondary.tags && secondary.tags.length > 0 && (
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
        )}

        {/* Expanded Details */}
        {expanded && secondary.tags && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {secondary.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          {editMode ? (
            <>
              <button
                onClick={() => {
                  handleSave();
                  setEditMode(false);
                }}
                className="flex-1 bg-green-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
              >
                <Check size={20} />
                Save Activity
              </button>
              <button
                onClick={() => {
                  setEditedFields(data.data.primary_fields);
                  setEditMode(false);
                }}
                className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="flex-1 bg-green-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
              >
                <Check size={20} />
                Save Activity
              </button>
              <button
                onClick={() => setEditMode(true)}
                className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <Edit3 size={20} />
                Edit
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
