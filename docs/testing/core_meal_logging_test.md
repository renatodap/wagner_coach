# Core Meal Logging - Test Design

## Test Strategy Overview
Comprehensive testing of meal creation, macro calculation, food integration, and persistence functionality with emphasis on data integrity and user experience.

## Test Categories

### 1. Unit Tests - Macro Calculation Engine

#### Nutrition Calculation Logic
```typescript
describe('MacroCalculator', () => {
  describe('calculateFoodPortion', () => {
    test('calculates correct nutrition for standard serving', () => {
      // Given: Chicken breast - 100g serving, 165 cal, 31g protein
      // When: calculate for 150g
      // Then: returns 247.5 cal, 46.5g protein
    });

    test('handles unit conversions correctly', () => {
      // Given: Milk - 1 cup (240ml) serving, 150 cal
      // When: calculate for 120ml (0.5 cup)
      // Then: returns 75 cal (half the nutrition)
    });

    test('handles zero quantity gracefully', () => {
      // When: calculate for 0g of any food
      // Then: returns all zeros for nutrition
    });

    test('handles very small quantities accurately', () => {
      // Given: High-calorie food (1000 cal/100g)
      // When: calculate for 0.1g
      // Then: returns 1 cal (precise small amounts)
    });

    test('rounds nutrition values appropriately', () => {
      // Given: calculations resulting in decimal values
      // When: nutrition is calculated
      // Then: calories rounded to whole numbers, macros to 1 decimal
    });
  });

  describe('calculateMealTotals', () => {
    test('sums nutrition from multiple foods correctly', () => {
      // Given: meal with eggs (140 cal) and toast (160 cal)
      // When: calculate meal totals
      // Then: returns 300 total calories
    });

    test('handles empty meal gracefully', () => {
      // When: calculate totals for meal with no foods
      // Then: returns all zeros
    });

    test('maintains precision across multiple foods', () => {
      // Given: meal with 10 foods with fractional macros
      // When: totals calculated
      // Then: precision maintained, no cumulative rounding errors
    });
  });
});
```

#### Unit Conversion System
```typescript
describe('QuantityConverter', () => {
  test('converts weight units correctly', () => {
    // oz to grams, lbs to grams, kg to grams
  });

  test('converts volume units correctly', () => {
    // cups to ml, fl oz to ml, liters to ml
  });

  test('handles incompatible unit conversions', () => {
    // When: convert weight unit for liquid food
    // Then: returns error or uses food density
  });

  test('provides accurate common portions', () => {
    // Given: apple (medium = 180g)
    // When: get common portions
    // Then: includes small/medium/large with accurate weights
  });
});
```

### 2. Integration Tests - Meal CRUD Operations

```typescript
describe('Meal API Integration', () => {
  describe('POST /api/nutrition/meals', () => {
    test('creates meal with single food successfully', async () => {
      // Given: valid meal data with one food
      // When: POST to create meal
      // Then: meal saved with correct totals, returns meal with ID
    });

    test('creates complex meal with multiple foods', async () => {
      // Given: meal with 5 different foods and quantities
      // When: POST to create meal
      // Then: all foods saved, totals calculated correctly
    });

    test('validates required meal fields', async () => {
      // When: POST meal without required fields
      // Then: returns 400 with validation errors
    });

    test('validates meal foods are not empty', async () => {
      // When: POST meal with empty foods array
      // Then: returns 400 with appropriate error
    });

    test('handles non-existent food IDs gracefully', async () => {
      // When: POST meal with invalid food_id
      // Then: returns 400 with food not found error
    });
  });

  describe('PUT /api/nutrition/meals/:id', () => {
    test('updates meal with new foods', async () => {
      // Given: existing meal
      // When: PUT with different foods
      // Then: old meal_foods removed, new ones added, totals recalculated
    });

    test('updates meal metadata (name, category, time)', async () => {
      // Given: existing meal
      // When: PUT with updated meal info
      // Then: meal updated, foods unchanged
    });

    test('prevents updating other users meals', async () => {
      // When: user tries to update another user's meal
      // Then: returns 403 forbidden
    });
  });

  describe('DELETE /api/nutrition/meals/:id', () => {
    test('deletes meal and all associated foods', async () => {
      // Given: meal with multiple foods
      // When: DELETE meal
      // Then: meal and meal_foods records removed
    });

    test('prevents deleting other users meals', async () => {
      // When: user tries to delete another user's meal
      // Then: returns 403 forbidden
    });
  });
});
```

### 3. Database Integration Tests

```typescript
describe('Meal Database Operations', () => {
  test('meal_foods cascade delete works correctly', async () => {
    // Given: meal with foods in meal_foods table
    // When: meal is deleted
    // Then: corresponding meal_foods records automatically deleted
  });

  test('nutrition totals stored match calculated values', async () => {
    // Given: meal with known foods and quantities
    // When: meal is saved
    // Then: stored totals match front-end calculations exactly
  });

  test('meal timestamps are handled correctly', async () => {
    // Given: meal logged with specific timestamp
    // When: meal is saved and retrieved
    // Then: timestamp preserved with correct timezone
  });

  test('concurrent meal updates handled safely', async () => {
    // Given: two users updating same meal simultaneously
    // When: both updates processed
    // Then: no race conditions, data integrity maintained
  });
});
```

### 4. Business Logic Tests

```typescript
describe('Meal Business Logic', () => {
  test('meal categorization works correctly', async () => {
    // Given: meal logged at 8am with eggs and toast
    // When: no category specified
    // Then: auto-categorized as breakfast
  });

  test('user food preferences updated after meal creation', async () => {
    // Given: user creates meal with specific foods
    // When: meal is saved
    // Then: user_food_preferences updated with usage counts
  });

  test('meal validation prevents unrealistic values', async () => {
    // When: create meal with 10000 calories
    // Then: validation warning or error returned
  });

  test('duplicate meal handling works correctly', async () => {
    // Given: user tries to log identical meal
    // When: meal creation attempted
    // Then: either allowed with warning or suggestion to edit existing
  });
});
```

### 5. UI Integration Tests

```typescript
describe('Meal Builder UI Integration', () => {
  test('food search integration works end-to-end', async () => {
    // Given: user is in meal builder
    // When: user searches for food and adds it
    // Then: food appears in meal with correct default quantity
  });

  test('real-time macro updates work correctly', async () => {
    // Given: meal with existing foods
    // When: user adds another food
    // Then: meal totals update immediately without page refresh
  });

  test('quantity changes update macros correctly', async () => {
    // Given: food in meal with specific quantity
    // When: user changes quantity
    // Then: food nutrition and meal totals update immediately
  });

  test('food removal updates meal correctly', async () => {
    // Given: meal with multiple foods
    // When: user removes one food
    // Then: food removed from meal, totals recalculated
  });

  test('meal saving preserves all user inputs', async () => {
    // Given: user creates complex meal with notes
    // When: meal is saved and page reloaded
    // Then: all meal details preserved exactly as entered
  });
});
```

### 6. Performance Tests

```typescript
describe('Meal Logging Performance', () => {
  test('macro calculation performance with large meals', async () => {
    // Given: meal with 20+ foods
    // When: add new food to meal
    // Then: macro recalculation completes in <50ms
  });

  test('meal saving performance', async () => {
    // Given: complex meal with 10 foods
    // When: save meal
    // Then: operation completes in <500ms
  });

  test('meal loading performance', async () => {
    // Given: complex saved meal
    // When: load meal for editing
    // Then: meal loads in <200ms
  });

  test('concurrent meal operations performance', async () => {
    // Given: 10 users creating meals simultaneously
    // When: all operations execute
    // Then: all complete successfully without timeout
  });
});
```

### 7. Edge Cases & Error Handling

```typescript
describe('Meal Logging Edge Cases', () => {
  test('handles foods with missing nutrition data', async () => {
    // Given: food with null calories/macros
    // When: food added to meal
    // Then: meal still created, totals calculated with available data
  });

  test('handles extremely large quantities gracefully', async () => {
    // When: user enters 1000kg of food
    // Then: validation warning shown, user can confirm or adjust
  });

  test('handles decimal quantities correctly', async () => {
    // When: user enters 0.5 servings
    // Then: nutrition calculated correctly for fraction
  });

  test('handles network failures during meal save', async () => {
    // Given: network disconnects during save
    // When: meal save attempted
    // Then: meal saved locally, synced when connection restored
  });

  test('handles browser refresh during meal creation', async () => {
    // Given: user is building meal
    // When: browser refreshed accidentally
    // Then: meal draft preserved or user warned about losing changes
  });
});
```

### 8. Data Validation Tests

```typescript
describe('Meal Data Validation', () => {
  test('validates meal name constraints', async () => {
    // Test empty name, too long name, special characters
  });

  test('validates logged_at timestamp', async () => {
    // Test future dates, invalid formats, timezone handling
  });

  test('validates food quantities', async () => {
    // Test negative quantities, zero quantities, unrealistic quantities
  });

  test('validates meal category enum values', async () => {
    // Test invalid categories, case sensitivity
  });

  test('validates nutrition calculation bounds', async () => {
    // Test extremely high/low calculated values
  });
});
```

### 9. User Experience Tests

```typescript
describe('Meal Logging User Experience', () => {
  test('meal builder auto-saves draft', async () => {
    // Given: user is building meal
    // When: user navigates away without saving
    // Then: draft is preserved and recoverable
  });

  test('undo functionality works correctly', async () => {
    // Given: user removes food from meal
    // When: user clicks undo
    // Then: food is restored with original quantity
  });

  test('meal builder handles slow food search', async () => {
    // Given: food search takes >2 seconds
    // When: user continues building meal
    // Then: UI remains responsive, loading states shown
  });

  test('meal builder works on mobile devices', async () => {
    // Given: mobile screen size
    // When: user creates meal
    // Then: all functionality accessible, touch-friendly
  });
});
```

## Test Data Setup

### Seed Data for Meal Tests
```typescript
const testFoods = [
  {
    id: 'chicken-breast-id',
    name: 'Chicken Breast, Raw',
    serving_size: 100,
    serving_unit: 'g',
    calories: 165,
    protein_g: 31.0,
    carbs_g: 0,
    fat_g: 3.6
  },
  {
    id: 'brown-rice-id',
    name: 'Brown Rice, Cooked',
    serving_size: 1,
    serving_unit: 'cup',
    calories: 216,
    protein_g: 5.0,
    carbs_g: 45.0,
    fat_g: 1.8
  },
  {
    id: 'olive-oil-id',
    name: 'Olive Oil',
    serving_size: 1,
    serving_unit: 'tbsp',
    calories: 120,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 14.0
  }
];

const testMeal = {
  meal_name: 'Post-Workout Lunch',
  meal_category: 'lunch',
  logged_at: new Date().toISOString(),
  foods: [
    {
      food_id: 'chicken-breast-id',
      quantity: 150,
      unit: 'g'
    },
    {
      food_id: 'brown-rice-id',
      quantity: 0.5,
      unit: 'cup'
    }
  ]
};
```

### Expected Calculation Results
```typescript
const expectedMealTotals = {
  // 150g chicken: 247.5 cal, 46.5g protein
  // 0.5 cup rice: 108 cal, 2.5g protein, 22.5g carbs
  calories: 355.5, // rounded to 356
  protein_g: 49.0,
  carbs_g: 22.5,
  fat_g: 5.4
};
```

## Performance Benchmarks

### Response Time Requirements
- **Macro calculation**: < 50ms for real-time updates
- **Meal creation**: < 500ms for complex meals
- **Meal loading**: < 200ms for editing
- **Food search integration**: < 100ms from search to add

### Throughput Requirements
- **Concurrent meal creation**: 50+ simultaneous users
- **Meals per minute**: 100+ across all users
- **Database operations**: 1000+ meal-related queries per minute

## Test Environment Setup

### Database Setup
```sql
-- Test database with realistic meal data
-- Isolated test users and foods
-- Performance test dataset with 1000+ meals
```

### Mock Services
```typescript
// Mock external AI services for consistency
// Mock food search for predictable results
// Mock user authentication for various scenarios
```

## Coverage Requirements

### Code Coverage Targets
- **Macro calculation**: 100% line and branch coverage
- **API endpoints**: ≥95% coverage
- **Business logic**: ≥90% coverage
- **UI components**: ≥80% coverage
- **Overall target**: ≥80% coverage

### Critical Paths Coverage
- Complete meal creation flow (search → add → save)
- Macro calculation accuracy
- Data validation and error handling
- User authorization and data privacy

## Continuous Integration

### Automated Testing
- **Unit tests**: Run on every commit
- **Integration tests**: Run on PR creation
- **Performance tests**: Run on staging deployment
- **E2E tests**: Run on production deployment

### Quality Gates
- All tests must pass before merge
- Performance benchmarks must be maintained
- Coverage thresholds must be met
- No regressions in critical user flows