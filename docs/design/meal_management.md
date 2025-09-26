# Meal Management - Feature Design

## Overview
Provide comprehensive meal management capabilities including viewing meal history, editing existing meals at both meal and food level, copying/re-logging previous meals, analytics insights, and bulk operations to give users full control over their nutrition data.

## Problem Statement
Current meal management has:
- Limited meal history with basic date filtering only
- No food-level editing (only meal-level editing)
- Copy functionality that doesn't preserve meal structure
- No bulk operations or meal search
- Missing analytics and insights
- No meal comparison or pattern recognition
- Basic delete without proper confirmations
- No export or data portability

## Success Criteria
- ✅ Comprehensive meal history with advanced filtering
- ✅ Full meal editing at both meal and individual food level
- ✅ Intelligent re-logging that preserves meal structure
- ✅ Rich analytics with trends and insights
- ✅ Powerful search and filter capabilities
- ✅ Bulk operations for efficiency
- ✅ Data export in multiple formats
- ✅ Mobile-optimized management interface

## Technical Requirements

### Enhanced Database Schema
```sql
-- Meal view/access tracking
meal_access_logs:
  id: uuid (primary key)
  user_id: uuid (references profiles.id)
  meal_id: uuid (references meals.id)
  access_type: access_type_enum
  accessed_at: timestamptz
  created_at: timestamptz

access_type_enum:
  - view
  - edit
  - copy
  - delete

-- Meal tags for organization
meal_tags:
  id: uuid (primary key)
  user_id: uuid (references profiles.id)
  tag_name: text
  color: text (hex color)
  created_at: timestamptz

-- Junction table for meal-tag relationships
meal_tag_assignments:
  id: uuid (primary key)
  meal_id: uuid (references meals.id, cascade delete)
  tag_id: uuid (references meal_tags.id, cascade delete)
  created_at: timestamptz

-- Meal favorites/bookmarks
meal_favorites:
  id: uuid (primary key)
  user_id: uuid (references profiles.id)
  meal_id: uuid (references meals.id, cascade delete)
  created_at: timestamptz

-- Meal comparison snapshots
meal_comparisons:
  id: uuid (primary key)
  user_id: uuid (references profiles.id)
  comparison_name: text
  meal_ids: uuid[] (array of meal IDs to compare)
  created_at: timestamptz
```

### API Endpoints
```typescript
// Enhanced meal querying
GET /api/nutrition/meals
  Query: {
    user_id: string,
    date_from?: string,
    date_to?: string,
    category?: MealCategory,
    search?: string,
    tags?: string[],
    favorites_only?: boolean,
    limit?: number,
    offset?: number,
    sort?: 'date_asc' | 'date_desc' | 'calories' | 'name'
  }
  Response: { meals: MealWithFoods[], total: number, has_more: boolean }

// Meal editing
PUT /api/nutrition/meals/:id
  Body: UpdateMealRequest
  Response: { meal: MealWithFoods }

PUT /api/nutrition/meals/:id/foods/:food_id
  Body: { quantity: number, unit: ServingUnit }
  Response: { meal: MealWithFoods }

DELETE /api/nutrition/meals/:id/foods/:food_id
  Response: { meal: MealWithFoods }

// Meal copying/re-logging
POST /api/nutrition/meals/:id/copy
  Body: { logged_at?: string, category?: MealCategory }
  Response: { meal: MealWithFoods }

// Bulk operations
POST /api/nutrition/meals/bulk
  Body: {
    operation: 'delete' | 'tag' | 'favorite' | 'export',
    meal_ids: string[],
    options?: any
  }
  Response: { success: boolean, affected_count: number }

// Analytics
GET /api/nutrition/analytics/meals
  Query: { user_id: string, period: 'week' | 'month' | 'year' }
  Response: { analytics: MealAnalytics }

// Meal comparison
POST /api/nutrition/meals/compare
  Body: { meal_ids: string[] }
  Response: { comparison: MealComparison }

// Export
GET /api/nutrition/meals/export
  Query: { user_id: string, format: 'csv' | 'json' | 'pdf', date_range?: string }
  Response: File download or { download_url: string }
```

## Core Features

### 1. Advanced Meal History
**Purpose:** Comprehensive view of user's meal logging history with powerful filtering

**History Interface Features:**
- **Timeline View**: Chronological meal display with date grouping
- **Calendar View**: Monthly calendar with meal indicators
- **List View**: Compact list with sorting options
- **Card View**: Detailed cards showing meal previews

**Filtering & Search:**
```typescript
interface MealFilters {
  dateRange: DateRange;
  categories: MealCategory[];
  searchTerms: string;        // Search meal names, food names, notes
  nutritionRanges: {          // Filter by macro ranges
    calories?: [number, number];
    protein?: [number, number];
    carbs?: [number, number];
    fat?: [number, number];
  };
  tags: string[];
  favoritesOnly: boolean;
  customFoodsOnly: boolean;   // Meals with custom foods
}
```

**Smart Grouping & Organization:**
```typescript
interface MealGrouping {
  groupBy: 'date' | 'category' | 'calories' | 'tags';
  sortBy: 'date' | 'name' | 'calories' | 'frequency';
  sortOrder: 'asc' | 'desc';
}
```

### 2. Comprehensive Meal Editing
**Purpose:** Allow users to modify any aspect of logged meals

**Meal-Level Editing:**
- **Basic Info**: Name, category, date/time, notes
- **Tags**: Add/remove organizational tags
- **Favorites**: Mark as favorite for quick access
- **Duplicate Detection**: Warn about similar existing meals

**Food-Level Editing:**
```typescript
interface FoodEditOperations {
  // Modify existing food in meal
  updateQuantity(mealId: string, foodId: string, quantity: number, unit: ServingUnit): void;

  // Add new food to existing meal
  addFood(mealId: string, foodId: string, quantity: number, unit: ServingUnit): void;

  // Remove food from meal
  removeFood(mealId: string, foodId: string): void;

  // Replace food with different food
  substituteFood(mealId: string, oldFoodId: string, newFoodId: string): void;
}
```

**Real-time Updates:**
- Immediate macro recalculation on any change
- Visual indicators for unsaved changes
- Auto-save drafts to prevent data loss
- Undo/redo functionality for editing sessions

### 3. Intelligent Meal Re-logging
**Purpose:** Smart copying of previous meals with context awareness

**Re-logging Features:**
```typescript
interface IntelligentRelogging {
  // Simple copy to current time
  copyMealAsIs(mealId: string): Promise<MealWithFoods>;

  // Copy with modifications
  copyMealWithChanges(
    mealId: string,
    changes: {
      logged_at?: string;
      category?: MealCategory;
      quantity_adjustments?: { [foodId: string]: number };
      food_substitutions?: { [oldFoodId: string]: string };
    }
  ): Promise<MealWithFoods>;

  // Suggest similar meals for re-logging
  suggestSimilarMeals(criteria: MealCriteria): Promise<MealSuggestion[]>;
}
```

**Smart Suggestions:**
- **Time-based**: "You usually eat this for breakfast"
- **Pattern-based**: "You had this 3 days ago"
- **Macro-based**: "This fits your protein goals today"
- **Ingredient-based**: "Similar to what you're planning"

### 4. Meal Analytics & Insights
**Purpose:** Provide meaningful insights into eating patterns and nutrition trends

**Analytics Dashboard:**
```typescript
interface MealAnalytics {
  // Overview stats
  totalMeals: number;
  averageCaloriesPerMeal: number;
  mostLoggedFoods: FoodFrequency[];
  mealCategoryDistribution: CategoryStats[];

  // Trends
  caloriesTrend: TrendData[];
  macroTrends: {
    protein: TrendData[];
    carbs: TrendData[];
    fat: TrendData[];
  };

  // Patterns
  mealTimingPatterns: TimingPattern[];
  weekdayVsWeekendPatterns: PatternComparison;
  seasonalPatterns: SeasonalAnalysis[];

  // Insights
  insights: Insight[];
  recommendations: Recommendation[];
}

interface Insight {
  type: 'positive' | 'neutral' | 'concern';
  title: string;
  description: string;
  data_points: any[];
  action_suggestions?: string[];
}
```

**Insight Examples:**
- "Your protein intake has increased 15% this month"
- "You eat 20% more calories on weekends"
- "Your most logged breakfast is oatmeal with berries"
- "You haven't had vegetables in 3 days"

### 5. Meal Search & Discovery
**Purpose:** Help users find specific meals or discover patterns

**Advanced Search:**
```typescript
interface MealSearch {
  // Text search
  searchByText(query: string): MealSearchResults;

  // Nutritional search
  searchByNutrition(criteria: NutritionCriteria): MealSearchResults;

  // Ingredient search
  searchByIngredients(foods: string[], mode: 'all' | 'any'): MealSearchResults;

  // Pattern search
  searchByPattern(pattern: MealPattern): MealSearchResults;
}

interface NutritionCriteria {
  calories?: NumberRange;
  protein?: NumberRange;
  carbs?: NumberRange;
  fat?: NumberRange;
  meal_category?: MealCategory[];
}
```

**Search Results:**
- **Relevance scoring**: Most relevant meals first
- **Highlighting**: Search terms highlighted in results
- **Filters**: Apply additional filters to search results
- **Save searches**: Save common searches for quick access

### 6. Bulk Operations
**Purpose:** Efficient management of multiple meals at once

**Bulk Operations:**
```typescript
interface BulkMealOperations {
  // Selection management
  selectMeals(mealIds: string[]): void;
  selectMealsByFilter(filter: MealFilters): void;

  // Bulk actions
  bulkDelete(mealIds: string[]): Promise<BulkOperationResult>;
  bulkTag(mealIds: string[], tagIds: string[]): Promise<BulkOperationResult>;
  bulkFavorite(mealIds: string[], favorite: boolean): Promise<BulkOperationResult>;
  bulkExport(mealIds: string[], format: ExportFormat): Promise<string>;

  // Bulk editing
  bulkUpdateCategory(mealIds: string[], category: MealCategory): Promise<BulkOperationResult>;
  bulkAdjustQuantities(mealIds: string[], adjustmentFactor: number): Promise<BulkOperationResult>;
}
```

**Safety Features:**
- **Confirmation dialogs**: Require confirmation for destructive operations
- **Undo functionality**: Allow undoing recent bulk operations
- **Progress indicators**: Show progress for long-running operations
- **Error handling**: Gracefully handle partial failures

### 7. Data Export & Portability
**Purpose:** Allow users to export their meal data in various formats

**Export Formats:**
```typescript
interface DataExport {
  // CSV export for spreadsheet analysis
  exportCSV(filters: MealFilters): Promise<string>;

  // JSON export for data portability
  exportJSON(filters: MealFilters): Promise<object>;

  // PDF export for sharing/printing
  exportPDF(filters: MealFilters, template: PDFTemplate): Promise<Buffer>;

  // Integration exports
  exportMyFitnessPal(filters: MealFilters): Promise<string>;
  exportChronometer(filters: MealFilters): Promise<string>;
}
```

**Export Options:**
- **Date range selection**: Export specific time periods
- **Format customization**: Choose which fields to include
- **Aggregation levels**: Daily, weekly, monthly summaries
- **Privacy controls**: Anonymize or redact sensitive data

## User Experience Design

### Meal History Interface
```
┌─────────────────────────────────────┐
│ 📊 MEAL HISTORY                     │
├─────────────────────────────────────┤
│ [🔍 Search] [📅 Filter] [⚙️ Sort]    │
├─────────────────────────────────────┤
│ Today - March 15, 2024              │
│ ┌─────────────────────────────────┐ │
│ │ 🌅 Breakfast • 8:30 AM          │ │
│ │ Oatmeal with Berries            │ │
│ │ 320 cal | 12g P | 45g C | 8g F  │ │
│ │ [👁️ View] [✏️ Edit] [🔄 Re-log]  │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 🌞 Lunch • 1:15 PM              │ │
│ │ Chicken Caesar Salad ⭐         │ │
│ │ 450 cal | 35g P | 12g C | 28g F │ │
│ │ [👁️ View] [✏️ Edit] [🔄 Re-log]  │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Yesterday - March 14, 2024 [Expand]│
│ 3 meals • 1,850 calories           │
└─────────────────────────────────────┘
```

### Meal Editing Interface
```
┌─────────────────────────────────────┐
│ ✏️ EDIT MEAL                        │
├─────────────────────────────────────┤
│ Meal: [Chicken Caesar Salad______]  │
│ Category: [Lunch ▼] Time: [1:15 PM] │
│ Tags: [⭐ Favorite] [🥗 Salad] [+]    │
├─────────────────────────────────────┤
│ FOODS IN MEAL:                      │
│ ┌─────────────────────────────────┐ │
│ │ Grilled Chicken Breast          │ │
│ │ [150] g  [📝] [❌]              │ │
│ │ 248 cal, 46g protein            │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Romaine Lettuce                 │ │
│ │ [2] cups [📝] [❌]              │ │
│ │ 16 cal, 1g protein              │ │
│ └─────────────────────────────────┘ │
│ [+ Add Food]                        │
├─────────────────────────────────────┤
│ TOTALS: 450 cal | 35g P | 12g C    │
├─────────────────────────────────────┤
│ [💾 Save Changes] [❌ Cancel]        │
└─────────────────────────────────────┘
```

### Bulk Operations Interface
```
┌─────────────────────────────────────┐
│ Selected: 5 meals                   │
├─────────────────────────────────────┤
│ [🏷️ Tag] [⭐ Favorite] [📤 Export]   │
│ [❌ Delete] [📋 Copy] [✏️ Edit]      │
├─────────────────────────────────────┤
│ ☑️ Breakfast - Oatmeal              │
│ ☑️ Lunch - Salad                    │
│ ☑️ Dinner - Pasta                   │
│ ☑️ Snack - Apple                    │
│ ☑️ Lunch - Sandwich                 │
│ ☐ Dinner - Pizza                    │
│ [Select All] [Clear Selection]      │
└─────────────────────────────────────┘
```

## Integration Points

### Food Database Integration
- **Food updates**: When foods are updated, reflect in meal history
- **Custom foods**: Handle custom food deletions gracefully
- **Food suggestions**: Use meal history for personalized food suggestions

### Natural Language Integration
- **Re-logging assistance**: "Log yesterday's lunch again"
- **Meal search**: "Find meals with chicken and rice"
- **Pattern queries**: "Show me all my breakfast meals"

### Analytics Integration
- **Trend analysis**: Use meal history for nutrition trend calculation
- **Goal tracking**: Compare meals against user goals
- **Pattern recognition**: Identify eating patterns and habits

## Performance Requirements
- **Meal loading**: < 200ms for 50 meals with pagination
- **Search operations**: < 300ms for complex searches
- **Bulk operations**: < 2 seconds for operations on 100 meals
- **Export generation**: < 5 seconds for monthly data export
- **Real-time updates**: < 100ms for meal editing changes

## Data Management

### Caching Strategy
```typescript
interface MealCaching {
  // Cache recent meals for quick access
  recentMealsCache: LRUCache<string, MealWithFoods>;

  // Cache search results temporarily
  searchResultsCache: Map<string, MealSearchResults>;

  // Cache analytics data
  analyticsCache: TimedCache<string, MealAnalytics>;
}
```

### Data Validation
- **Meal integrity**: Ensure meals always have at least one food
- **Nutrition bounds**: Validate calculated nutrition values
- **Date validation**: Prevent impossible dates/times
- **Permission validation**: Ensure users can only access their meals

## Security & Privacy

### Data Access Control
```typescript
interface MealSecurity {
  // Verify user can access meal
  verifyMealAccess(userId: string, mealId: string): boolean;

  // Audit meal access
  logMealAccess(userId: string, mealId: string, action: string): void;

  // Bulk operation authorization
  authorizeBulkOperation(userId: string, mealIds: string[]): boolean;
}
```

### Privacy Features
- **Data anonymization**: Option to anonymize exported data
- **Sharing controls**: Control what meal data can be shared
- **Retention policies**: Automatic cleanup of old meal access logs

## Error Handling & Edge Cases

### Data Consistency
- **Orphaned foods**: Handle when foods are deleted but remain in meals
- **Circular dependencies**: Prevent infinite loops in meal copying
- **Concurrent modifications**: Handle when multiple edits occur simultaneously

### User Experience
- **Offline support**: Allow viewing cached meals offline
- **Sync conflicts**: Resolve conflicts when offline edits sync
- **Performance degradation**: Handle gracefully when dealing with users who have thousands of meals

## Analytics & Monitoring

### Usage Analytics
```typescript
interface MealManagementAnalytics {
  // Feature usage
  most_used_features: FeatureUsage[];
  search_query_patterns: SearchPattern[];
  bulk_operation_frequency: OperationStats[];

  // Performance metrics
  average_load_time: number;
  search_success_rate: number;
  edit_completion_rate: number;
}
```

### Business Intelligence
- **Retention analysis**: How meal management features affect user retention
- **Feature adoption**: Which management features are most popular
- **Performance impact**: How meal history size affects app performance

## Future Enhancements

### Advanced Features
- **Meal templates**: Save common meals as reusable templates
- **Recipe integration**: Break down recipes into meal logging
- **Social sharing**: Share favorite meals with friends
- **Meal planning**: Plan future meals based on history

### AI-Powered Features
- **Smart suggestions**: AI suggests meals based on patterns
- **Anomaly detection**: Flag unusual eating patterns
- **Goal optimization**: Suggest meal adjustments to meet goals
- **Predictive analytics**: Predict future eating patterns

## Testing Strategy
- **CRUD operation testing**: Comprehensive testing of all meal operations
- **Performance testing**: Load testing with large meal histories
- **Concurrency testing**: Test simultaneous edits and bulk operations
- **Data integrity testing**: Ensure meal data remains consistent
- **User workflow testing**: End-to-end testing of common user journeys
- **Mobile responsiveness**: Test all features work well on mobile devices