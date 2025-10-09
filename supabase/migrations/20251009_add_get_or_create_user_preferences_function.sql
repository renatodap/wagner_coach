-- Migration: Add get_or_create_user_preferences RPC function
-- Created: 2025-10-09
-- Purpose: Create helper function to get or create user preferences with defaults

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
