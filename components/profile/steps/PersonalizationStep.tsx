import React from 'react';
import { StepComponentProps } from '@/types/onboarding';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const DIETARY_PREFERENCES = [
  'none',
  'vegetarian',
  'vegan',
  'pescatarian',
  'keto',
  'paleo',
  'mediterranean',
  'gluten_free',
  'dairy_free',
  'low_carb',
  'high_protein'
];

const PHYSICAL_LIMITATIONS = [
  'back_issues',
  'knee_problems',
  'shoulder_issues',
  'wrist_problems',
  'ankle_issues',
  'hip_problems',
  'neck_issues',
  'heart_condition',
  'joint_replacement',
  'arthritis',
  'balance_issues'
];

export function PersonalizationStep({
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
        <CardTitle>Personal Details</CardTitle>
        <CardDescription>
          Help us understand your personal story and any considerations we should keep in mind.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="about_me" className="text-sm font-medium">
            About Me (Optional)
          </label>
          <textarea
            id="about_me"
            value={data.about_me || ''}
            onChange={(e) => onUpdate({ about_me: e.target.value || null })}
            placeholder="Tell us about your fitness journey, what motivates you, or any other details that might help us provide better recommendations..."
            rows={4}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">
            Dietary Preferences (select all that apply)
          </label>
          <div className="flex flex-wrap gap-2">
            {DIETARY_PREFERENCES.map((preference) => {
              const isSelected = (data.dietary_preferences || []).includes(preference);
              return (
                <button
                  key={preference}
                  type="button"
                  onClick={() => handleArrayUpdate('dietary_preferences', preference)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-input hover:bg-accent'
                  }`}
                >
                  {formatLabel(preference)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">
            Physical Limitations (select all that apply)
          </label>
          <p className="text-xs text-muted-foreground">
            This helps us avoid exercises that might cause discomfort or injury
          </p>
          <div className="flex flex-wrap gap-2">
            {PHYSICAL_LIMITATIONS.map((limitation) => {
              const isSelected = (data.physical_limitations || []).includes(limitation);
              return (
                <button
                  key={limitation}
                  type="button"
                  onClick={() => handleArrayUpdate('physical_limitations', limitation)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-input hover:bg-accent'
                  }`}
                >
                  {formatLabel(limitation)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Notification Preferences</label>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={data.notification_preferences?.workout_reminders || false}
                onChange={(e) => onUpdate({
                  notification_preferences: {
                    ...data.notification_preferences,
                    workout_reminders: e.target.checked
                  }
                })}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm">Workout reminders</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={data.notification_preferences?.progress_updates || false}
                onChange={(e) => onUpdate({
                  notification_preferences: {
                    ...data.notification_preferences,
                    progress_updates: e.target.checked
                  }
                })}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm">Progress updates</span>
            </label>
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