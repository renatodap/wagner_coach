-- Create user preferences table for storing unit system and other preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  unit_system TEXT DEFAULT 'metric' CHECK (unit_system IN ('metric', 'imperial')),

  -- Display preferences
  default_activity_view TEXT DEFAULT 'list' CHECK (default_activity_view IN ('list', 'grid', 'calendar')),
  activities_per_page INTEGER DEFAULT 20 CHECK (activities_per_page BETWEEN 10 AND 100),

  -- Privacy preferences
  activities_public BOOLEAN DEFAULT false,
  share_stats BOOLEAN DEFAULT false,

  -- Notification preferences
  workout_reminders BOOLEAN DEFAULT true,
  achievement_notifications BOOLEAN DEFAULT true,
  weekly_summary BOOLEAN DEFAULT true,

  -- Default activity settings
  auto_pause BOOLEAN DEFAULT true,
  countdown_seconds INTEGER DEFAULT 3,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_preferences_updated_at_trigger
BEFORE UPDATE ON user_preferences
FOR EACH ROW EXECUTE FUNCTION update_user_preferences_updated_at();

-- Create function to get or create user preferences
CREATE OR REPLACE FUNCTION get_or_create_user_preferences(p_user_id UUID)
RETURNS user_preferences AS $$
DECLARE
  v_preferences user_preferences;
BEGIN
  SELECT * INTO v_preferences FROM user_preferences WHERE user_id = p_user_id;

  IF v_preferences IS NULL THEN
    INSERT INTO user_preferences (user_id) VALUES (p_user_id)
    RETURNING * INTO v_preferences;
  END IF;

  RETURN v_preferences;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;