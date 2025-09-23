-- Drop the existing function first
DROP FUNCTION IF EXISTS get_rag_context_for_user(UUID);

-- Enhanced RPC function for getting all RAG context including ALL activities (Garmin + Strava + Manual)
CREATE OR REPLACE FUNCTION get_rag_context_for_user(p_user_id UUID)
RETURNS TABLE (
  -- Profile information
  profile_data JSONB,

  -- Calculated experience level
  experience_level TEXT,

  -- Workout statistics
  total_workouts INTEGER,
  workouts_this_week INTEGER,
  workouts_this_month INTEGER,
  avg_workout_duration INTEGER,
  favorite_workout_types TEXT[],

  -- Recent workouts
  recent_workouts JSONB,

  -- Personal records
  personal_records JSONB,

  -- Workout patterns
  workout_patterns JSONB,

  -- All activities (was strava_activities, now includes all sources)
  strava_activities JSONB,

  -- Favorite workouts
  favorite_workouts_list JSONB,

  -- Progress trends
  progress_trends JSONB,

  -- Goals
  user_goals JSONB,

  -- Nutrition data
  nutrition_stats JSONB,
  recent_meals JSONB,
  nutrition_goals JSONB,
  dietary_preferences JSONB
) AS $$
DECLARE
  v_experience_level TEXT;
  v_total_workouts INTEGER;
  v_workouts_this_week INTEGER;
  v_workouts_this_month INTEGER;
  v_avg_duration INTEGER;
  v_favorite_types TEXT[];
BEGIN
  -- Calculate experience level based on workout count
  SELECT COUNT(*) INTO v_total_workouts
  FROM workout_completions
  WHERE user_id = p_user_id;

  v_experience_level := CASE
    WHEN v_total_workouts < 10 THEN 'beginner'
    WHEN v_total_workouts < 50 THEN 'intermediate'
    ELSE 'advanced'
  END;

  -- Calculate workouts this week
  SELECT COUNT(*) INTO v_workouts_this_week
  FROM workout_completions
  WHERE user_id = p_user_id
    AND completed_at >= date_trunc('week', CURRENT_DATE);

  -- Calculate workouts this month
  SELECT COUNT(*) INTO v_workouts_this_month
  FROM workout_completions
  WHERE user_id = p_user_id
    AND completed_at >= date_trunc('month', CURRENT_DATE);

  -- Calculate average workout duration
  SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/60)::INTEGER INTO v_avg_duration
  FROM workout_completions
  WHERE user_id = p_user_id
    AND started_at IS NOT NULL
    AND completed_at IS NOT NULL;

  -- Get favorite workout types
  SELECT ARRAY_AGG(DISTINCT w.type) INTO v_favorite_types
  FROM (
    SELECT w.type
    FROM workout_completions wc
    JOIN workouts w ON w.id = wc.workout_id
    WHERE wc.user_id = p_user_id
    GROUP BY w.type
    ORDER BY COUNT(*) DESC
    LIMIT 3
  ) w;

  -- Return all context data
  RETURN QUERY
  SELECT
    -- Profile data
    (SELECT row_to_json(p.*) FROM profiles p WHERE p.id = p_user_id)::JSONB AS profile_data,

    -- Experience level
    v_experience_level AS experience_level,

    -- Workout stats
    v_total_workouts AS total_workouts,
    v_workouts_this_week AS workouts_this_week,
    v_workouts_this_month AS workouts_this_month,
    COALESCE(v_avg_duration, 45) AS avg_workout_duration,
    COALESCE(v_favorite_types, ARRAY[]::TEXT[]) AS favorite_workout_types,

    -- Recent workouts (last 10)
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', wc.id,
          'workout_name', w.name,
          'workout_type', w.type,
          'completed_at', wc.completed_at,
          'duration_minutes', EXTRACT(EPOCH FROM (wc.completed_at - wc.started_at))/60,
          'rating', wcr.rating,
          'notes', wcr.notes
        ) ORDER BY wc.completed_at DESC
      )
      FROM workout_completions wc
      JOIN workouts w ON w.id = wc.workout_id
      LEFT JOIN workout_completion_ratings wcr ON wcr.completion_id = wc.id
      WHERE wc.user_id = p_user_id
      LIMIT 10),
      '[]'::JSONB
    ) AS recent_workouts,

    -- Personal records
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'exercise_name', e.name,
          'max_weight', es.weight,
          'max_reps', es.reps,
          'achieved_at', es.created_at
        ) ORDER BY es.weight DESC
      )
      FROM exercise_sets es
      JOIN exercises e ON e.id = es.exercise_id
      WHERE es.user_id = p_user_id
      AND es.weight IS NOT NULL
      GROUP BY e.name, es.weight, es.reps, es.created_at
      LIMIT 10),
      '[]'::JSONB
    ) AS personal_records,

    -- Workout patterns
    jsonb_build_object(
      'preferred_time', 'morning',
      'avg_weekly_workouts', COALESCE(v_workouts_this_week, 0),
      'consistency_streak', 0
    ) AS workout_patterns,

    -- ALL ACTIVITIES from unified activities table (Garmin + Strava + Manual)
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', a.id,
          'name', a.activity_name,
          'activity_type', a.activity_type,
          'source', a.source,
          'start_date', a.activity_date,
          'distance_meters', a.distance,
          'duration_seconds', a.duration,
          'calories', a.calories_burned,
          'average_heartrate', a.average_heart_rate,
          'max_heartrate', a.max_heart_rate,
          'average_speed', CASE
            WHEN a.distance > 0 AND a.duration > 0
            THEN (a.distance::FLOAT / 1000) / (a.duration::FLOAT / 3600)
            ELSE NULL
          END,
          'notes', a.notes
        ) ORDER BY a.activity_date DESC
      )
      FROM activities a
      WHERE a.user_id = p_user_id
      AND a.activity_date >= CURRENT_DATE - INTERVAL '30 days'
      LIMIT 20),
      '[]'::JSONB
    ) AS strava_activities,

    -- Favorite workouts
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'workout_id', w.id,
          'workout_name', w.name,
          'workout_type', w.type
        )
      )
      FROM favorite_workouts fw
      JOIN workouts w ON w.id = fw.workout_id
      WHERE fw.user_id = p_user_id),
      '[]'::JSONB
    ) AS favorite_workouts_list,

    -- Progress trends
    jsonb_build_object(
      'workout_frequency_trend',
      CASE
        WHEN v_workouts_this_week > 3 THEN 'up'
        WHEN v_workouts_this_week < 2 THEN 'down'
        ELSE 'stable'
      END,
      'avg_rating_trend', jsonb_build_object(
        'recent', (
          SELECT AVG(rating)::NUMERIC(3,1)
          FROM workout_completion_ratings wcr
          JOIN workout_completions wc ON wc.id = wcr.completion_id
          WHERE wc.user_id = p_user_id
          AND wc.completed_at >= CURRENT_DATE - INTERVAL '7 days'
        ),
        'previous', (
          SELECT AVG(rating)::NUMERIC(3,1)
          FROM workout_completion_ratings wcr
          JOIN workout_completions wc ON wc.id = wcr.completion_id
          WHERE wc.user_id = p_user_id
          AND wc.completed_at >= CURRENT_DATE - INTERVAL '14 days'
          AND wc.completed_at < CURRENT_DATE - INTERVAL '7 days'
        )
      )
    ) AS progress_trends,

    -- User goals
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'goal_type', pg.goal_type,
          'target_value', pg.target_value,
          'current_value', pg.current_value,
          'deadline', pg.deadline
        )
      )
      FROM profile_goals pg
      WHERE pg.user_id = p_user_id
      AND pg.is_active = true),
      '[]'::JSONB
    ) AS user_goals,

    -- Nutrition statistics
    jsonb_build_object(
      'avg_daily_calories', (
        SELECT AVG(daily_calories)::INTEGER
        FROM (
          SELECT DATE(logged_at) as log_date, SUM(calories) as daily_calories
          FROM meals
          WHERE user_id = p_user_id
          AND logged_at >= CURRENT_DATE - INTERVAL '30 days'
          GROUP BY DATE(logged_at)
        ) daily_totals
      ),
      'avg_daily_protein', (
        SELECT AVG(daily_protein)::NUMERIC(5,1)
        FROM (
          SELECT DATE(logged_at) as log_date, SUM(protein_g) as daily_protein
          FROM meals
          WHERE user_id = p_user_id
          AND logged_at >= CURRENT_DATE - INTERVAL '30 days'
          GROUP BY DATE(logged_at)
        ) daily_totals
      ),
      'meals_logged_this_week', (
        SELECT COUNT(*)
        FROM meals
        WHERE user_id = p_user_id
        AND logged_at >= date_trunc('week', CURRENT_DATE)
      ),
      'favorite_meal_types', (
        SELECT ARRAY_AGG(DISTINCT meal_category)
        FROM (
          SELECT meal_category
          FROM meals
          WHERE user_id = p_user_id
          GROUP BY meal_category
          ORDER BY COUNT(*) DESC
          LIMIT 3
        ) top_categories
      )
    ) AS nutrition_stats,

    -- Recent meals (last 10)
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'meal_name', m.meal_name,
          'meal_category', m.meal_category,
          'calories', m.calories,
          'protein_g', m.protein_g,
          'carbs_g', m.carbs_g,
          'fat_g', m.fat_g,
          'logged_at', m.logged_at
        ) ORDER BY m.logged_at DESC
      )
      FROM meals m
      WHERE m.user_id = p_user_id
      LIMIT 10),
      '[]'::JSONB
    ) AS recent_meals,

    -- Nutrition goals
    COALESCE(
      (SELECT row_to_json(ng.*)
       FROM nutrition_goals ng
       WHERE ng.user_id = p_user_id
       LIMIT 1),
      '{}'::JSON
    )::JSONB AS nutrition_goals,

    -- Dietary preferences
    COALESCE(
      (SELECT jsonb_build_object(
        'dietary_restrictions', uap.dietary_restrictions,
        'preferred_portion_units', uap.preferred_portion_units,
        'common_foods', uap.common_foods
      )
      FROM user_ai_preferences uap
      WHERE uap.user_id = p_user_id),
      '{}'::JSONB
    ) AS dietary_preferences;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;