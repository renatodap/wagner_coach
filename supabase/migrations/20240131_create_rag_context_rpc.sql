-- Consolidated RPC function for getting all RAG context for a user
-- This function returns all necessary context data in a single database call

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

  -- Strava activities
  strava_activities JSONB,

  -- Favorite workouts
  favorite_workouts_list JSONB,

  -- Progress trends
  progress_trends JSONB,

  -- Goals
  user_goals JSONB
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
    WHEN v_total_workouts < 200 THEN 'advanced'
    ELSE 'expert'
  END;

  -- Calculate workouts this week
  SELECT COUNT(*) INTO v_workouts_this_week
  FROM workout_completions
  WHERE user_id = p_user_id
    AND completed_at >= date_trunc('week', NOW());

  -- Calculate workouts this month
  SELECT COUNT(*) INTO v_workouts_this_month
  FROM workout_completions
  WHERE user_id = p_user_id
    AND completed_at >= date_trunc('month', NOW());

  -- Calculate average workout duration
  SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/60)::INTEGER
  INTO v_avg_duration
  FROM workout_completions
  WHERE user_id = p_user_id
    AND started_at IS NOT NULL
    AND completed_at IS NOT NULL;

  -- Get favorite workout types
  SELECT ARRAY_AGG(DISTINCT w.type ORDER BY w.type)
  INTO v_favorite_types
  FROM (
    SELECT w.type, COUNT(*) as count
    FROM workout_completions wc
    JOIN workouts w ON wc.workout_id = w.id
    WHERE wc.user_id = p_user_id
    GROUP BY w.type
    ORDER BY count DESC
    LIMIT 3
  ) w;

  RETURN QUERY
  SELECT
    -- Profile data
    (SELECT to_jsonb(p.*) FROM profiles p WHERE p.id = p_user_id) as profile_data,

    -- Experience level
    v_experience_level as experience_level,

    -- Workout statistics
    v_total_workouts as total_workouts,
    v_workouts_this_week as workouts_this_week,
    v_workouts_this_month as workouts_this_month,
    COALESCE(v_avg_duration, 0) as avg_workout_duration,
    COALESCE(v_favorite_types, ARRAY[]::TEXT[]) as favorite_workout_types,

    -- Recent workouts with details
    (SELECT jsonb_agg(
      jsonb_build_object(
        'id', wc.id,
        'completed_at', wc.completed_at,
        'started_at', wc.started_at,
        'notes', wc.notes,
        'rating', wc.rating,
        'duration_seconds', wc.duration_seconds,
        'workout', jsonb_build_object(
          'id', w.id,
          'name', w.name,
          'type', w.type,
          'goal', w.goal,
          'difficulty', w.difficulty
        )
      ) ORDER BY wc.completed_at DESC
    )
    FROM workout_completions wc
    JOIN workouts w ON wc.workout_id = w.id
    WHERE wc.user_id = p_user_id
    LIMIT 10) as recent_workouts,

    -- Personal records
    (SELECT jsonb_agg(
      jsonb_build_object(
        'exercise_name', e.name,
        'record_type', pr.record_type,
        'value', pr.value,
        'unit', pr.unit,
        'achieved_date', pr.achieved_date,
        'notes', pr.notes
      ) ORDER BY pr.achieved_date DESC
    )
    FROM personal_records pr
    JOIN exercises e ON pr.exercise_id = e.id
    WHERE pr.user_id = p_user_id
    LIMIT 10) as personal_records,

    -- Workout patterns (day of week distribution)
    (SELECT jsonb_build_object(
      'by_day_of_week', (
        SELECT jsonb_object_agg(
          day_name,
          count
        )
        FROM (
          SELECT
            to_char(completed_at, 'Day') as day_name,
            COUNT(*) as count
          FROM workout_completions
          WHERE user_id = p_user_id
            AND completed_at >= NOW() - INTERVAL '30 days'
          GROUP BY to_char(completed_at, 'Day')
        ) dow
      ),
      'by_time_of_day', (
        SELECT jsonb_object_agg(
          time_period,
          count
        )
        FROM (
          SELECT
            CASE
              WHEN EXTRACT(HOUR FROM completed_at) < 6 THEN 'early_morning'
              WHEN EXTRACT(HOUR FROM completed_at) < 12 THEN 'morning'
              WHEN EXTRACT(HOUR FROM completed_at) < 17 THEN 'afternoon'
              WHEN EXTRACT(HOUR FROM completed_at) < 21 THEN 'evening'
              ELSE 'night'
            END as time_period,
            COUNT(*) as count
          FROM workout_completions
          WHERE user_id = p_user_id
            AND completed_at >= NOW() - INTERVAL '30 days'
          GROUP BY time_period
        ) tod
      )
    )) as workout_patterns,

    -- Strava activities
    (SELECT jsonb_agg(
      jsonb_build_object(
        'id', a.id,
        'name', a.name,
        'type', a.type,
        'start_date', a.start_date,
        'distance', a.distance,
        'moving_time', a.moving_time,
        'total_elevation_gain', a.total_elevation_gain,
        'average_speed', a.average_speed,
        'max_speed', a.max_speed,
        'average_heartrate', a.average_heartrate,
        'max_heartrate', a.max_heartrate,
        'calories', a.calories
      ) ORDER BY a.start_date DESC
    )
    FROM activities a
    WHERE a.user_id = p_user_id
      AND a.source = 'strava'
    LIMIT 20) as strava_activities,

    -- Favorite workouts
    (SELECT jsonb_agg(
      jsonb_build_object(
        'workout_id', fw.workout_id,
        'workout_name', w.name,
        'workout_type', w.type,
        'favorited_at', fw.created_at
      ) ORDER BY fw.created_at DESC
    )
    FROM favorite_workouts fw
    JOIN workouts w ON fw.workout_id = w.id
    WHERE fw.user_id = p_user_id) as favorite_workouts_list,

    -- Progress trends (last 30 days vs previous 30 days)
    (SELECT jsonb_build_object(
      'workout_frequency_trend', (
        SELECT CASE
          WHEN recent.count > previous.count THEN 'increasing'
          WHEN recent.count < previous.count THEN 'decreasing'
          ELSE 'stable'
        END
        FROM (
          SELECT COUNT(*) as count
          FROM workout_completions
          WHERE user_id = p_user_id
            AND completed_at >= NOW() - INTERVAL '30 days'
        ) recent,
        (
          SELECT COUNT(*) as count
          FROM workout_completions
          WHERE user_id = p_user_id
            AND completed_at >= NOW() - INTERVAL '60 days'
            AND completed_at < NOW() - INTERVAL '30 days'
        ) previous
      ),
      'avg_rating_trend', (
        SELECT jsonb_build_object(
          'recent', AVG(rating),
          'previous', (
            SELECT AVG(rating)
            FROM workout_completions
            WHERE user_id = p_user_id
              AND completed_at >= NOW() - INTERVAL '60 days'
              AND completed_at < NOW() - INTERVAL '30 days'
              AND rating IS NOT NULL
          )
        )
        FROM workout_completions
        WHERE user_id = p_user_id
          AND completed_at >= NOW() - INTERVAL '30 days'
          AND rating IS NOT NULL
      ),
      'personal_records_last_30_days', (
        SELECT COUNT(*)
        FROM personal_records
        WHERE user_id = p_user_id
          AND achieved_date >= NOW() - INTERVAL '30 days'
      )
    )) as progress_trends,

    -- User goals
    (SELECT jsonb_agg(
      jsonb_build_object(
        'id', g.id,
        'title', g.title,
        'description', g.description,
        'target_value', g.target_value,
        'target_unit', g.target_unit,
        'target_date', g.target_date,
        'status', g.status,
        'progress', g.progress,
        'category', g.category
      ) ORDER BY g.created_at DESC
    )
    FROM goals g
    WHERE g.user_id = p_user_id
      AND g.status != 'archived') as user_goals;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;