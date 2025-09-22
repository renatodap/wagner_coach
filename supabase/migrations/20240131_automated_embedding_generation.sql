-- Automated Embedding Generation System
-- This creates the necessary tables and triggers for automatic embedding generation

-- Create embeddings table if it doesn't exist
CREATE TABLE IF NOT EXISTS embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL, -- 'workout', 'activity', 'goal', 'conversation'
  content_id TEXT NOT NULL, -- ID of the related content
  content TEXT NOT NULL, -- The text that was embedded
  embedding vector(1536), -- OpenAI embeddings are 1536 dimensions
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  -- Unique constraint to prevent duplicate embeddings
  UNIQUE(user_id, content_type, content_id)
);

-- Create index for similarity search
CREATE INDEX IF NOT EXISTS idx_embeddings_embedding ON embeddings USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_embeddings_user_id ON embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_content_type ON embeddings(content_type);

-- Create embedding generation queue table
CREATE TABLE IF NOT EXISTS embedding_generation_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  processed_at TIMESTAMP WITH TIME ZONE,

  -- Prevent duplicate queue items
  UNIQUE(user_id, content_type, content_id)
);

CREATE INDEX IF NOT EXISTS idx_embedding_queue_status ON embedding_generation_queue(status);
CREATE INDEX IF NOT EXISTS idx_embedding_queue_created ON embedding_generation_queue(created_at);

-- Function to queue embedding generation for workout completions
CREATE OR REPLACE FUNCTION queue_workout_embedding()
RETURNS TRIGGER AS $$
DECLARE
  v_workout_name TEXT;
  v_workout_type TEXT;
  v_content TEXT;
BEGIN
  -- Get workout details
  SELECT name, type INTO v_workout_name, v_workout_type
  FROM workouts
  WHERE id = NEW.workout_id;

  -- Build content for embedding
  v_content := format(
    'Workout: %s | Type: %s | Date: %s | Duration: %s minutes | Rating: %s | Notes: %s',
    v_workout_name,
    v_workout_type,
    NEW.completed_at::DATE,
    COALESCE(NEW.duration_seconds / 60, 0),
    COALESCE(NEW.rating::TEXT, 'N/A'),
    COALESCE(NEW.notes, '')
  );

  -- Insert into queue
  INSERT INTO embedding_generation_queue (
    user_id,
    content_type,
    content_id,
    content,
    status
  ) VALUES (
    NEW.user_id,
    'workout',
    NEW.id::TEXT,
    v_content,
    'pending'
  ) ON CONFLICT (user_id, content_type, content_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for workout completions
DROP TRIGGER IF EXISTS trigger_queue_workout_embedding ON workout_completions;
CREATE TRIGGER trigger_queue_workout_embedding
  AFTER INSERT OR UPDATE ON workout_completions
  FOR EACH ROW
  EXECUTE FUNCTION queue_workout_embedding();

-- Function to queue embedding generation for Strava activities
CREATE OR REPLACE FUNCTION queue_activity_embedding()
RETURNS TRIGGER AS $$
DECLARE
  v_content TEXT;
BEGIN
  -- Build content for embedding
  v_content := format(
    'Activity: %s | Type: %s | Date: %s | Distance: %skm | Duration: %s minutes | Elevation: %sm | Speed: %skm/h',
    NEW.name,
    NEW.type,
    NEW.start_date::DATE,
    COALESCE((NEW.distance / 1000)::TEXT, '0'),
    COALESCE((NEW.moving_time / 60)::TEXT, '0'),
    COALESCE(NEW.total_elevation_gain::TEXT, '0'),
    COALESCE(NEW.average_speed::TEXT, '0')
  );

  -- Insert into queue
  INSERT INTO embedding_generation_queue (
    user_id,
    content_type,
    content_id,
    content,
    status
  ) VALUES (
    NEW.user_id,
    'activity',
    NEW.id::TEXT,
    v_content,
    'pending'
  ) ON CONFLICT (user_id, content_type, content_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for activities
DROP TRIGGER IF EXISTS trigger_queue_activity_embedding ON activities;
CREATE TRIGGER trigger_queue_activity_embedding
  AFTER INSERT OR UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION queue_activity_embedding();

-- Function to queue embedding generation for goals
CREATE OR REPLACE FUNCTION queue_goal_embedding()
RETURNS TRIGGER AS $$
DECLARE
  v_content TEXT;
BEGIN
  -- Build content for embedding
  v_content := format(
    'Goal: %s | Description: %s | Target: %s %s by %s | Category: %s | Status: %s | Progress: %s%%',
    NEW.title,
    COALESCE(NEW.description, ''),
    COALESCE(NEW.target_value::TEXT, ''),
    COALESCE(NEW.target_unit, ''),
    COALESCE(NEW.target_date::TEXT, ''),
    COALESCE(NEW.category, ''),
    NEW.status,
    COALESCE(NEW.progress::TEXT, '0')
  );

  -- Insert into queue
  INSERT INTO embedding_generation_queue (
    user_id,
    content_type,
    content_id,
    content,
    status
  ) VALUES (
    NEW.user_id,
    'goal',
    NEW.id::TEXT,
    v_content,
    'pending'
  ) ON CONFLICT (user_id, content_type, content_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for goals
DROP TRIGGER IF EXISTS trigger_queue_goal_embedding ON goals;
CREATE TRIGGER trigger_queue_goal_embedding
  AFTER INSERT OR UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION queue_goal_embedding();

-- Function to search embeddings using similarity
CREATE OR REPLACE FUNCTION search_embeddings(
  p_user_id UUID,
  p_query_embedding vector(1536),
  p_limit INTEGER DEFAULT 10,
  p_content_types TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content_type TEXT,
  content_id TEXT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.content_type,
    e.content_id,
    e.content,
    e.metadata,
    1 - (e.embedding <=> p_query_embedding) as similarity
  FROM embeddings e
  WHERE e.user_id = p_user_id
    AND (p_content_types IS NULL OR e.content_type = ANY(p_content_types))
    AND e.embedding IS NOT NULL
  ORDER BY e.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE embedding_generation_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own embeddings" ON embeddings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own embeddings" ON embeddings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own embeddings" ON embeddings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own embeddings" ON embeddings
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own embedding queue" ON embedding_generation_queue
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own embedding queue" ON embedding_generation_queue
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to process embedding queue (called by webhook)
CREATE OR REPLACE FUNCTION process_embedding_queue()
RETURNS TABLE (
  queue_id UUID,
  user_id UUID,
  content_type TEXT,
  content_id TEXT,
  content TEXT
) AS $$
BEGIN
  -- Get pending items from the queue
  RETURN QUERY
  UPDATE embedding_generation_queue eq
  SET
    status = 'processing',
    processed_at = NOW()
  FROM (
    SELECT id
    FROM embedding_generation_queue
    WHERE status = 'pending'
      OR (status = 'failed' AND retry_count < 3)
    ORDER BY created_at
    LIMIT 10
  ) pending
  WHERE eq.id = pending.id
  RETURNING
    eq.id as queue_id,
    eq.user_id,
    eq.content_type,
    eq.content_id,
    eq.content;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark embedding as complete
CREATE OR REPLACE FUNCTION complete_embedding_generation(
  p_queue_id UUID,
  p_embedding vector(1536)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_queue_item RECORD;
BEGIN
  -- Get queue item
  SELECT * INTO v_queue_item
  FROM embedding_generation_queue
  WHERE id = p_queue_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Insert or update embedding
  INSERT INTO embeddings (
    user_id,
    content_type,
    content_id,
    content,
    embedding,
    metadata
  ) VALUES (
    v_queue_item.user_id,
    v_queue_item.content_type,
    v_queue_item.content_id,
    v_queue_item.content,
    p_embedding,
    jsonb_build_object(
      'generated_at', NOW(),
      'queue_id', p_queue_id
    )
  )
  ON CONFLICT (user_id, content_type, content_id)
  DO UPDATE SET
    embedding = EXCLUDED.embedding,
    content = EXCLUDED.content,
    updated_at = NOW(),
    metadata = embeddings.metadata || EXCLUDED.metadata;

  -- Mark queue item as completed
  UPDATE embedding_generation_queue
  SET status = 'completed'
  WHERE id = p_queue_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark embedding generation as failed
CREATE OR REPLACE FUNCTION fail_embedding_generation(
  p_queue_id UUID,
  p_error_message TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE embedding_generation_queue
  SET
    status = 'failed',
    error_message = p_error_message,
    retry_count = retry_count + 1
  WHERE id = p_queue_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;