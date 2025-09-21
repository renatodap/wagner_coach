-- Create meal_category enum type
CREATE TYPE meal_category AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

-- Create meals table
CREATE TABLE IF NOT EXISTS meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_name TEXT NOT NULL CHECK (char_length(meal_name) BETWEEN 1 AND 200),
  meal_category meal_category NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL,
  calories INTEGER CHECK (calories IS NULL OR calories >= 0),
  protein_g DECIMAL(6,2) CHECK (protein_g IS NULL OR protein_g >= 0),
  carbs_g DECIMAL(6,2) CHECK (carbs_g IS NULL OR carbs_g >= 0),
  fat_g DECIMAL(6,2) CHECK (fat_g IS NULL OR fat_g >= 0),
  fiber_g DECIMAL(6,2) CHECK (fiber_g IS NULL OR fiber_g >= 0),
  notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_meals_user_id ON meals(user_id);
CREATE INDEX idx_meals_logged_at ON meals(logged_at DESC);
CREATE INDEX idx_meals_user_logged ON meals(user_id, logged_at DESC);

-- Enable Row Level Security
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own meals
CREATE POLICY "Users can view own meals"
  ON meals
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own meals
CREATE POLICY "Users can insert own meals"
  ON meals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own meals
CREATE POLICY "Users can update own meals"
  ON meals
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own meals
CREATE POLICY "Users can delete own meals"
  ON meals
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_meals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_meals_timestamp
  BEFORE UPDATE ON meals
  FOR EACH ROW
  EXECUTE FUNCTION update_meals_updated_at();

-- Add helpful comments
COMMENT ON TABLE meals IS 'Stores user meal logs with nutritional information';
COMMENT ON COLUMN meals.meal_category IS 'Category of the meal: breakfast, lunch, dinner, or snack';
COMMENT ON COLUMN meals.logged_at IS 'When the meal was consumed';
COMMENT ON COLUMN meals.calories IS 'Total calories in the meal';
COMMENT ON COLUMN meals.protein_g IS 'Protein content in grams';
COMMENT ON COLUMN meals.carbs_g IS 'Carbohydrate content in grams';
COMMENT ON COLUMN meals.fat_g IS 'Fat content in grams';
COMMENT ON COLUMN meals.fiber_g IS 'Fiber content in grams';