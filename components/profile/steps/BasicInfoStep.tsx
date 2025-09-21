'use client';

import React, { useState, useEffect } from 'react';
import { BasicInfoStepProps, ValidationResult } from '@/types/onboarding';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

export function BasicInfoStep({ data, onChange, onValidate, isActive }: BasicInfoStepProps) {
  const [useImperial, setUseImperial] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Auto-detect timezone
    if (!data.timezone && isActive) {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      onChange({ ...data, timezone });
    }
  }, [isActive, data, onChange]);

  const handleInputChange = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const convertHeight = (value: number, toImperial: boolean) => {
    if (toImperial) {
      // cm to feet and inches
      const totalInches = value / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);
      return { feet, inches };
    } else {
      // feet and inches to cm
      return Math.round(value * 2.54);
    }
  };

  const convertWeight = (value: number, toImperial: boolean) => {
    if (toImperial) {
      // kg to lbs
      return Math.round(value * 2.20462);
    } else {
      // lbs to kg
      return Math.round(value / 2.20462);
    }
  };

  const handleUnitToggle = (checked: boolean) => {
    setUseImperial(checked);

    // Convert existing values
    if (data.height) {
      const convertedHeight = checked
        ? convertHeight(data.height, true)
        : convertHeight(data.height, false);
      handleInputChange('height', convertedHeight);
    }

    if (data.weight) {
      const convertedWeight = convertWeight(data.weight, checked);
      handleInputChange('weight', convertedWeight);
    }
  };

  const validate = (): ValidationResult => {
    const newErrors: Record<string, string> = {};

    if (!data.full_name || data.full_name.trim().length < 2) {
      newErrors.full_name = 'Full name is required';
    }

    if (!data.age || data.age < 13 || data.age > 120) {
      newErrors.age = 'Please enter a valid age (13-120)';
    }

    if (data.height && (data.height < 50 || data.height > 300)) {
      newErrors.height = 'Height must be between 50-300 cm';
    }

    if (data.weight && (data.weight < 20 || data.weight > 500)) {
      newErrors.weight = 'Weight must be between 20-500 kg';
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
      <TooltipProvider>
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="full_name">
            Full Name *
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="inline-block ml-2 h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Your name helps personalize your experience</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Input
            id="full_name"
            type="text"
            placeholder="Enter your full name"
            value={data.full_name || ''}
            onChange={(e) => handleInputChange('full_name', e.target.value)}
            aria-label="Full name"
            className={errors.full_name ? 'border-red-500' : ''}
          />
          {errors.full_name && (
            <p className="text-sm text-red-500">{errors.full_name}</p>
          )}
        </div>

        {/* Age */}
        <div className="space-y-2">
          <Label htmlFor="age">
            Age *
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="inline-block ml-2 h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Used to tailor workouts to your fitness level</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Input
            id="age"
            type="number"
            placeholder="Enter your age"
            value={data.age || ''}
            onChange={(e) => handleInputChange('age', parseInt(e.target.value) || null)}
            min="13"
            max="120"
            aria-label="Age"
            className={errors.age ? 'border-red-500' : ''}
          />
          {errors.age && (
            <p className="text-sm text-red-500">{errors.age}</p>
          )}
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <Label htmlFor="gender">
            Gender
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="inline-block ml-2 h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Helps customize fitness recommendations</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Select
            value={data.gender || ''}
            onValueChange={(value) => handleInputChange('gender', value)}
          >
            <SelectTrigger id="gender">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
              <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Unit Toggle */}
        <div className="flex items-center space-x-2">
          <Switch
            id="imperial-units"
            checked={useImperial}
            onCheckedChange={handleUnitToggle}
          />
          <Label htmlFor="imperial-units">
            Use Imperial Units (lbs/ft)
          </Label>
        </div>

        {/* Height */}
        <div className="space-y-2">
          <Label htmlFor="height">
            Height {useImperial ? '(ft/in)' : '(cm)'}
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="inline-block ml-2 h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Used for BMI calculation and health tracking</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          {useImperial ? (
            <div className="flex space-x-2">
              <Input
                id="height-feet"
                type="number"
                placeholder="Feet"
                value={data.height ? convertHeight(data.height, true).feet : ''}
                onChange={(e) => {
                  const feet = parseInt(e.target.value) || 0;
                  const inches = data.height ? convertHeight(data.height, true).inches : 0;
                  const cm = Math.round((feet * 12 + inches) * 2.54);
                  handleInputChange('height', cm);
                }}
                className="w-24"
              />
              <Input
                id="height-inches"
                type="number"
                placeholder="Inches"
                value={data.height ? convertHeight(data.height, true).inches : ''}
                onChange={(e) => {
                  const inches = parseInt(e.target.value) || 0;
                  const feet = data.height ? convertHeight(data.height, true).feet : 0;
                  const cm = Math.round((feet * 12 + inches) * 2.54);
                  handleInputChange('height', cm);
                }}
                className="w-24"
              />
            </div>
          ) : (
            <Input
              id="height"
              type="number"
              placeholder="Height in centimeters"
              value={data.height || ''}
              onChange={(e) => handleInputChange('height', parseInt(e.target.value) || null)}
              min="50"
              max="300"
              className={errors.height ? 'border-red-500' : ''}
            />
          )}
          {errors.height && (
            <p className="text-sm text-red-500">{errors.height}</p>
          )}
        </div>

        {/* Weight */}
        <div className="space-y-2">
          <Label htmlFor="weight">
            Weight {useImperial ? '(lbs)' : '(kg)'}
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="inline-block ml-2 h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Track your progress over time</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Input
            id="weight"
            type="number"
            placeholder={`Weight in ${useImperial ? 'pounds' : 'kilograms'}`}
            value={useImperial && data.weight ? convertWeight(data.weight, true) : data.weight || ''}
            onChange={(e) => {
              const value = parseInt(e.target.value) || null;
              if (value && useImperial) {
                handleInputChange('weight', convertWeight(value, false));
              } else {
                handleInputChange('weight', value);
              }
            }}
            min={useImperial ? "44" : "20"}
            max={useImperial ? "1100" : "500"}
            className={errors.weight ? 'border-red-500' : ''}
          />
          {errors.weight && (
            <p className="text-sm text-red-500">{errors.weight}</p>
          )}
        </div>

        {/* Timezone */}
        <div className="space-y-2">
          <Label htmlFor="timezone">
            Timezone
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="inline-block ml-2 h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>For scheduling workouts and reminders</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Input
            id="timezone"
            type="text"
            value={data.timezone || ''}
            onChange={(e) => handleInputChange('timezone', e.target.value)}
            placeholder="Auto-detected"
            readOnly
            className="bg-muted"
          />
          <p className="text-sm text-muted-foreground">
            Automatically detected: {data.timezone}
          </p>
        </div>
      </TooltipProvider>
    </div>
  );
}