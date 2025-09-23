# AI Coach Memory Enhancement Test Design Document

## Test Strategy Overview

Comprehensive testing for AI memory enhancement features including expanded context retrieval, conversation memory, preference extraction, and context compression.

## Test Categories

### 1. Unit Tests
- Memory fact extraction
- Conversation summarization
- Context compression algorithms
- Preference profile building

### 2. Integration Tests
- Database operations with new tables
- RPC performance with expanded data
- Memory extraction pipeline
- Context builder with all data sources

### 3. End-to-End Tests
- Complete conversation with memory extraction
- Multi-session memory persistence
- Context retrieval and compression

### 4. Performance Tests
- Context retrieval latency
- Memory extraction speed
- Database query optimization

## Unit Test Specifications

### 1. Memory Fact Extraction Tests

#### Test: `test_extract_preference_facts`
```typescript
describe('MemoryExtractor', () => {
  it('should extract preference facts from conversation', async () => {
    // Given
    const messages = [
      { role: 'user', content: 'I prefer morning workouts' },
      { role: 'assistant', content: 'Great! Morning workouts noted.' },
      { role: 'user', content: 'I hate running but love cycling' }
    ];

    // When
    const facts = await memoryExtractor.extractFactsFromConversation(messages, userId);

    // Then
    expect(facts).toContainEqual({
      type: 'preference',
      content: 'Prefers morning workouts',
      confidence: 0.9,
      metadata: { time_of_day: 'morning', activity: 'workout' }
    });
    expect(facts).toContainEqual({
      type: 'preference',
      content: 'Dislikes running, prefers cycling',
      confidence: 0.95,
      metadata: { dislike: 'running', preference: 'cycling' }
    });
  });
});
```

#### Test: `test_extract_goal_facts`
```typescript
it('should extract goal facts from conversation', async () => {
  // Given
  const messages = [
    { role: 'user', content: 'I want to bench press 225 lbs by December' },
    { role: 'user', content: 'My goal is to run a marathon next year' }
  ];

  // When
  const facts = await memoryExtractor.extractFactsFromConversation(messages, userId);

  // Then
  expect(facts).toContainEqual({
    type: 'goal',
    content: 'Bench press 225 lbs by December',
    confidence: 0.95,
    metadata: { exercise: 'bench_press', target: 225, unit: 'lbs', deadline: 'December' }
  });
});
```

#### Test: `test_extract_constraint_facts`
```typescript
it('should extract constraint facts (injuries, limitations)', async () => {
  // Given
  const messages = [
    { role: 'user', content: 'I have a bad knee so I avoid jumping exercises' },
    { role: 'user', content: "I'm allergic to peanuts" }
  ];

  // When
  const facts = await memoryExtractor.extractFactsFromConversation(messages, userId);

  // Then
  expect(facts).toContainEqual({
    type: 'constraint',
    content: 'Knee injury - avoid jumping exercises',
    confidence: 0.9,
    metadata: { body_part: 'knee', avoid: ['jumping'] }
  });
  expect(facts).toContainEqual({
    type: 'constraint',
    content: 'Allergic to peanuts',
    confidence: 1.0,
    metadata: { type: 'allergy', allergen: 'peanuts' }
  });
});
```

#### Test: `test_fact_confidence_scoring`
```typescript
it('should assign appropriate confidence scores', async () => {
  // Given
  const messages = [
    { role: 'user', content: 'I think I prefer morning workouts' }, // Uncertain
    { role: 'user', content: 'I absolutely hate burpees' }, // Certain
    { role: 'user', content: 'I might be able to workout 4 times a week' } // Uncertain
  ];

  // When
  const facts = await memoryExtractor.extractFactsFromConversation(messages, userId);

  // Then
  const morningPref = facts.find(f => f.content.includes('morning'));
  const burpeeHate = facts.find(f => f.content.includes('burpees'));
  const frequency = facts.find(f => f.content.includes('4 times'));

  expect(morningPref.confidence).toBeLessThan(0.7); // Low confidence
  expect(burpeeHate.confidence).toBeGreaterThan(0.9); // High confidence
  expect(frequency.confidence).toBeLessThan(0.6); // Very uncertain
});
```

### 2. Conversation Summarization Tests

#### Test: `test_conversation_summary_generation`
```typescript
describe('ConversationSummarizer', () => {
  it('should generate accurate conversation summary', async () => {
    // Given
    const conversation = {
      messages: [
        { role: 'user', content: 'Can you help me create a workout plan?' },
        { role: 'assistant', content: 'Of course! What are your goals?' },
        { role: 'user', content: 'I want to build muscle and lose fat' },
        { role: 'assistant', content: 'I recommend a 4-day split...' },
        { role: 'user', content: 'Sounds good, I\'ll start Monday' }
      ]
    };

    // When
    const summary = await summarizer.summarizeConversation(conversation);

    // Then
    expect(summary).toMatchObject({
      summary: expect.stringContaining('workout plan'),
      keyTopics: expect.arrayContaining(['workout_planning', 'muscle_building', 'fat_loss']),
      actionItems: expect.arrayContaining(['Start workout plan on Monday']),
      sentiment: 'positive'
    });
  });
});
```

#### Test: `test_extract_action_items`
```typescript
it('should extract action items from conversation', async () => {
  // Given
  const messages = [
    { role: 'user', content: "I'll increase my protein to 150g per day" },
    { role: 'user', content: "I'll try the workout you suggested tomorrow" },
    { role: 'user', content: "I need to buy resistance bands" }
  ];

  // When
  const summary = await summarizer.summarizeConversation({ messages });

  // Then
  expect(summary.actionItems).toEqual([
    'Increase protein intake to 150g per day',
    'Try suggested workout tomorrow',
    'Buy resistance bands'
  ]);
});
```

### 3. Enhanced Context Building Tests

#### Test: `test_build_enhanced_context`
```typescript
describe('EnhancedContextBuilder', () => {
  it('should build complete enhanced context', async () => {
    // Given
    const userId = 'test-user-123';
    mockDatabase.setupTestData(userId);

    // When
    const context = await contextBuilder.buildContext(userId);

    // Then
    expect(context).toHaveProperty('profile');
    expect(context).toHaveProperty('recentWorkouts');
    expect(context.recentWorkouts).toHaveLength(50); // Increased limit
    expect(context).toHaveProperty('recentMeals');
    expect(context.recentMeals.length).toBeGreaterThan(50); // More meals
    expect(context).toHaveProperty('workoutPatterns');
    expect(context).toHaveProperty('nutritionPatterns');
    expect(context).toHaveProperty('memoryFacts');
    expect(context).toHaveProperty('conversationSummaries');
    expect(context).toHaveProperty('preferenceProfile');
    expect(context).toHaveProperty('longTermTrends');
  });
});
```

#### Test: `test_context_parallel_fetching`
```typescript
it('should fetch all context data in parallel', async () => {
  // Given
  const userId = 'test-user-123';
  const fetchSpy = jest.spyOn(contextBuilder, 'parallelFetch');

  // When
  const startTime = Date.now();
  await contextBuilder.buildContext(userId);
  const duration = Date.now() - startTime;

  // Then
  expect(fetchSpy).toHaveBeenCalledTimes(1);
  expect(duration).toBeLessThan(200); // Should be fast due to parallel fetching
});
```

### 4. Context Compression Tests

#### Test: `test_compress_context_under_token_limit`
```typescript
describe('ContextCompressor', () => {
  it('should compress context to stay under token limit', async () => {
    // Given
    const largeContext = {
      recentWorkouts: generateWorkouts(100),
      recentMeals: generateMeals(200),
      recentActivities: generateActivities(150),
      memoryFacts: generateFacts(50)
    };

    // When
    const compressed = await compressor.compressContext(largeContext);
    const tokenCount = countTokens(compressed);

    // Then
    expect(tokenCount).toBeLessThanOrEqual(4000);
    expect(compressed).toHaveProperty('workoutSummary');
    expect(compressed).toHaveProperty('nutritionSummary');
    expect(compressed.recentWorkouts).toHaveLength(10); // Only most recent
  });
});
```

#### Test: `test_prioritize_relevant_information`
```typescript
it('should prioritize relevant information during compression', async () => {
  // Given
  const context = {
    profile: { name: 'Test User' },
    goals: [
      { id: '1', isActive: true, name: 'Lose weight' },
      { id: '2', isActive: false, name: 'Old goal' }
    ],
    recentWorkouts: generateWorkouts(50),
    todaysMeals: generateMeals(5),
    yesterdaysMeals: generateMeals(10),
    memoryFacts: [
      { content: 'Prefers morning workouts', confidence: 0.9 },
      { content: 'Maybe likes swimming', confidence: 0.3 }
    ]
  };

  // When
  const compressed = await compressor.compressContext(context);

  // Then
  expect(compressed.currentGoals).toHaveLength(1); // Only active goals
  expect(compressed.currentGoals[0].name).toBe('Lose weight');
  expect(compressed.todaysMeals).toHaveLength(5); // All today's meals
  expect(compressed.relevantFacts).toContainEqual(
    expect.objectContaining({ confidence: 0.9 })
  );
  expect(compressed.relevantFacts).not.toContainEqual(
    expect.objectContaining({ confidence: 0.3 })
  );
});
```

### 5. Preference Profile Tests

#### Test: `test_build_preference_profile`
```typescript
describe('PreferenceProfileBuilder', () => {
  it('should aggregate preferences from memory facts', async () => {
    // Given
    const facts = [
      { type: 'preference', content: 'Morning workouts', metadata: { time: 'morning' } },
      { type: 'preference', content: 'Dislikes running', metadata: { activity: 'running' } },
      { type: 'constraint', content: 'No dairy', metadata: { type: 'dietary' } }
    ];

    // When
    const profile = await profileBuilder.buildProfile(facts);

    // Then
    expect(profile).toEqual({
      workoutPreferences: {
        preferredTime: 'morning',
        avoidedActivities: ['running']
      },
      nutritionPreferences: {
        dietaryRestrictions: ['no dairy']
      },
      constraints: {
        dietary: ['no dairy']
      }
    });
  });
});
```

## Integration Test Specifications

### 1. Database Integration Tests

#### Test: `test_store_and_retrieve_memory_facts`
```typescript
describe('Memory Database Integration', () => {
  it('should store and retrieve memory facts', async () => {
    // Given
    const fact = {
      userId: 'test-user',
      type: 'preference',
      content: 'Prefers morning workouts',
      confidence: 0.9
    };

    // When
    const factId = await db.storeMemoryFact(fact);
    const retrieved = await db.getMemoryFacts('test-user');

    // Then
    expect(retrieved).toContainEqual(
      expect.objectContaining({
        id: factId,
        content: 'Prefers morning workouts'
      })
    );
  });
});
```

#### Test: `test_enhanced_rpc_performance`
```typescript
it('should retrieve enhanced context within 200ms', async () => {
  // Given
  const userId = 'test-user';
  await seedDatabase(userId, {
    workouts: 100,
    meals: 200,
    activities: 150,
    facts: 50
  });

  // When
  const startTime = Date.now();
  const context = await supabase.rpc('get_enhanced_rag_context', { p_user_id: userId });
  const duration = Date.now() - startTime;

  // Then
  expect(duration).toBeLessThan(200);
  expect(context.data.recent_workouts).toHaveLength(50);
  expect(context.data.workout_patterns).toBeDefined();
  expect(context.data.nutrition_patterns).toBeDefined();
});
```

### 2. Memory Extraction Pipeline Tests

#### Test: `test_end_to_end_memory_extraction`
```typescript
it('should extract and store facts from conversation', async () => {
  // Given
  const conversationId = 'conv-123';
  const messages = [
    { role: 'user', content: 'I prefer morning workouts and I\'m vegetarian' }
  ];

  // When
  await memoryPipeline.processConversation(conversationId, messages);

  // Then
  const facts = await db.getMemoryFacts(userId);
  expect(facts).toHaveLength(2);
  expect(facts).toContainEqual(
    expect.objectContaining({ content: expect.stringContaining('morning') })
  );
  expect(facts).toContainEqual(
    expect.objectContaining({ content: expect.stringContaining('vegetarian') })
  );
});
```

## Performance Test Specifications

### Test: `test_context_retrieval_latency`
```typescript
describe('Performance Tests', () => {
  it('should maintain sub-200ms context retrieval', async () => {
    // Given
    const users = generateTestUsers(100);
    const latencies = [];

    // When
    for (const user of users) {
      const start = Date.now();
      await contextBuilder.buildContext(user.id);
      latencies.push(Date.now() - start);
    }

    // Then
    const p95 = percentile(latencies, 95);
    expect(p95).toBeLessThan(200);
  });
});
```

### Test: `test_memory_extraction_performance`
```typescript
it('should extract facts within 500ms', async () => {
  // Given
  const longConversation = generateMessages(50);

  // When
  const start = Date.now();
  await memoryExtractor.extractFactsFromConversation(longConversation, userId);
  const duration = Date.now() - start;

  // Then
  expect(duration).toBeLessThan(500);
});
```

## End-to-End Test Specifications

### Test: `test_multi_session_memory_persistence`
```typescript
describe('E2E Memory Tests', () => {
  it('should remember facts across multiple sessions', async () => {
    // Session 1
    const session1 = await createCoachingSession(userId);
    await session1.sendMessage('I prefer morning workouts');
    await session1.end();

    // Session 2 (different day)
    const session2 = await createCoachingSession(userId);
    const context = await session2.getContext();

    // Then
    expect(context.memoryFacts).toContainEqual(
      expect.objectContaining({ content: expect.stringContaining('morning') })
    );
  });
});
```

### Test: `test_preference_learning_over_time`
```typescript
it('should learn and refine preferences over time', async () => {
  // Given - Multiple sessions with consistent preferences
  await simulateSession(userId, ['I worked out at 6 AM today']);
  await simulateSession(userId, ['Another 6 AM workout done!']);
  await simulateSession(userId, ['Love these early morning sessions']);

  // When
  const profile = await getPreferenceProfile(userId);

  // Then
  expect(profile.workoutPreferences.preferredTime).toBe('early_morning');
  expect(profile.workoutPreferences.timeConfidence).toBeGreaterThan(0.8);
});
```

## Error Handling Tests

### Test: `test_graceful_fallback_on_memory_failure`
```typescript
it('should fall back to basic context if memory system fails', async () => {
  // Given
  jest.spyOn(memoryService, 'getMemoryFacts').mockRejectedValue(new Error('DB Error'));

  // When
  const context = await contextBuilder.buildContext(userId);

  // Then
  expect(context).toHaveProperty('profile');
  expect(context).toHaveProperty('recentWorkouts');
  expect(context.memoryFacts).toEqual([]); // Empty but not failing
  expect(context.conversationSummaries).toEqual([]);
});
```

### Test: `test_handle_malformed_facts`
```typescript
it('should handle malformed fact extraction gracefully', async () => {
  // Given
  const messages = [
    { role: 'user', content: '```python\ncode example\n```' }, // Non-conversational content
    { role: 'user', content: '🏋️‍♂️💪🔥' } // Only emojis
  ];

  // When
  const facts = await memoryExtractor.extractFactsFromConversation(messages, userId);

  // Then
  expect(facts).toEqual([]); // No facts extracted, no errors
});
```

## Test Data Fixtures

```typescript
// test/fixtures/memory-fixtures.ts

export const sampleMemoryFacts = [
  {
    type: 'preference',
    content: 'Prefers morning workouts between 6-8 AM',
    confidence: 0.9,
    metadata: { time_range: '6-8', period: 'morning' }
  },
  {
    type: 'constraint',
    content: 'Lower back injury - avoid deadlifts',
    confidence: 0.95,
    metadata: { injury: 'lower_back', avoid: ['deadlifts'] }
  },
  {
    type: 'goal',
    content: 'Lose 10 pounds by summer',
    confidence: 0.85,
    metadata: { amount: 10, unit: 'pounds', deadline: 'summer' }
  }
];

export const sampleConversation = {
  messages: [
    { role: 'user', content: 'I want to get stronger' },
    { role: 'assistant', content: 'What are your strength goals?' },
    { role: 'user', content: 'Bench 225, squat 315, deadlift 405' }
  ]
};
```

## Coverage Requirements

### Unit Tests
- Memory extraction logic: 100%
- Conversation summarization: 95%
- Context compression: 90%
- Preference aggregation: 90%

### Integration Tests
- Database operations: 85%
- RPC calls: 85%
- API endpoints: 90%

### E2E Tests
- Critical user flows: 80%
- Memory persistence: 85%

### Overall Coverage Target: ≥80%

## Test Execution Plan

```json
{
  "scripts": {
    "test:memory": "jest --testPathPattern=memory",
    "test:memory:unit": "jest --testPathPattern=memory.*\\.unit\\.test",
    "test:memory:integration": "jest --testPathPattern=memory.*\\.integration\\.test",
    "test:memory:e2e": "jest --testPathPattern=memory.*\\.e2e\\.test",
    "test:memory:coverage": "jest --testPathPattern=memory --coverage"
  }
}
```

## Performance Benchmarks

| Operation | Target | Acceptable | Maximum |
|-----------|--------|------------|---------|
| Context Retrieval | < 100ms | < 150ms | 200ms |
| Memory Extraction | < 300ms | < 400ms | 500ms |
| Conversation Summary | < 500ms | < 750ms | 1000ms |
| Context Compression | < 50ms | < 75ms | 100ms |
| Preference Building | < 100ms | < 150ms | 200ms |

## Success Criteria

1. All unit tests pass with >90% coverage
2. Integration tests complete in <5 seconds total
3. E2E tests demonstrate memory persistence
4. Performance benchmarks met for P95 latency
5. No regression in existing coach functionality