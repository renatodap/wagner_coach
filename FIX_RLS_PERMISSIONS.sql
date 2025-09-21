-- Fix Row Level Security Issues
-- This will ensure workouts are visible to all authenticated users

-- 1. Check current RLS status
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('workouts', 'exercises', 'workout_exercises');

-- 2. Disable RLS on read-only tables (workouts are public data)
ALTER TABLE workouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE exercises DISABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises DISABLE ROW LEVEL SECURITY;

-- Alternative: If you want to keep RLS enabled but allow all authenticated users to read
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read workouts" ON workouts;
DROP POLICY IF EXISTS "Allow authenticated users to read exercises" ON exercises;
DROP POLICY IF EXISTS "Allow authenticated users to read workout_exercises" ON workout_exercises;

-- Create permissive read policies
CREATE POLICY "Allow authenticated users to read workouts"
  ON workouts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read exercises"
  ON exercises
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read workout_exercises"
  ON workout_exercises
  FOR SELECT
  TO authenticated
  USING (true);

-- Grant permissions
GRANT SELECT ON workouts TO authenticated;
GRANT SELECT ON exercises TO authenticated;
GRANT SELECT ON workout_exercises TO authenticated;

-- Test query - this should return workouts
SELECT * FROM workouts LIMIT 5;