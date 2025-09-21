-- Test if workouts were inserted
SELECT COUNT(*) as workout_count FROM workouts;

-- List all workouts
SELECT id, name, type, difficulty, description FROM workouts;

-- Check if exercises exist
SELECT COUNT(*) as exercise_count FROM exercises;

-- Check if workout_exercises links exist
SELECT COUNT(*) as link_count FROM workout_exercises;

-- Test the search function that the app uses
SELECT * FROM search_workouts(
  p_search_term := NULL,
  p_type := NULL,
  p_difficulty := NULL,
  p_max_duration := NULL,
  p_favorites_only := false,
  p_user_id := NULL
);

-- If the function doesn't exist, try direct query
SELECT
  id as workout_id,
  name as workout_name,
  type as workout_type,
  goal as workout_goal,
  difficulty,
  COALESCE(estimated_duration_minutes, duration_minutes, 45) as duration_minutes,
  description,
  false as is_favorite,
  0.0 as avg_rating,
  0 as completion_count
FROM workouts
ORDER BY name;