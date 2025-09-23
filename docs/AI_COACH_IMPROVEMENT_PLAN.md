# AI Coach Improvement Plan

## Current Issues (Based on User Interaction)

### Problem 1: Not Using User Profile Data
**User's Data:**
- Primary Goal: "get really fucking fit"
- About Me: "i'm training for a half marathon"
- Age: 22
- Experience: advanced
- Has 30 Strava activities synced

**AI's Response:**
- "Since you haven't specified your primary fitness goals" ❌
- Generic tennis/strength advice
- Doesn't mention half marathon training at all ❌
- Doesn't match user's direct tone ❌

### Problem 2: Missing Context Utilization
The AI should have said:
- "You're training for a half marathon - let's see if your current mix of tennis and strength work supports that goal"
- "With 30 Strava activities, I can see you're active, but are you getting enough running volume for a half?"
- Direct, no-BS tone matching "get really fucking fit"

## All Use Cases for AI Coach

### 1. **Progress Tracking & Assessment**
- "How's my training going?"
- "Am I on track for my goals?"
- "What's my consistency been like?"

**What AI Should Do:**
- Reference specific goals (half marathon, weight loss, etc.)
- Analyze actual activity data (frequency, volume, intensity)
- Compare current vs past performance
- Provide specific metrics (e.g., "You've done 12 runs in the last 4 weeks, averaging 8km each")

### 2. **Workout Planning**
- "What should I do today?"
- "Give me a workout for tomorrow"
- "I have 45 minutes, what should I do?"

**What AI Should Do:**
- Check recent workout history (avoid overtraining same muscle groups)
- Consider user's goals (half marathon = need long runs)
- Account for available time and equipment
- Reference injury constraints
- Follow established patterns (if user prefers morning workouts)

### 3. **Nutrition Guidance**
- "What should I eat today?"
- "Am I eating enough protein?"
- "Meal ideas for post-workout?"

**What AI Should Do:**
- Check today's logged meals and calories
- Reference dietary restrictions and allergies [CRITICAL]
- Calculate macros based on activity level
- Suggest meals aligned with goals (endurance = carbs, strength = protein)
- Account for training load (long run day = more carbs)

### 4. **Recovery & Injury Management**
- "My knee hurts, what should I do?"
- "Should I rest today?"
- "What stretches should I do?"

**What AI Should Do:**
- Reference past injuries from profile
- Check recent training load (high volume = suggest recovery)
- Recommend specific stretches for affected areas
- Adjust workout plans to avoid aggravation
- Track injury mentions across conversations

### 5. **Performance Analysis**
- "Why did my run feel so hard?"
- "How can I improve my tennis serve?"
- "Am I getting stronger?"

**What AI Should Do:**
- Analyze recent performance ratings
- Check for patterns (sleep, nutrition, volume correlation)
- Compare similar activities over time
- Reference strength progression (weights, reps, PRs)
- Look for overtraining indicators

### 6. **Goal Setting & Motivation**
- "Should I sign up for this race?"
- "What should my next goal be?"
- "I'm feeling unmotivated"

**What AI Should Do:**
- Reference current goals and progress
- Analyze readiness (training volume, consistency)
- Acknowledge sentiment from past conversations
- Adjust coaching tone (encouraging vs tough love)
- Celebrate milestones and PRs

### 7. **Form & Technique**
- "How do I fix my running form?"
- "Tips for proper squat technique?"
- "What's the right way to do this exercise?"

**What AI Should Do:**
- Provide evidence-based form cues
- Reference user's experience level (advanced gets nuanced tips)
- Account for injuries (knee issues = emphasize landing softly)
- Suggest progression exercises
- Warning: can't see videos, rely on user descriptions

### 8. **Race/Event Preparation**
- "How should I prep for my half marathon?"
- "What's a good taper strategy?"
- "Race day nutrition tips?"

**What AI Should Do:**
- Calculate weeks until event from goal date
- Analyze current training volume vs race requirements
- Build periodized plan (base → build → peak → taper)
- Reference past similar events
- Account for experience level

## Required Improvements

### 1. **Enhanced Profile Parsing**

**Current Issue:** AI doesn't read `primary_goal` or `about_me` properly

**Fix:**
```typescript
// In enhanced-coaching-prompts.ts
USER PROFILE:
- Name: ${context.profile?.name || context.profile?.full_name || 'User'}
- Primary Goal: ${context.profile?.primary_goal || context.profile?.primaryGoal || 'Not specified'}
- Training For: ${context.profile?.about_me || context.profile?.aboutMe || 'General fitness'}
- Age: ${context.profile?.age || 'Unknown'}
- Experience Level: ${context.profile?.experience || context.profile?.experience_level || 'Unknown'}
```

### 2. **Goal-Specific Context**

**Add section to prompt:**
```typescript
SPECIFIC GOALS & FOCUS:
${context.profile?.primary_goal ? `PRIMARY: ${context.profile.primary_goal}` : ''}
${context.profile?.about_me ? `TRAINING FOR: ${context.profile.about_me}` : ''}
${context.goals?.length ? `ACTIVE GOALS:\n${context.goals.map(g => `- ${g.title}: ${g.current_value || 0}/${g.target_value}`).join('\n')}` : ''}

IMPORTANT: Always reference these goals when providing advice!
```

### 3. **Tone Matching**

**Add to coaching approach:**
```typescript
COMMUNICATION STYLE:
${context.profile?.primary_goal?.includes('fuck') || context.profile?.about_me?.includes('fuck')
  ? '- User prefers DIRECT, NO-BS communication. Be straight up, skip the fluff.'
  : '- Use professional but encouraging tone'}
```

### 4. **Activity-Goal Alignment Analysis**

**New prompt section:**
```typescript
GOAL ALIGNMENT CHECK:
${analyzeGoalAlignment(context)}

function analyzeGoalAlignment(context) {
  const goal = context.profile?.about_me?.toLowerCase() || '';
  const recentActivities = context.recentActivities || [];

  if (goal.includes('marathon') || goal.includes('running')) {
    const runs = recentActivities.filter(a => a.type.includes('Run'));
    const runVolume = runs.reduce((sum, r) => sum + (r.distance || 0), 0);
    return `
- Training for endurance event (marathon/running)
- Recent run volume: ${runVolume.toFixed(1)}km across ${runs.length} runs
- Assessment: ${runs.length >= 3 ? 'Good frequency' : 'Need more running volume'}
    `;
  }

  // Add more goal-specific analysis...
}
```

### 5. **Specific Data References**

**Improve workout summary:**
```typescript
RECENT TRAINING (Last 7 Days):
${context.recentActivities?.slice(0,7).map(a =>
  `- ${new Date(a.start_date).toLocaleDateString()}: ${a.name} (${a.type}) - ${a.distance ? a.distance.toFixed(1) + 'km' : a.moving_time ? Math.round(a.moving_time/60) + 'min' : 'completed'}`
).join('\n')}

Total Volume: ${calculateVolume(context.recentActivities?.slice(0,7))}
```

### 6. **Better Question Understanding**

**For "How's my training going?":**
1. Identify user's main goal
2. Filter activities relevant to that goal
3. Calculate key metrics (volume, frequency, progression)
4. Compare to recommended ranges
5. Give specific, actionable feedback

**Example Response Template:**
```
You're training for a half marathon with the goal to "get really fucking fit" - let's break it down:

RUNNING VOLUME (Last 4 weeks):
- Week 1: 18km across 3 runs
- Week 2: 22km across 4 runs
- Week 3: 15km across 2 runs ⚠️
- Week 4: 20km across 3 runs

ASSESSMENT:
✅ Good: Consistency is decent, averaging 3 runs/week
⚠️ Concern: Week 3 dropped off - watch for consistency gaps
❌ Issue: For half marathon training, you need 4-5 runs/week minimum

CROSS-TRAINING:
- Tennis 2x/week: Great for agility and cardio
- Strength training: Good for injury prevention

RECOMMENDATION:
Add 1-2 more runs per week. Keep tennis and strength but prioritize running volume. Aim for 30-35km/week minimum.
```

### 7. **Memory Integration**

**Use conversation history:**
```typescript
PREVIOUS CONVERSATIONS:
${context.conversationSummaries?.slice(0,3).map(s =>
  `- ${new Date(s.createdAt).toLocaleDateString()}: ${s.summary}
   ${s.actionItems?.length ? `  → Committed to: ${s.actionItems[0]}` : ''}`
).join('\n')}

IMPORTANT: Follow up on previous commitments and track promises!
```

### 8. **Strava Activity Integration**

**Better utilize Strava data:**
```typescript
SYNCED ACTIVITIES (Strava):
- Total activities: ${context.recentActivities?.length || 0}
- Activity types: ${getUniqueTypes(context.recentActivities)}
- Most common: ${getMostCommonActivity(context.recentActivities)}
- Last activity: ${context.recentActivities?.[0]?.name || 'None'} (${context.recentActivities?.[0]?.start_date ? new Date(context.recentActivities[0].start_date).toLocaleDateString() : ''})

${context.recentActivities?.length > 0 ? 'Use this data to provide specific, data-driven coaching!' : 'No activities synced yet - ask user to connect Strava or log workouts'}
```

## Implementation Priority

### Phase 1: Critical Fixes (Now)
1. ✅ Fix profile field parsing (primary_goal, about_me)
2. ✅ Add tone matching logic
3. ✅ Add goal-alignment analysis
4. ✅ Improve activity data presentation

### Phase 2: Enhanced Responses (Next)
1. Add use-case specific prompt templates
2. Implement goal-specific coaching strategies
3. Better conversation memory utilization
4. Add commitment tracking

### Phase 3: Advanced Features (Future)
1. Predictive injury risk analysis
2. Adaptive periodization
3. Sentiment-based motivation adjustment
4. Performance prediction models

## Testing Checklist

After implementing improvements, test:

- [ ] "How's my training going?" → Should reference specific goals
- [ ] "What should I do today?" → Should check recent workouts
- [ ] "Am I eating enough?" → Should reference logged meals
- [ ] "My knee hurts" → Should note injury and adjust
- [ ] "What's my progress?" → Should show specific metrics
- [ ] Tone matches user's style (direct vs formal)
- [ ] References past conversations and commitments
- [ ] Uses Strava activity data specifically
- [ ] Acknowledges allergies/restrictions when suggesting food
- [ ] Connects activities to stated goals

## Expected Outcome

**Before:**
> "Since you haven't specified your primary fitness goals, I'll assess your training based on general fitness principles..."

**After:**
> "You're training for a half marathon and want to get really fucking fit - let's see how you're tracking.
>
> Looking at your last 30 Strava activities:
> - 12 runs, averaging 8.2km each
> - 8 tennis sessions (good cross-training)
> - 10 strength workouts
>
> For half marathon training, you need 4-5 runs/week minimum. You're averaging 3/week - close, but not quite there. Your tennis is great cardio, but it's not specific to your goal.
>
> What you need to do: Add 1-2 more runs this week. One easy 5k and one longer 12k+ run. Keep the strength and tennis, but make running the priority."

## Summary

The AI coach has all the data it needs - it just needs better prompts to:
1. Actually read the user's goals and preferences
2. Analyze activity data in context of those goals
3. Provide specific, actionable feedback
4. Match the user's communication style
5. Remember and reference past conversations

All the infrastructure is in place. Now we just need smarter prompts.