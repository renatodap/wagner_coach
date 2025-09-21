'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PhotoRecognitionResultProps, FoodRecognitionResult, RecognizedFood, NutritionInfo } from '@/types/nutrition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, X, AlertTriangle, Check } from 'lucide-react';

export function PhotoRecognitionResult({
  result,
  onAccept,
  onReject,
  isLoading = false
}: PhotoRecognitionResultProps) {
  const [editedResult, setEditedResult] = useState<FoodRecognitionResult | null>(null);
  const [timeoutWarning, setTimeoutWarning] = useState(false);

  useEffect(() => {
    if (result) {
      setEditedResult(JSON.parse(JSON.stringify(result))); // Deep clone
    }
  }, [result]);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setTimeoutWarning(true);
      }, 30000);

      return () => clearTimeout(timer);
    } else {
      setTimeoutWarning(false);
    }
  }, [isLoading]);

  const handleFoodEdit = (foodId: string, field: keyof RecognizedFood, value: any) => {
    if (!editedResult) return;

    const updatedFoods = editedResult.foods.map(food =>
      food.id === foodId ? { ...food, [field]: value } : food
    );

    // Recalculate totals
    const totalNutrition = calculateTotalNutrition(updatedFoods);

    setEditedResult({
      ...editedResult,
      foods: updatedFoods,
      totalNutrition
    });
  };

  const handleRemoveFood = (foodId: string) => {
    if (!editedResult) return;

    const updatedFoods = editedResult.foods.filter(food => food.id !== foodId);
    const totalNutrition = calculateTotalNutrition(updatedFoods);

    setEditedResult({
      ...editedResult,
      foods: updatedFoods,
      totalNutrition
    });
  };

  const calculateTotalNutrition = (foods: RecognizedFood[]): NutritionInfo => {
    return foods.reduce((total, food) => ({
      calories: total.calories + food.nutrition.calories,
      protein_g: total.protein_g + food.nutrition.protein_g,
      carbs_g: total.carbs_g + food.nutrition.carbs_g,
      fat_g: total.fat_g + food.nutrition.fat_g
    }), {
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return 'bg-green-100 text-green-800';
    if (confidence > 0.5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const sortedFoods = useMemo(() => {
    if (!editedResult) return [];
    return [...editedResult.foods].sort((a, b) => b.confidence - a.confidence);
  }, [editedResult]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center space-y-4" data-testid="skeleton-loader">
          <Loader2 className="w-8 h-8 animate-spin" data-testid="loading-spinner" />
          <p className="text-muted-foreground">Analyzing your meal...</p>
          {timeoutWarning && (
            <p className="text-sm text-yellow-600">
              This is taking longer than expected. Please wait...
            </p>
          )}
        </div>
      </Card>
    );
  }

  if (!editedResult) {
    return null;
  }

  if (editedResult.foods.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <p className="text-lg font-medium mb-2">No foods detected</p>
          <p className="text-muted-foreground mb-4">
            We couldn't identify any foods in your photo. Try a clearer photo with better lighting.
          </p>
          <Button onClick={onReject}>Try Again</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recognition Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Food Items */}
        <div className="space-y-3">
          {sortedFoods.map((food) => (
            <div
              key={food.id}
              className="p-4 border rounded-lg space-y-3"
              data-testid="food-card"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={food.name}
                      onChange={(e) => handleFoodEdit(food.id, 'name', e.target.value)}
                      className="font-medium"
                      data-testid="food-name"
                    />
                    <Badge
                      className={getConfidenceColor(food.confidence)}
                      data-testid="confidence-badge"
                    >
                      {Math.round(food.confidence * 100)}%
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={food.quantity}
                      onChange={(e) => handleFoodEdit(food.id, 'quantity', parseFloat(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">{food.unit}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveFood(food.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                  data-testid="remove-food"
                  aria-label={`Remove ${food.name}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Calories: </span>
                  <span className="font-medium">{food.nutrition.calories} cal</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Protein: </span>
                  <span className="font-medium">{food.nutrition.protein_g}g protein</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Carbs: </span>
                  <span className="font-medium">{food.nutrition.carbs_g}g carbs</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Fat: </span>
                  <span className="font-medium">{food.nutrition.fat_g}g fat</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total Nutrition Summary */}
        <Card className="bg-gray-50" data-testid="nutrition-summary">
          <CardContent className="pt-4">
            <p className="font-medium mb-2">Total Nutrition</p>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{editedResult.totalNutrition.calories}</p>
                <p className="text-sm text-muted-foreground">Calories</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{editedResult.totalNutrition.protein_g}g</p>
                <p className="text-sm text-muted-foreground">Protein</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{editedResult.totalNutrition.carbs_g}g</p>
                <p className="text-sm text-muted-foreground">Carbs</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{editedResult.totalNutrition.fat_g}g</p>
                <p className="text-sm text-muted-foreground">Fat</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={() => onAccept(editedResult)}
            className="flex-1"
          >
            <Check className="w-4 h-4 mr-2" />
            Accept & Save
          </Button>
          <Button
            onClick={onReject}
            variant="outline"
            className="flex-1"
          >
            Try Again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}