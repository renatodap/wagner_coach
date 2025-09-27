-- Comprehensive Nutrition Tracking Database Schema
-- Supports USDA FoodData Central, FatSecret, and other food APIs
-- Handles branded products, restaurant chains, and user-generated content

-- =====================================================
-- ENHANCED FOOD DATA TABLES
-- =====================================================

-- Main foods table with multi-source support
CREATE TABLE IF NOT EXISTS public.food_sources (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source_name text NOT NULL UNIQUE CHECK (source_name IN ('usda', 'fatsecret', 'nutritionix', 'edamam', 'spoonacular', 'user_generated', 'restaurant_api')),
  api_key_encrypted text,
  base_url text,
  rate_limit_per_hour integer,
  last_sync_at timestamp with time zone,
  is_active boolean DEFAULT true,
  priority_rank integer DEFAULT 100,
  created_at timestamp with time zone DEFAULT now()
);

-- Enhanced foods table with comprehensive nutrition data
CREATE TABLE IF NOT EXISTS public.foods_enhanced (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Basic Information
  name text NOT NULL,
  brand_name text,
  brand_owner text,
  restaurant_name text,
  menu_item_id text,
  product_category text,
  food_group text,

  -- Identifiers
  barcode_upc text,
  barcode_ean text,
  fdc_id text, -- USDA FoodData Central ID
  fatsecret_id text,
  nutritionix_id text,
  edamam_id text,
  ndb_number text, -- USDA NDB Number

  -- Data Source
  primary_source_id uuid REFERENCES public.food_sources(id),
  data_sources jsonb DEFAULT '[]'::jsonb, -- Array of all sources this food appears in
  data_quality_score numeric(3,2) CHECK (data_quality_score >= 0 AND data_quality_score <= 1),
  is_verified boolean DEFAULT false,
  verification_date timestamp with time zone,

  -- Serving Information
  serving_size numeric NOT NULL DEFAULT 100,
  serving_unit text NOT NULL DEFAULT 'g',
  serving_description text,
  servings_per_container numeric,
  household_serving_size text,
  household_serving_unit text,

  -- Macronutrients (per 100g)
  calories numeric,
  total_fat_g numeric,
  saturated_fat_g numeric,
  trans_fat_g numeric,
  polyunsaturated_fat_g numeric,
  monounsaturated_fat_g numeric,
  cholesterol_mg numeric,
  sodium_mg numeric,
  total_carbs_g numeric,
  dietary_fiber_g numeric,
  soluble_fiber_g numeric,
  insoluble_fiber_g numeric,
  total_sugars_g numeric,
  added_sugars_g numeric,
  sugar_alcohols_g numeric,
  protein_g numeric,

  -- Vitamins (per 100g)
  vitamin_a_iu numeric,
  vitamin_a_mcg numeric,
  vitamin_c_mg numeric,
  vitamin_d_mcg numeric,
  vitamin_d_iu numeric,
  vitamin_e_mg numeric,
  vitamin_k_mcg numeric,
  thiamin_mg numeric,
  riboflavin_mg numeric,
  niacin_mg numeric,
  vitamin_b6_mg numeric,
  folate_mcg numeric,
  vitamin_b12_mcg numeric,
  biotin_mcg numeric,
  pantothenic_acid_mg numeric,
  choline_mg numeric,

  -- Minerals (per 100g)
  calcium_mg numeric,
  iron_mg numeric,
  magnesium_mg numeric,
  phosphorus_mg numeric,
  potassium_mg numeric,
  zinc_mg numeric,
  copper_mg numeric,
  manganese_mg numeric,
  selenium_mcg numeric,
  iodine_mcg numeric,

  -- Other Nutrients
  caffeine_mg numeric,
  alcohol_g numeric,
  water_g numeric,
  ash_g numeric,
  omega3_fatty_acids_mg numeric,
  omega6_fatty_acids_mg numeric,

  -- Search Optimization
  search_vector tsvector,
  popularity_score integer DEFAULT 0,
  search_count integer DEFAULT 0,

  -- Metadata
  ingredients text[],
  allergens text[],
  dietary_flags text[], -- vegetarian, vegan, gluten-free, etc.
  preparation_methods text[],
  storage_instructions text,

  -- Images
  image_url text,
  image_thumbnail_url text,
  nutrition_label_url text,

  -- Status
  is_discontinued boolean DEFAULT false,
  is_generic boolean DEFAULT false,
  is_raw boolean DEFAULT false,
  is_branded boolean DEFAULT false,
  is_restaurant boolean DEFAULT false,

  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_api_sync timestamp with time zone,

  CONSTRAINT unique_barcode_upc UNIQUE(barcode_upc),
  CONSTRAINT unique_barcode_ean UNIQUE(barcode_ean),
  CONSTRAINT unique_fdc_id UNIQUE(fdc_id)
);

-- Create indexes for search optimization
CREATE INDEX idx_foods_search_vector ON public.foods_enhanced USING GIN (search_vector);
CREATE INDEX idx_foods_barcode_upc ON public.foods_enhanced(barcode_upc) WHERE barcode_upc IS NOT NULL;
CREATE INDEX idx_foods_brand_name ON public.foods_enhanced(brand_name) WHERE brand_name IS NOT NULL;
CREATE INDEX idx_foods_restaurant_name ON public.foods_enhanced(restaurant_name) WHERE restaurant_name IS NOT NULL;
CREATE INDEX idx_foods_popularity ON public.foods_enhanced(popularity_score DESC);

-- Alternative serving sizes
CREATE TABLE IF NOT EXISTS public.food_serving_sizes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  food_id uuid NOT NULL REFERENCES public.foods_enhanced(id) ON DELETE CASCADE,
  serving_description text NOT NULL,
  serving_weight_grams numeric NOT NULL,
  serving_quantity numeric DEFAULT 1,
  serving_unit text,
  is_default boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- RESTAURANT & BRANDED PRODUCT TABLES
-- =====================================================

-- Restaurant chains
CREATE TABLE IF NOT EXISTS public.restaurant_chains (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  logo_url text,
  website_url text,
  menu_api_endpoint text,
  last_menu_sync timestamp with time zone,
  is_active boolean DEFAULT true,
  location_count integer,
  created_at timestamp with time zone DEFAULT now()
);

-- Restaurant menu items
CREATE TABLE IF NOT EXISTS public.restaurant_menu_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id uuid NOT NULL REFERENCES public.restaurant_chains(id),
  food_id uuid NOT NULL REFERENCES public.foods_enhanced(id),
  menu_category text,
  menu_subcategory text,
  price_usd numeric(10,2),
  is_available boolean DEFAULT true,
  is_seasonal boolean DEFAULT false,
  is_limited_time boolean DEFAULT false,
  customization_options jsonb DEFAULT '[]'::jsonb,
  allergen_info jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Popular food brands
CREATE TABLE IF NOT EXISTS public.food_brands (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_name text NOT NULL UNIQUE,
  parent_company text,
  logo_url text,
  website_url text,
  verified boolean DEFAULT false,
  product_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- POPULAR FOODS CACHE & OPTIMIZATION
-- =====================================================

-- Cache of most popular foods for quick access
CREATE TABLE IF NOT EXISTS public.popular_foods_cache (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  food_id uuid NOT NULL REFERENCES public.foods_enhanced(id),
  category text CHECK (category IN ('protein_bars', 'fast_food', 'snacks', 'beverages', 'fruits', 'vegetables', 'dairy', 'grains', 'proteins', 'supplements')),
  popularity_rank integer NOT NULL,
  daily_search_count integer DEFAULT 0,
  weekly_search_count integer DEFAULT 0,
  monthly_search_count integer DEFAULT 0,
  last_searched_at timestamp with time zone,
  cached_data jsonb, -- Denormalized food data for fast access
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT unique_food_in_category UNIQUE(food_id, category)
);

CREATE INDEX idx_popular_foods_category_rank ON public.popular_foods_cache(category, popularity_rank);

-- Common food combinations (e.g., peanut butter + jelly)
CREATE TABLE IF NOT EXISTS public.food_combinations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  food_ids uuid[] NOT NULL,
  frequency_count integer DEFAULT 1,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- USER-GENERATED CONTENT & VERIFICATION
-- =====================================================

-- User-submitted foods pending verification
CREATE TABLE IF NOT EXISTS public.user_submitted_foods (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  submitted_by uuid NOT NULL REFERENCES auth.users(id),
  food_name text NOT NULL,
  brand_name text,
  barcode text,
  serving_size numeric,
  serving_unit text,
  nutrition_data jsonb NOT NULL,
  proof_images text[],
  submission_notes text,

  -- Verification process
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'needs_info')),
  reviewed_by uuid REFERENCES auth.users(id),
  review_notes text,
  rejection_reason text,
  approved_food_id uuid REFERENCES public.foods_enhanced(id),

  -- Community validation
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  report_count integer DEFAULT 0,

  created_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone
);

-- Food data corrections/reports
CREATE TABLE IF NOT EXISTS public.food_data_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  food_id uuid NOT NULL REFERENCES public.foods_enhanced(id),
  reporter_id uuid NOT NULL REFERENCES auth.users(id),
  report_type text CHECK (report_type IN ('incorrect_nutrition', 'wrong_brand', 'duplicate', 'discontinued', 'wrong_barcode', 'other')),
  field_name text,
  current_value text,
  suggested_value text,
  evidence_url text,
  notes text,
  status text DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'rejected')),
  resolved_by uuid REFERENCES auth.users(id),
  resolution_notes text,
  created_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone
);

-- =====================================================
-- API SYNC & DATA MANAGEMENT
-- =====================================================

-- Track API sync history
CREATE TABLE IF NOT EXISTS public.api_sync_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id uuid NOT NULL REFERENCES public.food_sources(id),
  sync_type text CHECK (sync_type IN ('full', 'incremental', 'specific_items')),
  started_at timestamp with time zone NOT NULL,
  completed_at timestamp with time zone,
  status text CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  records_processed integer DEFAULT 0,
  records_created integer DEFAULT 0,
  records_updated integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  error_details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Queue for foods to sync from APIs
CREATE TABLE IF NOT EXISTS public.food_sync_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  barcode text,
  food_name text,
  source_priority text[], -- Ordered list of sources to try
  requested_by uuid REFERENCES auth.users(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts integer DEFAULT 0,
  last_attempt_at timestamp with time zone,
  result_food_id uuid REFERENCES public.foods_enhanced(id),
  error_message text,
  created_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- NUTRITION TRACKING ENHANCEMENTS
-- =====================================================

-- Recipe ingredients with precise measurements
CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id uuid NOT NULL,
  food_id uuid NOT NULL REFERENCES public.foods_enhanced(id),
  quantity numeric NOT NULL,
  unit text NOT NULL,
  preparation_method text,
  is_optional boolean DEFAULT false,
  ingredient_order integer,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Custom recipes
CREATE TABLE IF NOT EXISTS public.recipes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  description text,
  prep_time_minutes integer,
  cook_time_minutes integer,
  servings integer DEFAULT 1,
  instructions text[],
  tags text[],
  image_url text,

  -- Calculated nutrition (per serving)
  calories_per_serving numeric,
  protein_per_serving numeric,
  carbs_per_serving numeric,
  fat_per_serving numeric,
  fiber_per_serving numeric,

  is_public boolean DEFAULT false,
  rating numeric(2,1) CHECK (rating >= 0 AND rating <= 5),
  review_count integer DEFAULT 0,

  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Barcode scan history
CREATE TABLE IF NOT EXISTS public.barcode_scan_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  barcode text NOT NULL,
  food_id uuid REFERENCES public.foods_enhanced(id),
  scan_successful boolean,
  location_lat numeric,
  location_lng numeric,
  device_info jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- ANALYTICS & REPORTING
-- =====================================================

-- Food search analytics
CREATE TABLE IF NOT EXISTS public.food_search_analytics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  search_query text NOT NULL,
  results_count integer,
  selected_food_id uuid REFERENCES public.foods_enhanced(id),
  search_source text,
  response_time_ms integer,
  created_at timestamp with time zone DEFAULT now()
);

-- Daily nutrition summaries
CREATE TABLE IF NOT EXISTS public.daily_nutrition_summaries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  date date NOT NULL,

  -- Totals
  total_calories numeric,
  total_protein_g numeric,
  total_carbs_g numeric,
  total_fat_g numeric,
  total_fiber_g numeric,
  total_sugar_g numeric,
  total_sodium_mg numeric,

  -- Meal breakdown
  breakfast_calories numeric,
  lunch_calories numeric,
  dinner_calories numeric,
  snacks_calories numeric,

  -- Goals comparison
  calorie_goal numeric,
  protein_goal numeric,
  carbs_goal numeric,
  fat_goal numeric,

  -- Metrics
  meals_logged integer DEFAULT 0,
  water_ml numeric,
  notes text,

  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  CONSTRAINT unique_user_date UNIQUE(user_id, date)
);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_food_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.brand_name, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.restaurant_name, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.product_category, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_food_search_vector
  BEFORE INSERT OR UPDATE OF name, brand_name, restaurant_name, product_category
  ON public.foods_enhanced
  FOR EACH ROW
  EXECUTE FUNCTION update_food_search_vector();

-- Function to calculate recipe nutrition
CREATE OR REPLACE FUNCTION calculate_recipe_nutrition(recipe_id_param uuid)
RETURNS void AS $$
DECLARE
  total_calories numeric := 0;
  total_protein numeric := 0;
  total_carbs numeric := 0;
  total_fat numeric := 0;
  total_fiber numeric := 0;
  recipe_servings integer;
BEGIN
  -- Get recipe servings
  SELECT servings INTO recipe_servings
  FROM public.recipes
  WHERE id = recipe_id_param;

  -- Calculate totals from ingredients
  SELECT
    SUM((ri.quantity / f.serving_size) * f.calories),
    SUM((ri.quantity / f.serving_size) * f.protein_g),
    SUM((ri.quantity / f.serving_size) * f.total_carbs_g),
    SUM((ri.quantity / f.serving_size) * f.total_fat_g),
    SUM((ri.quantity / f.serving_size) * f.dietary_fiber_g)
  INTO total_calories, total_protein, total_carbs, total_fat, total_fiber
  FROM public.recipe_ingredients ri
  JOIN public.foods_enhanced f ON ri.food_id = f.id
  WHERE ri.recipe_id = recipe_id_param;

  -- Update recipe with per-serving nutrition
  UPDATE public.recipes
  SET
    calories_per_serving = total_calories / NULLIF(recipe_servings, 0),
    protein_per_serving = total_protein / NULLIF(recipe_servings, 0),
    carbs_per_serving = total_carbs / NULLIF(recipe_servings, 0),
    fat_per_serving = total_fat / NULLIF(recipe_servings, 0),
    fiber_per_serving = total_fiber / NULLIF(recipe_servings, 0),
    updated_at = now()
  WHERE id = recipe_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to merge duplicate foods
CREATE OR REPLACE FUNCTION merge_duplicate_foods(
  primary_food_id uuid,
  duplicate_food_ids uuid[]
)
RETURNS void AS $$
BEGIN
  -- Update all references to point to primary food
  UPDATE public.meal_log_foods
  SET food_id = primary_food_id
  WHERE food_id = ANY(duplicate_food_ids);

  UPDATE public.user_food_frequency
  SET food_id = primary_food_id
  WHERE food_id = ANY(duplicate_food_ids);

  -- Merge search counts and popularity
  UPDATE public.foods_enhanced
  SET
    search_count = search_count + (
      SELECT COALESCE(SUM(search_count), 0)
      FROM public.foods_enhanced
      WHERE id = ANY(duplicate_food_ids)
    ),
    popularity_score = popularity_score + (
      SELECT COALESCE(SUM(popularity_score), 0)
      FROM public.foods_enhanced
      WHERE id = ANY(duplicate_food_ids)
    )
  WHERE id = primary_food_id;

  -- Delete duplicates
  DELETE FROM public.foods_enhanced
  WHERE id = ANY(duplicate_food_ids);
END;
$$ LANGUAGE plpgsql;

-- Function to get similar foods (for suggestions)
CREATE OR REPLACE FUNCTION get_similar_foods(
  food_id_param uuid,
  limit_param integer DEFAULT 10
)
RETURNS TABLE (
  food_id uuid,
  food_name text,
  similarity_score numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f2.id AS food_id,
    f2.name AS food_name,
    (
      -- Calculate similarity based on multiple factors
      CASE WHEN f1.brand_name = f2.brand_name THEN 0.3 ELSE 0 END +
      CASE WHEN f1.product_category = f2.product_category THEN 0.3 ELSE 0 END +
      CASE WHEN ABS(f1.calories - f2.calories) < 50 THEN 0.2 ELSE 0 END +
      CASE WHEN ABS(f1.protein_g - f2.protein_g) < 5 THEN 0.1 ELSE 0 END +
      CASE WHEN ABS(f1.total_carbs_g - f2.total_carbs_g) < 10 THEN 0.1 ELSE 0 END
    ) AS similarity_score
  FROM public.foods_enhanced f1
  CROSS JOIN public.foods_enhanced f2
  WHERE f1.id = food_id_param
    AND f2.id != food_id_param
  ORDER BY similarity_score DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.foods_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_submitted_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_data_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barcode_scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_nutrition_summaries ENABLE ROW LEVEL SECURITY;

-- Policies for foods_enhanced
CREATE POLICY "Public foods are viewable by everyone" ON public.foods_enhanced
  FOR SELECT USING (true);

CREATE POLICY "Users can create foods" ON public.foods_enhanced
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own foods" ON public.foods_enhanced
  FOR UPDATE USING (auth.uid() = created_by);

-- Policies for user_submitted_foods
CREATE POLICY "Users can view their submissions" ON public.user_submitted_foods
  FOR SELECT USING (auth.uid() = submitted_by OR status = 'approved');

CREATE POLICY "Users can submit foods" ON public.user_submitted_foods
  FOR INSERT WITH CHECK (auth.uid() = submitted_by);

-- Policies for recipes
CREATE POLICY "Public recipes are viewable" ON public.recipes
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create recipes" ON public.recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their recipes" ON public.recipes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their recipes" ON public.recipes
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_foods_enhanced_fdc_id ON public.foods_enhanced(fdc_id) WHERE fdc_id IS NOT NULL;
CREATE INDEX idx_foods_enhanced_created_at ON public.foods_enhanced(created_at DESC);
CREATE INDEX idx_foods_enhanced_updated_at ON public.foods_enhanced(updated_at DESC);
CREATE INDEX idx_restaurant_menu_items_restaurant ON public.restaurant_menu_items(restaurant_id);
CREATE INDEX idx_food_sync_queue_status ON public.food_sync_queue(status) WHERE status = 'pending';
CREATE INDEX idx_daily_summaries_user_date ON public.daily_nutrition_summaries(user_id, date DESC);
CREATE INDEX idx_barcode_history_user ON public.barcode_scan_history(user_id, created_at DESC);
CREATE INDEX idx_search_analytics_user ON public.food_search_analytics(user_id, created_at DESC);

-- =====================================================
-- SAMPLE DATA FOR POPULAR FOODS
-- =====================================================

-- Insert food sources
INSERT INTO public.food_sources (source_name, base_url, rate_limit_per_hour, priority_rank)
VALUES
  ('usda', 'https://api.nal.usda.gov/fdc/v1/', 1000, 1),
  ('fatsecret', 'https://platform.fatsecret.com/rest/server.api', 5000, 2),
  ('nutritionix', 'https://trackapi.nutritionix.com/v2/', 500, 3),
  ('user_generated', NULL, NULL, 10)
ON CONFLICT (source_name) DO NOTHING;

-- Insert common restaurant chains
INSERT INTO public.restaurant_chains (name, website_url)
VALUES
  ('Chipotle', 'https://www.chipotle.com'),
  ('Subway', 'https://www.subway.com'),
  ('McDonalds', 'https://www.mcdonalds.com'),
  ('Chick-fil-A', 'https://www.chick-fil-a.com'),
  ('Jimmy Johns', 'https://www.jimmyjohns.com'),
  ('Panera Bread', 'https://www.panerabread.com'),
  ('Starbucks', 'https://www.starbucks.com'),
  ('Taco Bell', 'https://www.tacobell.com'),
  ('Wendys', 'https://www.wendys.com'),
  ('Five Guys', 'https://www.fiveguys.com')
ON CONFLICT (name) DO NOTHING;

-- Insert popular food brands
INSERT INTO public.food_brands (brand_name, verified)
VALUES
  ('Quest Nutrition', true),
  ('Nature Valley', true),
  ('Clif Bar', true),
  ('RXBAR', true),
  ('KIND', true),
  ('Gatorade', true),
  ('Muscle Milk', true),
  ('Premier Protein', true),
  ('Pure Protein', true),
  ('ONE Bar', true)
ON CONFLICT (brand_name) DO NOTHING;

-- =====================================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- =====================================================

-- Materialized view for frequently accessed nutrition data
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_popular_foods_nutrition AS
SELECT
  f.id,
  f.name,
  f.brand_name,
  f.restaurant_name,
  f.barcode_upc,
  f.serving_size,
  f.serving_unit,
  f.calories,
  f.protein_g,
  f.total_carbs_g,
  f.total_fat_g,
  f.dietary_fiber_g,
  f.popularity_score,
  f.image_thumbnail_url
FROM public.foods_enhanced f
WHERE f.popularity_score > 100
ORDER BY f.popularity_score DESC
LIMIT 10000;

CREATE UNIQUE INDEX idx_mv_popular_foods_id ON public.mv_popular_foods_nutrition(id);
CREATE INDEX idx_mv_popular_foods_name ON public.mv_popular_foods_nutrition(name);

-- Refresh materialized view daily
CREATE OR REPLACE FUNCTION refresh_popular_foods_mv()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_popular_foods_nutrition;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ANALYTICS FUNCTIONS
-- =====================================================

-- Function to get user's macro breakdown for a date range
CREATE OR REPLACE FUNCTION get_macro_breakdown(
  user_id_param uuid,
  start_date date,
  end_date date
)
RETURNS TABLE (
  date date,
  calories numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  fiber_g numeric,
  protein_percentage numeric,
  carbs_percentage numeric,
  fat_percentage numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ml.logged_at::date AS date,
    SUM(mlf.calories_consumed) AS calories,
    SUM(mlf.protein_consumed) AS protein_g,
    SUM(mlf.carbs_consumed) AS carbs_g,
    SUM(mlf.fat_consumed) AS fat_g,
    SUM(mlf.fiber_consumed) AS fiber_g,
    ROUND((SUM(mlf.protein_consumed) * 4 / NULLIF(SUM(mlf.calories_consumed), 0)) * 100, 1) AS protein_percentage,
    ROUND((SUM(mlf.carbs_consumed) * 4 / NULLIF(SUM(mlf.calories_consumed), 0)) * 100, 1) AS carbs_percentage,
    ROUND((SUM(mlf.fat_consumed) * 9 / NULLIF(SUM(mlf.calories_consumed), 0)) * 100, 1) AS fat_percentage
  FROM public.meal_logs ml
  JOIN public.meal_log_foods mlf ON ml.id = mlf.meal_log_id
  WHERE ml.user_id = user_id_param
    AND ml.logged_at::date BETWEEN start_date AND end_date
  GROUP BY ml.logged_at::date
  ORDER BY ml.logged_at::date;
END;
$$ LANGUAGE plpgsql;

-- Function to get frequently eaten foods by meal category
CREATE OR REPLACE FUNCTION get_frequent_foods_by_meal(
  user_id_param uuid,
  meal_category_param text,
  limit_param integer DEFAULT 20
)
RETURNS TABLE (
  food_id uuid,
  food_name text,
  brand_name text,
  frequency integer,
  avg_quantity numeric,
  common_unit text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id AS food_id,
    f.name AS food_name,
    f.brand_name,
    COUNT(*)::integer AS frequency,
    AVG(mlf.quantity) AS avg_quantity,
    MODE() WITHIN GROUP (ORDER BY mlf.unit)::text AS common_unit
  FROM public.meal_logs ml
  JOIN public.meal_log_foods mlf ON ml.id = mlf.meal_log_id
  JOIN public.foods_enhanced f ON mlf.food_id = f.id
  WHERE ml.user_id = user_id_param
    AND ml.category = meal_category_param
  GROUP BY f.id, f.name, f.brand_name
  ORDER BY COUNT(*) DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FINAL OPTIMIZATION COMMENTS
-- =====================================================

-- This schema provides:
-- 1. Multi-source food data integration (USDA, FatSecret, etc.)
-- 2. Comprehensive nutrition tracking (macros + micros)
-- 3. Restaurant and branded product support
-- 4. Barcode scanning capability
-- 5. User-generated content with verification
-- 6. Popular foods caching for performance
-- 7. Recipe creation and nutrition calculation
-- 8. Analytics and reporting functions
-- 9. Full-text search optimization
-- 10. Row-level security for multi-tenant support

-- Regular maintenance tasks:
-- 1. VACUUM ANALYZE on high-traffic tables daily
-- 2. Refresh materialized views daily
-- 3. Update popularity scores weekly
-- 4. Sync with external APIs based on rate limits
-- 5. Archive old search analytics monthly