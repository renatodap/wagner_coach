# How to Apply Migration: 20251008_auto_create_profiles.sql

This migration fixes the broken user signup by auto-creating profile rows when users sign up.

## What This Migration Does:
1. ✅ Creates `handle_new_user()` trigger function to auto-insert profiles
2. ✅ Adds trigger on `auth.users` to run function on INSERT
3. ✅ Adds RLS policies for INSERT, SELECT, UPDATE on profiles table
4. ✅ Backfills profiles for any existing users without one
5. ✅ Adds `updated_at` trigger for profiles table

## Option 1: Apply via Supabase CLI (Recommended)

```bash
# Navigate to frontend directory
cd wagner-coach-clean

# Apply migration
npx supabase db push

# OR if you have Supabase CLI installed globally:
supabase db push
```

## Option 2: Apply via Supabase Dashboard (Manual)

1. Go to https://app.supabase.com
2. Select your Wagner Coach project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `20251008_auto_create_profiles.sql`
6. Paste into the SQL editor
7. Click **Run** (or press Ctrl+Enter)
8. Verify success - you should see "Success. No rows returned"

## Option 3: Apply via psql (Direct Database Connection)

```bash
# Get your database connection string from Supabase dashboard
# Settings > Database > Connection string (direct)

psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-DB-HOST]:5432/postgres" \
  -f supabase/migrations/20251008_auto_create_profiles.sql
```

## Verification Steps

After applying the migration, verify it worked:

### 1. Check if trigger exists:
```sql
SELECT
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

Expected: 1 row showing the trigger on `auth.users`

### 2. Check if RLS policies exist:
```sql
SELECT
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'profiles';
```

Expected: 3 rows for INSERT, SELECT, UPDATE policies

### 3. Test signup flow:
- Go to your app's signup page
- Create a new test user
- After signup, check that a profile was created:

```sql
SELECT * FROM profiles WHERE id = '[NEW-USER-ID]';
```

Expected: 1 row with the new user's profile

## Rollback (if needed)

If something goes wrong, rollback by running:

```sql
-- Drop trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop policies (optional - only if you want to remove them)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
```

## After Migration

Once successfully applied:
1. ✅ New users will automatically get a profile created when they sign up
2. ✅ Existing users now have profiles (backfilled)
3. ✅ Frontend uses UPSERT (defensive - works either way)
4. ✅ User signup flow should work end-to-end

## Troubleshooting

**Error: "relation 'profiles' already exists"**
- This is OK! The migration uses `CREATE TABLE IF NOT EXISTS`
- The migration will still apply the trigger and RLS policies

**Error: "permission denied for table auth.users"**
- Make sure you're using the Supabase service role key, not the anon key
- Or apply via Supabase Dashboard SQL Editor (recommended)

**Signup still fails**
- Check browser console for errors
- Check Supabase logs in the dashboard
- Verify the trigger exists (see Verification Steps above)
- Check RLS policies are active

## Questions?

If you have issues:
1. Check Supabase logs in dashboard
2. Verify trigger and policies exist (SQL queries above)
3. Test with a new user signup
4. Check browser console for errors
