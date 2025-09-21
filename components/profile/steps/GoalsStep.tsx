import React, { useState } from 'react';
import { StepComponentProps } from '@/types/onboarding';
import { UserGoalInsert, GoalType, GOAL_TYPES } from '@/types/profile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical } from 'lucide-react';

export function GoalsStep({
  data,
  onUpdate,
  onNext,
  onPrevious,
  isFirstStep,
  isLastStep,
  isLoading
}: StepComponentProps) {
  const [newGoal, setNewGoal] = useState<Partial<UserGoalInsert>>({
    goal_type: undefined,
    description: '',
    priority: 1
  });

  const goals = data.goals || [];

  const handleAddGoal = () => {
    if (newGoal.goal_type && newGoal.description?.trim()) {
      const goal: UserGoalInsert = {
        goal_type: newGoal.goal_type,
        description: newGoal.description.trim(),
        target_value: newGoal.target_value || null,
        target_unit: newGoal.target_unit || null,
        target_date: newGoal.target_date || null,
        priority: goals.length + 1,
        status: 'active'
      };

      onUpdate({
        goals: [...goals, goal]
      });

      setNewGoal({
        goal_type: undefined,
        description: '',
        priority: 1
      });
    }
  };

  const handleRemoveGoal = (index: number) => {
    const updatedGoals = goals.filter((_, i) => i !== index);
    // Reorder priorities
    const reorderedGoals = updatedGoals.map((goal, i) => ({
      ...goal,
      priority: i + 1
    }));
    onUpdate({ goals: reorderedGoals });
  };

  const moveGoal = (index: number, direction: 'up' | 'down') => {
    const newGoals = [...goals];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newGoals.length) {
      [newGoals[index], newGoals[targetIndex]] = [newGoals[targetIndex], newGoals[index]];
      // Update priorities
      const reorderedGoals = newGoals.map((goal, i) => ({
        ...goal,
        priority: i + 1
      }));
      onUpdate({ goals: reorderedGoals });
    }
  };

  const getGoalTypeLabel = (type: GoalType): string => {
    const labels: Record<GoalType, string> = {
      weight_loss: 'Weight Loss',
      muscle_gain: 'Muscle Gain',
      strength: 'Strength',
      endurance: 'Endurance',
      flexibility: 'Flexibility',
      general_fitness: 'General Fitness',
      sport_specific: 'Sport Specific',
      rehabilitation: 'Rehabilitation',
      habit_formation: 'Habit Formation',
      nutrition: 'Nutrition',
      custom: 'Custom'
    };
    return labels[type];
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Your Fitness Goals</CardTitle>
        <CardDescription>
          Define your fitness goals to get personalized recommendations. You can add up to 5 goals.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing Goals */}
        {goals.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Your Goals</h3>
            {goals.map((goal, index) => (
              <div key={index} className="flex items-center gap-3 p-4 border rounded-lg">
                <div className="flex flex-col">
                  <button
                    onClick={() => moveGoal(index, 'up')}
                    disabled={index === 0}
                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                  >
                    <GripVertical className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveGoal(index, 'down')}
                    disabled={index === goals.length - 1}
                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                  >
                    <GripVertical className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary">
                      Priority {goal.priority}
                    </Badge>
                    <Badge>
                      {getGoalTypeLabel(goal.goal_type)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{goal.description}</p>
                  {(goal.target_value || goal.target_date) && (
                    <div className="text-xs text-gray-500 mt-1">
                      {goal.target_value && `Target: ${goal.target_value} ${goal.target_unit || ''}`}
                      {goal.target_value && goal.target_date && ' • '}
                      {goal.target_date && `By: ${goal.target_date}`}
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveGoal(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Goal */}
        {goals.length < 5 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Add New Goal</h3>

            <div className="space-y-2">
              <label className="text-sm font-medium">Goal Type</label>
              <select
                value={newGoal.goal_type || ''}
                onChange={(e) => setNewGoal({ ...newGoal, goal_type: e.target.value as GoalType })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a goal type</option>
                {GOAL_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {getGoalTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={newGoal.description || ''}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                placeholder="Describe your goal in detail..."
                rows={3}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Value (optional)</label>
                <input
                  type="number"
                  value={newGoal.target_value || ''}
                  onChange={(e) => setNewGoal({ ...newGoal, target_value: parseFloat(e.target.value) || null })}
                  placeholder="e.g., 10"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Unit (optional)</label>
                <input
                  type="text"
                  value={newGoal.target_unit || ''}
                  onChange={(e) => setNewGoal({ ...newGoal, target_unit: e.target.value || null })}
                  placeholder="kg, lbs, %, etc."
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Target Date (optional)</label>
                <input
                  type="date"
                  value={newGoal.target_date || ''}
                  onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value || null })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            <Button
              type="button"
              onClick={handleAddGoal}
              disabled={!newGoal.goal_type || !newGoal.description?.trim()}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Goal
            </Button>
          </div>
        )}

        <div className="flex justify-between pt-4">
          {!isFirstStep && (
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              disabled={isLoading}
            >
              Previous
            </Button>
          )}

          <Button
            type="button"
            onClick={onNext}
            disabled={isLoading}
            className={isFirstStep ? 'ml-auto' : ''}
          >
            {isLastStep ? 'Complete' : 'Next'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}