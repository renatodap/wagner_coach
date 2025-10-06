'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
      <div>
        <h3 className="text-lg font-semibold mb-4">🏃 Activity Details</h3>
      </div>

      {/* Activity Name */}
      <div className="space-y-2">
        <Label htmlFor="activity-name">Activity Name</Label>
        <Input
          id="activity-name"
          value={data.activity_name || ''}
          onChange={(e) => updateField('activity_name', e.target.value)}
          placeholder="e.g., Morning Run"
        />
      </div>

      {/* Activity Type */}
      <div className="space-y-2">
        <Label htmlFor="activity-type">Activity Type</Label>
        <Input
          id="activity-type"
          value={data.activity_type || ''}
          onChange={(e) => updateField('activity_type', e.target.value)}
          placeholder="e.g., Running, Cycling, Swimming"
        />
      </div>

      {/* Duration and Distance */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            value={data.duration_minutes || ''}
            onChange={(e) => updateField('duration_minutes', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="45"
            min="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="distance">Distance (km)</Label>
          <Input
            id="distance"
            type="number"
            value={data.distance_km || ''}
            onChange={(e) => updateField('distance_km', e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="7.5"
            min="0"
            step="0.1"
          />
        </div>
      </div>

      {/* Pace and Calories */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pace">Pace (optional)</Label>
          <Input
            id="pace"
            value={data.pace || ''}
            onChange={(e) => updateField('pace', e.target.value)}
            placeholder="e.g., 6:00/km"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="calories">Calories Burned</Label>
          <Input
            id="calories"
            type="number"
            value={data.calories_burned || ''}
            onChange={(e) => updateField('calories_burned', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="550"
            min="0"
          />
        </div>
      </div>

      {/* RPE and Mood */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rpe">RPE (1-10)</Label>
          <Input
            id="rpe"
            type="number"
            value={data.rpe || ''}
            onChange={(e) => updateField('rpe', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="7"
            min="1"
            max="10"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mood">Mood</Label>
          <Input
            id="mood"
            value={data.mood || ''}
            onChange={(e) => updateField('mood', e.target.value)}
            placeholder="e.g., Great, Tired"
          />
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
    </Card>
  )
}
