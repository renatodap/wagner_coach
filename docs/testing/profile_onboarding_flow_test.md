# Profile Onboarding Flow Test Plan

## Test Objectives
Ensure the onboarding flow provides a smooth, error-free experience for new users while correctly capturing and validating all profile information.

## Test Categories

### 1. Component Unit Tests

#### Test Suite: `components/profile/ProfileForm.test.tsx`
```typescript
describe('ProfileForm Component', () => {
  describe('Step Navigation', () => {
    test('should render with initial step 1')
    test('should show correct total number of steps')
    test('should navigate to next step when Next is clicked')
    test('should navigate to previous step when Back is clicked')
    test('should disable Back button on first step')
    test('should show Complete button on last step')
    test('should not allow navigation with validation errors')
  })

  describe('Progress Indicator', () => {
    test('should show progress bar with correct percentage')
    test('should highlight current step')
    test('should mark completed steps with checkmark')
    test('should allow jumping to completed steps')
    test('should not allow jumping to future steps')
  })

  describe('Data Persistence', () => {
    test('should save form data in state when fields change')
    test('should persist data when navigating between steps')
    test('should save draft to localStorage on changes')
    test('should restore draft from localStorage on mount')
    test('should clear draft after successful submission')
  })
})
```

#### Test Suite: `components/profile/steps/BasicInfoStep.test.tsx`
```typescript
describe('BasicInfoStep Component', () => {
  describe('Field Rendering', () => {
    test('should render all basic info fields')
    test('should show required field indicators')
    test('should populate fields with initial data')
    test('should show tooltips on hover')
  })

  describe('Field Validation', () => {
    test('should require full name')
    test('should validate age is between 13 and 120')
    test('should validate height is reasonable (50-300 cm)')
    test('should validate weight is reasonable (20-500 kg)')
    test('should auto-detect timezone from browser')
  })

  describe('Unit Conversion', () => {
    test('should toggle between metric and imperial units')
    test('should convert height from feet/inches to cm')
    test('should convert weight from lbs to kg')
    test('should maintain precision during conversion')
  })
})
```

#### Test Suite: `components/profile/steps/GoalsStep.test.tsx`
```typescript
describe('GoalsStep Component', () => {
  describe('Goal Selection', () => {
    test('should render all goal type options')
    test('should allow selecting multiple goals')
    test('should require at least one goal')
    test('should limit to maximum 5 active goals')
  })

  describe('Goal Details', () => {
    test('should show detail form when goal is selected')
    test('should validate target values are positive')
    test('should validate target dates are in future')
    test('should set appropriate units for each goal type')
    test('should allow setting priority 1-5')
  })

  describe('Goal Prioritization', () => {
    test('should allow drag-and-drop reordering')
    test('should update priority values on reorder')
    test('should highlight primary goal')
    test('should warn if no primary goal set')
  })
})
```

#### Test Suite: `components/profile/steps/EquipmentStep.test.tsx`
```typescript
describe('EquipmentStep Component', () => {
  describe('Equipment Categories', () => {
    test('should group equipment by category')
    test('should show category headers')
    test('should allow expanding/collapsing categories')
    test('should show equipment icons')
  })

  describe('Equipment Selection', () => {
    test('should allow multiple equipment selection')
    test('should show "No equipment" option')
    test('should disable other options when "No equipment" selected')
    test('should highlight commonly used equipment')
    test('should allow custom equipment entry')
  })

  describe('Physical Limitations', () => {
    test('should render limitations text area')
    test('should provide common limitation suggestions')
    test('should limit text to 500 characters')
    test('should sanitize user input')
    test('should show privacy notice')
  })
})
```

### 2. API Route Tests

#### Test Suite: `app/api/profile/save/route.test.ts`
```typescript
describe('POST /api/profile/save', () => {
  describe('Authentication', () => {
    test('should reject unauthenticated requests')
    test('should accept authenticated requests')
    test('should validate user owns the profile')
  })

  describe('Data Validation', () => {
    test('should validate required fields')
    test('should reject invalid enum values')
    test('should sanitize string inputs')
    test('should validate array lengths')
    test('should validate numeric ranges')
  })

  describe('Database Operations', () => {
    test('should create new profile if not exists')
    test('should update existing profile')
    test('should handle partial updates')
    test('should return updated profile data')
    test('should trigger embedding generation')
  })

  describe('Error Handling', () => {
    test('should return 400 for invalid data')
    test('should return 401 for unauthenticated')
    test('should return 500 for database errors')
    test('should log errors appropriately')
  })
})
```

#### Test Suite: `app/api/profile/goals/route.test.ts`
```typescript
describe('POST /api/profile/goals', () => {
  describe('Goal Creation', () => {
    test('should create multiple goals in transaction')
    test('should validate all goals before creating any')
    test('should assign correct user_id to all goals')
    test('should set created_at timestamps')
  })

  describe('Goal Validation', () => {
    test('should validate goal types')
    test('should validate priority range')
    test('should validate target dates')
    test('should validate target values')
    test('should check for duplicate goals')
  })

  describe('Response', () => {
    test('should return created goals with IDs')
    test('should include embedding generation status')
    test('should rollback on any error')
  })
})
```

### 3. Integration Tests

#### Test Suite: `__tests__/integration/onboarding.test.tsx`
```typescript
describe('Complete Onboarding Flow', () => {
  describe('New User Flow', () => {
    test('should redirect to onboarding after signup')
    test('should complete all 5 steps sequentially')
    test('should save profile data to database')
    test('should create user goals')
    test('should redirect to dashboard on completion')
  })

  describe('Auto-Save Functionality', () => {
    test('should auto-save after 2 seconds of inactivity')
    test('should show saving indicator')
    test('should handle save failures gracefully')
    test('should merge conflicts if multiple tabs open')
  })

  describe('Resume Onboarding', () => {
    test('should allow resuming from last step')
    test('should restore previously entered data')
    test('should update completion status')
    test('should handle expired sessions')
  })
})
```

### 4. End-to-End Tests

#### Test Suite: `e2e/onboarding.spec.ts`
```typescript
describe('E2E: Onboarding Journey', () => {
  describe('Happy Path', () => {
    test('should complete full onboarding successfully')
    test('should show personalized dashboard after completion')
    test('should generate AI embeddings')
    test('should send welcome email')
  })

  describe('Error Recovery', () => {
    test('should handle network disconnection')
    test('should recover from API errors')
    test('should maintain data integrity on browser crash')
    test('should handle session timeout gracefully')
  })

  describe('Mobile Experience', () => {
    test('should be fully functional on mobile devices')
    test('should handle touch interactions')
    test('should adapt layout for small screens')
    test('should handle virtual keyboard properly')
  })
})
```

### 5. Accessibility Tests

#### Test Suite: `__tests__/a11y/onboarding.test.tsx`
```typescript
describe('Onboarding Accessibility', () => {
  describe('Keyboard Navigation', () => {
    test('should navigate with Tab key')
    test('should submit with Enter key')
    test('should navigate steps with arrow keys')
    test('should trap focus in modals')
  })

  describe('Screen Reader Support', () => {
    test('should announce step changes')
    test('should read field labels')
    test('should announce validation errors')
    test('should provide progress updates')
  })

  describe('Visual Accessibility', () => {
    test('should meet WCAG color contrast requirements')
    test('should support high contrast mode')
    test('should scale with browser zoom')
    test('should not rely solely on color')
  })
})
```

### 6. Performance Tests

#### Test Suite: `__tests__/performance/onboarding.test.ts`
```typescript
describe('Onboarding Performance', () => {
  describe('Load Times', () => {
    test('should load initial page in < 2 seconds')
    test('should transition between steps in < 500ms')
    test('should show loading states immediately')
  })

  describe('Auto-Save Performance', () => {
    test('should debounce saves properly')
    test('should not block UI during save')
    test('should batch multiple field updates')
    test('should handle rapid field changes')
  })

  describe('Bundle Size', () => {
    test('should lazy load step components')
    test('should code split appropriately')
    test('should minimize initial bundle')
  })
})
```

## Test Data Requirements

### Mock User Data
```typescript
const mockNewUser = {
  id: 'test-user-123',
  email: 'newuser@example.com',
  created_at: new Date().toISOString()
};

const mockProfileData = {
  full_name: 'Test User',
  age: 30,
  gender: 'male',
  height: 180,
  weight: 75,
  experience_level: 'intermediate',
  // ... other fields
};

const mockGoals = [
  {
    goal_type: 'weight_loss',
    goal_description: 'Lose 10 pounds',
    target_value: 10,
    target_unit: 'lbs',
    priority: 1
  },
  // ... more goals
];
```

### Test Utilities
```typescript
// Helper to complete onboarding flow
export async function completeOnboarding(data?: Partial<ProfileUpdate>) {
  // Implementation
}

// Helper to mock API responses
export function mockProfileAPI(response: any) {
  // Implementation
}

// Helper to test form validation
export async function testFieldValidation(field: string, invalidValues: any[]) {
  // Implementation
}
```

## Coverage Requirements
- Unit test coverage: ≥ 90%
- Integration test coverage: ≥ 80%
- E2E critical paths: 100%
- API route coverage: ≥ 85%

## Success Criteria
- ✅ All unit tests pass
- ✅ All integration tests pass
- ✅ E2E tests complete in < 30 seconds
- ✅ Zero accessibility violations
- ✅ Performance budgets met
- ✅ No console errors or warnings
- ✅ Works on all supported browsers
- ✅ Mobile responsive at all breakpoints

## Test Execution Plan

### Phase 1: Component Tests
1. Run all unit tests for individual components
2. Verify props and state management
3. Check render output and interactions

### Phase 2: API Tests
1. Test all API routes in isolation
2. Verify database operations
3. Check error handling

### Phase 3: Integration Tests
1. Test component + API integration
2. Verify data flow through system
3. Check state synchronization

### Phase 4: E2E Tests
1. Run full user journeys
2. Test on multiple devices/browsers
3. Verify production-like behavior

## Continuous Integration
```yaml
name: Onboarding Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run unit tests
        run: npm test -- --coverage
      - name: Run integration tests
        run: npm run test:integration
      - name: Run E2E tests
        run: npm run test:e2e
      - name: Check coverage
        run: npm run coverage:check
```