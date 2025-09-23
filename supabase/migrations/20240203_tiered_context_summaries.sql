-- Tiered Context Summary System
-- Enables AI to have access to:
-- - Last 7 days: Full detail
-- - Last 30 days: Summarized
-- - Last year: High-level quarterly summaries

-- ============================================================
-- PART 1: Context Summary Tables
-- ============================================================

-- Rolling summaries for different time periods
CREATE TABLE IF NOT EXISTS user_context_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Activity summaries (workout is just an activity type!)
  activity_summary JSONB DEFAULT '{}'::JSONB,
  -- Example: {
  --   "total": 22,
  --   "by_type": {"strength": 12, "running": 6, "cycling": 4},
  --   "avg_duration_min": 52,
  --   "total_distance_km": 85,
  --   "avg_heart_rate": 142,
  --   "consistency_score": 0.85,
  --   "top_activities": ["bench press", "running", "cycling"]
  -- }

  -- Nutrition summaries
  nutrition_summary JSONB DEFAULT '{}'::JSONB,
  -- Example: {
  --   "meals_logged": 63,
  --   "avg_daily_calories": 2450,
  --   "avg_daily_protein_g": 165,
  --   "avg_daily_carbs_g": 280,
  --   "avg_daily_fat_g": 75,
  --   "meal_frequency": 3.2,
  --   "adherence_to_goals": 0.78,
  --   "top_foods": ["chicken", "rice", "eggs", "broccoli"]
  -- }

  -- Key achievements during this period
  key_achievements TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- Example: ["First 5K under 25min", "Bench press PR 225lbs", "Lost 3lbs"]

  -- Challenges/setbacks during this period
  challenges_faced TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- Example: ["Knee pain week 2", "Missed 3 workouts due to work"]

  -- Body composition changes
  body_composition_change JSONB,
  -- Example: {"weight_change_lbs": -2.5, "body_fat_change": -1.2}

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate summaries for same period
  CONSTRAINT unique_user_period UNIQUE (user_id, period_type, period_start, period_end)
);

-- Important milestones and life events that affect training
CREATE TABLE IF NOT EXISTS user_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN ('achievement', 'injury', 'goal_completed', 'pr', 'life_event', 'setback')),
  title TEXT NOT NULL,
  description TEXT,
  occurred_at DATE NOT NULL,

  -- How much this affects training
  impact_level TEXT CHECK (impact_level IN ('high', 'medium', 'low')),

  -- Additional context
  metadata JSONB DEFAULT '{}'::JSONB,
  -- Example for PR: {"exercise": "bench press", "weight_lbs": 225, "previous_pr": 205}
  -- Example for injury: {"body_part": "knee", "recovery_weeks": 4, "restrictions": ["no running", "no jumping"]}

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PART 2: Indexes for Performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_context_summaries_user_period
  ON user_context_summaries(user_id, period_type, period_end DESC);

CREATE INDEX IF NOT EXISTS idx_context_summaries_dates
  ON user_context_summaries(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_milestones_user_date
  ON user_milestones(user_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_milestones_type
  ON user_milestones(milestone_type, impact_level);

-- ============================================================
-- PART 3: Row Level Security
-- ============================================================

ALTER TABLE user_context_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_milestones ENABLE ROW LEVEL SECURITY;

-- Summaries policies
CREATE POLICY "Users can view own summaries" ON user_context_summaries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own summaries" ON user_context_summaries
  FOR ALL USING (auth.uid() = user_id);

-- Milestones policies
CREATE POLICY "Users can view own milestones" ON user_milestones
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own milestones" ON user_milestones
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- PART 4: Helper Functions
-- ============================================================

-- Function to get tiered context for AI coach
CREATE OR REPLACE FUNCTION get_tiered_context_for_user(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Build tiered context with different detail levels
  SELECT json_build_object(
    -- IMMEDIATE: Last 7 days full detail
    'last_7_days', (
      SELECT json_build_object(
        'activities', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', id,
              'name', name,
              'activity_type', activity_type,
              'start_date', start_date,
              'duration_minutes', ROUND(elapsed_time_seconds / 60.0),
              'distance_km', ROUND((distance_meters / 1000.0)::numeric, 2),
              'calories', calories,
              'avg_heartrate', average_heartrate,
              'notes', notes,
              'perceived_exertion', perceived_exertion,
              'mood', mood
            ) ORDER BY start_date DESC
          )
          FROM activities
          WHERE user_id = p_user_id
            AND start_date >= CURRENT_DATE - INTERVAL '7 days'
        ),
        'meals', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', id,
              'logged_at', logged_at,
              'meal_type', meal_type,
              'meal_name', meal_name,
              'calories', calories,
              'protein_g', protein_g,
              'carbs_g', carbs_g,
              'fat_g', fat_g,
              'notes', notes
            ) ORDER BY logged_at DESC
          )
          FROM meals
          WHERE user_id = p_user_id
            AND logged_at >= CURRENT_DATE - INTERVAL '7 days'
        )
      )
    ),

    -- RECENT: Last 30 days summary
    'last_30_days_summary', (
      SELECT activity_summary || nutrition_summary
      FROM user_context_summaries
      WHERE user_id = p_user_id
        AND period_type = 'monthly'
        AND period_end >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY period_end DESC
      LIMIT 1
    ),

    -- HISTORICAL: Quarterly summaries for past year
    'quarterly_summaries', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'quarter', TO_CHAR(period_start, 'YYYY-Q'),
          'period_start', period_start,
          'period_end', period_end,
          'activities', activity_summary,
          'nutrition', nutrition_summary,
          'achievements', key_achievements,
          'challenges', challenges_faced,
          'body_comp_change', body_composition_change
        ) ORDER BY period_end DESC
      )
      FROM user_context_summaries
      WHERE user_id = p_user_id
        AND period_type = 'quarterly'
        AND period_end >= CURRENT_DATE - INTERVAL '1 year'
    ),

    -- MILESTONES: Important events
    'milestones', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'type', milestone_type,
          'title', title,
          'description', description,
          'date', occurred_at,
          'impact', impact_level,
          'details', metadata
        ) ORDER BY occurred_at DESC
      )
      FROM user_milestones
      WHERE user_id = p_user_id
        AND occurred_at >= CURRENT_DATE - INTERVAL '1 year'
      LIMIT 20
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_tiered_context_for_user(UUID) TO authenticated;

-- Function to auto-generate weekly summary
CREATE OR REPLACE FUNCTION generate_weekly_summary(p_user_id UUID, p_week_start DATE)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_week_end DATE := p_week_start + INTERVAL '6 days';
  v_activity_summary JSONB;
  v_nutrition_summary JSONB;
BEGIN
  -- Calculate activity summary
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'by_type', (
      SELECT jsonb_object_agg(activity_type, count)
      FROM (
        SELECT activity_type, COUNT(*) as count
        FROM activities
        WHERE user_id = p_user_id
          AND start_date::date BETWEEN p_week_start AND v_week_end
        GROUP BY activity_type
      ) type_counts
    ),
    'avg_duration_min', ROUND(AVG(elapsed_time_seconds / 60.0)),
    'total_distance_km', ROUND(SUM(distance_meters / 1000.0)::numeric, 2),
    'avg_heart_rate', ROUND(AVG(average_heartrate)),
    'total_calories', SUM(calories)
  ) INTO v_activity_summary
  FROM activities
  WHERE user_id = p_user_id
    AND start_date::date BETWEEN p_week_start AND v_week_end;

  -- Calculate nutrition summary
  SELECT jsonb_build_object(
    'meals_logged', COUNT(*),
    'avg_daily_calories', ROUND(AVG(daily_total)),
    'avg_daily_protein_g', ROUND(AVG(daily_protein)),
    'avg_daily_carbs_g', ROUND(AVG(daily_carbs)),
    'avg_daily_fat_g', ROUND(AVG(daily_fat))
  ) INTO v_nutrition_summary
  FROM (
    SELECT
      logged_at::date as day,
      SUM(calories) as daily_total,
      SUM(protein_g) as daily_protein,
      SUM(carbs_g) as daily_carbs,
      SUM(fat_g) as daily_fat
    FROM meals
    WHERE user_id = p_user_id
      AND logged_at::date BETWEEN p_week_start AND v_week_end
    GROUP BY logged_at::date
  ) daily_totals;

  -- Insert or update summary
  INSERT INTO user_context_summaries (
    user_id,
    period_type,
    period_start,
    period_end,
    activity_summary,
    nutrition_summary
  ) VALUES (
    p_user_id,
    'weekly',
    p_week_start,
    v_week_end,
    v_activity_summary,
    v_nutrition_summary
  )
  ON CONFLICT (user_id, period_type, period_start, period_end)
  DO UPDATE SET
    activity_summary = EXCLUDED.activity_summary,
    nutrition_summary = EXCLUDED.nutrition_summary,
    updated_at = NOW();
END;
$$;

-- ============================================================
-- PART 5: Triggers
-- ============================================================

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_summary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_context_summaries_timestamp
  BEFORE UPDATE ON user_context_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_summary_updated_at();

-- ============================================================
-- PART 6: Comments
-- ============================================================

COMMENT ON TABLE user_context_summaries IS 'Tiered summaries of user activity and nutrition for efficient AI context';
COMMENT ON TABLE user_milestones IS 'Important fitness milestones and life events affecting training';
COMMENT ON FUNCTION get_tiered_context_for_user(UUID) IS 'Returns tiered context: 7 days detailed, 30 days summary, 1 year quarterly';
COMMENT ON FUNCTION generate_weekly_summary(UUID, DATE) IS 'Auto-generates weekly summary for a user';