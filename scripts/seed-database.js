const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || (!serviceRoleKey && !anonKey)) {
  console.error('❌ Missing environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? 'Present' : 'Missing');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', anonKey ? 'Present' : 'Missing');
  process.exit(1);
}

// Try service role key first, fallback to anon key
const keyToUse = serviceRoleKey || anonKey;
const keyType = serviceRoleKey ? 'service role' : 'anon';

console.log('🔍 Using Supabase URL:', supabaseUrl);
console.log('🔍 Using key type:', keyType);
console.log('🔍 Key length:', keyToUse.length);

// Create Supabase client
const supabase = createClient(supabaseUrl, keyToUse, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const seedData = [
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
  }
];

async function seedFoods() {
  console.log(`🌱 Starting food database seeding with ${seedData.length} foods...`);

  let totalInserted = 0;
  const insertedFoods = [];
  const errors = [];

  for (let i = 0; i < seedData.length; i++) {
    const food = seedData[i];

    try {
      const { data, error } = await supabase
        .from('foods')
        .insert([food])
        .select()
        .single();

      if (error) {
        console.error(`❌ Error inserting food "${food.name}":`, error);
        errors.push({
          food_name: food.name,
          error: error.message
        });
      } else {
        totalInserted++;
        insertedFoods.push(data);
        console.log(`✅ Inserted food ${i + 1}/${seedData.length}: ${food.name}`);
      }
    } catch (err) {
      console.error(`❌ Exception inserting food "${food.name}":`, err);
      errors.push({
        food_name: food.name,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }

  console.log(`🎉 Seeding completed: ${totalInserted} foods inserted, ${errors.length} errors`);

  if (errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    errors.forEach(error => {
      console.log(`  • ${error.food_name}: ${error.error}`);
    });
  }

  if (totalInserted > 0) {
    console.log('\n✅ Successfully inserted foods:');
    insertedFoods.slice(0, 5).forEach(food => {
      console.log(`  • ${food.name} (${food.calories} cal)`);
    });
  }

  // Check final count
  const { count, error: countError } = await supabase
    .from('foods')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Error counting foods:', countError);
  } else {
    console.log(`\n📊 Total foods in database: ${count}`);
  }

  return {
    success: totalInserted > 0,
    total_inserted: totalInserted,
    errors: errors,
    final_count: count
  };
}

// Run the seeding
seedFoods()
  .then(result => {
    console.log('\n🏁 Seeding process completed');
    if (result.success) {
      console.log('✅ Food database successfully seeded!');
      process.exit(0);
    } else {
      console.log('❌ Food seeding failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Fatal error during seeding:', error);
    process.exit(1);
  });