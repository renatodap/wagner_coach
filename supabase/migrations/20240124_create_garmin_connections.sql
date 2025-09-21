-- Create Garmin connections table to store user credentials
CREATE TABLE IF NOT EXISTS garmin_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  garmin_user_id TEXT,
  is_active BOOLEAN DEFAULT true,
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE garmin_connections ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own Garmin connection
CREATE POLICY "Users can manage their own Garmin connection"
  ON garmin_connections
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add source column to strava_activities if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'strava_activities'
    AND column_name = 'source'
  ) THEN
    ALTER TABLE strava_activities
    ADD COLUMN source TEXT DEFAULT 'strava';
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_garmin_connections_user_id ON garmin_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_strava_activities_source ON strava_activities(source);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_garmin_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_garmin_connections_timestamp
  BEFORE UPDATE ON garmin_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_garmin_connections_updated_at();