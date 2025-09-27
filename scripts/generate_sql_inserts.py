import json
import uuid
from datetime import datetime

def generate_uuid():
    """Generate a UUID for SQL inserts"""
    return str(uuid.uuid4())

def escape_string(s):
    """Escape single quotes for SQL"""
    if s is None:
        return "NULL"
    escaped = str(s).replace("'", "''")
    return f"'{escaped}'"

def format_number(n, default="NULL"):
    """Format number for SQL, return NULL if None"""
    if n is None or n == "":
        return default
    try:
        return str(float(n))
    except:
        return default

def load_json_file(filename):
    """Load JSON data from file"""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"File {filename} not found")
        return []

def generate_food_inserts():
    """Generate SQL inserts for foods_enhanced table"""

    # Load processed foods
    foods = load_json_file("processed_foods.json")

    # Load raw USDA data for more details
    raw_foods = load_json_file("usda_sample_foods.json")

    sql_statements = []

    # Add header
    sql_statements.append("-- =====================================================")
    sql_statements.append("-- FOOD DATA INSERTS - Generated from API data")
    sql_statements.append(f"-- Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    sql_statements.append("-- =====================================================\n")

    # First, ensure food sources exist
    sql_statements.append("-- Ensure food sources exist")
    sql_statements.append("""INSERT INTO public.food_sources (id, source_name, base_url, rate_limit_per_hour, priority_rank)
VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, 'usda', 'https://api.nal.usda.gov/fdc/v1/', 1000, 1),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'fatsecret', 'https://platform.fatsecret.com/rest/server.api', 5000, 2),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'nutritionix', 'https://trackapi.nutritionix.com/v2/', 500, 3)
ON CONFLICT (source_name) DO NOTHING;\n""")

    # Process foods from the JSON data
    sql_statements.append("-- Insert food data")
    sql_statements.append("INSERT INTO public.foods_enhanced (")
    sql_statements.append("  id, name, brand_name, fdc_id, barcode_upc, primary_source_id,")
    sql_statements.append("  serving_size, serving_unit, calories, protein_g, total_carbs_g,")
    sql_statements.append("  total_fat_g, dietary_fiber_g, total_sugars_g, sodium_mg,")
    sql_statements.append("  is_verified, is_branded, popularity_score, created_at")
    sql_statements.append(") VALUES")

    values = []

    for i, food in enumerate(foods[:100]):  # Process up to 100 foods
        food_id = generate_uuid()

        # Extract values with defaults
        name = food.get("name", "Unknown Food")
        brand = food.get("brand", "")
        fdc_id = food.get("fdc_id", "")
        barcode = food.get("barcode", "")

        # Nutrition values
        calories = format_number(food.get("calories", None))
        protein = format_number(food.get("protein_g", None))
        carbs = format_number(food.get("carbs_g", None))
        fat = format_number(food.get("fat_g", None))
        fiber = format_number(food.get("fiber_g", None))
        sugar = format_number(food.get("sugar_g", None))
        sodium = format_number(food.get("sodium_mg", None))

        # Determine if it's a branded product
        is_branded = "true" if brand else "false"

        # Create popularity score based on common brands
        popularity = 100
        if any(x in name.lower() for x in ["quest", "nature valley", "chipotle", "mcdonald", "subway"]):
            popularity = 500
        elif any(x in name.lower() for x in ["chicken", "rice", "yogurt", "banana", "almond"]):
            popularity = 300

        value = f"""  ('{food_id}'::uuid, {escape_string(name)}, {escape_string(brand) if brand else 'NULL'},
   {escape_string(fdc_id) if fdc_id else 'NULL'}, {escape_string(barcode) if barcode else 'NULL'},
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', {calories}, {protein}, {carbs}, {fat}, {fiber}, {sugar}, {sodium},
   true, {is_branded}, {popularity}, NOW())"""

        values.append(value)

    sql_statements.append(",\n".join(values) + ";")

    # Add some popular restaurant menu items manually
    sql_statements.append("\n-- Insert popular restaurant items")
    sql_statements.append("""INSERT INTO public.foods_enhanced (
  id, name, restaurant_name, primary_source_id,
  serving_size, serving_unit, serving_description,
  calories, protein_g, total_carbs_g, total_fat_g, dietary_fiber_g, sodium_mg,
  is_verified, is_restaurant, popularity_score, created_at
) VALUES
  (gen_random_uuid(), 'Chicken Burrito Bowl', 'Chipotle', '11111111-1111-1111-1111-111111111111'::uuid,
   625, 'g', '1 bowl', 650, 51, 57, 22, 10, 1350, true, true, 800, NOW()),

  (gen_random_uuid(), 'Steak Burrito Bowl', 'Chipotle', '11111111-1111-1111-1111-111111111111'::uuid,
   625, 'g', '1 bowl', 680, 36, 58, 27, 10, 1290, true, true, 750, NOW()),

  (gen_random_uuid(), 'Turkey Breast 6 inch', 'Subway', '11111111-1111-1111-1111-111111111111'::uuid,
   219, 'g', '6 inch sandwich', 280, 18, 46, 3.5, 5, 760, true, true, 700, NOW()),

  (gen_random_uuid(), 'Big Mac', 'McDonalds', '11111111-1111-1111-1111-111111111111'::uuid,
   219, 'g', '1 sandwich', 563, 26, 45, 33, 3, 1040, true, true, 900, NOW()),

  (gen_random_uuid(), 'Original Chicken Sandwich', 'Chick-fil-A', '11111111-1111-1111-1111-111111111111'::uuid,
   183, 'g', '1 sandwich', 440, 28, 41, 19, 2, 1400, true, true, 850, NOW()),

  (gen_random_uuid(), 'Turkey Tom', 'Jimmy Johns', '11111111-1111-1111-1111-111111111111'::uuid,
   283, 'g', '1 sandwich', 515, 27, 53, 23, 2, 1290, true, true, 600, NOW())
ON CONFLICT DO NOTHING;""")

    # Add protein bars
    sql_statements.append("\n-- Insert popular protein bars")
    sql_statements.append("""INSERT INTO public.foods_enhanced (
  id, name, brand_name, primary_source_id,
  serving_size, serving_unit, serving_description,
  calories, protein_g, total_carbs_g, total_fat_g, dietary_fiber_g, total_sugars_g, sodium_mg,
  is_verified, is_branded, popularity_score, created_at
) VALUES
  (gen_random_uuid(), 'Chocolate Chip Cookie Dough Protein Bar', 'Quest Nutrition', '11111111-1111-1111-1111-111111111111'::uuid,
   60, 'g', '1 bar', 200, 21, 21, 8, 14, 1, 200, true, true, 950, NOW()),

  (gen_random_uuid(), 'Oats n Honey Crunchy Granola Bar', 'Nature Valley', '11111111-1111-1111-1111-111111111111'::uuid,
   42, 'g', '2 bars', 190, 3, 28, 7, 2, 11, 160, true, true, 850, NOW()),

  (gen_random_uuid(), 'Chocolate Brownie Bar', 'Clif Bar', '11111111-1111-1111-1111-111111111111'::uuid,
   68, 'g', '1 bar', 250, 9, 45, 5, 5, 21, 150, true, true, 800, NOW()),

  (gen_random_uuid(), 'Chocolate Sea Salt', 'RXBAR', '11111111-1111-1111-1111-111111111111'::uuid,
   52, 'g', '1 bar', 210, 12, 23, 9, 5, 13, 260, true, true, 750, NOW()),

  (gen_random_uuid(), 'Dark Chocolate Nuts & Sea Salt', 'KIND', '11111111-1111-1111-1111-111111111111'::uuid,
   40, 'g', '1 bar', 180, 6, 16, 15, 7, 5, 140, true, true, 700, NOW()),

  (gen_random_uuid(), 'Chocolate Peanut Butter Bar', 'Pure Protein', '11111111-1111-1111-1111-111111111111'::uuid,
   50, 'g', '1 bar', 190, 20, 17, 6, 2, 2, 190, true, true, 650, NOW())
ON CONFLICT DO NOTHING;""")

    # Add common whole foods
    sql_statements.append("\n-- Insert common whole foods")
    sql_statements.append("""INSERT INTO public.foods_enhanced (
  id, name, primary_source_id,
  serving_size, serving_unit, serving_description,
  calories, protein_g, total_carbs_g, total_fat_g, dietary_fiber_g, total_sugars_g, sodium_mg,
  is_verified, is_generic, popularity_score, created_at
) VALUES
  (gen_random_uuid(), 'Chicken Breast, Raw', '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', '100 grams', 165, 31, 0, 3.6, 0, 0, 74, true, true, 900, NOW()),

  (gen_random_uuid(), 'Brown Rice, Cooked', '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', '100 grams', 112, 2.6, 23.5, 0.9, 1.8, 0.4, 5, true, true, 850, NOW()),

  (gen_random_uuid(), 'Banana, Raw', '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', '1 medium (118g)', 89, 1.1, 22.8, 0.3, 2.6, 12.2, 1, true, true, 950, NOW()),

  (gen_random_uuid(), 'Greek Yogurt, Plain, Nonfat', '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', '100 grams', 59, 10.2, 3.6, 0.4, 0, 3.2, 36, true, true, 800, NOW()),

  (gen_random_uuid(), 'Almonds, Raw', '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', '100 grams', 579, 21.2, 21.6, 49.9, 12.5, 4.4, 1, true, true, 750, NOW()),

  (gen_random_uuid(), 'Eggs, Whole, Raw', '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', '2 large eggs', 155, 13, 1.1, 11, 0, 1.1, 142, true, true, 900, NOW()),

  (gen_random_uuid(), 'Sweet Potato, Raw', '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', '100 grams', 86, 1.6, 20.1, 0.1, 3, 4.2, 55, true, true, 700, NOW()),

  (gen_random_uuid(), 'Broccoli, Raw', '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', '100 grams', 34, 2.8, 6.6, 0.4, 2.6, 1.7, 33, true, true, 650, NOW()),

  (gen_random_uuid(), 'Salmon, Atlantic, Farmed, Raw', '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', '100 grams', 208, 20.4, 0, 13.4, 0, 0, 59, true, true, 800, NOW()),

  (gen_random_uuid(), 'Ground Beef, 85% Lean, Raw', '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', '100 grams', 215, 18.6, 0, 15, 0, 0, 66, true, true, 850, NOW())
ON CONFLICT DO NOTHING;""")

    # Add popular beverages
    sql_statements.append("\n-- Insert popular beverages")
    sql_statements.append("""INSERT INTO public.foods_enhanced (
  id, name, brand_name, primary_source_id,
  serving_size, serving_unit, serving_description,
  calories, protein_g, total_carbs_g, total_fat_g, total_sugars_g, sodium_mg, caffeine_mg,
  is_verified, is_branded, popularity_score, created_at
) VALUES
  (gen_random_uuid(), 'Coca-Cola Classic', 'Coca-Cola', '11111111-1111-1111-1111-111111111111'::uuid,
   355, 'ml', '1 can (12 fl oz)', 140, 0, 39, 0, 39, 45, 34, true, true, 900, NOW()),

  (gen_random_uuid(), 'Gatorade Thirst Quencher, Lemon-Lime', 'Gatorade', '11111111-1111-1111-1111-111111111111'::uuid,
   591, 'ml', '1 bottle (20 fl oz)', 140, 0, 36, 0, 34, 270, 0, true, true, 850, NOW()),

  (gen_random_uuid(), 'Monster Energy', 'Monster', '11111111-1111-1111-1111-111111111111'::uuid,
   473, 'ml', '1 can (16 fl oz)', 210, 0, 54, 0, 54, 370, 160, true, true, 800, NOW()),

  (gen_random_uuid(), 'Red Bull Energy Drink', 'Red Bull', '11111111-1111-1111-1111-111111111111'::uuid,
   250, 'ml', '1 can (8.4 fl oz)', 110, 1, 28, 0, 27, 105, 80, true, true, 850, NOW()),

  (gen_random_uuid(), 'Muscle Milk Protein Shake, Chocolate', 'Muscle Milk', '11111111-1111-1111-1111-111111111111'::uuid,
   330, 'ml', '1 bottle (11 fl oz)', 160, 25, 9, 3.5, 2, 230, 0, true, true, 700, NOW())
ON CONFLICT DO NOTHING;""")

    # Add popular snacks
    sql_statements.append("\n-- Insert popular snacks")
    sql_statements.append("""INSERT INTO public.foods_enhanced (
  id, name, brand_name, primary_source_id,
  serving_size, serving_unit, serving_description,
  calories, protein_g, total_carbs_g, total_fat_g, dietary_fiber_g, sodium_mg,
  is_verified, is_branded, popularity_score, created_at
) VALUES
  (gen_random_uuid(), 'Nacho Cheese Doritos', 'Doritos', '11111111-1111-1111-1111-111111111111'::uuid,
   28, 'g', 'About 12 chips', 150, 2, 18, 8, 1, 210, true, true, 850, NOW()),

  (gen_random_uuid(), 'Crunchy Cheetos', 'Cheetos', '11111111-1111-1111-1111-111111111111'::uuid,
   28, 'g', 'About 21 pieces', 160, 2, 15, 10, 0.5, 250, true, true, 800, NOW()),

  (gen_random_uuid(), 'Creamy Peanut Butter', 'Jif', '11111111-1111-1111-1111-111111111111'::uuid,
   32, 'g', '2 tablespoons', 190, 8, 8, 16, 2, 140, true, true, 900, NOW()),

  (gen_random_uuid(), 'String Cheese, Mozzarella', 'Sargento', '11111111-1111-1111-1111-111111111111'::uuid,
   28, 'g', '1 stick', 80, 6, 1, 6, 0, 200, true, true, 750, NOW())
ON CONFLICT DO NOTHING;""")

    # Create popular foods cache
    sql_statements.append("\n-- Populate popular foods cache")
    sql_statements.append("""INSERT INTO public.popular_foods_cache (food_id, category, popularity_rank, monthly_search_count, cached_data)
SELECT
  f.id,
  CASE
    WHEN f.name ILIKE '%bar%' AND (f.name ILIKE '%protein%' OR f.brand_name ILIKE 'quest%' OR f.brand_name ILIKE 'rxbar%') THEN 'protein_bars'
    WHEN f.restaurant_name IS NOT NULL THEN 'fast_food'
    WHEN f.name ILIKE '%chip%' OR f.name ILIKE '%dorito%' OR f.name ILIKE '%cheeto%' THEN 'snacks'
    WHEN f.name ILIKE '%cola%' OR f.name ILIKE '%gatorade%' OR f.name ILIKE '%energy%' THEN 'beverages'
    WHEN f.name ILIKE '%chicken%' OR f.name ILIKE '%beef%' OR f.name ILIKE '%salmon%' THEN 'proteins'
    WHEN f.name ILIKE '%rice%' OR f.name ILIKE '%potato%' THEN 'grains'
    WHEN f.name ILIKE '%banana%' OR f.name ILIKE '%apple%' THEN 'fruits'
    WHEN f.name ILIKE '%broccoli%' OR f.name ILIKE '%spinach%' THEN 'vegetables'
    ELSE 'other'
  END AS category,
  ROW_NUMBER() OVER (PARTITION BY
    CASE
      WHEN f.name ILIKE '%bar%' AND (f.name ILIKE '%protein%' OR f.brand_name ILIKE 'quest%' OR f.brand_name ILIKE 'rxbar%') THEN 'protein_bars'
      WHEN f.restaurant_name IS NOT NULL THEN 'fast_food'
      WHEN f.name ILIKE '%chip%' OR f.name ILIKE '%dorito%' OR f.name ILIKE '%cheeto%' THEN 'snacks'
      WHEN f.name ILIKE '%cola%' OR f.name ILIKE '%gatorade%' OR f.name ILIKE '%energy%' THEN 'beverages'
      WHEN f.name ILIKE '%chicken%' OR f.name ILIKE '%beef%' OR f.name ILIKE '%salmon%' THEN 'proteins'
      WHEN f.name ILIKE '%rice%' OR f.name ILIKE '%potato%' THEN 'grains'
      WHEN f.name ILIKE '%banana%' OR f.name ILIKE '%apple%' THEN 'fruits'
      WHEN f.name ILIKE '%broccoli%' OR f.name ILIKE '%spinach%' THEN 'vegetables'
      ELSE 'other'
    END
    ORDER BY f.popularity_score DESC
  ) AS rank,
  f.popularity_score * 10 AS monthly_search_count,
  jsonb_build_object(
    'name', f.name,
    'brand', f.brand_name,
    'calories', f.calories,
    'protein_g', f.protein_g,
    'carbs_g', f.total_carbs_g,
    'fat_g', f.total_fat_g
  ) AS cached_data
FROM public.foods_enhanced f
WHERE f.popularity_score > 100
ON CONFLICT DO NOTHING;""")

    # Update search vectors
    sql_statements.append("\n-- Update search vectors for full-text search")
    sql_statements.append("UPDATE public.foods_enhanced SET search_vector = to_tsvector('english', name || ' ' || COALESCE(brand_name, '') || ' ' || COALESCE(restaurant_name, ''));")

    return "\n".join(sql_statements)

def main():
    # Generate SQL
    sql = generate_food_inserts()

    # Save to file
    with open("populate_foods.sql", 'w', encoding='utf-8') as f:
        f.write(sql)

    print("[SUCCESS] SQL file generated: populate_foods.sql")
    print(f"[INFO] File contains inserts for:")
    print("  - Food sources")
    print("  - Foods from API data")
    print("  - Restaurant menu items")
    print("  - Protein bars")
    print("  - Common whole foods")
    print("  - Beverages")
    print("  - Snacks")
    print("  - Popular foods cache")

if __name__ == "__main__":
    main()