'use client';

import React from 'react';
import { Meal, MealListProps, MEAL_CATEGORY_LABELS } from '@/types/nutrition';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, RotateCcw, Edit, Trash2, Clock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

interface MealListItemProps {
  meal: Meal;
  onRelog: () => void;
  onDelete: () => void;
  onEdit: () => void;
  isRelogging?: boolean;
}

function MealListItem({ meal, onRelog, onDelete, onEdit, isRelogging = false }: MealListItemProps) {
  const formatTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'h:mm a');
    } catch {
      return 'Invalid time';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'breakfast': return 'bg-orange-100 text-orange-800';
      case 'lunch': return 'bg-green-100 text-green-800';
      case 'dinner': return 'bg-blue-100 text-blue-800';
      case 'snack': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getCategoryColor(meal.meal_category)}>
                {MEAL_CATEGORY_LABELS[meal.meal_category]}
              </Badge>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="w-3 h-3 mr-1" />
                {formatTime(meal.logged_at)}
              </div>
            </div>

            <h3 className="font-semibold text-lg mb-2">{meal.meal_name}</h3>

            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Calories</span>
                <div className="font-medium">{meal.calories || 0}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Protein</span>
                <div className="font-medium">{meal.protein_g?.toFixed(1) || 0}g</div>
              </div>
              <div>
                <span className="text-muted-foreground">Carbs</span>
                <div className="font-medium">{meal.carbs_g?.toFixed(1) || 0}g</div>
              </div>
              <div>
                <span className="text-muted-foreground">Fat</span>
                <div className="font-medium">{meal.fat_g?.toFixed(1) || 0}g</div>
              </div>
            </div>

            {meal.notes && (
              <div className="mt-2 text-sm text-muted-foreground">
                {meal.notes}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={onRelog}
              variant="ghost"
              size="sm"
              disabled={isRelogging}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <RotateCcw className={`w-4 h-4 mr-1 ${isRelogging ? 'animate-spin' : ''}`} />
              Log Again
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Meal
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Meal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MealList({
  meals,
  onRelogMeal,
  onDeleteMeal,
  onEditMeal,
  isLoading = false
}: MealListProps) {
  const [reloggingMealId, setReloggingMealId] = React.useState<string | null>(null);

  const handleRelog = async (meal: Meal) => {
    try {
      setReloggingMealId(meal.id);
      await onRelogMeal(meal);
    } finally {
      setReloggingMealId(null);
    }
  };

  const sortedMeals = React.useMemo(() => {
    return [...meals].sort((a, b) =>
      new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
    );
  }, [meals]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                </div>
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="grid grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j}>
                      <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-8"></div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (meals.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground mb-2">No meals logged today</div>
        <div className="text-sm text-muted-foreground">
          Add your first meal to start tracking your nutrition
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedMeals.map((meal) => (
        <MealListItem
          key={meal.id}
          meal={meal}
          onRelog={() => handleRelog(meal)}
          onDelete={() => onDeleteMeal(meal.id)}
          onEdit={() => onEditMeal(meal)}
          isRelogging={reloggingMealId === meal.id}
        />
      ))}
    </div>
  );
}