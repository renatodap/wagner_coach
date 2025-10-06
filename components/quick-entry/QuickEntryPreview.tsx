'use client';

/**
 * Main Quick Entry Preview Component
 * Routes to type-specific preview components based on entry_type
 */

import React from 'react';
import { QuickEntryPreviewResponse } from './types';
import MealPreview from './MealPreview';
import WorkoutPreview from './WorkoutPreview';
import ActivityPreview from './ActivityPreview';
import { AlertTriangle } from 'lucide-react';

interface QuickEntryPreviewProps {
  data: QuickEntryPreviewResponse;
  onSave: (editedData: any) => void;
  onEdit: () => void;
  onCancel: () => void;
}

export default function QuickEntryPreview({ data, onSave, onEdit, onCancel }: QuickEntryPreviewProps) {
  // Handle errors
  if (!data.success || data.error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-start gap-3 text-red-600">
          <AlertTriangle size={24} className="flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-lg">Processing Error</h3>
            <p className="text-sm mt-1">{data.error || 'Failed to process entry'}</p>
            <button
              onClick={onCancel}
              className="mt-4 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Route to appropriate preview component
  switch (data.entry_type) {
    case 'meal':
      return <MealPreview data={data} onSave={onSave} onEdit={onEdit} />;

    case 'workout':
      return <WorkoutPreview data={data} onSave={onSave} onEdit={onEdit} />;

    case 'activity':
      return <ActivityPreview data={data} onSave={onSave} onEdit={onEdit} />;

    case 'note':
      // TODO: Implement NotePreview
      return <GenericPreview data={data} onSave={onSave} onEdit={onEdit} />;

    case 'measurement':
      // TODO: Implement MeasurementPreview
      return <GenericPreview data={data} onSave={onSave} onEdit={onEdit} />;

    case 'unknown':
    default:
      return (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle size={24} className="text-amber-500" />
            <div>
              <h3 className="font-semibold text-lg">Unclear Entry Type</h3>
              <p className="text-sm text-gray-600 mt-1">
                Could not determine the type of entry. Please try being more specific.
              </p>
              <div className="mt-4 space-x-2">
                <button
                  onClick={onCancel}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      );
  }
}

// Generic preview for types not yet implemented
function GenericPreview({ data, onSave, onEdit }: any) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4">
        {data.entry_type.charAt(0).toUpperCase() + data.entry_type.slice(1)} Entry
      </h3>
      <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
        {JSON.stringify(data.data.primary_fields, null, 2)}
      </pre>
      <div className="mt-4 flex gap-3">
        <button
          onClick={() => onSave(data.data.primary_fields)}
          className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600"
        >
          Save Entry
        </button>
        <button
          onClick={onEdit}
          className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
        >
          Edit
        </button>
      </div>
    </div>
  );
}
