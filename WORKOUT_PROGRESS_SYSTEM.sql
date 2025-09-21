-- Comprehensive Workout Progress Tracking System
-- This migration adds full workout tracking, editing, and deletion capabilities

-- 1. Ensure we have the set_performances table for tracking individual sets
CREATE TABLE IF NOT EXISTS set_performances (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES active_workout_sessions(id) ON DELETE CASCADE,
  exercise_id INTEGER NOT NULL REFERENCES exercises(id),
  set_number INTEGER NOT NULL,
  reps_performed INTEGER,
  weight_used DECIMAL(6,2),
  notes TEXT,
  completed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_set_performances_session_exercise
ON set_performances(session_id, exercise_id);

-- 2. Function to complete a workout session
CREATE OR REPLACE FUNCTION complete_workout_session(
  p_session_id INTEGER,
  p_rating INTEGER DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_workout_id INTEGER;
  v_user_workout_id INTEGER;
  v_start_time TIMESTAMP;
  v_duration_seconds INTEGER;
BEGIN
  -- Get session details
  SELECT user_id, workout_id, user_workout_id, started_at
  INTO v_user_id, v_workout_id, v_user_workout_id, v_start_time
  FROM active_workout_sessions
  WHERE id = p_session_id;

  -- Calculate duration
  v_duration_seconds := EXTRACT(EPOCH FROM (NOW() - v_start_time))::INTEGER;

  -- Update active session to completed
  UPDATE active_workout_sessions
  SET
    status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_session_id;

  -- Update user_workouts
  UPDATE user_workouts
  SET
    status = 'completed',
    completed_at = NOW(),
    duration_seconds = v_duration_seconds
  WHERE id = v_user_workout_id;

  -- Create workout completion record
  INSERT INTO workout_completions (
    user_id,
    workout_id,
    user_workout_id,
    workout_date,
    duration_seconds,
    workout_rating,
    notes
  )
  VALUES (
    v_user_id,
    v_workout_id,
    v_user_workout_id,
    CURRENT_DATE,
    v_duration_seconds,
    p_rating,
    p_notes
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 3. Function to log a set performance
CREATE OR REPLACE FUNCTION log_set_performance(
  p_session_id INTEGER,
  p_exercise_id INTEGER,
  p_set_number INTEGER,
  p_reps INTEGER DEFAULT NULL,
  p_weight DECIMAL DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_performance_id INTEGER;
BEGIN
  -- Insert or update the set performance
  INSERT INTO set_performances (
    session_id,
    exercise_id,
    set_number,
    reps_performed,
    weight_used,
    notes
  )
  VALUES (
    p_session_id,
    p_exercise_id,
    p_set_number,
    p_reps,
    p_weight,
    p_notes
  )
  ON CONFLICT (session_id, exercise_id, set_number)
  DO UPDATE SET
    reps_performed = EXCLUDED.reps_performed,
    weight_used = EXCLUDED.weight_used,
    notes = EXCLUDED.notes,
    completed_at = NOW()
  RETURNING id INTO v_performance_id;

  RETURN v_performance_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Function to get session exercises with progress
CREATE OR REPLACE FUNCTION get_session_exercises(p_session_id INTEGER)
RETURNS TABLE (
  exercise_id INTEGER,
  exercise_name TEXT,
  exercise_category TEXT,
  muscle_group TEXT,
  equipment TEXT,
  sets_planned INTEGER,
  reps_planned TEXT,
  rest_seconds INTEGER,
  order_index INTEGER,
  notes TEXT,
  sets_completed INTEGER,
  last_weight_used DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.name,
    e.category,
    e.muscle_group,
    e.equipment,
    we.sets,
    we.reps,
    we.rest_seconds,
    we.order_index,
    we.notes,
    COUNT(sp.id)::INTEGER as sets_completed,
    MAX(sp.weight_used) as last_weight_used
  FROM active_workout_sessions aws
  JOIN workout_exercises we ON we.workout_id = aws.workout_id
  JOIN exercises e ON e.id = we.exercise_id
  LEFT JOIN set_performances sp ON sp.session_id = p_session_id
    AND sp.exercise_id = e.id
  WHERE aws.id = p_session_id
  GROUP BY e.id, e.name, e.category, e.muscle_group, e.equipment,
    we.sets, we.reps, we.rest_seconds, we.order_index, we.notes
  ORDER BY we.order_index;
END;
$$ LANGUAGE plpgsql;

-- 5. Function to delete a workout from history
CREATE OR REPLACE FUNCTION delete_workout_history(
  p_user_id UUID,
  p_user_workout_id INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
  -- Delete the user_workout (cascades to completions and sessions)
  DELETE FROM user_workouts
  WHERE id = p_user_workout_id AND user_id = p_user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 6. Function to edit a completed workout
CREATE OR REPLACE FUNCTION edit_workout_completion(
  p_completion_id INTEGER,
  p_user_id UUID,
  p_duration_seconds INTEGER DEFAULT NULL,
  p_rating INTEGER DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE workout_completions
  SET
    duration_seconds = COALESCE(p_duration_seconds, duration_seconds),
    workout_rating = COALESCE(p_rating, workout_rating),
    notes = COALESCE(p_notes, notes),
    updated_at = NOW()
  WHERE id = p_completion_id AND user_id = p_user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 7. Function to get user's workout history
CREATE OR REPLACE FUNCTION get_user_workout_history(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
  completion_id INTEGER,
  workout_id INTEGER,
  workout_name TEXT,
  workout_type TEXT,
  completed_at TIMESTAMP,
  duration_seconds INTEGER,
  rating INTEGER,
  notes TEXT,
  sets_performed BIGINT,
  total_weight_lifted DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    wc.id,
    w.id,
    w.name,
    w.type,
    wc.completed_at,
    wc.duration_seconds,
    wc.workout_rating,
    wc.notes,
    COUNT(DISTINCT sp.id) as sets_performed,
    SUM(sp.weight_used * sp.reps_performed) as total_weight_lifted
  FROM workout_completions wc
  JOIN workouts w ON w.id = wc.workout_id
  LEFT JOIN active_workout_sessions aws ON aws.user_workout_id = wc.user_workout_id
  LEFT JOIN set_performances sp ON sp.session_id = aws.id
  WHERE wc.user_id = p_user_id
  GROUP BY wc.id, w.id, w.name, w.type, wc.completed_at,
    wc.duration_seconds, wc.workout_rating, wc.notes
  ORDER BY wc.completed_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 8. Add unique constraint to prevent duplicate set entries
ALTER TABLE set_performances
DROP CONSTRAINT IF EXISTS set_performances_unique;

ALTER TABLE set_performances
ADD CONSTRAINT set_performances_unique
UNIQUE(session_id, exercise_id, set_number);

-- 9. Grant permissions
GRANT ALL ON set_performances TO authenticated;
GRANT EXECUTE ON FUNCTION complete_workout_session TO authenticated;
GRANT EXECUTE ON FUNCTION log_set_performance TO authenticated;
GRANT EXECUTE ON FUNCTION get_session_exercises TO authenticated;
GRANT EXECUTE ON FUNCTION delete_workout_history TO authenticated;
GRANT EXECUTE ON FUNCTION edit_workout_completion TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_workout_history TO authenticated;

-- 10. Test the system
SELECT 'Workout Progress System installed successfully' as status;