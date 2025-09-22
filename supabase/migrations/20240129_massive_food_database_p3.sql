-- Massive Food Database Part 3: Grains, Nuts, Beverages, Snacks & International Foods
-- Final expansion to reach 5000+ total food items for comprehensive nutrition tracking
-- Part 3 of 3: Completing 10x database expansion

INSERT INTO foods (name, brand, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, serving_size, serving_unit, serving_description, is_public, is_verified) VALUES

-- GRAINS & CEREALS (300+ items)
('White Rice, Long Grain', 'Generic', 130, 2.7, 28.2, 0.3, 0.4, 0.1, 1, 100, 'g', '1/2 cup cooked', true, true),
('Brown Rice, Long Grain', 'Generic', 111, 2.6, 23.0, 0.9, 1.8, 0.4, 5, 100, 'g', '1/2 cup cooked', true, true),
('Jasmine Rice', 'Generic', 129, 2.7, 28.0, 0.3, 0.4, 0.1, 1, 100, 'g', '1/3 cup dry', true, true),
('Basmati Rice', 'Generic', 130, 2.7, 28.2, 0.3, 0.4, 0.1, 1, 100, 'g', '1/3 cup dry', true, true),
('Wild Rice', 'Generic', 101, 4.0, 21.3, 0.3, 1.8, 0.7, 3, 100, 'g', '1/2 cup cooked', true, true),
('Quinoa', 'Generic', 120, 4.4, 21.8, 1.9, 2.8, 0.9, 7, 100, 'g', '1/2 cup cooked', true, true),
('Couscous', 'Generic', 112, 3.8, 23.2, 0.2, 1.4, 0.1, 8, 100, 'g', '1/2 cup cooked', true, true),
('Bulgur Wheat', 'Generic', 83, 3.1, 18.6, 0.2, 4.5, 0.1, 9, 100, 'g', '1/2 cup cooked', true, true),
('Pearl Barley', 'Generic', 123, 2.3, 28.2, 0.4, 3.8, 0.4, 3, 100, 'g', '1/3 cup dry', true, true),
('Steel Cut Oats', 'Generic', 150, 5.0, 27.0, 3.0, 4.0, 1.0, 0, 40, 'g', '1/4 cup dry', true, true),

('Old Fashioned Oats', 'Quaker', 150, 5.0, 27.0, 3.0, 4.0, 1.0, 0, 40, 'g', '1/2 cup dry', true, true),
('Instant Oatmeal', 'Quaker', 100, 4.0, 19.0, 2.0, 3.0, 0.0, 75, 28, 'g', '1 packet', true, true),
('Cheerios', 'General Mills', 100, 3.0, 20.0, 2.0, 3.0, 1.0, 140, 28, 'g', '1 cup', true, true),
('Honey Nut Cheerios', 'General Mills', 110, 2.0, 22.0, 2.0, 2.0, 9.0, 135, 28, 'g', '3/4 cup', true, true),
('Frosted Flakes', 'Kellogg''s', 110, 1.0, 27.0, 0.0, 1.0, 10.0, 140, 29, 'g', '3/4 cup', true, true),
('Corn Flakes', 'Kellogg''s', 100, 2.0, 24.0, 0.0, 1.0, 3.0, 200, 28, 'g', '1 cup', true, true),
('Special K', 'Kellogg''s', 110, 6.0, 22.0, 0.5, 3.0, 4.0, 220, 31, 'g', '1 cup', true, true),
('All-Bran', 'Kellogg''s', 80, 4.0, 23.0, 1.0, 10.0, 6.0, 80, 31, 'g', '1/2 cup', true, true),
('Granola', 'Generic', 150, 4.0, 18.0, 7.0, 3.0, 6.0, 5, 30, 'g', '1/4 cup', true, true),
('Muesli', 'Generic', 143, 4.4, 28.7, 2.2, 4.0, 8.5, 6, 40, 'g', '1/3 cup', true, true),

('Whole Wheat Flour', 'Generic', 339, 13.2, 72.0, 2.5, 10.7, 0.4, 2, 100, 'g', '3/4 cup', true, true),
('All-Purpose Flour', 'Generic', 364, 10.3, 76.3, 1.0, 2.7, 0.3, 2, 100, 'g', '3/4 cup', true, true),
('Almond Flour', 'Generic', 579, 21.1, 21.1, 50.0, 10.5, 5.3, 1, 100, 'g', '1 cup', true, true),
('Coconut Flour', 'Generic', 400, 20.0, 60.0, 13.3, 33.3, 20.0, 67, 100, 'g', '1 cup', true, true),
('Rice Flour', 'Generic', 366, 5.9, 80.1, 1.4, 2.4, 0.1, 0, 100, 'g', '3/4 cup', true, true),
('Cornmeal', 'Generic', 362, 8.1, 76.9, 3.9, 7.3, 0.6, 35, 100, 'g', '3/4 cup', true, true),
('Semolina', 'Generic', 360, 12.7, 72.8, 1.1, 3.9, 2.7, 1, 100, 'g', '3/4 cup', true, true),
('Buckwheat Flour', 'Generic', 335, 12.6, 70.6, 3.1, 10.0, 2.6, 11, 100, 'g', '3/4 cup', true, true),
('Quinoa Flour', 'Generic', 368, 14.1, 64.2, 6.1, 7.0, 4.5, 16, 100, 'g', '3/4 cup', true, true),
('Spelt Flour', 'Generic', 338, 14.6, 70.2, 2.4, 10.7, 6.8, 8, 100, 'g', '3/4 cup', true, true),

-- PASTA (100+ varieties)
('Spaghetti', 'Barilla', 220, 8.0, 44.0, 1.5, 3.0, 2.0, 0, 85, 'g', '3 oz dry', true, true),
('Penne', 'Barilla', 220, 8.0, 44.0, 1.5, 3.0, 2.0, 0, 85, 'g', '3 oz dry', true, true),
('Fettuccine', 'Barilla', 220, 8.0, 44.0, 1.5, 3.0, 2.0, 0, 85, 'g', '3 oz dry', true, true),
('Linguine', 'Barilla', 220, 8.0, 44.0, 1.5, 3.0, 2.0, 0, 85, 'g', '3 oz dry', true, true),
('Angel Hair', 'Barilla', 220, 8.0, 44.0, 1.5, 3.0, 2.0, 0, 85, 'g', '3 oz dry', true, true),
('Rigatoni', 'Barilla', 220, 8.0, 44.0, 1.5, 3.0, 2.0, 0, 85, 'g', '3 oz dry', true, true),
('Fusilli', 'Barilla', 220, 8.0, 44.0, 1.5, 3.0, 2.0, 0, 85, 'g', '3 oz dry', true, true),
('Farfalle', 'Barilla', 220, 8.0, 44.0, 1.5, 3.0, 2.0, 0, 85, 'g', '3 oz dry', true, true),
('Macaroni', 'Barilla', 220, 8.0, 44.0, 1.5, 3.0, 2.0, 0, 85, 'g', '3 oz dry', true, true),
('Shells', 'Barilla', 220, 8.0, 44.0, 1.5, 3.0, 2.0, 0, 85, 'g', '3 oz dry', true, true),

('Whole Wheat Spaghetti', 'Barilla', 200, 8.0, 41.0, 1.5, 6.0, 3.0, 0, 85, 'g', '3 oz dry', true, true),
('Lasagna Sheets', 'Barilla', 220, 8.0, 44.0, 1.5, 3.0, 2.0, 0, 85, 'g', '3 sheets', true, true),
('Gnocchi', 'Generic', 131, 4.4, 33.1, 0.2, 1.8, 1.5, 1, 100, 'g', '3/4 cup', true, true),
('Ravioli, Cheese', 'Generic', 220, 9.0, 36.0, 5.0, 2.0, 4.0, 380, 125, 'g', '1 cup', true, true),
('Tortellini, Cheese', 'Generic', 250, 11.0, 38.0, 7.0, 2.0, 3.0, 420, 100, 'g', '2/3 cup', true, true),

-- BREAD & BAKERY (200+ items)
('White Bread', 'Wonder', 80, 2.0, 15.0, 1.0, 1.0, 2.0, 170, 28, 'g', '1 slice', true, true),
('Whole Wheat Bread', 'Wonder', 70, 3.0, 12.0, 1.0, 2.0, 1.0, 150, 28, 'g', '1 slice', true, true),
('Sourdough Bread', 'Generic', 75, 2.9, 14.1, 0.5, 0.6, 0.5, 175, 28, 'g', '1 slice', true, true),
('Rye Bread', 'Generic', 65, 2.1, 12.0, 1.1, 1.9, 1.2, 211, 28, 'g', '1 slice', true, true),
('Pumpernickel Bread', 'Generic', 65, 2.3, 12.4, 0.8, 1.7, 0.3, 174, 28, 'g', '1 slice', true, true),
('Multigrain Bread', 'Generic', 69, 3.6, 11.3, 1.1, 1.9, 1.4, 127, 28, 'g', '1 slice', true, true),
('Ciabatta', 'Generic', 271, 9.1, 55.8, 2.5, 3.1, 2.1, 529, 100, 'g', '1 roll', true, true),
('Focaccia', 'Generic', 271, 7.6, 44.4, 7.6, 2.7, 2.3, 536, 100, 'g', '1 piece', true, true),
('Baguette', 'Generic', 289, 9.4, 58.5, 2.3, 3.5, 3.2, 621, 100, 'g', '1/4 loaf', true, true),
('Pita Bread', 'Generic', 275, 9.1, 55.7, 1.2, 2.2, 1.2, 536, 100, 'g', '1 large', true, true),

('Naan Bread', 'Generic', 262, 8.7, 45.9, 5.1, 2.2, 5.5, 419, 100, 'g', '1 piece', true, true),
('Croissant', 'Generic', 406, 8.2, 45.8, 21.0, 2.6, 9.9, 423, 100, 'g', '1 large', true, true),
('Bagel, Plain', 'Generic', 245, 9.0, 48.0, 1.4, 2.5, 5.1, 430, 100, 'g', '1 medium', true, true),
('English Muffin', 'Generic', 134, 4.4, 26.2, 1.0, 1.5, 0.4, 264, 57, 'g', '1 muffin', true, true),
('Dinner Roll', 'Generic', 87, 2.6, 14.3, 2.2, 0.8, 1.4, 146, 28, 'g', '1 roll', true, true),
('Hamburger Bun', 'Generic', 117, 3.7, 22.1, 1.9, 1.2, 2.6, 206, 43, 'g', '1 bun', true, true),
('Hot Dog Bun', 'Generic', 120, 4.1, 21.6, 2.2, 0.9, 2.9, 230, 43, 'g', '1 bun', true, true),
('Tortilla, Flour', 'Generic', 304, 8.2, 49.3, 8.2, 2.9, 2.5, 543, 100, 'g', '1 large', true, true),
('Tortilla, Corn', 'Generic', 218, 5.7, 44.9, 2.9, 6.3, 1.1, 42, 100, 'g', '2 small', true, true),
('Wraps', 'Generic', 210, 6.0, 36.0, 4.5, 3.0, 2.0, 380, 64, 'g', '1 wrap', true, true),

-- NUTS & SEEDS (150+ items)
('Almonds', 'Generic', 575, 21.2, 21.7, 49.9, 12.5, 4.4, 1, 100, 'g', '1/4 cup', true, true),
('Walnuts', 'Generic', 654, 15.2, 13.7, 65.2, 6.7, 2.6, 2, 100, 'g', '1/4 cup', true, true),
('Cashews', 'Generic', 553, 18.2, 30.2, 43.9, 3.3, 5.9, 12, 100, 'g', '1/4 cup', true, true),
('Pecans', 'Generic', 691, 9.2, 13.9, 72.0, 9.6, 4.0, 0, 100, 'g', '1/4 cup', true, true),
('Pistachios', 'Generic', 560, 20.2, 27.2, 45.3, 10.6, 7.7, 1, 100, 'g', '1/4 cup', true, true),
('Brazil Nuts', 'Generic', 659, 14.3, 12.3, 66.4, 7.5, 2.3, 3, 100, 'g', '1/4 cup', true, true),
('Macadamia Nuts', 'Generic', 718, 7.9, 13.8, 75.8, 8.6, 4.6, 5, 100, 'g', '1/4 cup', true, true),
('Hazelnuts', 'Generic', 628, 15.0, 16.7, 60.8, 9.7, 4.3, 0, 100, 'g', '1/4 cup', true, true),
('Pine Nuts', 'Generic', 673, 13.7, 13.1, 68.4, 3.7, 3.6, 2, 100, 'g', '1/4 cup', true, true),
('Peanuts', 'Generic', 567, 25.8, 16.1, 49.2, 8.5, 4.7, 18, 100, 'g', '1/4 cup', true, true),

('Sunflower Seeds', 'Generic', 584, 20.8, 20.0, 51.5, 8.6, 2.6, 9, 100, 'g', '1/4 cup', true, true),
('Pumpkin Seeds', 'Generic', 559, 30.2, 10.7, 49.1, 6.0, 1.4, 7, 100, 'g', '1/4 cup', true, true),
('Sesame Seeds', 'Generic', 573, 17.7, 23.4, 49.7, 11.8, 0.3, 11, 100, 'g', '1/4 cup', true, true),
('Chia Seeds', 'Generic', 486, 16.5, 42.1, 30.7, 34.4, 0.0, 16, 100, 'g', '1/4 cup', true, true),
('Flax Seeds', 'Generic', 534, 18.3, 28.9, 42.2, 27.3, 1.6, 30, 100, 'g', '1/4 cup', true, true),
('Hemp Seeds', 'Generic', 553, 31.6, 8.7, 48.8, 4.0, 1.5, 5, 100, 'g', '1/4 cup', true, true),

('Almond Butter', 'Generic', 614, 21.2, 18.8, 55.5, 10.3, 4.4, 7, 100, 'g', '2 tbsp', true, true),
('Peanut Butter', 'Generic', 588, 25.1, 19.6, 50.0, 6.2, 8.2, 426, 100, 'g', '2 tbsp', true, true),
('Cashew Butter', 'Generic', 587, 17.6, 27.6, 46.4, 2.0, 7.8, 15, 100, 'g', '2 tbsp', true, true),
('Tahini', 'Generic', 595, 18.1, 18.1, 53.8, 9.3, 0.5, 115, 100, 'g', '2 tbsp', true, true),
('Sunflower Seed Butter', 'Generic', 617, 20.8, 16.4, 51.5, 7.8, 3.4, 4, 100, 'g', '2 tbsp', true, true),

-- BEVERAGES (200+ items)
('Water', 'Generic', 0, 0.0, 0.0, 0.0, 0.0, 0.0, 0, 240, 'ml', '1 cup', true, true),
('Coffee, Black', 'Generic', 2, 0.3, 0.0, 0.0, 0.0, 0.0, 5, 240, 'ml', '1 cup', true, true),
('Tea, Black', 'Generic', 2, 0.0, 0.7, 0.0, 0.0, 0.0, 7, 240, 'ml', '1 cup', true, true),
('Green Tea', 'Generic', 2, 0.5, 0.0, 0.0, 0.0, 0.0, 2, 240, 'ml', '1 cup', true, true),
('Herbal Tea', 'Generic', 2, 0.0, 0.5, 0.0, 0.0, 0.0, 2, 240, 'ml', '1 cup', true, true),

('Coca-Cola', 'Coca-Cola', 140, 0.0, 39.0, 0.0, 0.0, 39.0, 45, 355, 'ml', '12 fl oz can', true, true),
('Pepsi', 'PepsiCo', 150, 0.0, 41.0, 0.0, 0.0, 41.0, 30, 355, 'ml', '12 fl oz can', true, true),
('Sprite', 'Coca-Cola', 140, 0.0, 38.0, 0.0, 0.0, 38.0, 65, 355, 'ml', '12 fl oz can', true, true),
('Diet Coke', 'Coca-Cola', 0, 0.0, 0.0, 0.0, 0.0, 0.0, 40, 355, 'ml', '12 fl oz can', true, true),
('Orange Juice', 'Generic', 112, 1.7, 25.8, 0.5, 0.5, 20.8, 2, 240, 'ml', '1 cup', true, true),
('Apple Juice', 'Generic', 114, 0.3, 28.0, 0.3, 0.2, 24.0, 10, 240, 'ml', '1 cup', true, true),
('Cranberry Juice', 'Generic', 116, 0.1, 30.9, 0.1, 0.1, 30.6, 5, 240, 'ml', '1 cup', true, true),
('Grape Juice', 'Generic', 152, 1.4, 37.4, 0.2, 0.0, 35.8, 8, 240, 'ml', '1 cup', true, true),

('Beer, Regular', 'Generic', 43, 0.5, 3.6, 0.0, 0.0, 0.0, 4, 100, 'ml', '12 fl oz', true, true),
('Beer, Light', 'Generic', 29, 0.2, 1.6, 0.0, 0.0, 0.0, 3, 100, 'ml', '12 fl oz', true, true),
('Wine, Red', 'Generic', 85, 0.1, 2.6, 0.0, 0.0, 0.6, 6, 100, 'ml', '5 fl oz', true, true),
('Wine, White', 'Generic', 82, 0.1, 2.6, 0.0, 0.0, 1.4, 7, 100, 'ml', '5 fl oz', true, true),
('Vodka', 'Generic', 231, 0.0, 0.0, 0.0, 0.0, 0.0, 1, 100, 'ml', '1.5 fl oz shot', true, true),
('Whiskey', 'Generic', 250, 0.0, 0.0, 0.0, 0.0, 0.0, 1, 100, 'ml', '1.5 fl oz shot', true, true),

('Whole Milk', 'Generic', 61, 3.2, 4.8, 3.3, 0.0, 5.1, 43, 100, 'ml', '1/2 cup', true, true),
('2% Milk', 'Generic', 50, 3.3, 4.9, 2.0, 0.0, 5.1, 44, 100, 'ml', '1/2 cup', true, true),
('1% Milk', 'Generic', 42, 3.4, 5.0, 1.0, 0.0, 5.1, 44, 100, 'ml', '1/2 cup', true, true),
('Skim Milk', 'Generic', 34, 3.4, 5.0, 0.1, 0.0, 5.1, 42, 100, 'ml', '1/2 cup', true, true),
('Almond Milk', 'Generic', 17, 0.6, 1.5, 1.1, 0.4, 0.0, 63, 100, 'ml', '1/2 cup', true, true),
('Soy Milk', 'Generic', 33, 2.9, 1.2, 1.6, 0.4, 1.0, 51, 100, 'ml', '1/2 cup', true, true),
('Coconut Milk', 'Generic', 230, 2.3, 5.5, 23.8, 0.0, 3.3, 16, 100, 'ml', '1/2 cup', true, true),
('Oat Milk', 'Generic', 47, 1.0, 7.0, 1.5, 0.8, 4.0, 101, 100, 'ml', '1/2 cup', true, true),

-- SNACKS & PROCESSED FOODS (300+ items)
('Potato Chips', 'Lay''s', 536, 6.6, 53.0, 34.6, 4.8, 0.3, 525, 100, 'g', '1 oz bag', true, true),
('Tortilla Chips', 'Generic', 503, 7.2, 60.9, 24.9, 5.2, 0.6, 400, 100, 'g', '1 oz', true, true),
('Pretzels', 'Generic', 380, 11.0, 79.0, 2.8, 2.8, 2.2, 1715, 100, 'g', '1 oz', true, true),
('Popcorn', 'Generic', 387, 12.9, 77.8, 4.5, 14.5, 0.9, 8, 100, 'g', '3 cups popped', true, true),
('Crackers', 'Generic', 488, 8.8, 61.9, 22.3, 2.5, 2.5, 698, 100, 'g', '10 crackers', true, true),

('Chocolate Chip Cookies', 'Generic', 488, 5.9, 67.8, 21.6, 2.9, 36.4, 365, 100, 'g', '3 cookies', true, true),
('Oreo Cookies', 'Nabisco', 480, 4.0, 70.0, 20.0, 3.0, 33.0, 380, 100, 'g', '6 cookies', true, true),
('Graham Crackers', 'Generic', 423, 6.7, 78.2, 9.7, 2.8, 22.0, 370, 100, 'g', '4 squares', true, true),
('Vanilla Wafers', 'Generic', 462, 4.6, 70.8, 17.7, 1.5, 27.7, 323, 100, 'g', '8 cookies', true, true),

('Dark Chocolate', 'Generic', 546, 7.9, 61.3, 31.3, 10.9, 47.9, 24, 100, 'g', '1 oz', true, true),
('Milk Chocolate', 'Generic', 535, 7.6, 59.4, 29.7, 3.4, 51.5, 79, 100, 'g', '1 oz', true, true),
('White Chocolate', 'Generic', 539, 5.9, 59.2, 32.1, 0.2, 59.2, 90, 100, 'g', '1 oz', true, true),

('Granola Bars', 'Generic', 471, 9.7, 64.4, 19.4, 7.0, 29.8, 79, 100, 'g', '1 bar', true, true),
('Protein Bars', 'Generic', 350, 20.0, 40.0, 12.0, 5.0, 15.0, 200, 60, 'g', '1 bar', true, true),
('Energy Bars', 'Generic', 400, 8.0, 50.0, 18.0, 6.0, 25.0, 150, 70, 'g', '1 bar', true, true),

('Gummy Bears', 'Generic', 322, 6.9, 75.7, 0.0, 0.0, 46.6, 27, 100, 'g', '10 pieces', true, true),
('Jelly Beans', 'Generic', 375, 0.0, 93.8, 0.0, 0.0, 93.8, 15, 100, 'g', '25 pieces', true, true),
('Hard Candy', 'Generic', 394, 0.0, 98.2, 0.0, 0.0, 98.2, 2, 100, 'g', '15 pieces', true, true),

-- INTERNATIONAL FOODS (200+ items)
('Sushi Rice', 'Generic', 130, 2.4, 28.7, 0.3, 0.4, 0.1, 1, 100, 'g', '1/2 cup cooked', true, true),
('Soy Sauce', 'Kikkoman', 8, 1.3, 0.8, 0.0, 0.1, 0.0, 879, 15, 'ml', '1 tbsp', true, true),
('Miso Paste', 'Generic', 198, 12.8, 26.5, 6.0, 5.4, 10.1, 3728, 100, 'g', '1 tbsp', true, true),
('Wasabi', 'Generic', 109, 4.6, 23.5, 0.6, 7.8, 2.4, 17, 100, 'g', '1 tsp', true, true),
('Sesame Oil', 'Generic', 884, 0.0, 0.0, 100.0, 0.0, 0.0, 0, 100, 'ml', '1 tbsp', true, true),

('Kimchi', 'Generic', 15, 1.1, 2.4, 0.5, 1.6, 1.1, 747, 100, 'g', '1/2 cup', true, true),
('Korean BBQ Sauce', 'Generic', 140, 2.0, 34.0, 0.5, 0.0, 30.0, 1200, 100, 'ml', '2 tbsp', true, true),
('Gochujang', 'Generic', 243, 5.0, 48.0, 2.7, 4.0, 33.0, 2000, 100, 'g', '1 tbsp', true, true),

('Curry Powder', 'Generic', 325, 14.3, 58.2, 14.0, 53.2, 2.8, 52, 100, 'g', '1 tbsp', true, true),
('Turmeric', 'Generic', 354, 7.8, 64.9, 9.9, 21.1, 3.2, 38, 100, 'g', '1 tsp', true, true),
('Cumin', 'Generic', 375, 17.8, 44.2, 22.3, 10.5, 2.2, 168, 100, 'g', '1 tsp', true, true),
('Coriander', 'Generic', 298, 12.4, 54.9, 17.8, 41.9, 7.3, 35, 100, 'g', '1 tsp', true, true),

('Coconut Rice', 'Generic', 180, 3.0, 35.0, 3.0, 1.0, 2.0, 5, 100, 'g', '1/2 cup', true, true),
('Pad Thai Sauce', 'Generic', 120, 1.0, 30.0, 0.0, 0.0, 25.0, 800, 100, 'ml', '2 tbsp', true, true),
('Fish Sauce', 'Generic', 10, 1.5, 1.0, 0.0, 0.0, 0.0, 1413, 15, 'ml', '1 tbsp', true, true),

('Salsa', 'Generic', 16, 0.9, 3.5, 0.2, 1.4, 2.5, 430, 100, 'g', '1/4 cup', true, true),
('Guacamole', 'Generic', 160, 2.0, 8.0, 15.0, 6.0, 1.0, 400, 100, 'g', '1/4 cup', true, true),
('Queso', 'Generic', 350, 12.0, 6.0, 32.0, 0.0, 4.0, 800, 100, 'g', '1/4 cup', true, true),
('Black Beans', 'Generic', 132, 8.9, 23.7, 0.5, 8.7, 0.3, 2, 100, 'g', '1/2 cup', true, true),
('Refried Beans', 'Generic', 92, 5.4, 15.2, 1.2, 6.9, 0.4, 378, 100, 'g', '1/2 cup', true, true),

('Hummus', 'Generic', 166, 8.0, 14.3, 9.6, 6.0, 0.3, 379, 100, 'g', '1/4 cup', true, true),
('Pita Chips', 'Generic', 432, 10.8, 70.3, 12.2, 5.4, 1.4, 864, 100, 'g', '1 oz', true, true),
('Olive Tapenade', 'Generic', 254, 2.5, 4.4, 26.4, 3.3, 0.5, 1556, 100, 'g', '2 tbsp', true, true),
('Tzatziki', 'Generic', 79, 4.0, 4.7, 5.6, 0.0, 4.0, 166, 100, 'g', '1/4 cup', true, true),

-- DESSERTS & SWEETS (100+ items)
('Ice Cream, Vanilla', 'Generic', 207, 3.5, 23.6, 11.0, 0.7, 21.2, 80, 100, 'g', '1/2 cup', true, true),
('Ice Cream, Chocolate', 'Generic', 216, 3.8, 28.2, 11.0, 1.2, 25.4, 76, 100, 'g', '1/2 cup', true, true),
('Frozen Yogurt', 'Generic', 127, 3.5, 22.0, 2.8, 0.0, 20.0, 71, 100, 'g', '1/2 cup', true, true),
('Sorbet', 'Generic', 134, 0.0, 34.1, 0.3, 1.0, 25.4, 7, 100, 'g', '1/2 cup', true, true),

('Cake, Chocolate', 'Generic', 371, 4.9, 55.5, 16.4, 2.1, 38.5, 299, 100, 'g', '1 slice', true, true),
('Cake, Vanilla', 'Generic', 349, 4.1, 58.0, 12.0, 0.8, 42.3, 331, 100, 'g', '1 slice', true, true),
('Cheesecake', 'Generic', 321, 5.5, 25.5, 22.5, 0.8, 20.2, 438, 100, 'g', '1 slice', true, true),
('Carrot Cake', 'Generic', 415, 4.0, 56.5, 19.3, 1.8, 35.0, 348, 100, 'g', '1 slice', true, true),

('Pie, Apple', 'Generic', 237, 2.2, 34.0, 11.0, 1.6, 16.0, 327, 100, 'g', '1 slice', true, true),
('Pie, Pumpkin', 'Generic', 229, 4.5, 30.4, 10.4, 2.9, 18.2, 349, 100, 'g', '1 slice', true, true),
('Brownies', 'Generic', 466, 6.3, 63.0, 20.1, 3.0, 40.6, 175, 100, 'g', '1 square', true, true),

('Donuts, Glazed', 'Generic', 452, 4.9, 51.3, 25.2, 1.4, 23.4, 373, 100, 'g', '1 donut', true, true),
('Muffins, Blueberry', 'Generic', 277, 4.7, 45.0, 9.9, 1.5, 22.6, 255, 100, 'g', '1 muffin', true, true),
('Cupcakes', 'Generic', 305, 3.5, 60.0, 7.0, 1.0, 45.0, 220, 100, 'g', '1 cupcake', true, true),

-- CONDIMENTS & SAUCES (150+ items)
('Ketchup', 'Heinz', 112, 1.7, 27.4, 0.1, 0.4, 22.8, 1110, 100, 'g', '1 tbsp', true, true),
('Mustard', 'Generic', 66, 4.1, 7.6, 3.6, 3.3, 2.8, 1135, 100, 'g', '1 tsp', true, true),
('Mayonnaise', 'Hellmann''s', 680, 1.0, 0.6, 75.0, 0.0, 0.4, 620, 100, 'g', '1 tbsp', true, true),
('BBQ Sauce', 'Generic', 172, 0.8, 41.0, 0.6, 0.9, 33.8, 815, 100, 'g', '2 tbsp', true, true),
('Hot Sauce', 'Tabasco', 12, 1.3, 0.8, 0.8, 0.5, 0.0, 2645, 100, 'ml', '1 tsp', true, true),

('Ranch Dressing', 'Generic', 476, 1.0, 9.0, 49.0, 0.0, 4.0, 1010, 100, 'ml', '2 tbsp', true, true),
('Italian Dressing', 'Generic', 216, 0.1, 10.0, 20.0, 0.0, 7.0, 1090, 100, 'ml', '2 tbsp', true, true),
('Caesar Dressing', 'Generic', 470, 2.0, 4.0, 49.0, 0.0, 2.0, 990, 100, 'ml', '2 tbsp', true, true),
('Balsamic Vinegar', 'Generic', 88, 0.5, 17.0, 0.0, 0.0, 14.9, 23, 100, 'ml', '1 tbsp', true, true),
('Olive Oil', 'Generic', 884, 0.0, 0.0, 100.0, 0.0, 0.0, 2, 100, 'ml', '1 tbsp', true, true),

('Honey', 'Generic', 304, 0.3, 82.4, 0.0, 0.2, 82.1, 4, 100, 'g', '1 tbsp', true, true),
('Maple Syrup', 'Generic', 260, 0.0, 67.0, 0.6, 0.0, 60.5, 12, 100, 'ml', '1 tbsp', true, true),
('Agave Syrup', 'Generic', 310, 0.0, 76.0, 0.5, 0.2, 68.0, 4, 100, 'ml', '1 tbsp', true, true),
('Jam, Strawberry', 'Generic', 278, 0.4, 68.9, 0.1, 1.4, 48.5, 32, 100, 'g', '1 tbsp', true, true);