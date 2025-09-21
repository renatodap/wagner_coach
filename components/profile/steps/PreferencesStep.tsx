import React from 'react';
import { StepComponentProps } from '@/types/onboarding';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ACTIVITIES = [
  'weightlifting',
  'cardio',
  'running',
  'cycling',
  'swimming',
  'yoga',
  'pilates',
  'crossfit',
  'martial_arts',
  'dancing',
  'sports',
  'hiking',
  'climbing'
];

const MOTIVATION_FACTORS = [
  'weight_loss',
  'muscle_gain',
  'strength_improvement',
  'endurance_building',
  'stress_relief',
  'energy_boost',
  'better_sleep',
  'confidence_building',
  'health_improvement',
  'competition_prep',
  'social_activity',
  'habit_formation'
];

const FREQUENCIES = [
  { value: '1-2', label: '1-2 times per week' },
  { value: '3-4', label: '3-4 times per week' },
  { value: '5-6', label: '5-6 times per week' },
  { value: 'daily', label: 'Daily' }
];

const DURATIONS = [
  { value: '15-30', label: '15-30 minutes' },
  { value: '30-45', label: '30-45 minutes' },
  { value: '45-60', label: '45-60 minutes' },
  { value: '60+', label: '60+ minutes' }
];

export function PreferencesStep({
  data,
  onUpdate,
  onNext,
  onPrevious,
  isFirstStep,
  isLastStep,
  isLoading
}: StepComponentProps) {
  const handleArrayUpdate = (field: string, value: string) => {
    const currentArray = data[field] || [];
    const updatedArray = currentArray.includes(value)
      ? currentArray.filter((item: string) => item !== value)
      : [...currentArray, value];

    onUpdate({ [field]: updatedArray });
  };

  const formatLabel = (value: string): string => {
    return value
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Your Preferences</CardTitle>
        <CardDescription>
          Tell us about your activity preferences and what motivates you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preferred Activities */}
        <div className="space-y-3">
          <label className="text-sm font-medium">
            Preferred Activities (select all that apply)
          </label>
          <div className="flex flex-wrap gap-2">
            {ACTIVITIES.map((activity) => {
              const isSelected = (data.preferred_activities || []).includes(activity);
              return (
                <button
                  key={activity}
                  type="button"
                  onClick={() => handleArrayUpdate('preferred_activities', activity)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-input hover:bg-accent'
                  }`}
                >
                  {formatLabel(activity)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Motivation Factors */}
        <div className="space-y-3">
          <label className="text-sm font-medium">
            What motivates you? (select all that apply)
          </label>
          <div className="flex flex-wrap gap-2">
            {MOTIVATION_FACTORS.map((factor) => {
              const isSelected = (data.motivation_factors || []).includes(factor);
              return (
                <button
                  key={factor}
                  type="button"
                  onClick={() => handleArrayUpdate('motivation_factors', factor)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-input hover:bg-accent'
                  }`}
                >
                  {formatLabel(factor)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Training Schedule */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Training Frequency</label>
            <select
              value={data.training_frequency || ''}
              onChange={(e) => onUpdate({ training_frequency: e.target.value || null })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select frequency</option>
              {FREQUENCIES.map((freq) => (
                <option key={freq.value} value={freq.value}>
                  {freq.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Session Duration</label>
            <select
              value={data.session_duration || ''}
              onChange={(e) => onUpdate({ session_duration: e.target.value || null })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select duration</option>
              {DURATIONS.map((duration) => (
                <option key={duration.value} value={duration.value}>
                  {duration.label}
                </option>
              ))}
            </select>
          </div>
        </div>

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