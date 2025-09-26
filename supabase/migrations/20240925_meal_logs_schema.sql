-- Create meal_logs table for new meal tracking system
CREATE TABLE IF NOT EXISTS meal_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Meal',
  category TEXT CHECK (category IN ('breakfast', 'lunch', 'dinner', 'snack', 'other')) DEFAULT 'other',
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  total_calories DECIMAL(10, 2) DEFAULT 0,
  total_protein_g DECIMAL(10, 2) DEFAULT 0,
  total_carbs_g DECIMAL(10, 2) DEFAULT 0,
  total_fat_g DECIMAL(10, 2) DEFAULT 0,
  total_fiber_g DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create meal_log_foods junction table
CREATE TABLE IF NOT EXISTS meal_log_foods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_log_id UUID REFERENCES meal_logs(id) ON DELETE CASCADE NOT NULL,
  food_id UUID REFERENCES foods(id) ON DELETE CASCADE NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'serving',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_id ON meal_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_logs_logged_at ON meal_logs(logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_meal_logs_category ON meal_logs(category);
CREATE INDEX IF NOT EXISTS idx_meal_log_foods_meal_log_id ON meal_log_foods(meal_log_id);
CREATE INDEX IF NOT EXISTS idx_meal_log_foods_food_id ON meal_log_foods(food_id);

-- Enable Row Level Security
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_log_foods ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DO $$
BEGIN
  -- Drop existing policies for meal_logs if they exist
  DROP POLICY IF EXISTS "Users can view own meal logs" ON meal_logs;
  DROP POLICY IF EXISTS "Users can create own meal logs" ON meal_logs;
  DROP POLICY IF EXISTS "Users can update own meal logs" ON meal_logs;
  DROP POLICY IF EXISTS "Users can delete own meal logs" ON meal_logs;

  -- Drop existing policies for meal_log_foods if they exist
  DROP POLICY IF EXISTS "Users can view own meal log foods" ON meal_log_foods;
  DROP POLICY IF EXISTS "Users can add foods to own meal logs" ON meal_log_foods;
  DROP POLICY IF EXISTS "Users can update foods in own meal logs" ON meal_log_foods;
  DROP POLICY IF EXISTS "Users can delete foods from own meal logs" ON meal_log_foods;
END $$;

-- RLS Policies for meal_logs
CREATE POLICY "Users can view own meal logs"
  ON meal_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own meal logs"
  ON meal_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal logs"
  ON meal_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal logs"
  ON meal_logs FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for meal_log_foods
CREATE POLICY "Users can view own meal log foods"
  ON meal_log_foods FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meal_logs
      WHERE meal_logs.id = meal_log_foods.meal_log_id
      AND meal_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add foods to own meal logs"
  ON meal_log_foods FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meal_logs
      WHERE meal_logs.id = meal_log_foods.meal_log_id
      AND meal_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update foods in own meal logs"
  ON meal_log_foods FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM meal_logs
      WHERE meal_logs.id = meal_log_foods.meal_log_id
      AND meal_logs.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meal_logs
      WHERE meal_logs.id = meal_log_foods.meal_log_id
      AND meal_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete foods from own meal logs"
  ON meal_log_foods FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM meal_logs
      WHERE meal_logs.id = meal_log_foods.meal_log_id
      AND meal_logs.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on meal_logs
CREATE TRIGGER update_meal_logs_updated_at
  BEFORE UPDATE ON meal_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Add comments
COMMENT ON TABLE meal_logs IS 'Stores user meal logs with calculated nutrition totals';
COMMENT ON TABLE meal_log_foods IS 'Junction table linking meals to foods with quantities';
COMMENT ON COLUMN meal_logs.category IS 'Meal category: breakfast, lunch, dinner, snack, or other';
COMMENT ON COLUMN meal_logs.total_calories IS 'Total calories for the meal (calculated from foods)';
COMMENT ON COLUMN meal_log_foods.quantity IS 'Quantity of the food in the specified unit';
COMMENT ON COLUMN meal_log_foods.unit IS 'Unit of measurement (g, ml, oz, serving, etc)';