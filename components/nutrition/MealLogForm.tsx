'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface MealLogFormProps {
  onSubmit?: (mealData: any) => void;
  onCancel?: () => void;
}

export function MealLogForm({ onSubmit, onCancel }: MealLogFormProps) {
  const [mealData, setMealData] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    meal_type: 'breakfast',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(mealData);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setMealData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Log a Meal</CardTitle>
        <CardDescription>
          Add nutritional information for your meal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Meal Name
            </label>
            <input
              id="name"
              type="text"
              value={mealData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter meal name"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="meal_type" className="text-sm font-medium">
              Meal Type
            </label>
            <select
              id="meal_type"
              value={mealData.meal_type}
              onChange={(e) => handleInputChange('meal_type', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="calories" className="text-sm font-medium">
                Calories
              </label>
              <input
                id="calories"
                type="number"
                value={mealData.calories}
                onChange={(e) => handleInputChange('calories', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="kcal"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="protein" className="text-sm font-medium">
                Protein (g)
              </label>
              <input
                id="protein"
                type="number"
                value={mealData.protein}
                onChange={(e) => handleInputChange('protein', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="grams"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="carbs" className="text-sm font-medium">
                Carbs (g)
              </label>
              <input
                id="carbs"
                type="number"
                value={mealData.carbs}
                onChange={(e) => handleInputChange('carbs', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="grams"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="fat" className="text-sm font-medium">
                Fat (g)
              </label>
              <input
                id="fat"
                type="number"
                value={mealData.fat}
                onChange={(e) => handleInputChange('fat', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="grams"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={mealData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Add any notes about your meal..."
            />
          </div>

          <div className="flex justify-between gap-2 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" className="flex-1">
              Log Meal
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}