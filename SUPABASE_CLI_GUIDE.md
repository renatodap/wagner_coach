# Supabase CLI Installation & Usage Guide

## 📦 Installation Methods

### Option 1: NPM (Recommended for Windows)
```bash
# Install globally via npm
npm install -g supabase

# Verify installation
supabase --version
```

### Option 2: Scoop (Windows Package Manager)
```powershell
# First install Scoop if you don't have it
irm get.scoop.sh | iex

# Install Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Option 3: Direct Download (Windows)
1. Go to: https://github.com/supabase/cli/releases
2. Download the latest `supabase_windows_amd64.tar.gz`
3. Extract the file
4. Add the extracted folder to your PATH environment variable
5. Restart your terminal

### Option 4: Homebrew (macOS/Linux)
```bash
brew install supabase/tap/supabase
```

## 🚀 Initial Setup

### 1. Login to Supabase
```bash
# Login with your Supabase account
supabase login

# This will open a browser window for authentication
```

### 2. Link Your Project
```bash
# Navigate to your project directory
cd C:\Users\pradord\Documents\Projects\wagner_coach\wagner-coach-clean

# Initialize Supabase in your project
supabase init

# Link to your existing Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Your project ref looks like: abcdefghijklmnop
# Find it in: Dashboard → Settings → General → Reference ID
```

### 3. Pull Remote Database Schema (Optional)
```bash
# Pull the current database schema from your Supabase project
supabase db pull

# This creates migration files in supabase/migrations/
```

## 📝 Running Migrations

### Apply the Workout Tracking Enhancement Migration

1. **Copy the migration file** to your project:
```bash
# Create supabase directory if it doesn't exist
mkdir -p supabase/migrations

# The migration file should be in:
# supabase/migrations/0010_workout_tracking_enhancements.sql
```

2. **Push migrations to your database**:
```bash
# Dry run first (preview changes)
supabase db push --dry-run

# Apply migrations
supabase db push
```

3. **Alternative: Direct SQL execution**:
```bash
# Run a specific SQL file
supabase db execute -f supabase/migrations/0010_workout_tracking_enhancements.sql
```

## 🔧 Common Commands

### Database Management
```bash
# Reset database (WARNING: Deletes all data!)
supabase db reset

# Check migration status
supabase db migrations list

# Create a new migration
supabase db migrations new your_migration_name

# View database diff
supabase db diff
```

### Local Development
```bash
# Start local Supabase instance
supabase start

# Stop local instance
supabase stop

# View local dashboard
supabase status
```

### Type Generation
```bash
# Generate TypeScript types from your database
supabase gen types typescript --local > lib/supabase/database.types.ts

# For production database
supabase gen types typescript --project-id YOUR_PROJECT_REF > lib/supabase/database.types.ts
```

## 🔐 Environment Variables

Create a `.env.local` file in your project root:
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Find these in: Dashboard → Settings → API

## 📊 Applying Your Workout Tracking Migration

### Step-by-Step Process:

1. **Ensure Supabase CLI is installed**:
```bash
supabase --version
# Should output version number
```

2. **Navigate to your project**:
```bash
cd C:\Users\pradord\Documents\Projects\wagner_coach\wagner-coach-clean
```

3. **Initialize Supabase** (if not done):
```bash
supabase init
```

4. **Login to Supabase**:
```bash
supabase login
```

5. **Link your project**:
```bash
# Get your project ref from Supabase Dashboard → Settings → General
supabase link --project-ref YOUR_PROJECT_REF
```

6. **Apply the migration**:
```bash
# Option A: If migration file is in supabase/migrations/
supabase db push

# Option B: Direct SQL execution
supabase db execute -f path/to/0010_workout_tracking_enhancements.sql
```

7. **Verify migration**:
```bash
# Check if tables were created
supabase db migrations list

# Or check in Supabase Dashboard → Table Editor
```

## 🆘 Troubleshooting

### "supabase: command not found"
- Ensure npm install completed successfully
- Restart your terminal
- Check PATH environment variable

### "Project ref is required"
- Get your project ref from: Dashboard → Settings → General → Reference ID
- Format: `supabase link --project-ref abcdefghijklmnop`

### "Permission denied"
- Use administrator/elevated terminal
- Check Supabase project permissions

### "Migration already exists"
- Check existing migrations: `supabase db migrations list`
- Use a different migration number/name

## 🎯 Quick Start Commands

```bash
# Complete setup in order:
npm install -g supabase
supabase login
cd C:\Users\pradord\Documents\Projects\wagner_coach\wagner-coach-clean
supabase init
supabase link --project-ref YOUR_PROJECT_REF

# Apply the workout tracking migration
supabase db execute -f supabase/migrations/0010_workout_tracking_enhancements.sql

# Generate updated TypeScript types
supabase gen types typescript --project-id YOUR_PROJECT_REF > lib/supabase/database.types.ts
```

## 📚 Resources

- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
- [Supabase Migrations Guide](https://supabase.com/docs/guides/database/migrations)
- [Local Development Guide](https://supabase.com/docs/guides/local-development)

## ✅ Next Steps After Migration

1. **Verify tables in Dashboard**:
   - Go to Table Editor in Supabase Dashboard
   - Check for: `personal_records`, `workout_templates`, `rest_timer_preferences`, `exercise_notes`

2. **Test new features**:
   - Start a workout and check PR tracking
   - Verify rest timer functionality
   - Check analytics data

3. **Update TypeScript types**:
   ```bash
   supabase gen types typescript --project-id YOUR_PROJECT_REF > lib/supabase/database.types.ts
   ```

4. **Deploy to Vercel**:
   - Push changes to GitHub
   - Vercel will auto-deploy with new features