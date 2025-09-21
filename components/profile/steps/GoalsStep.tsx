'use client';

import React, { useState } from 'react';
import { GoalsStepProps, ValidationResult } from '@/types/onboarding';
import { UserGoalInsert, GoalType } from '@/types/profile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, GripVertical, Plus, Trash2, Target } from 'lucide-react';

const GOAL_TYPES: { value: GoalType; label: string; icon: string; description: string }[] = [
  { value: 'weight_loss', label: 'Weight Loss', icon: '⚖️', description: 'Lose weight and reduce body fat' },
  { value: 'muscle_gain', label: 'Muscle Gain', icon: '💪', description: 'Build muscle mass and strength' },
  { value: 'strength', label: 'Strength', icon: '🏋️', description: 'Increase overall strength' },
  { value: 'endurance', label: 'Endurance', icon: '🏃', description: 'Improve cardiovascular fitness' },
  { value: 'flexibility', label: 'Flexibility', icon: '🧘', description: 'Enhance flexibility and mobility' },
  { value: 'general_fitness', label: 'General Fitness', icon: '🎯', description: 'Overall health and wellness' },
  { value: 'sports_performance', label: 'Sports Performance', icon: '⚽', description: 'Sport-specific improvement' },
  { value: 'rehabilitation', label: 'Rehabilitation', icon: '🏥', description: 'Recover from injury' },
  { value: 'other', label: 'Other', icon: '✨', description: 'Custom fitness goal' }
];

const UNITS_BY_GOAL: Record<GoalType, string[]> = {
  weight_loss: ['lbs', 'kg', '%'],
  muscle_gain: ['lbs', 'kg', '%'],
  strength: ['lbs', 'kg', 'reps'],
  endurance: ['minutes', 'miles', 'km'],
  flexibility: ['degrees', 'inches', 'cm'],
  general_fitness: ['days/week', 'hours/week'],
  sports_performance: ['seconds', 'meters', 'points'],
  rehabilitation: ['days', 'weeks', '%'],
  other: ['units']
};

export function GoalsStep({ data, onChange, onValidate, isActive }: GoalsStepProps) {
  const [selectedGoalType, setSelectedGoalType] = useState<GoalType | null>(null);
  const [editingGoal, setEditingGoal] = useState<UserGoalInsert | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAddGoal = () => {
    if (!selectedGoalType) {
      setErrors({ type: 'Please select a goal type first' });
      return;
    }

    const newGoal: UserGoalInsert = {
      goal_type: selectedGoalType,
      goal_description: '',
      priority: data.length + 1,
      is_active: true
    };

    setEditingGoal(newGoal);
    setSelectedGoalType(null);
  };

  const handleSaveGoal = () => {
    if (!editingGoal) return;

    // Validate goal
    if (!editingGoal.goal_description || editingGoal.goal_description.length < 10) {
      setErrors({ description: 'Please provide a detailed description (at least 10 characters)' });
      return;
    }

    if (editingGoal.target_date && new Date(editingGoal.target_date) <= new Date()) {
      setErrors({ date: 'Target date must be in the future' });
      return;
    }

    const updatedGoals = [...data, editingGoal];
    onChange(updatedGoals);
    setEditingGoal(null);
    setErrors({});
  };

  const handleRemoveGoal = (index: number) => {
    const updatedGoals = data.filter((_, i) => i !== index);
    // Update priorities
    updatedGoals.forEach((goal, i) => {
      goal.priority = i + 1;
    });
    onChange(updatedGoals);
  };

  const handleUpdatePriority = (fromIndex: number, toIndex: number) => {
    const updatedGoals = [...data];
    const [removed] = updatedGoals.splice(fromIndex, 1);
    updatedGoals.splice(toIndex, 0, removed);

    // Update priorities
    updatedGoals.forEach((goal, i) => {
      goal.priority = i + 1;
    });

    onChange(updatedGoals);
  };

  const validate = (): ValidationResult => {
    const newErrors: Record<string, string> = {};

    if (!data || data.length === 0) {
      newErrors.goals = 'Please select at least one goal';
    }

    if (data.length > 5) {
      newErrors.goals = 'Maximum 5 goals allowed. Consider focusing on fewer goals for better results.';
    }

    data.forEach((goal, index) => {
      if (!goal.goal_description || goal.goal_description.length < 10) {
        newErrors[`goal_${index}`] = 'Goal description must be at least 10 characters';
      }
    });

    setErrors(newErrors);

    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: Object.entries(newErrors).map(([field, message]) => ({ field, message })),
      warnings: data.length > 3 ? [{
        field: 'goals',
        message: 'Consider focusing on fewer goals for better results'
      }] : undefined
    };
  };

  // Expose validation for parent component
  React.useEffect(() => {
    onValidate = validate;
  }, [data]);

  if (!isActive) return null;

  return (
    <div className="space-y-6">
      {/* Goal Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Your Goals</CardTitle>
          <CardDescription>
            Choose up to 5 fitness goals. You can prioritize them by dragging.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Goal Type Grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {GOAL_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedGoalType(type.value)}
                className={cn(
                  "p-3 text-left rounded-lg border transition-colors",
                  selectedGoalType === type.value
                    ? "border-primary bg-primary/10"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="text-2xl mb-1">{type.icon}</div>
                <div className="font-medium text-sm">{type.label}</div>
                <div className="text-xs text-muted-foreground">{type.description}</div>
              </button>
            ))}
          </div>

          <Button
            onClick={handleAddGoal}
            disabled={!selectedGoalType || data.length >= 5}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Goal
          </Button>

          {errors.type && (
            <p className="text-sm text-red-500 mt-2">{errors.type}</p>
          )}
        </CardContent>
      </Card>

      {/* Editing Goal */}
      {editingGoal && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-5 w-5" />
              Configure Your {GOAL_TYPES.find(t => t.value === editingGoal.goal_type)?.label} Goal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Goal Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your specific goal in detail..."
                value={editingGoal.goal_description}
                onChange={(e) => setEditingGoal({ ...editingGoal, goal_description: e.target.value })}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target-value">Target Value</Label>
                <Input
                  id="target-value"
                  type="number"
                  placeholder="e.g., 10"
                  value={editingGoal.target_value || ''}
                  onChange={(e) => setEditingGoal({
                    ...editingGoal,
                    target_value: parseFloat(e.target.value) || null
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-unit">Unit</Label>
                <Select
                  value={editingGoal.target_unit || ''}
                  onValueChange={(value) => setEditingGoal({ ...editingGoal, target_unit: value })}
                >
                  <SelectTrigger id="target-unit">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS_BY_GOAL[editingGoal.goal_type].map(unit => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-date">Target Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="target-date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !editingGoal.target_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editingGoal.target_date ? format(new Date(editingGoal.target_date), "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={editingGoal.target_date ? new Date(editingGoal.target_date) : undefined}
                    onSelect={(date) => setEditingGoal({
                      ...editingGoal,
                      target_date: date?.toISOString().split('T')[0] || null
                    })}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.date && (
                <p className="text-sm text-red-500">{errors.date}</p>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingGoal(null);
                  setErrors({});
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveGoal}>
                Save Goal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Goals List */}
      {data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Goals</CardTitle>
            <CardDescription>
              Drag to reorder by priority. Your primary goal is at the top.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.map((goal, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg border",
                  index === 0 ? "border-primary bg-primary/5" : "border-gray-200"
                )}
              >
                <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {GOAL_TYPES.find(t => t.value === goal.goal_type)?.icon}
                    </span>
                    <span className="font-medium">
                      {GOAL_TYPES.find(t => t.value === goal.goal_type)?.label}
                    </span>
                    {index === 0 && (
                      <Badge variant="default" className="text-xs">Primary</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {goal.goal_description}
                  </p>
                  {goal.target_value && goal.target_unit && (
                    <p className="text-sm font-medium mt-1">
                      Target: {goal.target_value} {goal.target_unit}
                      {goal.target_date && ` by ${format(new Date(goal.target_date), "MMM d, yyyy")}`}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveGoal(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Error Summary */}
      {errors.goals && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{errors.goals}</p>
        </div>
      )}
    </div>
  );
}