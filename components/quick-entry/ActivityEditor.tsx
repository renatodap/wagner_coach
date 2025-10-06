'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { NumberStepper } from '@/components/ui/number-stepper'
import { TimestampPicker } from '@/components/ui/timestamp-picker'
import { ConfidenceBadge } from '@/components/ui/confidence-badge'
import type { ActivityData } from '@/lib/api/quick-entry'

interface ActivityEditorProps {
  data: Partial<ActivityData>
  onChange: (data: Partial<ActivityData>) => void
}

export function ActivityEditor({ data, onChange }: ActivityEditorProps) {
  const updateField = (field: keyof ActivityData, value: any) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">🏃 Activity Details</h3>
        {(data.confidence !== undefined || data.estimated_from) && (
          <ConfidenceBadge
            confidence={data.confidence}
            estimatedFrom={data.estimated_from}
          />
        )}
      </div>

      {/* Timestamp */}
      <TimestampPicker
        id="start-date"
        label="When did you start?"
        value={data.start_date}
        onChange={(value) => updateField('start_date', value)}
      />

      {/* Activity Type */}
      <div className="space-y-2">
        <Label htmlFor="activity-type">Activity Type</Label>
        <Select
          value={data.activity_type || ''}
          onValueChange={(value) => updateField('activity_type', value)}
        >
          <SelectTrigger id="activity-type">
            <SelectValue placeholder="Select activity type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="running">🏃 Running</SelectItem>
            <SelectItem value="cycling">🚴 Cycling</SelectItem>
            <SelectItem value="swimming">🏊 Swimming</SelectItem>
            <SelectItem value="walking">🚶 Walking</SelectItem>
            <SelectItem value="hiking">⛰️ Hiking</SelectItem>
            <SelectItem value="rowing">🚣 Rowing</SelectItem>
            <SelectItem value="sports">⚽ Sports</SelectItem>
            <SelectItem value="other">📝 Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Duration and Distance */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration">Duration</Label>
          <NumberStepper
            id="duration"
            value={data.duration_minutes}
            onChange={(value) => updateField('duration_minutes', value)}
            min={1}
            max={600}
            step={1}
            unit="min"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="distance">Distance (optional)</Label>
          <NumberStepper
            id="distance"
            value={data.distance_km}
            onChange={(value) => updateField('distance_km', value)}
            min={0}
            max={200}
            step={0.1}
            unit="km"
          />
        </div>
      </div>

      {/* Pace (calculated or manual) */}
      {data.pace && (
        <div className="space-y-2">
          <Label htmlFor="pace">Pace</Label>
          <Input
            id="pace"
            value={data.pace || ''}
            onChange={(e) => updateField('pace', e.target.value)}
            placeholder="e.g., 6:00/km"
            className="bg-gray-50"
          />
          <p className="text-xs text-gray-500">
            {data.distance_km && data.duration_minutes
              ? '✓ Calculated from distance and duration'
              : 'Manual entry'}
          </p>
        </div>
      )}

      {/* Calories */}
      <div className="space-y-2">
        <Label htmlFor="calories">Calories Burned</Label>
        <NumberStepper
          id="calories"
          value={data.calories_burned}
          onChange={(value) => updateField('calories_burned', value)}
          min={0}
          max={5000}
          step={10}
          unit="cal"
        />
      </div>

      {/* RPE and Mood */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rpe">RPE (effort level)</Label>
          <NumberStepper
            id="rpe"
            value={data.rpe}
            onChange={(value) => updateField('rpe', value)}
            min={1}
            max={10}
            step={1}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mood">Mood</Label>
          <Select
            value={data.mood || ''}
            onValueChange={(value) => updateField('mood', value)}
          >
            <SelectTrigger id="mood">
              <SelectValue placeholder="How did you feel?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="great">😁 Great</SelectItem>
              <SelectItem value="good">😊 Good</SelectItem>
              <SelectItem value="okay">😐 Okay</SelectItem>
              <SelectItem value="tired">😴 Tired</SelectItem>
              <SelectItem value="rough">😓 Rough</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          value={data.notes || ''}
          onChange={(e) => updateField('notes', e.target.value)}
          placeholder="How did the activity feel?"
          rows={3}
        />
      </div>

      {/* Info Banner */}
      {data.estimated && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm text-blue-800">
            💡 AI estimated these values. Review and adjust before saving.
          </span>
        </div>
      )}
    </Card>
  )
}
