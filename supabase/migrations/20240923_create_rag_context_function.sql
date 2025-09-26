-- Create RPC function to get RAG context for user
-- This function returns user profile and activity data for AI coaching

CREATE OR REPLACE FUNCTION get_rag_context_for_user(p_user_id UUID)
RETURNS TABLE (
  profile_data JSONB,
  recent_workouts JSONB,
  recent_meals JSONB,
  strava_activities JSONB,
  user_goals JSONB,
  workout_patterns JSONB,
  nutrition_stats JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH profile AS (
    SELECT jsonb_build_object(
      'id', up.id,
      'name', up.name,
      'full_name', up.full_name,
      'age', up.age,
      'location', up.location,
      'experience', up.experience_level,
      'experience_level', up.experience_level,
      'primary_goal', up.primary_goal,
      'about_me', up.about_me,
      'goal', up.goal,
      'weekly_hours', up.weekly_hours,
      'preferred_workout_time', up.preferred_workout_time,
      'focus_areas', up.focus_areas,
      'health_conditions', up.health_conditions,
      'equipment_access', up.equipment_access,
      'dietary_preferences', up.dietary_preferences,
      'strengths', up.strengths,
      'areas_for_improvement', up.areas_for_improvement,
      'created_at', up.created_at,
      'updated_at', up.updated_at
    ) as data
    FROM user_profiles up
    WHERE up.id = p_user_id
  ),
  workouts AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', w.id,
        'workout_name', w.workout_name,
        'completed_at', w.completed_at,
        'duration_minutes', w.duration_minutes,
        'performance_rating', w.performance_rating,
        'notes', w.notes,
        'exercises', w.exercises
      ) ORDER BY w.completed_at DESC
    ) as data
    FROM workout_sessions w
    WHERE w.user_id = p_user_id
      AND w.completed_at >= NOW() - INTERVAL '30 days'
    LIMIT 10
  ),
  meals AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', m.id,
        'meal_type', m.meal_type,
        'logged_at', m.logged_at,
        'calories', m.calories,
        'protein_g', m.protein_g,
        'carbs_g', m.carbs_g,
        'fat_g', m.fat_g,
        'foods', m.foods
      ) ORDER BY m.logged_at DESC
    ) as data
    FROM meals m
    WHERE m.user_id = p_user_id
      AND m.logged_at >= NOW() - INTERVAL '7 days'
    LIMIT 20
  ),
  activities AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', sa.id,
        'name', sa.name,
        'type', sa.type,
        'start_date', sa.start_date,
        'distance', sa.distance,
        'moving_time', sa.moving_time,
        'elapsed_time', sa.elapsed_time,
        'total_elevation_gain', sa.total_elevation_gain,
        'average_speed', sa.average_speed,
        'max_speed', sa.max_speed,
        'average_heartrate', sa.average_heartrate,
        'max_heartrate', sa.max_heartrate
      ) ORDER BY sa.start_date DESC
    ) as data
    FROM strava_activities sa
    WHERE sa.user_id = p_user_id
      AND sa.start_date >= NOW() - INTERVAL '30 days'
    LIMIT 30
  ),
  goals AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', g.id,
        'title', g.title,
        'description', g.description,
        'target_value', g.target_value,
        'current_value', g.current_value,
        'target_date', g.target_date,
        'is_active', g.is_active
      ) ORDER BY g.created_at DESC
    ) as data
    FROM goals g
    WHERE g.user_id = p_user_id
      AND (g.is_active = true OR g.created_at >= NOW() - INTERVAL '90 days')
    LIMIT 10
  ),
  workout_stats AS (
    SELECT jsonb_build_object(
      'total_workouts', COUNT(*),
      'avg_duration', AVG(duration_minutes),
      'total_duration', SUM(duration_minutes),
      'avg_rating', AVG(performance_rating)
    ) as data
    FROM workout_sessions
    WHERE user_id = p_user_id
      AND completed_at >= NOW() - INTERVAL '30 days'
  ),
  nutrition_summary AS (
    SELECT jsonb_build_object(
      'avg_daily_calories', AVG(daily_total.calories),
      'avg_daily_protein', AVG(daily_total.protein),
      'meal_frequency', AVG(daily_total.meal_count)
    ) as data
    FROM (
      SELECT
        DATE(logged_at) as log_date,
        SUM(calories) as calories,
        SUM(protein_g) as protein,
        COUNT(*) as meal_count
      FROM meals
      WHERE user_id = p_user_id
        AND logged_at >= NOW() - INTERVAL '14 days'
      GROUP BY DATE(logged_at)
    ) daily_total
  )
  SELECT
    COALESCE(p.data, '{}'::jsonb) as profile_data,
    COALESCE(w.data, '[]'::jsonb) as recent_workouts,
    COALESCE(m.data, '[]'::jsonb) as recent_meals,
    COALESCE(a.data, '[]'::jsonb) as strava_activities,
    COALESCE(g.data, '[]'::jsonb) as user_goals,
    COALESCE(ws.data, '{}'::jsonb) as workout_patterns,
    COALESCE(ns.data, '{}'::jsonb) as nutrition_stats
  FROM profile p
  CROSS JOIN workouts w
  CROSS JOIN meals m
  CROSS JOIN activities a
  CROSS JOIN goals g
  CROSS JOIN workout_stats ws
  CROSS JOIN nutrition_summary ns;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_rag_context_for_user(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_rag_context_for_user IS 'Retrieves comprehensive user context for AI coaching including profile, workouts, meals, Strava activities, and goals';