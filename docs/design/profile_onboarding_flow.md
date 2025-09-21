# Profile Onboarding Flow Design

## User Story
As a new user, after creating my account, I want to be guided through a clear, step-by-step process to input my goals, experience, preferences, and constraints, so the app can be personalized for me from the start.

## Acceptance Criteria

1. **Onboarding Page Exists**
   - A new page is accessible at `/profile/onboarding`
   - The page is automatically shown after first login
   - The page can be revisited from profile settings

2. **Multi-Step Wizard UI**
   - The UI is a multi-step wizard component (`ProfileForm.tsx`)
   - Clear progress indicator shows current step and total steps
   - Navigation allows moving between steps (back/next)
   - Skip option for optional fields

3. **Logical Step Grouping**
   - **Step 1: Basic Information**
     - Full name, age, gender
     - Height, weight (with unit conversion)
     - Timezone detection/selection

   - **Step 2: Experience & Goals**
     - Experience level (beginner/intermediate/advanced)
     - Primary fitness goals (multi-select)
     - Goal priorities and target dates

   - **Step 3: Preferences & Activities**
     - Preferred activities (multi-select with search)
     - Motivation factors (what drives you)
     - Training frequency and session duration

   - **Step 4: Equipment & Limitations**
     - Available equipment (categorized checklist)
     - Physical limitations or injuries
     - Dietary preferences and restrictions

   - **Step 5: Personalization & Notifications**
     - About me (free text for AI context)
     - Notification preferences
     - Review and confirm all information

4. **Progress Persistence**
   - Progress is saved between steps automatically
   - User can leave and return without losing data
   - Draft state is maintained in local storage
   - Server sync on each step completion

5. **Validation & Requirements**
   - Required fields are clearly marked
   - Validation prevents proceeding with invalid data
   - Error messages are clear and actionable
   - Minimum requirements for profile completion

6. **Contextual Help**
   - Tooltips explain why information is collected
   - Examples provided for complex fields
   - Privacy assurances for sensitive data
   - Benefits explained for each data point

7. **Completion Flow**
   - Data saved via POST to `/api/profile/save`
   - Success confirmation shown
   - Automatic redirect to main dashboard
   - Welcome message with personalized tips

## Technical Approach

### Component Architecture
```typescript
// Main wrapper component
<OnboardingLayout>
  <ProfileForm
    currentStep={step}
    onStepChange={handleStepChange}
    onComplete={handleComplete}
  >
    <BasicInfoStep />
    <GoalsStep />
    <PreferencesStep />
    <EquipmentStep />
    <PersonalizationStep />
  </ProfileForm>
</OnboardingLayout>
```

### State Management
```typescript
interface OnboardingState {
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
}
```

### Data Flow
1. **Initial Load**: Check if user has existing profile data
2. **Step Navigation**: Validate current step before allowing next
3. **Auto-Save**: Debounced save on field changes (2 second delay)
4. **Manual Save**: Save button on each step
5. **Final Submit**: Complete validation and save all data

### API Endpoints
```typescript
// Save profile data
POST /api/profile/save
Body: ProfileUpdate

// Save user goals
POST /api/profile/goals
Body: UserGoalInsert[]

// Get onboarding status
GET /api/profile/onboarding-status
Response: { completed: boolean, currentStep: number }

// Complete onboarding
POST /api/profile/complete-onboarding
Response: { success: boolean, redirectUrl: string }
```

## UI/UX Design Principles

### Visual Design
- Clean, minimal interface with focus on content
- Progress bar prominently displayed
- Smooth transitions between steps
- Mobile-responsive design
- Accessible color contrast and font sizes

### Interaction Patterns
- Keyboard navigation support (Tab, Enter, Arrows)
- Form field auto-focus on step change
- Smart defaults where applicable
- Inline validation with debouncing
- Loading states for async operations

### User Guidance
- Welcome message explaining the process
- Time estimate (5-7 minutes) shown upfront
- Optional fields clearly marked
- Progress saved indicator
- Exit confirmation if unsaved changes

## Component Specifications

### ProfileForm.tsx
```typescript
interface ProfileFormProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete: (data: ProfileUpdate) => Promise<void>;
  initialData?: Partial<Profile>;
  children: React.ReactNode;
}
```

### Step Components
Each step component follows this interface:
```typescript
interface StepProps {
  data: Partial<ProfileUpdate>;
  onChange: (updates: Partial<ProfileUpdate>) => void;
  onValidate: () => ValidationResult;
  isActive: boolean;
}
```

### Validation
```typescript
interface ValidationResult {
  isValid: boolean;
  errors: {
    field: string;
    message: string;
  }[];
  warnings?: {
    field: string;
    message: string;
  }[];
}
```

## Success Metrics
- 90% of users complete onboarding
- Average completion time under 7 minutes
- Less than 5% abandon rate per step
- 95% of required fields filled
- Zero critical errors during onboarding

## Accessibility Requirements
- WCAG 2.1 AA compliance
- Screen reader friendly
- Keyboard navigation complete
- High contrast mode support
- Clear focus indicators

## Error Handling
- Network errors: Show retry option with offline mode
- Validation errors: Inline field-level messages
- Save errors: Toast notification with manual retry
- Session timeout: Auto-save and redirect to login
- Partial data: Allow continuing from last saved step

## Testing Considerations
- Unit tests for each step component
- Integration tests for form flow
- E2E tests for complete onboarding
- Accessibility tests with screen readers
- Performance tests for auto-save
- Mobile device testing

## Future Enhancements
- AI-powered field suggestions
- Import from fitness tracker apps
- Social profile import
- Video tutorials for complex sections
- Onboarding analytics dashboard
- A/B testing framework for optimization