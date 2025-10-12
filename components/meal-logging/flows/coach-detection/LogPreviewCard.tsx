/**
 * Log Preview Card Component
 *
 * Shows detected log data (meal, workout, measurement) for user confirmation.
 * Follows 2026 AI SaaS principles: calm, clear, actionable, reduces friction.
 *
 * User can:
 * - Confirm (saves immediately)
 * - Edit (opens modal with fields)
 * - Cancel (dismisses)
 */

'use client'

import { useState } from 'react'
import { Check, Edit2, X, Loader2, Apple, Dumbbell, Scale, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { LogPreview, LogType } from '@/lib/api/unified-coach'

interface LogPreviewCardProps {
  preview: LogPreview
  onConfirm: (data: Record<string, any>) => Promise<void>
  onCancel: () => void
  className?: string
}

// Get icon for log type
function getLogIcon(logType: LogType) {
  switch (logType) {
    case 'meal':
      return Apple
    case 'workout':
      return Dumbbell
    case 'activity':
      return Activity
    case 'measurement':
      return Scale
  }
}

// Get color for log type
function getLogColor(logType: LogType): string {
  switch (logType) {
    case 'meal':
      return 'text-green-500'
    case 'workout':
      return 'text-blue-500'
    case 'activity':
      return 'text-purple-500'
    case 'measurement':
      return 'text-orange-500'
  }
}

// Format log data for display
function formatLogData(logType: LogType, data: Record<string, any>): Array<{ label: string; value: string }> {
  switch (logType) {
    case 'meal':
      return [
        { label: 'Meal Type', value: data.meal_type || 'Unknown' },
        { label: 'Calories', value: `${data.calories || 0} cal` },
        { label: 'Protein', value: `${data.protein || 0}g` },
        { label: 'Carbs', value: `${data.carbs || 0}g` },
        { label: 'Fats', value: `${data.fats || 0}g` },
        { label: 'Foods', value: (data.foods || []).join(', ') || 'None listed' },
      ]
    case 'workout':
      return [
        { label: 'Type', value: data.workout_type || 'Workout' },
        { label: 'Duration', value: `${data.duration_minutes || 0} min` },
        { label: 'Exercises', value: `${(data.exercises || []).length} exercises` },
      ]
    case 'activity':
      return [
        { label: 'Type', value: data.activity_type || 'Activity' },
        { label: 'Duration', value: `${data.duration_minutes || 0} min` },
        { label: 'Distance', value: data.distance_km ? `${data.distance_km} km` : 'N/A' },
      ]
    case 'measurement':
      return [
        { label: 'Type', value: data.measurement_type || 'Measurement' },
        { label: 'Value', value: data.value ? `${data.value} ${data.unit || ''}` : 'N/A' },
      ]
  }
}

export function LogPreviewCard({ preview, onConfirm, onCancel, className = '' }: LogPreviewCardProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const Icon = getLogIcon(preview.log_type)
  const iconColor = getLogColor(preview.log_type)
  const formattedData = formatLogData(preview.log_type, preview.data)

  async function handleConfirm() {
    setIsConfirming(true)
    setError(null)

    try {
      await onConfirm(preview.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save log')
    } finally {
      setIsConfirming(false)
    }
  }

  function handleEdit() {
    // TODO: Open edit modal (Phase 2)
    setIsEditing(true)
    // For now, just confirm with current data
    handleConfirm()
  }

  return (
    <Card
      className={`
        p-4 space-y-4
        bg-gradient-to-br from-gray-50 to-white
        border-2 border-gray-200
        shadow-sm
        animate-in slide-in-from-bottom-2 duration-300
        ${className}
      `}
      data-testid="log-preview-card"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gray-100 ${iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 capitalize">
                {preview.log_type} Detected
              </h3>
              <Badge
                variant={preview.confidence > 0.9 ? 'default' : 'secondary'}
                className="text-xs"
              >
                {Math.round(preview.confidence * 100)}% confident
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mt-0.5">
              {preview.summary}
            </p>
          </div>
        </div>
      </div>

      {/* Data Grid */}
      <div className="grid grid-cols-2 gap-3 py-2 border-t border-gray-200">
        {formattedData.map(({ label, value }, index) => (
          <div key={index} className="space-y-0.5">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              {label}
            </p>
            <p className="text-sm text-gray-900 font-medium">
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* AI Reasoning (subtle, collapsed by default) */}
      {preview.reasoning && (
        <details className="text-xs text-gray-500 border-t border-gray-200 pt-3">
          <summary className="cursor-pointer hover:text-gray-700 font-medium">
            Why was this detected?
          </summary>
          <p className="mt-2 text-gray-600">
            {preview.reasoning}
          </p>
        </details>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-gray-200">
        {/* Confirm (primary action - green, prominent) */}
        <Button
          onClick={handleConfirm}
          disabled={isConfirming}
          className="
            flex-1 bg-green-600 hover:bg-green-700 text-white
            font-medium transition-colors
            focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2
          "
          data-testid="confirm-log-button"
        >
          {isConfirming ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Confirm
            </>
          )}
        </Button>

        {/* Edit (secondary action) */}
        <Button
          onClick={handleEdit}
          disabled={isConfirming}
          variant="outline"
          className="px-4"
          data-testid="edit-log-button"
          title="Edit log data"
        >
          <Edit2 className="w-4 h-4" />
        </Button>

        {/* Cancel (tertiary action) */}
        <Button
          onClick={onCancel}
          disabled={isConfirming}
          variant="ghost"
          className="px-4 text-gray-600 hover:text-gray-900"
          data-testid="cancel-log-button"
          title="Cancel log"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Subtle hint about editing (progressive disclosure) */}
      {!isEditing && preview.confidence < 0.9 && (
        <p className="text-xs text-gray-500 text-center pt-1">
          💡 Click Edit to adjust values before confirming
        </p>
      )}
    </Card>
  )
}
