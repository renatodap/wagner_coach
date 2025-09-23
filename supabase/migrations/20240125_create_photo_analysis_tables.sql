-- Create meal_photo_analyses table
CREATE TABLE IF NOT EXISTS meal_photo_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_id UUID REFERENCES meals(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  ai_response JSONB NOT NULL,
  user_corrections JSONB,
  confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  processing_time_ms INTEGER NOT NULL CHECK (processing_time_ms >= 0),
  ai_service_used TEXT NOT NULL CHECK (ai_service_used IN ('openai', 'claude', 'manual')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_photo_analyses_user_id ON meal_photo_analyses(user_id);
CREATE INDEX idx_photo_analyses_meal_id ON meal_photo_analyses(meal_id);
CREATE INDEX idx_photo_analyses_created_at ON meal_photo_analyses(created_at DESC);

-- Enable Row Level Security
ALTER TABLE meal_photo_analyses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own photo analyses
CREATE POLICY "Users can view own photo analyses"
  ON meal_photo_analyses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own photo analyses
CREATE POLICY "Users can insert own photo analyses"
  ON meal_photo_analyses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own photo analyses
CREATE POLICY "Users can update own photo analyses"
  ON meal_photo_analyses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own photo analyses
CREATE POLICY "Users can delete own photo analyses"
  ON meal_photo_analyses
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create user_ai_preferences table
CREATE TABLE IF NOT EXISTS user_ai_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_portion_units TEXT DEFAULT 'imperial' CHECK (preferred_portion_units IN ('metric', 'imperial')),
  dietary_restrictions TEXT[],
  common_foods TEXT[],
  correction_count INTEGER DEFAULT 0 CHECK (correction_count >= 0),
  satisfaction_rating DECIMAL(2,1) CHECK (satisfaction_rating IS NULL OR (satisfaction_rating >= 1 AND satisfaction_rating <= 5)),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE user_ai_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_ai_preferences
-- Users can only see their own preferences
CREATE POLICY "Users can view own AI preferences"
  ON user_ai_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own AI preferences"
  ON user_ai_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own AI preferences"
  ON user_ai_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_photo_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at for meal_photo_analyses
CREATE TRIGGER update_photo_analyses_timestamp
  BEFORE UPDATE ON meal_photo_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_photo_analyses_updated_at();

-- Function to automatically update updated_at timestamp for user_ai_preferences
CREATE OR REPLACE FUNCTION update_ai_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at for user_ai_preferences
CREATE TRIGGER update_ai_preferences_timestamp
  BEFORE UPDATE ON user_ai_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_preferences_updated_at();

-- Add helpful comments
COMMENT ON TABLE meal_photo_analyses IS 'Stores AI analysis results for meal photos';
COMMENT ON COLUMN meal_photo_analyses.ai_response IS 'JSON response from AI service containing food items and nutritional data';
COMMENT ON COLUMN meal_photo_analyses.user_corrections IS 'User corrections to the AI analysis for learning purposes';
COMMENT ON COLUMN meal_photo_analyses.confidence_score IS 'Overall confidence score of the AI analysis (0-1)';
COMMENT ON COLUMN meal_photo_analyses.processing_time_ms IS 'Time taken to process the image in milliseconds';
COMMENT ON COLUMN meal_photo_analyses.ai_service_used IS 'Which AI service was used for analysis';

COMMENT ON TABLE user_ai_preferences IS 'User preferences for AI meal analysis';
COMMENT ON COLUMN user_ai_preferences.preferred_portion_units IS 'User preference for portion units (metric or imperial)';
COMMENT ON COLUMN user_ai_preferences.dietary_restrictions IS 'Array of dietary restrictions (e.g., vegetarian, gluten-free)';
COMMENT ON COLUMN user_ai_preferences.common_foods IS 'Array of frequently eaten foods for better recognition';
COMMENT ON COLUMN user_ai_preferences.correction_count IS 'Number of corrections made by the user';
COMMENT ON COLUMN user_ai_preferences.satisfaction_rating IS 'Average satisfaction rating (1-5)';