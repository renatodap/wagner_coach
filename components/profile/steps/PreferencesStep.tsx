'use client';

import React, { useState } from 'react';
import { PreferencesStepProps, ValidationResult } from '@/types/onboarding';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Heart, Trophy, Users, Brain, Clock, Zap } from 'lucide-react';

const ACTIVITY_OPTIONS = [
  { value: 'running', label: 'Running', icon: '🏃' },
  { value: 'cycling', label: 'Cycling', icon: '🚴' },
  { value: 'swimming', label: 'Swimming', icon: '🏊' },
  { value: 'weightlifting', label: 'Weight Training', icon: '🏋️' },
  { value: 'yoga', label: 'Yoga', icon: '🧘' },
  { value: 'pilates', label: 'Pilates', icon: '🤸' },
  { value: 'crossfit', label: 'CrossFit', icon: '💪' },
  { value: 'martial_arts', label: 'Martial Arts', icon: '🥋' },
  { value: 'dancing', label: 'Dancing', icon: '💃' },
  { value: 'hiking', label: 'Hiking', icon: '🥾' },
  { value: 'sports', label: 'Team Sports', icon: '⚽' },
  { value: 'calisthenics', label: 'Calisthenics', icon: '🤾' }
];

const MOTIVATION_FACTORS = [
  { value: 'health', label: 'Better Health', icon: Heart },
  { value: 'appearance', label: 'Look Better', icon: Trophy },
  { value: 'performance', label: 'Athletic Performance', icon: Zap },
  { value: 'social', label: 'Social Connection', icon: Users },
  { value: 'mental', label: 'Mental Health', icon: Brain },
  { value: 'energy', label: 'More Energy', icon: Clock }
];

const EXPERIENCE_LEVELS = [
  {
    value: 'beginner',
    label: 'Beginner',
    description: 'New to fitness or returning after a long break'
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: 'Regular exercise for 6-24 months'
  },
  {
    value: 'advanced',
    label: 'Advanced',
    description: 'Consistent training for 2+ years'
  }
];

export function PreferencesStep({ data, onChange, onValidate, isActive }: PreferencesStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleActivityToggle = (activity: string, checked: boolean) => {
    const current = data.preferred_activities || [];
    const updated = checked
      ? [...current, activity]
      : current.filter(a => a !== activity);

    onChange({ ...data, preferred_activities: updated });
  };

  const handleMotivationToggle = (factor: string, checked: boolean) => {
    const current = data.motivation_factors || [];
    const updated = checked
      ? [...current, factor]
      : current.filter(f => f !== factor);

    onChange({ ...data, motivation_factors: updated });
  };

  const handleFrequencyChange = (value: string) => {
    onChange({ ...data, training_frequency: value });
  };

  const handleDurationChange = (value: string) => {
    onChange({ ...data, session_duration: value });
  };

  const validate = (): ValidationResult => {
    const newErrors: Record<string, string> = {};

    if (!data.experience_level) {
      newErrors.experience_level = 'Please select your experience level';
    }

    if (!data.preferred_activities || data.preferred_activities.length === 0) {
      newErrors.activities = 'Please select at least one preferred activity';
    }

    if (!data.motivation_factors || data.motivation_factors.length === 0) {
      newErrors.motivation = 'Please select at least one motivation factor';
    }

    setErrors(newErrors);

    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: Object.entries(newErrors).map(([field, message]) => ({ field, message }))
    };
  };

  // Expose validation for parent component
  React.useEffect(() => {
    onValidate = validate;
  }, [data]);

  if (!isActive) return null;

  return (
    <div className="space-y-6">
      {/* Experience Level */}
      <Card>
        <CardHeader>
          <CardTitle>Experience Level</CardTitle>
          <CardDescription>
            This helps us tailor workouts to your fitness level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={data.experience_level || ''}
            onValueChange={(value) => onChange({ ...data, experience_level: value as any })}
          >
            {EXPERIENCE_LEVELS.map((level) => (
              <div key={level.value} className="flex items-start space-x-3 mb-4">
                <RadioGroupItem value={level.value} id={level.value} className="mt-1" />
                <Label htmlFor={level.value} className="flex-1 cursor-pointer">
                  <div className="font-medium">{level.label}</div>
                  <div className="text-sm text-muted-foreground">{level.description}</div>
                </Label>
              </div>
            ))}
          </RadioGroup>
          {errors.experience_level && (
            <p className="text-sm text-red-500 mt-2">{errors.experience_level}</p>
          )}
        </CardContent>
      </Card>

      {/* Preferred Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Preferred Activities</CardTitle>
          <CardDescription>
            Select all activities you enjoy or would like to try
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {ACTIVITY_OPTIONS.map((activity) => (
              <div key={activity.value} className="flex items-center space-x-2">
                <Checkbox
                  id={activity.value}
                  checked={(data.preferred_activities || []).includes(activity.value)}
                  onCheckedChange={(checked) => handleActivityToggle(activity.value, !!checked)}
                />
                <Label
                  htmlFor={activity.value}
                  className="flex items-center space-x-1 cursor-pointer"
                >
                  <span className="text-lg">{activity.icon}</span>
                  <span className="text-sm">{activity.label}</span>
                </Label>
              </div>
            ))}
          </div>
          {errors.activities && (
            <p className="text-sm text-red-500 mt-2">{errors.activities}</p>
          )}
        </CardContent>
      </Card>

      {/* Motivation Factors */}
      <Card>
        <CardHeader>
          <CardTitle>What Motivates You?</CardTitle>
          <CardDescription>
            Understanding your motivation helps us keep you engaged
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {MOTIVATION_FACTORS.map((factor) => {
              const Icon = factor.icon;
              const isSelected = (data.motivation_factors || []).includes(factor.value);

              return (
                <button
                  key={factor.value}
                  onClick={() => handleMotivationToggle(factor.value, !isSelected)}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-6 w-6 mb-2 mx-auto" />
                  <div className="text-sm font-medium">{factor.label}</div>
                </button>
              );
            })}
          </div>
          {errors.motivation && (
            <p className="text-sm text-red-500 mt-2">{errors.motivation}</p>
          )}
        </CardContent>
      </Card>

      {/* Training Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Training Schedule</CardTitle>
          <CardDescription>
            How often and how long would you like to train?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Training Frequency */}
          <div className="space-y-2">
            <Label htmlFor="frequency">Training Frequency</Label>
            <Select
              value={data.training_frequency || ''}
              onValueChange={handleFrequencyChange}
            >
              <SelectTrigger id="frequency">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-2 days/week">1-2 days per week (Light)</SelectItem>
                <SelectItem value="3-4 days/week">3-4 days per week (Moderate)</SelectItem>
                <SelectItem value="5-6 days/week">5-6 days per week (Active)</SelectItem>
                <SelectItem value="Daily">Daily (Very Active)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Session Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Typical Session Duration</Label>
            <Select
              value={data.session_duration || ''}
              onValueChange={handleDurationChange}
            >
              <SelectTrigger id="duration">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15-30 minutes">15-30 minutes (Quick)</SelectItem>
                <SelectItem value="30-45 minutes">30-45 minutes (Standard)</SelectItem>
                <SelectItem value="45-60 minutes">45-60 minutes (Extended)</SelectItem>
                <SelectItem value="60+ minutes">60+ minutes (Long)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {(data.preferred_activities?.length > 0 || data.motivation_factors?.length > 0) && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">Your Preferences Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.experience_level && (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Level:</span>
                <Badge variant="secondary">
                  {EXPERIENCE_LEVELS.find(l => l.value === data.experience_level)?.label}
                </Badge>
              </div>
            )}
            {data.preferred_activities && data.preferred_activities.length > 0 && (
              <div>
                <span className="text-sm font-medium">Activities:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {data.preferred_activities.map(activity => {
                    const act = ACTIVITY_OPTIONS.find(a => a.value === activity);
                    return (
                      <Badge key={activity} variant="outline" className="text-xs">
                        {act?.icon} {act?.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
            {data.motivation_factors && data.motivation_factors.length > 0 && (
              <div>
                <span className="text-sm font-medium">Motivated by:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {data.motivation_factors.map(factor => {
                    const mot = MOTIVATION_FACTORS.find(m => m.value === factor);
                    return (
                      <Badge key={factor} variant="outline" className="text-xs">
                        {mot?.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
            {data.training_frequency && (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Schedule:</span>
                <span className="text-sm text-muted-foreground">
                  {data.training_frequency}, {data.session_duration || 'duration not set'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}