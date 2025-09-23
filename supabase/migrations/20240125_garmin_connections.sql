-- Create garmin_connections table
CREATE TABLE IF NOT EXISTS garmin_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  garmin_email TEXT NOT NULL,
  encrypted_password TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE garmin_connections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own garmin connection" ON garmin_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own garmin connection" ON garmin_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own garmin connection" ON garmin_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own garmin connection" ON garmin_connections
  FOR DELETE USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_garmin_connections_user_id ON garmin_connections(user_id);

-- Create function to save Garmin activity
CREATE OR REPLACE FUNCTION save_garmin_activity(
  p_user_id UUID,
  p_external_id TEXT,
  p_name TEXT,
  p_activity_type TEXT,
  p_start_time TIMESTAMPTZ,
  p_duration INTEGER,
  p_distance NUMERIC,
  p_calories INTEGER,
  p_avg_heart_rate INTEGER,
  p_raw_data JSONB
)
RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  -- Check if activity already exists
  SELECT id INTO v_activity_id
  FROM activities
  WHERE user_id = p_user_id
    AND external_id = p_external_id
    AND source = 'garmin';

  IF v_activity_id IS NOT NULL THEN
    -- Update existing activity
    UPDATE activities
    SET
      name = p_name,
      activity_type = p_activity_type,
      start_time = p_start_time,
      duration = p_duration,
      distance = p_distance,
      calories = p_calories,
      avg_heart_rate = p_avg_heart_rate,
      raw_data = p_raw_data,
      updated_at = NOW()
    WHERE id = v_activity_id;
  ELSE
    -- Insert new activity
    INSERT INTO activities (
      user_id,
      source,
      external_id,
      name,
      activity_type,
      start_time,
      duration,
      distance,
      calories,
      avg_heart_rate,
      raw_data
    ) VALUES (
      p_user_id,
      'garmin',
      p_external_id,
      p_name,
      p_activity_type,
      p_start_time,
      p_duration,
      p_distance,
      p_calories,
      p_avg_heart_rate,
      p_raw_data
    )
    RETURNING id INTO v_activity_id;
  END IF;

  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;