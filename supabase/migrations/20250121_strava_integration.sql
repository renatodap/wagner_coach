-- Migration: Strava Integration for All Workout Types
-- Description: Add tables and functions for Strava/watch integration treating all workout types equally

-- 1. Create Strava connections table for OAuth tokens and athlete data
CREATE TABLE IF NOT EXISTS strava_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  strava_athlete_id bigint NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  athlete_data jsonb,
  scope text, -- Track granted permissions
  connected_at timestamp with time zone DEFAULT now(),
  last_sync_at timestamp with time zone,
  sync_enabled boolean DEFAULT true,
  UNIQUE(user_id)
);

-- 2. Create unified activities table for ALL workout types (strength, cardio, etc.)
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,

  -- Activity source and linking
  source text NOT NULL CHECK (source IN ('manual', 'strava', 'garmin', 'apple_watch', 'fitbit', 'polar', 'wahoo')),
  external_id text, -- Strava activity ID or other external ID

  -- Core activity data (applies to all types)
  name text NOT NULL,
  activity_type text NOT NULL, -- 'run', 'ride', 'swim', 'strength_training', 'yoga', 'crossfit', etc.
  sport_type text, -- More specific: 'trail_run', 'road_cycling', 'open_water_swim', etc.
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone,

  -- Duration and effort
  elapsed_time_seconds integer, -- Total time including pauses
  moving_time_seconds integer, -- Active time only

  -- Distance-based metrics (null for strength training)
  distance_meters real,
  total_elevation_gain real,

  -- Heart rate data
  average_heartrate integer,
  max_heartrate integer,
  heartrate_zones jsonb, -- Time in each zone

  -- Performance metrics
  average_speed real, -- m/s
  max_speed real,
  average_cadence integer, -- RPM for cycling, SPM for running
  average_power integer, -- Watts for cycling
  normalized_power integer,

  -- Energy and load
  calories integer,
  active_calories integer,
  training_load integer, -- Training stress score
  perceived_exertion integer CHECK (perceived_exertion >= 1 AND perceived_exertion <= 10),

  -- Strength training specific (when activity_type = 'strength_training')
  workout_id integer REFERENCES workouts(id), -- Link to existing workout if applicable
  sets_completed integer,
  reps_completed integer,
  total_weight_lifted_kg real,

  -- Location and conditions
  start_lat real,
  start_lng real,
  end_lat real,
  end_lng real,
  weather_data jsonb, -- Temperature, humidity, wind, etc.

  -- User notes and ratings
  notes text,
  mood text CHECK (mood IN ('great', 'good', 'okay', 'tired', 'exhausted')),
  energy_level integer CHECK (energy_level >= 1 AND energy_level <= 5),
  workout_rating integer CHECK (workout_rating >= 1 AND workout_rating <= 5),

  -- Raw data storage
  raw_data jsonb, -- Complete activity data from source

  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  synced_at timestamp with time zone,

  -- Prevent duplicate imports
  UNIQUE(user_id, source, external_id)
);

-- 3. Create activity segments/laps table
CREATE TABLE IF NOT EXISTS activity_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
  segment_type text NOT NULL CHECK (segment_type IN ('lap', 'interval', 'set', 'split')),
  segment_index integer NOT NULL,

  -- Timing
  start_time timestamp with time zone,
  elapsed_time_seconds integer,

  -- Distance and pace
  distance_meters real,
  average_speed real,
  average_pace text, -- Format: "MM:SS"

  -- Heart rate
  average_heartrate integer,
  max_heartrate integer,

  -- Strength specific
  exercise_name text,
  reps integer,
  weight_kg real,

  -- Other metrics
  average_cadence integer,
  average_power integer,
  calories integer,

  notes text,

  UNIQUE(activity_id, segment_index)
);

-- 4. Create activity streams table for detailed time-series data
CREATE TABLE IF NOT EXISTS activity_streams (
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
  stream_type text NOT NULL CHECK (stream_type IN ('heartrate', 'cadence', 'power', 'speed', 'altitude', 'distance', 'temperature')),
  data_points jsonb NOT NULL, -- Array of {time: seconds, value: number}
  resolution text CHECK (resolution IN ('high', 'medium', 'low')),
  PRIMARY KEY (activity_id, stream_type)
);

-- 5. Create goals table for tracking progress
CREATE TABLE IF NOT EXISTS fitness_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  goal_type text NOT NULL CHECK (goal_type IN ('distance', 'duration', 'frequency', 'calories', 'weight', 'pace', 'strength')),
  activity_type text, -- Optional: specific to certain activities

  -- Goal parameters
  target_value real NOT NULL,
  target_unit text NOT NULL, -- 'km', 'miles', 'minutes', 'times', 'kg', etc.
  timeframe text CHECK (timeframe IN ('daily', 'weekly', 'monthly', 'yearly', 'custom')),
  start_date date NOT NULL,
  end_date date,

  -- Progress tracking
  current_value real DEFAULT 0,
  last_updated timestamp with time zone,

  -- Status
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
  completed_at timestamp with time zone,

  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 6. Update user settings to include watch preferences
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS auto_sync_activities boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS preferred_units text DEFAULT 'metric' CHECK (preferred_units IN ('metric', 'imperial')),
ADD COLUMN IF NOT EXISTS default_activity_privacy text DEFAULT 'private' CHECK (default_activity_privacy IN ('private', 'friends', 'public')),
ADD COLUMN IF NOT EXISTS watch_type text CHECK (watch_type IN ('apple_watch', 'garmin', 'fitbit', 'polar', 'suunto', 'wahoo', 'other'));

-- 7. Create webhook events table for debugging and reliability
CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  event_type text NOT NULL,
  object_type text,
  object_id text,
  athlete_id bigint,
  payload jsonb,
  processed boolean DEFAULT false,
  processed_at timestamp with time zone,
  error text,
  created_at timestamp with time zone DEFAULT now()
);

-- 8. Functions for Strava integration

-- Function to refresh Strava token if expired
CREATE OR REPLACE FUNCTION refresh_strava_token(p_user_id UUID)
RETURNS TABLE(access_token text, expires_at timestamp with time zone) AS $$
DECLARE
  v_connection strava_connections%ROWTYPE;
BEGIN
  SELECT * INTO v_connection
  FROM strava_connections
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No Strava connection found for user';
  END IF;

  -- Check if token is still valid (with 5 minute buffer)
  IF v_connection.expires_at > (NOW() + INTERVAL '5 minutes') THEN
    RETURN QUERY SELECT v_connection.access_token, v_connection.expires_at;
  ELSE
    -- Token expired, need to refresh (this would be handled by the API)
    RAISE NOTICE 'Token expired, refresh needed';
    RETURN QUERY SELECT v_connection.access_token, v_connection.expires_at;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to import activity from Strava
CREATE OR REPLACE FUNCTION import_strava_activity(
  p_user_id UUID,
  p_activity_data jsonb
) RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
  v_activity_type text;
  v_sport_type text;
BEGIN
  -- Map Strava activity types to our schema
  v_sport_type := p_activity_data->>'sport_type';
  v_activity_type := CASE
    WHEN v_sport_type IN ('Run', 'TrailRun', 'VirtualRun') THEN 'run'
    WHEN v_sport_type IN ('Ride', 'VirtualRide', 'EBikeRide', 'MountainBikeRide') THEN 'ride'
    WHEN v_sport_type IN ('Swim', 'OpenWaterSwim') THEN 'swim'
    WHEN v_sport_type = 'WeightTraining' THEN 'strength_training'
    WHEN v_sport_type IN ('Yoga', 'Pilates') THEN 'flexibility'
    WHEN v_sport_type = 'CrossFit' THEN 'crossfit'
    WHEN v_sport_type = 'HIIT' THEN 'hiit'
    WHEN v_sport_type IN ('Walk', 'Hike') THEN 'walk'
    ELSE LOWER(v_sport_type)
  END;

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
    total_elevation_gain,
    average_heartrate,
    max_heartrate,
    calories,
    raw_data,
    synced_at
  ) VALUES (
    p_user_id,
    'strava',
    (p_activity_data->>'id')::text,
    p_activity_data->>'name',
    v_activity_type,
    v_sport_type,
    (p_activity_data->>'start_date')::timestamp with time zone,
    (p_activity_data->>'elapsed_time')::integer,
    (p_activity_data->>'moving_time')::integer,
    (p_activity_data->>'distance')::real,
    (p_activity_data->>'total_elevation_gain')::real,
    (p_activity_data->>'average_heartrate')::integer,
    (p_activity_data->>'max_heartrate')::integer,
    (p_activity_data->>'calories')::integer,
    p_activity_data,
    NOW()
  )
  ON CONFLICT (user_id, source, external_id) DO UPDATE
  SET
    name = EXCLUDED.name,
    elapsed_time_seconds = EXCLUDED.elapsed_time_seconds,
    moving_time_seconds = EXCLUDED.moving_time_seconds,
    distance_meters = EXCLUDED.distance_meters,
    total_elevation_gain = EXCLUDED.total_elevation_gain,
    average_heartrate = EXCLUDED.average_heartrate,
    max_heartrate = EXCLUDED.max_heartrate,
    calories = EXCLUDED.calories,
    raw_data = EXCLUDED.raw_data,
    synced_at = EXCLUDED.synced_at,
    updated_at = NOW()
  RETURNING id INTO v_activity_id;

  -- Update last sync timestamp
  UPDATE strava_connections
  SET last_sync_at = NOW()
  WHERE user_id = p_user_id;

  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate weekly stats across all activities
CREATE OR REPLACE FUNCTION get_weekly_activity_stats(
  p_user_id UUID,
  p_start_date date DEFAULT (CURRENT_DATE - INTERVAL '7 days')::date
) RETURNS TABLE (
  activity_type text,
  total_count integer,
  total_duration_minutes integer,
  total_distance_km real,
  total_calories integer,
  avg_heartrate integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.activity_type,
    COUNT(*)::integer as total_count,
    SUM(a.elapsed_time_seconds / 60)::integer as total_duration_minutes,
    SUM(a.distance_meters / 1000)::real as total_distance_km,
    SUM(a.calories)::integer as total_calories,
    AVG(a.average_heartrate)::integer as avg_heartrate
  FROM activities a
  WHERE
    a.user_id = p_user_id
    AND a.start_date >= p_start_date
  GROUP BY a.activity_type
  ORDER BY total_duration_minutes DESC;
END;
$$ LANGUAGE plpgsql;

-- 9. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_strava_connections_user_id ON strava_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_strava_connections_athlete_id ON strava_connections(strava_athlete_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_date ON activities(user_id, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(activity_type, sport_type);
CREATE INDEX IF NOT EXISTS idx_activities_external ON activities(source, external_id);
CREATE INDEX IF NOT EXISTS idx_activity_segments_activity ON activity_segments(activity_id);
CREATE INDEX IF NOT EXISTS idx_fitness_goals_user ON fitness_goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed, created_at);

-- 10. RLS Policies
ALTER TABLE strava_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Strava connections policies
CREATE POLICY "Users can manage their own Strava connection" ON strava_connections
  FOR ALL USING (auth.uid() = user_id);

-- Activities policies
CREATE POLICY "Users can view and manage their own activities" ON activities
  FOR ALL USING (auth.uid() = user_id);

-- Activity segments policies
CREATE POLICY "Users can view their own activity segments" ON activity_segments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM activities a
      WHERE a.id = activity_segments.activity_id
      AND a.user_id = auth.uid()
    )
  );

-- Activity streams policies
CREATE POLICY "Users can view their own activity streams" ON activity_streams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM activities a
      WHERE a.id = activity_streams.activity_id
      AND a.user_id = auth.uid()
    )
  );

-- Fitness goals policies
CREATE POLICY "Users can manage their own fitness goals" ON fitness_goals
  FOR ALL USING (auth.uid() = user_id);

-- Webhook events policies (admin only)
CREATE POLICY "Only admins can view webhook events" ON webhook_events
  FOR SELECT USING (false); -- Will need to update with admin check

-- 11. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON strava_connections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON activities TO authenticated;
GRANT SELECT ON activity_segments TO authenticated;
GRANT SELECT ON activity_streams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON fitness_goals TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_strava_token TO authenticated;
GRANT EXECUTE ON FUNCTION import_strava_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_weekly_activity_stats TO authenticated;