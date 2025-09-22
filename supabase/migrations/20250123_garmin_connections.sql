-- Create Garmin connections table
CREATE TABLE IF NOT EXISTS garmin_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Garmin credentials (should be encrypted in production)
  garmin_email TEXT NOT NULL,
  encrypted_password TEXT NOT NULL, -- Store encrypted

  -- Connection status
  is_active BOOLEAN DEFAULT true,
  last_sync TIMESTAMP WITH TIME ZONE,
  sync_error TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  -- Unique constraint
  CONSTRAINT unique_garmin_user UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX idx_garmin_connections_user ON garmin_connections(user_id);

-- Enable Row Level Security
ALTER TABLE garmin_connections ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage their own Garmin connection" ON garmin_connections
  FOR ALL USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON garmin_connections TO authenticated;