-- Create meals table for nutrition tracking

-- Create ENUM type for meal categories
CREATE TYPE meal_category AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

-- Create meals table
CREATE TABLE public.meals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    meal_name TEXT NOT NULL,
    meal_category meal_category NOT NULL,
    logged_at TIMESTAMPTZ NOT NULL,
    calories INTEGER,
    protein_g FLOAT,
    carbs_g FLOAT,
    fat_g FLOAT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_meals_user_id ON public.meals(user_id);
CREATE INDEX idx_meals_logged_at ON public.meals(logged_at DESC);
CREATE INDEX idx_meals_user_logged ON public.meals(user_id, logged_at DESC);

-- Enable Row Level Security
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy: Users can only view their own meals
CREATE POLICY "Users can view own meals" ON public.meals
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can create their own meals
CREATE POLICY "Users can create own meals" ON public.meals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own meals
CREATE POLICY "Users can update own meals" ON public.meals
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own meals
CREATE POLICY "Users can delete own meals" ON public.meals
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_meals_updated_at
    BEFORE UPDATE ON public.meals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meals TO authenticated;

-- Add helpful comments
COMMENT ON TABLE public.meals IS 'Stores user meal entries for nutrition tracking';
COMMENT ON COLUMN public.meals.meal_category IS 'Type of meal: breakfast, lunch, dinner, or snack';
COMMENT ON COLUMN public.meals.logged_at IS 'When the meal was consumed';
COMMENT ON COLUMN public.meals.calories IS 'Total calories in the meal (optional)';
COMMENT ON COLUMN public.meals.protein_g IS 'Protein content in grams (optional)';
COMMENT ON COLUMN public.meals.carbs_g IS 'Carbohydrate content in grams (optional)';
COMMENT ON COLUMN public.meals.fat_g IS 'Fat content in grams (optional)';