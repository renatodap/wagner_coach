-- Profile and Goals System Migration
-- This migration extends the user profile system and adds comprehensive goal tracking

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create experience level enum type
DO $$ BEGIN
    CREATE TYPE experience_level AS ENUM ('beginner', 'intermediate', 'advanced');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create goal type enum
DO $$ BEGIN
    CREATE TYPE goal_type AS ENUM (
        'weight_loss',
        'muscle_gain',
        'strength',
        'endurance',
        'flexibility',
        'general_fitness',
        'sports_performance',
        'rehabilitation',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Extend profiles table with new columns
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS about_me TEXT,
    ADD COLUMN IF NOT EXISTS experience_level experience_level,
    ADD COLUMN IF NOT EXISTS fitness_goals TEXT[],
    ADD COLUMN IF NOT EXISTS motivation_factors TEXT[],
    ADD COLUMN IF NOT EXISTS preferred_activities TEXT[],
    ADD COLUMN IF NOT EXISTS physical_limitations TEXT[],
    ADD COLUMN IF NOT EXISTS available_equipment TEXT[],
    ADD COLUMN IF NOT EXISTS training_frequency TEXT,
    ADD COLUMN IF NOT EXISTS session_duration TEXT,
    ADD COLUMN IF NOT EXISTS dietary_preferences TEXT[],
    ADD COLUMN IF NOT EXISTS height INTEGER CHECK (height > 0 AND height < 300),
    ADD COLUMN IF NOT EXISTS weight INTEGER CHECK (weight > 0 AND weight < 500),
    ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
    ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
        "email_notifications": true,
        "push_notifications": true,
        "workout_reminders": true,
        "progress_updates": true,
        "coach_messages": true,
        "reminder_time": null,
        "weekly_summary": true
    }'::jsonb;

-- Create user_goals table
CREATE TABLE IF NOT EXISTS user_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_type goal_type NOT NULL,
    goal_description TEXT NOT NULL,
    target_value NUMERIC CHECK (target_value > 0),
    target_unit TEXT,
    target_date DATE CHECK (target_date > CURRENT_DATE),
    priority INTEGER NOT NULL DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create profile_embeddings table
CREATE TABLE IF NOT EXISTS profile_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_hash TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, content_hash)
);

-- Create goal_embeddings table
CREATE TABLE IF NOT EXISTS goal_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES user_goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_hash TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(goal_id, content_hash)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_is_active ON user_goals(is_active);
CREATE INDEX IF NOT EXISTS idx_user_goals_priority ON user_goals(priority);
CREATE INDEX IF NOT EXISTS idx_profile_embeddings_user_id ON profile_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_embeddings_goal_id ON goal_embeddings(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_embeddings_user_id ON goal_embeddings(user_id);

-- Create GiST indexes for vector similarity searches
CREATE INDEX IF NOT EXISTS idx_profile_embeddings_embedding ON profile_embeddings USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_goal_embeddings_embedding ON goal_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_goals_updated_at ON user_goals;
CREATE TRIGGER update_user_goals_updated_at
    BEFORE UPDATE ON user_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_embeddings ENABLE ROW LEVEL SECURITY;

-- Profiles table policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON profiles
    FOR DELETE USING (auth.uid() = id);

-- User goals table policies
CREATE POLICY "Users can view own goals" ON user_goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own goals" ON user_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON user_goals
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON user_goals
    FOR DELETE USING (auth.uid() = user_id);

-- Profile embeddings table policies (read-only for users, write via service role)
CREATE POLICY "Users can view own profile embeddings" ON profile_embeddings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all profile embeddings" ON profile_embeddings
    FOR ALL USING (auth.role() = 'service_role');

-- Goal embeddings table policies (read-only for users, write via service role)
CREATE POLICY "Users can view own goal embeddings" ON goal_embeddings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all goal embeddings" ON goal_embeddings
    FOR ALL USING (auth.role() = 'service_role');

-- Helper functions for testing (these will be used in tests)
CREATE OR REPLACE FUNCTION get_table_columns(table_name TEXT)
RETURNS TABLE(column_name TEXT, data_type TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.column_name::TEXT,
        c.data_type::TEXT
    FROM information_schema.columns c
    WHERE c.table_name = $1
    AND c.table_schema = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_column_defaults(table_name TEXT)
RETURNS TABLE(column_name TEXT, column_default TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.column_name::TEXT,
        c.column_default::TEXT
    FROM information_schema.columns c
    WHERE c.table_name = $1
    AND c.table_schema = 'public'
    AND c.column_default IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_table_constraints(table_name TEXT)
RETURNS TABLE(
    constraint_type TEXT,
    column_name TEXT,
    foreign_table_name TEXT,
    foreign_table_schema TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        tc.constraint_type::TEXT,
        kcu.column_name::TEXT,
        ccu.table_name::TEXT as foreign_table_name,
        ccu.table_schema::TEXT as foreign_table_schema
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE tc.table_name = $1
    AND tc.table_schema = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_column_info(table_name TEXT, column_name TEXT)
RETURNS TABLE(data_type TEXT, dimension INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE
            WHEN udt_name = 'vector' THEN 'vector'
            ELSE data_type
        END::TEXT as data_type,
        CASE
            WHEN udt_name = 'vector' THEN 1536
            ELSE NULL
        END::INTEGER as dimension
    FROM information_schema.columns
    WHERE table_name = $1
    AND column_name = $2
    AND table_schema = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_table_indexes(table_name TEXT)
RETURNS TABLE(index_name TEXT, index_type TEXT, column_name TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.indexname::TEXT,
        am.amname::TEXT as index_type,
        a.attname::TEXT as column_name
    FROM pg_indexes i
    JOIN pg_class c ON c.relname = i.indexname
    JOIN pg_index ix ON ix.indexrelid = c.oid
    JOIN pg_attribute a ON a.attrelid = ix.indrelid AND a.attnum = ANY(ix.indkey)
    JOIN pg_am am ON am.oid = c.relam
    WHERE i.tablename = $1
    AND i.schemaname = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION get_table_columns(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_column_defaults(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_table_constraints(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_column_info(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_table_indexes(TEXT) TO anon, authenticated;