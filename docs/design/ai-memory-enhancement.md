# AI Coach Memory Enhancement Design Document

## Overview
Enhance the AI coach's ability to remember and utilize user-specific information by expanding context retrieval, adding conversation memory, and implementing user preference extraction.

## Goals
1. Increase historical data included in AI context (workouts, meals, activities)
2. Add conversation memory system to track important facts across sessions
3. Implement user preference extraction from conversations
4. Create memory summarization for efficient context usage
5. Maintain sub-200ms latency for context retrieval

## Current State Analysis

### Existing System
- **RPC**: `get_rag_context_for_user()` - Single optimized query
- **Data Retrieved**: Last 10 workouts, 7 days meals, 30 days activities
- **Context Size**: ~2000 tokens average
- **Performance**: ~50ms average query time

### Limitations
- Limited historical data (missing patterns over time)
- No persistent memory of conversation insights
- No extracted preferences or learned facts
- Context window filling with redundant data

## Proposed Enhancements

### 1. Expanded Context Retrieval

#### Database Changes
```sql
-- Modify existing RPC: get_rag_context_for_user
-- Increase limits and add summarization

recent_workouts := (
  SELECT * FROM workout_completions
  WHERE user_id = p_user_id
  ORDER BY completed_at DESC
  LIMIT 50  -- Increased from 10
);

recent_meals := (
  SELECT * FROM meals
  WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '14 days'  -- Increased from 7 days
  ORDER BY logged_at DESC
  LIMIT 100  -- Increased from 50
);

recent_activities := (
  SELECT * FROM activities
  WHERE user_id = p_user_id
    AND start_date > NOW() - INTERVAL '60 days'  -- Increased from 30 days
  ORDER BY start_date DESC
  LIMIT 100  -- Increased from 50
);

-- New: Workout patterns summary
workout_patterns := (
  SELECT
    EXTRACT(DOW FROM completed_at) as day_of_week,
    EXTRACT(HOUR FROM completed_at) as hour_of_day,
    COUNT(*) as frequency,
    AVG(duration_minutes) as avg_duration,
    ARRAY_AGG(DISTINCT workout_type) as workout_types
  FROM workout_completions
  WHERE user_id = p_user_id
    AND completed_at > NOW() - INTERVAL '90 days'
  GROUP BY day_of_week, hour_of_day
  ORDER BY frequency DESC
  LIMIT 10
);

-- New: Nutrition patterns
nutrition_patterns := (
  SELECT
    meal_type,
    AVG(calories) as avg_calories,
    AVG(protein_g) as avg_protein,
    AVG(carbs_g) as avg_carbs,
    AVG(fat_g) as avg_fat,
    COUNT(*) as meal_count,
    ARRAY_AGG(DISTINCT
      CASE WHEN logged_at::time < '12:00' THEN 'morning'
           WHEN logged_at::time < '17:00' THEN 'afternoon'
           ELSE 'evening' END
    ) as time_preferences
  FROM meals
  WHERE user_id = p_user_id
    AND logged_at > NOW() - INTERVAL '30 days'
  GROUP BY meal_type
);
```

### 2. Conversation Memory System

#### New Database Tables

```sql
-- User memory facts extracted from conversations
CREATE TABLE user_memory_facts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fact_type VARCHAR(50) NOT NULL, -- 'preference', 'goal', 'constraint', 'achievement', 'routine'
  fact_content TEXT NOT NULL,
  confidence FLOAT DEFAULT 0.8, -- How confident we are in this fact
  source VARCHAR(100), -- 'conversation', 'explicit_input', 'inferred'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Some facts may expire
  is_active BOOLEAN DEFAULT true
);

-- Conversation summaries for memory
CREATE TABLE conversation_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  key_topics TEXT[], -- Array of topics discussed
  extracted_facts UUID[], -- References to user_memory_facts
  action_items TEXT[], -- Things user said they'd do
  sentiment VARCHAR(20), -- 'positive', 'neutral', 'frustrated', 'motivated'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preference profile (aggregated from facts)
CREATE TABLE user_preference_profiles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  workout_preferences JSONB DEFAULT '{}',
  nutrition_preferences JSONB DEFAULT '{}',
  communication_style JSONB DEFAULT '{}',
  constraints JSONB DEFAULT '{}', -- injuries, allergies, equipment
  motivators TEXT[], -- What motivates this user
  coaching_notes TEXT, -- Aggregated coaching insights
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Memory Extraction Pipeline

```typescript
// lib/ai/memory-extractor.ts

interface ExtractedFact {
  type: 'preference' | 'goal' | 'constraint' | 'achievement' | 'routine';
  content: string;
  confidence: number;
  metadata?: Record<string, any>;
}

class MemoryExtractor {
  async extractFactsFromConversation(
    messages: Message[],
    userId: string
  ): Promise<ExtractedFact[]> {
    // Use AI to extract facts
    const prompt = `
      Extract important facts about the user from this conversation.
      Focus on:
      - Preferences (likes/dislikes)
      - Goals and objectives
      - Constraints (injuries, limitations, allergies)
      - Achievements and PRs
      - Routines and habits

      Return as JSON array of facts.
    `;

    const facts = await this.callAI(prompt, messages);
    return this.validateAndStoreFacts(facts, userId);
  }

  async summarizeConversation(
    messages: Message[],
    userId: string
  ): Promise<ConversationSummary> {
    const prompt = `
      Summarize this fitness coaching conversation.
      Include:
      - Main topics discussed
      - Action items the user committed to
      - Overall sentiment/mood
      - Key decisions made
    `;

    return await this.callAI(prompt, messages);
  }
}
```

### 3. Enhanced Context Building

```typescript
// lib/ai/enhanced-context.ts

interface EnhancedUserContext {
  // Existing context
  profile: UserProfile;
  recentWorkouts: WorkoutCompletion[];
  recentMeals: Meal[];
  recentActivities: Activity[];
  goals: Goal[];

  // New enhanced context
  workoutPatterns: WorkoutPattern[];
  nutritionPatterns: NutritionPattern[];
  memoryFacts: MemoryFact[];
  conversationSummaries: ConversationSummary[];
  preferenceProfile: PreferenceProfile;
  longTermTrends: Trends;
}

class EnhancedContextBuilder {
  async buildContext(userId: string): Promise<EnhancedUserContext> {
    // Parallel fetch all context
    const [
      baseContext,
      memoryFacts,
      recentSummaries,
      preferences
    ] = await Promise.all([
      this.getBaseContext(userId),
      this.getMemoryFacts(userId, 20), // Top 20 relevant facts
      this.getRecentConversationSummaries(userId, 5),
      this.getPreferenceProfile(userId)
    ]);

    // Compute trends
    const trends = this.computeLongTermTrends(baseContext);

    return {
      ...baseContext,
      memoryFacts,
      conversationSummaries: recentSummaries,
      preferenceProfile: preferences,
      longTermTrends: trends
    };
  }

  private computeLongTermTrends(context: BaseContext): Trends {
    return {
      workoutFrequencyTrend: this.calculateFrequencyTrend(context.recentWorkouts),
      strengthProgressTrend: this.calculateStrengthTrend(context.recentWorkouts),
      nutritionAdherenceTrend: this.calculateNutritionTrend(context.recentMeals),
      activityConsistency: this.calculateConsistency(context.recentActivities)
    };
  }
}
```

### 4. Smart Context Compression

```typescript
// lib/ai/context-compressor.ts

class ContextCompressor {
  private readonly MAX_TOKENS = 4000;

  async compressContext(
    context: EnhancedUserContext
  ): Promise<CompressedContext> {
    // Prioritize information by relevance and recency
    const prioritized = this.prioritizeContext(context);

    // Summarize older data
    const compressed = {
      ...prioritized,
      workoutSummary: this.summarizeWorkouts(context.recentWorkouts),
      nutritionSummary: this.summarizeNutrition(context.recentMeals),
      activitySummary: this.summarizeActivities(context.recentActivities)
    };

    // Ensure under token limit
    return this.truncateToTokenLimit(compressed, this.MAX_TOKENS);
  }

  private prioritizeContext(context: EnhancedUserContext) {
    // Keep most recent and relevant data
    return {
      profile: context.profile,
      currentGoals: context.goals.filter(g => g.isActive),
      recentWorkouts: context.recentWorkouts.slice(0, 10),
      todaysMeals: context.recentMeals.filter(isToday),
      relevantFacts: this.selectRelevantFacts(context.memoryFacts),
      keyPreferences: this.extractKeyPreferences(context.preferenceProfile)
    };
  }
}
```

## API Endpoints

### 1. Memory Management Endpoints

```typescript
// app/api/memory/facts/route.ts
POST /api/memory/facts - Store new memory fact
GET /api/memory/facts - Get user's memory facts
PUT /api/memory/facts/:id - Update fact confidence/status
DELETE /api/memory/facts/:id - Remove incorrect fact

// app/api/memory/extract/route.ts
POST /api/memory/extract - Extract facts from conversation

// app/api/memory/summarize/route.ts
POST /api/memory/summarize - Summarize conversation

// app/api/memory/preferences/route.ts
GET /api/memory/preferences - Get preference profile
PUT /api/memory/preferences - Update preferences
```

### 2. Enhanced Context Endpoint

```typescript
// app/api/coach/context/route.ts
GET /api/coach/context - Get enhanced context for AI
```

## Implementation Plan

### Phase 1: Database & RPC Updates (Week 1)
1. Update `get_rag_context_for_user` RPC with increased limits
2. Add pattern summarization queries
3. Create new memory tables
4. Write migration scripts

### Phase 2: Memory System (Week 2)
1. Implement memory fact storage
2. Build conversation summarizer
3. Create fact extractor
4. Add preference profile system

### Phase 3: Context Enhancement (Week 3)
1. Build enhanced context builder
2. Implement context compressor
3. Update AI coach to use new context
4. Add memory management UI

### Phase 4: Testing & Optimization (Week 4)
1. Performance testing
2. Memory accuracy validation
3. Context size optimization
4. User acceptance testing

## Performance Requirements

### Query Performance
- Context retrieval: < 200ms (P95)
- Memory fact extraction: < 500ms
- Conversation summarization: < 1000ms

### Storage Limits
- Max 1000 memory facts per user
- Max 100 conversation summaries
- Automatic cleanup of old/low-confidence facts

### Token Optimization
- Compressed context: < 4000 tokens
- Maintain information density > 0.8
- Prioritize recent and relevant data

## Security & Privacy

### Data Protection
- All memory facts encrypted at rest
- User can view/delete all stored memories
- No PII in conversation summaries
- Automatic expiry of sensitive facts

### Access Control
- Row-level security on all memory tables
- Users can only access own memories
- Admin audit trail for memory access

## Success Metrics

### Quantitative Metrics
- 50% increase in relevant context per conversation
- 30% reduction in repeated questions from AI
- < 200ms context retrieval latency
- 80% user satisfaction with memory accuracy

### Qualitative Metrics
- AI remembers user preferences across sessions
- Reduced user frustration with repetition
- More personalized coaching recommendations
- Better long-term progress tracking

## Rollback Plan

### Feature Flags
```typescript
const FEATURE_FLAGS = {
  USE_ENHANCED_CONTEXT: process.env.USE_ENHANCED_CONTEXT === 'true',
  ENABLE_MEMORY_EXTRACTION: process.env.ENABLE_MEMORY_EXTRACTION === 'true',
  USE_CONTEXT_COMPRESSION: process.env.USE_CONTEXT_COMPRESSION === 'true'
};
```

### Gradual Rollout
1. 10% of users for 1 week
2. Monitor performance and accuracy
3. 50% of users for 1 week
4. Full rollout if metrics are met

### Fallback Strategy
- If enhanced context fails, fall back to original RPC
- If memory extraction fails, continue without memories
- All new features are additive, not replacements

## Future Enhancements

### Short Term (3 months)
- Multi-modal memory (remember workout photos)
- Proactive memory confirmation ("Is it still true that...")
- Memory sharing between coach sessions

### Long Term (6 months)
- Memory embeddings for semantic search
- Automated preference learning from behavior
- Predictive memory (anticipate user needs)
- Memory export/import for data portability