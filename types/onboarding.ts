// Onboarding Flow Type Definitions

import { ProfileUpdate, UserGoalInsert, ProfileFormData, ValidationResult } from './profile';

export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  isLoading?: boolean;
  stepData: {
    basicInfo: Partial<ProfileUpdate>;
    goals: UserGoalInsert[];
    preferences: Partial<ProfileUpdate>;
    equipment: Partial<ProfileUpdate>;
    personalization: Partial<ProfileUpdate>;
  };
  data?: ProfileFormData;
  validation: {
    [step: number]: ValidationResult;
  };
  isDirty: boolean;
  hasChanges?: boolean;
  lastSaved: Date | null;
  completionStatus: OnboardingCompletionStatus;
}

export interface OnboardingCompletionStatus {
  hasStarted: boolean;
  currentStep: number;
  stepsCompleted: boolean[];
  isComplete: boolean;
  completedAt: Date | null;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
}

export class ValidationException extends Error {
  constructor(message: string, public errors: string[]) {
    super(message);
    this.name = 'ValidationException';
  }
}

// Component Props Interfaces

export interface ProfileFormProps {
  currentStep?: number;
  onStepChange?: (step: number) => void;
  onComplete?: (data: ProfileUpdate & { goals: UserGoalInsert[] }) => Promise<void>;
  initialData?: Partial<ProfileUpdate> | ProfileFormData;
  children?: React.ReactNode;
}

export interface StepComponentProps {
  data: ProfileFormData | Partial<ProfileUpdate> | UserGoalInsert[];
  onUpdate?: (updates: Partial<ProfileFormData>) => void;
  onChange?: (updates: Partial<ProfileUpdate> | UserGoalInsert[]) => void;
  onValidate?: () => ValidationResult;
  onNext?: () => void;
  onPrevious?: () => void;
  onBack?: () => void;
  isActive?: boolean;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  isLoading?: boolean;
}

export interface BasicInfoStepProps extends Omit<StepComponentProps, 'data' | 'onChange'> {
  data: Partial<ProfileUpdate>;
  onChange: (updates: Partial<ProfileUpdate>) => void;
}

export interface GoalsStepProps extends Omit<StepComponentProps, 'data' | 'onChange'> {
  data: UserGoalInsert[];
  onChange: (goals: UserGoalInsert[]) => void;
}

export interface PreferencesStepProps extends Omit<StepComponentProps, 'data' | 'onChange'> {
  data: Partial<ProfileUpdate>;
  onChange: (updates: Partial<ProfileUpdate>) => void;
}

export interface EquipmentStepProps extends Omit<StepComponentProps, 'data' | 'onChange'> {
  data: Partial<ProfileUpdate>;
  onChange: (updates: Partial<ProfileUpdate>) => void;
}

export interface PersonalizationStepProps extends Omit<StepComponentProps, 'data' | 'onChange'> {
  data: Partial<ProfileUpdate>;
  onChange: (updates: Partial<ProfileUpdate>) => void;
}

// API Types

export interface SaveProfileRequest {
  profileData: ProfileUpdate;
  currentStep?: number;
  isComplete?: boolean;
}

export interface SaveGoalsRequest {
  goals: UserGoalInsert[];
}

export interface OnboardingStatusResponse {
  completed: boolean;
  currentStep: number;
  profileId?: string;
  hasGoals: boolean;
  lastUpdated?: string;
}

export interface CompleteOnboardingRequest {
  profileId: string;
}

export interface CompleteOnboardingResponse {
  success: boolean;
  redirectUrl: string;
  welcomeMessage?: string;
}

// Equipment Categories

export interface EquipmentCategory {
  id: string;
  name: string;
  icon?: string;
  items: EquipmentItem[];
}

export interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  isCommon?: boolean;
  requiresSpace?: boolean;
}

export const EQUIPMENT_CATEGORIES: EquipmentCategory[] = [
  {
    id: 'cardio',
    name: 'Cardio Equipment',
    items: [
      { id: 'treadmill', name: 'Treadmill', category: 'cardio', requiresSpace: true },
      { id: 'bike', name: 'Stationary Bike', category: 'cardio', requiresSpace: true },
      { id: 'elliptical', name: 'Elliptical', category: 'cardio', requiresSpace: true },
      { id: 'rower', name: 'Rowing Machine', category: 'cardio', requiresSpace: true },
      { id: 'jump_rope', name: 'Jump Rope', category: 'cardio', isCommon: true }
    ]
  },
  {
    id: 'strength',
    name: 'Strength Equipment',
    items: [
      { id: 'dumbbells', name: 'Dumbbells', category: 'strength', isCommon: true },
      { id: 'barbell', name: 'Barbell', category: 'strength' },
      { id: 'kettlebell', name: 'Kettlebells', category: 'strength', isCommon: true },
      { id: 'resistance_bands', name: 'Resistance Bands', category: 'strength', isCommon: true },
      { id: 'pull_up_bar', name: 'Pull-up Bar', category: 'strength' },
      { id: 'bench', name: 'Weight Bench', category: 'strength', requiresSpace: true }
    ]
  },
  {
    id: 'flexibility',
    name: 'Flexibility & Recovery',
    items: [
      { id: 'yoga_mat', name: 'Yoga Mat', category: 'flexibility', isCommon: true },
      { id: 'foam_roller', name: 'Foam Roller', category: 'flexibility', isCommon: true },
      { id: 'yoga_blocks', name: 'Yoga Blocks', category: 'flexibility' },
      { id: 'stretch_strap', name: 'Stretching Strap', category: 'flexibility' }
    ]
  },
  {
    id: 'none',
    name: 'No Equipment',
    items: [
      { id: 'bodyweight', name: 'Bodyweight Only', category: 'none', isCommon: true }
    ]
  }
];

// Validation Rules

export const VALIDATION_RULES = {
  fullName: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s'-]+$/
  },
  age: {
    required: true,
    min: 13,
    max: 120
  },
  height: {
    required: false,
    min: 50, // cm
    max: 300 // cm
  },
  weight: {
    required: false,
    min: 20, // kg
    max: 500 // kg
  },
  aboutMe: {
    required: false,
    maxLength: 2000
  },
  goals: {
    required: true,
    minCount: 1,
    maxCount: 5
  },
  goalDescription: {
    required: true,
    minLength: 10,
    maxLength: 500
  },
  trainingFrequency: {
    required: false,
    pattern: /^[0-9]+\s*(day|week|month)/i
  }
};

// Step titles and descriptions
export const STEP_TITLES: Record<number, string> = {
  1: 'Basic Information',
  2: 'Your Fitness Goals',
  3: 'Preferences & Activities',
  4: 'Equipment & Limitations',
  5: 'Personalization'
};

export const STEP_DESCRIPTIONS: Record<number, string> = {
  1: 'Tell us a bit about yourself',
  2: 'What do you want to achieve?',
  3: 'How do you like to train?',
  4: 'What do you have access to?',
  5: 'Final touches for your profile'
};

// Helper Functions

export function validateStep(step: number, data: any): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const errorStrings: string[] = [];

  switch (step) {
    case 1: // Basic Info
      if (!data.full_name?.trim()) {
        errors.push({ field: 'full_name', message: 'Full name is required' });
        errorStrings.push('Full name is required');
      }
      if (!data.age || data.age < 13 || data.age > 120) {
        errors.push({ field: 'age', message: 'Please enter a valid age (13-120)' });
        errorStrings.push('Age must be between 13 and 120');
      }
      break;

    case 2: // Goals
      if (!data.goals || data.goals.length === 0) {
        errors.push({ field: 'goals', message: 'Please select at least one goal' });
        errorStrings.push('At least one goal is required');
      }
      if (data.goals && data.goals.length > 5) {
        warnings.push({ field: 'goals', message: 'Consider focusing on fewer goals for better results' });
      }
      break;

    case 3: // Preferences
      if (!data.preferred_activities || data.preferred_activities.length === 0) {
        errorStrings.push('At least one preferred activity is required');
      }
      break;

    case 4: // Equipment
      if (!data.available_equipment || data.available_equipment.length === 0) {
        errorStrings.push('Please select available equipment or choose bodyweight only');
      }
      break;

    case 5: // Personalization
      // Optional step, no required fields
      break;

    default:
      errorStrings.push('Invalid step');
  }

  return {
    isValid: errors.length === 0 && errorStrings.length === 0,
    errors: errorStrings,
    validationErrors: errors,
    warnings: warnings.length > 0 ? warnings : undefined
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

export function isStepComplete(step: number, state: OnboardingState): boolean {
  const validation = state.validation[step];
  return validation?.isValid || false;
}

// Local Storage Keys
export const ONBOARDING_STORAGE_KEYS = {
  DRAFT: 'wagner_onboarding_draft',
  CURRENT_STEP: 'onboarding_current_step',
  FORM_DATA: 'onboarding_form_data',
  HAS_CHANGES: 'onboarding_has_changes',
  STEP: 'wagner_onboarding_step',
  TIMESTAMP: 'wagner_onboarding_timestamp'
};