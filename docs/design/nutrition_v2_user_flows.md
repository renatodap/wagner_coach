# Nutrition V2: Complete User Flows

## Overview
This document outlines all user flows for the comprehensive nutrition tracking system that supports individual foods, meals as collections, quantity tracking, and flexible categorization.

## Core User Flows

### 1. Quick Add Single Food/Snack
**Scenario**: "I just ate an apple as a snack"

**Flow**:
1. User clicks "Quick Add" button on nutrition dashboard
2. System shows food search interface
3. User types "apple" in search box
4. System shows search results from food database
5. User selects "Apple" from results
6. System shows quantity input with common options:
   - Quick buttons: "1 small (150g)", "1 medium (182g)", "1 large (220g)"
   - Custom input: User can enter exact grams
7. User selects "1 medium"
8. System auto-fills current date/time (editable)
9. User can optionally select category (defaults to "snack" for single items)
10. User clicks "Log Food"
11. System saves to meal_logs with single meal_log_foods entry
12. Returns to dashboard showing updated daily totals

### 2. Build a Complex Meal
**Scenario**: "Logging my lunch with multiple items"

**Flow**:
1. User clicks "Log Meal" on nutrition dashboard
2. System shows meal builder interface with:
   - Optional meal name field
   - Category selector (breakfast/lunch/dinner/snack/pre-workout/post-workout)
   - Date/time picker (defaults to current)
   - Empty food list with "Add Food" button
3. User selects "Lunch" category
4. User clicks "Add Food"
5. System shows food search
6. User searches and adds:
   - "Chicken breast" → 200g
   - "Brown rice" → 150g
   - "Broccoli" → 100g
   - "Olive oil" → 1 tbsp (14ml)
7. Each food appears in meal with:
   - Name, quantity, unit
   - Individual calories/macros
   - Remove button
   - Edit quantity button
8. System shows running total of meal nutrition
9. User can optionally name meal "Post-workout lunch"
10. User clicks "Save Meal"
11. System creates meal_log with 4 meal_log_foods entries
12. Optionally asks "Save as template?" for quick reuse

### 3. Log from Saved Template
**Scenario**: "I eat the same breakfast every day"

**Flow**:
1. User clicks "My Meals" or "Templates" on dashboard
2. System shows saved meal templates
3. User sees "My usual breakfast" template with preview of foods
4. User clicks "Log This Meal"
5. System pre-fills meal builder with template foods and quantities
6. User can adjust quantities if needed (ate less/more today)
7. System shows current date/time (editable)
8. User clicks "Log Meal"
9. System creates new meal_log from template

### 4. Create Custom Food
**Scenario**: "I made a homemade protein shake with specific ingredients"

**Flow**:
1. User clicks "Create Food" from food search or dashboard
2. System shows custom food form:
   - Name (required)
   - Brand (optional)
   - Serving size & unit
   - Nutritional info per serving
   - Description/notes
3. User enters:
   - Name: "My Post-Workout Shake"
   - Serving: 500ml
   - Calories: 420
   - Protein: 45g
   - Carbs: 35g
   - Fat: 8g
4. User selects "Save to My Foods"
5. System creates food entry with user_id as created_by
6. Food now appears in user's searches

### 5. Edit Past Entry
**Scenario**: "I forgot to log yesterday's dinner"

**Flow**:
1. User goes to nutrition dashboard
2. User clicks "Log Meal"
3. User changes date picker to yesterday
4. User changes time to 7:00 PM
5. User builds meal as normal
6. System saves with historical timestamp
7. Dashboard updates yesterday's totals

### 6. Copy & Modify Previous Meal
**Scenario**: "I had the same lunch as Tuesday but with extra rice"

**Flow**:
1. User views meal history on dashboard
2. User finds Tuesday's lunch
3. User clicks "Copy Meal" button
4. System opens meal builder with all foods pre-filled
5. User adjusts rice from 150g to 200g
6. User saves as new meal for today

### 7. Search and Browse Foods
**Scenario**: "What foods are high in protein?"

**Flow**:
1. User clicks "Food Database" from dashboard
2. System shows search with filters:
   - Search by name
   - Filter by: High Protein, Low Carb, etc.
   - Show: All Foods, My Foods, Verified Only
3. User searches or browses
4. Can view nutritional info for any food
5. Can add foods directly to current meal or quick log

### 8. View Daily Summary
**Scenario**: "How am I doing with my macros today?"

**Flow**:
1. User opens nutrition dashboard
2. System shows:
   - Daily totals (calories, protein, carbs, fat, fiber)
   - Progress bars if user has set goals
   - Meal list with times and categories
   - Each meal expandable to show foods
3. User can click any meal to view details
4. User can edit or delete any meal

### 9. Barcode Scanning (Future)
**Scenario**: "Scanning a protein bar package"

**Flow**:
1. User clicks "Scan Barcode" button
2. System opens camera (web) or native scanner
3. User scans barcode
4. System looks up in foods table by barcode
5. If found: Shows food with serving info
6. If not found: Prompts to create custom food
7. User enters quantity (e.g., "1 bar")
8. System logs food

### 10. Weekly/Monthly Analytics
**Scenario**: "How consistent have I been this week?"

**Flow**:
1. User clicks "Analytics" or "Trends"
2. System shows:
   - Average daily calories this week
   - Macro breakdown trends
   - Most consumed foods
   - Meal timing patterns
   - Consistency score
3. User can export data or share progress

## Data Flow Examples

### Example 1: Quick Snack
```sql
-- User logs "1 medium apple"
INSERT INTO meal_logs (user_id, category, logged_at)
VALUES (user_id, 'snack', NOW());

INSERT INTO meal_log_foods (meal_log_id, food_id, quantity, unit, calories_consumed, ...)
VALUES (meal_id, apple_id, 182, 'g', 95, ...);
```

### Example 2: Complex Meal
```sql
-- User logs lunch with 4 items
INSERT INTO meal_logs (user_id, name, category, logged_at)
VALUES (user_id, 'Post-workout lunch', 'lunch', '2024-01-25 12:30:00');

-- Insert each food
INSERT INTO meal_log_foods (meal_log_id, food_id, quantity, unit, ...)
VALUES
  (meal_id, chicken_id, 200, 'g', ...),
  (meal_id, rice_id, 150, 'g', ...),
  (meal_id, broccoli_id, 100, 'g', ...),
  (meal_id, oil_id, 14, 'ml', ...);
```

## UI Components Needed

### 1. Food Search Component
- Search input with debounce
- Results list with nutritional preview
- Filter options (verified, my foods, etc.)
- Quick-add buttons for common quantities

### 2. Meal Builder Component
- Meal metadata (name, category, date/time)
- Food list with add/remove/edit
- Running nutrition totals
- Save/Save as Template options

### 3. Quantity Input Component
- Smart unit conversion
- Quick buttons for common amounts
- Custom input with unit selector
- Visual indicators (e.g., "about 1 cup")

### 4. Daily Dashboard Component
- Macro summary cards
- Progress indicators
- Meal timeline
- Quick action buttons

### 5. Food Database Browser
- Grid/List view toggle
- Category filters
- Sort by macros
- Favorite foods section

## API Endpoints Required

### Foods
- `GET /api/nutrition/foods/search?q={query}` - Search foods
- `GET /api/nutrition/foods/{id}` - Get food details
- `POST /api/nutrition/foods` - Create custom food
- `PUT /api/nutrition/foods/{id}` - Update custom food

### Meal Logs
- `GET /api/nutrition/meal-logs?date={date}` - Get meals for date
- `POST /api/nutrition/meal-logs` - Create new meal log
- `PUT /api/nutrition/meal-logs/{id}` - Update meal log
- `DELETE /api/nutrition/meal-logs/{id}` - Delete meal log

### Meal Templates
- `GET /api/nutrition/templates` - Get user's templates
- `POST /api/nutrition/templates` - Save meal as template
- `POST /api/nutrition/templates/{id}/log` - Log meal from template

### Analytics
- `GET /api/nutrition/analytics/daily?date={date}` - Daily summary
- `GET /api/nutrition/analytics/weekly?start={date}` - Weekly trends
- `GET /api/nutrition/analytics/foods/top?period={period}` - Most consumed foods

## Mobile Considerations

### Touch-Optimized
- Large tap targets for food selection
- Swipe to delete meals
- Pull to refresh dashboard
- Bottom sheet for meal builder

### Offline Support (Future)
- Cache recent foods locally
- Queue meal logs for sync
- Show cached daily totals

### Native Features (Future)
- Camera for barcode scanning
- Photo capture for AI recognition
- Push notifications for meal reminders

## Success Metrics

### User Engagement
- Average meals logged per day
- % of users using templates
- Custom foods created per user
- Search queries per session

### Data Quality
- % of meals with complete macros
- Average time to log a meal
- Template reuse rate
- Foods with quantities vs. estimates

### Feature Adoption
- Quick add vs. meal builder usage
- Template creation rate
- Custom food creation rate
- Historical editing frequency

## Future Enhancements

### Phase 2
- AI photo recognition
- Restaurant menu integration
- Recipe import from URLs
- Meal planning/scheduling

### Phase 3
- Social features (share meals)
- Nutritionist review/feedback
- Automated meal suggestions
- Integration with fitness goals

### Phase 4
- Voice input ("I had chicken and rice for lunch")
- Wearable integration
- Shopping list generation
- Meal prep planning

## Implementation Priority

1. **Core (Week 1)**
   - Food search API
   - Quick add single food
   - Basic meal builder
   - Daily dashboard

2. **Enhanced (Week 2)**
   - Meal templates
   - Custom foods
   - Date/time selection
   - Edit/delete meals

3. **Analytics (Week 3)**
   - Weekly trends
   - Top foods
   - Export functionality
   - Goal tracking

4. **Polish (Week 4)**
   - UI refinements
   - Performance optimization
   - Error handling
   - User onboarding