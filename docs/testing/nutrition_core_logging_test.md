# Nutrition Core Logging - Test Plan

## Test Categories

### 1. Unit Tests

#### MealLogForm Component Tests (`components/nutrition/MealLogForm.test.tsx`)

**Test Cases:**
1. **Component Rendering**
   - Should render all form fields (meal name, category, time, notes)
   - Should display submit and cancel buttons
   - Should show required field indicators

2. **Form Validation**
   - Should show error when meal name is empty
   - Should show error when category is not selected
   - Should accept valid form data
   - Should trim whitespace from meal name

3. **Form State Management**
   - Should update meal name on input change
   - Should update category on selection change
   - Should update time on picker change
   - Should update notes on textarea change
   - Should reset form after successful submission

4. **User Interactions**
   - Should call onSubmit handler with form data when submitted
   - Should call onCancel handler when cancel button clicked
   - Should disable submit button during submission
   - Should show loading state during submission

#### Type Tests (`types/nutrition.test.ts`)

**Test Cases:**
1. **Type Validation**
   - Should enforce required fields in MealInsert type
   - Should allow optional fields in Meal type
   - Should restrict meal_category to valid enum values

### 2. Integration Tests

#### API Route Tests (`app/api/nutrition/meals/route.test.ts`)

**Test Cases:**
1. **POST /api/nutrition/meals**
   - Should create a new meal with valid data
   - Should return 400 for missing required fields
   - Should return 401 for unauthenticated requests
   - Should return 403 when user tries to create meal for another user
   - Should properly sanitize input data
   - Should handle database errors gracefully

2. **Database Integration**
   - Should insert meal with correct user_id
   - Should auto-generate timestamps
   - Should enforce RLS policies

#### Navigation Tests (`components/layout/BottomNav.test.tsx`)

**Test Cases:**
1. **Navigation Icon**
   - Should display nutrition icon in bottom nav
   - Should highlight nutrition icon when on nutrition pages
   - Should navigate to /nutrition when clicked

### 3. End-to-End Tests

#### Complete User Flow (`e2e/nutrition-logging.test.ts`)

**Test Scenarios:**

1. **Happy Path - Log a Breakfast**
   ```
   1. User clicks Nutrition icon in bottom nav
   2. User clicks "Add Meal" button
   3. User enters "Oatmeal with berries" as meal name
   4. User selects "Breakfast" as category
   5. User keeps default time (now)
   6. User adds note "Felt energized after"
   7. User clicks Submit
   8. System shows success toast
   9. User is redirected to /nutrition
   10. Meal appears in database
   ```

2. **Validation Error Flow**
   ```
   1. User navigates to /nutrition/add
   2. User clicks Submit without filling form
   3. System shows validation errors for required fields
   4. User fills in meal name only
   5. User clicks Submit
   6. System shows error for missing category
   7. User selects category
   8. User submits successfully
   ```

3. **Cancel Flow**
   ```
   1. User navigates to /nutrition/add
   2. User fills in partial form data
   3. User clicks Cancel
   4. System returns to /nutrition
   5. No data is saved to database
   ```

## Test Data

### Mock Data
```typescript
export const mockMeal: Meal = {
  id: 'test-meal-id',
  user_id: 'test-user-id',
  meal_name: 'Test Meal',
  meal_category: 'lunch',
  logged_at: '2024-01-20T12:00:00Z',
  calories: null,
  protein_g: null,
  carbs_g: null,
  fat_g: null,
  notes: 'Test notes',
  created_at: '2024-01-20T12:00:00Z',
  updated_at: '2024-01-20T12:00:00Z'
};

export const mockMealInsert: MealInsert = {
  meal_name: 'New Test Meal',
  meal_category: 'dinner',
  logged_at: '2024-01-20T18:00:00Z',
  notes: 'Optional notes'
};
```

## Test Coverage Requirements

- **Unit Tests**: ≥90% coverage for components and utilities
- **Integration Tests**: ≥80% coverage for API routes
- **E2E Tests**: Cover all critical user paths
- **Overall**: ≥80% total coverage

## Test Utilities

### Setup Files
- `test-utils/nutrition.ts`: Helper functions for creating test meals
- `test-utils/supabase-mock.ts`: Mock Supabase client for testing

### Test Commands
```bash
# Run all nutrition tests
npm run test:nutrition

# Run with coverage
npm run test:nutrition:coverage

# Run E2E tests
npm run test:e2e:nutrition

# Run specific test file
npm test MealLogForm.test.tsx
```

## Continuous Integration

- Tests run on every pull request
- Coverage report posted as PR comment
- Merge blocked if coverage drops below 80%
- E2E tests run in headless browser

## Performance Benchmarks

- Form submission: < 500ms
- Page navigation: < 200ms
- Database query: < 100ms
- Total E2E flow: < 5 seconds