# Natural Language Entry - Test Design

## Test Strategy Overview
Comprehensive testing of AI-powered meal parsing, focusing on accuracy, learning capabilities, edge cases, and seamless integration with meal logging system.

## Test Categories

### 1. Unit Tests - Natural Language Processing

#### Food Extraction Tests
```typescript
describe('Food Extraction', () => {
  test('extracts single food from simple description', () => {
    // Given: "I ate an apple"
    // When: extract foods
    // Then: returns ["apple"] with high confidence
  });

  test('extracts multiple foods from complex description', () => {
    // Given: "Had chicken breast with rice and broccoli"
    // When: extract foods
    // Then: returns ["chicken breast", "rice", "broccoli"]
  });

  test('handles food with modifiers correctly', () => {
    // Given: "grilled chicken breast"
    // When: extract foods
    // Then: returns "chicken breast" (ignores cooking method)
  });

  test('extracts branded foods correctly', () => {
    // Given: "Chobani Greek yogurt"
    // When: extract foods
    // Then: returns food with brand="Chobani", name="Greek yogurt"
  });

  test('handles compound food names', () => {
    // Given: "peanut butter sandwich"
    // When: extract foods
    // Then: considers as single item, not separate "peanut" + "butter"
  });

  test('ignores non-food words', () => {
    // Given: "I quickly ate a delicious apple yesterday"
    // When: extract foods
    // Then: returns only ["apple"], ignores modifiers
  });
});
```

#### Quantity Extraction Tests
```typescript
describe('Quantity Extraction', () => {
  test('extracts explicit quantities with units', () => {
    // Given: "2 cups of rice"
    // When: extract quantity
    // Then: returns {quantity: 2, unit: "cup", confidence: 0.95}
  });

  test('handles fractional quantities', () => {
    // Given: "half a cup of oats"
    // When: extract quantity
    // Then: returns {quantity: 0.5, unit: "cup", confidence: 0.9}
  });

  test('handles descriptive quantities', () => {
    // Given: "large apple"
    // When: extract quantity
    // Then: returns {quantity: 1, unit: "large", confidence: 0.7}
  });

  test('estimates missing quantities', () => {
    // Given: "chicken breast" (no quantity specified)
    // When: extract quantity
    // Then: returns {quantity: 1, unit: "serving", confidence: 0.5}
  });

  test('handles decimal quantities', () => {
    // Given: "1.5 servings of pasta"
    // When: extract quantity
    // Then: returns {quantity: 1.5, unit: "serving", confidence: 0.9}
  });

  test('converts written numbers to numerals', () => {
    // Given: "two eggs"
    // When: extract quantity
    // Then: returns {quantity: 2, unit: "piece", confidence: 0.8}
  });
});
```

#### Meal Timing Extraction Tests
```typescript
describe('Meal Timing Extraction', () => {
  test('extracts explicit time references', () => {
    // Given: "breakfast this morning at 8am"
    // When: extract timing
    // Then: returns category="breakfast", time="8:00 AM", confidence=0.95
  });

  test('infers meal type from time context', () => {
    // Given: "I ate eggs this morning"
    // When: extract timing
    // Then: returns category="breakfast", confidence=0.8
  });

  test('handles relative time expressions', () => {
    // Given: "yesterday's dinner"
    // When: extract timing
    // Then: returns category="dinner", date=yesterday, confidence=0.9
  });

  test('defaults to current time when unclear', () => {
    // Given: "I ate an apple"
    // When: extract timing
    // Then: returns current time, low confidence
  });
});
```

### 2. Integration Tests - Food Database Matching

```typescript
describe('Food Database Matching', () => {
  test('matches exact food names from database', async () => {
    // Given: database has "Chicken Breast, Raw"
    // When: parse "chicken breast"
    // Then: matches database food with high confidence
  });

  test('handles fuzzy matching for typos', async () => {
    // Given: database has "Greek Yogurt"
    // When: parse "greek yoghurt" (British spelling)
    // Then: matches correct food with medium confidence
  });

  test('prioritizes user's frequently used foods', async () => {
    // Given: user frequently logs "Honeycrisp Apple"
    // When: parse "apple"
    // Then: suggests "Honeycrisp Apple" first
  });

  test('handles foods not in database', async () => {
    // Given: user mentions "exotic dragon fruit"
    // When: parse description
    // Then: suggests creating custom food or closest match
  });

  test('matches branded foods correctly', async () => {
    // Given: database has foods with brands
    // When: parse "Chobani yogurt"
    // Then: matches brand-specific food over generic
  });
});
```

### 3. Accuracy Tests - Parsing Quality

```typescript
describe('Parsing Accuracy', () => {
  test('achieves target accuracy on standard meal descriptions', async () => {
    // Given: 100 common meal descriptions
    // When: parse all descriptions
    // Then: >=85% achieve acceptable accuracy without corrections
  });

  test('handles complex multi-food meals accurately', async () => {
    // Given: "Grilled salmon with quinoa, steamed broccoli, and olive oil"
    // When: parse description
    // Then: identifies all 4 components with reasonable quantities
  });

  test('maintains accuracy across different meal types', async () => {
    // Given: breakfast, lunch, dinner, snack descriptions
    // When: parse each type
    // Then: accuracy consistent across meal categories
  });

  test('confidence scores correlate with actual accuracy', async () => {
    // Given: parsed meals with various confidence scores
    // When: validate against known correct answers
    // Then: high confidence = high accuracy, low confidence = needs review
  });
});

const testMealDescriptions = [
  {
    input: "Had 2 scrambled eggs and 2 slices of toast for breakfast",
    expected: {
      foods: [
        { name: "eggs", quantity: 2, unit: "large" },
        { name: "toast", quantity: 2, unit: "slice" }
      ],
      category: "breakfast",
      confidence: "high"
    }
  },
  {
    input: "Lunch was a chicken salad with mixed greens and balsamic dressing",
    expected: {
      foods: [
        { name: "chicken breast", quantity: 100, unit: "g" },
        { name: "mixed greens", quantity: 2, unit: "cup" },
        { name: "balsamic dressing", quantity: 1, unit: "tbsp" }
      ],
      category: "lunch",
      confidence: "medium"
    }
  }
];
```

### 4. Learning System Tests

```typescript
describe('Learning System', () => {
  test('learns from user corrections', async () => {
    // Given: user corrects "chick breast" → "chicken breast"
    // When: parse "chick breast" again
    // Then: automatically suggests "chicken breast"
  });

  test('improves quantity estimates from feedback', async () => {
    // Given: user consistently corrects "apple" from 100g → 150g
    // When: parse "apple" after multiple corrections
    // Then: defaults to 150g quantity
  });

  test('learns user-specific food names', async () => {
    // Given: user creates custom food "my protein smoothie"
    // When: parse "had my protein smoothie"
    // Then: matches user's custom food
  });

  test('adapts meal timing patterns', async () => {
    // Given: user consistently has "coffee and oats" at 6am = breakfast
    // When: parse similar future descriptions
    // Then: correctly categorizes as breakfast
  });

  test('prevents overfitting to individual corrections', async () => {
    // Given: one unusual correction that doesn't represent pattern
    // When: parse similar descriptions
    // Then: doesn't apply correction unless pattern confirmed
  });
});
```

### 5. Edge Cases & Error Handling

```typescript
describe('Edge Cases', () => {
  test('handles extremely long descriptions gracefully', async () => {
    // Given: 1000+ word meal description
    // When: parse description
    // Then: processes without timeout, extracts key foods
  });

  test('handles empty or minimal input', async () => {
    // Given: empty string or "food"
    // When: parse description
    // Then: returns helpful error message, not crash
  });

  test('handles non-food terms in descriptions', async () => {
    // Given: "I was at the gym and then ate an apple"
    // When: parse description
    // Then: extracts only food items, ignores location/activity
  });

  test('handles ambiguous quantities', async () => {
    // Given: "some rice" or "a bit of chicken"
    // When: parse description
    // Then: provides reasonable estimates with low confidence
  });

  test('handles multiple meals in one description', async () => {
    // Given: "For breakfast I had eggs, then lunch was pasta"
    // When: parse description
    // Then: either splits into multiple meals or asks for clarification
  });

  test('handles dietary restrictions and substitutions', async () => {
    // Given: "almond milk instead of regular milk"
    // When: parse description
    // Then: correctly identifies almond milk, not dairy milk
  });
});
```

### 6. Performance Tests

```typescript
describe('Parsing Performance', () => {
  test('parses typical meal descriptions within time limit', async () => {
    // Given: average meal description
    // When: parse with timing measurement
    // Then: completes in <2 seconds
  });

  test('handles concurrent parsing requests', async () => {
    // Given: 10 simultaneous parse requests
    // When: all requests processed
    // Then: all complete within acceptable time
  });

  test('food database lookups are fast', async () => {
    // Given: complex meal with 5+ foods
    // When: match all foods to database
    // Then: lookups complete in <500ms total
  });

  test('learning system updates don\'t block parsing', async () => {
    // Given: parsing request with learning update
    // When: parse meal
    // Then: parsing completes quickly, learning happens asynchronously
  });
});
```

### 7. User Experience Tests

```typescript
describe('User Experience', () => {
  test('provides helpful suggestions for ambiguous input', async () => {
    // Given: "had pasta"
    // When: parse description
    // Then: suggests specific pasta types, portion sizes
  });

  test('explains AI assumptions clearly', async () => {
    // Given: description with uncertain elements
    // When: parse and show result
    // Then: clearly lists what AI assumed vs. what was explicit
  });

  test('correction interface is intuitive', async () => {
    // Given: parsed meal with errors
    // When: user corrects mistakes
    // Then: corrections are easy to make, immediately reflected
  });

  test('progress indication during parsing', async () => {
    // Given: complex meal being parsed
    // When: parsing takes >1 second
    // Then: user sees progress indicator, not frozen UI
  });
});
```

### 8. Nutritional Accuracy Tests

```typescript
describe('Nutritional Accuracy', () => {
  test('calculated totals match manual meal creation', async () => {
    // Given: parsed meal and manually created identical meal
    // When: compare nutritional totals
    // Then: values match within acceptable margin (<5% difference)
  });

  test('handles foods with missing nutritional data', async () => {
    // Given: food in database with incomplete nutrition info
    // When: include in parsed meal
    // Then: handles gracefully, indicates uncertainty
  });

  test('portion size estimates are reasonable', async () => {
    // Given: common foods without explicit quantities
    // When: AI estimates portions
    // Then: estimates align with standard serving sizes
  });
});
```

## Test Data Sets

### Training/Validation Meal Descriptions
```typescript
const testDescriptions = {
  simple: [
    "I ate an apple",
    "Had 2 eggs for breakfast",
    "Chicken breast for lunch",
    "Greek yogurt with berries"
  ],

  medium_complexity: [
    "Scrambled eggs with cheese and toast",
    "Grilled chicken salad with mixed greens",
    "Pasta with marinara sauce and parmesan",
    "Smoothie with banana, protein powder, and almond milk"
  ],

  complex: [
    "For dinner I had 6oz grilled salmon, 1 cup quinoa, steamed broccoli with a tablespoon of olive oil",
    "This morning's breakfast was 2 large scrambled eggs, 2 slices whole wheat toast with butter, and a glass of orange juice",
    "Yesterday's lunch at the café: turkey and avocado sandwich on sourdough with a side of sweet potato fries"
  ],

  edge_cases: [
    "", // empty
    "food", // too vague
    "I was at the restaurant", // no foods mentioned
    "Had some stuff for lunch", // extremely vague
    "Protein shake protein shake protein shake" // repetitive
  ]
};
```

### Expected Parsing Results
```typescript
const expectedResults = {
  "2 scrambled eggs and toast for breakfast": {
    meal_name: "Scrambled Eggs and Toast",
    meal_category: "breakfast",
    confidence: "high",
    foods: [
      {
        name: "Scrambled Eggs",
        quantity: 2,
        unit: "large",
        confidence: 0.9
      },
      {
        name: "Toast",
        quantity: 2,
        unit: "slice",
        confidence: 0.8
      }
    ],
    assumptions: [
      "Assumed 2 large eggs for scrambled eggs",
      "Assumed 2 slices of bread for toast"
    ]
  }
};
```

## Performance Benchmarks

### Response Time Requirements
- **Simple parsing** (1-2 foods): < 1 second
- **Complex parsing** (5+ foods): < 2 seconds
- **Database matching**: < 500ms per food
- **Confidence analysis**: < 100ms
- **Learning updates**: Asynchronous, < 1 second

### Accuracy Targets
- **Food identification**: ≥85% accuracy
- **Quantity extraction**: ≥80% for explicit quantities, ≥60% for estimates
- **Meal categorization**: ≥90% with context clues
- **Overall user satisfaction**: ≥85% of users accept parsed results with minimal editing

## Regression Testing

### Accuracy Regression Tests
```typescript
describe('Accuracy Regression', () => {
  test('maintains parsing accuracy after model updates', async () => {
    // Given: baseline accuracy on standard test set
    // When: model or algorithms updated
    // Then: accuracy doesn't decrease significantly
  });

  test('learning doesn\'t break existing patterns', async () => {
    // Given: well-established parsing patterns
    // When: new learning data applied
    // Then: existing patterns still work correctly
  });
});
```

### Performance Regression Tests
```typescript
describe('Performance Regression', () => {
  test('parsing speed maintained after updates', async () => {
    // Given: baseline parsing speed
    // When: code or model updated
    // Then: speed doesn't regress significantly
  });

  test('database query performance maintained', async () => {
    // Given: baseline food matching speed
    // When: database or queries modified
    // Then: performance doesn't degrade
  });
});
```

## A/B Testing Framework

### Parsing Algorithm Testing
```typescript
interface ParsingABTest {
  // Compare different parsing approaches
  testAlgorithmVariants(descriptions: string[]): ABTestResults;

  // Compare confidence scoring methods
  testConfidenceScoring(parsedMeals: ParsedMeal[]): ConfidenceResults;

  // Test different user correction interfaces
  testCorrectionUI(userInteractions: UserInteraction[]): UITestResults;
}
```

## Error Monitoring & Analytics

### Parsing Error Tracking
```typescript
interface ParsingErrorTracking {
  // Track parsing failures
  unparseable_descriptions: string[];
  low_confidence_results: ParsedMeal[];
  user_corrections: ParsingCorrection[];
  timeout_errors: number;

  // Performance metrics
  average_parsing_time: number;
  parsing_success_rate: number;
  user_satisfaction_score: number;
}
```

### Learning System Analytics
```typescript
interface LearningAnalytics {
  // Track learning effectiveness
  correction_patterns: CorrectionPattern[];
  accuracy_improvement_over_time: AccuracyMetrics[];
  user_engagement_with_corrections: EngagementMetrics;

  // Pattern analysis
  most_common_food_synonyms: SynonymMapping[];
  quantity_preference_patterns: QuantityPattern[];
  meal_timing_patterns: TimingPattern[];
}
```

## Quality Assurance Process

### Manual Review Process
1. **Sample testing**: Manually review 10% of parsed results
2. **Edge case validation**: Test unusual descriptions monthly
3. **User feedback review**: Analyze user corrections weekly
4. **Accuracy calibration**: Verify confidence scores match actual accuracy

### Automated Quality Checks
1. **Nutrition bounds checking**: Flag unrealistic macro calculations
2. **Confidence calibration**: Monitor if confidence scores predict accuracy
3. **Learning system validation**: Ensure corrections actually improve future parsing
4. **Performance monitoring**: Alert if parsing times exceed thresholds

## Test Environment Setup

### AI/ML Testing Environment
```typescript
// Mock AI services for consistent testing
interface MockAIService {
  predictableResponses: boolean;
  latencySimulation: number;
  errorInjection: ErrorScenario[];
}

// Test database with known foods for matching
const testFoodDatabase = {
  // Comprehensive set of test foods
  // Known nutrition values
  // Various categories and brands
};
```

### Coverage Requirements
- **Parsing logic**: 100% code coverage
- **Food matching**: ≥95% coverage
- **Learning system**: ≥90% coverage
- **Integration flows**: ≥85% coverage
- **Overall target**: ≥80% coverage

## Continuous Integration

### Automated Testing Pipeline
1. **Unit tests**: Run on every commit
2. **Integration tests**: Run on PR creation
3. **Accuracy tests**: Run daily with test dataset
4. **Performance tests**: Run on staging deployment
5. **Regression tests**: Run before production deployment

### Quality Gates
- All unit tests must pass
- Accuracy must meet minimum thresholds
- Performance benchmarks must be maintained
- No critical parsing failures on standard test set