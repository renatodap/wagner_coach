'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { Plus, X } from 'lucide-react'
import type { WorkoutData } from '@/lib/api/quick-entry'

interface WorkoutEditorProps {
  data: Partial<WorkoutData>
  onChange: (data: Partial<WorkoutData>) => void
}

export function WorkoutEditor({ data, onChange }: WorkoutEditorProps) {
  const updateField = (field: keyof WorkoutData, value: any) => {
    onChange({ ...data, [field]: value })
  }

  const addExercise = () => {
    const exercises = data.exercises || []
    onChange({
      ...data,
      exercises: [...exercises, { name: '', sets: 3, reps: 10, weight_lbs: 0 }],
    })
  }

  const updateExercise = (index: number, field: string, value: any) => {
    const exercises = [...(data.exercises || [])]
    exercises[index] = { ...exercises[index], [field]: value }
    onChange({ ...data, exercises })
  }

  const removeExercise = (index: number) => {
    const exercises = [...(data.exercises || [])]
    exercises.splice(index, 1)
    onChange({ ...data, exercises })
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">💪 Workout Details</h3>
        {(data.confidence !== undefined || data.estimated_from) && (
          <ConfidenceBadge
            confidence={data.confidence}
            estimatedFrom={data.estimated_from}
          />
        )}
      </div>

      {/* Timestamp */}
      <TimestampPicker
        id="started-at"
        label="When did you start?"
        value={data.started_at}
        onChange={(value) => updateField('started_at', value)}
      />

      {/* Workout Type */}
      <div className="space-y-2">
        <Label htmlFor="workout-type">Workout Type</Label>
        <Select
          value={data.workout_type || ''}
          onValueChange={(value) => updateField('workout_type', value)}
        >
          <SelectTrigger id="workout-type">
            <SelectValue placeholder="Select workout type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="strength">🏋️ Strength</SelectItem>
            <SelectItem value="hypertrophy">💪 Hypertrophy</SelectItem>
            <SelectItem value="endurance">🔥 Endurance</SelectItem>
            <SelectItem value="cardio">❤️ Cardio</SelectItem>
            <SelectItem value="flexibility">🧘 Flexibility</SelectItem>
            <SelectItem value="sports">⚽ Sports</SelectItem>
            <SelectItem value="other">📝 Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Exercises */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Exercises</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addExercise}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Exercise
          </Button>
        </div>

        {(data.exercises || []).map((exercise, index) => (
          <div key={index} className="space-y-2 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-2">
              <Input
                value={exercise.name}
                onChange={(e) => updateExercise(index, 'name', e.target.value)}
                placeholder="Exercise name (e.g., Bench Press)"
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeExercise(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor={`sets-${index}`} className="text-xs">Sets</Label>
                <NumberStepper
                  id={`sets-${index}`}
                  value={exercise.sets}
                  onChange={(value) => updateExercise(index, 'sets', value)}
                  min={1}
                  max={20}
                  step={1}
                />
              </div>
              <div>
                <Label htmlFor={`reps-${index}`} className="text-xs">Reps</Label>
                <Input
                  id={`reps-${index}`}
                  value={exercise.reps || ''}
                  onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                  placeholder="10"
                />
              </div>
              <div>
                <Label htmlFor={`weight-${index}`} className="text-xs">Weight (lbs)</Label>
                <NumberStepper
                  id={`weight-${index}`}
                  value={exercise.weight_lbs}
                  onChange={(value) => updateExercise(index, 'weight_lbs', value)}
                  min={0}
                  max={1000}
                  step={5}
                  unit="lbs"
                />
              </div>
            </div>
          </div>
        ))}

        {(!data.exercises || data.exercises.length === 0) && (
          <p className="text-sm text-gray-500 italic">No exercises added yet</p>
        )}
      </div>

      {/* Duration and Ratings */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration">Duration</Label>
          <NumberStepper
            id="duration"
            value={data.duration_minutes}
            onChange={(value) => updateField('duration_minutes', value)}
            min={1}
            max={480}
            step={5}
            unit="min"
          />
        </div>
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
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          value={data.notes || ''}
          onChange={(e) => updateField('notes', e.target.value)}
          placeholder="How did the workout feel? Any PRs?"
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
