'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ProfileFormProps, ValidationResult, OnboardingState, ONBOARDING_STORAGE_KEYS, validateStep, getStepTitle, getStepDescription, calculateProgress } from '@/types/onboarding';
import { ProfileUpdate, UserGoalInsert } from '@/types/profile';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProfileForm({
  currentStep = 1,
  onStepChange,
  onComplete,
  initialData,
  children
}: ProfileFormProps) {
  const [state, setState] = useState<OnboardingState>({
    currentStep,
    totalSteps: 5,
    stepData: {
      basicInfo: initialData || {},
      goals: [],
      preferences: {},
      equipment: {},
      personalization: {}
    },
    validation: {},
    isDirty: false,
    lastSaved: null,
    completionStatus: {
      hasStarted: true,
      currentStep,
      stepsCompleted: [false, false, false, false, false],
      isComplete: false,
      completedAt: null
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationResult['errors']>([]);

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(ONBOARDING_STORAGE_KEYS.DRAFT);
    const savedStep = localStorage.getItem(ONBOARDING_STORAGE_KEYS.STEP);

    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft);
        setState(prev => ({
          ...prev,
          stepData: draftData.stepData || prev.stepData,
          currentStep: savedStep ? parseInt(savedStep, 10) : currentStep
        }));
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
  }, [currentStep]);

  // Auto-save to localStorage with debounce
  useEffect(() => {
    if (!state.isDirty) return;

    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(ONBOARDING_STORAGE_KEYS.DRAFT, JSON.stringify({
          stepData: state.stepData,
          timestamp: new Date().toISOString()
        }));
        localStorage.setItem(ONBOARDING_STORAGE_KEYS.STEP, state.currentStep.toString());
        setState(prev => ({ ...prev, isDirty: false, lastSaved: new Date() }));
      } catch (e) {
        console.error('Failed to save draft:', e);
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [state.isDirty, state.stepData, state.currentStep]);

  const handleStepChange = useCallback((newStep: number) => {
    // Validate current step before moving
    const validation = validateStep(state.currentStep, getCurrentStepData());

    if (!validation.isValid && newStep > state.currentStep) {
      setValidationErrors(validation.errors);
      return;
    }

    // Clear validation errors
    setValidationErrors([]);

    // Mark current step as completed if moving forward
    if (newStep > state.currentStep) {
      const newStepsCompleted = [...state.completionStatus.stepsCompleted];
      newStepsCompleted[state.currentStep - 1] = true;
      setState(prev => ({
        ...prev,
        completionStatus: {
          ...prev.completionStatus,
          stepsCompleted: newStepsCompleted
        }
      }));
    }

    onStepChange(newStep);
    setState(prev => ({ ...prev, currentStep: newStep }));
  }, [state, onStepChange]);

  const getCurrentStepData = useCallback(() => {
    switch (state.currentStep) {
      case 1:
        return state.stepData.basicInfo;
      case 2:
        return state.stepData.goals;
      case 3:
        return state.stepData.preferences;
      case 4:
        return state.stepData.equipment;
      case 5:
        return state.stepData.personalization;
      default:
        return {};
    }
  }, [state.currentStep, state.stepData]);

  const updateStepData = useCallback((updates: any) => {
    const stepKey = ['basicInfo', 'goals', 'preferences', 'equipment', 'personalization'][state.currentStep - 1];

    setState(prev => ({
      ...prev,
      stepData: {
        ...prev.stepData,
        [stepKey]: updates
      },
      isDirty: true
    }));
  }, [state.currentStep]);

  const handleComplete = async () => {
    setIsLoading(true);
    setError(null);

    // Validate all steps
    for (let step = 1; step <= state.totalSteps; step++) {
      const stepData = step === 1 ? state.stepData.basicInfo :
                      step === 2 ? state.stepData.goals :
                      step === 3 ? state.stepData.preferences :
                      step === 4 ? state.stepData.equipment :
                      state.stepData.personalization;

      const validation = validateStep(step, stepData);
      if (!validation.isValid) {
        setError('Please complete all required fields');
        setIsLoading(false);
        return;
      }
    }

    try {
      // Combine all profile data
      const profileData: ProfileUpdate = {
        ...state.stepData.basicInfo,
        ...state.stepData.preferences,
        ...state.stepData.equipment,
        ...state.stepData.personalization
      };

      await onComplete({
        ...profileData,
        goals: state.stepData.goals
      });

      // Clear localStorage on success
      localStorage.removeItem(ONBOARDING_STORAGE_KEYS.DRAFT);
      localStorage.removeItem(ONBOARDING_STORAGE_KEYS.STEP);

      setState(prev => ({
        ...prev,
        completionStatus: {
          ...prev.completionStatus,
          isComplete: true,
          completedAt: new Date()
        }
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  const progress = calculateProgress(state.currentStep, state.totalSteps);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">
            Step {state.currentStep} of {state.totalSteps}
          </span>
          <span className="text-sm text-muted-foreground">
            {progress}% Complete
          </span>
        </div>
        <Progress value={progress} className="h-2" role="progressbar" aria-valuenow={progress} />

        {/* Step Indicators */}
        <div className="flex justify-between mt-4">
          {Array.from({ length: state.totalSteps }, (_, i) => i + 1).map(step => {
            const isCompleted = state.completionStatus.stepsCompleted[step - 1];
            const isCurrent = step === state.currentStep;
            const isClickable = isCompleted || step < state.currentStep;

            return (
              <button
                key={step}
                data-testid={`step-indicator-${step}`}
                aria-label={`Go to step ${step}`}
                onClick={() => isClickable && handleStepChange(step)}
                disabled={!isClickable || isLoading}
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full transition-all",
                  isCurrent && "active bg-primary text-primary-foreground",
                  isCompleted && !isCurrent && "bg-green-500 text-white",
                  !isCompleted && !isCurrent && "bg-gray-200 text-gray-500",
                  isClickable && "cursor-pointer hover:opacity-80",
                  !isClickable && "cursor-not-allowed opacity-50"
                )}
              >
                {isCompleted ? (
                  <Check data-testid={`checkmark-${step}`} className="w-5 h-5" />
                ) : (
                  step
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{getStepTitle(state.currentStep)}</CardTitle>
          <CardDescription>{getStepDescription(state.currentStep)}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Render the appropriate step component */}
          <div data-testid={`step-${state.currentStep}`}>
            {React.Children.toArray(children)[state.currentStep - 1]}
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>
                {validationErrors.map((error, idx) => (
                  <div key={idx}>{error.message}</div>
                ))}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="mt-4" role="alert">
              <AlertDescription>
                {error}
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2"
                  onClick={handleComplete}
                  aria-label="Retry"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => handleStepChange(state.currentStep - 1)}
          disabled={state.currentStep === 1 || isLoading}
          aria-label="Back"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {state.currentStep < state.totalSteps ? (
          <Button
            onClick={() => handleStepChange(state.currentStep + 1)}
            disabled={isLoading}
            aria-label="Next"
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleComplete}
            disabled={isLoading}
            aria-label="Complete"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span role="status" aria-label="Saving">Saving...</span>
              </>
            ) : (
              'Complete'
            )}
          </Button>
        )}
      </div>

      {/* Auto-save indicator */}
      {state.lastSaved && (
        <div className="text-center text-sm text-muted-foreground mt-4">
          Draft saved {state.lastSaved.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}