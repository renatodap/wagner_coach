-- ============================================================
-- AI PROGRAM TABLES RLS POLICIES
-- Migration: 20251002_ai_program_rls
-- Adds Row Level Security policies for AI program tables
-- ============================================================

-- Enable RLS on all AI program tables
ALTER TABLE ai_generated_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_program_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_program_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_program_meals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own programs" ON ai_generated_programs;
DROP POLICY IF EXISTS "Users can insert their own programs" ON ai_generated_programs;
DROP POLICY IF EXISTS "Users can update their own programs" ON ai_generated_programs;
DROP POLICY IF EXISTS "Users can delete their own programs" ON ai_generated_programs;

DROP POLICY IF EXISTS "Users can view days from their programs" ON ai_program_days;
DROP POLICY IF EXISTS "Users can insert days for their programs" ON ai_program_days;
DROP POLICY IF EXISTS "Users can update days from their programs" ON ai_program_days;
DROP POLICY IF EXISTS "Users can delete days from their programs" ON ai_program_days;

DROP POLICY IF EXISTS "Users can view workouts from their programs" ON ai_program_workouts;
DROP POLICY IF EXISTS "Users can insert workouts for their programs" ON ai_program_workouts;
DROP POLICY IF EXISTS "Users can update workouts from their programs" ON ai_program_workouts;
DROP POLICY IF EXISTS "Users can delete workouts from their programs" ON ai_program_workouts;

DROP POLICY IF EXISTS "Users can view meals from their programs" ON ai_program_meals;
DROP POLICY IF EXISTS "Users can insert meals for their programs" ON ai_program_meals;
DROP POLICY IF EXISTS "Users can update meals from their programs" ON ai_program_meals;
DROP POLICY IF EXISTS "Users can delete meals from their programs" ON ai_program_meals;

-- ai_generated_programs policies
CREATE POLICY "Users can view their own programs"
ON ai_generated_programs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own programs"
ON ai_generated_programs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own programs"
ON ai_generated_programs FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own programs"
ON ai_generated_programs FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ai_program_days policies
CREATE POLICY "Users can view days from their programs"
ON ai_program_days FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ai_generated_programs
    WHERE ai_generated_programs.id = ai_program_days.program_id
    AND ai_generated_programs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert days for their programs"
ON ai_program_days FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ai_generated_programs
    WHERE ai_generated_programs.id = ai_program_days.program_id
    AND ai_generated_programs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update days from their programs"
ON ai_program_days FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ai_generated_programs
    WHERE ai_generated_programs.id = ai_program_days.program_id
    AND ai_generated_programs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete days from their programs"
ON ai_program_days FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ai_generated_programs
    WHERE ai_generated_programs.id = ai_program_days.program_id
    AND ai_generated_programs.user_id = auth.uid()
  )
);

-- ai_program_workouts policies
CREATE POLICY "Users can view workouts from their programs"
ON ai_program_workouts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ai_generated_programs
    WHERE ai_generated_programs.id = ai_program_workouts.program_id
    AND ai_generated_programs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert workouts for their programs"
ON ai_program_workouts FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ai_generated_programs
    WHERE ai_generated_programs.id = ai_program_workouts.program_id
    AND ai_generated_programs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update workouts from their programs"
ON ai_program_workouts FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ai_generated_programs
    WHERE ai_generated_programs.id = ai_program_workouts.program_id
    AND ai_generated_programs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete workouts from their programs"
ON ai_program_workouts FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ai_generated_programs
    WHERE ai_generated_programs.id = ai_program_workouts.program_id
    AND ai_generated_programs.user_id = auth.uid()
  )
);

-- ai_program_meals policies
CREATE POLICY "Users can view meals from their programs"
ON ai_program_meals FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ai_generated_programs
    WHERE ai_generated_programs.id = ai_program_meals.program_id
    AND ai_generated_programs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert meals for their programs"
ON ai_program_meals FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ai_generated_programs
    WHERE ai_generated_programs.id = ai_program_meals.program_id
    AND ai_generated_programs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update meals from their programs"
ON ai_program_meals FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ai_generated_programs
    WHERE ai_generated_programs.id = ai_program_meals.program_id
    AND ai_generated_programs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete meals from their programs"
ON ai_program_meals FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ai_generated_programs
    WHERE ai_generated_programs.id = ai_program_meals.program_id
    AND ai_generated_programs.user_id = auth.uid()
  )
);
