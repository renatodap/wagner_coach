# Wagner Coach - Complete User Flow Analysis

## Current Architecture Overview

### Database Structure
```
workouts (pre-populated catalog)
├── workout_exercises (exercise linkage)
├── exercises (exercise library)
├── user_workouts (scheduled instances)
├── active_workout_sessions (live tracking)
├── set_performances (individual set data)
├── workout_completions (finished workouts)
└── favorite_workouts (user preferences)
```

### Page Structure
```
/dashboard - Workout selection & quick start
/workout - Browse & filter all workouts
/workout/active/[sessionId] - Active workout tracking
/progress - History, stats, edit/delete
```

## 🎯 PRIMARY USER FLOWS

### FLOW 1: Starting a Workout

```mermaid
User Journey:
Dashboard → Select Workout → View Details → Start → Active Session
```

**Detailed Steps:**
1. **Dashboard Load** (`/dashboard`)
   - Fetches workouts with exercises only
   - Shows favorites at top
   - Displays duration, difficulty, type

2. **Workout Selection**
   - Click workout card
   - Modal opens showing:
     - Exercise list with sets × reps
     - Total duration estimate
     - Muscle groups targeted

3. **Start Decision Point**
   - "START WORKOUT" → Creates session
   - "CANCEL" → Returns to list
   - Click outside → Closes modal

4. **Session Creation**
   - `start_workout_session()` RPC called
   - Creates `active_workout_sessions` record
   - Redirects to `/workout/active/[sessionId]`

### FLOW 2: Active Workout Session

```mermaid
Exercise Flow:
Current Exercise → Complete Set → Rest Timer → Next Set/Exercise → Finish
```

**Core Interface Layout:**
```
[Header - Always Visible]
├── Workout Name
├── Timer (auto-running)
├── [Pause/Play] [FINISH] [Cancel X]

[Main Content - 2 Column]
├── [Left: Exercise List]
│   ├── Completed (green/faded)
│   ├── Current (orange highlight)
│   └── Upcoming (gray/low opacity)
│
└── [Right: Active Exercise]
    ├── Exercise Name
    ├── Set X of Y
    ├── Weight Input (optional)
    ├── Reps Input
    └── [COMPLETE SET] button
```

**Sub-Flow A: Completing Sets Normally**
1. User sees current exercise highlighted
2. Enters weight (optional) and reps
3. Clicks "COMPLETE SET"
4. Rest timer starts (e.g., 90 seconds)
5. During rest:
   - Can click "START NEXT SET" to skip timer
   - Can click "SKIP TO NEXT EXERCISE"
6. After rest, ready for next set
7. After final set, auto-advances to next exercise

**Sub-Flow B: Skipping Sets**
1. At any point, click "Skip remaining sets →"
2. Moves immediately to next exercise
3. Skipped sets are not recorded

**Sub-Flow C: Direct Navigation**
1. Click ANY exercise in left sidebar
2. Immediately jumps to that exercise
3. Current progress saved
4. Can jump backward or forward

**Sub-Flow D: Weight Tracking Options**
- **Weighted exercises** (barbell, dumbbell):
  - Weight input shown by default
  - Can leave blank if not tracking
- **Bodyweight exercises**:
  - No weight input initially
  - Link "Add weight tracking" if using weight vest/belt
  - Once clicked, weight input appears

### FLOW 3: Pausing/Resuming

**Pause States:**
1. Click Pause button (header)
2. Timer stops, status = 'paused'
3. All inputs remain available
4. Click Play to resume
5. Timer continues from pause point

**Data Tracked:**
- Total pause duration
- Pause/resume timestamps
- Excluded from workout duration

### FLOW 4: Finishing Workout

**Completion Path:**
1. Click "FINISH" button (always visible in header)
2. `complete_workout_session()` executes:
   - Updates session status → 'completed'
   - Creates `workout_completions` record
   - Calculates total duration
   - Saves all set performances
3. Redirects to `/progress`
4. Workout immediately visible in history

**Cancellation Path:**
1. Click X button (header)
2. Confirmation: "Cancel workout? Progress will be lost."
3. If confirmed:
   - Session status → 'cancelled'
   - No completion record created
   - Returns to `/dashboard`

### FLOW 5: Managing Workout History

**View History** (`/progress`)
```
[Workout Card]
├── Workout Name & Type
├── Date Completed
├── Duration (editable)
├── Sets Performed
├── Total Weight Lifted
├── Rating Stars (editable)
├── Notes (editable)
├── [Edit Icon] [Delete Icon]
```

**Edit Flow:**
1. Click Edit icon (pencil)
2. Card transforms to edit mode:
   - Duration input field
   - Rating selector (1-5)
   - Notes textarea
3. Click "SAVE" → Updates via `edit_workout_completion()`
4. Click "CANCEL" → Reverts changes

**Delete Flow:**
1. Click Delete icon (trash)
2. Confirmation: "Delete [Workout Name] from [Date]?"
3. If confirmed → `delete_workout_history()`
4. Card disappears from list
5. Stats update immediately

## 🔄 EDGE CASES & SPECIAL FLOWS

### Quick Add (Manual Entry)
**Use Case**: User did workout without app
1. Go to `/progress`
2. Click "Add Manual Workout" (future feature)
3. Select workout, date, duration
4. Save directly to completions

### Resuming Interrupted Session
**Use Case**: App closed during workout
1. On dashboard, show "Resume Workout" if active session exists
2. Click to return to `/workout/active/[sessionId]`
3. Continue from last completed set

### Favorite Workouts
1. Star icon on workout cards
2. Toggle adds/removes from favorites
3. Favorites appear first in lists
4. Persists across sessions

## 📊 DATA FLOW ARCHITECTURE

### Write Operations
```
User Action → Client Component → Supabase RPC → Database
                                      ↓
                               SQL Functions:
                               - start_workout_session()
                               - log_set_performance()
                               - complete_workout_session()
                               - toggle_favorite_workout()
                               - edit_workout_completion()
                               - delete_workout_history()
```

### Read Operations
```
Page Load → Server Component → Supabase Query → Database
                                     ↓
                              SQL Functions/Views:
                              - get_dashboard_workouts()
                              - get_session_exercises()
                              - get_user_workout_history()
                              - workouts_with_exercises (view)
```

## 🎮 INTERACTION PATTERNS

### Progressive Disclosure
1. **Minimal by default**: Only essential controls shown
2. **Weight tracking**: Hidden for bodyweight, optional reveal
3. **Exercise details**: Collapsed until current
4. **Completed sets**: Summary shown after completion

### Visual Feedback
- **Current**: Orange border + background tint
- **Completed**: Green + checkmark + 75% opacity
- **Upcoming**: Gray + 50% opacity
- **Interactive**: Hover states on all buttons
- **Loading**: Skeleton states during fetches

### Error Prevention
- **Confirmation dialogs** for destructive actions
- **Auto-save** on every set completion
- **Validation** before workout finish
- **Warning** on navigation away during session

## 🚀 OPTIMIZATIONS

### Performance
- **Server Components** for initial data fetch
- **Client Components** only for interactivity
- **Optimistic Updates** for instant feedback
- **Debounced Saves** for edit operations

### User Experience
- **Sticky Header** - Controls always accessible
- **Auto-advance** - Reduces clicks
- **Smart Defaults** - Previous weight as placeholder
- **Keyboard Support** - Tab through inputs
- **Mobile Optimized** - Touch-friendly targets

## 📱 RESPONSIVE BEHAVIOR

### Mobile (< 768px)
- Single column layout
- Exercise list as collapsible drawer
- Larger touch targets (min 44px)
- Swipe gestures for navigation

### Desktop (≥ 768px)
- Two column layout
- Exercise list always visible
- Hover states enabled
- Keyboard shortcuts active

## 🔑 KEY DESIGN DECISIONS

1. **No Modal for Active Workout**
   - Full page for focus
   - Prevents accidental dismissal
   - Better mobile experience

2. **Rest Timer Auto-Start**
   - Reduces cognitive load
   - Maintains workout rhythm
   - Can be skipped if needed

3. **Weight Optional Always**
   - Accommodates all users
   - Progressive tracking
   - No barriers to completion

4. **Immediate Progress Visibility**
   - Completed sets shown inline
   - Running totals displayed
   - Motivational feedback

5. **Multi-Path Navigation**
   - Linear progression (default)
   - Skip options (flexibility)
   - Direct jump (power users)

## 🎯 SUCCESS METRICS

- **Completion Rate**: % of started workouts finished
- **Average Duration**: Time from start to finish
- **Set Completion**: % of planned sets completed
- **Feature Usage**: Weight tracking adoption
- **User Retention**: Return rate after first workout