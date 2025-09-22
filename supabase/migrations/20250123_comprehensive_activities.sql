-- Comprehensive Activities Schema with All Sport Types and Fields
-- This migration creates a unified activities table that supports all activity types from Strava, Garmin, and manual entry

-- Drop existing tables to rebuild with comprehensive schema
DROP TABLE IF EXISTS activity_workout_links CASCADE;
DROP TABLE IF EXISTS manual_activities CASCADE;
DROP TABLE IF EXISTS activities CASCADE;

-- Create comprehensive activities table
CREATE TABLE activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Source tracking
  source TEXT NOT NULL CHECK (source IN ('strava', 'garmin', 'manual', 'apple', 'fitbit', 'polar', 'suunto')),
  external_id TEXT, -- External ID from source (e.g., Strava activity ID)

  -- Basic activity information
  name TEXT NOT NULL,
  activity_type TEXT NOT NULL, -- Generic type (run, ride, swim, etc.)
  sport_type TEXT, -- Specific sport type (trail_run, virtual_ride, etc.)
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone TEXT,
  utc_offset INTEGER, -- Offset in seconds

  -- Time metrics
  elapsed_time_seconds INTEGER NOT NULL, -- Total time including stops
  moving_time_seconds INTEGER, -- Time actually moving

  -- Distance and speed metrics
  distance_meters DECIMAL(10,2),
  average_speed DECIMAL(10,3), -- m/s
  max_speed DECIMAL(10,3), -- m/s

  -- Elevation metrics
  total_elevation_gain DECIMAL(10,2),
  total_elevation_loss DECIMAL(10,2),
  elevation_high DECIMAL(10,2),
  elevation_low DECIMAL(10,2),

  -- Heart rate metrics
  average_heartrate INTEGER,
  max_heartrate INTEGER,
  min_heartrate INTEGER,
  heartrate_zones JSONB, -- Time in each zone

  -- Power metrics (cycling)
  average_power DECIMAL(10,2),
  max_power INTEGER,
  normalized_power DECIMAL(10,2),
  intensity_factor DECIMAL(5,3),
  tss DECIMAL(10,2), -- Training Stress Score
  power_zones JSONB, -- Time in each power zone
  kilojoules DECIMAL(10,2),

  -- Cadence metrics (running/cycling)
  average_cadence DECIMAL(10,2),
  max_cadence INTEGER,

  -- Running specific metrics
  average_stride_length DECIMAL(5,2), -- meters
  average_vertical_oscillation DECIMAL(5,2), -- cm
  average_ground_contact_time INTEGER, -- ms
  average_ground_contact_balance DECIMAL(5,2), -- % left
  average_vertical_ratio DECIMAL(5,2), -- %

  -- Swimming specific metrics
  pool_length DECIMAL(10,2), -- meters
  total_strokes INTEGER,
  average_stroke_rate DECIMAL(10,2), -- strokes per minute
  average_swolf DECIMAL(10,2), -- swimming efficiency score
  lap_count INTEGER,

  -- Strength training metrics
  total_reps INTEGER,
  total_sets INTEGER,
  total_weight_lifted DECIMAL(10,2), -- kg
  exercise_count INTEGER,
  muscle_groups TEXT[], -- Array of muscle groups worked

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
  average_stroke_rate DECIMAL(10,2), -- strokes per minute (also used for rowing)
  average_distance_per_stroke DECIMAL(10,2), -- meters
  average_split_time INTEGER, -- seconds per 500m

  -- Yoga/Flexibility metrics
  poses_held INTEGER,
  average_hold_duration INTEGER, -- seconds
  flexibility_score INTEGER, -- 1-10 subjective

  -- Performance metrics
  calories INTEGER,
  training_load DECIMAL(10,2), -- EPOC or similar metric
  aerobic_training_effect DECIMAL(5,2),
  anaerobic_training_effect DECIMAL(5,2),
  recovery_time_hours INTEGER,
  vo2max_estimate DECIMAL(5,2),
  fitness_level INTEGER, -- 1-10 or similar

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
  wind_direction INTEGER, -- degrees
  precipitation TEXT,
  air_quality_index INTEGER,
  indoor BOOLEAN DEFAULT false,

  -- Equipment and location
  gear_id TEXT, -- Reference to equipment used
  location TEXT,
  route_name TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  latitude DECIMAL(10,6),
  longitude DECIMAL(10,6),

  -- Media and notes
  notes TEXT,
  private_notes TEXT, -- Notes not shared publicly
  photos TEXT[], -- URLs to photos
  videos TEXT[], -- URLs to videos
  map_polyline TEXT, -- Encoded polyline for route

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
  workout_type TEXT, -- intervals, tempo, long_run, recovery, etc.

  -- Raw data storage
  raw_data JSONB, -- Store complete original data from source
  laps JSONB, -- Lap/interval data
  splits JSONB, -- Split data
  segments JSONB, -- Segment efforts (Strava segments, etc.)

  -- Metadata
  device_name TEXT,
  device_manufacturer TEXT,
  upload_source TEXT,
  file_format TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  synced_at TIMESTAMP WITH TIME ZONE,

  -- Deduplication
  dedup_key TEXT GENERATED ALWAYS AS (
    COALESCE(external_id, '') || '|' ||
    source || '|' ||
    user_id::TEXT || '|' ||
    DATE_TRUNC('second', start_date)::TEXT || '|' ||
    COALESCE(name, '')
  ) STORED,

  CONSTRAINT unique_activity_per_source UNIQUE(user_id, source, external_id),
  CONSTRAINT unique_manual_activity UNIQUE(user_id, dedup_key)
);

-- Create indexes for performance
CREATE INDEX idx_activities_user ON activities(user_id);
CREATE INDEX idx_activities_start_date ON activities(start_date DESC);
CREATE INDEX idx_activities_activity_type ON activities(activity_type);
CREATE INDEX idx_activities_sport_type ON activities(sport_type);
CREATE INDEX idx_activities_source ON activities(source);
CREATE INDEX idx_activities_external_id ON activities(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_activities_dedup ON activities(dedup_key);
CREATE INDEX idx_activities_user_date ON activities(user_id, start_date DESC);
CREATE INDEX idx_activities_user_type ON activities(user_id, activity_type, start_date DESC);

-- Enable Row Level Security
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage their own activities" ON activities
  FOR ALL USING (auth.uid() = user_id);

-- Create activity_workout_links table for linking activities to workouts
CREATE TABLE activity_workout_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE NOT NULL,

  -- Linked workout (one or the other)
  custom_workout_id UUID REFERENCES user_custom_workouts(id) ON DELETE CASCADE,
  standard_workout_id INTEGER REFERENCES workouts(id) ON DELETE CASCADE,

  -- Linking metadata
  link_type TEXT CHECK (link_type IN ('automatic', 'manual', 'suggested')) DEFAULT 'manual',
  confidence_score DECIMAL(3,2), -- For automatic matching
  match_reason TEXT, -- Why this was linked

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  -- Constraints
  CONSTRAINT at_least_one_workout CHECK (
    custom_workout_id IS NOT NULL OR standard_workout_id IS NOT NULL
  ),
  CONSTRAINT unique_activity_workout_link UNIQUE(activity_id, custom_workout_id, standard_workout_id)
);

-- Create indexes for activity_workout_links
CREATE INDEX idx_activity_workout_links_user ON activity_workout_links(user_id);
CREATE INDEX idx_activity_workout_links_activity ON activity_workout_links(activity_id);
CREATE INDEX idx_activity_workout_links_custom ON activity_workout_links(custom_workout_id);
CREATE INDEX idx_activity_workout_links_standard ON activity_workout_links(standard_workout_id);

-- Enable RLS on activity_workout_links
ALTER TABLE activity_workout_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own workout links" ON activity_workout_links
  FOR ALL USING (auth.uid() = user_id);

-- Create function to import Strava activity
CREATE OR REPLACE FUNCTION import_strava_activity(
  p_user_id UUID,
  p_activity_data JSONB
) RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  -- Insert or update activity
  INSERT INTO activities (
    user_id,
    source,
    external_id,
    name,
    activity_type,
    sport_type,
    start_date,
    timezone,
    elapsed_time_seconds,
    moving_time_seconds,
    distance_meters,
    average_speed,
    max_speed,
    total_elevation_gain,
    average_heartrate,
    max_heartrate,
    average_cadence,
    calories,
    average_power,
    kilojoules,
    trainer,
    commute,
    city,
    state,
    country,
    raw_data,
    synced_at
  ) VALUES (
    p_user_id,
    'strava',
    (p_activity_data->>'id')::TEXT,
    p_activity_data->>'name',
    LOWER(p_activity_data->>'type'),
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
    p_activity_data,
    NOW()
  )
  ON CONFLICT (user_id, source, external_id)
  DO UPDATE SET
    name = EXCLUDED.name,
    activity_type = EXCLUDED.activity_type,
    sport_type = EXCLUDED.sport_type,
    distance_meters = EXCLUDED.distance_meters,
    elapsed_time_seconds = EXCLUDED.elapsed_time_seconds,
    moving_time_seconds = EXCLUDED.moving_time_seconds,
    average_speed = EXCLUDED.average_speed,
    max_speed = EXCLUDED.max_speed,
    total_elevation_gain = EXCLUDED.total_elevation_gain,
    average_heartrate = EXCLUDED.average_heartrate,
    max_heartrate = EXCLUDED.max_heartrate,
    average_cadence = EXCLUDED.average_cadence,
    calories = EXCLUDED.calories,
    average_power = EXCLUDED.average_power,
    kilojoules = EXCLUDED.kilojoules,
    raw_data = EXCLUDED.raw_data,
    synced_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_activity_id;

  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to import Garmin activity
CREATE OR REPLACE FUNCTION import_garmin_activity(
  p_user_id UUID,
  p_activity_data JSONB
) RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  -- Insert or update activity
  INSERT INTO activities (
    user_id,
    source,
    external_id,
    name,
    activity_type,
    sport_type,
    start_date,
    elapsed_time_seconds,
    moving_time_seconds,
    distance_meters,
    average_speed,
    max_speed,
    total_elevation_gain,
    elevation_high,
    elevation_low,
    average_heartrate,
    max_heartrate,
    min_heartrate,
    average_power,
    max_power,
    normalized_power,
    intensity_factor,
    tss,
    average_cadence,
    max_cadence,
    calories,
    training_load,
    aerobic_training_effect,
    anaerobic_training_effect,
    vo2max_estimate,
    average_stride_length,
    average_vertical_oscillation,
    average_ground_contact_time,
    average_ground_contact_balance,
    average_vertical_ratio,
    device_name,
    raw_data,
    synced_at
  ) VALUES (
    p_user_id,
    'garmin',
    (p_activity_data->>'activityId')::TEXT,
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
    (p_activity_data->>'avgStrideLength')::DECIMAL / 100, -- Convert cm to m
    (p_activity_data->>'avgVerticalOscillation')::DECIMAL,
    (p_activity_data->>'avgGroundContactTime')::INTEGER,
    (p_activity_data->>'avgGroundContactBalance')::DECIMAL,
    (p_activity_data->>'avgVerticalRatio')::DECIMAL,
    p_activity_data->>'deviceName',
    p_activity_data,
    NOW()
  )
  ON CONFLICT (user_id, source, external_id)
  DO UPDATE SET
    name = EXCLUDED.name,
    activity_type = EXCLUDED.activity_type,
    sport_type = EXCLUDED.sport_type,
    distance_meters = EXCLUDED.distance_meters,
    elapsed_time_seconds = EXCLUDED.elapsed_time_seconds,
    moving_time_seconds = EXCLUDED.moving_time_seconds,
    average_speed = EXCLUDED.average_speed,
    max_speed = EXCLUDED.max_speed,
    total_elevation_gain = EXCLUDED.total_elevation_gain,
    average_heartrate = EXCLUDED.average_heartrate,
    max_heartrate = EXCLUDED.max_heartrate,
    average_power = EXCLUDED.average_power,
    normalized_power = EXCLUDED.normalized_power,
    training_load = EXCLUDED.training_load,
    raw_data = EXCLUDED.raw_data,
    synced_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_activity_id;

  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON activities TO authenticated;
GRANT ALL ON activity_workout_links TO authenticated;
GRANT EXECUTE ON FUNCTION import_strava_activity TO authenticated;
GRANT EXECUTE ON FUNCTION import_garmin_activity TO authenticated;