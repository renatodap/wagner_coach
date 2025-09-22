-- =====================================================
-- NUTRITION V2: Complete Nutrition Tracking System
-- =====================================================
-- This migration creates a comprehensive nutrition tracking system
-- that supports individual foods, complex meals, quantities, and
-- flexible logging with proper relationships and constraints.

-- Drop existing tables if we're upgrading
DROP TABLE IF EXISTS meal_log_foods CASCADE;
DROP TABLE IF EXISTS meal_logs CASCADE;
DROP TABLE IF EXISTS meal_template_foods CASCADE;
DROP TABLE IF EXISTS meal_templates CASCADE;
DROP TABLE IF EXISTS foods CASCADE;
DROP TABLE IF EXISTS meals CASCADE; -- Old table from v1
DROP TYPE IF EXISTS meal_category CASCADE;
DROP TYPE IF EXISTS food_unit CASCADE;

-- =====================================================
-- ENUMS
-- =====================================================

-- Food measurement units
CREATE TYPE food_unit AS ENUM (
  'g',        -- grams
  'ml',       -- milliliters
  'oz',       -- ounces
  'cup',      -- cups
  'tbsp',     -- tablespoons
  'tsp',      -- teaspoons
  'serving',  -- servings (based on package)
  'piece',    -- pieces (e.g., 1 apple)
  'slice'     -- slices
);

-- Meal categories (more flexible than before)
CREATE TYPE meal_category AS ENUM (
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'pre_workout',
  'post_workout',
  'other'
);

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Master food database (system foods + user custom foods)
CREATE TABLE IF NOT EXISTS foods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Basic info
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  brand TEXT CHECK (brand IS NULL OR char_length(brand) <= 100),
  barcode TEXT CHECK (barcode IS NULL OR char_length(barcode) <= 50),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 500),

  -- Serving information
  serving_size DECIMAL(10,2) NOT NULL DEFAULT 100 CHECK (serving_size > 0),
  serving_unit food_unit NOT NULL DEFAULT 'g',
  serving_description TEXT, -- e.g., "1 medium apple (182g)"

  -- Nutrition per serving (not per 100g, but per serving_size)
  calories DECIMAL(8,2) CHECK (calories IS NULL OR calories >= 0),
  protein_g DECIMAL(8,2) CHECK (protein_g IS NULL OR protein_g >= 0),
  carbs_g DECIMAL(8,2) CHECK (carbs_g IS NULL OR carbs_g >= 0),
  fat_g DECIMAL(8,2) CHECK (fat_g IS NULL OR fat_g >= 0),
  fiber_g DECIMAL(8,2) CHECK (fiber_g IS NULL OR fiber_g >= 0),
  sugar_g DECIMAL(8,2) CHECK (sugar_g IS NULL OR sugar_g >= 0),
  sodium_mg DECIMAL(8,2) CHECK (sodium_mg IS NULL OR sodium_mg >= 0),

  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for system foods
  is_verified BOOLEAN DEFAULT false, -- True for system/verified foods
  is_public BOOLEAN DEFAULT false, -- Whether other users can see this food

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Indexes for search
  CONSTRAINT unique_barcode UNIQUE(barcode)
);

-- User's meal logs (can be a single food or a complex meal)
CREATE TABLE IF NOT EXISTS meal_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Meal info
  name TEXT CHECK (name IS NULL OR char_length(name) <= 200), -- Optional meal name
  category meal_category NOT NULL DEFAULT 'other',
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Optional notes
  notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 500),

  -- Calculated totals (denormalized for performance)
  -- These are updated via trigger when meal_log_foods changes
  total_calories DECIMAL(10,2) DEFAULT 0,
  total_protein_g DECIMAL(10,2) DEFAULT 0,
  total_carbs_g DECIMAL(10,2) DEFAULT 0,
  total_fat_g DECIMAL(10,2) DEFAULT 0,
  total_fiber_g DECIMAL(10,2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Foods within each meal log with quantities
CREATE TABLE IF NOT EXISTS meal_log_foods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_log_id UUID NOT NULL REFERENCES meal_logs(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES foods(id) ON DELETE RESTRICT,

  -- Quantity consumed
  quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  unit food_unit NOT NULL,

  -- Calculated nutrition (based on quantity)
  -- Stored for historical accuracy even if food data changes
  calories_consumed DECIMAL(10,2),
  protein_consumed DECIMAL(10,2),
  carbs_consumed DECIMAL(10,2),
  fat_consumed DECIMAL(10,2),
  fiber_consumed DECIMAL(10,2),

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Ensure no duplicate foods in the same meal
  CONSTRAINT unique_food_per_meal UNIQUE(meal_log_id, food_id)
);

-- User's saved meal templates for quick logging
CREATE TABLE IF NOT EXISTS meal_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  category meal_category NOT NULL DEFAULT 'other',
  description TEXT CHECK (description IS NULL OR char_length(description) <= 500),

  -- Calculated totals for display
  total_calories DECIMAL(10,2) DEFAULT 0,
  total_protein_g DECIMAL(10,2) DEFAULT 0,
  total_carbs_g DECIMAL(10,2) DEFAULT 0,
  total_fat_g DECIMAL(10,2) DEFAULT 0,
  total_fiber_g DECIMAL(10,2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Ensure unique template names per user
  CONSTRAINT unique_template_name_per_user UNIQUE(user_id, name)
);

-- Foods in meal templates
CREATE TABLE IF NOT EXISTS meal_template_foods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_template_id UUID NOT NULL REFERENCES meal_templates(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,

  quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  unit food_unit NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT unique_food_per_template UNIQUE(meal_template_id, food_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Foods table indexes
CREATE INDEX idx_foods_name ON foods USING gin(to_tsvector('english', name));
CREATE INDEX idx_foods_brand ON foods(brand) WHERE brand IS NOT NULL;
CREATE INDEX idx_foods_created_by ON foods(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX idx_foods_barcode ON foods(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_foods_public ON foods(is_public) WHERE is_public = true;

-- Meal logs indexes
CREATE INDEX idx_meal_logs_user_id ON meal_logs(user_id);
CREATE INDEX idx_meal_logs_logged_at ON meal_logs(logged_at DESC);
CREATE INDEX idx_meal_logs_user_date ON meal_logs(user_id, logged_at DESC);
CREATE INDEX idx_meal_logs_category ON meal_logs(category);

-- Meal log foods indexes
CREATE INDEX idx_meal_log_foods_meal_log ON meal_log_foods(meal_log_id);
CREATE INDEX idx_meal_log_foods_food ON meal_log_foods(food_id);

-- Meal templates indexes
CREATE INDEX idx_meal_templates_user ON meal_templates(user_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_log_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_template_foods ENABLE ROW LEVEL SECURITY;

-- Foods policies
CREATE POLICY "Public and verified foods are visible to all"
  ON foods FOR SELECT
  USING (is_public = true OR is_verified = true OR created_by = auth.uid());

CREATE POLICY "Users can create their own foods"
  ON foods FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own foods"
  ON foods FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own foods"
  ON foods FOR DELETE
  USING (created_by = auth.uid());

-- Meal logs policies
CREATE POLICY "Users can view their own meal logs"
  ON meal_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own meal logs"
  ON meal_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own meal logs"
  ON meal_logs FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own meal logs"
  ON meal_logs FOR DELETE
  USING (user_id = auth.uid());

-- Meal log foods policies
CREATE POLICY "Users can view foods in their meals"
  ON meal_log_foods FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM meal_logs
    WHERE meal_logs.id = meal_log_foods.meal_log_id
    AND meal_logs.user_id = auth.uid()
  ));

CREATE POLICY "Users can add foods to their meals"
  ON meal_log_foods FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM meal_logs
    WHERE meal_logs.id = meal_log_foods.meal_log_id
    AND meal_logs.user_id = auth.uid()
  ));

CREATE POLICY "Users can update foods in their meals"
  ON meal_log_foods FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM meal_logs
    WHERE meal_logs.id = meal_log_foods.meal_log_id
    AND meal_logs.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM meal_logs
    WHERE meal_logs.id = meal_log_foods.meal_log_id
    AND meal_logs.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete foods from their meals"
  ON meal_log_foods FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM meal_logs
    WHERE meal_logs.id = meal_log_foods.meal_log_id
    AND meal_logs.user_id = auth.uid()
  ));

-- Meal templates policies
CREATE POLICY "Users can view their own meal templates"
  ON meal_templates FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own meal templates"
  ON meal_templates FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own meal templates"
  ON meal_templates FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own meal templates"
  ON meal_templates FOR DELETE
  USING (user_id = auth.uid());

-- Meal template foods policies
CREATE POLICY "Users can view foods in their templates"
  ON meal_template_foods FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM meal_templates
    WHERE meal_templates.id = meal_template_foods.meal_template_id
    AND meal_templates.user_id = auth.uid()
  ));

CREATE POLICY "Users can add foods to their templates"
  ON meal_template_foods FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM meal_templates
    WHERE meal_templates.id = meal_template_foods.meal_template_id
    AND meal_templates.user_id = auth.uid()
  ));

CREATE POLICY "Users can update foods in their templates"
  ON meal_template_foods FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM meal_templates
    WHERE meal_templates.id = meal_template_foods.meal_template_id
    AND meal_templates.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM meal_templates
    WHERE meal_templates.id = meal_template_foods.meal_template_id
    AND meal_templates.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete foods from their templates"
  ON meal_template_foods FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM meal_templates
    WHERE meal_templates.id = meal_template_foods.meal_template_id
    AND meal_templates.user_id = auth.uid()
  ));

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to calculate nutrition based on quantity
CREATE OR REPLACE FUNCTION calculate_nutrition(
  base_value DECIMAL,
  quantity DECIMAL,
  from_unit food_unit,
  base_serving DECIMAL,
  base_unit food_unit
) RETURNS DECIMAL AS $$
DECLARE
  multiplier DECIMAL;
BEGIN
  -- Convert everything to grams for calculation
  -- This is simplified - you might want more sophisticated conversion
  IF from_unit = base_unit THEN
    multiplier := quantity / base_serving;
  ELSE
    -- Add conversion logic here as needed
    multiplier := quantity / base_serving;
  END IF;

  RETURN ROUND(base_value * multiplier, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to update meal log totals
CREATE OR REPLACE FUNCTION update_meal_log_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the meal_log totals
  UPDATE meal_logs
  SET
    total_calories = COALESCE((
      SELECT SUM(calories_consumed) FROM meal_log_foods
      WHERE meal_log_id = COALESCE(NEW.meal_log_id, OLD.meal_log_id)
    ), 0),
    total_protein_g = COALESCE((
      SELECT SUM(protein_consumed) FROM meal_log_foods
      WHERE meal_log_id = COALESCE(NEW.meal_log_id, OLD.meal_log_id)
    ), 0),
    total_carbs_g = COALESCE((
      SELECT SUM(carbs_consumed) FROM meal_log_foods
      WHERE meal_log_id = COALESCE(NEW.meal_log_id, OLD.meal_log_id)
    ), 0),
    total_fat_g = COALESCE((
      SELECT SUM(fat_consumed) FROM meal_log_foods
      WHERE meal_log_id = COALESCE(NEW.meal_log_id, OLD.meal_log_id)
    ), 0),
    total_fiber_g = COALESCE((
      SELECT SUM(fiber_consumed) FROM meal_log_foods
      WHERE meal_log_id = COALESCE(NEW.meal_log_id, OLD.meal_log_id)
    ), 0),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.meal_log_id, OLD.meal_log_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate consumed nutrition when inserting meal_log_foods
CREATE OR REPLACE FUNCTION calculate_consumed_nutrition()
RETURNS TRIGGER AS $$
DECLARE
  food_record RECORD;
BEGIN
  -- Get the food's nutrition info
  SELECT * INTO food_record FROM foods WHERE id = NEW.food_id;

  -- Calculate consumed amounts based on quantity
  NEW.calories_consumed := calculate_nutrition(
    food_record.calories, NEW.quantity, NEW.unit,
    food_record.serving_size, food_record.serving_unit
  );

  NEW.protein_consumed := calculate_nutrition(
    food_record.protein_g, NEW.quantity, NEW.unit,
    food_record.serving_size, food_record.serving_unit
  );

  NEW.carbs_consumed := calculate_nutrition(
    food_record.carbs_g, NEW.quantity, NEW.unit,
    food_record.serving_size, food_record.serving_unit
  );

  NEW.fat_consumed := calculate_nutrition(
    food_record.fat_g, NEW.quantity, NEW.unit,
    food_record.serving_size, food_record.serving_unit
  );

  NEW.fiber_consumed := calculate_nutrition(
    food_record.fiber_g, NEW.quantity, NEW.unit,
    food_record.serving_size, food_record.serving_unit
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Calculate nutrition when adding foods to meals
CREATE TRIGGER calculate_meal_food_nutrition
  BEFORE INSERT OR UPDATE ON meal_log_foods
  FOR EACH ROW
  EXECUTE FUNCTION calculate_consumed_nutrition();

-- Update meal totals when foods change
CREATE TRIGGER update_meal_totals_on_food_change
  AFTER INSERT OR UPDATE OR DELETE ON meal_log_foods
  FOR EACH ROW
  EXECUTE FUNCTION update_meal_log_totals();

-- Update timestamps
CREATE TRIGGER update_foods_timestamp
  BEFORE UPDATE ON foods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_meal_logs_timestamp
  BEFORE UPDATE ON meal_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_meal_templates_timestamp
  BEFORE UPDATE ON meal_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- SEED DATA: Common Foods
-- =====================================================

-- Insert some common foods to get started
INSERT INTO foods (name, brand, serving_size, serving_unit, serving_description,
                   calories, protein_g, carbs_g, fat_g, fiber_g, is_verified, is_public)
VALUES
  -- Fruits
  ('Apple', NULL, 182, 'g', '1 medium apple', 95, 0.5, 25, 0.3, 4.4, true, true),
  ('Banana', NULL, 118, 'g', '1 medium banana', 105, 1.3, 27, 0.4, 3.1, true, true),
  ('Orange', NULL, 154, 'g', '1 medium orange', 62, 1.2, 15.4, 0.2, 3.1, true, true),

  -- Proteins
  ('Chicken Breast (cooked)', NULL, 100, 'g', '100g cooked', 165, 31, 0, 3.6, 0, true, true),
  ('Salmon (cooked)', NULL, 100, 'g', '100g cooked', 206, 22, 0, 12, 0, true, true),
  ('Eggs', NULL, 50, 'g', '1 large egg', 78, 6.3, 0.6, 5.3, 0, true, true),
  ('Greek Yogurt (plain)', NULL, 150, 'g', '150g serving', 100, 17, 6, 0.7, 0, true, true),

  -- Carbs
  ('White Rice (cooked)', NULL, 158, 'g', '1 cup cooked', 205, 4.3, 45, 0.4, 0.6, true, true),
  ('Brown Rice (cooked)', NULL, 195, 'g', '1 cup cooked', 216, 5, 45, 1.8, 3.5, true, true),
  ('Oatmeal (dry)', NULL, 40, 'g', '1/2 cup dry', 150, 5, 27, 3, 4, true, true),
  ('Sweet Potato', NULL, 130, 'g', '1 medium', 103, 2.3, 24, 0.1, 3.8, true, true),

  -- Vegetables
  ('Broccoli (cooked)', NULL, 156, 'g', '1 cup', 55, 3.7, 11, 0.6, 5.1, true, true),
  ('Spinach (raw)', NULL, 30, 'g', '1 cup', 7, 0.9, 1.1, 0.1, 0.7, true, true),
  ('Carrots (raw)', NULL, 128, 'g', '1 cup chopped', 52, 1.2, 12, 0.3, 3.6, true, true),

  -- Fats
  ('Olive Oil', NULL, 14, 'ml', '1 tablespoon', 119, 0, 0, 14, 0, true, true),
  ('Avocado', NULL, 150, 'g', '1 medium', 240, 3, 13, 22, 10, true, true),
  ('Almonds', NULL, 28, 'g', '1 ounce (23 almonds)', 164, 6, 6, 14, 3.5, true, true),
  ('Peanut Butter', NULL, 32, 'g', '2 tablespoons', 188, 8, 8, 16, 2, true, true);

-- =====================================================
-- MIGRATION COMMENTS
-- =====================================================

COMMENT ON TABLE foods IS 'Master food database containing system and user-created foods with nutritional information';
COMMENT ON TABLE meal_logs IS 'User meal entries that can contain single or multiple foods';
COMMENT ON TABLE meal_log_foods IS 'Individual foods within a meal log with quantities consumed';
COMMENT ON TABLE meal_templates IS 'Saved meal templates for quick repeated logging';
COMMENT ON TABLE meal_template_foods IS 'Foods within saved meal templates';

-- Add helpful comments on columns
COMMENT ON COLUMN foods.serving_size IS 'Default serving size for this food';
COMMENT ON COLUMN foods.serving_unit IS 'Unit of measurement for the serving size';
COMMENT ON COLUMN meal_logs.logged_at IS 'When the meal was consumed (user can set past/future times)';
COMMENT ON COLUMN meal_log_foods.quantity IS 'Amount consumed by the user';
COMMENT ON COLUMN meal_log_foods.calories_consumed IS 'Calculated calories based on quantity (cached for historical accuracy)';