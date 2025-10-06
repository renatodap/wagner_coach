'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Check, Edit3, AlertTriangle, Zap } from 'lucide-react';
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
        {/* Activity Name */}
        <div>
          <label className="block text-sm font-medium text-iron-gray uppercase tracking-wider mb-2">
            Activity Name
          </label>
          {editMode ? (
            <input
              type="text"
              value={editedFields.activity_name || ''}
              onChange={(e) => updateField('activity_name', e.target.value)}
              className="w-full px-4 py-3 bg-iron-black text-iron-white border-2 border-iron-gray rounded-xl focus:ring-2 focus:ring-iron-orange focus:border-iron-orange outline-none text-lg"
              placeholder="Morning Run"
            />
          ) : (
            <div className="text-2xl font-heading text-iron-orange uppercase">
              {primary.activity_name}
            </div>
          )}
        </div>

        {/* Activity Type */}
        <div>
          <label className="block text-sm font-medium text-iron-gray uppercase tracking-wider mb-2">
            Activity Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {activityTypes.map((type) => (
              <button
                key={type}
                onClick={() => editMode && updateField('activity_type', type)}
                disabled={!editMode}
                className={`
                  py-3 px-4 rounded-xl font-medium transition-all text-sm uppercase tracking-wide
                  ${
                    (editedFields.activity_type || primary.activity_type) === type
                      ? 'bg-iron-orange text-white shadow-lg'
                      : 'bg-iron-gray text-iron-white hover:bg-iron-gray/70'
                  }
                  ${!editMode && 'cursor-default'}
                `}
              >
                <span className="mr-1 text-lg">{activityEmojis[type]}</span>
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Duration & Distance Grid */}
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
                  onChange={(e) => updateField('duration_minutes', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-iron-black text-iron-white border-2 border-iron-gray rounded-xl focus:ring-2 focus:ring-iron-orange focus:border-iron-orange outline-none text-lg"
                  placeholder="30"
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

          {/* Distance */}
          <div>
            <label className="block text-sm font-medium text-iron-gray uppercase tracking-wider mb-2">
              Distance
            </label>
            {editMode ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={editedFields.distance_miles || ''}
                  onChange={(e) => updateField('distance_miles', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-iron-black text-iron-white border-2 border-iron-gray rounded-xl focus:ring-2 focus:ring-iron-orange focus:border-iron-orange outline-none text-lg"
                  placeholder="4.0"
                />
                <span className="text-iron-gray text-sm uppercase">mi</span>
              </div>
            ) : (
              <div className="bg-iron-orange rounded-xl p-4 text-white text-center">
                <div className="text-4xl font-heading">
                  {primary.distance_miles !== undefined && primary.distance_miles !== null
                    ? primary.distance_miles.toFixed(1)
                    : '?'}
                </div>
                <div className="text-sm opacity-90 mt-1 uppercase tracking-wide">miles</div>
              </div>
            )}
          </div>
        </div>

        {/* Pace (if available) */}
        {primary.pace && (
          <div className="bg-iron-gray/50 border-2 border-iron-gray p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏱️</span>
              <div>
                <p className="text-sm font-medium text-iron-gray uppercase tracking-wider">Pace</p>
                <p className="text-xl font-heading text-iron-orange">{primary.pace}</p>
              </div>
            </div>
          </div>
        )}

        {/* Calories & RPE Grid */}
        {(secondary.calories_burned || secondary.rpe) && (
          <div>
            <label className="block text-sm font-medium text-iron-gray uppercase tracking-wider mb-3">
              Additional Metrics
            </label>
            <div className="grid grid-cols-2 gap-4">
              {secondary.calories_burned && (
                <div className="bg-iron-orange rounded-xl p-4 text-white text-center">
                  <div className="text-3xl font-heading">{secondary.calories_burned}</div>
                  <div className="text-sm opacity-90 mt-1 uppercase tracking-wide">Calories</div>
                </div>
              )}
              {secondary.rpe && (
                <div className="bg-iron-orange rounded-xl p-4 text-white text-center">
                  <div className="text-3xl font-heading">{secondary.rpe}/10</div>
                  <div className="text-sm opacity-90 mt-1 uppercase tracking-wide">RPE</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Suggestions */}
        {data.suggestions.length > 0 && (
          <div className="bg-iron-gray/50 border-2 border-iron-gray p-4 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div className="flex-1">
                <p className="font-medium text-iron-orange uppercase tracking-wider text-sm mb-2">AI Suggestions</p>
                <div className="text-sm text-iron-white space-y-1">
                  {data.suggestions.map((suggestion, i) => (
                    <p key={i}>• {suggestion}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Expand Button for Secondary Details */}
        {secondary.tags && secondary.tags.length > 0 && (
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

        {/* Expanded Details */}
        {expanded && secondary.tags && (
          <div className="space-y-4 pt-4 border-t-2 border-iron-gray">
            <div>
              <label className="block text-sm font-medium text-iron-gray uppercase tracking-wider mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {secondary.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-iron-orange/20 text-iron-orange border border-iron-orange rounded-full text-sm font-medium uppercase tracking-wide"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t-2 border-iron-gray">
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
                Save Activity
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
                Save Activity
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
    </div>
  );
}
