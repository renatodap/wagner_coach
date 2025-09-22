-- Complete Nutrition System Migration
-- This migration sets up the entire nutrition tracking system with foods database

-- Create enum types if they don't exist
DO $$ BEGIN
  CREATE TYPE food_unit AS ENUM ('g', 'ml', 'oz', 'cup', 'tbsp', 'tsp', 'serving', 'piece');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE meal_category AS ENUM ('breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create foods table
CREATE TABLE IF NOT EXISTS foods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  barcode TEXT,
  serving_size DECIMAL(10,2) NOT NULL DEFAULT 100,
  serving_unit food_unit NOT NULL DEFAULT 'g',
  serving_description TEXT,
  calories DECIMAL(8,2),
  protein_g DECIMAL(8,2),
  carbs_g DECIMAL(8,2),
  fat_g DECIMAL(8,2),
  fiber_g DECIMAL(8,2),
  sugar_g DECIMAL(8,2),
  sodium_mg DECIMAL(10,2),
  is_verified BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create meal_logs table
CREATE TABLE IF NOT EXISTS meal_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  meal_name TEXT,
  meal_category meal_category DEFAULT 'other',
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  notes TEXT,
  total_calories DECIMAL(10,2) DEFAULT 0,
  total_protein_g DECIMAL(8,2) DEFAULT 0,
  total_carbs_g DECIMAL(8,2) DEFAULT 0,
  total_fat_g DECIMAL(8,2) DEFAULT 0,
  total_fiber_g DECIMAL(8,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create meal_log_foods junction table
CREATE TABLE IF NOT EXISTS meal_log_foods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_log_id UUID REFERENCES meal_logs(id) ON DELETE CASCADE NOT NULL,
  food_id UUID REFERENCES foods(id) ON DELETE CASCADE NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit food_unit NOT NULL,
  calories DECIMAL(10,2),
  protein_g DECIMAL(8,2),
  carbs_g DECIMAL(8,2),
  fat_g DECIMAL(8,2),
  fiber_g DECIMAL(8,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create meal_templates table
CREATE TABLE IF NOT EXISTS meal_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  meal_category meal_category DEFAULT 'other',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create meal_template_foods table
CREATE TABLE IF NOT EXISTS meal_template_foods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES meal_templates(id) ON DELETE CASCADE NOT NULL,
  food_id UUID REFERENCES foods(id) ON DELETE CASCADE NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit food_unit NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name);
CREATE INDEX IF NOT EXISTS idx_foods_brand ON foods(brand);
CREATE INDEX IF NOT EXISTS idx_foods_barcode ON foods(barcode);
CREATE INDEX IF NOT EXISTS idx_foods_created_by ON foods(created_by);
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_id ON meal_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_logs_logged_at ON meal_logs(logged_at);
CREATE INDEX IF NOT EXISTS idx_meal_log_foods_meal_log_id ON meal_log_foods(meal_log_id);
CREATE INDEX IF NOT EXISTS idx_meal_templates_user_id ON meal_templates(user_id);

-- Enable RLS
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_log_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_template_foods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for foods
CREATE POLICY "Public foods are viewable by everyone" ON foods
  FOR SELECT USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can insert their own foods" ON foods
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own foods" ON foods
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own foods" ON foods
  FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for meal_logs
CREATE POLICY "Users can view their own meal logs" ON meal_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal logs" ON meal_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal logs" ON meal_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal logs" ON meal_logs
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for meal_log_foods
CREATE POLICY "Users can view their own meal log foods" ON meal_log_foods
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM meal_logs
      WHERE meal_logs.id = meal_log_foods.meal_log_id
      AND meal_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own meal log foods" ON meal_log_foods
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM meal_logs
      WHERE meal_logs.id = meal_log_foods.meal_log_id
      AND meal_logs.user_id = auth.uid()
    )
  );

-- RLS Policies for meal_templates
CREATE POLICY "Users can view their own and public templates" ON meal_templates
  FOR SELECT USING (user_id = auth.uid() OR is_public = true);

CREATE POLICY "Users can create their own templates" ON meal_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" ON meal_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" ON meal_templates
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for meal_template_foods
CREATE POLICY "Users can view template foods for accessible templates" ON meal_template_foods
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM meal_templates
      WHERE meal_templates.id = meal_template_foods.template_id
      AND (meal_templates.user_id = auth.uid() OR meal_templates.is_public = true)
    )
  );

CREATE POLICY "Users can manage foods in their templates" ON meal_template_foods
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM meal_templates
      WHERE meal_templates.id = meal_template_foods.template_id
      AND meal_templates.user_id = auth.uid()
    )
  );

-- Function to calculate meal nutrition from foods
CREATE OR REPLACE FUNCTION calculate_meal_nutrition()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the meal_log with calculated totals
  UPDATE meal_logs
  SET
    total_calories = COALESCE((
      SELECT SUM(calories) FROM meal_log_foods WHERE meal_log_id = NEW.meal_log_id
    ), 0),
    total_protein_g = COALESCE((
      SELECT SUM(protein_g) FROM meal_log_foods WHERE meal_log_id = NEW.meal_log_id
    ), 0),
    total_carbs_g = COALESCE((
      SELECT SUM(carbs_g) FROM meal_log_foods WHERE meal_log_id = NEW.meal_log_id
    ), 0),
    total_fat_g = COALESCE((
      SELECT SUM(fat_g) FROM meal_log_foods WHERE meal_log_id = NEW.meal_log_id
    ), 0),
    total_fiber_g = COALESCE((
      SELECT SUM(fiber_g) FROM meal_log_foods WHERE meal_log_id = NEW.meal_log_id
    ), 0),
    updated_at = TIMEZONE('utc', NOW())
  WHERE id = NEW.meal_log_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate nutrition when foods are added to a meal
CREATE TRIGGER update_meal_nutrition_on_food_add
  AFTER INSERT OR UPDATE ON meal_log_foods
  FOR EACH ROW
  EXECUTE FUNCTION calculate_meal_nutrition();

-- Trigger to recalculate when foods are removed
CREATE TRIGGER update_meal_nutrition_on_food_delete
  AFTER DELETE ON meal_log_foods
  FOR EACH ROW
  EXECUTE FUNCTION calculate_meal_nutrition();

-- Insert initial food data (subset for testing - you can run the larger seed separately)
INSERT INTO foods (name, brand, barcode, serving_size, serving_unit, serving_description, calories, protein_g, carbs_g, fat_g, fiber_g, sodium_mg, is_verified, is_public) VALUES
-- Essential proteins
('Chicken Breast, Grilled', NULL, NULL, 100, 'g', '1 medium breast', 165, 31, 0, 3.6, 0, 74, true, true),
('Eggs, Whole Large', NULL, NULL, 50, 'g', '1 egg', 71, 6.3, 0.4, 4.8, 0, 70, true, true),
('Greek Yogurt, Plain 0%', NULL, NULL, 170, 'g', '6 oz', 100, 17, 6, 0, 0, 65, true, true),
('Salmon, Atlantic', NULL, NULL, 100, 'g', '1 fillet', 208, 22.1, 0, 12.6, 0, 59, true, true),
('Tofu, Firm', NULL, NULL, 100, 'g', '1/2 cup', 83, 9.9, 2, 5.3, 0.3, 7, true, true),

-- Common carbs
('White Rice, Cooked', NULL, NULL, 158, 'g', '1 cup', 205, 4.3, 44.5, 0.4, 0.6, 1, true, true),
('Oatmeal, Cooked', NULL, NULL, 234, 'g', '1 cup', 158, 5.9, 27.3, 3.2, 4, 115, true, true),
('Sweet Potato', NULL, NULL, 130, 'g', '1 medium', 112, 2.1, 26, 0.1, 3.9, 72, true, true),
('Quinoa, Cooked', NULL, NULL, 185, 'g', '1 cup', 222, 8.1, 39.4, 3.6, 5.2, 13, true, true),
('Bread, Whole Wheat', NULL, NULL, 28, 'g', '1 slice', 69, 3.6, 11.6, 1.1, 1.9, 132, true, true),

-- Vegetables
('Broccoli', NULL, NULL, 91, 'g', '1 cup chopped', 31, 2.6, 6, 0.3, 2.4, 30, true, true),
('Spinach, Raw', NULL, NULL, 30, 'g', '1 cup', 7, 0.9, 1.1, 0.1, 0.7, 24, true, true),
('Bell Peppers, Red', NULL, NULL, 119, 'g', '1 medium', 37, 1.2, 7.2, 0.4, 2.5, 5, true, true),
('Carrots', NULL, NULL, 128, 'g', '1 cup chopped', 52, 1.2, 12.3, 0.3, 3.6, 88, true, true),
('Tomatoes', NULL, NULL, 123, 'g', '1 medium', 22, 1.1, 4.8, 0.2, 1.5, 6, true, true),

-- Fruits
('Banana', NULL, NULL, 118, 'g', '1 medium', 105, 1.3, 27, 0.4, 3.1, 1, true, true),
('Apple', NULL, NULL, 182, 'g', '1 medium', 95, 0.5, 25, 0.3, 4.4, 2, true, true),
('Blueberries', NULL, NULL, 148, 'g', '1 cup', 84, 1.1, 21.5, 0.5, 3.6, 1, true, true),
('Strawberries', NULL, NULL, 152, 'g', '1 cup', 49, 1, 11.7, 0.5, 3, 2, true, true),
('Avocado', NULL, NULL, 150, 'g', '1 medium', 240, 3, 12.8, 22, 10, 11, true, true),

-- Healthy fats and nuts
('Almonds', NULL, NULL, 28, 'g', '1 oz (23 nuts)', 164, 6, 6, 14.1, 3.5, 0, true, true),
('Olive Oil', NULL, NULL, 14, 'ml', '1 tbsp', 119, 0, 0, 13.5, 0, 0, true, true),
('Peanut Butter', NULL, NULL, 32, 'g', '2 tbsp', 188, 8, 7.7, 16, 2.6, 147, true, true),

-- Dairy
('Milk, 2%', NULL, NULL, 244, 'ml', '1 cup', 122, 8.1, 11.7, 4.8, 0, 115, true, true),
('Cheddar Cheese', NULL, NULL, 28, 'g', '1 oz', 114, 7, 0.4, 9.4, 0, 174, true, true),
('Cottage Cheese, 1%', NULL, NULL, 226, 'g', '1 cup', 163, 28, 6.2, 2.3, 0, 918, true, true)
ON CONFLICT DO NOTHING;

-- Add more foods in batches to avoid timeout
-- You can run the larger seed file separately after this migration completes