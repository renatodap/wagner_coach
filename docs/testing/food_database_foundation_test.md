# Food Database Foundation - Test Design

## Test Strategy Overview
Comprehensive testing approach covering API endpoints, database operations, personalization features, and performance requirements.

## Test Categories

### 1. Unit Tests - API Endpoints

#### Food Search API (`/api/nutrition/foods/search`)
```typescript
describe('Food Search API', () => {
  test('returns foods matching search query', async () => {
    // Given: seeded database with "chicken breast"
    // When: search for "chicken"
    // Then: returns foods containing "chicken" in name/description
  });

  test('returns personalized results first for authenticated user', async () => {
    // Given: user has frequently used "apple"
    // When: search for "app"
    // Then: user's frequent "apple" appears first
  });

  test('filters by category when specified', async () => {
    // Given: foods in multiple categories
    // When: search with category="protein"
    // Then: only protein foods returned
  });

  test('handles empty search gracefully', async () => {
    // When: search with empty query
    // Then: returns popular/recent foods or empty array
  });

  test('respects limit parameter', async () => {
    // When: search with limit=5
    // Then: returns maximum 5 results
  });

  test('returns error for invalid parameters', async () => {
    // When: search with invalid category
    // Then: returns 400 with validation error
  });
});
```

#### Food CRUD APIs
```typescript
describe('Food CRUD APIs', () => {
  describe('GET /api/nutrition/foods/:id', () => {
    test('returns food by valid ID');
    test('returns 404 for non-existent food');
    test('returns 400 for invalid UUID');
  });

  describe('POST /api/nutrition/foods', () => {
    test('creates food with valid data');
    test('validates required fields');
    test('validates nutrition ranges');
    test('prevents duplicate foods');
    test('requires authentication for custom foods');
  });

  describe('PUT /api/nutrition/foods/:id', () => {
    test('updates food with valid data');
    test('prevents unauthorized updates');
    test('validates changed fields');
  });

  describe('DELETE /api/nutrition/foods/:id', () => {
    test('deletes user-created food');
    test('prevents deleting verified foods');
    test('requires ownership or admin');
  });
});
```

### 2. Integration Tests - Database Operations

```typescript
describe('Food Database Operations', () => {
  test('full-text search works across name, brand, description', async () => {
    // Given: food with name="Greek Yogurt", brand="Chobani", description="plain"
    // When: search for "greek", "chobani", or "plain"
    // Then: food is found in all cases
  });

  test('user preferences track food usage', async () => {
    // Given: user selects a food for meal
    // When: food is used in meal creation
    // Then: user_food_preferences.usage_count increments
  });

  test('frequent foods query returns most used foods', async () => {
    // Given: user has used various foods with different counts
    // When: query frequent foods
    // Then: foods ordered by usage_count descending
  });
});
```

### 3. Performance Tests

```typescript
describe('Food Search Performance', () => {
  test('search response time under 100ms for cached results', async () => {
    // Given: database with 10K foods
    // When: search for common food
    // Then: response time < 100ms
  });

  test('search handles concurrent requests efficiently', async () => {
    // Given: 100 simultaneous search requests
    // When: all requests execute
    // Then: all complete within acceptable time, no errors
  });

  test('database can handle large food dataset', async () => {
    // Given: 100K foods in database
    // When: various search operations
    // Then: performance remains acceptable
  });
});
```

### 4. Business Logic Tests

```typescript
describe('Food Personalization Logic', () => {
  test('personalizes search results based on user history', async () => {
    // Given: user frequently uses "banana"
    // When: search for "ban"
    // Then: "banana" appears first due to personalization
  });

  test('favorites appear prominently in search', async () => {
    // Given: user has favorited specific foods
    // When: search includes favorited food
    // Then: favorited food has priority in results
  });

  test('usage tracking works across multiple meals', async () => {
    // Given: user creates multiple meals with same food
    // When: checking user_food_preferences
    // Then: usage_count reflects total usage
  });
});
```

### 5. Validation Tests

```typescript
describe('Food Data Validation', () => {
  test('validates required fields on food creation', async () => {
    // When: create food without required fields
    // Then: returns validation errors
  });

  test('validates nutrition values are reasonable', async () => {
    // When: create food with calories = 10000 per gram
    // Then: returns validation error for unrealistic values
  });

  test('validates serving size is positive', async () => {
    // When: create food with serving_size <= 0
    // Then: returns validation error
  });

  test('validates enum values for category and unit', async () => {
    // When: create food with invalid category
    // Then: returns validation error
  });
});
```

### 6. Edge Cases & Error Handling

```typescript
describe('Edge Cases and Error Handling', () => {
  test('handles special characters in search', async () => {
    // Given: food names with apostrophes, dashes, etc.
    // When: search with special characters
    // Then: search works correctly
  });

  test('handles very long search queries', async () => {
    // When: search with 500+ character query
    // Then: handles gracefully without errors
  });

  test('handles database connection failures', async () => {
    // Given: database is temporarily unavailable
    // When: API calls are made
    // Then: returns appropriate error messages
  });

  test('handles duplicate food creation attempts', async () => {
    // When: attempt to create food that already exists
    // Then: either merges or returns existing food
  });
});
```

### 7. Security Tests

```typescript
describe('Security Tests', () => {
  test('prevents SQL injection in search queries', async () => {
    // When: search with SQL injection attempt
    // Then: query is safely escaped, no injection occurs
  });

  test('enforces authentication for custom food creation', async () => {
    // When: attempt to create food without auth
    // Then: returns 401 unauthorized
  });

  test('prevents users from editing others foods', async () => {
    // When: user attempts to edit food created by another user
    // Then: returns 403 forbidden
  });
});
```

## Test Data Setup

### Seed Data for Tests
```typescript
const testFoods = [
  {
    name: 'Chicken Breast',
    brand: null,
    category: 'protein',
    serving_size: 100,
    serving_unit: 'g',
    calories: 165,
    protein_g: 31,
    carbs_g: 0,
    fat_g: 3.6,
    source: 'usda'
  },
  {
    name: 'Greek Yogurt',
    brand: 'Chobani',
    category: 'dairy',
    serving_size: 150,
    serving_unit: 'g',
    calories: 100,
    protein_g: 17,
    carbs_g: 6,
    fat_g: 0,
    source: 'manual'
  },
  // ... more test foods
];
```

### User Preference Test Data
```typescript
const testUserPreferences = [
  {
    user_id: 'test-user-1',
    food_id: 'chicken-breast-id',
    usage_count: 15,
    is_favorite: true,
    last_used_at: new Date()
  },
  // ... more preferences
];
```

## Performance Benchmarks

### Response Time Requirements
- **Food Search**: < 100ms for cached results, < 500ms for database queries
- **Food CRUD**: < 50ms for simple operations
- **Personalization**: < 200ms including preference lookup

### Throughput Requirements
- **Concurrent searches**: 100+ simultaneous users
- **Database operations**: 1000+ operations per minute
- **Food creation**: 10+ foods per minute per user

## Test Environment Setup

### Database Setup
```sql
-- Test database with minimal seed data
-- Isolated from production data
-- Reset between test runs
```

### Authentication Mock
```typescript
// Mock user authentication for testing
// Different user contexts for permission tests
```

### Performance Test Setup
```typescript
// Load testing with multiple concurrent users
// Memory and CPU monitoring
// Database query analysis
```

## Coverage Requirements

### Code Coverage Targets
- **API Endpoints**: 100% line coverage
- **Business Logic**: ≥90% branch coverage
- **Database Operations**: ≥85% coverage
- **Overall Target**: ≥80% coverage

### Critical Paths Coverage
- All search functionality must be tested
- All CRUD operations must be tested
- All validation rules must be tested
- All personalization features must be tested

## Continuous Integration

### Test Automation
- **Unit tests**: Run on every commit
- **Integration tests**: Run on PR creation
- **Performance tests**: Run nightly
- **E2E tests**: Run on deployment

### Quality Gates
- All tests must pass before merge
- Coverage must meet minimum thresholds
- Performance benchmarks must be maintained
- Security tests must pass