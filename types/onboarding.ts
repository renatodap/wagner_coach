import { ProfileFormData, ValidationResult } from './profile';

export interface ValidationError {
  field: string;
  message: string;
}

export class ValidationException extends Error {
  constructor(message: string, public errors: string[]) {
    super(message);
    this.name = 'ValidationException';
  }
}

export interface OnboardingState {
  currentStep: number;
  isLoading: boolean;
  data: ProfileFormData;
  validation: { [key: number]: ValidationResult };
  hasChanges: boolean;
}

export interface StepComponentProps {
  data: ProfileFormData;
  onUpdate: (updates: Partial<ProfileFormData>) => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  isLoading: boolean;
}

export interface ProfileFormProps {
  currentStep?: number;
  onStepChange?: (step: number) => void;
  onComplete?: (data: ProfileFormData) => void;
  initialData?: ProfileFormData;
  children?: React.ReactNode;
}

export const ONBOARDING_STORAGE_KEYS = {
  CURRENT_STEP: 'onboarding_current_step',
  FORM_DATA: 'onboarding_form_data',
  HAS_CHANGES: 'onboarding_has_changes'
} as const;

export const STEP_TITLES: Record<number, string> = {
  1: 'Basic Information',
  2: 'Your Goals',
  3: 'Preferences',
  4: 'Equipment',
  5: 'Personalization'
};

export const STEP_DESCRIPTIONS: Record<number, string> = {
  1: 'Tell us about yourself',
  2: 'Define your fitness goals',
  3: 'Set your preferences',
  4: 'Available equipment',
  5: 'Personal details'
};

export function validateStep(step: number, data: ProfileFormData): ValidationResult {
  const errors: string[] = [];

  switch (step) {
    case 1: // Basic Info
      if (!data.full_name?.trim()) {
        errors.push('Full name is required');
      }
      if (data.age !== undefined && data.age !== null && (data.age < 13 || data.age > 120)) {
        errors.push('Age must be between 13 and 120');
      }
      break;

    case 2: // Goals
      if (!data.goals || data.goals.length === 0) {
        errors.push('At least one goal is required');
      }
      break;

    case 3: // Preferences
      if (!data.preferred_activities || data.preferred_activities.length === 0) {
        errors.push('At least one preferred activity is required');
      }
      break;

    case 4: // Equipment
      if (!data.available_equipment || data.available_equipment.length === 0) {
        errors.push('Please select available equipment or choose bodyweight only');
      }
      break;

    case 5: // Personalization
      // Optional step, no required fields
      break;

    default:
      errors.push('Invalid step');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function getStepTitle(step: number): string {
  return STEP_TITLES[step] || `Step ${step}`;
}

export function getStepDescription(step: number): string {
  return STEP_DESCRIPTIONS[step] || '';
}

export function calculateProgress(currentStep: number, totalSteps: number = 5): number {
  return Math.round((currentStep / totalSteps) * 100);
}