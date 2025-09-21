'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, ArrowLeft, Target } from 'lucide-react';
import { GoalType } from '@/types/profile';

const goalTypeOptions = [
  { value: 'weight_loss', label: 'Weight Loss', unit: 'kg' },
  { value: 'muscle_gain', label: 'Muscle Gain', unit: 'kg' },
  { value: 'run_distance', label: 'Running Distance', unit: 'km' },
  { value: 'run_time', label: 'Running Time', unit: 'minutes' },
  { value: 'strength', label: 'Strength Training', unit: 'reps' },
  { value: 'consistency', label: 'Workout Consistency', unit: 'days/week' },
  { value: 'flexibility', label: 'Flexibility', unit: 'cm' },
  { value: 'endurance', label: 'Endurance', unit: 'minutes' },
  { value: 'custom', label: 'Custom Goal', unit: '' },
];

export default function AddGoalPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const [goal, setGoal] = useState({
    goal_type: 'custom' as GoalType,
    description: '',
    target_value: '',
    target_unit: '',
    target_date: '',
    priority: 3,
  });

  const handleGoalTypeChange = (value: GoalType) => {
    const selected = goalTypeOptions.find(opt => opt.value === value);
    setGoal({
      ...goal,
      goal_type: value,
      target_unit: selected?.unit || '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!goal.description || goal.description.length < 10) {
      toast({
        title: 'Error',
        description: 'Please provide a detailed goal description (at least 10 characters)',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch('/api/profile/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...goal,
          target_value: goal.target_value ? parseFloat(goal.target_value) : null,
          target_date: goal.target_date || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details?.join(', ') || error.error || 'Failed to create goal');
      }

      toast({
        title: 'Success',
        description: 'Your goal has been created',
      });

      router.push('/profile');
    } catch (error) {
      console.error('Goal creation error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create goal',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="container mx-auto p-6 max-w-2xl">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/profile')}
          className="mr-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profile
        </Button>
        <h1 className="text-3xl font-bold flex items-center">
          <Target className="mr-2 h-8 w-8" />
          Add New Goal
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Goal Details</CardTitle>
            <CardDescription>
              Set a clear, measurable goal to track your progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="goal_type">Goal Type</Label>
              <Select
                value={goal.goal_type}
                onValueChange={handleGoalTypeChange}
              >
                <SelectTrigger id="goal_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {goalTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Goal Description *</Label>
              <Textarea
                id="description"
                value={goal.description}
                onChange={(e) => setGoal({ ...goal, description: e.target.value })}
                placeholder="Describe your goal in detail. Be specific about what you want to achieve..."
                rows={3}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Be specific. Instead of "lose weight", try "lose 10kg by running 3x per week"
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="target_value">Target Value</Label>
                <Input
                  id="target_value"
                  type="number"
                  step="0.1"
                  value={goal.target_value}
                  onChange={(e) => setGoal({ ...goal, target_value: e.target.value })}
                  placeholder="e.g., 10"
                />
              </div>

              <div>
                <Label htmlFor="target_unit">Unit</Label>
                <Input
                  id="target_unit"
                  value={goal.target_unit}
                  onChange={(e) => setGoal({ ...goal, target_unit: e.target.value })}
                  placeholder="e.g., kg, km, minutes"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="target_date">Target Date</Label>
                <Input
                  id="target_date"
                  type="date"
                  value={goal.target_date}
                  onChange={(e) => setGoal({ ...goal, target_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  When do you want to achieve this goal?
                </p>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={goal.priority.toString()}
                  onValueChange={(value) => setGoal({ ...goal, priority: parseInt(value) })}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Highest</SelectItem>
                    <SelectItem value="2">2 - High</SelectItem>
                    <SelectItem value="3">3 - Medium</SelectItem>
                    <SelectItem value="4">4 - Low</SelectItem>
                    <SelectItem value="5">5 - Lowest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/profile')}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Goal
              </>
            )}
          </Button>
        </div>
      </form>
    </main>
  );
}