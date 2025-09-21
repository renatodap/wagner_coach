-- Enable the pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Experience levels enum
CREATE TYPE experience_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');

-- Goal types enum
CREATE TYPE goal_type AS ENUM (
  'weight_loss',
  'muscle_gain',
  'strength',
  'endurance',
  'flexibility',
  'general_fitness',
  'sport_specific',
  'rehabilitation',
  'habit_formation',
  'nutrition',
  'custom'
);

-- Goal status enum
CREATE TYPE goal_status AS ENUM ('active', 'completed', 'paused', 'archived');

-- Update profiles table with new columns
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS about_me TEXT,
  ADD COLUMN IF NOT EXISTS experience_level experience_level DEFAULT 'beginner',
  ADD COLUMN IF NOT EXISTS fitness_goals TEXT[],
  ADD COLUMN IF NOT EXISTS preferred_activities TEXT[],
  ADD COLUMN IF NOT EXISTS motivation_factors TEXT[],
  ADD COLUMN IF NOT EXISTS physical_limitations TEXT[],
  ADD COLUMN IF NOT EXISTS available_equipment TEXT[],
  ADD COLUMN IF NOT EXISTS training_frequency TEXT,
  ADD COLUMN IF NOT EXISTS session_duration TEXT,
  ADD COLUMN IF NOT EXISTS dietary_preferences TEXT[],
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS goals_embedding vector(768);

-- Create user_goals table
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type goal_type NOT NULL,
  goal_description TEXT NOT NULL,
  target_value NUMERIC,
  target_unit TEXT,
  target_date DATE,
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
  status goal_status DEFAULT 'active',
  is_active BOOLEAN DEFAULT true,
  progress_value NUMERIC DEFAULT 0,
  progress_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, goal_type, goal_description)
);

-- Create profile_embeddings table
CREATE TABLE IF NOT EXISTS profile_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_hash TEXT NOT NULL,
  embedding vector(768) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, content_hash)
);

-- Create goal_embeddings table
CREATE TABLE IF NOT EXISTS goal_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES user_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_hash TEXT NOT NULL,
  embedding vector(768) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(goal_id, content_hash)
);

-- Create ai_conversations table for storing chat context
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]',
  context_used JSONB DEFAULT '{}',
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_status ON user_goals(status);
CREATE INDEX IF NOT EXISTS idx_user_goals_is_active ON user_goals(is_active);
CREATE INDEX IF NOT EXISTS idx_user_goals_priority ON user_goals(priority);
CREATE INDEX IF NOT EXISTS idx_user_goals_created_at ON user_goals(created_at);

CREATE INDEX IF NOT EXISTS idx_profile_embeddings_user_id ON profile_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_embeddings_hash ON profile_embeddings(content_hash);

CREATE INDEX IF NOT EXISTS idx_goal_embeddings_goal_id ON goal_embeddings(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_embeddings_user_id ON goal_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_embeddings_hash ON goal_embeddings(content_hash);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_last_message ON ai_conversations(last_message_at);

-- Create vector similarity indexes using HNSW
CREATE INDEX IF NOT EXISTS idx_profile_embeddings_vector
ON profile_embeddings USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_goal_embeddings_vector
ON goal_embeddings USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_profiles_goals_embedding_vector
ON profiles USING hnsw (goals_embedding vector_cosine_ops);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_user_goals_updated_at ON user_goals;
CREATE TRIGGER update_user_goals_updated_at
    BEFORE UPDATE ON user_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profile_embeddings_updated_at ON profile_embeddings;
CREATE TRIGGER update_profile_embeddings_updated_at
    BEFORE UPDATE ON profile_embeddings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_goal_embeddings_updated_at ON goal_embeddings;
CREATE TRIGGER update_goal_embeddings_updated_at
    BEFORE UPDATE ON goal_embeddings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_conversations_updated_at ON ai_conversations;
CREATE TRIGGER update_ai_conversations_updated_at
    BEFORE UPDATE ON ai_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Vector similarity search functions
CREATE OR REPLACE FUNCTION match_profile_embeddings(
  query_embedding vector(768),
  match_user_id uuid,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  content_hash text,
  similarity float,
  metadata jsonb,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    profile_embeddings.id,
    profile_embeddings.content_hash,
    1 - (profile_embeddings.embedding <=> query_embedding) AS similarity,
    profile_embeddings.metadata,
    profile_embeddings.created_at
  FROM profile_embeddings
  WHERE
    profile_embeddings.user_id = match_user_id
    AND 1 - (profile_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY profile_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION match_goal_embeddings(
  query_embedding vector(768),
  match_user_id uuid,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  goal_id uuid,
  content_hash text,
  similarity float,
  metadata jsonb,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    goal_embeddings.id,
    goal_embeddings.goal_id,
    goal_embeddings.content_hash,
    1 - (goal_embeddings.embedding <=> query_embedding) AS similarity,
    goal_embeddings.metadata,
    goal_embeddings.created_at
  FROM goal_embeddings
  WHERE
    goal_embeddings.user_id = match_user_id
    AND 1 - (goal_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY goal_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to calculate user stats (for context assembly)
CREATE OR REPLACE FUNCTION calculate_user_stats(user_id uuid)
RETURNS TABLE (
  totalWorkouts int,
  currentStreak int,
  goalsCompleted int,
  totalMinutes int,
  favoriteActivity text,
  progressThisWeek int
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE((SELECT COUNT(*) FROM workouts w WHERE w.user_id = calculate_user_stats.user_id)::int, 0),
    0, -- currentStreak - would need workout completion tracking
    COALESCE((SELECT COUNT(*) FROM user_goals ug WHERE ug.user_id = calculate_user_stats.user_id AND ug.status = 'completed')::int, 0),
    0, -- totalMinutes - would need workout duration tracking
    'strength_training'::text, -- favoriteActivity - would need activity tracking
    0 -- progressThisWeek - would need weekly progress tracking
  ;
END;
$$;

-- Enable Row Level Security (RLS)
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_goals
CREATE POLICY "Users can view their own goals" ON user_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" ON user_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" ON user_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" ON user_goals
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for profile_embeddings
CREATE POLICY "Users can view their own profile embeddings" ON profile_embeddings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile embeddings" ON profile_embeddings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile embeddings" ON profile_embeddings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile embeddings" ON profile_embeddings
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for goal_embeddings
CREATE POLICY "Users can view their own goal embeddings" ON goal_embeddings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goal embeddings" ON goal_embeddings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goal embeddings" ON goal_embeddings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goal embeddings" ON goal_embeddings
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for ai_conversations
CREATE POLICY "Users can view their own conversations" ON ai_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations" ON ai_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON ai_conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" ON ai_conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;