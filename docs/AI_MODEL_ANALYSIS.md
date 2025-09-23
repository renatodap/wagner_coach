# AI Model Analysis for Wagner Coach

## Context Window Comparison (2025)

### Top Models for Large Context:

| Model | Context Window | Cost (per 1M tokens) | Best For |
|-------|---------------|---------------------|----------|
| **Google Gemini 2.0 Flash** | 1M tokens | $0.075 in / $0.30 out | 🏆 Best value for massive context |
| **Claude 3.5 Sonnet** | 200K tokens | $3.00 in / $15.00 out | Best reasoning & quality |
| **GPT-4 Turbo** | 128K tokens | $10.00 in / $30.00 out | Good but expensive |
| **DeepSeek V3** | 64K tokens | $0.27 in / $1.10 out | Great value, good quality |
| **Gemini 1.5 Pro** | 2M tokens | $1.25 in / $5.00 out | Massive context, pricier |

### Recommendation: **Gemini 2.0 Flash** ✅

**Why:**
- 1M token context (can fit MONTHS of data)
- Cheapest per token ($0.075 input)
- Fast responses
- Good reasoning for fitness coaching
- Available via OpenRouter

## Tiered Context Strategy

### ⚡ IMMEDIATE Context (Last 7 Days) - HIGH DETAIL
**Always included, real-time from DB:**
- All activities (workouts, runs, cycling, etc.)
- All meals with full macros
- All conversation exchanges
- Daily metrics (weight, sleep, etc.)
- Performance ratings & notes

**Estimated tokens: ~15-20K**

### 📊 RECENT Context (Last 30 Days) - SUMMARY
**Pre-computed summary, updated daily:**
```json
{
  "period": "last_30_days",
  "workouts": {
    "total": 18,
    "types": {"strength": 12, "cardio": 6},
    "avg_duration": 52,
    "consistency": "85%",
    "top_exercises": ["bench press", "squats", "deadlift"],
    "performance_trend": "improving"
  },
  "nutrition": {
    "avg_daily_calories": 2450,
    "avg_protein": 165,
    "meal_frequency": 3.2,
    "adherence_to_goals": "78%",
    "top_foods": ["chicken", "rice", "eggs"]
  },
  "activities": {
    "total_distance_km": 85,
    "total_time_hours": 24,
    "avg_heart_rate": 142,
    "main_activities": ["running", "cycling"]
  }
}
```
**Estimated tokens: ~2-3K**

### 📈 HISTORICAL Context (Last 365 Days) - HIGH-LEVEL
**Pre-computed quarterly summaries:**
```json
{
  "Q1_2025": {
    "total_workouts": 65,
    "strength_prs": ["bench: 225lbs", "squat: 315lbs"],
    "body_composition": "lost 8lbs fat, gained 3lbs muscle",
    "major_achievements": ["first 5K under 25min", "deadlift PR 405lbs"],
    "injuries_setbacks": ["knee issue Feb, recovered March"]
  },
  "Q4_2024": {...},
  "Q3_2024": {...},
  "Q2_2024": {...}
}
```
**Estimated tokens: ~3-5K**

### 🎯 TOTAL Context Budget
- Immediate (7 days): ~20K tokens
- Recent (30 days): ~3K tokens
- Historical (1 year): ~5K tokens
- User profile & preferences: ~2K tokens
- Conversation history: ~10K tokens
- System prompt: ~1K tokens

**Total: ~41K tokens** (well within Gemini's 1M limit!)

## Architecture Recommendations

### 1. **Tiered Context Table Structure**

```sql
-- Detailed recent data (7 days) - no change needed, query directly

-- 30-day summaries (updated daily via cron)
CREATE TABLE user_context_summaries (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  period_type TEXT, -- 'weekly', 'monthly', 'quarterly'
  period_start DATE,
  period_end DATE,
  workout_summary JSONB,
  nutrition_summary JSONB,
  activity_summary JSONB,
  key_achievements TEXT[],
  challenges_faced TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Long-term milestones (major achievements, injuries, life events)
CREATE TABLE user_milestones (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  milestone_type TEXT, -- 'achievement', 'injury', 'goal_completed'
  title TEXT,
  description TEXT,
  occurred_at DATE,
  impact_level TEXT, -- 'high', 'medium', 'low'
  metadata JSONB
);
```

### 2. **Automatic Summarization Strategy**

#### Daily Cron Job (runs at 3am):
```javascript
// Summarize yesterday's data into rolling 7-day window
// Update 30-day summary if it's been 7+ days
// Compress older detailed data into summaries
```

#### Weekly Cron Job (Sunday night):
```javascript
// Create weekly summary from last 7 days
// Update monthly summary
// Clean up old detailed records (keep summaries only)
```

#### Monthly Cron Job:
```javascript
// Create monthly summary
// Update quarterly summary
// Archive detailed data older than 30 days
```

### 3. **Context Caching Strategy**

#### OpenRouter/Gemini Prompt Caching:
```javascript
// Cache the stable parts (updated once per day):
const cachedContext = {
  userProfile: {...},           // Changes rarely
  historicalSummaries: {...},   // Changes monthly
  recentSummaries: {...},       // Changes daily
  preferences: {...},           // Changes occasionally
  memoryFacts: {...}           // Changes per conversation
};

// Fresh parts (every request):
const liveContext = {
  last7DaysActivities: {...},   // Real-time query
  last7DaysMeals: {...},       // Real-time query
  todaysMetrics: {...},        // Real-time query
  conversationHistory: {...}    // Last 10 messages
};
```

**Cache hit savings:** ~70% of context tokens cached = massive cost reduction!

### 4. **Smart Context Assembly**

```typescript
async function buildTieredContext(userId: string) {
  // Parallel fetch for speed
  const [
    immediate,    // Last 7 days full detail
    recent,       // Last 30 days summary
    historical,   // Last year quarterly summaries
    profile,      // User profile & preferences
    milestones    // Key achievements & injuries
  ] = await Promise.all([
    getImmediateContext(userId, 7),      // Real-time DB query
    getRecentSummary(userId, 30),        // Pre-computed, cached
    getHistoricalSummary(userId, 365),   // Pre-computed, cached
    getUserProfile(userId),               // Cached
    getMilestones(userId)                // Cached
  ]);

  return {
    immediate,    // Full detail, most relevant
    recent,       // Summary, recent patterns
    historical,   // High-level, long-term trends
    profile,      // Identity & preferences
    milestones    // Important events
  };
}
```

## Implementation Plan

### Phase 1: Model Switch (Quick Win)
- [ ] Switch to Gemini 2.0 Flash via OpenRouter
- [ ] Test with current context structure
- [ ] Measure token usage & cost

### Phase 2: Add Summaries (1-2 days)
- [ ] Create summary tables
- [ ] Build weekly/monthly summarization functions
- [ ] Set up daily cron job

### Phase 3: Optimize Caching (1 day)
- [ ] Implement prompt caching with OpenRouter
- [ ] Separate cached vs live context
- [ ] Monitor cache hit rates

### Phase 4: Historical Context (1-2 days)
- [ ] Add quarterly summary generation
- [ ] Create milestone tracking
- [ ] Implement tiered context assembly

## Expected Results

### Before (GPT-4 Turbo):
- Context: ~10K tokens (limited data)
- Cost per request: ~$0.30
- Missing historical patterns
- Can't see full picture

### After (Gemini 2.0 Flash + Tiered Context):
- Context: ~40K tokens (7 days + 30 days + 1 year)
- Cost per request: ~$0.003 (100x cheaper!)
- Full fitness history included
- Cached context saves 70% on tokens
- Can reference specific workouts from months ago

## Preventing Hallucination

### Strategies:
1. **Structured Data Format**: Use JSON summaries (harder to hallucinate)
2. **Explicit Date Ranges**: "Data from Jan 15-21, 2025"
3. **Confidence Scores**: Mark summary vs detailed data
4. **Grounding Instructions**: "ONLY use data provided in context"
5. **Temperature**: Keep at 0.7 (not too creative)
6. **System Prompt**: Explicitly forbid making up data

### Prompt Template:
```
IMPORTANT: You have access to detailed fitness data below.
- Last 7 days: EXACT data (workouts, meals, activities)
- Last 30 days: SUMMARY statistics
- Last year: HIGH-LEVEL quarterly summaries

NEVER invent or assume data not provided.
If you don't have specific information, say "I don't have that data."
Always reference the specific date/period when citing data.
```

## Next Steps

Would you like me to:
1. ✅ Switch to Gemini 2.0 Flash immediately (via OpenRouter)
2. ✅ Create the summary tables and cron jobs
3. ✅ Implement tiered context assembly
4. ✅ Add prompt caching for cost savings

This will give the AI coach a **MUCH** richer understanding of the user's complete fitness journey! 🚀