-- Food tracking personalization features
-- Tracks user's food logging patterns for personalized suggestions

-- Create table to track food usage frequency per user
CREATE TABLE IF NOT EXISTS user_food_frequency (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  food_id UUID REFERENCES foods(id) ON DELETE CASCADE NOT NULL,
  log_count INTEGER DEFAULT 1,
  last_quantity DECIMAL(10,2),
  last_unit food_unit,
  last_logged_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  total_quantity_logged DECIMAL(12,2) DEFAULT 0,
  favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, food_id)
);

-- Create table for quick access foods
CREATE TABLE IF NOT EXISTS user_quick_foods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  food_id UUID REFERENCES foods(id) ON DELETE CASCADE NOT NULL,
  display_order INTEGER DEFAULT 0,
  category TEXT, -- 'recent', 'frequent', 'favorite', 'breakfast', 'lunch', 'dinner', 'snack'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create table for meal time patterns
CREATE TABLE IF NOT EXISTS user_meal_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  meal_category meal_category,
  typical_time TIME,
  food_id UUID REFERENCES foods(id),
  frequency INTEGER DEFAULT 1,
  day_of_week INTEGER, -- 0-6, NULL for any day
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create table for user preferences
CREATE TABLE IF NOT EXISTS user_nutrition_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  preferred_units food_unit DEFAULT 'g',
  default_meal_category meal_category DEFAULT 'other',
  track_water BOOLEAN DEFAULT true,
  track_micronutrients BOOLEAN DEFAULT false,
  dietary_restrictions TEXT[], -- vegetarian, vegan, gluten_free, dairy_free, etc.
  allergens TEXT[], -- nuts, dairy, eggs, soy, etc.
  daily_calorie_goal DECIMAL(8,2),
  daily_protein_goal DECIMAL(8,2),
  daily_carbs_goal DECIMAL(8,2),
  daily_fat_goal DECIMAL(8,2),
  daily_fiber_goal DECIMAL(8,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_food_frequency_user_id ON user_food_frequency(user_id);
CREATE INDEX IF NOT EXISTS idx_user_food_frequency_log_count ON user_food_frequency(log_count DESC);
CREATE INDEX IF NOT EXISTS idx_user_food_frequency_last_logged ON user_food_frequency(last_logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_food_frequency_favorite ON user_food_frequency(favorite);
CREATE INDEX IF NOT EXISTS idx_user_quick_foods_user_id ON user_quick_foods(user_id);
CREATE INDEX IF NOT EXISTS idx_user_meal_patterns_user_id ON user_meal_patterns(user_id);

-- Enable RLS
ALTER TABLE user_food_frequency ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quick_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_meal_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_nutrition_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own food frequency" ON user_food_frequency
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own quick foods" ON user_quick_foods
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own meal patterns" ON user_meal_patterns
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own preferences" ON user_nutrition_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Function to update food frequency when a meal is logged
CREATE OR REPLACE FUNCTION update_food_frequency()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert frequency record
  INSERT INTO user_food_frequency (
    user_id,
    food_id,
    log_count,
    last_quantity,
    last_unit,
    last_logged_at,
    total_quantity_logged
  )
  SELECT
    ml.user_id,
    NEW.food_id,
    1,
    NEW.quantity,
    NEW.unit,
    NOW(),
    NEW.quantity
  FROM meal_logs ml
  WHERE ml.id = NEW.meal_log_id
  ON CONFLICT (user_id, food_id) DO UPDATE
  SET
    log_count = user_food_frequency.log_count + 1,
    last_quantity = NEW.quantity,
    last_unit = NEW.unit,
    last_logged_at = NOW(),
    total_quantity_logged = user_food_frequency.total_quantity_logged + NEW.quantity,
    updated_at = NOW();

  -- Update quick foods for recent items
  DELETE FROM user_quick_foods
  WHERE user_id = (SELECT user_id FROM meal_logs WHERE id = NEW.meal_log_id)
    AND food_id = NEW.food_id
    AND category = 'recent';

  INSERT INTO user_quick_foods (user_id, food_id, category, display_order)
  SELECT
    ml.user_id,
    NEW.food_id,
    'recent',
    0
  FROM meal_logs ml
  WHERE ml.id = NEW.meal_log_id;

  -- Keep only last 10 recent items per user
  WITH numbered_recent AS (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY created_at DESC
    ) as rn
    FROM user_quick_foods
    WHERE category = 'recent'
      AND user_id = (SELECT user_id FROM meal_logs WHERE id = NEW.meal_log_id)
  )
  DELETE FROM user_quick_foods
  WHERE id IN (
    SELECT id FROM numbered_recent WHERE rn > 10
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update frequency when food is logged
CREATE TRIGGER update_user_food_frequency
  AFTER INSERT ON meal_log_foods
  FOR EACH ROW
  EXECUTE FUNCTION update_food_frequency();

-- Function to get personalized food suggestions
CREATE OR REPLACE FUNCTION get_personalized_foods(
  p_user_id UUID,
  p_search_query TEXT DEFAULT '',
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  food_id UUID,
  name TEXT,
  brand TEXT,
  serving_size DECIMAL,
  serving_unit food_unit,
  calories DECIMAL,
  protein_g DECIMAL,
  carbs_g DECIMAL,
  fat_g DECIMAL,
  relevance_score INTEGER,
  last_logged_at TIMESTAMP WITH TIME ZONE,
  log_count INTEGER,
  is_favorite BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH user_foods AS (
    -- Get user's frequently used foods
    SELECT
      f.id,
      f.name,
      f.brand,
      f.serving_size,
      f.serving_unit,
      f.calories,
      f.protein_g,
      f.carbs_g,
      f.fat_g,
      uff.log_count,
      uff.last_logged_at,
      uff.favorite,
      CASE
        WHEN uff.favorite THEN 1000
        WHEN uff.last_logged_at > NOW() - INTERVAL '7 days' THEN 500 + uff.log_count * 10
        WHEN uff.last_logged_at > NOW() - INTERVAL '30 days' THEN 200 + uff.log_count * 5
        ELSE uff.log_count * 2
      END as relevance
    FROM foods f
    LEFT JOIN user_food_frequency uff ON f.id = uff.food_id AND uff.user_id = p_user_id
    WHERE (p_search_query = '' OR f.name ILIKE '%' || p_search_query || '%')
  )
  SELECT
    id as food_id,
    name,
    brand,
    serving_size,
    serving_unit,
    calories,
    protein_g,
    carbs_g,
    fat_g,
    relevance::INTEGER as relevance_score,
    last_logged_at,
    COALESCE(log_count, 0)::INTEGER as log_count,
    COALESCE(favorite, false) as is_favorite
  FROM user_foods
  ORDER BY relevance DESC NULLS LAST, name
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get meal suggestions based on time and patterns
CREATE OR REPLACE FUNCTION get_meal_suggestions(
  p_user_id UUID,
  p_meal_category meal_category DEFAULT NULL
)
RETURNS TABLE (
  suggested_foods JSON,
  suggestion_reason TEXT
) AS $$
DECLARE
  v_current_hour INTEGER;
  v_suggested_category meal_category;
BEGIN
  -- Determine meal category based on time if not provided
  v_current_hour := EXTRACT(HOUR FROM NOW());

  IF p_meal_category IS NULL THEN
    v_suggested_category := CASE
      WHEN v_current_hour BETWEEN 5 AND 10 THEN 'breakfast'
      WHEN v_current_hour BETWEEN 11 AND 14 THEN 'lunch'
      WHEN v_current_hour BETWEEN 17 AND 21 THEN 'dinner'
      WHEN v_current_hour BETWEEN 15 AND 16 THEN 'snack'
      ELSE 'snack'
    END;
  ELSE
    v_suggested_category := p_meal_category;
  END IF;

  -- Get suggestions based on patterns
  RETURN QUERY
  SELECT
    json_agg(
      json_build_object(
        'food_id', f.id,
        'name', f.name,
        'typical_quantity', ump.frequency
      )
    ) as suggested_foods,
    'Based on your typical ' || v_suggested_category || ' choices' as suggestion_reason
  FROM user_meal_patterns ump
  JOIN foods f ON ump.food_id = f.id
  WHERE ump.user_id = p_user_id
    AND ump.meal_category = v_suggested_category
    AND (ump.day_of_week IS NULL OR ump.day_of_week = EXTRACT(DOW FROM NOW()))
  GROUP BY ump.meal_category
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;