-- Migration: Filter workouts to only show those with exercises
-- This ensures users only see workouts that have been properly configured with exercises

-- Drop existing function to recreate with new logic
DROP FUNCTION IF EXISTS search_workouts(TEXT, TEXT, TEXT, INTEGER, BOOLEAN, UUID);

-- Recreate search_workouts function with exercise filtering
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
    w.description,
    CASE
      WHEN p_user_id IS NOT NULL THEN
        EXISTS(SELECT 1 FROM favorite_workouts fw WHERE fw.workout_id = w.id AND fw.user_id = p_user_id)
      ELSE FALSE
    END as is_favorite,
    AVG(wc.workout_rating)::DECIMAL as avg_rating,
    COUNT(DISTINCT wc.id)::INTEGER as completion_count
  FROM workouts w
  -- INNER JOIN to only get workouts that have exercises
  INNER JOIN workout_exercises we ON we.workout_id = w.id
  LEFT JOIN workout_completions wc ON wc.workout_id = w.id
  WHERE
    (p_search_term IS NULL OR w.name ILIKE '%' || p_search_term || '%' OR w.description ILIKE '%' || p_search_term || '%')
    AND (p_type IS NULL OR w.type = p_type)
    AND (p_difficulty IS NULL OR w.difficulty = p_difficulty)
    AND (p_max_duration IS NULL OR COALESCE(w.estimated_duration_minutes, w.duration_minutes, 45) <= p_max_duration)
    AND (NOT p_favorites_only OR (p_favorites_only AND EXISTS(
      SELECT 1 FROM favorite_workouts fw WHERE fw.workout_id = w.id AND fw.user_id = p_user_id
    )))
  GROUP BY w.id
  ORDER BY
    CASE WHEN p_user_id IS NOT NULL THEN
      EXISTS(SELECT 1 FROM favorite_workouts fw2 WHERE fw2.workout_id = w.id AND fw2.user_id = p_user_id)
    ELSE FALSE END DESC,
    COUNT(DISTINCT wc.id) DESC,
    AVG(wc.workout_rating) DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Test query to verify only workouts with exercises are returned
SELECT
  w.id,
  w.name,
  COUNT(we.id) as exercise_count
FROM workouts w
LEFT JOIN workout_exercises we ON we.workout_id = w.id
GROUP BY w.id, w.name
ORDER BY exercise_count DESC;