# Profile Database Layer Test Plan

## Test Objectives
Ensure the database schema, RLS policies, and data integrity constraints function correctly while maintaining strict security boundaries between users.

## Test Categories

### 1. Schema Validation Tests

#### Test Suite: `profile.schema.test.ts`
```typescript
describe('Database Schema Validation', () => {
  describe('profiles table extensions', () => {
    test('should have all new columns with correct types')
    test('should maintain backwards compatibility with existing columns')
    test('should have proper default values for new columns')
    test('should enforce enum constraints on experience_level')
  })

  describe('user_goals table', () => {
    test('should exist with all required columns')
    test('should have proper foreign key to auth.users')
    test('should enforce check constraints on target_value (positive only)')
    test('should enforce target_date is in the future')
    test('should have unique constraint on id')
    test('should cascade delete when user is removed')
  })

  describe('profile_embeddings table', () => {
    test('should exist with vector(1536) column')
    test('should have proper foreign key to auth.users')
    test('should have unique constraint on user_id + content_hash')
    test('should have GiST index on embedding column')
  })

  describe('goal_embeddings table', () => {
    test('should exist with vector(1536) column')
    test('should have proper foreign keys to user_goals and auth.users')
    test('should cascade delete when goal is removed')
    test('should have GiST index on embedding column')
  })
})
```

### 2. Row Level Security (RLS) Tests

#### Test Suite: `profile.rls.test.ts`
```typescript
describe('Row Level Security Policies', () => {
  let userA: TestUser
  let userB: TestUser
  let supabase: SupabaseClient

  beforeEach(async () => {
    userA = await createTestUser()
    userB = await createTestUser()
  })

  describe('profiles table RLS', () => {
    test('user can read own profile')
    test('user cannot read another users profile')
    test('user can update own profile')
    test('user cannot update another users profile')
    test('user cannot delete another users profile')
    test('anonymous user cannot access any profiles')
  })

  describe('user_goals table RLS', () => {
    test('user can create goals for themselves')
    test('user cannot create goals for another user')
    test('user can read own goals')
    test('user cannot read another users goals')
    test('user can update own goals')
    test('user cannot update another users goals')
    test('user can delete own goals')
    test('user cannot delete another users goals')
  })

  describe('profile_embeddings table RLS', () => {
    test('service role can create embeddings for any user')
    test('user can read own embeddings')
    test('user cannot read another users embeddings')
    test('user cannot directly create/update/delete embeddings')
  })

  describe('goal_embeddings table RLS', () => {
    test('service role can create goal embeddings')
    test('user can read embeddings for own goals')
    test('user cannot read embeddings for another users goals')
    test('embeddings are deleted when goal is deleted')
  })
})
```

### 3. Data Integrity Tests

#### Test Suite: `profile.integrity.test.ts`
```typescript
describe('Data Integrity Constraints', () => {
  describe('Cascading deletes', () => {
    test('deleting user removes all related profile data')
    test('deleting goal removes related embeddings')
    test('orphaned embeddings are prevented')
  })

  describe('Check constraints', () => {
    test('experience_level only accepts valid enum values')
    test('target_value must be positive')
    test('target_date cannot be in the past')
    test('priority must be between 1 and 5')
    test('arrays cannot contain null values')
  })

  describe('Trigger functions', () => {
    test('updated_at is automatically updated on profile change')
    test('updated_at is automatically updated on goal change')
  })
})
```

### 4. Migration Tests

#### Test Suite: `profile.migration.test.ts`
```typescript
describe('Database Migration', () => {
  describe('Forward migration', () => {
    test('applies cleanly to fresh database')
    test('applies cleanly to existing database with data')
    test('preserves existing profile data')
    test('creates all indexes correctly')
    test('enables RLS on all tables')
  })

  describe('Rollback migration', () => {
    test('cleanly reverts all schema changes')
    test('preserves original profile data')
    test('removes all new tables')
    test('removes all new policies')
  })
})
```

### 5. Performance Tests

#### Test Suite: `profile.performance.test.ts`
```typescript
describe('Query Performance', () => {
  describe('Profile queries', () => {
    test('fetch single profile completes under 100ms')
    test('update profile completes under 100ms')
    test('batch update arrays completes under 200ms')
  })

  describe('Goal queries', () => {
    test('fetch user goals (up to 20) completes under 100ms')
    test('create new goal completes under 100ms')
    test('update goal status completes under 50ms')
  })

  describe('Vector similarity searches', () => {
    test('similarity search on 1000 embeddings completes under 200ms')
    test('similarity search on 10000 embeddings completes under 500ms')
    test('combined filter + similarity search completes under 300ms')
  })
})
```

## Test Data Requirements

### Test Users
- Create 3 test users with different profiles:
  1. Beginner user with minimal equipment
  2. Advanced user with full gym access
  3. Intermediate user with home setup

### Test Goals
- Each test user should have 3-5 goals:
  - Weight loss goal with specific target
  - Strength goal with rep targets
  - Endurance goal with time/distance targets
  - Flexibility goal with qualitative targets

### Test Embeddings
- Generate realistic embeddings using actual OpenAI API
- Store sample embeddings for consistent testing
- Create edge cases (empty text, very long text)

## Test Environment Setup

### Prerequisites
```bash
# Install test dependencies
npm install --save-dev @supabase/supabase-js
npm install --save-dev @testing-library/jest-dom
npm install --save-dev jest-environment-node

# Set environment variables
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=test_anon_key
SUPABASE_SERVICE_KEY=test_service_key
```

### Database Setup
```sql
-- Create test database
CREATE DATABASE wagner_coach_test;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

## Test Execution Strategy

### Phase 1: Schema Tests (Run First)
1. Verify tables exist
2. Verify columns and types
3. Verify constraints and indexes

### Phase 2: RLS Tests (Run Second)
1. Create test users
2. Test each CRUD operation
3. Verify cross-user isolation

### Phase 3: Integration Tests (Run Third)
1. Test complete user workflows
2. Test embedding generation
3. Test cascading operations

### Phase 4: Performance Tests (Run Last)
1. Load test data (1000+ records)
2. Measure query times
3. Identify bottlenecks

## Success Criteria
- ✅ 100% of RLS policies prevent unauthorized access
- ✅ 100% of schema validations pass
- ✅ 100% of integrity constraints enforced
- ✅ All queries perform within specified limits
- ✅ Migration applies and rolls back cleanly
- ✅ Test coverage ≥ 80% for database layer

## Error Scenarios to Test
1. Duplicate user_id in profiles
2. Invalid enum values
3. Null values in required fields
4. Malformed vector data
5. Cross-user access attempts
6. Constraint violations
7. Transaction rollbacks
8. Connection timeouts

## Continuous Integration
```yaml
# .github/workflows/database-tests.yml
name: Database Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: supabase/postgres:14.1.0
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v2
      - name: Run migrations
        run: npx supabase db push
      - name: Run database tests
        run: npm run test:db
```