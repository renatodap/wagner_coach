-- Create table to track Perplexity searches for rate limiting and cost control
CREATE TABLE IF NOT EXISTS perplexity_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  search_term TEXT NOT NULL,
  success BOOLEAN DEFAULT false,
  search_cost DECIMAL(10, 4) DEFAULT 0.01, -- Cost in dollars
  cached_result JSONB, -- Store successful results for reuse
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_perplexity_searches_user_date ON perplexity_searches(user_id, created_at DESC);
CREATE INDEX idx_perplexity_searches_term ON perplexity_searches(search_term);
CREATE INDEX idx_perplexity_searches_success ON perplexity_searches(success);
CREATE INDEX idx_perplexity_searches_created ON perplexity_searches(created_at DESC);

-- RLS policies
ALTER TABLE perplexity_searches ENABLE ROW LEVEL SECURITY;

-- Users can only see their own searches
CREATE POLICY "Users can view own searches"
  ON perplexity_searches FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own searches (within rate limits)
CREATE POLICY "Users can create searches"
  ON perplexity_searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to check rate limits before insert
CREATE OR REPLACE FUNCTION check_perplexity_rate_limits()
RETURNS TRIGGER AS $$
DECLARE
  daily_count INT;
  monthly_count INT;
  global_daily_count INT;
  monthly_cost DECIMAL;
BEGIN
  -- Check user daily limit (10)
  SELECT COUNT(*) INTO daily_count
  FROM perplexity_searches
  WHERE user_id = NEW.user_id
    AND created_at >= CURRENT_DATE;

  IF daily_count >= 10 THEN
    RAISE EXCEPTION 'Daily search limit exceeded (10 searches per day)';
  END IF;

  -- Check user monthly limit (100)
  SELECT COUNT(*) INTO monthly_count
  FROM perplexity_searches
  WHERE user_id = NEW.user_id
    AND created_at >= DATE_TRUNC('month', CURRENT_DATE);

  IF monthly_count >= 100 THEN
    RAISE EXCEPTION 'Monthly search limit exceeded (100 searches per month)';
  END IF;

  -- Check global daily limit (500)
  SELECT COUNT(*) INTO global_daily_count
  FROM perplexity_searches
  WHERE created_at >= CURRENT_DATE;

  IF global_daily_count >= 500 THEN
    RAISE EXCEPTION 'System daily limit exceeded. Please try again tomorrow.';
  END IF;

  -- Check monthly cost limit ($50)
  SELECT COALESCE(SUM(search_cost), 0) INTO monthly_cost
  FROM perplexity_searches
  WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE);

  IF monthly_cost >= 50 THEN
    RAISE EXCEPTION 'Monthly cost limit exceeded. Service temporarily unavailable.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce rate limits
CREATE TRIGGER enforce_perplexity_rate_limits
  BEFORE INSERT ON perplexity_searches
  FOR EACH ROW
  EXECUTE FUNCTION check_perplexity_rate_limits();

-- View to get user's search stats
CREATE OR REPLACE VIEW user_search_stats AS
SELECT
  user_id,
  DATE(created_at) as search_date,
  COUNT(*) as searches_count,
  COUNT(*) FILTER (WHERE success = true) as successful_searches,
  SUM(search_cost) as total_cost
FROM perplexity_searches
GROUP BY user_id, DATE(created_at);

-- Grant permissions
GRANT SELECT ON user_search_stats TO authenticated;

-- Comment the table
COMMENT ON TABLE perplexity_searches IS 'Tracks Perplexity API searches for rate limiting, cost control, and caching';
COMMENT ON COLUMN perplexity_searches.search_term IS 'Normalized search term (lowercase, trimmed)';
COMMENT ON COLUMN perplexity_searches.cached_result IS 'Cached nutrition data to avoid duplicate searches';
COMMENT ON COLUMN perplexity_searches.search_cost IS 'Estimated cost per search in USD';