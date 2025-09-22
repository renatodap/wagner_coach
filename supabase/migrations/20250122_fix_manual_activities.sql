-- Fix manual activities table if it doesn't exist or needs updates
-- This migration ensures manual_activities table is properly created

-- Create manual_activities table if it doesn't exist
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

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_manual_activities_user ON manual_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_activities_start ON manual_activities(start_time);

-- Enable Row Level Security
ALTER TABLE manual_activities ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage their own activities" ON manual_activities;

-- Create RLS policy
CREATE POLICY "Users can manage their own activities" ON manual_activities
  FOR ALL USING (auth.uid() = user_id);

-- Create activity_workout_links table if it doesn't exist
CREATE TABLE IF NOT EXISTS activity_workout_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Activity reference (can be from multiple sources)
  activity_source TEXT CHECK (activity_source IN ('strava', 'garmin', 'manual', 'apple', 'fitbit')),
  activity_source_id TEXT, -- External ID from source
  manual_activity_id UUID REFERENCES manual_activities(id) ON DELETE CASCADE,

  -- Linked workout
  custom_workout_id UUID REFERENCES user_custom_workouts(id) ON DELETE CASCADE,
  standard_workout_id INTEGER REFERENCES workouts(id) ON DELETE CASCADE,

  -- Linking metadata
  link_type TEXT CHECK (link_type IN ('automatic', 'manual', 'suggested')),
  confidence_score DECIMAL(3,2), -- For automatic matching

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  -- Constraints
  CONSTRAINT at_least_one_activity CHECK (
    activity_source_id IS NOT NULL OR manual_activity_id IS NOT NULL
  ),
  CONSTRAINT at_least_one_workout CHECK (
    custom_workout_id IS NOT NULL OR standard_workout_id IS NOT NULL
  )
);

-- Create indexes for activity_workout_links if they don't exist
CREATE INDEX IF NOT EXISTS idx_activity_workout_links_user ON activity_workout_links(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_workout_links_manual ON activity_workout_links(manual_activity_id);

-- Enable Row Level Security on activity_workout_links
ALTER TABLE activity_workout_links ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage their own activity links" ON activity_workout_links;

-- Create RLS policy for activity_workout_links
CREATE POLICY "Users can manage their own activity links" ON activity_workout_links
  FOR ALL USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON manual_activities TO authenticated;
GRANT ALL ON activity_workout_links TO authenticated;