'use client';

import React from 'react';
import { DailySummaryProps, NutritionProgress } from '@/types/nutrition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function DailySummary({ totals, goals, isLoading = false }: DailySummaryProps) {
  const calculateProgress = (): NutritionProgress => {
    const calculateMacroProgress = (current: number, target: number) => {
      const percentage = Math.min((current / target) * 100, 100);
      const remaining = Math.max(target - current, 0);
      let status: 'under' | 'on-track' | 'over' = 'under';

      if (current >= target * 1.1) status = 'over';
      else if (current >= target * 0.9) status = 'on-track';

      return { current, target, percentage, remaining, status };
    };

    return {
      calories: calculateMacroProgress(totals.calories, goals.daily_calories),
      protein_g: calculateMacroProgress(totals.protein_g, goals.protein_g),
      carbs_g: calculateMacroProgress(totals.carbs_g, goals.carbs_g),
      fat_g: calculateMacroProgress(totals.fat_g, goals.fat_g),
    };
  };

  const progress = calculateProgress();

  const getProgressColor = (status: 'under' | 'on-track' | 'over') => {
    switch (status) {
      case 'on-track': return 'bg-green-500';
      case 'over': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusColor = (status: 'under' | 'on-track' | 'over') => {
    switch (status) {
      case 'on-track': return 'text-green-600';
      case 'over': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today&apos;s Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Calories */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">Calories</span>
            <span className={`text-sm font-medium ${getStatusColor(progress.calories.status)}`}>
              {totals.calories} / {goals.daily_calories}
            </span>
          </div>
          <Progress
            value={progress.calories.percentage}
            className="h-2"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{progress.calories.percentage.toFixed(0)}% of goal</span>
            <span>
              {progress.calories.status === 'over'
                ? `${(totals.calories - goals.daily_calories).toFixed(0)} over`
                : `${progress.calories.remaining.toFixed(0)} remaining`
              }
            </span>
          </div>
        </div>

        {/* Macronutrients Grid */}
        <div className="grid grid-cols-3 gap-4">
          {/* Protein */}
          <div className="space-y-2">
            <div className="text-center">
              <div className="text-lg font-bold">{totals.protein_g.toFixed(0)}g</div>
              <div className="text-xs text-muted-foreground">Protein</div>
            </div>
            <Progress
              value={progress.protein_g.percentage}
              className="h-1"
            />
            <div className="text-xs text-center text-muted-foreground">
              {progress.protein_g.percentage.toFixed(0)}%
            </div>
          </div>

          {/* Carbs */}
          <div className="space-y-2">
            <div className="text-center">
              <div className="text-lg font-bold">{totals.carbs_g.toFixed(0)}g</div>
              <div className="text-xs text-muted-foreground">Carbs</div>
            </div>
            <Progress
              value={progress.carbs_g.percentage}
              className="h-1"
            />
            <div className="text-xs text-center text-muted-foreground">
              {progress.carbs_g.percentage.toFixed(0)}%
            </div>
          </div>

          {/* Fat */}
          <div className="space-y-2">
            <div className="text-center">
              <div className="text-lg font-bold">{totals.fat_g.toFixed(0)}g</div>
              <div className="text-xs text-muted-foreground">Fat</div>
            </div>
            <Progress
              value={progress.fat_g.percentage}
              className="h-1"
            />
            <div className="text-xs text-center text-muted-foreground">
              {progress.fat_g.percentage.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Status Summary */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Status: </span>
              <span className={getStatusColor(progress.calories.status)}>
                {progress.calories.status === 'on-track' && 'On Track'}
                {progress.calories.status === 'under' && 'Under Goal'}
                {progress.calories.status === 'over' && 'Over Goal'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Remaining: </span>
              <span className="font-medium">
                {progress.calories.remaining.toFixed(0)} cal
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}