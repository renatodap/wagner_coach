# Nutrition Dashboard & Quick Re-log - Feature Design

## User Stories

### Story 1: Daily Nutrition Summary
As a user, I want to see a summary of my daily caloric and macronutrient intake on a central dashboard, so I can track my progress towards my goals.

### Story 2: Quick Re-log
As a user, I often eat the same meals, so I want to be able to 're-log' a previous meal with a single tap to save time.

## Acceptance Criteria

### Dashboard Page (`/nutrition`)

1. **Daily Summary Display**
   - Shows today's total calories consumed
   - Displays macronutrient breakdown (protein, carbs, fat)
   - Visual progress bars against daily targets
   - Percentage of goal achieved
   - Color coding (green = on track, yellow = close, red = over)

2. **Meal List**
   - Chronologically ordered list of today's meals
   - Each item shows:
     - Meal name
     - Category icon (breakfast/lunch/dinner/snack)
     - Time logged
     - Calories
     - Quick "Log Again" button
   - Swipe to delete functionality
   - Click to view/edit details

3. **Weekly Overview**
   - 7-day calorie trend chart
   - Average daily intake
   - Consistency score
   - Best/worst days highlighted

4. **Quick Actions**
   - Floating action button for new meal
   - Quick access to recent/favorite meals
   - Search past meals functionality

### Re-log Feature

1. **One-Click Re-log**
   - "Log Again" button on each meal item
   - Pre-fills form with previous data
   - Updates timestamp to current time
   - Allows quick edit before saving

2. **Favorite Meals**
   - Star meals for quick access
   - Favorites section on dashboard
   - Sort by frequency of use

3. **Meal Templates**
   - Save meal combinations as templates
   - Name templates (e.g., "My Breakfast")
   - Quick apply from dashboard

## Technical Implementation

### Components

```typescript
// Main dashboard components
- NutritionDashboard.tsx      // Main container
- DailySummary.tsx            // Nutrition totals and progress
- MealList.tsx                // List of today's meals
- MealListItem.tsx            // Individual meal display
- WeeklyChart.tsx             // 7-day trend visualization
- QuickLogMenu.tsx            // Favorite/recent meals menu
- NutritionGoals.tsx          // Goal setting component

// Re-log components
- RelogButton.tsx             // Quick re-log button
- MealTemplates.tsx           // Template management
- FavoriteMeals.tsx          // Favorite meals grid
```

### Data Flow

1. **Fetch today's meals**
   - Query meals table for current date
   - Calculate totals client-side
   - Cache for quick updates

2. **Re-log process**
   - Copy meal data
   - Update timestamp
   - Pre-populate form
   - Submit as new entry

3. **Real-time updates**
   - Update totals on add/edit/delete
   - Optimistic UI updates
   - Background sync

### API Endpoints

- `GET /api/nutrition/dashboard` - Today's summary data
- `GET /api/nutrition/meals/favorites` - User's favorite meals
- `POST /api/nutrition/meals/relog` - Quick re-log endpoint
- `GET /api/nutrition/goals` - User's nutrition goals
- `PUT /api/nutrition/goals` - Update nutrition goals

## Success Metrics

- Dashboard loads in < 1 second
- Re-log action completes in < 2 seconds
- 50% of meals logged are re-logs (efficiency gain)
- Daily active usage increases by 40%