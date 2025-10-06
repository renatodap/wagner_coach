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
      <div>
        <h3 className="text-lg font-semibold mb-4">🍽️ Meal Details</h3>
      </div>

      {/* Meal Name */}
      <div className="space-y-2">
        <Label htmlFor="meal-name">Meal Name</Label>
        <Input
          id="meal-name"
          value={data.meal_name || ''}
          onChange={(e) => updateField('meal_name', e.target.value)}
          placeholder="e.g., Grilled chicken with rice"
        />
      </div>

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

      {/* Macros Row 1 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="calories">Calories</Label>
          <Input
            id="calories"
            type="number"
            value={data.calories || ''}
            onChange={(e) => updateField('calories', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="0"
            min="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="protein">Protein (g)</Label>
          <Input
            id="protein"
            type="number"
            value={data.protein_g || ''}
            onChange={(e) => updateField('protein_g', e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="0"
            min="0"
            step="0.1"
          />
        </div>
      </div>

      {/* Macros Row 2 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="carbs">Carbs (g)</Label>
          <Input
            id="carbs"
            type="number"
            value={data.carbs_g || ''}
            onChange={(e) => updateField('carbs_g', e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="0"
            min="0"
            step="0.1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fat">Fat (g)</Label>
          <Input
            id="fat"
            type="number"
            value={data.fat_g || ''}
            onChange={(e) => updateField('fat_g', e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="0"
            min="0"
            step="0.1"
          />
        </div>
      </div>

      {/* Optional Macros */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fiber">Fiber (g)</Label>
          <Input
            id="fiber"
            type="number"
            value={data.fiber_g || ''}
            onChange={(e) => updateField('fiber_g', e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="0"
            min="0"
            step="0.1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sugar">Sugar (g)</Label>
          <Input
            id="sugar"
            type="number"
            value={data.sugar_g || ''}
            onChange={(e) => updateField('sugar_g', e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="0"
            min="0"
            step="0.1"
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
          placeholder="Any additional notes about this meal..."
          rows={3}
        />
      </div>

      {/* Estimated Badge */}
      {data.estimated && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <span className="text-sm text-yellow-800">
            ⚠️ These values are AI estimates. Please adjust if needed.
          </span>
        </div>
      )}
    </Card>
  )
}
