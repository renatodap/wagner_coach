# Workout Tracking Enhancement Plan

## Current State Analysis

### Existing Features:
- ✅ Basic workout logging (sets, reps, weight)
- ✅ Exercise library with 50+ exercises
- ✅ Workout completion tracking
- ✅ Simple progress view

### Missing Critical Features:

## 1. Personal Records (PRs) Tracking
**Priority: HIGH**
- Track max weight for each exercise
- Track max reps at specific weights
- Show PR badges when beaten
- PR history and progression

## 2. Rest Timer with Alerts
**Priority: HIGH**
- Configurable rest periods per exercise
- Audio/vibration alerts when rest is over
- Auto-start after set completion

## 3. Workout Notes & RPE
**Priority: MEDIUM**
- Rate of Perceived Exertion (1-10 scale)
- Notes per exercise
- Overall workout notes
- Mood/energy tracking

## 4. Performance Analytics
**Priority: HIGH**
- Volume tracking (sets × reps × weight)
- Weekly/monthly volume trends
- Muscle group frequency
- Progressive overload tracking

## 5. Exercise History
**Priority: MEDIUM**
- Previous weights/reps for each exercise
- Show last 3 workout performances
- Suggested weights based on history

## 6. Workout Templates
**Priority: LOW**
- Save completed workouts as templates
- Quick-start from previous workouts
- Custom workout creation

## Implementation Plan

### Phase 1: Core Tracking (Week 1)
1. Add PR tracking system
2. Implement rest timer
3. Add workout notes

### Phase 2: Analytics (Week 2)
1. Volume calculations
2. Progress charts
3. Performance trends

### Phase 3: Advanced Features (Week 3)
1. Exercise history view
2. Workout templates
3. Social features (optional)

## Database Schema Updates Needed

```sql
-- Personal Records Table
CREATE TABLE personal_records (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  exercise_id INTEGER REFERENCES exercises(id),
  record_type TEXT CHECK (record_type IN ('max_weight', 'max_reps', 'max_volume')),
  value DECIMAL,
  achieved_date DATE,
  workout_completion_id INTEGER REFERENCES workout_completions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workout Notes Enhancement
ALTER TABLE workout_completions
ADD COLUMN rpe INTEGER CHECK (rpe >= 1 AND rpe <= 10),
ADD COLUMN mood TEXT CHECK (mood IN ('great', 'good', 'okay', 'tired', 'exhausted')),
ADD COLUMN energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5);

-- Exercise Notes
ALTER TABLE exercise_completions
ADD COLUMN rpe INTEGER CHECK (rpe >= 1 AND rpe <= 10),
ADD COLUMN form_quality TEXT CHECK (form_quality IN ('perfect', 'good', 'okay', 'poor'));
```

## New Components Needed

### 1. RestTimer Component
```tsx
// components/workout/RestTimer.tsx
- Countdown timer
- Sound/vibration alerts
- Skip/extend options
```

### 2. PRTracker Component
```tsx
// components/workout/PRTracker.tsx
- Check against previous PRs
- Celebration animation
- PR history modal
```

### 3. WorkoutAnalytics Component
```tsx
// components/analytics/WorkoutAnalytics.tsx
- Volume charts
- Progress graphs
- Muscle group distribution
```

### 4. ExerciseHistory Component
```tsx
// components/workout/ExerciseHistory.tsx
- Last 3 performances
- Weight progression
- Suggested working weight
```