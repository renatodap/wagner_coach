<<<<<<< HEAD
// Onboarding Flow Type Definitions

import { ProfileUpdate, UserGoalInsert } from './profile';

export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  stepData: {
    basicInfo: Partial<ProfileUpdate>;
    goals: UserGoalInsert[];
    preferences: Partial<ProfileUpdate>;
    equipment: Partial<ProfileUpdate>;
    personalization: Partial<ProfileUpdate>;
  };
  validation: {
    [step: number]: ValidationResult;
  };
  isDirty: boolean;
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

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationWarning[];
}
=======
import { ProfileFormData, ValidationResult } from './profile';
>>>>>>> feature/profile-goals-tdd

export interface ValidationError {
  field: string;
  message: string;
<<<<<<< HEAD
  code?: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
}

// Component Props Interfaces

export interface ProfileFormProps {
  currentStep?: number;
  onStepChange: (step: number) => void;
  onComplete: (data: ProfileUpdate & { goals: UserGoalInsert[] }) => Promise<void>;
  initialData?: Partial<ProfileUpdate>;
  children: React.ReactNode;
}

export interface StepProps {
  data: Partial<ProfileUpdate> | UserGoalInsert[];
  onChange: (updates: Partial<ProfileUpdate> | UserGoalInsert[]) => void;
  onValidate: () => ValidationResult;
  isActive: boolean;
  onNext?: () => void;
  onBack?: () => void;
}

export interface BasicInfoStepProps extends Omit<StepProps, 'data' | 'onChange'> {
  data: Partial<ProfileUpdate>;
  onChange: (updates: Partial<ProfileUpdate>) => void;
}

export interface GoalsStepProps extends Omit<StepProps, 'data' | 'onChange'> {
  data: UserGoalInsert[];
  onChange: (goals: UserGoalInsert[]) => void;
}

export interface PreferencesStepProps extends Omit<StepProps, 'data' | 'onChange'> {
  data: Partial<ProfileUpdate>;
  onChange: (updates: Partial<ProfileUpdate>) => void;
}

export interface EquipmentStepProps extends Omit<StepProps, 'data' | 'onChange'> {
  data: Partial<ProfileUpdate>;
  onChange: (updates: Partial<ProfileUpdate>) => void;
}

export interface PersonalizationStepProps extends Omit<StepProps, 'data' | 'onChange'> {
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

// Helper Functions

export function validateStep(step: number, data: any): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  switch (step) {
    case 1: // Basic Info
      if (!data.full_name) {
        errors.push({ field: 'full_name', message: 'Full name is required' });
      }
      if (!data.age || data.age < 13 || data.age > 120) {
        errors.push({ field: 'age', message: 'Please enter a valid age (13-120)' });
=======
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
>>>>>>> feature/profile-goals-tdd
      }
      break;

    case 2: // Goals
      if (!data.goals || data.goals.length === 0) {
<<<<<<< HEAD
        errors.push({ field: 'goals', message: 'Please select at least one goal' });
      }
      if (data.goals && data.goals.length > 5) {
        warnings.push({ field: 'goals', message: 'Consider focusing on fewer goals for better results' });
      }
      break;

    // Add more validation for other steps
=======
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
>>>>>>> feature/profile-goals-tdd
  }

  return {
    isValid: errors.length === 0,
<<<<<<< HEAD
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
=======
    errors
>>>>>>> feature/profile-goals-tdd
  };
}

export function getStepTitle(step: number): string {
<<<<<<< HEAD
  const titles = [
    'Basic Information',
    'Your Fitness Goals',
    'Preferences & Activities',
    'Equipment & Limitations',
    'Personalization'
  ];
  return titles[step - 1] || 'Unknown Step';
}

export function getStepDescription(step: number): string {
  const descriptions = [
    'Tell us a bit about yourself',
    'What do you want to achieve?',
    'How do you like to train?',
    'What do you have access to?',
    'Final touches for your profile'
  ];
  return descriptions[step - 1] || '';
}

export function calculateProgress(currentStep: number, totalSteps: number): number {
  return Math.round((currentStep / totalSteps) * 100);
}

export function isStepComplete(step: number, state: OnboardingState): boolean {
  const validation = state.validation[step];
  return validation?.isValid || false;
}

// Local Storage Keys
export const ONBOARDING_STORAGE_KEYS = {
  DRAFT: 'wagner_onboarding_draft',
  STEP: 'wagner_onboarding_step',
  TIMESTAMP: 'wagner_onboarding_timestamp'
};
=======
  return STEP_TITLES[step] || `Step ${step}`;
}

export function getStepDescription(step: number): string {
  return STEP_DESCRIPTIONS[step] || '';
}

export function calculateProgress(currentStep: number, totalSteps: number = 5): number {
  return Math.round((currentStep / totalSteps) * 100);
}
>>>>>>> feature/profile-goals-tdd
