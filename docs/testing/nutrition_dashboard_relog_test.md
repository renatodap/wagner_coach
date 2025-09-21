# Nutrition Dashboard & Quick Re-log - Test Plan

## Unit Tests

### NutritionDashboard Component (`components/nutrition/NutritionDashboard.test.tsx`)

**Test Cases:**
1. **Component Rendering**
   - Should display daily summary section
   - Should show meal list when meals exist
   - Should display empty state when no meals
   - Should render floating action button

2. **Data Loading**
   - Should fetch today's meals on mount
   - Should display loading state
   - Should handle fetch errors gracefully
   - Should refresh data on focus

3. **Real-time Updates**
   - Should update totals when meal added
   - Should recalculate on meal deletion
   - Should reflect edits immediately

### DailySummary Component (`components/nutrition/DailySummary.test.tsx`)

**Test Cases:**
1. **Nutrition Calculation**
   - Should calculate total calories correctly
   - Should sum macronutrients accurately
   - Should handle empty meal list
   - Should update when props change

2. **Progress Display**
   - Should show progress bars for each macro
   - Should display percentage completion
   - Should color-code based on targets
   - Should handle missing goal data

3. **Goal Visualization**
   - Should show remaining calories
   - Should display over-consumption warnings
   - Should animate progress changes

### MealList Component (`components/nutrition/MealList.test.tsx`)

**Test Cases:**
1. **Meal Display**
   - Should render all meals for today
   - Should sort by time (newest first)
   - Should display meal details correctly
   - Should show category icons

2. **User Interactions**
   - Should call onRelog when button clicked
   - Should support swipe to delete
   - Should navigate to edit on click
   - Should handle empty state

### RelogButton Component (`components/nutrition/RelogButton.test.tsx`)

**Test Cases:**
1. **Button Functionality**
   - Should call onRelog with meal data
   - Should disable during submission
   - Should show loading state
   - Should handle errors gracefully

## Integration Tests

### Dashboard API (`app/api/nutrition/dashboard/route.test.ts`)

**Test Cases:**
1. **GET /api/nutrition/dashboard**
   - Should return today's nutrition summary
   - Should include meal list
   - Should calculate totals correctly
   - Should require authentication

2. **Data Aggregation**
   - Should sum nutrition values
   - Should group by meal category
   - Should include timestamp ranges

### Re-log API (`app/api/nutrition/meals/relog/route.test.ts`)

**Test Cases:**
1. **POST /api/nutrition/meals/relog**
   - Should create new meal from existing
   - Should update timestamp to now
   - Should preserve original meal ID reference
   - Should increment relog counter

## End-to-End Tests

### Complete Dashboard Flow (`e2e/nutrition-dashboard.test.ts`)

**Test Scenarios:**

1. **Dashboard Loading**
   ```
   1. User navigates to /nutrition
   2. Dashboard displays loading state
   3. Today's meals load and display
   4. Summary shows calculated totals
   5. Progress bars animate to correct values
   ```

2. **Re-log Happy Path**
   ```
   1. User sees previous meal "Chicken Salad"
   2. User clicks "Log Again" button
   3. Form opens with pre-filled data
   4. Timestamp updates to current time
   5. User reviews and submits
   6. New meal appears in list
   7. Totals update immediately
   ```

3. **Weekly Trend View**
   ```
   1. User clicks "Weekly" tab
   2. Chart loads with 7 days of data
   3. Hover shows daily details
   4. Click day navigates to that date
   ```

4. **Goal Setting Flow**
   ```
   1. User clicks "Set Goals" button
   2. Modal opens with current goals
   3. User adjusts calorie target
   4. User saves changes
   5. Progress bars update to reflect new goals
   ```

## Mock Data

```typescript
export const mockTodaysMeals = [
  {
    id: 'meal_1',
    meal_name: 'Oatmeal with Berries',
    meal_category: 'breakfast',
    logged_at: '2024-01-20T08:00:00Z',
    calories: 350,
    protein_g: 12,
    carbs_g: 65,
    fat_g: 8,
    relog_count: 5
  },
  {
    id: 'meal_2',
    meal_name: 'Grilled Chicken Salad',
    meal_category: 'lunch',
    logged_at: '2024-01-20T12:30:00Z',
    calories: 450,
    protein_g: 35,
    carbs_g: 20,
    fat_g: 25,
    relog_count: 2
  }
];

export const mockNutritionGoals = {
  daily_calories: 2000,
  protein_g: 150,
  carbs_g: 250,
  fat_g: 65
};

export const mockDashboardSummary = {
  today: {
    calories: 800,
    protein_g: 47,
    carbs_g: 85,
    fat_g: 33
  },
  goals: mockNutritionGoals,
  meals: mockTodaysMeals,
  weeklyAverage: 1850
};
```

## Performance Tests

### Loading Performance
- Dashboard initial load: < 1 second
- Re-log action: < 500ms
- Chart rendering: < 800ms

### Data Optimization
- Efficient queries with indexes
- Client-side calculation caching
- Optimistic UI updates

## Accessibility Tests

- Screen reader navigation
- Keyboard-only interaction
- Color contrast compliance
- Focus management
- ARIA labels and roles