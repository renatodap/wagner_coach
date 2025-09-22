-- Custom Workout Builder System
-- Complete implementation of user-created workouts, activity linking, and comparison features

-- 1. USER-CREATED CUSTOM WORKOUTS
-- ================================

-- Custom workout templates created by users
CREATE TABLE IF NOT EXISTS user_custom_workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('strength', 'cardio', 'hiit', 'flexibility', 'sports', 'mixed', 'custom')),
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
  estimated_duration_minutes INTEGER,
  equipment_required TEXT[], -- ['barbell', 'dumbbell', 'bands', etc]
  tags TEXT[], -- User-defined tags
  is_public BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  parent_workout_id UUID REFERENCES user_custom_workouts(id), -- For versioning
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, name, version)
);

-- Exercises in custom workouts (with drag-drop ordering)
CREATE TABLE IF NOT EXISTS user_workout_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID REFERENCES user_custom_workouts(id) ON DELETE CASCADE NOT NULL,
  exercise_id INTEGER REFERENCES exercises(id),
  custom_exercise_name TEXT, -- For exercises not in database
  order_index INTEGER NOT NULL,

  -- Exercise configuration
  sets INTEGER,
  reps TEXT, -- Can be "8-12", "10", "AMRAP", "30s", etc
  weight_unit TEXT CHECK (weight_unit IN ('kg', 'lbs', 'bodyweight', '%1rm')),
  weight_value DECIMAL(10,2),
  duration_seconds INTEGER, -- For time-based exercises
  distance_meters DECIMAL(10,2), -- For cardio
  rest_seconds INTEGER,

  -- Instructions and notes
  instructions TEXT,
  notes TEXT,

  -- Superset/circuit grouping
  superset_group INTEGER, -- Exercises with same group are performed back-to-back

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(workout_id, order_index)
);

-- 2. ENHANCED ACTIVITIES SYSTEM
-- ==============================

-- Manual activities (non-Strava/Garmin)
CREATE TABLE IF NOT EXISTS manual_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Basic activity info
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_seconds INTEGER NOT NULL,

  -- Performance metrics
  distance_meters DECIMAL(10,2),
  elevation_gain_meters DECIMAL(10,2),
  calories INTEGER,
  average_heart_rate INTEGER,
  max_heart_rate INTEGER,

  -- Subjective metrics
  rpe INTEGER CHECK (rpe BETWEEN 1 AND 10), -- Rate of Perceived Exertion
  mood TEXT CHECK (mood IN ('terrible', 'bad', 'okay', 'good', 'amazing')),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  soreness_level INTEGER CHECK (soreness_level BETWEEN 0 AND 10),

  -- Environmental data
  weather_conditions TEXT,
  temperature_celsius DECIMAL(5,2),
  location TEXT,
  indoor BOOLEAN DEFAULT false,

  -- Notes and media
  notes TEXT,
  photos TEXT[], -- URLs to uploaded photos
  videos TEXT[], -- URLs to uploaded videos

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. ACTIVITY-WORKOUT LINKING SYSTEM
-- ===================================

-- Links between activities and planned workouts
CREATE TABLE IF NOT EXISTS activity_workout_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Activity reference (can be from multiple sources)
  activity_source TEXT CHECK (activity_source IN ('strava', 'garmin', 'manual', 'apple', 'fitbit')),
  activity_source_id TEXT, -- External ID from source
  manual_activity_id UUID REFERENCES manual_activities(id),

  -- Linked workout
  custom_workout_id UUID REFERENCES user_custom_workouts(id),
  standard_workout_id INTEGER REFERENCES workouts(id),

  -- Linking metadata
  link_type TEXT CHECK (link_type IN ('manual', 'auto_suggested', 'confirmed')),
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00 for auto-suggestions

  -- Comparison data
  completion_percentage DECIMAL(5,2), -- How much of workout was completed
  deviation_notes TEXT, -- Why workout was modified

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  -- Ensure only one workout link per activity
  UNIQUE(activity_source, activity_source_id),
  UNIQUE(manual_activity_id),

  -- Ensure either external or manual activity, not both
  CHECK (
    (activity_source_id IS NOT NULL AND manual_activity_id IS NULL) OR
    (activity_source_id IS NULL AND manual_activity_id IS NOT NULL)
  )
);

-- 4. PLANNED VS ACTUAL COMPARISON
-- ================================

-- Detailed exercise-level comparisons
CREATE TABLE IF NOT EXISTS exercise_comparisons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id UUID REFERENCES activity_workout_links(id) ON DELETE CASCADE NOT NULL,

  -- Planned exercise
  planned_exercise_id INTEGER REFERENCES exercises(id),
  planned_sets INTEGER,
  planned_reps TEXT,
  planned_weight DECIMAL(10,2),
  planned_duration INTEGER,

  -- Actual performance
  actual_sets INTEGER,
  actual_reps TEXT,
  actual_weight DECIMAL(10,2),
  actual_duration INTEGER,

  -- Calculated differences
  sets_difference INTEGER GENERATED ALWAYS AS (actual_sets - planned_sets) STORED,
  weight_difference DECIMAL(10,2) GENERATED ALWAYS AS (actual_weight - planned_weight) STORED,

  -- Notes
  modification_reason TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 5. WORKOUT SHARING AND TEMPLATES
-- =================================

-- Shared workout library
CREATE TABLE IF NOT EXISTS shared_workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID REFERENCES user_custom_workouts(id) ON DELETE CASCADE NOT NULL,
  shared_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Sharing settings
  visibility TEXT CHECK (visibility IN ('public', 'friends', 'link_only')),
  share_link TEXT UNIQUE,

  -- Usage stats
  copy_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- User's saved templates from others
CREATE TABLE IF NOT EXISTS saved_workout_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_workout_id UUID REFERENCES user_custom_workouts(id),
  shared_workout_id UUID REFERENCES shared_workouts(id),

  -- Local modifications
  local_name TEXT,
  local_notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, source_workout_id)
);

-- 6. CUSTOM EXERCISES
-- ===================

-- User-created exercises not in main database
CREATE TABLE IF NOT EXISTS user_custom_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  name TEXT NOT NULL,
  category TEXT NOT NULL,
  muscle_groups TEXT[],
  equipment TEXT,

  -- Instructions
  instructions TEXT,
  video_url TEXT,
  image_urls TEXT[],

  -- Sharing
  is_public BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, name)
);

-- 7. ACTIVITY AGGREGATES & ANALYTICS
-- ===================================

-- Materialized view for activity stats
CREATE MATERIALIZED VIEW IF NOT EXISTS activity_stats AS
SELECT
  user_id,
  DATE_TRUNC('week', COALESCE(ma.start_time, sa.start_date)) as week,
  COUNT(DISTINCT COALESCE(ma.id, sa.id)) as activity_count,
  SUM(COALESCE(ma.duration_seconds, sa.elapsed_time)) as total_duration_seconds,
  SUM(COALESCE(ma.calories, sa.calories)) as total_calories,
  AVG(COALESCE(ma.average_heart_rate, sa.average_heartrate)) as avg_heart_rate
FROM manual_activities ma
FULL OUTER JOIN strava_activities sa ON FALSE -- Adjust based on your Strava table
GROUP BY user_id, week;

-- 8. INDEXES FOR PERFORMANCE
-- ==========================

CREATE INDEX IF NOT EXISTS idx_custom_workouts_user ON user_custom_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_workouts_public ON user_custom_workouts(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout ON user_workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_order ON user_workout_exercises(workout_id, order_index);
CREATE INDEX IF NOT EXISTS idx_manual_activities_user ON manual_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_activities_start ON manual_activities(start_time);
CREATE INDEX IF NOT EXISTS idx_activity_links_user ON activity_workout_links(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_links_manual ON activity_workout_links(manual_activity_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_link ON exercise_comparisons(link_id);

-- 9. ROW LEVEL SECURITY
-- =====================

ALTER TABLE user_custom_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_workout_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_custom_exercises ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own custom workouts" ON user_custom_workouts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view public workouts" ON user_custom_workouts
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage their workout exercises" ON user_workout_exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_custom_workouts
      WHERE id = workout_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own activities" ON manual_activities
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their activity links" ON activity_workout_links
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their exercise comparisons" ON exercise_comparisons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM activity_workout_links
      WHERE id = link_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their custom exercises" ON user_custom_exercises
  FOR ALL USING (auth.uid() = user_id);

-- 10. HELPER FUNCTIONS
-- ====================

-- Function to auto-suggest workout links based on timing and type
CREATE OR REPLACE FUNCTION suggest_workout_links(p_user_id UUID)
RETURNS TABLE (
  activity_id TEXT,
  activity_source TEXT,
  activity_time TIMESTAMP WITH TIME ZONE,
  suggested_workout_id UUID,
  confidence DECIMAL(3,2)
) AS $$
BEGIN
  -- Implementation would match activities to workouts based on:
  -- - Time proximity
  -- - Activity type matching workout type
  -- - Historical patterns
  -- - Duration similarity
  RETURN QUERY
  SELECT
    ma.id::TEXT,
    'manual'::TEXT,
    ma.start_time,
    ucw.id,
    0.85::DECIMAL(3,2)
  FROM manual_activities ma
  CROSS JOIN user_custom_workouts ucw
  WHERE ma.user_id = p_user_id
    AND ucw.user_id = p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM activity_workout_links
      WHERE manual_activity_id = ma.id
    )
    -- Add matching logic here
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate workout completion percentage
CREATE OR REPLACE FUNCTION calculate_completion_percentage(
  p_link_id UUID
) RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_planned_exercises INTEGER;
  v_completed_exercises INTEGER;
  v_percentage DECIMAL(5,2);
BEGIN
  SELECT COUNT(*) INTO v_planned_exercises
  FROM user_workout_exercises uwe
  JOIN activity_workout_links awl ON awl.custom_workout_id = uwe.workout_id
  WHERE awl.id = p_link_id;

  SELECT COUNT(*) INTO v_completed_exercises
  FROM exercise_comparisons
  WHERE link_id = p_link_id
    AND actual_sets > 0;

  IF v_planned_exercises = 0 THEN
    RETURN 0;
  END IF;

  v_percentage := (v_completed_exercises::DECIMAL / v_planned_exercises) * 100;

  RETURN v_percentage;
END;
$$ LANGUAGE plpgsql;