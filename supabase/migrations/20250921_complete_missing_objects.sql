-- Migration: Complete Missing Database Objects for Workout Selection
-- Description: Add missing constraints, views, functions, and policies

-- 1. Add missing UNIQUE constraint on favorite_workouts
ALTER TABLE favorite_workouts
ADD CONSTRAINT favorite_workouts_user_workout_unique UNIQUE(user_id, workout_id);

-- 2. Update active_workout_sessions to add missing unique constraint
ALTER TABLE active_workout_sessions
ADD CONSTRAINT active_workout_sessions_user_workout_unique UNIQUE(user_id, user_workout_id);

-- 3. Create missing views

-- Popular workouts view
CREATE OR REPLACE VIEW popular_workouts AS
SELECT
  w.*,
  COUNT(DISTINCT uw.user_id) as unique_users,
  COUNT(DISTINCT wc.id) as completion_count,
  AVG(wc.workout_rating) as avg_rating
FROM workouts w
LEFT JOIN user_workouts uw ON uw.workout_id = w.id
LEFT JOIN workout_completions wc ON wc.workout_id = w.id
GROUP BY w.id
ORDER BY COUNT(DISTINCT wc.id) DESC, AVG(wc.workout_rating) DESC;

-- User's favorite workouts view
CREATE OR REPLACE VIEW user_favorite_workouts AS
SELECT
  fw.user_id,
  w.*,
  fw.created_at as favorited_at
FROM favorite_workouts fw
JOIN workouts w ON w.id = fw.workout_id;

-- Active sessions view
CREATE OR REPLACE VIEW user_active_sessions AS
SELECT
  aws.*,
  w.name as workout_name,
  w.type as workout_type,
  w.difficulty,
  p.full_name as user_name
FROM active_workout_sessions aws
JOIN workouts w ON w.id = aws.workout_id
JOIN profiles p ON p.id = aws.user_id
WHERE aws.status IN ('active', 'paused');

-- 4. Create missing functions

-- Function to toggle favorite workout
CREATE OR REPLACE FUNCTION toggle_favorite_workout(
  p_user_id UUID,
  p_workout_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
  v_is_favorite BOOLEAN;
BEGIN
  -- Check if already favorited
  SELECT EXISTS(
    SELECT 1 FROM favorite_workouts
    WHERE user_id = p_user_id AND workout_id = p_workout_id
  ) INTO v_exists;

  IF v_exists THEN
    -- Remove from favorites
    DELETE FROM favorite_workouts
    WHERE user_id = p_user_id AND workout_id = p_workout_id;
    v_is_favorite := FALSE;
  ELSE
    -- Add to favorites
    INSERT INTO favorite_workouts (user_id, workout_id)
    VALUES (p_user_id, p_workout_id);
    v_is_favorite := TRUE;
  END IF;

  RETURN v_is_favorite;
END;
$$ LANGUAGE plpgsql;

-- Function to start workout session
CREATE OR REPLACE FUNCTION start_workout_session(
  p_user_id UUID,
  p_workout_id INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_user_workout_id INTEGER;
  v_session_id INTEGER;
BEGIN
  -- Create user_workout entry
  INSERT INTO user_workouts (user_id, workout_id, scheduled_date, status, started_at)
  VALUES (p_user_id, p_workout_id, CURRENT_DATE, 'active', NOW())
  RETURNING id INTO v_user_workout_id;

  -- Create active session
  INSERT INTO active_workout_sessions (
    user_id,
    user_workout_id,
    workout_id,
    status
  )
  VALUES (p_user_id, v_user_workout_id, p_workout_id, 'active')
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to pause/resume workout
CREATE OR REPLACE FUNCTION toggle_workout_pause(
  p_session_id INTEGER
) RETURNS TEXT AS $$
DECLARE
  v_current_status TEXT;
  v_new_status TEXT;
  v_pause_duration INTEGER;
BEGIN
  -- Get current status
  SELECT status INTO v_current_status
  FROM active_workout_sessions
  WHERE id = p_session_id;

  IF v_current_status = 'active' THEN
    -- Pause workout
    UPDATE active_workout_sessions
    SET status = 'paused',
        paused_at = NOW(),
        updated_at = NOW()
    WHERE id = p_session_id;

    v_new_status := 'paused';

  ELSIF v_current_status = 'paused' THEN
    -- Calculate pause duration
    SELECT EXTRACT(EPOCH FROM (NOW() - paused_at))::INTEGER
    INTO v_pause_duration
    FROM active_workout_sessions
    WHERE id = p_session_id;

    -- Resume workout
    UPDATE active_workout_sessions
    SET status = 'active',
        resumed_at = NOW(),
        total_pause_duration_seconds = total_pause_duration_seconds + v_pause_duration,
        updated_at = NOW()
    WHERE id = p_session_id;

    v_new_status := 'active';
  END IF;

  RETURN v_new_status;
END;
$$ LANGUAGE plpgsql;

-- Function to search workouts with filters
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

-- 5. Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_favorite_workouts_user_id ON favorite_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_workouts_workout_id ON favorite_workouts(workout_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_status ON active_workout_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_workouts_status ON user_workouts(status);
CREATE INDEX IF NOT EXISTS idx_workout_completions_rating ON workout_completions(workout_rating);
CREATE INDEX IF NOT EXISTS idx_set_performances_session ON set_performances(session_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_order ON workout_exercises(workout_id, order_index);

-- 6. Update sample data for workout descriptions (only where NULL)
UPDATE workouts SET
  description = CASE
    WHEN type = 'push' THEN 'Chest, shoulders, and triceps focused workout for upper body strength'
    WHEN type = 'pull' THEN 'Back and biceps workout for a stronger posterior chain'
    WHEN type = 'legs' THEN 'Complete lower body workout targeting quads, hamstrings, and glutes'
    WHEN type = 'upper' THEN 'Comprehensive upper body session hitting all major muscle groups'
    WHEN type = 'lower' THEN 'Intense lower body training for strength and muscle growth'
    WHEN type = 'full_body' THEN 'Total body workout perfect for overall fitness'
    WHEN type = 'core' THEN 'Core strengthening workout for stability and abs'
    WHEN type = 'arms' THEN 'Targeted arm workout for biceps and triceps development'
    WHEN type = 'shoulders' THEN 'Shoulder-focused workout for deltoid development'
    WHEN type = 'chest' THEN 'Chest-focused workout for pectoral strength'
    WHEN type = 'back' THEN 'Back-focused workout for lat and rhomboid development'
    WHEN type = 'cardio' THEN 'High-intensity cardio workout for endurance'
    ELSE 'High-intensity workout for strength and conditioning'
  END
WHERE description IS NULL;

-- Update duration estimates based on difficulty if not set
UPDATE workouts SET
  estimated_duration_minutes = COALESCE(
    estimated_duration_minutes,
    duration_minutes,
    CASE
      WHEN difficulty = 'beginner' THEN 30
      WHEN difficulty = 'intermediate' THEN 45
      WHEN difficulty = 'advanced' THEN 60
      ELSE 45
    END
  )
WHERE estimated_duration_minutes IS NULL;

-- 7. Enable RLS on tables
ALTER TABLE favorite_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE set_performances ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_tags ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS Policies

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own favorites" ON favorite_workouts;
DROP POLICY IF EXISTS "Users can view own active sessions" ON active_workout_sessions;
DROP POLICY IF EXISTS "Users can manage own sessions" ON active_workout_sessions;
DROP POLICY IF EXISTS "Users can manage own set performances" ON set_performances;
DROP POLICY IF EXISTS "Everyone can view workout tags" ON workout_tags;

-- Favorite workouts policies
CREATE POLICY "Users can manage their own favorites" ON favorite_workouts
  FOR ALL USING (auth.uid() = user_id);

-- Active sessions policies
CREATE POLICY "Users can view own active sessions" ON active_workout_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sessions" ON active_workout_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Set performances policies
CREATE POLICY "Users can manage own set performances" ON set_performances
  FOR ALL USING (auth.uid() = user_id);

-- Workout tags policies (public read)
CREATE POLICY "Everyone can view workout tags" ON workout_tags
  FOR SELECT USING (true);

-- 9. Grant permissions
GRANT SELECT, INSERT, DELETE ON favorite_workouts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON active_workout_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON set_performances TO authenticated;
GRANT SELECT ON workout_tags TO authenticated;
GRANT SELECT ON workout_workout_tags TO authenticated;
GRANT SELECT ON popular_workouts TO authenticated;
GRANT SELECT ON user_favorite_workouts TO authenticated;
GRANT SELECT ON user_active_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_favorite_workout TO authenticated;
GRANT EXECUTE ON FUNCTION start_workout_session TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_workout_pause TO authenticated;
GRANT EXECUTE ON FUNCTION search_workouts TO authenticated;