-- Complete missing schema elements for comprehensive activity tracking
-- This migration adds all missing columns and tables from the comprehensive activity system

-- 1. Drop existing activities table to rebuild with all comprehensive fields
DROP TABLE IF EXISTS activity_segments CASCADE;
DROP TABLE IF EXISTS activity_streams CASCADE;
DROP TABLE IF EXISTS activities CASCADE;

-- 2. Create comprehensive activities table with ALL sport-specific fields
CREATE TABLE activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Source tracking
  source TEXT NOT NULL CHECK (source IN ('strava', 'garmin', 'manual', 'apple', 'fitbit', 'polar', 'suunto', 'wahoo')),
  external_id TEXT,

  -- Basic activity information
  name TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  sport_type TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  timezone TEXT,
  utc_offset INTEGER,

  -- Time metrics
  elapsed_time_seconds INTEGER NOT NULL,
  moving_time_seconds INTEGER,

  -- Distance and speed metrics
  distance_meters DECIMAL(10,2),
  average_speed DECIMAL(10,3),
  max_speed DECIMAL(10,3),

  -- Elevation metrics
  total_elevation_gain DECIMAL(10,2),
  total_elevation_loss DECIMAL(10,2),
  elevation_high DECIMAL(10,2),
  elevation_low DECIMAL(10,2),

  -- Heart rate metrics
  average_heartrate INTEGER,
  max_heartrate INTEGER,
  min_heartrate INTEGER,
  heartrate_zones JSONB,

  -- Power metrics (cycling)
  average_power DECIMAL(10,2),
  max_power INTEGER,
  normalized_power DECIMAL(10,2),
  intensity_factor DECIMAL(5,3),
  tss DECIMAL(10,2),
  power_zones JSONB,
  kilojoules DECIMAL(10,2),

  -- Cadence metrics
  average_cadence DECIMAL(10,2),
  max_cadence INTEGER,

  -- Running specific metrics
  average_stride_length DECIMAL(5,2),
  average_vertical_oscillation DECIMAL(5,2),
  average_ground_contact_time INTEGER,
  average_ground_contact_balance DECIMAL(5,2),
  average_vertical_ratio DECIMAL(5,2),

  -- Swimming specific metrics
  pool_length DECIMAL(10,2),
  total_strokes INTEGER,
  average_stroke_rate DECIMAL(10,2),
  average_swolf DECIMAL(10,2),
  lap_count INTEGER,

  -- Strength training metrics
  total_reps INTEGER,
  total_sets INTEGER,
  total_weight_lifted_kg DECIMAL(10,2),
  exercise_count INTEGER,
  muscle_groups TEXT[],

  -- Tennis specific metrics
  total_shots INTEGER,
  forehand_count INTEGER,
  backhand_count INTEGER,
  serve_count INTEGER,
  volley_count INTEGER,
  winner_count INTEGER,
  unforced_error_count INTEGER,
  ace_count INTEGER,
  double_fault_count INTEGER,
  first_serve_percentage DECIMAL(5,2),
  points_won_percentage DECIMAL(5,2),
  match_duration_minutes INTEGER,
  sets_played INTEGER,
  games_played INTEGER,

  -- Rowing specific metrics
  average_distance_per_stroke DECIMAL(10,2),
  average_split_time INTEGER,

  -- Yoga/Flexibility metrics
  poses_held INTEGER,
  average_hold_duration INTEGER,
  flexibility_score INTEGER,

  -- Performance metrics
  calories INTEGER,
  active_calories INTEGER,
  training_load DECIMAL(10,2),
  aerobic_training_effect DECIMAL(5,2),
  anaerobic_training_effect DECIMAL(5,2),
  recovery_time_hours INTEGER,
  vo2max_estimate DECIMAL(5,2),
  fitness_level INTEGER,

  -- Subjective metrics
  perceived_exertion INTEGER CHECK (perceived_exertion BETWEEN 1 AND 10),
  mood TEXT CHECK (mood IN ('terrible', 'bad', 'okay', 'good', 'amazing')),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  soreness_level INTEGER CHECK (soreness_level BETWEEN 0 AND 10),
  stress_level INTEGER CHECK (stress_level BETWEEN 0 AND 10),
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 10),
  workout_rating INTEGER CHECK (workout_rating BETWEEN 1 AND 5),

  -- Environmental conditions
  weather_conditions TEXT,
  temperature_celsius DECIMAL(5,2),
  humidity_percentage INTEGER,
  wind_speed_kmh DECIMAL(5,2),
  wind_direction INTEGER,
  precipitation TEXT,
  air_quality_index INTEGER,
  indoor BOOLEAN DEFAULT false,

  -- Equipment and location
  gear_id TEXT,
  location TEXT,
  route_name TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  start_lat DECIMAL(10,6),
  start_lng DECIMAL(10,6),
  end_lat DECIMAL(10,6),
  end_lng DECIMAL(10,6),

  -- Workout link
  workout_id INTEGER REFERENCES workouts(id),

  -- Media and notes
  notes TEXT,
  private_notes TEXT,
  photos TEXT[],
  videos TEXT[],
  map_polyline TEXT,

  -- Social features
  kudos_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  photo_count INTEGER DEFAULT 0,

  -- Privacy
  visibility TEXT CHECK (visibility IN ('private', 'followers', 'public')) DEFAULT 'private',

  -- Analysis flags
  commute BOOLEAN DEFAULT false,
  trainer BOOLEAN DEFAULT false,
  race BOOLEAN DEFAULT false,
  workout_type TEXT,

  -- Weather data (legacy compatibility)
  weather_data JSONB,

  -- Raw data storage
  raw_data JSONB,
  laps JSONB,
  splits JSONB,
  segments JSONB,

  -- Metadata
  device_name TEXT,
  device_manufacturer TEXT,
  upload_source TEXT,
  file_format TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  synced_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT unique_activity_per_source UNIQUE(user_id, source, external_id)
);

-- 3. Recreate activity_segments with enhanced fields
CREATE TABLE activity_segments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  segment_type TEXT NOT NULL CHECK (segment_type IN ('lap', 'interval', 'set', 'split', 'circuit', 'round')),
  segment_index INTEGER NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE,
  elapsed_time_seconds INTEGER,
  moving_time_seconds INTEGER,
  distance_meters DECIMAL(10,2),
  average_speed DECIMAL(10,3),
  max_speed DECIMAL(10,3),
  average_pace TEXT,
  average_heartrate INTEGER,
  max_heartrate INTEGER,
  min_heartrate INTEGER,
  exercise_name TEXT,
  reps INTEGER,
  weight_kg DECIMAL(10,2),
  average_cadence DECIMAL(10,2),
  average_power DECIMAL(10,2),
  normalized_power DECIMAL(10,2),
  calories INTEGER,
  elevation_gain DECIMAL(10,2),
  elevation_loss DECIMAL(10,2),
  average_stroke_rate DECIMAL(10,2),
  stroke_count INTEGER,
  notes TEXT,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT unique_activity_segment UNIQUE(activity_id, segment_type, segment_index)
);

-- 4. Recreate activity_streams with enhanced support
CREATE TABLE activity_streams (
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  stream_type TEXT NOT NULL CHECK (stream_type IN (
    'heartrate', 'cadence', 'power', 'speed', 'altitude', 'distance',
    'temperature', 'grade', 'battery', 'calories', 'lap_time', 'moving'
  )),
  data_points JSONB NOT NULL,
  data_type TEXT CHECK (data_type IN ('integer', 'float', 'boolean', 'string')),
  resolution TEXT CHECK (resolution IN ('high', 'medium', 'low', 'raw')),
  original_size INTEGER,
  series_type TEXT CHECK (series_type IN ('time', 'distance')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT activity_streams_pkey PRIMARY KEY (activity_id, stream_type)
);

-- 5. Create activity_workout_links table
CREATE TABLE IF NOT EXISTS activity_workout_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE NOT NULL,
  custom_workout_id UUID,
  standard_workout_id INTEGER REFERENCES workouts(id) ON DELETE CASCADE,
  link_type TEXT CHECK (link_type IN ('automatic', 'manual', 'suggested')) DEFAULT 'manual',
  confidence_score DECIMAL(3,2),
  match_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT at_least_one_workout CHECK (
    custom_workout_id IS NOT NULL OR standard_workout_id IS NOT NULL
  ),
  CONSTRAINT unique_activity_workout_link UNIQUE(activity_id, custom_workout_id, standard_workout_id)
);

-- 6. Update garmin_connections table with missing fields
ALTER TABLE garmin_connections
ADD COLUMN IF NOT EXISTS garmin_email TEXT,
ADD COLUMN IF NOT EXISTS encrypted_password TEXT,
ADD COLUMN IF NOT EXISTS sync_error TEXT;

-- 7. Create user_custom_workouts table if missing (referenced by activity_workout_links)
CREATE TABLE IF NOT EXISTS user_custom_workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  exercises JSONB,
  duration_minutes INTEGER,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  tags TEXT[],
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_start_date ON activities(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_activity_type ON activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_sport_type ON activities(sport_type);
CREATE INDEX IF NOT EXISTS idx_activities_source ON activities(source);
CREATE INDEX IF NOT EXISTS idx_activities_external_id ON activities(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activities_user_source_date ON activities(user_id, source, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user_date ON activities(user_id, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user_type ON activities(user_id, activity_type, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_workout_id ON activities(workout_id) WHERE workout_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activity_segments_activity ON activity_segments(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_segments_type ON activity_segments(segment_type);

CREATE INDEX IF NOT EXISTS idx_activity_streams_activity ON activity_streams(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_streams_type ON activity_streams(stream_type);

CREATE INDEX IF NOT EXISTS idx_activity_workout_links_user ON activity_workout_links(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_workout_links_activity ON activity_workout_links(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_workout_links_custom ON activity_workout_links(custom_workout_id) WHERE custom_workout_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activity_workout_links_standard ON activity_workout_links(standard_workout_id) WHERE standard_workout_id IS NOT NULL;

-- 9. Enable Row Level Security
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_workout_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_custom_workouts ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies
CREATE POLICY "Users can manage their own activities" ON activities
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own segments" ON activity_segments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM activities
      WHERE activities.id = activity_segments.activity_id
      AND activities.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own streams" ON activity_streams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM activities
      WHERE activities.id = activity_streams.activity_id
      AND activities.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own workout links" ON activity_workout_links
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own custom workouts" ON user_custom_workouts
  FOR ALL USING (auth.uid() = user_id);

-- 11. Create functions for activity import
CREATE OR REPLACE FUNCTION import_strava_activity(
  p_user_id UUID,
  p_activity_data JSONB
) RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO activities (
    user_id, source, external_id, name, activity_type, sport_type,
    start_date, timezone, elapsed_time_seconds, moving_time_seconds,
    distance_meters, average_speed, max_speed, total_elevation_gain,
    average_heartrate, max_heartrate, average_cadence, calories,
    average_power, kilojoules, trainer, commute, city, state, country,
    raw_data, synced_at
  ) VALUES (
    p_user_id, 'strava', (p_activity_data->>'id')::TEXT,
    p_activity_data->>'name', LOWER(p_activity_data->>'type'),
    LOWER(p_activity_data->>'sport_type'),
    (p_activity_data->>'start_date')::TIMESTAMP WITH TIME ZONE,
    p_activity_data->>'timezone',
    (p_activity_data->>'elapsed_time')::INTEGER,
    (p_activity_data->>'moving_time')::INTEGER,
    (p_activity_data->>'distance')::DECIMAL,
    (p_activity_data->>'average_speed')::DECIMAL,
    (p_activity_data->>'max_speed')::DECIMAL,
    (p_activity_data->>'total_elevation_gain')::DECIMAL,
    (p_activity_data->>'average_heartrate')::INTEGER,
    (p_activity_data->>'max_heartrate')::INTEGER,
    (p_activity_data->>'average_cadence')::DECIMAL,
    (p_activity_data->>'calories')::INTEGER,
    (p_activity_data->>'average_watts')::DECIMAL,
    (p_activity_data->>'kilojoules')::DECIMAL,
    (p_activity_data->>'trainer')::BOOLEAN,
    (p_activity_data->>'commute')::BOOLEAN,
    p_activity_data->>'location_city',
    p_activity_data->>'location_state',
    p_activity_data->>'location_country',
    p_activity_data, NOW()
  )
  ON CONFLICT (user_id, source, external_id)
  DO UPDATE SET
    name = EXCLUDED.name,
    raw_data = EXCLUDED.raw_data,
    synced_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_activity_id;

  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION import_garmin_activity(
  p_user_id UUID,
  p_activity_data JSONB
) RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO activities (
    user_id, source, external_id, name, activity_type, sport_type,
    start_date, elapsed_time_seconds, moving_time_seconds,
    distance_meters, average_speed, max_speed, total_elevation_gain,
    elevation_high, elevation_low, average_heartrate, max_heartrate,
    min_heartrate, average_power, max_power, normalized_power,
    intensity_factor, tss, average_cadence, max_cadence, calories,
    training_load, aerobic_training_effect, anaerobic_training_effect,
    vo2max_estimate, average_stride_length, average_vertical_oscillation,
    average_ground_contact_time, average_ground_contact_balance,
    average_vertical_ratio, device_name, raw_data, synced_at
  ) VALUES (
    p_user_id, 'garmin', (p_activity_data->>'activityId')::TEXT,
    COALESCE(p_activity_data->>'activityName', p_activity_data->'activityType'->>'typeKey'),
    LOWER(p_activity_data->'activityType'->>'typeKey'),
    LOWER(p_activity_data->'eventType'->>'typeKey'),
    (p_activity_data->>'startTimeLocal')::TIMESTAMP WITH TIME ZONE,
    (p_activity_data->>'duration')::INTEGER,
    (p_activity_data->>'movingDuration')::INTEGER,
    (p_activity_data->>'distance')::DECIMAL,
    (p_activity_data->>'averageSpeed')::DECIMAL,
    (p_activity_data->>'maxSpeed')::DECIMAL,
    (p_activity_data->>'elevationGain')::DECIMAL,
    (p_activity_data->>'maxElevation')::DECIMAL,
    (p_activity_data->>'minElevation')::DECIMAL,
    (p_activity_data->>'averageHR')::INTEGER,
    (p_activity_data->>'maxHR')::INTEGER,
    (p_activity_data->>'minHR')::INTEGER,
    (p_activity_data->>'avgPower')::DECIMAL,
    (p_activity_data->>'maxPower')::INTEGER,
    (p_activity_data->>'normPower')::DECIMAL,
    (p_activity_data->>'intensityFactor')::DECIMAL,
    (p_activity_data->>'trainingStressScore')::DECIMAL,
    (p_activity_data->>'averageCadence')::DECIMAL,
    (p_activity_data->>'maxCadence')::INTEGER,
    (p_activity_data->>'calories')::INTEGER,
    (p_activity_data->>'trainingLoad')::DECIMAL,
    (p_activity_data->>'aerobicTrainingEffect')::DECIMAL,
    (p_activity_data->>'anaerobicTrainingEffect')::DECIMAL,
    (p_activity_data->>'vO2MaxValue')::DECIMAL,
    (p_activity_data->>'avgStrideLength')::DECIMAL / 100,
    (p_activity_data->>'avgVerticalOscillation')::DECIMAL,
    (p_activity_data->>'avgGroundContactTime')::INTEGER,
    (p_activity_data->>'avgGroundContactBalance')::DECIMAL,
    (p_activity_data->>'avgVerticalRatio')::DECIMAL,
    p_activity_data->>'deviceName',
    p_activity_data, NOW()
  )
  ON CONFLICT (user_id, source, external_id)
  DO UPDATE SET
    name = EXCLUDED.name,
    raw_data = EXCLUDED.raw_data,
    synced_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_activity_id;

  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create function for checking duplicate activities
CREATE OR REPLACE FUNCTION check_duplicate_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for duplicate activities based on time proximity for manual activities
  IF NEW.source = 'manual' THEN
    IF EXISTS (
      SELECT 1 FROM activities
      WHERE user_id = NEW.user_id
      AND source = 'manual'
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND activity_type = NEW.activity_type
      AND ABS(EXTRACT(EPOCH FROM (start_date - NEW.start_date))) < 60 -- Within 1 minute
      AND ABS(COALESCE(elapsed_time_seconds, 0) - COALESCE(NEW.elapsed_time_seconds, 0)) < 10 -- Similar duration
    ) THEN
      RAISE EXCEPTION 'Duplicate activity detected. A similar manual activity already exists at this time.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 13. Create trigger for duplicate checking
CREATE TRIGGER check_activity_duplicates
  BEFORE INSERT OR UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION check_duplicate_activity();

-- 14. Grant permissions
GRANT ALL ON activities TO authenticated;
GRANT ALL ON activity_segments TO authenticated;
GRANT ALL ON activity_streams TO authenticated;
GRANT ALL ON activity_workout_links TO authenticated;
GRANT ALL ON user_custom_workouts TO authenticated;
GRANT EXECUTE ON FUNCTION import_strava_activity TO authenticated;
GRANT EXECUTE ON FUNCTION import_garmin_activity TO authenticated;
GRANT EXECUTE ON FUNCTION check_duplicate_activity TO authenticated;