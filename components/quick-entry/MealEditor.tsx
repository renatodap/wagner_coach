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
import type { MealData } from '@/lib/api/quick-entry'

interface MealEditorProps {
  data: Partial<MealData>
  onChange: (data: Partial<MealData>) => void
}

export function MealEditor({ data, onChange }: MealEditorProps) {
  const updateField = (field: keyof MealData, value: any) => {
    onChange({ ...data, [field]: value })
  }

  const addFood = () => {
    const foods = data.foods || []
    onChange({ ...data, foods: [...foods, { name: '', quantity: '' }] })
  }

  const updateFood = (index: number, field: 'name' | 'quantity', value: string) => {
    const foods = [...(data.foods || [])]
    foods[index] = { ...foods[index], [field]: value }
    onChange({ ...data, foods })
  }

  const removeFood = (index: number) => {
    const foods = [...(data.foods || [])]
    foods.splice(index, 1)
    onChange({ ...data, foods })
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">🍽️ Meal Details</h3>
        {(data.confidence !== undefined || data.estimated_from) && (
          <ConfidenceBadge
            confidence={data.confidence}
            estimatedFrom={data.estimated_from}
          />
        )}
      </div>

      {/* Timestamp */}
      <TimestampPicker
        id="logged-at"
        label="When did you eat?"
        value={data.logged_at}
        onChange={(value) => updateField('logged_at', value)}
      />

      {/* Meal Type */}
      <div className="space-y-2">
        <Label htmlFor="meal-type">Meal Type</Label>
        <Select
          value={data.meal_type || 'snack'}
          onValueChange={(value) => updateField('meal_type', value as any)}
        >
          <SelectTrigger id="meal-type">
            <SelectValue placeholder="Select meal type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="breakfast">🌅 Breakfast</SelectItem>
            <SelectItem value="lunch">☀️ Lunch</SelectItem>
            <SelectItem value="dinner">🌙 Dinner</SelectItem>
            <SelectItem value="snack">🍎 Snack</SelectItem>
            <SelectItem value="other">📌 Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Foods List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Foods</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addFood}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Food
          </Button>
        </div>

        {(data.foods || []).map((food, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={food.name}
              onChange={(e) => updateFood(index, 'name', e.target.value)}
              placeholder="Food name"
              className="flex-1"
            />
            <Input
              value={food.quantity}
              onChange={(e) => updateFood(index, 'quantity', e.target.value)}
              placeholder="Quantity (e.g., 6 oz)"
              className="w-32"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeFood(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {(!data.foods || data.foods.length === 0) && (
          <p className="text-sm text-gray-500 italic">No foods added yet</p>
        )}
      </div>

      {/* Macros */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-gray-700">Nutrition</h4>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="calories">Calories</Label>
            <NumberStepper
              id="calories"
              value={data.calories}
              onChange={(value) => updateField('calories', value)}
              min={0}
              max={10000}
              step={10}
              unit="cal"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="protein">Protein</Label>
            <NumberStepper
              id="protein"
              value={data.protein_g}
              onChange={(value) => updateField('protein_g', value)}
              min={0}
              max={1000}
              step={1}
              unit="g"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="carbs">Carbs</Label>
            <NumberStepper
              id="carbs"
              value={data.carbs_g}
              onChange={(value) => updateField('carbs_g', value)}
              min={0}
              max={1000}
              step={1}
              unit="g"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fat">Fat</Label>
            <NumberStepper
              id="fat"
              value={data.fat_g}
              onChange={(value) => updateField('fat_g', value)}
              min={0}
              max={1000}
              step={1}
              unit="g"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fiber">Fiber (optional)</Label>
            <NumberStepper
              id="fiber"
              value={data.fiber_g}
              onChange={(value) => updateField('fiber_g', value)}
              min={0}
              max={200}
              step={1}
              unit="g"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sugar">Sugar (optional)</Label>
            <NumberStepper
              id="sugar"
              value={data.sugar_g}
              onChange={(value) => updateField('sugar_g', value)}
              min={0}
              max={500}
              step={1}
              unit="g"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          value={data.notes || ''}
          onChange={(e) => updateField('notes', e.target.value)}
          placeholder="Any additional notes about this meal..."
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
