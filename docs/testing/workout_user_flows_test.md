# Test Design: Complete Workout User Flows

## Testing Strategy

### Test Pyramid Structure
```
E2E Tests (10%) - Full user journeys
├── Integration Tests (20%) - Component interactions
└── Unit Tests (70%) - Individual functions
```

### Test Categories
- **Unit Tests**: Individual component logic
- **Integration Tests**: Component communication
- **E2E Tests**: Complete user workflows
- **Performance Tests**: Load time and responsiveness
- **Accessibility Tests**: WCAG compliance

## Test Specifications

### 1. Starting a Workout Flow Tests

#### Unit Tests
**Dashboard Component** (`DashboardClient.test.tsx`)
```typescript
describe('DashboardClient', () => {
  test('renders workout list with proper data')
  test('filters workouts with exercises only')
  test('displays workout cards with correct information')
  test('handles empty workout list state')
  test('shows loading state during data fetch')
})
```

**Workout Modal** (`WorkoutModal.test.tsx`)
```typescript
describe('WorkoutModal', () => {
  test('opens modal when workout card clicked')
  test('displays exercise list with sets and reps')
  test('shows total duration and difficulty')
  test('closes modal on cancel or outside click')
  test('calls start workout function on START button')
})
```

#### Integration Tests
**Dashboard to Modal Flow** (`dashboard-integration.test.tsx`)
```typescript
describe('Dashboard Integration', () => {
  test('workout selection opens modal with correct data')
  test('modal start button creates session and redirects')
  test('modal cancel returns to dashboard state')
  test('handles workout data loading errors gracefully')
})
```

#### E2E Tests
**Complete Startup Flow** (`startup-flow.e2e.ts`)
```typescript
describe('Workout Startup E2E', () => {
  test('user can discover and start workout')
  test('modal displays correct exercise information')
  test('start button creates session and navigates')
  test('cancel preserves dashboard state')
})
```

### 2. During Workout Flow Tests

#### Unit Tests
**ActiveWorkoutClient** (`ActiveWorkoutClient.test.tsx`)
```typescript
describe('ActiveWorkoutClient', () => {
  test('renders exercise list with correct opacity states')
  test('highlights current exercise with orange styling')
  test('shows completed exercises with green and checkmark')
  test('displays upcoming exercises with reduced opacity')
  test('handles set completion with weight and reps')
  test('manages rest timer countdown correctly')
  test('auto-advances set counter after completion')
  test('auto-advances to next exercise after final set')
})
```

**Exercise Navigation** (`ExerciseNavigation.test.tsx`)
```typescript
describe('Exercise Navigation', () => {
  test('normal progression: set -> rest -> next set')
  test('skip sets moves immediately to next exercise')
  test('direct jump navigates to clicked exercise')
  test('saves progress when jumping between exercises')
  test('maintains state during navigation')
})
```

#### Integration Tests
**Workout Session Management** (`session-management.test.tsx`)
```typescript
describe('Session Management', () => {
  test('set completion triggers database save')
  test('exercise navigation updates session state')
  test('timer state persists across navigation')
  test('progress data remains consistent')
})
```

#### E2E Tests
**Complete Workout Session** (`workout-session.e2e.ts`)
```typescript
describe('Workout Session E2E', () => {
  test('user completes full workout with all navigation options')
  test('set completion and rest timer work correctly')
  test('exercise jumping maintains progress')
  test('weight tracking saves properly')
})
```

### 3. Weight Tracking Flow Tests

#### Unit Tests
**WeightTracker** (`WeightTracker.test.tsx`)
```typescript
describe('WeightTracker', () => {
  test('shows weight input for barbell/dumbbell exercises')
  test('hides weight input for bodyweight exercises')
  test('reveals weight input when "add weight" clicked')
  test('accepts decimal weight values')
  test('validates positive numbers only')
  test('uses previous weight as placeholder')
})
```

#### Integration Tests
**Exercise Equipment Integration** (`equipment-integration.test.tsx`)
```typescript
describe('Equipment Integration', () => {
  test('weight input visibility based on exercise equipment')
  test('weight data saves with set performance')
  test('optional weight allows blank submission')
})
```

### 4. Workout Completion Flow Tests

#### Unit Tests
**WorkoutControls** (`WorkoutControls.test.tsx`)
```typescript
describe('WorkoutControls', () => {
  test('sticky header remains visible during scroll')
  test('finish button saves workout and redirects')
  test('pause button stops timer and updates state')
  test('cancel button shows confirmation dialog')
  test('cancel confirmed discards progress')
})
```

**Timer Management** (`Timer.test.tsx`)
```typescript
describe('Timer Management', () => {
  test('timer starts automatically on workout start')
  test('pause stops timer and tracks pause duration')
  test('resume continues from pause point')
  test('timer accuracy within acceptable range')
})
```

#### Integration Tests
**Completion Workflow** (`completion-workflow.test.tsx`)
```typescript
describe('Completion Workflow', () => {
  test('finish saves all set performances')
  test('completion record created with correct data')
  test('redirect to progress page occurs')
  test('workout appears in history immediately')
})
```

#### E2E Tests
**Complete Finish Flow** (`finish-flow.e2e.ts`)
```typescript
describe('Finish Flow E2E', () => {
  test('user can complete workout and see in progress')
  test('pause and resume functionality works')
  test('cancel workflow prevents data loss')
})
```

### 5. Post-Workout Management Flow Tests

#### Unit Tests
**WorkoutHistory** (`WorkoutHistory.test.tsx`)
```typescript
describe('WorkoutHistory', () => {
  test('displays workout list in chronological order')
  test('shows correct workout information')
  test('edit mode allows duration/rating/notes changes')
  test('delete shows confirmation and removes workout')
  test('calculates stats correctly')
})
```

**EditWorkout** (`EditWorkout.test.tsx`)
```typescript
describe('EditWorkout', () => {
  test('enters edit mode when edit button clicked')
  test('saves changes immediately on save button')
  test('cancels changes and reverts on cancel')
  test('validates input constraints')
})
```

#### Integration Tests
**Progress Management** (`progress-management.test.tsx`)
```typescript
describe('Progress Management', () => {
  test('edit changes persist to database')
  test('delete removes from database and updates UI')
  test('stats recalculate after modifications')
})
```

#### E2E Tests
**Complete Progress Management** (`progress-management.e2e.ts`)
```typescript
describe('Progress Management E2E', () => {
  test('user can edit completed workout details')
  test('user can delete workout from history')
  test('stats update correctly after changes')
})
```

## Test Data Strategy

### Mock Data Structure
```typescript
// Test fixtures for consistent data
export const mockWorkouts = [
  {
    id: 1,
    name: 'WAGNER PUSH DAY',
    type: 'push',
    difficulty: 'intermediate',
    estimated_duration_minutes: 45,
    exercises: [...mockExercises]
  }
]

export const mockExercises = [
  {
    id: 1,
    name: 'Bench Press',
    sets: 4,
    reps: '6-8',
    equipment: 'barbell',
    rest_seconds: 120
  }
]

export const mockActiveSession = {
  id: 1,
  workout_id: 1,
  current_exercise_index: 0,
  current_set: 1,
  status: 'active'
}
```

### Test Utilities
```typescript
// Custom render with providers
export const renderWithProviders = (component, options = {}) => {
  return render(component, {
    wrapper: ({ children }) => (
      <SupabaseProvider>
        <RouterProvider>
          {children}
        </RouterProvider>
      </SupabaseProvider>
    ),
    ...options
  })
}

// Mock Supabase client
export const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: mockData })
  })),
  rpc: jest.fn().mockResolvedValue({ data: mockData })
}
```

## Performance Test Specifications

### Load Time Tests
```typescript
describe('Performance Tests', () => {
  test('dashboard loads within 2 seconds')
  test('workout modal opens within 200ms')
  test('exercise navigation completes within 200ms')
  test('set completion saves within 1 second')
  test('progress page loads within 3 seconds')
})
```

### Memory and Resource Tests
```typescript
describe('Resource Tests', () => {
  test('timer does not cause memory leaks')
  test('component cleanup prevents resource accumulation')
  test('image loading is optimized')
})
```

## Accessibility Test Specifications

### WCAG Compliance
```typescript
describe('Accessibility Tests', () => {
  test('all interactive elements have proper ARIA labels')
  test('keyboard navigation works for all controls')
  test('color contrast meets WCAG AA standards')
  test('screen reader announcements for state changes')
  test('focus management during modal interactions')
})
```

## Test Environment Setup

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    '!app/**/*.d.ts',
    '!app/**/page.tsx' // Exclude Next.js pages
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

### Testing Library Setup
```typescript
// jest.setup.js
import '@testing-library/jest-dom'
import { setupServer } from 'msw/node'
import { handlers } from './mocks/handlers'

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient
}))

// MSW server for API mocking
export const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

## Test Execution Strategy

### Development Testing
1. **Unit Tests**: Run on every file change
2. **Integration Tests**: Run on commit
3. **E2E Tests**: Run on pull request
4. **Performance Tests**: Run nightly

### CI/CD Pipeline
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:e2e
      - run: npm run test:coverage
```

### Coverage Requirements
- **Minimum Coverage**: 80% for all metrics
- **Critical Path Coverage**: 95% for core user flows
- **Component Coverage**: 90% for UI components
- **Utility Coverage**: 100% for pure functions

## Test Documentation
Each test file must include:
- Purpose and scope description
- Setup and teardown procedures
- Mock data requirements
- Expected behavior documentation
- Edge case coverage explanation