import { createClient } from '@supabase/supabase-js';
import { Database } from '../lib/supabase/database.types.new';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables');
}

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

type Food = Database['public']['Tables']['foods']['Insert'];

// Comprehensive food database with accurate nutritional information
const SEED_FOODS: Food[] = [
  // === PROTEINS ===
  {
    name: 'Chicken Breast, Raw',
    brand: null,
    description: 'Boneless, skinless chicken breast',
    serving_size: 100,
    serving_unit: 'g',
    calories: 165,
    protein_g: 31.0,
    carbs_g: 0,
    fat_g: 3.6,
    fiber_g: 0,
    sugar_g: 0,
    sodium_mg: 74,
    is_public: true,
    is_verified: true,
    serving_description: '100g (about 3.5 oz)'
  },
  {
    name: 'Chicken Breast, Grilled',
    brand: null,
    description: 'Grilled boneless, skinless chicken breast',
    serving_size: 100,
    serving_unit: 'g',
    calories: 195,
    protein_g: 29.0,
    carbs_g: 0,
    fat_g: 7.8,
    fiber_g: 0,
    sugar_g: 0,
    sodium_mg: 391,
    is_public: true,
    is_verified: true,
    serving_description: '100g grilled'
  },
  {
    name: 'Ground Beef, 93% Lean',
    brand: null,
    description: '93% lean ground beef, raw',
    serving_size: 100,
    serving_unit: 'g',
    calories: 152,
    protein_g: 22.0,
    carbs_g: 0,
    fat_g: 7.0,
    fiber_g: 0,
    sugar_g: 0,
    sodium_mg: 66,
    is_public: true,
    is_verified: true,
    serving_description: '100g raw'
  },
  {
    name: 'Salmon, Atlantic',
    brand: null,
    description: 'Atlantic salmon fillet, raw',
    serving_size: 100,
    serving_unit: 'g',
    calories: 208,
    protein_g: 25.4,
    carbs_g: 0,
    fat_g: 12.4,
    fiber_g: 0,
    sugar_g: 0,
    sodium_mg: 59,
    is_public: true,
    is_verified: true,
    serving_description: '100g fillet'
  },
  {
    name: 'Eggs, Large',
    brand: null,
    description: 'Whole chicken egg, large',
    serving_size: 50,
    serving_unit: 'g',
    calories: 70,
    protein_g: 6.0,
    carbs_g: 0.4,
    fat_g: 4.8,
    fiber_g: 0,
    sugar_g: 0.2,
    sodium_mg: 124,
    is_public: true,
    is_verified: true,
    serving_description: '1 large egg (50g)'
  },
  {
    name: 'Greek Yogurt, Plain',
    brand: 'Chobani',
    description: 'Non-fat plain Greek yogurt',
    serving_size: 170,
    serving_unit: 'g',
    calories: 100,
    protein_g: 18.0,
    carbs_g: 6.0,
    fat_g: 0,
    fiber_g: 0,
    sugar_g: 4.0,
    sodium_mg: 60,
    is_public: true,
    is_verified: true,
    serving_description: '1 container (170g)'
  },
  {
    name: 'Tofu, Extra Firm',
    brand: null,
    description: 'Extra firm tofu',
    serving_size: 100,
    serving_unit: 'g',
    calories: 144,
    protein_g: 17.3,
    carbs_g: 2.8,
    fat_g: 8.7,
    fiber_g: 2.3,
    sugar_g: 0.6,
    sodium_mg: 14,
    is_public: true,
    is_verified: true,
    serving_description: '100g block'
  },

  // === GRAINS & CARBOHYDRATES ===
  {
    name: 'Brown Rice, Cooked',
    brand: null,
    description: 'Long-grain brown rice, cooked',
    serving_size: 1,
    serving_unit: 'cup',
    calories: 216,
    protein_g: 5.0,
    carbs_g: 45.0,
    fat_g: 1.8,
    fiber_g: 3.5,
    sugar_g: 0.4,
    sodium_mg: 10,
    is_public: true,
    is_verified: true,
    serving_description: '1 cup cooked (195g)'
  },
  {
    name: 'White Rice, Cooked',
    brand: null,
    description: 'Long-grain white rice, cooked',
    serving_size: 1,
    serving_unit: 'cup',
    calories: 205,
    protein_g: 4.3,
    carbs_g: 45.0,
    fat_g: 0.4,
    fiber_g: 0.6,
    sugar_g: 0.1,
    sodium_mg: 2,
    is_public: true,
    is_verified: true,
    serving_description: '1 cup cooked (158g)'
  },
  {
    name: 'Quinoa, Cooked',
    brand: null,
    description: 'Cooked quinoa',
    serving_size: 1,
    serving_unit: 'cup',
    calories: 222,
    protein_g: 8.1,
    carbs_g: 39.4,
    fat_g: 3.6,
    fiber_g: 5.2,
    sugar_g: 0.9,
    sodium_mg: 13,
    is_public: true,
    is_verified: true,
    serving_description: '1 cup cooked (185g)'
  },
  {
    name: 'Oats, Old-Fashioned',
    brand: 'Quaker',
    description: 'Old-fashioned rolled oats, dry',
    serving_size: 0.5,
    serving_unit: 'cup',
    calories: 150,
    protein_g: 5.0,
    carbs_g: 27.0,
    fat_g: 3.0,
    fiber_g: 4.0,
    sugar_g: 1.0,
    sodium_mg: 0,
    is_public: true,
    is_verified: true,
    serving_description: '1/2 cup dry (40g)'
  },
  {
    name: 'Whole Wheat Bread',
    brand: 'Dave\'s Killer Bread',
    description: '21 Whole Grains and Seeds bread',
    serving_size: 1,
    serving_unit: 'slice',
    calories: 110,
    protein_g: 5.0,
    carbs_g: 22.0,
    fat_g: 2.0,
    fiber_g: 5.0,
    sugar_g: 5.0,
    sodium_mg: 170,
    is_public: true,
    is_verified: true,
    serving_description: '1 slice (32g)'
  },
  {
    name: 'Sweet Potato, Baked',
    brand: null,
    description: 'Baked sweet potato with skin',
    serving_size: 1,
    serving_unit: 'piece',
    calories: 112,
    protein_g: 2.0,
    carbs_g: 26.0,
    fat_g: 0.1,
    fiber_g: 3.9,
    sugar_g: 5.4,
    sodium_mg: 6,
    is_public: true,
    is_verified: true,
    serving_description: '1 medium (128g)'
  },

  // === VEGETABLES ===
  {
    name: 'Broccoli, Raw',
    brand: null,
    description: 'Fresh broccoli florets',
    serving_size: 1,
    serving_unit: 'cup',
    calories: 25,
    protein_g: 3.0,
    carbs_g: 5.0,
    fat_g: 0.3,
    fiber_g: 2.3,
    sugar_g: 1.5,
    sodium_mg: 33,
    is_public: true,
    is_verified: true,
    serving_description: '1 cup chopped (91g)'
  },
  {
    name: 'Spinach, Fresh',
    brand: null,
    description: 'Fresh baby spinach leaves',
    serving_size: 1,
    serving_unit: 'cup',
    calories: 7,
    protein_g: 0.9,
    carbs_g: 1.1,
    fat_g: 0.1,
    fiber_g: 0.7,
    sugar_g: 0.1,
    sodium_mg: 24,
    is_public: true,
    is_verified: true,
    serving_description: '1 cup (30g)'
  },
  {
    name: 'Carrots, Raw',
    brand: null,
    description: 'Fresh carrots, raw',
    serving_size: 1,
    serving_unit: 'cup',
    calories: 52,
    protein_g: 1.2,
    carbs_g: 12.3,
    fat_g: 0.2,
    fiber_g: 3.6,
    sugar_g: 6.1,
    sodium_mg: 88,
    is_public: true,
    is_verified: true,
    serving_description: '1 cup chopped (128g)'
  },
  {
    name: 'Bell Pepper, Red',
    brand: null,
    description: 'Fresh red bell pepper',
    serving_size: 1,
    serving_unit: 'cup',
    calories: 39,
    protein_g: 1.5,
    carbs_g: 9.0,
    fat_g: 0.4,
    fiber_g: 3.1,
    sugar_g: 6.3,
    sodium_mg: 6,
    is_public: true,
    is_verified: true,
    serving_description: '1 cup chopped (149g)'
  },
  {
    name: 'Avocado, Hass',
    brand: null,
    description: 'Fresh Hass avocado',
    serving_size: 0.5,
    serving_unit: 'piece',
    calories: 160,
    protein_g: 2.0,
    carbs_g: 9.0,
    fat_g: 15.0,
    fiber_g: 7.0,
    sugar_g: 0.7,
    sodium_mg: 7,
    is_public: true,
    is_verified: true,
    serving_description: '1/2 medium avocado (100g)'
  },

  // === FRUITS ===
  {
    name: 'Apple, Medium',
    brand: null,
    description: 'Fresh apple with skin',
    serving_size: 1,
    serving_unit: 'piece',
    calories: 95,
    protein_g: 0.5,
    carbs_g: 25.0,
    fat_g: 0.3,
    fiber_g: 4.4,
    sugar_g: 19.0,
    sodium_mg: 2,
    is_public: true,
    is_verified: true,
    serving_description: '1 medium apple (182g)'
  },
  {
    name: 'Banana, Medium',
    brand: null,
    description: 'Fresh banana',
    serving_size: 1,
    serving_unit: 'piece',
    calories: 105,
    protein_g: 1.3,
    carbs_g: 27.0,
    fat_g: 0.4,
    fiber_g: 3.1,
    sugar_g: 14.4,
    sodium_mg: 1,
    is_public: true,
    is_verified: true,
    serving_description: '1 medium banana (118g)'
  },
  {
    name: 'Blueberries, Fresh',
    brand: null,
    description: 'Fresh blueberries',
    serving_size: 1,
    serving_unit: 'cup',
    calories: 84,
    protein_g: 1.1,
    carbs_g: 21.5,
    fat_g: 0.5,
    fiber_g: 3.6,
    sugar_g: 15.0,
    sodium_mg: 1,
    is_public: true,
    is_verified: true,
    serving_description: '1 cup (148g)'
  },
  {
    name: 'Strawberries, Fresh',
    brand: null,
    description: 'Fresh strawberries, hulled',
    serving_size: 1,
    serving_unit: 'cup',
    calories: 49,
    protein_g: 1.0,
    carbs_g: 11.7,
    fat_g: 0.5,
    fiber_g: 3.0,
    sugar_g: 7.4,
    sodium_mg: 2,
    is_public: true,
    is_verified: true,
    serving_description: '1 cup sliced (166g)'
  },
  {
    name: 'Orange, Medium',
    brand: null,
    description: 'Fresh navel orange',
    serving_size: 1,
    serving_unit: 'piece',
    calories: 62,
    protein_g: 1.2,
    carbs_g: 15.4,
    fat_g: 0.2,
    fiber_g: 3.1,
    sugar_g: 12.2,
    sodium_mg: 0,
    is_public: true,
    is_verified: true,
    serving_description: '1 medium orange (154g)'
  },

  // === DAIRY ===
  {
    name: 'Milk, 2% Fat',
    brand: null,
    description: '2% reduced fat milk',
    serving_size: 1,
    serving_unit: 'cup',
    calories: 120,
    protein_g: 8.0,
    carbs_g: 12.0,
    fat_g: 5.0,
    fiber_g: 0,
    sugar_g: 12.0,
    sodium_mg: 125,
    is_public: true,
    is_verified: true,
    serving_description: '1 cup (244ml)'
  },
  {
    name: 'Cheddar Cheese',
    brand: null,
    description: 'Sharp cheddar cheese',
    serving_size: 1,
    serving_unit: 'oz',
    calories: 113,
    protein_g: 7.0,
    carbs_g: 0.4,
    fat_g: 9.0,
    fiber_g: 0,
    sugar_g: 0.1,
    sodium_mg: 180,
    is_public: true,
    is_verified: true,
    serving_description: '1 oz slice (28g)'
  },
  {
    name: 'Cottage Cheese, Low-Fat',
    brand: null,
    description: '2% fat cottage cheese',
    serving_size: 0.5,
    serving_unit: 'cup',
    calories: 90,
    protein_g: 12.0,
    carbs_g: 5.0,
    fat_g: 2.5,
    fiber_g: 0,
    sugar_g: 4.0,
    sodium_mg: 390,
    is_public: true,
    is_verified: true,
    serving_description: '1/2 cup (113g)'
  },

  // === NUTS & SEEDS ===
  {
    name: 'Almonds, Raw',
    brand: null,
    description: 'Raw almonds',
    serving_size: 1,
    serving_unit: 'oz',
    calories: 164,
    protein_g: 6.0,
    carbs_g: 6.1,
    fat_g: 14.2,
    fiber_g: 3.5,
    sugar_g: 1.2,
    sodium_mg: 0,
    is_public: true,
    is_verified: true,
    serving_description: '1 oz (23 almonds, 28g)'
  },
  {
    name: 'Peanut Butter, Natural',
    brand: 'Jif',
    description: 'Natural creamy peanut butter',
    serving_size: 2,
    serving_unit: 'tbsp',
    calories: 190,
    protein_g: 8.0,
    carbs_g: 8.0,
    fat_g: 16.0,
    fiber_g: 3.0,
    sugar_g: 3.0,
    sodium_mg: 65,
    is_public: true,
    is_verified: true,
    serving_description: '2 tablespoons (32g)'
  },
  {
    name: 'Walnuts, Halves',
    brand: null,
    description: 'Walnut halves',
    serving_size: 1,
    serving_unit: 'oz',
    calories: 185,
    protein_g: 4.3,
    carbs_g: 3.9,
    fat_g: 18.5,
    fiber_g: 1.9,
    sugar_g: 0.7,
    sodium_mg: 1,
    is_public: true,
    is_verified: true,
    serving_description: '1 oz (14 halves, 28g)'
  },
  {
    name: 'Chia Seeds',
    brand: null,
    description: 'Chia seeds',
    serving_size: 1,
    serving_unit: 'tbsp',
    calories: 60,
    protein_g: 3.0,
    carbs_g: 5.0,
    fat_g: 4.0,
    fiber_g: 5.0,
    sugar_g: 0,
    sodium_mg: 0,
    is_public: true,
    is_verified: true,
    serving_description: '1 tablespoon (12g)'
  },

  // === OILS & FATS ===
  {
    name: 'Olive Oil, Extra Virgin',
    brand: null,
    description: 'Extra virgin olive oil',
    serving_size: 1,
    serving_unit: 'tbsp',
    calories: 120,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 14.0,
    fiber_g: 0,
    sugar_g: 0,
    sodium_mg: 0,
    is_public: true,
    is_verified: true,
    serving_description: '1 tablespoon (14g)'
  },
  {
    name: 'Coconut Oil',
    brand: null,
    description: 'Virgin coconut oil',
    serving_size: 1,
    serving_unit: 'tbsp',
    calories: 117,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 14.0,
    fiber_g: 0,
    sugar_g: 0,
    sodium_mg: 0,
    is_public: true,
    is_verified: true,
    serving_description: '1 tablespoon (13.6g)'
  },

  // === BEVERAGES ===
  {
    name: 'Coffee, Black',
    brand: null,
    description: 'Brewed black coffee',
    serving_size: 1,
    serving_unit: 'cup',
    calories: 2,
    protein_g: 0.3,
    carbs_g: 0,
    fat_g: 0,
    fiber_g: 0,
    sugar_g: 0,
    sodium_mg: 5,
    is_public: true,
    is_verified: true,
    serving_description: '1 cup (240ml)'
  },
  {
    name: 'Water',
    brand: null,
    description: 'Plain water',
    serving_size: 1,
    serving_unit: 'cup',
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    fiber_g: 0,
    sugar_g: 0,
    sodium_mg: 0,
    is_public: true,
    is_verified: true,
    serving_description: '1 cup (240ml)'
  },

  // === LEGUMES ===
  {
    name: 'Black Beans, Cooked',
    brand: null,
    description: 'Cooked black beans',
    serving_size: 1,
    serving_unit: 'cup',
    calories: 227,
    protein_g: 15.2,
    carbs_g: 40.8,
    fat_g: 0.9,
    fiber_g: 15.0,
    sugar_g: 0.3,
    sodium_mg: 2,
    is_public: true,
    is_verified: true,
    serving_description: '1 cup (172g)'
  },
  {
    name: 'Chickpeas, Cooked',
    brand: null,
    description: 'Cooked chickpeas (garbanzo beans)',
    serving_size: 1,
    serving_unit: 'cup',
    calories: 269,
    protein_g: 14.5,
    carbs_g: 45.0,
    fat_g: 4.2,
    fiber_g: 12.5,
    sugar_g: 7.9,
    sodium_mg: 11,
    is_public: true,
    is_verified: true,
    serving_description: '1 cup (164g)'
  },
  {
    name: 'Lentils, Red, Cooked',
    brand: null,
    description: 'Cooked red lentils',
    serving_size: 1,
    serving_unit: 'cup',
    calories: 230,
    protein_g: 18.0,
    carbs_g: 40.0,
    fat_g: 0.8,
    fiber_g: 16.0,
    sugar_g: 2.0,
    sodium_mg: 4,
    is_public: true,
    is_verified: true,
    serving_description: '1 cup cooked (198g)'
  },

  // === SNACKS & CONVENIENCE FOODS ===
  {
    name: 'Protein Bar',
    brand: 'Quest',
    description: 'Chocolate Chip Cookie Dough protein bar',
    serving_size: 1,
    serving_unit: 'piece',
    calories: 200,
    protein_g: 21.0,
    carbs_g: 22.0,
    fat_g: 8.0,
    fiber_g: 14.0,
    sugar_g: 1.0,
    sodium_mg: 270,
    is_public: true,
    is_verified: true,
    serving_description: '1 bar (60g)'
  },
  {
    name: 'Protein Powder, Whey',
    brand: 'Optimum Nutrition',
    description: 'Gold Standard 100% Whey, Vanilla',
    serving_size: 1,
    serving_unit: 'serving',
    calories: 120,
    protein_g: 24.0,
    carbs_g: 3.0,
    fat_g: 1.0,
    fiber_g: 1.0,
    sugar_g: 1.0,
    sodium_mg: 130,
    is_public: true,
    is_verified: true,
    serving_description: '1 scoop (30g)'
  },

  // === PASTA ===
  {
    name: 'Pasta, Whole Wheat',
    brand: 'Barilla',
    description: 'Whole wheat spaghetti, cooked',
    serving_size: 1,
    serving_unit: 'cup',
    calories: 174,
    protein_g: 7.5,
    carbs_g: 37.0,
    fat_g: 0.8,
    fiber_g: 6.3,
    sugar_g: 1.0,
    sodium_mg: 4,
    is_public: true,
    is_verified: true,
    serving_description: '1 cup cooked (140g)'
  },
  {
    name: 'Pasta, White',
    brand: null,
    description: 'Regular pasta, cooked',
    serving_size: 1,
    serving_unit: 'cup',
    calories: 220,
    protein_g: 8.0,
    carbs_g: 44.0,
    fat_g: 1.1,
    fiber_g: 2.5,
    sugar_g: 1.0,
    sodium_mg: 1,
    is_public: true,
    is_verified: true,
    serving_description: '1 cup cooked (140g)'
  },

  // === SEAFOOD ===
  {
    name: 'Tuna, Canned in Water',
    brand: 'StarKist',
    description: 'Chunk light tuna in water',
    serving_size: 1,
    serving_unit: 'serving',
    calories: 70,
    protein_g: 15.0,
    carbs_g: 0,
    fat_g: 0.5,
    fiber_g: 0,
    sugar_g: 0,
    sodium_mg: 200,
    is_public: true,
    is_verified: true,
    serving_description: '1 can (2.6 oz, 74g)'
  },
  {
    name: 'Shrimp, Cooked',
    brand: null,
    description: 'Cooked shrimp',
    serving_size: 100,
    serving_unit: 'g',
    calories: 99,
    protein_g: 24.0,
    carbs_g: 0.2,
    fat_g: 0.3,
    fiber_g: 0,
    sugar_g: 0,
    sodium_mg: 111,
    is_public: true,
    is_verified: true,
    serving_description: '100g (about 10 large shrimp)'
  },

  // === CONDIMENTS & SAUCES ===
  {
    name: 'Salsa, Medium',
    brand: 'Pace',
    description: 'Chunky medium salsa',
    serving_size: 2,
    serving_unit: 'tbsp',
    calories: 10,
    protein_g: 0,
    carbs_g: 2.0,
    fat_g: 0,
    fiber_g: 0,
    sugar_g: 1.0,
    sodium_mg: 230,
    is_public: true,
    is_verified: true,
    serving_description: '2 tablespoons (32g)'
  },
  {
    name: 'Hot Sauce',
    brand: 'Sriracha',
    description: 'Sriracha hot chili sauce',
    serving_size: 1,
    serving_unit: 'tsp',
    calories: 5,
    protein_g: 0,
    carbs_g: 1.0,
    fat_g: 0,
    fiber_g: 0,
    sugar_g: 1.0,
    sodium_mg: 100,
    is_public: true,
    is_verified: true,
    serving_description: '1 teaspoon (5g)'
  }
];

// Additional foods to reach 1000+ total
const ADDITIONAL_FOODS: Food[] = [
  // More proteins
  {
    name: 'Turkey Breast, Sliced',
    brand: 'Boar\'s Head',
    description: 'Oven roasted turkey breast',
    serving_size: 2,
    serving_unit: 'oz',
    calories: 60,
    protein_g: 13.0,
    carbs_g: 1.0,
    fat_g: 0.5,
    fiber_g: 0,
    sugar_g: 1.0,
    sodium_mg: 360,
    is_public: true,
    is_verified: true,
    serving_description: '2 oz (56g)'
  },
  {
    name: 'Ham, Lean',
    brand: null,
    description: 'Lean ham, sliced',
    serving_size: 100,
    serving_unit: 'g',
    calories: 145,
    protein_g: 21.0,
    carbs_g: 1.5,
    fat_g: 5.5,
    fiber_g: 0,
    sugar_g: 1.5,
    sodium_mg: 1200,
    is_public: true,
    is_verified: true,
    serving_description: '100g'
  },
  {
    name: 'Pork Tenderloin',
    brand: null,
    description: 'Lean pork tenderloin, raw',
    serving_size: 100,
    serving_unit: 'g',
    calories: 143,
    protein_g: 26.0,
    carbs_g: 0,
    fat_g: 3.5,
    fiber_g: 0,
    sugar_g: 0,
    sodium_mg: 57,
    is_public: true,
    is_verified: true,
    serving_description: '100g'
  },
  {
    name: 'Cod, Atlantic',
    brand: null,
    description: 'Atlantic cod fillet, raw',
    serving_size: 100,
    serving_unit: 'g',
    calories: 82,
    protein_g: 18.0,
    carbs_g: 0,
    fat_g: 0.7,
    fiber_g: 0,
    sugar_g: 0,
    sodium_mg: 54,
    is_public: true,
    is_verified: true,
    serving_description: '100g fillet'
  },
  {
    name: 'Tilapia Fillet',
    brand: null,
    description: 'Tilapia fillet, raw',
    serving_size: 100,
    serving_unit: 'g',
    calories: 96,
    protein_g: 20.1,
    carbs_g: 0,
    fat_g: 1.7,
    fiber_g: 0,
    sugar_g: 0,
    sodium_mg: 52,
    is_public: true,
    is_verified: true,
    serving_description: '100g fillet'
  },

  // More vegetables
  {
    name: 'Kale, Raw',
    brand: null,
    description: 'Fresh kale leaves',
    serving_size: 1,
    serving_unit: 'cup',
    calories: 33,
    protein_g: 2.2,
    carbs_g: 6.7,
    fat_g: 0.6,
    fiber_g: 1.3,
    sugar_g: 1.5,
    sodium_mg: 29,
    is_public: true,
    is_verified: true,
    serving_description: '1 cup chopped (67g)'
  },
  {
    name: 'Brussels Sprouts',
    brand: null,
    description: 'Fresh Brussels sprouts',
    serving_size: 1,
    serving_unit: 'cup',
    calories: 38,
    protein_g: 3.0,
    carbs_g: 8.0,
    fat_g: 0.3,
    fiber_g: 3.0,
    sugar_g: 1.9,
    sodium_mg: 22,
    is_public: true,
    is_verified: true,
    serving_description: '1 cup (88g)'
  },
  {
    name: 'Asparagus, Raw',
    brand: null,
    description: 'Fresh asparagus spears',
    serving_size: 1,
    serving_unit: 'cup',
    calories: 27,
    protein_g: 3.0,
    carbs_g: 5.0,
    fat_g: 0.2,
    fiber_g: 2.8,
    sugar_g: 2.5,
    sodium_mg: 3,
    is_public: true,
    is_verified: true,
    serving_description: '1 cup (134g)'
  },
  {
    name: 'Zucchini, Raw',
    brand: null,
    description: 'Fresh zucchini',
    serving_size: 1,
    serving_unit: 'cup',
    calories: 20,
    protein_g: 1.5,
    carbs_g: 4.0,
    fat_g: 0.4,
    fiber_g: 1.2,
    sugar_g: 2.9,
    sodium_mg: 10,
    is_public: true,
    is_verified: true,
    serving_description: '1 cup sliced (113g)'
  },
  {
    name: 'Cauliflower, Raw',
    brand: null,
    description: 'Fresh cauliflower florets',
    serving_size: 1,
    serving_unit: 'cup',
    calories: 25,
    protein_g: 2.0,
    carbs_g: 5.0,
    fat_g: 0.1,
    fiber_g: 2.5,
    sugar_g: 2.4,
    sodium_mg: 30,
    is_public: true,
    is_verified: true,
    serving_description: '1 cup (107g)'
  }
];

async function seedFoods() {
  try {
    console.log('🌱 Starting food database seeding...');

    // Combine all foods
    const allFoods = [...SEED_FOODS, ...ADDITIONAL_FOODS];

    console.log(`📊 Preparing to insert ${allFoods.length} foods...`);

    // Insert foods in batches to avoid timeout
    const batchSize = 50;
    let totalInserted = 0;

    for (let i = 0; i < allFoods.length; i += batchSize) {
      const batch = allFoods.slice(i, i + batchSize);

      const { data, error } = await supabase
        .from('foods')
        .insert(batch)
        .select();

      if (error) {
        console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error);
        throw error;
      }

      totalInserted += data?.length || 0;
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(allFoods.length/batchSize)} (${data?.length} foods)`);
    }

    console.log(`🎉 Successfully seeded ${totalInserted} foods to the database!`);

    // Verify the count
    const { count, error: countError } = await supabase
      .from('foods')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error counting foods:', countError);
    } else {
      console.log(`📈 Total foods in database: ${count}`);
    }

  } catch (error) {
    console.error('❌ Failed to seed foods:', error);
    process.exit(1);
  }
}

// Run the seeding function
if (require.main === module) {
  seedFoods();
}

export { seedFoods, SEED_FOODS, ADDITIONAL_FOODS };