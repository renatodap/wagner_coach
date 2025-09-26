# Core Meal Logging - Feature Design

## Overview
Enable users to create comprehensive meals by selecting foods from the database, specifying quantities, automatically calculating nutritional totals, and persisting the complete meal to the database with proper categorization and timing.

## Problem Statement
Current meal logging implementation has:
- Disconnected meal creation flows (MealBuilder not integrated)
- No food selection from database
- Manual macro entry only (no auto-calculation)
- Missing quantity/unit management
- Inconsistent meal categorization
- No comprehensive meal-to-foods relationship tracking

## Success Criteria
- ✅ Users can create meals by selecting multiple foods
- ✅ Quantity and unit conversion system works accurately
- ✅ Macros auto-calculate from selected foods + quantities
- ✅ Meals persist with full food composition to database
- ✅ Support for meal categories and timing
- ✅ Real-time macro preview during meal building
- ✅ Seamless integration with food search
- ✅ Mobile-optimized meal creation flow

## Technical Requirements

### Enhanced Database Schema
```sql
-- Updated meals table
meals:
  id: uuid (primary key)
  user_id: uuid (references profiles.id)
  meal_name: text
  meal_category: meal_category_enum
  logged_at: timestamptz
  notes: text (nullable)
  -- Auto-calculated totals
  total_calories: numeric (computed from foods)
  total_protein_g: numeric (computed from foods)
  total_carbs_g: numeric (computed from foods)
  total_fat_g: numeric (computed from foods)
  total_fiber_g: numeric (nullable, computed from foods)
  total_sugar_g: numeric (nullable, computed from foods)
  total_sodium_mg: numeric (nullable, computed from foods)
  created_at: timestamptz
  updated_at: timestamptz

-- Meal foods junction table
meal_foods:
  id: uuid (primary key)
  meal_id: uuid (references meals.id, cascade delete)
  food_id: uuid (references foods.id)
  quantity: numeric
  unit: serving_unit_enum
  -- Calculated nutrition for this portion
  calories: numeric
  protein_g: numeric
  carbs_g: numeric
  fat_g: numeric
  fiber_g: numeric (nullable)
  sugar_g: numeric (nullable)
  sodium_mg: numeric (nullable)
  created_at: timestamptz

-- Meal categories
meal_category_enum:
  - breakfast
  - lunch
  - dinner
  - snack
  - pre_workout
  - post_workout
  - other
```

### API Endpoints
```typescript
// Meal CRUD
POST /api/nutrition/meals
  Body: CreateMealRequest
  Response: { meal: MealWithFoods }

GET /api/nutrition/meals
  Query: user_id, date_from, date_to, category
  Response: { meals: MealWithFoods[] }

GET /api/nutrition/meals/:id
  Response: { meal: MealWithFoods }

PUT /api/nutrition/meals/:id
  Body: UpdateMealRequest
  Response: { meal: MealWithFoods }

DELETE /api/nutrition/meals/:id
  Response: { success: boolean }

// Meal building helpers
POST /api/nutrition/meals/calculate
  Body: { foods: { food_id, quantity, unit }[] }
  Response: { totals: NutritionTotals }

POST /api/nutrition/meals/:id/add-food
  Body: { food_id, quantity, unit }
  Response: { meal: MealWithFoods }

DELETE /api/nutrition/meals/:id/foods/:food_id
  Response: { meal: MealWithFoods }
```

## Core Features

### 1. Meal Builder Interface
**Purpose:** Intuitive interface for creating multi-food meals

**Components:**
- **Meal Header**: Name, category, date/time selection
- **Food Search & Add**: Integrated food search with quick add
- **Food List**: Added foods with quantity controls
- **Macro Preview**: Real-time nutrition totals
- **Save Controls**: Save, cancel, save as template options

**User Flow:**
```
1. Click "Create Meal" or "Add Meal"
2. Enter meal name (auto-suggest based on time)
3. Select meal category (smart defaults)
4. Set date/time (defaults to now)
5. Search and add foods:
   - Type food name → search results appear
   - Click food → quantity/unit selector
   - Confirm → food added to meal
6. Review macro totals
7. Add notes (optional)
8. Save meal
```

### 2. Intelligent Quantity Management
**Purpose:** Flexible, accurate quantity and unit conversion

**Features:**
- **Multiple Units**: Support g, ml, oz, cups, pieces, servings
- **Smart Defaults**: Remember user's preferred quantities per food
- **Unit Conversion**: Automatic conversion between compatible units
- **Visual Portion Guides**: Show serving size equivalents
- **Quick Adjustments**: +/- buttons for common portions

**Conversion Logic:**
```typescript
interface QuantityConverter {
  // Convert any quantity/unit to grams/ml for calculation
  toBaseUnit(quantity: number, unit: ServingUnit, food: Food): number;

  // Calculate nutrition for specific quantity
  calculateNutrition(quantity: number, unit: ServingUnit, food: Food): Nutrition;

  // Suggest common portions
  getCommonPortions(food: Food): Portion[];
}
```

### 3. Real-time Macro Calculation
**Purpose:** Instant feedback on meal nutritional content

**Calculation Engine:**
```typescript
interface MacroCalculator {
  calculateMealTotals(mealFoods: MealFood[]): NutritionTotals;
  calculateFoodPortion(food: Food, quantity: number, unit: string): Nutrition;
  updateMealTotals(meal: Meal): Meal;
}

interface NutritionTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
}
```

**Real-time Updates:**
- Recalculate on every food add/remove/quantity change
- Show running totals in meal builder
- Highlight when targets are met
- Warning for extremely high/low values

### 4. Smart Meal Categorization
**Purpose:** Intelligent meal classification and timing

**Auto-categorization Logic:**
- **Time-based**: Morning = breakfast, midday = lunch, evening = dinner
- **Food-based**: Cereal/eggs = breakfast, sandwich = lunch
- **User Pattern Learning**: Remember user's meal timing preferences
- **Manual Override**: Always allow user to change category

**Category Features:**
- Visual category indicators
- Category-specific meal suggestions
- Time-based filtering
- Meal timing analytics

### 5. Comprehensive Meal Persistence
**Purpose:** Store complete meal data with full traceability

**Data Model:**
```typescript
interface MealWithFoods {
  id: string;
  user_id: string;
  meal_name: string;
  meal_category: MealCategory;
  logged_at: string;
  notes?: string;
  // Auto-calculated totals
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  total_fiber_g?: number;
  // Individual foods
  foods: MealFood[];
}

interface MealFood {
  id: string;
  food: Food; // Full food object
  quantity: number;
  unit: ServingUnit;
  // Calculated nutrition for this portion
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
}
```

## User Experience Design

### Mobile-First Interface
```
┌─────────────────────────┐
│ CREATE MEAL             │
├─────────────────────────┤
│ Meal Name: [___________]│
│ Category:  [Breakfast ▼]│
│ Time:      [9:15 AM   ▼]│
├─────────────────────────┤
│ 🔍 Add foods...         │
├─────────────────────────┤
│ ✓ Scrambled Eggs        │
│   2 large eggs          │
│   140 cal, 12g protein  │
│   [Edit] [Remove]       │
├─────────────────────────┤
│ ✓ Whole Wheat Toast     │
│   2 slices              │
│   160 cal, 6g protein   │
│   [Edit] [Remove]       │
├─────────────────────────┤
│ TOTALS                  │
│ 300 cal | 18g P | 24g C │
├─────────────────────────┤
│ Notes: [_______________]│
├─────────────────────────┤
│ [Save Meal] [Cancel]    │
└─────────────────────────┘
```

### Food Addition Flow
```
1. Click "Add foods..." → Food search opens
2. Type "chicken" → Search results show
3. Click "Chicken Breast, Raw" → Quantity selector
4. Adjust quantity (150g) → Preview nutrition
5. Click "Add to Meal" → Returns to meal builder
6. Food appears in meal list with calculated nutrition
7. Meal totals update automatically
```

### Quantity Editing Flow
```
1. Click "Edit" on added food
2. Inline editor appears:
   - Quantity input [150]
   - Unit dropdown [g ▼]
   - Preview: "165 cal, 31g protein"
3. Click "Done" → Updates meal totals
```

## Performance Requirements
- **Meal saving**: < 500ms for complete meal with 5+ foods
- **Macro calculations**: < 50ms for real-time updates
- **Food search integration**: < 100ms from food search to meal
- **Offline support**: Cache recent meals and foods for offline editing

## Data Validation & Business Rules

### Meal Validation
```typescript
interface MealValidation {
  // Required fields
  meal_name: string; // min 1, max 100 characters
  meal_category: MealCategory;
  logged_at: Date;
  foods: MealFood[]; // minimum 1 food required

  // Business rules
  validateQuantities(): boolean; // quantities > 0
  validateNutrition(): boolean; // reasonable macro values
  validateTiming(): boolean; // logged_at not in future
}
```

### Food Quantity Validation
- **Minimum quantity**: 0.01 (prevent zero portions)
- **Maximum quantity**: 1000 units (prevent accidental huge portions)
- **Unit compatibility**: Ensure unit makes sense for food type
- **Nutrition bounds**: Flag if calculated nutrition seems unrealistic

## Integration Points

### Food Database Integration
- Seamless food search within meal builder
- Auto-complete with personalized suggestions
- Quick access to recently used foods
- Create custom food mid-meal if needed

### User Preferences Integration
- Remember preferred quantities per food
- Learn meal timing patterns
- Track frequently combined foods
- Save common meal patterns as templates

## Error Handling & Edge Cases

### Network Issues
- **Offline editing**: Allow meal building without network
- **Sync conflicts**: Handle when offline changes conflict with server
- **Partial saves**: Save meal draft if network fails during save

### Data Issues
- **Missing nutrition data**: Handle foods with incomplete nutrition info
- **Unit conversion failures**: Fallback to manual quantity entry
- **Invalid quantities**: Clear validation messages and suggestions

### User Experience Issues
- **Accidental deletions**: Undo functionality for removed foods
- **Long food lists**: Virtual scrolling and search within meal
- **Complex meals**: Support for 20+ foods without UI degradation

## Analytics & Insights

### Usage Tracking
- **Meal complexity**: Track average foods per meal
- **Popular combinations**: Identify commonly paired foods
- **Time patterns**: Analyze when users log different meal types
- **Completion rates**: Track meal creation vs abandonment

### Performance Monitoring
- **Calculation speed**: Monitor macro calculation performance
- **Search integration**: Track food search → meal add conversion
- **Save success rates**: Monitor meal persistence success
- **Error rates**: Track validation failures and user corrections

## Future Enhancements

### Advanced Features (Post-MVP)
- **Meal templates**: Save and reuse common meal patterns
- **Recipe integration**: Break down recipes into ingredient portions
- **Photo attachments**: Add meal photos for visual reference
- **Barcode scanning**: Quick add packaged foods via barcode
- **Voice input**: "Add 2 eggs and toast to breakfast"

### Smart Features
- **Meal suggestions**: Suggest foods to complete nutritional goals
- **Portion optimization**: Recommend portions to hit macro targets
- **Meal timing optimization**: Suggest best times based on user patterns
- **Social features**: Share meals and get suggestions from community

## Testing Strategy
- **Unit tests**: Macro calculation engine, validation logic
- **Integration tests**: Complete meal creation flows
- **Performance tests**: Large meals, concurrent users
- **User acceptance tests**: End-to-end meal logging scenarios
- **Mobile testing**: Touch interactions, responsive design
- **Offline testing**: Network failure scenarios

## Security & Privacy
- **User data isolation**: Meals are private to user unless explicitly shared
- **Input sanitization**: Prevent XSS in meal names and notes
- **Authorization**: Verify user can only access their own meals
- **Data encryption**: Encrypt sensitive meal data at rest