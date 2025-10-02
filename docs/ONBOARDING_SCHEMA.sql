-- ============================================================
-- ONBOARDING & PROGRAM GENERATION SCHEMA
-- ============================================================

-- ============================================================
-- 1. USER ONBOARDING DATA
-- ============================================================

CREATE TABLE IF NOT EXISTS user_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- TIER 1: ESSENTIAL QUESTIONS
  primary_goal TEXT NOT NULL CHECK (primary_goal IN (
    'build_muscle',
    'lose_fat',
    'improve_endurance',
    'increase_strength',
    'sport_performance',
    'general_health',
    'rehab_recovery'
  )),

  user_persona TEXT NOT NULL CHECK (user_persona IN (
    'strength_athlete',
    'bodybuilder',
    'endurance_runner',
    'triathlete',
    'crossfit_athlete',
    'team_sport_athlete',
    'general_fitness',
    'beginner_recovery'
  )),

  current_activity_level TEXT NOT NULL CHECK (current_activity_level IN (
    'sedentary',
    'lightly_active',
    'moderately_active',
    'very_active'
  )),

  desired_training_frequency INTEGER NOT NULL CHECK (desired_training_frequency BETWEEN 3 AND 7),

  program_duration_weeks INTEGER NOT NULL CHECK (program_duration_weeks IN (4, 8, 12, 16)),

  biological_sex TEXT NOT NULL CHECK (biological_sex IN ('male', 'female')),

  age INTEGER NOT NULL CHECK (age BETWEEN 18 AND 80),

  current_weight_kg DECIMAL(5,2) NOT NULL CHECK (current_weight_kg > 0),

  height_cm DECIMAL(5,2) NOT NULL CHECK (height_cm > 0),

  daily_meal_preference INTEGER NOT NULL CHECK (daily_meal_preference IN (2, 3, 4, 5, 6)),

  -- TIER 2: OPTIMIZATION QUESTIONS
  training_time_preferences TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- Options: 'early_morning', 'morning', 'midday', 'afternoon', 'evening', 'night'

  dietary_restrictions TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- Options: 'none', 'vegetarian', 'vegan', 'dairy_free', 'gluten_free', 'nut_allergies', 'shellfish_allergies', 'other'

  equipment_access TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- Options: 'full_gym', 'home_gym', 'dumbbells', 'resistance_bands', 'bodyweight', 'cardio_equipment'

  injury_limitations TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- Options: 'none', 'lower_back', 'shoulder', 'knee', 'hip', 'wrist', 'ankle', 'other'

  experience_level TEXT NOT NULL CHECK (experience_level IN (
    'beginner',
    'intermediate',
    'advanced',
    'expert'
  )),

  -- METADATA
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own onboarding" ON user_onboarding
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding" ON user_onboarding
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding" ON user_onboarding
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- 2. USER PROFILE EMBEDDINGS (for AI context)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_profile_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Text representation of user profile for embedding
  profile_text TEXT NOT NULL,

  -- OpenAI embedding vector (1536 dimensions for text-embedding-3-small)
  embedding vector(1536),

  -- Metadata
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE user_profile_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own embeddings" ON user_profile_embeddings
  FOR SELECT USING (auth.uid() = user_id);

-- Create index for vector similarity search
CREATE INDEX ON user_profile_embeddings USING ivfflat (embedding vector_cosine_ops);

-- ============================================================
-- 3. PROGRAM GENERATION REQUESTS
-- ============================================================

CREATE TABLE IF NOT EXISTS program_generation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- TIER 3: ADDITIONAL QUESTIONS FOR PROGRAM CREATION
  specific_performance_goal TEXT,
  event_date DATE,
  weak_points TEXT[], -- Array of focus areas
  recovery_capacity TEXT CHECK (recovery_capacity IN ('excellent', 'good', 'fair', 'poor')),
  preferred_workout_duration TEXT CHECK (preferred_workout_duration IN ('30-45min', '45-60min', '60-90min', '90+min')),

  -- Additional context (user can provide free text)
  additional_context TEXT,

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),

  -- Reference to generated program
  generated_program_id UUID REFERENCES user_program_enrollments(id) ON DELETE SET NULL,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE program_generation_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own program requests" ON program_generation_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create program requests" ON program_generation_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 4. UPDATE EXISTING TABLES
-- ============================================================

-- Add onboarding completion check to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE NOT NULL;

-- ============================================================
-- 5. FUNCTIONS & TRIGGERS
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_onboarding
DROP TRIGGER IF EXISTS update_user_onboarding_updated_at ON user_onboarding;
CREATE TRIGGER update_user_onboarding_updated_at
  BEFORE UPDATE ON user_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to mark onboarding as completed and update profile
CREATE OR REPLACE FUNCTION mark_onboarding_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = TRUE AND OLD.completed = FALSE THEN
    NEW.completed_at = NOW();

    -- Update profiles table
    UPDATE profiles
    SET onboarding_completed = TRUE
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for onboarding completion
DROP TRIGGER IF EXISTS trigger_mark_onboarding_completed ON user_onboarding;
CREATE TRIGGER trigger_mark_onboarding_completed
  BEFORE UPDATE ON user_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION mark_onboarding_completed();

-- Function to generate profile text for embedding
CREATE OR REPLACE FUNCTION generate_profile_text(user_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  profile_text TEXT;
  onboarding_data RECORD;
BEGIN
  SELECT * INTO onboarding_data
  FROM user_onboarding
  WHERE user_id = user_id_param;

  profile_text := format(
    'Goal: %s. Persona: %s. Activity Level: %s. Training Frequency: %s days/week. Program Duration: %s weeks. Sex: %s. Age: %s. Weight: %skg. Height: %scm. Meals per day: %s. Training Times: %s. Dietary Restrictions: %s. Equipment: %s. Injuries: %s. Experience: %s.',
    onboarding_data.primary_goal,
    onboarding_data.user_persona,
    onboarding_data.current_activity_level,
    onboarding_data.desired_training_frequency,
    onboarding_data.program_duration_weeks,
    onboarding_data.biological_sex,
    onboarding_data.age,
    onboarding_data.current_weight_kg,
    onboarding_data.height_cm,
    onboarding_data.daily_meal_preference,
    array_to_string(onboarding_data.training_time_preferences, ', '),
    array_to_string(onboarding_data.dietary_restrictions, ', '),
    array_to_string(onboarding_data.equipment_access, ', '),
    array_to_string(onboarding_data.injury_limitations, ', '),
    onboarding_data.experience_level
  );

  RETURN profile_text;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 6. SEED DATA (for testing)
-- ============================================================

-- Example onboarding data will be inserted via app

-- ============================================================
-- 7. INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_user_onboarding_user_id ON user_onboarding(user_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_completed ON user_onboarding(completed);
CREATE INDEX IF NOT EXISTS idx_program_generation_requests_user_id ON program_generation_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_program_generation_requests_status ON program_generation_requests(status);

-- ============================================================
-- 8. COMMENTS FOR DOCUMENTATION
-- ============================================================

COMMENT ON TABLE user_onboarding IS 'Stores essential onboarding data for each user to generate personalized programs';
COMMENT ON TABLE user_profile_embeddings IS 'Stores vector embeddings of user profiles for semantic search and AI context';
COMMENT ON TABLE program_generation_requests IS 'Tracks user requests to generate new fitness programs';
