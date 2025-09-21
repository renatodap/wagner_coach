-- Add missing columns to ai_conversations table if they don't exist

-- Add context_used column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_conversations'
    AND column_name = 'context_used'
  ) THEN
    ALTER TABLE ai_conversations
    ADD COLUMN context_used JSONB DEFAULT '{}';
  END IF;
END $$;

-- Add last_message_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_conversations'
    AND column_name = 'last_message_at'
  ) THEN
    ALTER TABLE ai_conversations
    ADD COLUMN last_message_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Create index on last_message_at if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_ai_conversations_last_message
ON ai_conversations(last_message_at);

-- Update existing rows to have a last_message_at value based on updated_at
UPDATE ai_conversations
SET last_message_at = updated_at
WHERE last_message_at IS NULL;