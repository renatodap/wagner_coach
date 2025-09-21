-- Step 1: Add user_id to workouts table
ALTER TABLE public.workouts
ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Step 2: Create user_exercises table
CREATE TABLE public.user_exercises (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    muscle_group TEXT,
    equipment TEXT,
    instructions TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Add user_exercise_id to workout_exercises table
ALTER TABLE public.workout_exercises
ADD COLUMN user_exercise_id BIGINT REFERENCES public.user_exercises(id) ON DELETE CASCADE;

-- Step 4: Add a check constraint to workout_exercises
ALTER TABLE public.workout_exercises
ADD CONSTRAINT exercise_source_check CHECK (
    (exercise_id IS NOT NULL AND user_exercise_id IS NULL) OR
    (exercise_id IS NULL AND user_exercise_id IS NOT NULL)
);

-- Step 5: Add RLS policies for the new table
ALTER TABLE public.user_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to own user exercises"
ON public.user_exercises
FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- Step 6: Update RLS policies for workouts table
-- Allow users to see their own workouts, and all public workouts
DROP POLICY IF EXISTS "Allow read access to all authenticated users" ON public.workouts;
CREATE POLICY "Allow read access to public and own workouts"
ON public.workouts
FOR SELECT
TO authenticated
USING (user_id IS NULL OR user_id = auth.uid());

-- Allow users to create workouts for themselves
CREATE POLICY "Allow insert for own workouts"
ON public.workouts
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow users to update their own workouts
CREATE POLICY "Allow update for own workouts"
ON public.workouts
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Allow users to delete their own workouts
CREATE POLICY "Allow delete for own workouts"
ON public.workouts
FOR DELETE
TO authenticated
USING (user_id = auth.uid());
