# AI Coach Testing Specification

## Test Strategy Overview
Comprehensive testing of the AI Coach feature using real data and actual API integrations. No mocks - all tests interact with real services in test mode.

## Test Categories

### 1. Chat Interface Tests

#### Test: Initial Coach Load
**File**: `__tests__/coach/coach-interface.test.tsx`
```typescript
describe('Coach Interface', () => {
  it('should render coach tab in navigation', async () => {
    // Navigate to any page with bottom nav
    // Verify "Coach" tab is visible
    // Verify icon and label are correct
  });

  it('should load chat interface when coach tab clicked', async () => {
    // Click coach tab
    // Verify chat interface renders
    // Check for message input field
    // Check for send button
  });

  it('should display welcome message for first-time users', async () => {
    // Load coach with no conversation history
    // Verify welcome message appears
    // Check for quick setup prompts
    // Verify user context initialization
  });

  it('should load conversation history for returning users', async () => {
    // Create test conversation in database
    // Load coach interface
    // Verify previous messages appear
    // Check message order and formatting
  });
});
```

#### Test: Message Sending and Receiving
```typescript
describe('Message Flow', () => {
  it('should send user message and receive AI response', async () => {
    // Type message in input field
    // Click send button
    // Verify user message appears
    // Wait for AI response stream
    // Verify AI message renders progressively
  });

  it('should handle streaming responses correctly', async () => {
    // Send message triggering long response
    // Verify typing indicator appears
    // Check progressive text rendering
    // Verify complete message after stream ends
  });

  it('should maintain conversation context', async () => {
    // Send initial message about goals
    // Receive AI response
    // Send follow-up referencing previous message
    // Verify AI response shows context awareness
  });
});
```

### 2. Vector Database Tests

#### Test: Embedding Generation
**File**: `__tests__/embeddings/generation.test.ts`
```typescript
describe('Embedding Generation', () => {
  it('should generate embeddings for workout completions', async () => {
    // Create workout completion
    // Call embedding generation endpoint
    // Verify 768-dimension vector created
    // Check database storage
  });

  it('should generate embeddings for user goals', async () => {
    // Set user goal in profile
    // Generate goal embedding
    // Verify vector dimensions
    // Confirm database update
  });

  it('should batch process multiple embeddings', async () => {
    // Create multiple content items
    // Call batch embedding endpoint
    // Verify all embeddings generated
    // Check performance metrics
  });
});
```

#### Test: Semantic Search
```typescript
describe('Semantic Search', () => {
  it('should find relevant workout context', async () => {
    // Create test workout data with embeddings
    // Search for "chest workout performance"
    // Verify relevant workouts returned
    // Check similarity scores
  });

  it('should retrieve similar exercises', async () => {
    // Create exercise embeddings
    // Search for "upper body strength"
    // Verify related exercises found
    // Validate ranking order
  });

  it('should respect user isolation', async () => {
    // Create embeddings for multiple users
    // Search as specific user
    // Verify only user's content returned
    // Confirm RLS enforcement
  });
});
```

### 3. RAG System Tests

#### Test: Context Retrieval
**File**: `__tests__/rag/context.test.ts`
```typescript
describe('Context Retrieval', () => {
  it('should gather complete user context', async () => {
    // Create comprehensive test data
    // Call context retrieval endpoint
    // Verify workout history included
    // Check goals and progress data
    // Validate personal records
  });

  it('should prioritize recent context', async () => {
    // Create workouts across time range
    // Retrieve context for coaching
    // Verify recent workouts weighted higher
    // Check temporal relevance
  });

  it('should include relevant conversation history', async () => {
    // Create previous conversations
    // Ask related question
    // Verify past context retrieved
    // Check conversation continuity
  });
});
```

#### Test: Augmented Generation
```typescript
describe('Augmented Generation', () => {
  it('should generate personalized responses with context', async () => {
    // Create user with specific workout history
    // Ask about progress
    // Verify response references actual data
    // Check personalization accuracy
  });

  it('should provide workout recommendations based on history', async () => {
    // Create workout pattern (e.g., PPL split)
    // Ask for next workout suggestion
    // Verify recommendation aligns with pattern
    // Check exercise progression logic
  });

  it('should analyze performance trends', async () => {
    // Create workout history with progression
    // Ask about strength gains
    // Verify accurate trend analysis
    // Check specific lift references
  });
});
```

### 4. API Endpoint Tests

#### Test: Coach Chat Endpoint
**File**: `__tests__/api/coach.test.ts`
```typescript
describe('Coach API', () => {
  it('should handle chat messages with streaming', async () => {
    // POST to /api/coach with message
    // Verify streaming response headers
    // Check chunk format
    // Validate complete response
  });

  it('should maintain conversation state', async () => {
    // Send multiple messages in conversation
    // Verify conversation ID persistence
    // Check context accumulation
    // Validate memory management
  });

  it('should handle errors gracefully', async () => {
    // Send message with API key exhausted
    // Verify error response format
    // Check fallback behavior
    // Validate user notification
  });
});
```

#### Test: Embedding Endpoints
```typescript
describe('Embedding API', () => {
  it('should generate embeddings on demand', async () => {
    // POST to /api/embeddings/generate
    // Verify embedding dimensions
    // Check response time
    // Validate storage confirmation
  });

  it('should search embeddings efficiently', async () => {
    // POST to /api/embeddings/search
    // Verify search results
    // Check similarity threshold
    // Validate result ordering
  });
});
```

### 5. Integration Tests

#### Test: End-to-End Coach Session
**File**: `__tests__/integration/coach-session.test.ts`
```typescript
describe('Complete Coach Session', () => {
  it('should complete full coaching conversation', async () => {
    // Create user with workout history
    // Open coach interface
    // Send greeting message
    // Verify personalized response
    // Ask about recent workout
    // Check specific data references
    // Request workout recommendation
    // Verify actionable suggestion
    // Test quick actions
    // Validate context persistence
  });

  it('should handle workout analysis request', async () => {
    // Complete workout session
    // Open coach immediately after
    // Ask for workout analysis
    // Verify specific set/rep references
    // Check performance insights
    // Validate improvement suggestions
  });

  it('should provide goal-based guidance', async () => {
    // Set specific user goal
    // Ask coach about progress
    // Verify goal-aligned response
    // Check milestone tracking
    // Validate adjustment recommendations
  });
});
```

### 6. Performance Tests

#### Test: Response Time
**File**: `__tests__/performance/latency.test.ts`
```typescript
describe('Performance Metrics', () => {
  it('should generate first token within 2 seconds', async () => {
    // Send message
    // Measure time to first token
    // Verify under 2 second threshold
  });

  it('should complete average response within 5 seconds', async () => {
    // Send standard coaching question
    // Measure total response time
    // Verify under 5 second threshold
  });

  it('should handle concurrent conversations', async () => {
    // Simulate 10 concurrent users
    // Measure response times
    // Verify no degradation
    // Check resource usage
  });
});
```

### 7. Mobile Experience Tests

#### Test: Touch Interactions
**File**: `__tests__/mobile/touch.test.ts`
```typescript
describe('Mobile Interactions', () => {
  it('should handle touch input correctly', async () => {
    // Simulate mobile viewport
    // Test touch targets (min 44x44px)
    // Verify swipe gestures
    // Check keyboard behavior
  });

  it('should adapt layout for mobile', async () => {
    // Set mobile viewport
    // Verify responsive layout
    // Check input positioning
    // Validate scroll behavior
  });
});
```

### 8. Security Tests

#### Test: Data Isolation
**File**: `__tests__/security/isolation.test.ts`
```typescript
describe('Security and Privacy', () => {
  it('should enforce user data isolation', async () => {
    // Create coach data for multiple users
    // Attempt cross-user access
    // Verify access denied
    // Check RLS policies
  });

  it('should rate limit API calls', async () => {
    // Send messages exceeding rate limit
    // Verify rate limit response
    // Check cooldown period
    // Validate user notification
  });

  it('should sanitize user input', async () => {
    // Send message with potential XSS
    // Verify sanitization
    // Check stored format
    // Validate rendered output
  });
});
```

## Test Data Setup

### Required Test Data
```typescript
// Test users with different profiles
const testUsers = [
  { goal: 'build_muscle', experience: 'beginner' },
  { goal: 'lose_weight', experience: 'intermediate' },
  { goal: 'gain_strength', experience: 'advanced' }
];

// Test workout history
const testWorkouts = [
  { type: 'push', exercises: [...], completions: 10 },
  { type: 'pull', exercises: [...], completions: 8 },
  { type: 'legs', exercises: [...], completions: 12 }
];

// Test conversations
const testConversations = [
  { topic: 'form_check', messages: [...] },
  { topic: 'progress_review', messages: [...] },
  { topic: 'workout_planning', messages: [...] }
];
```

## Coverage Requirements

### Minimum Coverage Targets
- **Overall**: ≥80%
- **Chat Interface**: ≥85%
- **API Endpoints**: ≥90%
- **RAG System**: ≥75%
- **Security Functions**: 100%

### Critical Path Coverage
All user-facing flows must have 100% coverage:
1. First-time coach interaction
2. Message sending and receiving
3. Context retrieval and usage
4. Error handling and recovery

## Performance Benchmarks

### Response Time Targets
- First token: <2 seconds
- Complete response: <5 seconds
- Embedding generation: <500ms
- Vector search: <200ms

### Throughput Targets
- 100 concurrent conversations
- 1000 messages per minute
- 10000 embeddings per hour

## Test Environment

### Database Setup
```sql
-- Test database with pgvector
CREATE DATABASE wagner_coach_test;
\c wagner_coach_test;
CREATE EXTENSION vector;

-- Run all migrations
-- Seed with test data
```

### Environment Variables
```env
# Test environment
NODE_ENV=test
DATABASE_URL=postgresql://...test
OPENAI_API_KEY=test_key_with_quota
GOOGLE_API_KEY=test_key_with_quota
```

## Continuous Integration

### Test Pipeline
1. **Unit Tests**: Run on every commit
2. **Integration Tests**: Run on PR creation
3. **E2E Tests**: Run before merge
4. **Performance Tests**: Weekly schedule
5. **Security Tests**: On security-related changes

### Test Reporting
- Coverage reports in PR comments
- Performance metrics dashboard
- Failed test notifications
- Trend analysis over time

## Manual Testing Checklist

### Pre-release Verification
- [ ] New user onboarding flow
- [ ] Conversation continuity across sessions
- [ ] Quick action functionality
- [ ] Mobile responsiveness
- [ ] Offline behavior
- [ ] Error recovery
- [ ] Rate limit handling
- [ ] Context accuracy
- [ ] Response relevance
- [ ] Performance consistency