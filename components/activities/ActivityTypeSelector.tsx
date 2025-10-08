'use client';

import React from 'react';
import type { ActivityType } from '@/types/activity';
import { ACTIVITY_TYPE_ICONS, ACTIVITY_TYPE_LABELS } from '@/types/activity';

interface ActivityTypeSelectorProps {
  selectedType?: ActivityType;
  onSelectType: (type: ActivityType) => void;
}

const ACTIVITY_TYPE_ORDER: ActivityType[] = [
  'running',
  'cycling',
  'swimming',
  'walking',
  'hiking',
  'strength_training',
  'crossfit',
  'tennis',
  'soccer',
  'basketball',
  'yoga',
  'climbing',
  'workout'
];

export default function ActivityTypeSelector({
  selectedType,
  onSelectType
}: ActivityTypeSelectorProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">Select Activity Type</h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {ACTIVITY_TYPE_ORDER.map((type) => (
          <button
            key={type}
            onClick={() => onSelectType(type)}
            className={`
              group relative
              p-4 rounded-xl
              border-2 transition-all duration-200
              flex flex-col items-center gap-2
              ${
                selectedType === type
                  ? 'bg-iron-orange border-iron-orange text-white shadow-lg'
                  : 'bg-iron-gray border-iron-gray/30 text-iron-white hover:border-iron-orange/50 hover:bg-iron-gray/80'
              }
            `}
          >
            {/* Icon */}
            <span className="text-3xl" role="img" aria-label={ACTIVITY_TYPE_LABELS[type]}>
              {ACTIVITY_TYPE_ICONS[type]}
            </span>

            {/* Label */}
            <span className="text-sm font-medium text-center leading-tight">
              {ACTIVITY_TYPE_LABELS[type]}
            </span>

            {/* Selection indicator */}
            {selectedType === type && (
              <div className="absolute top-2 right-2">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
