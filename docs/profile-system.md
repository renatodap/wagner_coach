# Profile Management System

## Overview

The Wagner Coach profile system provides comprehensive user profile management with a modular, maintainable architecture. It displays all onboarding data, allows inline editing via modals, and automatically recalculates macros when physical stats change.

## Architecture

### Backend API (`app/api/v1/users.py`)

**GET `/api/v1/users/me`**
- Returns complete user profile with 40+ fields
- Includes onboarding data, macro targets, consultation status
- Requires authentication via Bearer token

**PATCH `/api/v1/users/me`**
- Updates user profile fields
- Accepts form-encoded data (`application/x-www-form-urlencoded`)
- Arrays (food_allergies, foods_to_avoid) sent as JSON strings
- Automatically recalculates macros if physical stats change
- Returns updated profile with new macro targets

**Array Serialization**:
```typescript
// Frontend sends arrays as JSON strings in form data
const formData = new URLSearchParams()
formData.append('food_allergies', JSON.stringify(['peanuts', 'dairy']))

// Backend parses JSON strings back to arrays
food_allergies: str = None  # Receives JSON string
parsed = json.loads(food_allergies)  # Parse to list
```

**Macro Recalculation**:
Triggered when any of these fields change:
- `age`, `height_cm`, `current_weight_kg`, `goal_weight_kg`
- `primary_goal`, `activity_level`, `experience_level`

Uses Mifflin-St Jeor equation to calculate:
- `estimated_tdee` (Total Daily Energy Expenditure)
- `daily_calorie_goal`
- `daily_protein_goal`, `daily_carbs_goal`, `daily_fat_goal`

### Frontend API Client (`lib/api/profile.ts`)

#### New Functions (Recommended)
```typescript
getFullUserProfile(): Promise<FullUserProfile>
// Fetches complete profile from backend API

updateFullUserProfile(data: UpdateProfileData): Promise<FullUserProfile>
// Updates profile via backend API with automatic macro recalculation
```

#### Legacy Functions (Deprecated)
```typescript
getUserProfile(): Promise<UserProfile>  // Direct Supabase, limited fields
updateUserTimezone(timezone: string): Promise<void>  // Direct Supabase
getAutoLogPreference(): Promise<AutoLogPreference>  // Direct Supabase
updateAutoLogPreference(enabled: boolean): Promise<void>  // Direct Supabase
```

**Migration Path**: Deprecated functions have JSDoc comments explaining how to migrate to new backend API functions.

### Profile Page (`app/profile/page.tsx`)

**Layout**: Accordion-style with 8 collapsible sections
1. Basic Information (name, email, member since)
2. Physical Stats (age, sex, height, weight)
3. Goals & Training (primary goal, experience, activity level)
4. Nutrition Plan (macro targets, TDEE)
5. Dietary Preferences (dietary restrictions, allergies, meals/day)
6. Lifestyle (sleep hours, stress level)
7. Consultation (if completed)
8. Preferences (unit system, timezone)

**Features**:
- Sections 1 & 4 (Basic + Macros) expanded by default
- Edit button on editable sections opens modal
- Optimistic UI updates via callback pattern
- Toast notifications for success/error feedback
- Sign out button at bottom

**State Management**:
```typescript
const [profile, setProfile] = useState<FullUserProfile | null>(null)
const [expandedSections, setExpandedSections] = useState<Set<string>>(
  new Set(['basic', 'macros'])
)
const [showPhysicalModal, setShowPhysicalModal] = useState(false)
// ... 4 more modal states
const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
```

**Callbacks**:
```typescript
const handleUpdateSuccess = (updatedProfile: FullUserProfile) => {
  setProfile(updatedProfile)  // Update local state
  setToast({ message: 'Profile updated successfully!', type: 'success' })
}

const handleUpdateError = (errorMessage: string) => {
  setToast({ message: errorMessage, type: 'error' })
}
```

### Edit Modals (5 Components)

Located in `app/components/profile/`:

1. **EditPhysicalStatsModal.tsx**
   - Age, height, current weight, goal weight
   - Uses `VALIDATION_RULES` from constants

2. **EditGoalsModal.tsx**
   - Primary goal, experience level, activity level, workout frequency
   - Uses `PRIMARY_GOAL_OPTIONS`, `EXPERIENCE_LEVEL_OPTIONS`, `ACTIVITY_LEVEL_OPTIONS`

3. **EditDietaryModal.tsx** (Most Complex)
   - Dietary preference dropdown
   - Dynamic food allergies list (add/remove with buttons)
   - Dynamic foods to avoid list
   - Meals per day, cooks regularly
   - Uses `DIETARY_PREFERENCE_OPTIONS`

4. **EditLifestyleModal.tsx**
   - Sleep hours (number input with validation)
   - Stress level dropdown
   - Uses `STRESS_LEVEL_OPTIONS`

5. **EditPreferencesModal.tsx**
   - Unit system (metric/imperial)
   - Timezone (from common timezones list)
   - Uses `UNIT_SYSTEM_OPTIONS`, `TIMEZONE_OPTIONS`

**Modal Pattern**:
```typescript
interface EditModalProps {
  profile: FullUserProfile
  isOpen: boolean
  onClose: () => void
  onSuccess: (updatedProfile: FullUserProfile) => void
  onError: (error: string) => void
}

// All modals follow this pattern:
// 1. Initialize state from profile props
// 2. Track changes and build updates object
// 3. Only send changed fields to API
// 4. Call onSuccess with updated profile
// 5. Close modal
```

### Shared Components (`app/components/shared/`)

**Toast.tsx**
- Success/error notification
- Auto-dismisses after 5 seconds
- Fixed position top-right
- z-index: 60 (above modals)

### Constants (`lib/constants/profile.ts`)

**Why Constants Matter**:
- Single source of truth for dropdown options
- Easy to add new options without touching multiple files
- Prepares for i18n (values become translation keys)
- Validation rules centralized

**Exports**:
- `PRIMARY_GOAL_OPTIONS`, `EXPERIENCE_LEVEL_OPTIONS`, `ACTIVITY_LEVEL_OPTIONS`
- `DIETARY_PREFERENCE_OPTIONS`, `STRESS_LEVEL_OPTIONS`, `BIOLOGICAL_SEX_OPTIONS`
- `UNIT_SYSTEM_OPTIONS`, `TIMEZONE_OPTIONS`
- `VALIDATION_RULES` (min/max/step for numeric inputs)
- Formatting functions: `formatGoal()`, `formatActivityLevel()`, etc.
- TypeScript types derived from options

**Usage Example**:
```typescript
import { PRIMARY_GOAL_OPTIONS, formatGoal } from '@/lib/constants/profile'

// In component:
<select value={goal} onChange={(e) => setGoal(e.target.value)}>
  {PRIMARY_GOAL_OPTIONS.map((option) => (
    <option key={option.value} value={option.value}>
      {option.label}
    </option>
  ))}
</select>

// Display value:
<p>{formatGoal(profile.primary_goal)}</p>
// "lose_weight" -> "Lose Weight"
```

## Data Flow

### Loading Profile
```
User lands on /profile
  ↓
useEffect calls loadProfile()
  ↓
getFullUserProfile() → GET /api/v1/users/me
  ↓
Backend fetches from Supabase profiles table
  ↓
Returns FullUserProfile with 40+ fields
  ↓
setProfile(data)
  ↓
Page renders with all sections
```

### Updating Profile
```
User clicks Edit button on section
  ↓
Modal opens with current values
  ↓
User changes fields and clicks Save
  ↓
Modal builds updates object (only changed fields)
  ↓
updateFullUserProfile(updates) → PATCH /api/v1/users/me
  ↓
Backend validates and updates Supabase
  ↓
Backend checks if macro recalculation needed
  ↓
If needed: calculates new TDEE, calories, macros
  ↓
Returns updated FullUserProfile
  ↓
Modal calls onSuccess(updatedProfile)
  ↓
Profile page updates state + shows success toast
  ↓
Modal closes
```

## Error Handling

### Backend
```python
# Array parsing with validation
try:
    parsed = json.loads(food_allergies)
    if not isinstance(parsed, list):
        raise ValueError("Must be a list")
except (json.JSONDecodeError, ValueError) as e:
    logger.warning("invalid_format", error=str(e))
    raise HTTPException(
        status_code=400,
        detail="Invalid format. Expected JSON array."
    )
```

### Frontend
```typescript
// Modal error handling
try {
  const updatedProfile = await updateFullUserProfile(updates)
  onSuccess(updatedProfile)
  onClose()
} catch (err) {
  const errorMessage = err instanceof Error
    ? err.message
    : 'Failed to update profile'
  onError(errorMessage)
} finally {
  setIsSubmitting(false)
}
```

## Styling

**Iron Theme**:
- Background: `iron-black` (#0A0A0A)
- Foreground: `iron-white` (#F5F5F5)
- Gray: `iron-gray` (#4A4A4A)
- Accent: `iron-orange` (#FF6B35)

**Glass Morphism**:
- Modals: `bg-iron-dark-gray border border-iron-gray`
- Sections: `border border-iron-gray`
- Buttons: `bg-iron-orange text-iron-black hover:bg-orange-600`

**Responsive Design**:
- Mobile-first with Tailwind breakpoints
- Padding: `px-4 sm:px-6` (16px → 24px on tablet)
- Text sizes: `text-lg sm:text-xl` (18px → 20px on tablet)
- Bottom padding: `pb-24` (space for bottom nav)

## Testing Strategy

### Manual Testing Checklist
- [ ] Profile loads with all sections visible
- [ ] Sections expand/collapse correctly
- [ ] Edit button opens correct modal
- [ ] Modal pre-fills with current values
- [ ] Changes save and update profile display
- [ ] Success toast appears after save
- [ ] Error toast appears on failure
- [ ] Macro recalculation triggers when weight changes
- [ ] Food allergies add/remove works
- [ ] Overlay click closes modal
- [ ] Cancel button closes modal without saving
- [ ] Sign out button works

### Edge Cases
- Empty profile (all fields null)
- Profile with no food allergies/foods_to_avoid
- Consultation not completed (section hidden)
- Invalid age/height/weight values
- Network error during update
- Concurrent updates (multiple modals)

## Future Improvements

### Internationalization (i18n)
1. Create translation files:
```
lib/i18n/
  en.json
  es.json
  fr.json
```

2. Update constants to use translation keys:
```typescript
// Before:
{ value: 'lose_weight', label: 'Lose Weight' }

// After:
{ value: 'lose_weight', label: t('profile.goals.lose_weight') }
```

3. Add language switcher to preferences

### Additional Features
- Profile photo upload
- Progress tracking (weight over time chart)
- Export profile as PDF
- Undo last change
- Change history log
- Email verification status
- Two-factor authentication settings

### Performance Optimizations
- Add SWR for profile caching
- Debounce food allergy search
- Lazy load modals (dynamic imports)
- Skeleton screens during load
- Optimistic UI for all updates

## Troubleshooting

### "Profile not found" error
- Check user is authenticated (Bearer token in localStorage)
- Verify profile exists in Supabase `profiles` table
- Check backend logs for `profile_not_found` event

### Arrays not saving
- Ensure frontend sends `JSON.stringify(array)`
- Verify backend parses with `json.loads()`
- Check Content-Type is `application/x-www-form-urlencoded`

### Macros not recalculating
- Verify at least one macro-affecting field changed
- Check backend logs for `macros_recalculated` event
- Ensure all required fields present (age, sex, height, weight, goal, activity, experience)

### Modal won't close
- Check `onClose` is passed to modal
- Verify overlay click handler works
- Look for JavaScript errors in console

## API Reference

### FullUserProfile Type
```typescript
interface FullUserProfile {
  // Basic (4 fields)
  id: string
  email: string
  full_name?: string
  created_at?: string
  updated_at?: string

  // Onboarding (2 fields)
  onboarding_completed: boolean
  onboarding_completed_at?: string

  // Physical (5 fields)
  age?: number
  biological_sex?: 'male' | 'female'
  height_cm?: number
  current_weight_kg?: number
  goal_weight_kg?: number

  // Goals & Training (4 fields)
  primary_goal?: 'lose_weight' | 'build_muscle' | 'maintain' | 'improve_performance'
  experience_level?: 'beginner' | 'intermediate' | 'advanced'
  activity_level?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active'
  workout_frequency?: number

  // Dietary (5 fields)
  dietary_preference?: 'none' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo'
  food_allergies?: string[]
  foods_to_avoid?: string[]
  meals_per_day?: number
  cooks_regularly?: boolean

  // Lifestyle (2 fields)
  sleep_hours?: number
  stress_level?: 'low' | 'medium' | 'high'

  // Macros (6 fields)
  estimated_tdee?: number
  daily_calorie_goal?: number
  daily_protein_goal?: number
  daily_carbs_goal?: number
  daily_fat_goal?: number
  macros_last_calculated_at?: string

  // Preferences (2 fields)
  unit_system?: 'metric' | 'imperial'
  timezone?: string

  // Consultation (2 fields)
  consultation_completed?: boolean
  consultation_completed_at?: string
}
```

### UpdateProfileData Type
```typescript
interface UpdateProfileData {
  full_name?: string
  age?: number
  height_cm?: number
  current_weight_kg?: number
  goal_weight_kg?: number
  primary_goal?: 'lose_weight' | 'build_muscle' | 'maintain' | 'improve_performance'
  experience_level?: 'beginner' | 'intermediate' | 'advanced'
  activity_level?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active'
  workout_frequency?: number
  dietary_preference?: 'none' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo'
  food_allergies?: string[]
  foods_to_avoid?: string[]
  meals_per_day?: number
  cooks_regularly?: boolean
  sleep_hours?: number
  stress_level?: 'low' | 'medium' | 'high'
  unit_system?: 'metric' | 'imperial'
  timezone?: string
}
```

## File Structure

```
wagner-coach-clean/
├── app/
│   ├── profile/
│   │   └── page.tsx                          # Main profile page
│   └── components/
│       ├── profile/
│       │   ├── EditPhysicalStatsModal.tsx
│       │   ├── EditGoalsModal.tsx
│       │   ├── EditDietaryModal.tsx
│       │   ├── EditLifestyleModal.tsx
│       │   └── EditPreferencesModal.tsx
│       └── shared/
│           └── Toast.tsx                      # Toast notification
├── lib/
│   ├── api/
│   │   └── profile.ts                         # API client functions
│   └── constants/
│       └── profile.ts                         # Dropdown options & validation
├── docs/
│   └── profile-system.md                      # This file
└── backend (ULTIMATE_COACH_BACKEND)/
    └── app/
        └── api/
            └── v1/
                └── users.py                    # Profile API endpoints
```

## Summary

The profile system is:
- **Modular**: Each section has its own edit modal
- **Maintainable**: Constants centralize options and validation
- **User-friendly**: Accordion layout, inline editing, instant feedback
- **Performant**: Only sends changed fields, optimistic UI updates
- **i18n-ready**: Values structured as translation keys
- **Type-safe**: Comprehensive TypeScript interfaces
- **Well-documented**: Deprecation comments guide migration

**Key Design Decisions**:
1. Backend API over direct Supabase for validation and macro recalculation
2. Form-encoded data with JSON arrays for compatibility
3. Accordion layout for better mobile UX
4. Callback pattern for state updates (not prop drilling)
5. Constants file prepares for i18n
6. Toast notifications for user feedback
