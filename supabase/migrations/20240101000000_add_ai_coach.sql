-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding columns to existing tables
ALTER TABLE workout_completions ADD COLUMN IF NOT EXISTS embedding vector(768);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS goals_embedding vector(768);

-- Create table for AI conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  embedding vector(768),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create table for user context embeddings
CREATE TABLE IF NOT EXISTS user_context_embeddings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('workout', 'goal', 'conversation', 'progress', 'exercise', 'achievement')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  embedding vector(768) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create rate limits table
CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  requests integer DEFAULT 0,
  window integer DEFAULT 86400, -- 24 hours in seconds
  reset_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, endpoint)
);

-- Enable RLS (Row Level Security)
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_context_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_conversations
CREATE POLICY "Users can view their own conversations"
  ON ai_conversations
  FOR ALL
  USING (auth.uid() = user_id);

-- Create policies for user_context_embeddings
CREATE POLICY "Users can view their own embeddings"
  ON user_context_embeddings
  FOR ALL
  USING (auth.uid() = user_id);

-- Create policies for rate_limits
CREATE POLICY "Users can view their own rate limits"
  ON rate_limits
  FOR ALL
  USING (auth.uid() = user_id);

-- Create similarity search function
CREATE OR REPLACE FUNCTION search_user_context(
  query_embedding vector(768),
  target_user_id uuid,
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  content text,
  content_type text,
  metadata jsonb,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    user_context_embeddings.id,
    user_context_embeddings.content,
    user_context_embeddings.content_type,
    user_context_embeddings.metadata,
    1 - (user_context_embeddings.embedding <=> query_embedding) AS similarity
  FROM user_context_embeddings
  WHERE
    user_context_embeddings.user_id = target_user_id
    AND 1 - (user_context_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY user_context_embeddings.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Create index for faster similarity search
CREATE INDEX IF NOT EXISTS idx_user_context_embeddings_embedding
  ON user_context_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_user_context_embeddings_user_id
  ON user_context_embeddings(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id
  ON ai_conversations(user_id);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_endpoint
  ON rate_limits(user_id, endpoint);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limits_updated_at BEFORE UPDATE ON rate_limits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate embeddings for new workout completions
CREATE OR REPLACE FUNCTION generate_workout_embedding()
RETURNS TRIGGER AS $$
BEGIN
  -- This is a placeholder - actual embedding generation happens in the application
  -- We just ensure the column is ready for the embedding
  NEW.embedding = NULL; -- Will be populated by the application
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new workout completions
CREATE TRIGGER generate_workout_embedding_trigger
  AFTER INSERT ON workout_completions
  FOR EACH ROW EXECUTE FUNCTION generate_workout_embedding();

-- Grant necessary permissions
GRANT ALL ON ai_conversations TO authenticated;
GRANT ALL ON user_context_embeddings TO authenticated;
GRANT ALL ON rate_limits TO authenticated;
GRANT EXECUTE ON FUNCTION search_user_context TO authenticated;