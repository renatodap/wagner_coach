-- ============================================================
-- AUTO-CREATE PROFILES FOR NEW USERS
-- Migration: 20251008_auto_create_profiles
-- Purpose: Fix broken user signup by auto-creating profile rows
-- ============================================================

-- ============================================================
-- 1. ENSURE PROFILES TABLE EXISTS WITH PROPER STRUCTURE
-- ============================================================

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  goal TEXT CHECK (goal = ANY (ARRAY['build_muscle'::text, 'lose_weight'::text, 'gain_strength'::text])),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  about_me TEXT,
  experience_level TEXT DEFAULT 'beginner',
  fitness_goals TEXT,
  preferred_activities TEXT[],
  motivation_factors TEXT[],
  physical_limitations TEXT[],
  available_equipment TEXT[],
  training_frequency TEXT,
  session_duration TEXT,
  dietary_preferences TEXT,
  notification_preferences JSONB DEFAULT '{}'::jsonb,
  privacy_settings JSONB DEFAULT '{}'::jsonb,
  age INTEGER CHECK (age >= 13 AND age <= 120)
);

-- ============================================================
-- 2. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. DROP EXISTING POLICIES (if they exist)
-- ============================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- ============================================================
-- 4. CREATE RLS POLICIES
-- ============================================================

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- ============================================================
-- 5. CREATE TRIGGER FUNCTION TO AUTO-CREATE PROFILES
-- ============================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new profile for the newly created user
  INSERT INTO public.profiles (id, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. CREATE TRIGGER ON auth.users
-- ============================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 7. CREATE UPDATED_AT TRIGGER FOR PROFILES
-- ============================================================

-- Create or replace the update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

-- Create trigger to update updated_at column
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 8. BACKFILL MISSING PROFILES FOR EXISTING USERS
-- ============================================================

-- Create profiles for any existing auth.users that don't have one
INSERT INTO public.profiles (id, created_at, updated_at)
SELECT
  u.id,
  NOW(),
  NOW()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
-- Users can now sign up and their profile will be auto-created
-- Existing users without profiles have been backfilled
-- RLS policies ensure users can only access their own data
