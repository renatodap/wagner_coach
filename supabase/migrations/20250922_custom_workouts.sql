-- Migration to support custom user-created workouts and exercises

-- Step 1: Add user_id to workouts table for ownership
ALTER TABLE public.workouts
  ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Step 2: Add description to workouts table
-- This column is referenced in the frontend but was missing from the initial schema.
ALTER TABLE public.workouts
  ADD COLUMN description TEXT;

-- Step 3: Add is_public flag to workouts table
-- This helps differentiate public templates from user-specific workouts.
ALTER TABLE public.workouts
  ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;

-- Step 4: Add user_id to exercises table for custom exercises
ALTER TABLE public.exercises
  ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Step 5: Backfill existing data
-- Mark all current workouts as public templates and assign no owner.
UPDATE public.workouts SET is_public = true, user_id = NULL;
-- Mark all current exercises as public and assign no owner.
UPDATE public.exercises SET user_id = NULL;


-- Step 6: Update the get_dashboard_workouts function to include user-specific workouts

-- First, drop the existing function to redefine it
DROP FUNCTION IF EXISTS get_dashboard_workouts(UUID);

-- Re-create the function with new logic
CREATE OR REPLACE FUNCTION get_dashboard_workouts(p_user_id UUID)
RETURNS TABLE (
  workout_id INTEGER,
  workout_name TEXT,
  workout_type TEXT,
  workout_goal TEXT,
  difficulty TEXT,
  duration_minutes INTEGER,
  description TEXT,
  is_favorite BOOLEAN,
  exercise_count BIGINT,
  is_public BOOLEAN,
  owner_user_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.name,
    w.type,
    w.goal,
    w.difficulty,
    w.duration_minutes,
    w.description,
    EXISTS(SELECT 1 FROM favorite_workouts fw WHERE fw.workout_id = w.id AND fw.user_id = p_user_id) as is_favorite,
    COUNT(we.id) as exercise_count,
    w.is_public,
    w.user_id
  FROM
    public.workouts w
  LEFT JOIN
    public.workout_exercises we ON we.workout_id = w.id
  WHERE
    (w.is_public = true OR w.user_id = p_user_id)
  GROUP BY
    w.id
  HAVING
    COUNT(we.id) > 0
  ORDER BY
    w.name;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_workouts(UUID) TO authenticated;


-- Step 7: Implement Row Level Security (RLS) for workouts and exercises

-- Enable RLS on workouts table
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts FORCE ROW LEVEL SECURITY; -- Ensures RLS is always applied

-- Drop existing policies if they exist from a previous state
DROP POLICY IF EXISTS "Allow public read access to workouts" ON public.workouts;
DROP POLICY IF EXISTS "Allow individual read access to own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Allow users to insert their own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Allow users to update their own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Allow users to delete their own workouts" ON public.workouts;

-- Policies for workouts
CREATE POLICY "Allow public read access to workouts"
  ON public.workouts FOR SELECT
  USING (is_public = true);

CREATE POLICY "Allow individual read access to own workouts"
  ON public.workouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own workouts"
  ON public.workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own workouts"
  ON public.workouts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own workouts"
  ON public.workouts FOR DELETE
  USING (auth.uid() = user_id);


-- Enable RLS on exercises table
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises FORCE ROW LEVEL SECURITY;

-- Drop existing policies if they exist from a previous state
DROP POLICY IF EXISTS "Allow public read access to exercises" ON public.exercises;
DROP POLICY IF EXISTS "Allow individual read access to own exercises" ON public.exercises;
DROP POLICY IF EXISTS "Allow users to insert their own exercises" ON public.exercises;
DROP POLICY IF EXISTS "Allow users to update their own exercises" ON public.exercises;
DROP POLICY IF EXISTS "Allow users to delete their own exercises" ON public.exercises;


-- Policies for exercises
CREATE POLICY "Allow public read access to exercises"
  ON public.exercises FOR SELECT
  USING (user_id IS NULL); -- Public exercises have NULL user_id

CREATE POLICY "Allow individual read access to own exercises"
  ON public.exercises FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own exercises"
  ON public.exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own exercises"
  ON public.exercises FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own exercises"
  ON public.exercises FOR DELETE
  USING (auth.uid() = user_id);
