'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import {
  NutritionDashboardData,
  Meal,
  NutritionTotals,
  NutritionGoals
} from '@/types/nutrition';
import { DailySummary } from './DailySummary';
import { MealList } from './MealList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Target, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function NutritionDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<NutritionDashboardData | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/nutrition/dashboard');
      const result = await response.json();

      if (result.error) {
        setError(result.error);
      } else {
        setDashboardData(result.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load nutrition data');
    } finally {
      setLoading(false);
    }
  };

  const handleRelogMeal = async (meal: Meal) => {
    try {
      const response = await fetch('/api/nutrition/meals/relog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          original_meal_id: meal.id,
          new_logged_at: new Date().toISOString(),
        }),
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: 'Meal Re-logged',
        description: `${meal.meal_name} has been added to today's meals`,
      });

      // Refresh dashboard data
      await fetchDashboardData();
    } catch (error) {
      console.error('Error re-logging meal:', error);
      toast({
        title: 'Error',
        description: 'Failed to re-log meal',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    try {
      const response = await fetch(`/api/nutrition/meals/${mealId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete meal');
      }

      toast({
        title: 'Meal Deleted',
        description: 'Meal has been removed from your log',
      });

      // Refresh dashboard data
      await fetchDashboardData();
    } catch (error) {
      console.error('Error deleting meal:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete meal',
        variant: 'destructive',
      });
    }
  };

  const handleEditMeal = (meal: Meal) => {
    router.push(`/nutrition/edit/${meal.id}`);
  };

  const navigateToAddMeal = () => {
    router.push('/nutrition/add');
  };

  const navigateToGoals = () => {
    router.push('/nutrition/goals');
  };

  const navigateToWeekly = () => {
    router.push('/nutrition/weekly');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4 pb-24">
        <div className="max-w-4xl mx-auto">
          <Card className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchDashboardData}>Try Again</Button>
          </Card>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Nutrition</h1>
          <div className="flex gap-2">
            <Button onClick={navigateToGoals} variant="outline" size="sm">
              <Target className="w-4 h-4 mr-2" />
              Goals
            </Button>
            <Button onClick={navigateToWeekly} variant="outline" size="sm">
              <TrendingUp className="w-4 h-4 mr-2" />
              Weekly
            </Button>
          </div>
        </div>

        {/* Daily Summary */}
        <DailySummary
          totals={dashboardData.today}
          goals={dashboardData.goals}
        />

        {/* Today's Meals */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Today's Meals</CardTitle>
              <Button onClick={navigateToAddMeal} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Meal
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <MealList
              meals={dashboardData.meals}
              onRelogMeal={handleRelogMeal}
              onDeleteMeal={handleDeleteMeal}
              onEditMeal={handleEditMeal}
            />
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{dashboardData.weeklyAverage}</div>
              <p className="text-sm text-muted-foreground">Weekly Average Calories</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{dashboardData.streakDays}</div>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </CardContent>
          </Card>
        </div>

        {/* Floating Action Button (Mobile) */}
        <div className="fixed bottom-20 right-4 md:hidden">
          <Button
            onClick={navigateToAddMeal}
            size="icon"
            className="rounded-full w-14 h-14 shadow-lg"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}