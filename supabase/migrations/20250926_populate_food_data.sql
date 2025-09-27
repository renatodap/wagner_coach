-- =====================================================
-- FOOD DATA INSERTS - Generated from API data
-- Generated on: 2025-09-26 21:58:45
-- =====================================================

-- Ensure food sources exist
INSERT INTO public.food_sources (id, source_name, base_url, rate_limit_per_hour, priority_rank)
VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, 'usda', 'https://api.nal.usda.gov/fdc/v1/', 1000, 1),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'fatsecret', 'https://platform.fatsecret.com/rest/server.api', 5000, 2),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'nutritionix', 'https://trackapi.nutritionix.com/v2/', 500, 3)
ON CONFLICT (source_name) DO NOTHING;

-- Insert food data
INSERT INTO public.foods_enhanced (
  id, name, brand_name, fdc_id, barcode_upc, primary_source_id,
  serving_size, serving_unit, calories, protein_g, total_carbs_g,
  total_fat_g, dietary_fiber_g, total_sugars_g, sodium_mg,
  is_verified, is_branded, popularity_score, created_at
) VALUES
  ('f24a1c2a-2e7a-4a78-8e33-c947a1f91681'::uuid, 'QUEST, PROTEIN CHIPS, SALT & VINEGAR, SALT & VINEGAR', 'Quest Nutrition, LLC',
   '1879529', '888849000982',
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 375.0, 65.6, 15.6, 0.0, 0.0, 0.0, 906.0,
   true, true, 500, NOW()),
  ('b826f8d1-a8a3-45df-b66a-d5915a505e86'::uuid, 'QUEST, PROTEIN CHIPS, SEA SALT, SEA SALT', 'Quest Nutrition, LLC',
   '1879658', '888849000258',
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 375.0, 65.6, 15.6, 0.0, 0.0, 0.0, 594.0,
   true, true, 500, NOW()),
  ('9bd2b26d-d6a1-4cba-ade5-c6f243893f1d'::uuid, 'Nutrition bar (Snickers Marathon Protein Bar)', NULL,
   '2708122', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 415.0, 25.0, 50.5, 12.5, 12.5, 28.75, 238.0,
   true, false, 100, NOW()),
  ('8775d9db-0b2a-4f48-a390-f042d7052979'::uuid, 'Chocolate chips', NULL,
   '2710333', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 480.0, 4.2, 63.9, 30.0, 5.9, 54.5, 11.0,
   true, false, 100, NOW()),
  ('630b6577-5b71-4a61-b4c0-e96411aef40d'::uuid, 'Nutrition bar (South Beach Living High Protein Bar)', NULL,
   '2708124', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 412.0, 30.34, 38.4, 15.17, 7.3, 15.17, 436.0,
   true, false, 100, NOW()),
  ('9baef62d-54db-406b-9b96-a22e927bb8cf'::uuid, 'Cookie, bar, with chocolate', NULL,
   '2707908', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 492.0, 5.1, 65.36, 24.72, 2.0, 32.9, 311.0,
   true, false, 100, NOW()),
  ('3f08abaf-8aa2-45e9-a638-de1982448756'::uuid, 'Cookie, chocolate chip', NULL,
   '2707909', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 492.0, 5.1, 65.36, 24.72, 2.0, 32.9, 311.0,
   true, false, 100, NOW()),
  ('9051667b-9f0a-4b61-9867-128edf211cfb'::uuid, 'CHOCOLATE CHIP PROTEIN BAR, CHOCOLATE CHIP', 'Chicago Bar Company ',
   '2609152', '857777004690',
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 423.0, 23.1, 42.3, 0.0, 9.6, 25.0, 385.0,
   true, true, 100, NOW()),
  ('d45a6743-54d6-4bac-b767-634516dea9a9'::uuid, 'CHOCOLATE CHIP PROTEIN BAR, CHOCOLATE CHIP', 'Paleo Products Inc',
   '2157571', '850011938010',
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 475.0, 22.5, 35.0, 0.0, 7.5, 22.5, 238.0,
   true, true, 100, NOW()),
  ('e91f8dd2-d44c-4aa2-89f7-0feadfa630d6'::uuid, 'CHOCOLATE CHIP PROTEIN BAR, CHOCOLATE CHIP', 'Chicago Bar Company ',
   '2393712', '857777004720',
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 423.0, 23.1, 42.3, 0.0, 9.6, 25.0, 385.0,
   true, true, 100, NOW()),
  ('a903f8c1-5900-4cbd-af32-ed3ca6a2b910'::uuid, 'Cereal or granola bar (General Mills Nature Valley Crunchy Granola Bar)', NULL,
   '2708094', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 471.0, 10.1, 64.4, 19.8, 5.3, 28.57, 294.0,
   true, false, 500, NOW()),
  ('d1eeed98-0598-43fc-8983-25a8502acf12'::uuid, 'Cereal or granola bar (General Mills Nature Valley Sweet and Salty Granola Bar)', NULL,
   '2708093', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 487.0, 9.14, 61.14, 22.86, 2.9, 33.14, 414.0,
   true, false, 500, NOW()),
  ('fbbec80a-7867-4161-a9ce-7b7194cbc1f3'::uuid, 'Cereal or granola bar, with yogurt coating (General Mills Nature Valley Chewy Granola Bar)', NULL,
   '2708092', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 423.0, 5.71, 74.29, 11.43, 4.4, 40.0, 271.0,
   true, false, 500, NOW()),
  ('4051d299-d29e-465d-81f2-46be0fbd5fc0'::uuid, 'Cereal or granola bar (General Mills Nature Valley Chewy Trail Mix)', NULL,
   '2708091', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 415.0, 5.71, 72.27, 11.43, 3.8, 42.86, 185.0,
   true, false, 500, NOW()),
  ('ec8c1488-0a97-416e-b62f-77bc259fbc97'::uuid, 'Cereal or granola bar (Quaker Chewy Granola Bar)', NULL,
   '2708095', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 418.0, 5.65, 70.2, 16.57, 3.8, 28.92, 291.0,
   true, false, 100, NOW()),
  ('38c2ddc1-dc85-48d6-9bcd-7c1b94a44b26'::uuid, 'Nature Valley Crunchy Cinnamon Granola Bar', 'GENERAL MILLS SALES INC.',
   '2741208', '00016000264595',
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 452.0, 7.14, 69.0, 0.0, 4.8, 26.2, 357.0,
   true, true, 500, NOW()),
  ('d3975778-8547-4b90-aa86-44ac495ea1eb'::uuid, 'Nature Valley Crunchy Coconut Granola Bar', 'GENERAL MILLS SALES INC.',
   '1456422', '00016000511118',
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', NULL, 7.14, 64.3, 0.0, 4.8, 23.8, 429.0,
   true, true, 500, NOW()),
  ('980c9a23-d8d1-4b10-9ce6-23eeb5de18c3'::uuid, 'Nature Valley Crunchy Maple Granola Bar', 'GENERAL MILLS SALES INC.',
   '2741205', '00016000265998',
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 452.0, 7.14, 69.0, 0.0, 4.8, 28.6, 357.0,
   true, true, 500, NOW()),
  ('6c248157-a401-4c54-a196-1e66f7274592'::uuid, 'Cereal or granola bar (Quaker Chewy Dipps Granola Bar)', NULL,
   '2708098', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 480.0, 7.52, 64.96, 20.42, 3.2, 37.61, 269.0,
   true, false, 100, NOW()),
  ('16fde2fd-ba85-473a-b958-9609cd61c8b1'::uuid, 'Cereal or granola bar (Quaker Chewy 90 Calorie Granola Bar)', NULL,
   '2708096', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 408.0, 4.17, 79.17, 8.33, 4.2, 29.17, 313.0,
   true, false, 100, NOW()),
  ('7238d113-2835-41b6-8209-f3fdfa63b01a'::uuid, 'Burrito bowl, chicken', NULL,
   '2708560', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 161.0, 21.04, 0.27, 8.11, 0.0, 0.09, 301.0,
   true, false, 300, NOW()),
  ('808eaabd-d4d9-46e9-ae28-03440e64dbce'::uuid, 'Ramen bowl with chicken', NULL,
   '2709155', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 126.0, 7.04, 15.4, 3.86, 1.0, 0.44, 354.0,
   true, false, 300, NOW()),
  ('177ff3d7-dee8-4da1-804f-548823215f03'::uuid, 'Burrito bowl, chicken, with beans', NULL,
   '2708562', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 135.0, 13.6, 6.94, 5.87, 1.8, 0.34, 345.0,
   true, false, 300, NOW()),
  ('10bfa17f-6fdd-4765-9d73-48d5ef563324'::uuid, 'Burrito bowl, chicken, with rice', NULL,
   '2708561', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 155.0, 12.46, 14.21, 5.0, 0.2, 0.09, 277.0,
   true, false, 300, NOW()),
  ('c32ef468-bbb6-46d4-adf2-4525c1347f25'::uuid, 'Burrito bowl, chicken, with beans and rice', NULL,
   '2708563', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 145.0, 13.03, 10.58, 5.44, 1.0, 0.22, 311.0,
   true, false, 300, NOW()),
  ('cc16040f-592f-4287-a421-21a146e856ef'::uuid, 'CHIPOTLE CHICKEN VEGGIE & RICE BOWL, CHIPOTLE CHICKEN', 'Ready Pac Produce, Inc.',
   '2472635', '077745271187',
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 92.0, 5.25, 10.8, 0.0, 2.0, 2.3, 246.0,
   true, true, 500, NOW()),
  ('1dc43d78-992a-4741-8974-5238b7efea0b'::uuid, 'HERDEZ, COCINA MEXICANA BOWL, CHICKEN CHIPOTLE, CHICKEN CHIPOTLE', 'Herdez S.A.',
   '1851722', '072878126687',
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 127.0, 7.42, 15.9, 0.0, 0.7, 1.41, 325.0,
   true, true, 500, NOW()),
  ('bbe53231-c59b-412c-a729-aa2e650f107f'::uuid, 'CHIPOTLE BOWL, CHIPOTLE', 'American Outdoor Products, Inc.',
   '2656162', '048143019107',
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 380.0, 15.5, 63.4, 0.0, 12.7, 7.04, 775.0,
   true, true, 500, NOW()),
  ('63c6319f-b210-40ae-be4c-8285d96efa42'::uuid, 'LEAN CHIPOTLE CHICKEN BOWL, SPICY', 'Ruiz Food Products Inc',
   '1902112', '071007376191',
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 123.0, 7.05, 18.1, 0.0, 1.8, 1.32, 282.0,
   true, true, 500, NOW()),
  ('634e97a1-91dc-4179-8ec4-ddbe9db6dccb'::uuid, 'Burrito bowl, NFS', NULL,
   '2708555', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 145.0, 13.03, 10.58, 5.44, 1.0, 0.22, 311.0,
   true, false, 100, NOW()),
  ('ca85c683-b8ef-4504-8c84-12f2cac483fa'::uuid, 'Big Mac (McDonalds)', NULL,
   '2706916', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 261.0, 11.94, 21.53, 14.1, 1.4, 3.26, 485.0,
   true, false, 500, NOW()),
  ('eb446d45-e6a8-4606-afbf-8c105a749067'::uuid, 'Cheeseburger (McDonalds)', NULL,
   '2706892', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 270.0, 13.49, 25.46, 12.9, 1.9, 5.24, 628.0,
   true, false, 500, NOW()),
  ('55cee6e1-c0db-4b52-b5ee-70dbd1685463'::uuid, 'Hamburger (McDonalds)', NULL,
   '2706924', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 263.0, 13.3, 29.57, 10.18, 1.8, 5.95, 487.0,
   true, false, 500, NOW()),
  ('caac1077-05cc-460b-a9cd-2d73e8cbcb01'::uuid, 'McDouble (McDonalds)', NULL,
   '2706915', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 282.0, 16.24, 17.97, 16.18, 0.9, 4.16, 617.0,
   true, false, 500, NOW()),
  ('404aaf1b-014f-4099-a651-f7f1dd7cbf2c'::uuid, 'Double cheeseburger (McDonalds)', NULL,
   '2706914', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 282.0, 16.24, 17.97, 16.18, 0.9, 4.16, 617.0,
   true, false, 500, NOW()),
  ('d2a0e2da-35b6-48ed-89af-1df9aa5b757b'::uuid, 'Quarter Pounder (McDonalds)', NULL,
   '2706898', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 256.0, 15.68, 22.14, 11.6, 1.1, 3.67, 374.0,
   true, false, 500, NOW()),
  ('53a4a313-5076-4676-88e4-75d58e641e58'::uuid, 'Quarter Pounder with cheese (McDonalds)', NULL,
   '2706900', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 269.0, 15.21, 19.72, 14.4, 1.2, 3.6, 591.0,
   true, false, 500, NOW()),
  ('1c1d84aa-054c-444c-9e23-2ddc171603c4'::uuid, 'Macaroni or noodles with cheese, Easy Mac type', NULL,
   '2708815', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 110.0, 3.26, 20.1, 1.86, 0.5, 2.33, 259.0,
   true, false, 100, NOW()),
  ('2f45c4c8-fa52-49b8-b224-1b21c99b1fd5'::uuid, 'MAC & CHICKEN SAUSAGE BIG BOWL', 'Mainspring Holdings, Inc.',
   '2476117', '819710020143',
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 106.0, 5.29, 17.6, 0.0, 1.2, 1.76, 71.0,
   true, true, 300, NOW()),
  ('e17978a0-f920-4b3b-bb5a-0889c08e4091'::uuid, 'BIG ENRICHED BREAD, BIG', 'American Bakers Cooperative',
   '2484539', '071025006476',
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 250.0, 7.14, 46.4, 0.0, 0.0, 3.57, 536.0,
   true, true, 100, NOW()),
  ('cf8a3183-af88-490a-9627-7863738ec4c9'::uuid, 'Turkey sandwich on wheat', NULL,
   '2706983', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 187.0, 13.05, 24.56, 3.88, 2.8, 3.13, 619.0,
   true, false, 100, NOW()),
  ('e8d823a9-0057-45d8-a47d-4e6ac886cea6'::uuid, 'Turkey sandwich on white', NULL,
   '2706981', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 189.0, 12.03, 26.51, 3.68, 1.2, 3.2, 624.0,
   true, false, 100, NOW()),
  ('15e27709-56a4-41ce-b2e5-73fb0a21d3de'::uuid, 'Turkey sandwich wrap', NULL,
   '2706987', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 232.0, 12.77, 23.3, 9.4, 1.5, 2.42, 792.0,
   true, false, 100, NOW()),
  ('f7676ea8-1622-4a83-8e0b-6436d785c842'::uuid, 'Turkey and ham sandwich on white', NULL,
   '2707089', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 172.0, 13.12, 21.22, 3.68, 1.0, 2.49, 683.0,
   true, false, 100, NOW()),
  ('2e32de21-7ed0-4f59-916a-4ebf8a94a8b6'::uuid, 'Turkey and ham sandwich on wheat', NULL,
   '2707091', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 170.0, 13.94, 19.65, 3.84, 2.2, 2.43, 679.0,
   true, false, 100, NOW()),
  ('3a3c8fff-b1fe-4d3b-92f1-5e4f19275da8'::uuid, 'Turkey sandwich on wheat, with cheese', NULL,
   '2706984', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 214.0, 14.17, 21.56, 7.64, 2.4, 3.08, 679.0,
   true, false, 100, NOW()),
  ('7eab43f8-243e-47eb-92f5-e15d3888d215'::uuid, 'Turkey sandwich on white, with cheese', NULL,
   '2706982', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 215.0, 13.31, 23.22, 7.47, 1.0, 3.14, 683.0,
   true, false, 100, NOW()),
  ('37bf798a-b964-4393-82ec-f9cbc5009db7'::uuid, 'Turkey sandwich or sub, restaurant', NULL,
   '2706985', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 180.0, 12.33, 23.89, 3.69, 1.1, 2.96, 644.0,
   true, false, 100, NOW()),
  ('313d1bc0-fff1-4078-b4d4-fe5ce2a390e1'::uuid, 'Turkey and ham sandwich on white, with cheese', NULL,
   '2707090', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 195.0, 14.04, 19.16, 6.83, 0.8, 2.53, 725.0,
   true, false, 100, NOW()),
  ('a054f056-ac50-458f-ac9e-2960e218a5dd'::uuid, 'Turkey and ham sandwich or sub, restaurant', NULL,
   '2707093', NULL,
   '11111111-1111-1111-1111-111111111111'::uuid,
   100, 'g', 163.0, 13.47, 18.57, 3.69, 0.8, 2.22, 705.0,
   true, false, 100, NOW());

-- Insert popular restaurant items
INSERT INTO public.foods_enhanced (
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
ON CONFLICT DO NOTHING;

-- Insert popular protein bars
INSERT INTO public.foods_enhanced (
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
ON CONFLICT DO NOTHING;

-- Insert common whole foods
INSERT INTO public.foods_enhanced (
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
ON CONFLICT DO NOTHING;

-- Insert popular beverages
INSERT INTO public.foods_enhanced (
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
ON CONFLICT DO NOTHING;

-- Insert popular snacks
INSERT INTO public.foods_enhanced (
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
ON CONFLICT DO NOTHING;

-- Populate popular foods cache
INSERT INTO public.popular_foods_cache (food_id, category, popularity_rank, monthly_search_count, cached_data)
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
ON CONFLICT DO NOTHING;

-- Update search vectors for full-text search
UPDATE public.foods_enhanced SET search_vector = to_tsvector('english', name || ' ' || COALESCE(brand_name, '') || ' ' || COALESCE(restaurant_name, ''));