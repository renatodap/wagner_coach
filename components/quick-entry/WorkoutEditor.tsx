'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
      <div>
        <h3 className="text-lg font-semibold mb-4">💪 Workout Details</h3>
      </div>

      {/* Workout Name */}
      <div className="space-y-2">
        <Label htmlFor="workout-name">Workout Name</Label>
        <Input
          id="workout-name"
          value={data.workout_name || ''}
          onChange={(e) => updateField('workout_name', e.target.value)}
          placeholder="e.g., Upper Body Push Day"
        />
      </div>

      {/* Workout Type */}
      <div className="space-y-2">
        <Label htmlFor="workout-type">Workout Type</Label>
        <Input
          id="workout-type"
          value={data.workout_type || ''}
          onChange={(e) => updateField('workout_type', e.target.value)}
          placeholder="e.g., Strength, Hypertrophy, Endurance"
        />
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
                <Input
                  id={`sets-${index}`}
                  type="number"
                  value={exercise.sets || ''}
                  onChange={(e) => updateExercise(index, 'sets', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="3"
                  min="0"
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
                <Input
                  id={`weight-${index}`}
                  type="number"
                  value={exercise.weight_lbs || ''}
                  onChange={(e) => updateExercise(index, 'weight_lbs', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="135"
                  min="0"
                  step="5"
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
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            value={data.duration_minutes || ''}
            onChange={(e) => updateField('duration_minutes', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="60"
            min="0"
          />
        </div>
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
    </Card>
  )
}
