# Apply RAG Context Function Migration

## Problem
The AI coach can't read your `primary_goal` and `about_me` fields because the database function `get_rag_context_for_user()` doesn't exist yet.

## Solution
Apply this migration to create the function that fetches your profile data.

## Steps

### Option 1: Supabase Dashboard (Easiest)
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy the entire content of `supabase/migrations/20240923_create_rag_context_function.sql`
6. Paste and click **Run**

### Option 2: Supabase CLI
```bash
supabase migration up --file supabase/migrations/20240923_create_rag_context_function.sql
```

### Option 3: Direct SQL (if you have psql access)
```bash
psql "your-supabase-connection-string" < supabase/migrations/20240923_create_rag_context_function.sql
```

## Verification

After applying, test in SQL Editor:

```sql
-- Replace with your actual user ID
SELECT * FROM get_rag_context_for_user('your-user-id-here'::uuid);
```

You should see:
- `profile_data` with your `primary_goal` and `about_me`
- `recent_workouts`
- `recent_meals`
- `strava_activities` (your 30 synced activities)
- `user_goals`

## What This Fixes

**Before:**
> "It looks like your primary goal hasn't been specified in your profile."

**After:**
> "You're training for a half marathon and want to get really fucking fit. Looking at your 30 Strava activities..."

## Why This Happened

The codebase expects this RPC function but it was never migrated to the database. The function queries your user profile and returns:
- `primary_goal`: "get really fucking fit"
- `about_me`: "i'm training for a half marathon"
- All your Strava activities
- Recent workouts and meals

Once applied, the AI will immediately see all your data and provide proper coaching.