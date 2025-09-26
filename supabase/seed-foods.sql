-- Comprehensive Food Database Seeding
-- Run this in your Supabase SQL editor

-- Insert common foods for the food database
INSERT INTO foods (
  name,
  brand,
  description,
  serving_size,
  serving_unit,
  calories,
  protein_g,
  carbs_g,
  fat_g,
  fiber_g,
  sugar_g,
  sodium_mg,
  is_public,
  is_verified,
  serving_description
) VALUES
  -- Proteins
  ('Chicken Breast, Grilled', NULL, 'Boneless, skinless chicken breast', 100, 'g', 165, 31.0, 0, 3.6, 0, 0, 74, true, true, '100g (about 3.5 oz)'),
  ('Chicken Thigh, Grilled', NULL, 'Boneless, skinless chicken thigh', 100, 'g', 209, 26.0, 0, 10.9, 0, 0, 95, true, true, '100g (about 3.5 oz)'),
  ('Salmon, Atlantic', NULL, 'Atlantic salmon, baked', 100, 'g', 206, 22.0, 0, 13.0, 0, 0, 61, true, true, '100g (about 3.5 oz)'),
  ('Tuna, Canned in Water', NULL, 'Light tuna in water, drained', 100, 'g', 116, 26.0, 0, 0.8, 0, 0, 247, true, true, '100g (about 3.5 oz)'),
  ('Eggs, Large', NULL, 'Whole chicken egg, large', 50, 'g', 70, 6.0, 0.4, 4.8, 0, 0.2, 124, true, true, '1 large egg (50g)'),
  ('Egg Whites', NULL, 'Liquid egg whites', 100, 'g', 52, 11.0, 0.7, 0.2, 0, 0.7, 166, true, true, '100g (about 3 egg whites)'),
  ('Greek Yogurt, Plain', 'Chobani', 'Non-fat plain Greek yogurt', 170, 'g', 100, 18.0, 6.0, 0, 0, 4.0, 60, true, true, '1 container (170g)'),
  ('Cottage Cheese, Low-fat', NULL, '2% milkfat cottage cheese', 226, 'g', 180, 24.0, 8.0, 5.0, 0, 8.0, 540, true, true, '1 cup (226g)'),
  ('Tofu, Firm', NULL, 'Firm tofu, raw', 100, 'g', 144, 17.3, 2.8, 8.7, 2.0, 0.7, 14, true, true, '100g (about 3.5 oz)'),
  ('Ground Beef, 93/7 Lean', NULL, 'Lean ground beef, cooked', 100, 'g', 182, 26.0, 0, 8.0, 0, 0, 72, true, true, '100g (about 3.5 oz)'),
  ('Turkey Breast, Deli', NULL, 'Sliced turkey breast', 56, 'g', 50, 11.0, 2.0, 0.5, 0, 1.0, 440, true, true, '2 oz (56g)'),
  ('Pork Tenderloin', NULL, 'Lean pork tenderloin, roasted', 100, 'g', 143, 26.0, 0, 3.5, 0, 0, 50, true, true, '100g (about 3.5 oz)'),

  -- Carbohydrates
  ('Brown Rice, Cooked', NULL, 'Long-grain brown rice, cooked', 195, 'g', 218, 5.0, 45.8, 1.6, 3.5, 0.7, 10, true, true, '1 cup cooked (195g)'),
  ('White Rice, Cooked', NULL, 'Long-grain white rice, cooked', 158, 'g', 205, 4.3, 44.5, 0.4, 0.6, 0.1, 2, true, true, '1 cup cooked (158g)'),
  ('Quinoa, Cooked', NULL, 'Quinoa, cooked', 185, 'g', 222, 8.1, 39.4, 3.6, 5.2, 1.6, 13, true, true, '1 cup cooked (185g)'),
  ('Oats, Old-Fashioned', 'Quaker', 'Old-fashioned rolled oats, dry', 40, 'g', 150, 5.0, 27.0, 3.0, 4.0, 1.0, 0, true, true, '1/2 cup dry (40g)'),
  ('Sweet Potato, Baked', NULL, 'Baked sweet potato with skin', 200, 'g', 180, 4.0, 41.4, 0.3, 6.6, 13.0, 72, true, true, '1 medium (200g)'),
  ('White Potato, Baked', NULL, 'Baked potato with skin', 173, 'g', 161, 4.3, 36.6, 0.2, 3.8, 2.0, 17, true, true, '1 medium (173g)'),
  ('Pasta, Whole Wheat', NULL, 'Whole wheat pasta, cooked', 140, 'g', 174, 7.5, 37.2, 0.8, 6.3, 0.8, 4, true, true, '1 cup cooked (140g)'),
  ('Bread, Whole Wheat', NULL, 'Whole wheat bread', 28, 'g', 69, 3.6, 12.0, 1.1, 1.9, 1.4, 132, true, true, '1 slice (28g)'),
  ('Bread, White', NULL, 'White bread', 25, 'g', 66, 1.9, 12.7, 0.8, 0.6, 1.4, 124, true, true, '1 slice (25g)'),
  ('Bagel, Plain', NULL, 'Plain bagel', 95, 'g', 245, 10.0, 48.0, 1.5, 2.0, 5.0, 430, true, true, '1 medium bagel (95g)'),

  -- Fruits
  ('Apple, Medium', NULL, 'Fresh apple with skin', 182, 'g', 95, 0.5, 25.0, 0.3, 4.4, 19.0, 2, true, true, '1 medium apple (182g)'),
  ('Banana, Medium', NULL, 'Fresh banana', 118, 'g', 105, 1.3, 27.0, 0.4, 3.1, 14.4, 1, true, true, '1 medium banana (118g)'),
  ('Orange, Medium', NULL, 'Fresh orange', 154, 'g', 62, 1.2, 15.4, 0.2, 3.1, 12.2, 0, true, true, '1 medium orange (154g)'),
  ('Strawberries', NULL, 'Fresh strawberries', 152, 'g', 49, 1.0, 11.7, 0.5, 3.0, 7.4, 2, true, true, '1 cup sliced (152g)'),
  ('Blueberries', NULL, 'Fresh blueberries', 148, 'g', 84, 1.1, 21.4, 0.5, 3.6, 14.7, 1, true, true, '1 cup (148g)'),
  ('Grapes, Red', NULL, 'Fresh red grapes', 151, 'g', 104, 1.1, 27.3, 0.2, 1.4, 23.4, 3, true, true, '1 cup (151g)'),
  ('Watermelon', NULL, 'Fresh watermelon, diced', 152, 'g', 46, 0.9, 11.5, 0.2, 0.6, 9.4, 2, true, true, '1 cup diced (152g)'),
  ('Pineapple', NULL, 'Fresh pineapple chunks', 165, 'g', 83, 0.9, 21.7, 0.2, 2.3, 16.3, 2, true, true, '1 cup chunks (165g)'),
  ('Mango', NULL, 'Fresh mango, sliced', 165, 'g', 99, 1.4, 24.7, 0.6, 2.6, 22.5, 2, true, true, '1 cup sliced (165g)'),
  ('Avocado', NULL, 'Fresh avocado', 201, 'g', 322, 4.0, 17.1, 29.5, 13.5, 1.3, 14, true, true, '1 whole avocado (201g)'),

  -- Vegetables
  ('Broccoli, Steamed', NULL, 'Fresh broccoli florets, steamed', 156, 'g', 55, 3.7, 11.2, 0.6, 5.1, 2.2, 64, true, true, '1 cup (156g)'),
  ('Spinach, Raw', NULL, 'Fresh spinach leaves', 30, 'g', 7, 0.9, 1.1, 0.1, 0.7, 0.1, 24, true, true, '1 cup (30g)'),
  ('Carrots, Raw', NULL, 'Fresh carrots, chopped', 128, 'g', 52, 1.2, 12.3, 0.3, 3.6, 6.1, 88, true, true, '1 cup chopped (128g)'),
  ('Bell Pepper, Red', NULL, 'Fresh red bell pepper', 119, 'g', 37, 1.2, 7.2, 0.4, 2.5, 5.0, 5, true, true, '1 medium (119g)'),
  ('Cucumber', NULL, 'Fresh cucumber, sliced', 119, 'g', 19, 0.8, 4.3, 0.1, 0.6, 2.0, 2, true, true, '1 cup sliced (119g)'),
  ('Tomato, Medium', NULL, 'Fresh tomato', 123, 'g', 22, 1.1, 4.8, 0.2, 1.5, 3.2, 6, true, true, '1 medium tomato (123g)'),
  ('Lettuce, Romaine', NULL, 'Fresh romaine lettuce', 47, 'g', 8, 0.6, 1.5, 0.1, 1.0, 0.6, 4, true, true, '1 cup shredded (47g)'),
  ('Green Beans', NULL, 'Fresh green beans, cooked', 125, 'g', 44, 2.4, 9.9, 0.4, 4.0, 4.5, 1, true, true, '1 cup (125g)'),
  ('Asparagus', NULL, 'Fresh asparagus, cooked', 180, 'g', 40, 4.3, 7.4, 0.4, 3.7, 3.7, 25, true, true, '1 cup (180g)'),
  ('Zucchini', NULL, 'Fresh zucchini, sliced', 124, 'g', 21, 1.5, 3.9, 0.4, 1.2, 3.1, 10, true, true, '1 cup sliced (124g)'),

  -- Nuts and Seeds
  ('Almonds, Raw', NULL, 'Raw almonds', 28, 'g', 164, 6.0, 6.1, 14.2, 3.5, 1.2, 0, true, true, '1 oz (23 almonds, 28g)'),
  ('Walnuts', NULL, 'Walnut halves', 28, 'g', 185, 4.3, 3.9, 18.5, 1.9, 0.7, 1, true, true, '1 oz (14 halves, 28g)'),
  ('Cashews, Raw', NULL, 'Raw cashews', 28, 'g', 157, 5.2, 8.6, 12.4, 0.9, 1.7, 3, true, true, '1 oz (18 cashews, 28g)'),
  ('Peanut Butter', 'Jif', 'Creamy peanut butter', 32, 'g', 190, 8.0, 8.0, 16.0, 2.0, 3.0, 140, true, true, '2 tablespoons (32g)'),
  ('Almond Butter', NULL, 'Natural almond butter', 32, 'g', 196, 7.0, 7.0, 18.0, 3.0, 2.0, 0, true, true, '2 tablespoons (32g)'),
  ('Chia Seeds', NULL, 'Whole chia seeds', 28, 'g', 138, 4.7, 11.9, 8.7, 9.8, 0, 5, true, true, '1 oz (2 tbsp, 28g)'),
  ('Flaxseeds, Ground', NULL, 'Ground flaxseeds', 10, 'g', 55, 1.9, 3.0, 4.3, 2.8, 0.2, 3, true, true, '1 tablespoon (10g)'),

  -- Dairy and Alternatives
  ('Milk, 2%', NULL, '2% reduced fat milk', 244, 'g', 122, 8.1, 11.7, 4.8, 0, 12.3, 115, true, true, '1 cup (244g)'),
  ('Milk, Skim', NULL, 'Fat-free milk', 245, 'g', 83, 8.3, 12.2, 0.2, 0, 12.5, 103, true, true, '1 cup (245g)'),
  ('Almond Milk, Unsweetened', NULL, 'Unsweetened almond milk', 240, 'g', 30, 1.0, 1.0, 2.5, 1.0, 0, 170, true, true, '1 cup (240g)'),
  ('Cheese, Cheddar', NULL, 'Sharp cheddar cheese', 28, 'g', 114, 7.0, 0.4, 9.4, 0, 0.1, 177, true, true, '1 oz (28g)'),
  ('Cheese, Mozzarella', NULL, 'Part-skim mozzarella', 28, 'g', 72, 6.9, 0.8, 4.5, 0, 0.3, 175, true, true, '1 oz (28g)'),
  ('Yogurt, Plain', NULL, 'Whole milk plain yogurt', 245, 'g', 149, 8.5, 11.4, 8.0, 0, 11.4, 113, true, true, '1 cup (245g)'),

  -- Fats and Oils
  ('Olive Oil, Extra Virgin', NULL, 'Extra virgin olive oil', 14, 'g', 120, 0, 0, 14.0, 0, 0, 0, true, true, '1 tablespoon (14g)'),
  ('Coconut Oil', NULL, 'Virgin coconut oil', 14, 'g', 120, 0, 0, 14.0, 0, 0, 0, true, true, '1 tablespoon (14g)'),
  ('Butter', NULL, 'Salted butter', 14, 'g', 102, 0.1, 0, 11.5, 0, 0, 91, true, true, '1 tablespoon (14g)'),

  -- Common Prepared Foods
  ('Pizza, Cheese', NULL, 'Regular crust cheese pizza', 107, 'g', 285, 12.2, 35.7, 10.4, 2.5, 3.8, 640, true, true, '1 slice large pizza (107g)'),
  ('Hamburger', NULL, 'Fast food hamburger with bun', 110, 'g', 250, 13.0, 30.0, 9.0, 1.5, 6.0, 520, true, true, '1 hamburger (110g)'),
  ('Protein Shake', 'Optimum Nutrition', 'Whey protein powder', 30, 'g', 120, 24.0, 3.0, 1.0, 0, 2.0, 130, true, true, '1 scoop (30g)')
ON CONFLICT (name, COALESCE(brand, '')) DO NOTHING;

-- Verify the insert
SELECT COUNT(*) as total_foods FROM foods WHERE is_public = true;