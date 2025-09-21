-- Create nutrition goals table and update meals table for re-logging

-- Create nutrition_goals table
CREATE TABLE public.nutrition_goals (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    daily_calories INTEGER NOT NULL DEFAULT 2000,
    protein_g FLOAT NOT NULL DEFAULT 150,
    carbs_g FLOAT NOT NULL DEFAULT 250,
    fat_g FLOAT NOT NULL DEFAULT 65,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add columns to meals table for re-logging functionality
ALTER TABLE public.meals ADD COLUMN IF NOT EXISTS relog_count INTEGER DEFAULT 0;
ALTER TABLE public.meals ADD COLUMN IF NOT EXISTS original_meal_id UUID REFERENCES public.meals(id);
ALTER TABLE public.meals ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

-- Create indexes for better performance
CREATE INDEX idx_nutrition_goals_user_id ON public.nutrition_goals(user_id);
CREATE INDEX idx_meals_original_meal_id ON public.meals(original_meal_id);
CREATE INDEX idx_meals_is_favorite ON public.meals(is_favorite, user_id) WHERE is_favorite = TRUE;
CREATE INDEX idx_meals_relog_count ON public.meals(relog_count DESC, user_id);

-- Enable Row Level Security
ALTER TABLE public.nutrition_goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for nutrition_goals
CREATE POLICY "Users can view own nutrition goals" ON public.nutrition_goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own nutrition goals" ON public.nutrition_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nutrition goals" ON public.nutrition_goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own nutrition goals" ON public.nutrition_goals
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp for nutrition_goals
CREATE TRIGGER update_nutrition_goals_updated_at
    BEFORE UPDATE ON public.nutrition_goals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nutrition_goals TO authenticated;

-- Create function to calculate daily nutrition totals
CREATE OR REPLACE FUNCTION get_daily_nutrition_totals(target_date DATE, target_user_id UUID)
RETURNS TABLE (
    calories BIGINT,
    protein_g DOUBLE PRECISION,
    carbs_g DOUBLE PRECISION,
    fat_g DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(m.calories), 0)::BIGINT as calories,
        COALESCE(SUM(m.protein_g), 0.0) as protein_g,
        COALESCE(SUM(m.carbs_g), 0.0) as carbs_g,
        COALESCE(SUM(m.fat_g), 0.0) as fat_g
    FROM public.meals m
    WHERE m.user_id = target_user_id
      AND DATE(m.logged_at) = target_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get weekly nutrition data
CREATE OR REPLACE FUNCTION get_weekly_nutrition_data(start_date DATE, target_user_id UUID)
RETURNS TABLE (
    date DATE,
    calories BIGINT,
    protein_g DOUBLE PRECISION,
    carbs_g DOUBLE PRECISION,
    fat_g DOUBLE PRECISION,
    meal_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        DATE(m.logged_at) as date,
        COALESCE(SUM(m.calories), 0)::BIGINT as calories,
        COALESCE(SUM(m.protein_g), 0.0) as protein_g,
        COALESCE(SUM(m.carbs_g), 0.0) as carbs_g,
        COALESCE(SUM(m.fat_g), 0.0) as fat_g,
        COUNT(*)::BIGINT as meal_count
    FROM public.meals m
    WHERE m.user_id = target_user_id
      AND DATE(m.logged_at) >= start_date
      AND DATE(m.logged_at) <= start_date + INTERVAL '6 days'
    GROUP BY DATE(m.logged_at)
    ORDER BY DATE(m.logged_at);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's favorite meals (most re-logged)
CREATE OR REPLACE FUNCTION get_favorite_meals(target_user_id UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    meal_name TEXT,
    meal_category meal_category,
    calories INTEGER,
    protein_g FLOAT,
    carbs_g FLOAT,
    fat_g FLOAT,
    notes TEXT,
    relog_count INTEGER,
    last_logged TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.meal_name,
        m.meal_category,
        m.calories,
        m.protein_g,
        m.carbs_g,
        m.fat_g,
        m.notes,
        m.relog_count,
        MAX(m.logged_at) as last_logged
    FROM public.meals m
    WHERE m.user_id = target_user_id
      AND (m.relog_count > 0 OR m.is_favorite = TRUE)
    GROUP BY m.id, m.meal_name, m.meal_category, m.calories, m.protein_g, m.carbs_g, m.fat_g, m.notes, m.relog_count
    ORDER BY m.relog_count DESC, MAX(m.logged_at) DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to relog a meal (creates a new entry based on existing meal)
CREATE OR REPLACE FUNCTION relog_meal(original_meal_id UUID, new_logged_at TIMESTAMPTZ DEFAULT NOW(), new_notes TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
    new_meal_id UUID;
    original_meal RECORD;
BEGIN
    -- Get the original meal
    SELECT * INTO original_meal FROM public.meals WHERE id = original_meal_id AND user_id = auth.uid();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Meal not found or access denied';
    END IF;

    -- Create new meal entry
    INSERT INTO public.meals (
        user_id,
        meal_name,
        meal_category,
        logged_at,
        calories,
        protein_g,
        carbs_g,
        fat_g,
        notes,
        original_meal_id,
        relog_count
    ) VALUES (
        original_meal.user_id,
        original_meal.meal_name,
        original_meal.meal_category,
        new_logged_at,
        original_meal.calories,
        original_meal.protein_g,
        original_meal.carbs_g,
        original_meal.fat_g,
        COALESCE(new_notes, original_meal.notes),
        original_meal_id,
        0  -- New meal starts with 0 relog count
    ) RETURNING id INTO new_meal_id;

    -- Increment relog count on original meal
    UPDATE public.meals
    SET relog_count = relog_count + 1
    WHERE id = original_meal_id;

    RETURN new_meal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_daily_nutrition_totals(DATE, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_weekly_nutrition_data(DATE, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_favorite_meals(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION relog_meal(UUID, TIMESTAMPTZ, TEXT) TO authenticated;

-- Create default nutrition goals for existing users
INSERT INTO public.nutrition_goals (user_id, daily_calories, protein_g, carbs_g, fat_g)
SELECT DISTINCT user_id, 2000, 150, 250, 65
FROM public.meals
WHERE user_id NOT IN (SELECT user_id FROM public.nutrition_goals)
ON CONFLICT (user_id) DO NOTHING;

-- Add helpful comments
COMMENT ON TABLE public.nutrition_goals IS 'User nutrition goals and targets';
COMMENT ON COLUMN public.meals.relog_count IS 'Number of times this meal has been re-logged';
COMMENT ON COLUMN public.meals.original_meal_id IS 'Reference to original meal if this is a re-log';
COMMENT ON COLUMN public.meals.is_favorite IS 'Whether user has marked this meal as favorite';

COMMENT ON FUNCTION get_daily_nutrition_totals IS 'Calculate total nutrition for a specific date and user';
COMMENT ON FUNCTION get_weekly_nutrition_data IS 'Get 7 days of nutrition data starting from specified date';
COMMENT ON FUNCTION get_favorite_meals IS 'Get user''s most frequently re-logged meals';
COMMENT ON FUNCTION relog_meal IS 'Create new meal entry based on existing meal';