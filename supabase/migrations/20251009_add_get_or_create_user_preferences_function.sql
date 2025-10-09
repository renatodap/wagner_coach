-- Migration: Add user_preferences table and get_or_create_user_preferences RPC function
-- Created: 2025-10-09
-- Purpose: Create user_preferences table and helper function to get or create preferences with defaults

-- ============================================================================
-- STEP 1: Create user_preferences table if it doesn't exist
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  unit_system text DEFAULT 'metric'::text CHECK (unit_system = ANY (ARRAY['metric'::text, 'imperial'::text])),
  default_activity_view text DEFAULT 'list'::text CHECK (default_activity_view = ANY (ARRAY['list'::text, 'grid'::text, 'calendar'::text])),
  activities_per_page integer DEFAULT 20 CHECK (activities_per_page >= 10 AND activities_per_page <= 100),
  activities_public boolean DEFAULT false,
  share_stats boolean DEFAULT false,
  workout_reminders boolean DEFAULT true,
  achievement_notifications boolean DEFAULT true,
  weekly_summary boolean DEFAULT true,
  auto_pause boolean DEFAULT true,
  countdown_seconds integer DEFAULT 3,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can view own preferences'
  ) THEN
    CREATE POLICY "Users can view own preferences" ON public.user_preferences
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can insert own preferences'
  ) THEN
    CREATE POLICY "Users can insert own preferences" ON public.user_preferences
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can update own preferences'
  ) THEN
    CREATE POLICY "Users can update own preferences" ON public.user_preferences
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- ============================================================================
-- STEP 2: Create get_or_create_user_preferences RPC function
-- ============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_or_create_user_preferences(UUID);

-- Create the function
CREATE OR REPLACE FUNCTION public.get_or_create_user_preferences(p_user_id UUID)
RETURNS SETOF public.user_preferences
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_preferences public.user_preferences;
BEGIN
  -- Try to get existing preferences
  SELECT * INTO v_preferences
  FROM public.user_preferences
  WHERE user_id = p_user_id;

  -- If preferences exist, return them
  IF FOUND THEN
    RETURN NEXT v_preferences;
    RETURN;
  END IF;

  -- Otherwise, create default preferences and return
  INSERT INTO public.user_preferences (
    user_id,
    unit_system,
    default_activity_view,
    activities_per_page,
    activities_public,
    share_stats,
    workout_reminders,
    achievement_notifications,
    weekly_summary,
    auto_pause,
    countdown_seconds
  )
  VALUES (
    p_user_id,
    'metric',
    'list',
    20,
    false,
    false,
    true,
    true,
    true,
    true,
    3
  )
  RETURNING * INTO v_preferences;

  RETURN NEXT v_preferences;
  RETURN;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.get_or_create_user_preferences(UUID) IS
  'Gets existing user preferences or creates default preferences if none exist';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_or_create_user_preferences(UUID) TO authenticated;
