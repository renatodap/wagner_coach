-- COMPREHENSIVE MIGRATION: Enforce that users NEVER see workouts without exercises
-- This migration creates views and updates all functions to ensure only populated workouts are visible

-- Step 1: Create a view that only shows workouts with exercises
CREATE OR REPLACE VIEW workouts_with_exercises AS
SELECT DISTINCT w.*
FROM workouts w
INNER JOIN workout_exercises we ON we.workout_id = w.id
WHERE EXISTS (
  SELECT 1 FROM workout_exercises we2
  WHERE we2.workout_id = w.id
);

-- Grant access to authenticated users
GRANT SELECT ON workouts_with_exercises TO authenticated;

-- Step 2: Update the search_workouts function to use the filtered view
DROP FUNCTION IF EXISTS search_workouts(TEXT, TEXT, TEXT, INTEGER, BOOLEAN, UUID);

CREATE OR REPLACE FUNCTION search_workouts(
  p_search_term TEXT DEFAULT NULL,
  p_type TEXT DEFAULT NULL,
  p_difficulty TEXT DEFAULT NULL,
  p_max_duration INTEGER DEFAULT NULL,
  p_favorites_only BOOLEAN DEFAULT FALSE,
  p_user_id UUID DEFAULT NULL
) RETURNS TABLE (
  workout_id INTEGER,
  workout_name TEXT,
  workout_type TEXT,
  workout_goal TEXT,
  difficulty TEXT,
  duration_minutes INTEGER,
  description TEXT,
  is_favorite BOOLEAN,
  avg_rating DECIMAL,
  completion_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.name,
    w.type,
    w.goal,
    w.difficulty,
    COALESCE(w.estimated_duration_minutes, w.duration_minutes, 45),
    COALESCE(w.description, 'No description available'),
    CASE
      WHEN p_user_id IS NOT NULL THEN
        EXISTS(SELECT 1 FROM favorite_workouts fw WHERE fw.workout_id = w.id AND fw.user_id = p_user_id)
      ELSE FALSE
    END as is_favorite,
    COALESCE(AVG(wc.workout_rating), 0.0)::DECIMAL as avg_rating,
    COUNT(DISTINCT wc.id)::INTEGER as completion_count
  FROM workouts_with_exercises w  -- Use the filtered view
  LEFT JOIN workout_completions wc ON wc.workout_id = w.id
  WHERE
    (p_search_term IS NULL OR w.name ILIKE '%' || p_search_term || '%' OR w.description ILIKE '%' || p_search_term || '%')
    AND (p_type IS NULL OR w.type = p_type)
    AND (p_difficulty IS NULL OR w.difficulty = p_difficulty)
    AND (p_max_duration IS NULL OR COALESCE(w.estimated_duration_minutes, w.duration_minutes, 45) <= p_max_duration)
    AND (NOT p_favorites_only OR (p_favorites_only AND EXISTS(
      SELECT 1 FROM favorite_workouts fw WHERE fw.workout_id = w.id AND fw.user_id = p_user_id
    )))
  GROUP BY w.id, w.name, w.type, w.goal, w.difficulty, w.estimated_duration_minutes, w.duration_minutes, w.description
  ORDER BY
    CASE WHEN p_user_id IS NOT NULL THEN
      EXISTS(SELECT 1 FROM favorite_workouts fw2 WHERE fw2.workout_id = w.id AND fw2.user_id = p_user_id)
    ELSE FALSE END DESC,
    COUNT(DISTINCT wc.id) DESC,
    AVG(wc.workout_rating) DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create a function to get workout details (only if it has exercises)
CREATE OR REPLACE FUNCTION get_workout_details(p_workout_id INTEGER)
RETURNS TABLE (
  workout_id INTEGER,
  workout_name TEXT,
  workout_type TEXT,
  workout_goal TEXT,
  difficulty TEXT,
  duration_minutes INTEGER,
  description TEXT,
  exercise_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.name,
    w.type,
    w.goal,
    w.difficulty,
    COALESCE(w.estimated_duration_minutes, w.duration_minutes, 45),
    COALESCE(w.description, 'No description available'),
    COUNT(we.id) as exercise_count
  FROM workouts_with_exercises w
  LEFT JOIN workout_exercises we ON we.workout_id = w.id
  WHERE w.id = p_workout_id
  GROUP BY w.id, w.name, w.type, w.goal, w.difficulty, w.estimated_duration_minutes, w.duration_minutes, w.description
  HAVING COUNT(we.id) > 0;  -- Only return if exercises exist
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create a function to list all workouts for dashboard (with exercise count)
CREATE OR REPLACE FUNCTION get_dashboard_workouts(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  workout_id INTEGER,
  workout_name TEXT,
  workout_type TEXT,
  workout_goal TEXT,
  difficulty TEXT,
  duration_minutes INTEGER,
  description TEXT,
  is_favorite BOOLEAN,
  exercise_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.name,
    w.type,
    w.goal,
    w.difficulty,
    COALESCE(w.estimated_duration_minutes, w.duration_minutes, 45),
    COALESCE(w.description, 'No description available'),
    CASE
      WHEN p_user_id IS NOT NULL THEN
        EXISTS(SELECT 1 FROM favorite_workouts fw WHERE fw.workout_id = w.id AND fw.user_id = p_user_id)
      ELSE FALSE
    END as is_favorite,
    COUNT(we.id) as exercise_count
  FROM workouts_with_exercises w
  LEFT JOIN workout_exercises we ON we.workout_id = w.id
  GROUP BY w.id, w.name, w.type, w.goal, w.difficulty, w.estimated_duration_minutes, w.duration_minutes, w.description
  HAVING COUNT(we.id) > 0  -- Double-check exercises exist
  ORDER BY w.name;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Update RLS policies to use the view
-- First, create policies for the view
DROP POLICY IF EXISTS "Allow authenticated users to read workouts_with_exercises" ON workouts_with_exercises;
CREATE POLICY "Allow authenticated users to read workouts_with_exercises"
  ON workouts_with_exercises
  FOR SELECT
  TO authenticated
  USING (true);

-- Step 6: Create a diagnostic function to identify workouts without exercises
CREATE OR REPLACE FUNCTION find_empty_workouts()
RETURNS TABLE (
  workout_id INTEGER,
  workout_name TEXT,
  workout_type TEXT,
  has_exercises BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.name,
    w.type,
    EXISTS(SELECT 1 FROM workout_exercises we WHERE we.workout_id = w.id) as has_exercises
  FROM workouts w
  WHERE NOT EXISTS(SELECT 1 FROM workout_exercises we WHERE we.workout_id = w.id)
  ORDER BY w.id;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Clean up any orphaned workouts (optional - review before running)
-- This will show you which workouts would be hidden
SELECT * FROM find_empty_workouts();

-- Step 8: Verify the view is working correctly
SELECT
  'Total Workouts' as metric,
  COUNT(*) as count
FROM workouts
UNION ALL
SELECT
  'Workouts with Exercises',
  COUNT(*)
FROM workouts_with_exercises
UNION ALL
SELECT
  'Empty Workouts (Hidden)',
  COUNT(*)
FROM workouts w
WHERE NOT EXISTS(SELECT 1 FROM workout_exercises we WHERE we.workout_id = w.id);

-- Step 9: Grant necessary permissions
GRANT EXECUTE ON FUNCTION search_workouts TO authenticated;
GRANT EXECUTE ON FUNCTION get_workout_details TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_workouts TO authenticated;
GRANT EXECUTE ON FUNCTION find_empty_workouts TO authenticated;