-- This migration ensures RLS is properly configured for meal_logs tables
-- It's safe to run even if the tables/policies already exist

-- Ensure RLS is enabled on both tables
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_log_foods ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure they're correct
DO $$
BEGIN
  -- Drop existing policies for meal_logs if they exist
  DROP POLICY IF EXISTS "Users can view own meal logs" ON meal_logs;
  DROP POLICY IF EXISTS "Users can create own meal logs" ON meal_logs;
  DROP POLICY IF EXISTS "Users can update own meal logs" ON meal_logs;
  DROP POLICY IF EXISTS "Users can delete own meal logs" ON meal_logs;

  -- Drop existing policies for meal_log_foods if they exist
  DROP POLICY IF EXISTS "Users can view own meal log foods" ON meal_log_foods;
  DROP POLICY IF EXISTS "Users can add foods to own meal logs" ON meal_log_foods;
  DROP POLICY IF EXISTS "Users can update foods in own meal logs" ON meal_log_foods;
  DROP POLICY IF EXISTS "Users can delete foods from own meal logs" ON meal_log_foods;
EXCEPTION
  WHEN OTHERS THEN
    -- If any error occurs (e.g., tables don't exist), continue
    NULL;
END $$;

-- Create RLS policies for meal_logs
CREATE POLICY "Users can view own meal logs"
  ON meal_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own meal logs"
  ON meal_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal logs"
  ON meal_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal logs"
  ON meal_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for meal_log_foods
CREATE POLICY "Users can view own meal log foods"
  ON meal_log_foods FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meal_logs
      WHERE meal_logs.id = meal_log_foods.meal_log_id
      AND meal_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add foods to own meal logs"
  ON meal_log_foods FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meal_logs
      WHERE meal_logs.id = meal_log_foods.meal_log_id
      AND meal_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update foods in own meal logs"
  ON meal_log_foods FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM meal_logs
      WHERE meal_logs.id = meal_log_foods.meal_log_id
      AND meal_logs.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meal_logs
      WHERE meal_logs.id = meal_log_foods.meal_log_id
      AND meal_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete foods from own meal logs"
  ON meal_log_foods FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM meal_logs
      WHERE meal_logs.id = meal_log_foods.meal_log_id
      AND meal_logs.user_id = auth.uid()
    )
  );