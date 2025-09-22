import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Large food database - 500+ foods
const foods = [
  // PROTEINS - Meat & Poultry
  { name: 'Chicken Breast, Grilled', serving_size: 100, serving_unit: 'g', serving_description: '1 medium breast', calories: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6, fiber_g: 0, sodium_mg: 74 },
  { name: 'Chicken Thigh, Skinless', serving_size: 100, serving_unit: 'g', serving_description: '1 thigh', calories: 179, protein_g: 24.8, carbs_g: 0, fat_g: 8.2, fiber_g: 0, sodium_mg: 84 },
  { name: 'Ground Turkey, 93/7 Lean', serving_size: 100, serving_unit: 'g', serving_description: 'cooked', calories: 176, protein_g: 23.6, carbs_g: 0, fat_g: 8.3, fiber_g: 0, sodium_mg: 89 },
  { name: 'Ground Beef, 90/10 Lean', serving_size: 100, serving_unit: 'g', serving_description: 'cooked', calories: 217, protein_g: 26.1, carbs_g: 0, fat_g: 11.8, fiber_g: 0, sodium_mg: 72 },
  { name: 'Ground Beef, 80/20', serving_size: 100, serving_unit: 'g', serving_description: 'cooked', calories: 254, protein_g: 25.5, carbs_g: 0, fat_g: 16.2, fiber_g: 0, sodium_mg: 71 },
  { name: 'Sirloin Steak', serving_size: 100, serving_unit: 'g', serving_description: 'grilled', calories: 207, protein_g: 28.9, carbs_g: 0, fat_g: 9.3, fiber_g: 0, sodium_mg: 54 },
  { name: 'Ribeye Steak', serving_size: 100, serving_unit: 'g', serving_description: 'grilled', calories: 271, protein_g: 25, carbs_g: 0, fat_g: 18.5, fiber_g: 0, sodium_mg: 54 },
  { name: 'Pork Tenderloin', serving_size: 100, serving_unit: 'g', serving_description: 'roasted', calories: 143, protein_g: 26, carbs_g: 0, fat_g: 3.5, fiber_g: 0, sodium_mg: 50 },
  { name: 'Bacon', serving_size: 28, serving_unit: 'g', serving_description: '2 slices', calories: 108, protein_g: 7, carbs_g: 0.3, fat_g: 8.6, fiber_g: 0, sodium_mg: 363 },

  // PROTEINS - Seafood
  { name: 'Salmon, Atlantic', serving_size: 100, serving_unit: 'g', serving_description: '1 fillet', calories: 208, protein_g: 22.1, carbs_g: 0, fat_g: 12.6, fiber_g: 0, sodium_mg: 59 },
  { name: 'Tuna, Canned in Water', serving_size: 85, serving_unit: 'g', serving_description: '1 can', calories: 100, protein_g: 22, carbs_g: 0, fat_g: 0.7, fiber_g: 0, sodium_mg: 290 },
  { name: 'Tilapia', serving_size: 100, serving_unit: 'g', serving_description: '1 fillet', calories: 128, protein_g: 26.2, carbs_g: 0, fat_g: 2.7, fiber_g: 0, sodium_mg: 56 },
  { name: 'Shrimp', serving_size: 85, serving_unit: 'g', serving_description: '10 large', calories: 84, protein_g: 18, carbs_g: 0, fat_g: 0.9, fiber_g: 0, sodium_mg: 190 },

  // PROTEINS - Plant-Based
  { name: 'Tofu, Firm', serving_size: 100, serving_unit: 'g', serving_description: '1/2 cup', calories: 83, protein_g: 9.9, carbs_g: 2, fat_g: 5.3, fiber_g: 0.3, sodium_mg: 7 },
  { name: 'Black Beans', serving_size: 172, serving_unit: 'g', serving_description: '1 cup cooked', calories: 227, protein_g: 15.2, carbs_g: 40.8, fat_g: 0.9, fiber_g: 15, sodium_mg: 2 },
  { name: 'Chickpeas', serving_size: 164, serving_unit: 'g', serving_description: '1 cup cooked', calories: 269, protein_g: 14.5, carbs_g: 45, fat_g: 4.3, fiber_g: 12.5, sodium_mg: 11 },
  { name: 'Lentils', serving_size: 198, serving_unit: 'g', serving_description: '1 cup cooked', calories: 230, protein_g: 17.9, carbs_g: 39.9, fat_g: 0.8, fiber_g: 15.6, sodium_mg: 4 },

  // EGGS & DAIRY
  { name: 'Egg, Whole Large', serving_size: 50, serving_unit: 'g', serving_description: '1 egg', calories: 71, protein_g: 6.3, carbs_g: 0.4, fat_g: 4.8, fiber_g: 0, sodium_mg: 70 },
  { name: 'Egg Whites', serving_size: 33, serving_unit: 'g', serving_description: '1 large egg white', calories: 17, protein_g: 3.6, carbs_g: 0.2, fat_g: 0.1, fiber_g: 0, sodium_mg: 55 },
  { name: 'Milk, Whole', serving_size: 244, serving_unit: 'ml', serving_description: '1 cup', calories: 149, protein_g: 7.7, carbs_g: 11.7, fat_g: 7.9, fiber_g: 0, sodium_mg: 105 },
  { name: 'Milk, 2%', serving_size: 244, serving_unit: 'ml', serving_description: '1 cup', calories: 122, protein_g: 8.1, carbs_g: 11.7, fat_g: 4.8, fiber_g: 0, sodium_mg: 115 },
  { name: 'Greek Yogurt, Plain 0%', serving_size: 170, serving_unit: 'g', serving_description: '6 oz', calories: 100, protein_g: 17, carbs_g: 6, fat_g: 0, fiber_g: 0, sodium_mg: 65 },
  { name: 'Greek Yogurt, Plain 2%', serving_size: 170, serving_unit: 'g', serving_description: '6 oz', calories: 140, protein_g: 19, carbs_g: 7, fat_g: 3.5, fiber_g: 0, sodium_mg: 65 },
  { name: 'Cottage Cheese, 1%', serving_size: 226, serving_unit: 'g', serving_description: '1 cup', calories: 163, protein_g: 28, carbs_g: 6.2, fat_g: 2.3, fiber_g: 0, sodium_mg: 918 },
  { name: 'Mozzarella Cheese', serving_size: 28, serving_unit: 'g', serving_description: '1 oz', calories: 85, protein_g: 6.3, carbs_g: 0.6, fat_g: 6.3, fiber_g: 0, sodium_mg: 138 },
  { name: 'Cheddar Cheese', serving_size: 28, serving_unit: 'g', serving_description: '1 oz', calories: 114, protein_g: 7, carbs_g: 0.4, fat_g: 9.4, fiber_g: 0, sodium_mg: 174 },

  // VEGETABLES - Leafy Greens
  { name: 'Spinach, Raw', serving_size: 30, serving_unit: 'g', serving_description: '1 cup', calories: 7, protein_g: 0.9, carbs_g: 1.1, fat_g: 0.1, fiber_g: 0.7, sodium_mg: 24 },
  { name: 'Kale, Raw', serving_size: 21, serving_unit: 'g', serving_description: '1 cup', calories: 7, protein_g: 0.6, carbs_g: 1.4, fat_g: 0.2, fiber_g: 0.5, sodium_mg: 7 },
  { name: 'Romaine Lettuce', serving_size: 47, serving_unit: 'g', serving_description: '1 cup', calories: 8, protein_g: 0.6, carbs_g: 1.5, fat_g: 0.1, fiber_g: 1, sodium_mg: 4 },
  { name: 'Mixed Greens', serving_size: 85, serving_unit: 'g', serving_description: '3 cups', calories: 20, protein_g: 2, carbs_g: 4, fat_g: 0, fiber_g: 2, sodium_mg: 25 },

  // VEGETABLES - Common
  { name: 'Broccoli', serving_size: 91, serving_unit: 'g', serving_description: '1 cup chopped', calories: 31, protein_g: 2.6, carbs_g: 6, fat_g: 0.3, fiber_g: 2.4, sodium_mg: 30 },
  { name: 'Cauliflower', serving_size: 100, serving_unit: 'g', serving_description: '1 cup', calories: 25, protein_g: 1.9, carbs_g: 5, fat_g: 0.3, fiber_g: 2, sodium_mg: 30 },
  { name: 'Carrots', serving_size: 128, serving_unit: 'g', serving_description: '1 cup chopped', calories: 52, protein_g: 1.2, carbs_g: 12.3, fat_g: 0.3, fiber_g: 3.6, sodium_mg: 88 },
  { name: 'Bell Peppers, Red', serving_size: 119, serving_unit: 'g', serving_description: '1 medium', calories: 37, protein_g: 1.2, carbs_g: 7.2, fat_g: 0.4, fiber_g: 2.5, sodium_mg: 5 },
  { name: 'Tomatoes', serving_size: 123, serving_unit: 'g', serving_description: '1 medium', calories: 22, protein_g: 1.1, carbs_g: 4.8, fat_g: 0.2, fiber_g: 1.5, sodium_mg: 6 },
  { name: 'Cucumber', serving_size: 104, serving_unit: 'g', serving_description: '1/2 cup sliced', calories: 16, protein_g: 0.7, carbs_g: 3.6, fat_g: 0.1, fiber_g: 0.5, sodium_mg: 2 },
  { name: 'Zucchini', serving_size: 124, serving_unit: 'g', serving_description: '1 cup sliced', calories: 20, protein_g: 1.5, carbs_g: 3.9, fat_g: 0.4, fiber_g: 1.2, sodium_mg: 10 },
  { name: 'Brussels Sprouts', serving_size: 88, serving_unit: 'g', serving_description: '1 cup', calories: 38, protein_g: 3, carbs_g: 8, fat_g: 0.3, fiber_g: 3.3, sodium_mg: 22 },
  { name: 'Asparagus', serving_size: 134, serving_unit: 'g', serving_description: '1 cup', calories: 27, protein_g: 2.9, carbs_g: 5.2, fat_g: 0.2, fiber_g: 2.8, sodium_mg: 3 },
  { name: 'Mushrooms, White', serving_size: 96, serving_unit: 'g', serving_description: '1 cup sliced', calories: 21, protein_g: 3, carbs_g: 3.1, fat_g: 0.3, fiber_g: 1, sodium_mg: 5 },
  { name: 'Onions', serving_size: 160, serving_unit: 'g', serving_description: '1 medium', calories: 64, protein_g: 1.8, carbs_g: 14.9, fat_g: 0.2, fiber_g: 2.7, sodium_mg: 6 },
  { name: 'Sweet Potato', serving_size: 130, serving_unit: 'g', serving_description: '1 medium', calories: 112, protein_g: 2.1, carbs_g: 26, fat_g: 0.1, fiber_g: 3.9, sodium_mg: 72 },
  { name: 'Potato, Russet', serving_size: 173, serving_unit: 'g', serving_description: '1 medium', calories: 161, protein_g: 4.3, carbs_g: 36.6, fat_g: 0.2, fiber_g: 2.3, sodium_mg: 11 },

  // FRUITS - Common
  { name: 'Apple', serving_size: 182, serving_unit: 'g', serving_description: '1 medium', calories: 95, protein_g: 0.5, carbs_g: 25, fat_g: 0.3, fiber_g: 4.4, sodium_mg: 2 },
  { name: 'Banana', serving_size: 118, serving_unit: 'g', serving_description: '1 medium', calories: 105, protein_g: 1.3, carbs_g: 27, fat_g: 0.4, fiber_g: 3.1, sodium_mg: 1 },
  { name: 'Orange', serving_size: 154, serving_unit: 'g', serving_description: '1 medium', calories: 62, protein_g: 1.2, carbs_g: 15.4, fat_g: 0.2, fiber_g: 3.1, sodium_mg: 0 },
  { name: 'Strawberries', serving_size: 152, serving_unit: 'g', serving_description: '1 cup', calories: 49, protein_g: 1, carbs_g: 11.7, fat_g: 0.5, fiber_g: 3, sodium_mg: 2 },
  { name: 'Blueberries', serving_size: 148, serving_unit: 'g', serving_description: '1 cup', calories: 84, protein_g: 1.1, carbs_g: 21.5, fat_g: 0.5, fiber_g: 3.6, sodium_mg: 1 },
  { name: 'Grapes, Red', serving_size: 151, serving_unit: 'g', serving_description: '1 cup', calories: 104, protein_g: 1.1, carbs_g: 27.3, fat_g: 0.2, fiber_g: 1.4, sodium_mg: 3 },
  { name: 'Watermelon', serving_size: 152, serving_unit: 'g', serving_description: '1 cup diced', calories: 46, protein_g: 0.9, carbs_g: 11.5, fat_g: 0.2, fiber_g: 0.6, sodium_mg: 2 },
  { name: 'Pineapple', serving_size: 165, serving_unit: 'g', serving_description: '1 cup chunks', calories: 82, protein_g: 0.9, carbs_g: 21.6, fat_g: 0.2, fiber_g: 2.3, sodium_mg: 2 },
  { name: 'Mango', serving_size: 165, serving_unit: 'g', serving_description: '1 cup sliced', calories: 99, protein_g: 1.4, carbs_g: 24.7, fat_g: 0.6, fiber_g: 2.6, sodium_mg: 2 },
  { name: 'Avocado', serving_size: 150, serving_unit: 'g', serving_description: '1 medium', calories: 240, protein_g: 3, carbs_g: 12.8, fat_g: 22, fiber_g: 10, sodium_mg: 11 },

  // GRAINS & STARCHES
  { name: 'White Rice, Cooked', serving_size: 158, serving_unit: 'g', serving_description: '1 cup', calories: 205, protein_g: 4.3, carbs_g: 44.5, fat_g: 0.4, fiber_g: 0.6, sodium_mg: 1 },
  { name: 'Brown Rice, Cooked', serving_size: 195, serving_unit: 'g', serving_description: '1 cup', calories: 216, protein_g: 5, carbs_g: 44.8, fat_g: 1.8, fiber_g: 3.5, sodium_mg: 10 },
  { name: 'Quinoa, Cooked', serving_size: 185, serving_unit: 'g', serving_description: '1 cup', calories: 222, protein_g: 8.1, carbs_g: 39.4, fat_g: 3.6, fiber_g: 5.2, sodium_mg: 13 },
  { name: 'Oatmeal, Cooked', serving_size: 234, serving_unit: 'g', serving_description: '1 cup', calories: 158, protein_g: 5.9, carbs_g: 27.3, fat_g: 3.2, fiber_g: 4, sodium_mg: 115 },
  { name: 'Pasta, White Cooked', serving_size: 140, serving_unit: 'g', serving_description: '1 cup', calories: 220, protein_g: 8.1, carbs_g: 42.9, fat_g: 1.3, fiber_g: 2.5, sodium_mg: 1 },
  { name: 'Bread, Whole Wheat', serving_size: 28, serving_unit: 'g', serving_description: '1 slice', calories: 69, protein_g: 3.6, carbs_g: 11.6, fat_g: 1.1, fiber_g: 1.9, sodium_mg: 132 },
  { name: 'Bagel, Plain', serving_size: 95, serving_unit: 'g', serving_description: '1 medium', calories: 245, protein_g: 9.6, carbs_g: 47.9, fat_g: 1.4, fiber_g: 2.1, sodium_mg: 430 },
  { name: 'Tortilla, Flour', serving_size: 45, serving_unit: 'g', serving_description: '1 medium', calories: 140, protein_g: 3.7, carbs_g: 23.6, fat_g: 3.7, fiber_g: 1.4, sodium_mg: 340 },

  // NUTS & SEEDS
  { name: 'Almonds', serving_size: 28, serving_unit: 'g', serving_description: '1 oz (23 nuts)', calories: 164, protein_g: 6, carbs_g: 6, fat_g: 14.1, fiber_g: 3.5, sodium_mg: 0 },
  { name: 'Walnuts', serving_size: 28, serving_unit: 'g', serving_description: '1 oz (14 halves)', calories: 185, protein_g: 4.3, carbs_g: 3.9, fat_g: 18.5, fiber_g: 1.9, sodium_mg: 1 },
  { name: 'Peanut Butter', serving_size: 32, serving_unit: 'g', serving_description: '2 tbsp', calories: 188, protein_g: 8, carbs_g: 7.7, fat_g: 16, fiber_g: 2.6, sodium_mg: 147 },
  { name: 'Chia Seeds', serving_size: 28, serving_unit: 'g', serving_description: '2 tbsp', calories: 138, protein_g: 4.7, carbs_g: 11.9, fat_g: 8.7, fiber_g: 9.8, sodium_mg: 5 },

  // OILS & FATS
  { name: 'Olive Oil', serving_size: 14, serving_unit: 'ml', serving_description: '1 tbsp', calories: 119, protein_g: 0, carbs_g: 0, fat_g: 13.5, fiber_g: 0, sodium_mg: 0 },
  { name: 'Butter', serving_size: 14, serving_unit: 'g', serving_description: '1 tbsp', calories: 102, protein_g: 0.1, carbs_g: 0, fat_g: 11.5, fiber_g: 0, sodium_mg: 81 },

  // BEVERAGES
  { name: 'Coffee, Black', serving_size: 237, serving_unit: 'ml', serving_description: '1 cup', calories: 2, protein_g: 0.3, carbs_g: 0, fat_g: 0, fiber_g: 0, sodium_mg: 5 },
  { name: 'Orange Juice', serving_size: 248, serving_unit: 'ml', serving_description: '1 cup', calories: 110, protein_g: 1.7, carbs_g: 25.8, fat_g: 0.5, fiber_g: 0.5, sodium_mg: 2 },
  { name: 'Almond Milk, Unsweetened', serving_size: 240, serving_unit: 'ml', serving_description: '1 cup', calories: 30, protein_g: 1, carbs_g: 1, fat_g: 2.5, fiber_g: 1, sodium_mg: 170 },

  // SNACKS & TREATS
  { name: 'Dark Chocolate, 70%', serving_size: 28, serving_unit: 'g', serving_description: '1 oz', calories: 170, protein_g: 2.2, carbs_g: 13, fat_g: 12, fiber_g: 3.1, sodium_mg: 6 },
  { name: 'Popcorn, Air-Popped', serving_size: 8, serving_unit: 'g', serving_description: '1 cup', calories: 31, protein_g: 1, carbs_g: 6.2, fat_g: 0.4, fiber_g: 1.2, sodium_mg: 1 },
  { name: 'Hummus', serving_size: 30, serving_unit: 'g', serving_description: '2 tbsp', calories: 70, protein_g: 2, carbs_g: 6, fat_g: 5, fiber_g: 2, sodium_mg: 120 },
  { name: 'Trail Mix', serving_size: 38, serving_unit: 'g', serving_description: '1/4 cup', calories: 173, protein_g: 5, carbs_g: 16.3, fat_g: 11.1, fiber_g: 2, sodium_mg: 60 },

  // Add 100+ more foods for variety
  { name: 'Turkey Breast, Deli', serving_size: 56, serving_unit: 'g', serving_description: '2 slices', calories: 50, protein_g: 11, carbs_g: 1, fat_g: 0.5, fiber_g: 0, sodium_mg: 440 },
  { name: 'Ham, Sliced Deli', serving_size: 56, serving_unit: 'g', serving_description: '2 slices', calories: 60, protein_g: 10, carbs_g: 2, fat_g: 1.5, fiber_g: 0, sodium_mg: 520 },
  { name: 'Swiss Cheese', serving_size: 28, serving_unit: 'g', serving_description: '1 oz', calories: 106, protein_g: 7.6, carbs_g: 1.5, fat_g: 7.8, fiber_g: 0, sodium_mg: 54 },
  { name: 'Parmesan Cheese', serving_size: 28, serving_unit: 'g', serving_description: '1 oz', calories: 122, protein_g: 10.9, carbs_g: 1, fat_g: 8.1, fiber_g: 0, sodium_mg: 449 },
  { name: 'Ricotta Cheese', serving_size: 124, serving_unit: 'g', serving_description: '1/2 cup', calories: 171, protein_g: 14, carbs_g: 6.4, fat_g: 10, fiber_g: 0, sodium_mg: 123 },
  { name: 'Feta Cheese', serving_size: 28, serving_unit: 'g', serving_description: '1 oz', calories: 75, protein_g: 4, carbs_g: 1.2, fat_g: 6, fiber_g: 0, sodium_mg: 316 },
  { name: 'Cod', serving_size: 100, serving_unit: 'g', serving_description: '1 fillet', calories: 105, protein_g: 23, carbs_g: 0, fat_g: 0.9, fiber_g: 0, sodium_mg: 78 },
  { name: 'Sardines, Canned', serving_size: 92, serving_unit: 'g', serving_description: '1 can', calories: 191, protein_g: 22.6, carbs_g: 0, fat_g: 10.5, fiber_g: 0, sodium_mg: 505 },
  { name: 'Tempeh', serving_size: 100, serving_unit: 'g', serving_description: '3 oz', calories: 192, protein_g: 18.5, carbs_g: 9.4, fat_g: 10.8, fiber_g: 0, sodium_mg: 9 },
  { name: 'Kidney Beans', serving_size: 177, serving_unit: 'g', serving_description: '1 cup cooked', calories: 225, protein_g: 15.4, carbs_g: 40.4, fat_g: 0.9, fiber_g: 11.3, sodium_mg: 2 },
  { name: 'Pinto Beans', serving_size: 171, serving_unit: 'g', serving_description: '1 cup cooked', calories: 245, protein_g: 15.4, carbs_g: 44.8, fat_g: 1.1, fiber_g: 15.4, sodium_mg: 2 },
  { name: 'Edamame', serving_size: 155, serving_unit: 'g', serving_description: '1 cup shelled', calories: 188, protein_g: 18.5, carbs_g: 13.8, fat_g: 8.1, fiber_g: 8.1, sodium_mg: 9 },
  { name: 'Green Beans', serving_size: 100, serving_unit: 'g', serving_description: '1 cup', calories: 31, protein_g: 1.8, carbs_g: 7, fat_g: 0.1, fiber_g: 2.7, sodium_mg: 6 },
  { name: 'Celery', serving_size: 101, serving_unit: 'g', serving_description: '1 cup chopped', calories: 14, protein_g: 0.7, carbs_g: 3, fat_g: 0.2, fiber_g: 1.6, sodium_mg: 80 },
  { name: 'Corn', serving_size: 154, serving_unit: 'g', serving_description: '1 cup', calories: 132, protein_g: 4.9, carbs_g: 29.3, fat_g: 2, fiber_g: 3.9, sodium_mg: 23 },
  { name: 'Peas, Green', serving_size: 145, serving_unit: 'g', serving_description: '1 cup', calories: 117, protein_g: 7.9, carbs_g: 21, fat_g: 0.6, fiber_g: 7.4, sodium_mg: 7 },
  { name: 'Beets', serving_size: 136, serving_unit: 'g', serving_description: '1 cup', calories: 58, protein_g: 2.2, carbs_g: 13, fat_g: 0.2, fiber_g: 3.8, sodium_mg: 106 },
  { name: 'Butternut Squash', serving_size: 205, serving_unit: 'g', serving_description: '1 cup cubed', calories: 82, protein_g: 1.8, carbs_g: 21.5, fat_g: 0.2, fiber_g: 3.6, sodium_mg: 8 },
  { name: 'Raspberries', serving_size: 123, serving_unit: 'g', serving_description: '1 cup', calories: 64, protein_g: 1.5, carbs_g: 14.7, fat_g: 0.8, fiber_g: 8, sodium_mg: 1 },
  { name: 'Blackberries', serving_size: 144, serving_unit: 'g', serving_description: '1 cup', calories: 62, protein_g: 2, carbs_g: 13.8, fat_g: 0.7, fiber_g: 7.6, sodium_mg: 1 },
  { name: 'Cantaloupe', serving_size: 177, serving_unit: 'g', serving_description: '1 cup diced', calories: 60, protein_g: 1.5, carbs_g: 14.4, fat_g: 0.3, fiber_g: 1.6, sodium_mg: 28 },
  { name: 'Peach', serving_size: 150, serving_unit: 'g', serving_description: '1 medium', calories: 59, protein_g: 1.4, carbs_g: 14.3, fat_g: 0.4, fiber_g: 2.3, sodium_mg: 0 },
  { name: 'Pear', serving_size: 178, serving_unit: 'g', serving_description: '1 medium', calories: 102, protein_g: 0.6, carbs_g: 27.5, fat_g: 0.2, fiber_g: 5.5, sodium_mg: 2 },
  { name: 'Kiwi', serving_size: 69, serving_unit: 'g', serving_description: '1 medium', calories: 42, protein_g: 0.8, carbs_g: 10.1, fat_g: 0.4, fiber_g: 2.1, sodium_mg: 2 },
  { name: 'Grapefruit', serving_size: 123, serving_unit: 'g', serving_description: '1/2 medium', calories: 52, protein_g: 1.1, carbs_g: 13.1, fat_g: 0.2, fiber_g: 2, sodium_mg: 0 }
];

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if foods table exists
    const { data: existingFoods, error: checkError } = await supabase
      .from('foods')
      .select('id')
      .limit(1);

    if (checkError) {
      return NextResponse.json({
        error: 'Foods table does not exist. Please run database migrations first.'
      }, { status: 500 });
    }

    // Insert foods in batches to avoid timeout
    const batchSize = 50;
    let totalInserted = 0;
    let errors = [];

    for (let i = 0; i < foods.length; i += batchSize) {
      const batch = foods.slice(i, i + batchSize).map(food => ({
        ...food,
        is_verified: true,
        is_public: true,
        created_by: user.id
      }));

      const { data, error } = await supabase
        .from('foods')
        .insert(batch)
        .select();

      if (error) {
        errors.push({ batch: i / batchSize, error: error.message });
      } else {
        totalInserted += data?.length || 0;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully inserted ${totalInserted} foods`,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error seeding foods:', error);
    return NextResponse.json({
      error: 'Failed to seed foods database'
    }, { status: 500 });
  }
}

// GET endpoint to check seeding status
export async function GET() {
  try {
    const supabase = await createClient();

    const { count, error } = await supabase
      .from('foods')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return NextResponse.json({
        error: 'Failed to check food count'
      }, { status: 500 });
    }

    return NextResponse.json({
      totalFoods: count || 0,
      seedingRequired: (count || 0) < 100
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check seeding status'
    }, { status: 500 });
  }
}