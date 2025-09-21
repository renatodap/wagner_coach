# How to Apply the Workout Selection Migration

## Prerequisites
- You need your Supabase project credentials
- npx is already working (verified)

## Step 1: Get Your Supabase Project Credentials

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project (wagner-coach or whatever you named it)
3. Go to **Settings** → **General**
4. Copy your **Reference ID** (it looks like: `abcdefghijklmnop`)
5. Go to **Settings** → **API**
6. Copy your **anon public** key and **service_role** key

## Step 2: Link Your Project

Open PowerShell or Command Prompt and run:

```bash
cd C:\Users\pradord\Documents\Projects\wagner_coach\wagner-coach-clean
npx supabase link --project-ref YOUR_PROJECT_REF
```

Replace `YOUR_PROJECT_REF` with your actual reference ID from step 1.

You'll be prompted to enter your database password. This is the password you set when creating the project.

## Step 3: Push the Migration

Once linked, run:

```bash
npx supabase db push
```

This will apply all migrations in the `supabase/migrations` folder, including our new workout selection migration.

## Step 4: Verify the Migration

Check if the migration was successful:

```bash
npx supabase db migrations list
```

You should see:
- `20250921020733_workout_selection_favorites.sql` marked as applied

## Step 5: Update Your Environment Variables

Update your `.env.local` file with your actual credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Alternative: Manual Application via Dashboard

If the CLI doesn't work, you can apply the migration manually:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New query**
4. Copy the entire contents of `supabase/migrations/20250921020733_workout_selection_favorites.sql`
5. Paste it into the SQL editor
6. Click **Run**

## Troubleshooting

### "Project not linked" error
- Make sure you're in the correct directory
- Run `npx supabase link` again with your project reference

### "Permission denied" error
- Make sure you're using the correct database password
- Check that your user has sufficient permissions

### "Relation already exists" error
- Some tables might already exist
- This is fine - the migration uses `IF NOT EXISTS` clauses

## What This Migration Adds

✅ **New Tables:**
- `favorite_workouts` - Store user's favorite workouts
- `active_workout_sessions` - Track live workout sessions
- `set_performances` - Track performance for each set
- `workout_tags` - Categorize workouts
- `workout_workout_tags` - Link workouts to tags

✅ **New Functions:**
- `toggle_favorite_workout()` - Add/remove favorites
- `start_workout_session()` - Start a new workout
- `toggle_workout_pause()` - Pause/resume workouts
- `search_workouts()` - Search with filters

✅ **New Views:**
- `popular_workouts` - Most completed workouts
- `user_favorite_workouts` - User's favorites
- `user_active_sessions` - Active/paused sessions

✅ **Enhanced Features:**
- Workout descriptions and duration estimates
- Workout ratings and notes
- Pause/resume functionality
- Set-by-set weight tracking

## Next Steps

After the migration is applied:

1. **Test the workout selection page**: Navigate to `/workout` in your app
2. **Try searching and filtering**: Use the search bar and filters
3. **Start a workout**: Click on a workout and press "Start"
4. **Test pause/resume**: Use the pause button during a workout
5. **Check progress page**: See if active workouts appear

## Need Help?

If you encounter any issues:
1. Check the Supabase logs: Dashboard → Logs → Recent logs
2. Verify tables were created: Dashboard → Table Editor
3. Test functions: Dashboard → SQL Editor → Run `SELECT * FROM search_workouts();`