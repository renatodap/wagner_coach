import requests
import json
import time
from typing import List, Dict, Any
import concurrent.futures
from datetime import datetime

# API Credentials
USDA_API_KEY = "9Ll2QcieCELrmwpilpYfNAgkMqecK4XqImZa9mmq"

class ComprehensiveFoodFetcher:
    def __init__(self):
        self.usda_base_url = "https://api.nal.usda.gov/fdc/v1"
        self.all_foods = []
        self.search_queries = self.generate_comprehensive_queries()

    def generate_comprehensive_queries(self) -> List[str]:
        """Generate comprehensive list of ALL foods Americans consume"""

        queries = []

        # ============= RESTAURANT CHAINS (Top 100+) =============
        restaurant_items = [
            # McDonald's
            "McDonald's Big Mac", "McDonald's Quarter Pounder", "McDonald's McNuggets",
            "McDonald's Filet-O-Fish", "McDonald's French Fries", "McDonald's Hash Browns",
            "McDonald's Egg McMuffin", "McDonald's McChicken", "McDonald's Apple Pie",

            # Subway
            "Subway Italian BMT", "Subway Turkey Breast", "Subway Tuna", "Subway Meatball",
            "Subway Chicken Teriyaki", "Subway Steak and Cheese", "Subway Veggie Delite",

            # Chipotle
            "Chipotle Chicken Bowl", "Chipotle Steak Bowl", "Chipotle Carnitas Bowl",
            "Chipotle Barbacoa Bowl", "Chipotle Sofritas", "Chipotle Guacamole",

            # Starbucks
            "Starbucks Frappuccino", "Starbucks Latte", "Starbucks Cappuccino",
            "Starbucks Caramel Macchiato", "Starbucks Pike Place", "Starbucks Breakfast Sandwich",

            # Chick-fil-A
            "Chick-fil-A Chicken Sandwich", "Chick-fil-A Nuggets", "Chick-fil-A Spicy Sandwich",
            "Chick-fil-A Waffle Fries", "Chick-fil-A Cobb Salad", "Chick-fil-A Milkshake",

            # Taco Bell
            "Taco Bell Crunchy Taco", "Taco Bell Burrito Supreme", "Taco Bell Quesadilla",
            "Taco Bell Chalupa", "Taco Bell Crunchwrap", "Taco Bell Nacho Fries",

            # Wendy's
            "Wendy's Baconator", "Wendy's Dave's Single", "Wendy's Spicy Chicken",
            "Wendy's Frosty", "Wendy's Nuggets", "Wendy's Chili",

            # Burger King
            "Burger King Whopper", "Burger King Chicken Fries", "Burger King Onion Rings",
            "Burger King Impossible Whopper", "Burger King Chicken Sandwich",

            # KFC
            "KFC Original Recipe", "KFC Extra Crispy", "KFC Popcorn Chicken",
            "KFC Famous Bowl", "KFC Biscuit", "KFC Coleslaw", "KFC Mashed Potatoes",

            # Pizza chains
            "Domino's Pepperoni Pizza", "Pizza Hut Pan Pizza", "Papa John's Pizza",
            "Little Caesars Hot-N-Ready", "Domino's Wings", "Pizza Hut Breadsticks",

            # Panera
            "Panera Broccoli Cheddar Soup", "Panera Mac and Cheese", "Panera Caesar Salad",
            "Panera Turkey Sandwich", "Panera Bagel", "Panera Cookie",

            # Five Guys
            "Five Guys Burger", "Five Guys Fries", "Five Guys Hot Dog", "Five Guys Milkshake",

            # In-N-Out
            "In-N-Out Double Double", "In-N-Out Animal Style", "In-N-Out Protein Style",

            # Dunkin'
            "Dunkin Donuts Glazed", "Dunkin Coffee", "Dunkin Breakfast Sandwich",
            "Dunkin Munchkins", "Dunkin Bagel",

            # Other major chains
            "Popeyes Chicken Sandwich", "Popeyes Biscuit", "Arby's Roast Beef",
            "Jimmy John's Turkey Tom", "Jersey Mike's Sub", "Firehouse Subs",
            "Qdoba Burrito", "Moe's Southwest", "Panda Express Orange Chicken",
            "Panda Express Beijing Beef", "P.F. Chang's", "Olive Garden Breadsticks",
            "Applebee's Riblets", "Chili's Fajitas", "Outback Bloomin Onion",
            "Texas Roadhouse Rolls", "Red Lobster Biscuit", "IHOP Pancakes",
            "Denny's Grand Slam", "Waffle House", "Cracker Barrel",
            "Buffalo Wild Wings", "Wingstop", "Raising Cane's",
            "Whataburger", "Carl's Jr", "Hardee's", "Jack in the Box Taco",
            "Sonic Burger", "Dairy Queen Blizzard", "Culver's ButterBurger",
            "Shake Shack", "Sweetgreen Salad", "Cava Bowl", "Noodles & Company"
        ]

        # ============= BREAKFAST FOODS =============
        breakfast_items = [
            # Cereals (Top 50 brands)
            "Cheerios", "Honey Nut Cheerios", "Frosted Flakes", "Lucky Charms",
            "Cinnamon Toast Crunch", "Froot Loops", "Cocoa Puffs", "Trix",
            "Reese's Puffs", "Captain Crunch", "Life Cereal", "Honey Bunches of Oats",
            "Special K", "Corn Flakes", "Rice Krispies", "Cocoa Krispies",
            "Apple Jacks", "Fruity Pebbles", "Cocoa Pebbles", "Raisin Bran",
            "Frosted Mini Wheats", "Kix", "Golden Grahams", "Cookie Crisp",
            "Count Chocula", "Honey Smacks", "Grape-Nuts", "Shredded Wheat",
            "Quaker Oats", "Instant Oatmeal", "Steel Cut Oats", "Cream of Wheat",
            "Malt-O-Meal", "Granola", "Muesli",

            # Breakfast proteins
            "Scrambled eggs", "Fried egg", "Poached egg", "Boiled egg", "Egg whites",
            "Turkey bacon", "Bacon", "Sausage links", "Sausage patty", "Canadian bacon",
            "Ham steak", "Breakfast steak", "Corned beef hash",

            # Breakfast breads
            "Toast", "English muffin", "Bagel", "Croissant", "Biscuit",
            "Pancakes", "Waffles", "French toast", "Crepes", "Dutch baby",
            "Blueberry muffin", "Bran muffin", "Banana bread", "Coffee cake",
            "Danish", "Donut", "Bear claw", "Cinnamon roll", "Pop-Tarts",
            "Toaster Strudel", "Eggo Waffles",

            # Breakfast sides
            "Hash browns", "Home fries", "Grits", "Breakfast potatoes",
            "Fresh fruit", "Yogurt parfait", "Cottage cheese", "Smoothie bowl"
        ]

        # ============= LUNCH/DINNER PROTEINS =============
        protein_items = [
            # Chicken
            "Grilled chicken breast", "Fried chicken", "Rotisserie chicken",
            "Chicken thighs", "Chicken wings", "Chicken tenders", "Chicken nuggets",
            "Chicken drumsticks", "Buffalo chicken", "Chicken parmesan",
            "Chicken alfredo", "Chicken stir fry", "Chicken tacos", "Chicken salad",

            # Beef
            "Ground beef", "Steak", "Ribeye", "Sirloin", "Filet mignon",
            "New York strip", "T-bone", "Pot roast", "Beef stew", "Meatloaf",
            "Hamburger", "Cheeseburger", "Beef tacos", "Beef brisket",
            "Prime rib", "Beef ribs", "Corned beef", "Pastrami",

            # Pork
            "Pork chops", "Pulled pork", "Pork tenderloin", "Pork ribs",
            "Ham", "Spiral ham", "Pork belly", "Carnitas", "Pork roast",
            "Pork sausage", "Bratwurst", "Hot dog", "Pepperoni",

            # Seafood
            "Salmon", "Tuna", "Tilapia", "Cod", "Halibut", "Mahi mahi",
            "Swordfish", "Trout", "Catfish", "Bass", "Shrimp", "Lobster",
            "Crab", "Scallops", "Oysters", "Clams", "Mussels", "Calamari",
            "Fish sticks", "Fish and chips", "Sushi", "Poke bowl",

            # Turkey & Game
            "Turkey breast", "Ground turkey", "Turkey burger", "Turkey meatballs",
            "Duck", "Venison", "Bison", "Lamb chops", "Lamb gyro",

            # Plant-based proteins
            "Tofu", "Tempeh", "Seitan", "Beyond Burger", "Impossible Burger",
            "Black bean burger", "Veggie burger", "Lentils", "Chickpeas",
            "Black beans", "Pinto beans", "Kidney beans", "Navy beans"
        ]

        # ============= CARBS & GRAINS =============
        carb_items = [
            # Rice
            "White rice", "Brown rice", "Jasmine rice", "Basmati rice",
            "Wild rice", "Spanish rice", "Fried rice", "Rice pilaf",
            "Sticky rice", "Cauliflower rice",

            # Pasta
            "Spaghetti", "Penne", "Fettuccine", "Linguine", "Angel hair",
            "Rigatoni", "Ziti", "Macaroni", "Shells", "Bow tie pasta",
            "Orzo", "Lasagna", "Ravioli", "Tortellini", "Gnocchi",
            "Ramen noodles", "Udon noodles", "Rice noodles", "Pad thai noodles",

            # Bread
            "White bread", "Wheat bread", "Whole grain bread", "Sourdough",
            "Rye bread", "Pumpernickel", "Naan", "Pita bread", "Flatbread",
            "Focaccia", "Ciabatta", "Baguette", "Dinner rolls", "Hawaiian rolls",
            "Hamburger buns", "Hot dog buns", "Tortilla", "Corn tortilla",

            # Potatoes
            "Baked potato", "Mashed potatoes", "French fries", "Sweet potato",
            "Sweet potato fries", "Potato salad", "Roasted potatoes",
            "Scalloped potatoes", "Au gratin potatoes", "Tater tots",
            "Potato chips", "Loaded potato skins",

            # Other grains
            "Quinoa", "Couscous", "Bulgur", "Farro", "Barley", "Millet",
            "Buckwheat", "Amaranth", "Polenta", "Cornbread"
        ]

        # ============= FRUITS & VEGETABLES =============
        produce_items = [
            # Common fruits
            "Apple", "Banana", "Orange", "Grapes", "Strawberry", "Blueberry",
            "Raspberry", "Blackberry", "Watermelon", "Cantaloupe", "Honeydew",
            "Pineapple", "Mango", "Peach", "Pear", "Plum", "Cherry",
            "Grapefruit", "Lemon", "Lime", "Avocado", "Tomato", "Kiwi",
            "Pomegranate", "Papaya", "Apricot", "Nectarine", "Fig", "Date",
            "Cranberry", "Coconut", "Dragon fruit", "Star fruit", "Passion fruit",

            # Common vegetables
            "Broccoli", "Cauliflower", "Carrots", "Celery", "Cucumber",
            "Bell pepper", "Spinach", "Lettuce", "Kale", "Cabbage",
            "Brussels sprouts", "Asparagus", "Green beans", "Peas", "Corn",
            "Zucchini", "Squash", "Eggplant", "Mushrooms", "Onion",
            "Garlic", "Potato", "Sweet potato", "Beet", "Radish",
            "Turnip", "Parsnip", "Artichoke", "Okra", "Bok choy"
        ]

        # ============= DAIRY & ALTERNATIVES =============
        dairy_items = [
            # Milk
            "Whole milk", "2% milk", "1% milk", "Skim milk", "Chocolate milk",
            "Almond milk", "Soy milk", "Oat milk", "Coconut milk", "Cashew milk",
            "Hemp milk", "Rice milk", "Lactaid milk", "Buttermilk",

            # Cheese
            "Cheddar cheese", "Mozzarella", "Swiss cheese", "American cheese",
            "Pepper jack", "Provolone", "Gouda", "Brie", "Blue cheese",
            "Feta", "Parmesan", "Romano", "Ricotta", "Cottage cheese",
            "Cream cheese", "String cheese", "Cheese stick", "Velveeta",
            "Queso", "Nacho cheese", "Mac and cheese",

            # Yogurt
            "Greek yogurt", "Regular yogurt", "Vanilla yogurt", "Strawberry yogurt",
            "Blueberry yogurt", "Chobani", "Yoplait", "Dannon", "Fage",
            "Skyr", "Activia", "Oikos", "Siggi's", "Noosa", "Kefir",

            # Other dairy
            "Butter", "Margarine", "Heavy cream", "Half and half", "Whipped cream",
            "Sour cream", "Ice cream", "Frozen yogurt", "Gelato", "Sherbet"
        ]

        # ============= SNACKS & CHIPS =============
        snack_items = [
            # Chips
            "Lay's potato chips", "Ruffles", "Pringles", "Kettle chips",
            "Doritos Nacho", "Doritos Cool Ranch", "Cheetos", "Fritos",
            "Sun Chips", "Tostitos", "Tortilla chips", "Takis", "Funyuns",
            "Cheez-Its", "Goldfish", "Wheat Thins", "Triscuit", "Ritz crackers",

            # Sweet snacks
            "Oreos", "Chips Ahoy", "Nutter Butter", "Fig Newtons", "Teddy Grahams",
            "Animal crackers", "Graham crackers", "Vanilla wafers", "Milano cookies",
            "Girl Scout cookies", "Thin Mints", "Samoas", "Tagalongs",

            # Candy
            "Snickers", "M&Ms", "Reese's", "Kit Kat", "Twix", "Milky Way",
            "Butterfinger", "Baby Ruth", "Hershey bar", "Twizzlers", "Skittles",
            "Starburst", "Jolly Rancher", "Sour Patch Kids", "Haribo gummy bears",
            "Swedish Fish", "Mike and Ike", "Hot Tamales", "Red Vines",

            # Healthy snacks
            "Trail mix", "Mixed nuts", "Almonds", "Cashews", "Pistachios",
            "Walnuts", "Pecans", "Peanuts", "Sunflower seeds", "Pumpkin seeds",
            "Beef jerky", "Turkey jerky", "Protein bar", "Granola bar",
            "Rice cakes", "Popcorn", "Pretzels", "Veggie straws", "Hummus",

            # Frozen treats
            "Ben & Jerry's", "Haagen-Dazs", "Breyers", "Drumstick", "Klondike bar",
            "Ice cream sandwich", "Popsicle", "Fudgesicle", "Push pop",
            "Italian ice", "Snow cone"
        ]

        # ============= BEVERAGES =============
        beverage_items = [
            # Soda
            "Coca-Cola", "Pepsi", "Dr Pepper", "Mountain Dew", "Sprite",
            "7-Up", "Root Beer", "Ginger Ale", "Orange Crush", "Grape Soda",
            "Diet Coke", "Coke Zero", "Diet Pepsi", "Pepsi Zero",

            # Energy drinks
            "Red Bull", "Monster Energy", "Rockstar", "Bang Energy", "Reign",
            "5-hour Energy", "NOS", "Full Throttle", "AMP Energy", "C4 Energy",
            "Ghost Energy", "Celsius", "G Fuel", "Prime Energy",

            # Sports drinks
            "Gatorade", "Powerade", "BodyArmor", "Vitamin Water", "Smart Water",
            "Liquid IV", "Pedialyte", "Nuun", "Propel",

            # Coffee
            "Black coffee", "Latte", "Cappuccino", "Americano", "Espresso",
            "Macchiato", "Mocha", "Frappuccino", "Cold brew", "Iced coffee",
            "Nitro cold brew", "Bulletproof coffee", "Turkish coffee",

            # Tea
            "Green tea", "Black tea", "Iced tea", "Sweet tea", "Chai tea",
            "Matcha", "Bubble tea", "Kombucha", "Arnold Palmer",

            # Juice
            "Orange juice", "Apple juice", "Grape juice", "Cranberry juice",
            "Pineapple juice", "Tomato juice", "V8", "Naked juice", "Odwalla",
            "Simply Orange", "Tropicana", "Minute Maid", "Welch's",

            # Alcohol
            "Beer", "Light beer", "IPA", "Lager", "Stout", "White wine",
            "Red wine", "Champagne", "Vodka", "Whiskey", "Rum", "Tequila",
            "Gin", "Bourbon", "Scotch", "Brandy", "Margarita", "Martini",
            "Mojito", "Cosmopolitan", "Bloody Mary", "Mimosa", "Sangria",
            "White Claw", "Truly", "Mike's Hard Lemonade", "Smirnoff Ice"
        ]

        # ============= CONDIMENTS & SAUCES =============
        condiment_items = [
            "Ketchup", "Mustard", "Mayo", "Miracle Whip", "BBQ sauce",
            "Ranch", "Blue cheese dressing", "Italian dressing", "Caesar dressing",
            "Thousand Island", "Honey mustard", "Buffalo sauce", "Hot sauce",
            "Tabasco", "Sriracha", "Frank's Red Hot", "Cholula", "Tapatio",
            "Soy sauce", "Teriyaki sauce", "Worcestershire", "A1 sauce",
            "Salsa", "Guacamole", "Pico de gallo", "Queso", "Hummus",
            "Tzatziki", "Pesto", "Marinara", "Alfredo sauce", "Hollandaise",
            "Tartar sauce", "Cocktail sauce", "Horseradish", "Wasabi",
            "Relish", "Pickles", "Olives", "Capers", "Jam", "Jelly",
            "Peanut butter", "Nutella", "Honey", "Maple syrup", "Agave"
        ]

        # ============= PROTEIN BARS & SHAKES =============
        protein_items = [
            # Protein bars
            "Quest Bar", "RXBAR", "Clif Bar", "Luna Bar", "KIND Bar",
            "Pure Protein", "One Bar", "Think Thin", "Power Bar", "Met-RX",
            "Gatorade Protein Bar", "Nature Valley Protein", "Special K Protein",
            "Fiber One", "Atkins", "Zone Perfect", "Balance Bar", "Detour",
            "Oh Yeah", "Combat Crunch", "FitJoy", "No Cow Bar", "GoMacro",
            "Epic Bar", "Larabar", "Aloha Bar", "Health Warrior", "Perfect Bar",

            # Protein shakes
            "Muscle Milk", "Premier Protein", "Ensure", "Boost", "Carnation",
            "Core Power", "Fairlife", "Orgain", "Vega", "Garden of Life",
            "Optimum Nutrition", "BSN", "Dymatize", "Isopure", "Quest Shake",
            "Atkins Shake", "SlimFast", "Glucerna", "Kate Farms", "Soylent",
            "Huel", "Super Coffee", "Protein2o", "Iconic Protein"
        ]

        # ============= MEAL REPLACEMENT & DIET =============
        diet_items = [
            "Lean Cuisine", "Healthy Choice", "Smart Ones", "Weight Watchers",
            "Marie Callender's", "Stouffer's", "Amy's", "Birds Eye", "Green Giant",
            "Cauliflower pizza", "Zucchini noodles", "Shirataki noodles",
            "Keto bread", "Low carb tortilla", "Sugar free jello", "Diet shake",
            "Meal replacement", "Protein powder", "Collagen powder", "MCT oil",
            "Bulletproof coffee", "Bone broth", "Kombucha", "Apple cider vinegar"
        ]

        # ============= ETHNIC FOODS POPULAR IN USA =============
        ethnic_items = [
            # Mexican
            "Taco", "Burrito", "Quesadilla", "Enchilada", "Tamale", "Churro",
            "Nachos", "Fajitas", "Chimichanga", "Tostada", "Pozole", "Menudo",

            # Italian
            "Pizza", "Pasta", "Lasagna", "Chicken Parmesan", "Meatball sub",
            "Calzone", "Stromboli", "Bruschetta", "Caprese", "Tiramisu",

            # Chinese
            "Orange chicken", "General Tso", "Sweet and sour", "Kung Pao",
            "Lo mein", "Chow mein", "Fried rice", "Egg roll", "Spring roll",
            "Wonton soup", "Hot and sour soup", "Dim sum", "Potsticker",

            # Japanese
            "Sushi", "Sashimi", "Ramen", "Udon", "Tempura", "Teriyaki",
            "Bento box", "Miso soup", "Edamame", "Gyoza", "Yakitori",

            # Indian
            "Chicken tikka masala", "Butter chicken", "Curry", "Naan bread",
            "Samosa", "Biryani", "Tandoori", "Palak paneer", "Dal",

            # Thai
            "Pad Thai", "Tom Yum", "Green curry", "Red curry", "Massaman",
            "Papaya salad", "Satay", "Spring rolls", "Mango sticky rice",

            # Mediterranean/Greek
            "Gyro", "Souvlaki", "Falafel", "Shawarma", "Kebab", "Hummus",
            "Baba ganoush", "Tabbouleh", "Dolma", "Baklava", "Tzatziki",

            # Korean
            "Korean BBQ", "Bulgogi", "Bibimbap", "Kimchi", "Japchae",
            "Korean fried chicken", "Tteokbokki", "Banchan"
        ]

        # Combine all categories
        all_queries = (
            restaurant_items + breakfast_items + protein_items +
            carb_items + produce_items + dairy_items + snack_items +
            beverage_items + condiment_items + protein_items +
            diet_items + ethnic_items
        )

        # Remove duplicates and return
        return list(set(all_queries))

    def fetch_batch(self, queries: List[str], start_idx: int = 0) -> List[Dict]:
        """Fetch a batch of foods from USDA"""
        foods = []

        for i, query in enumerate(queries[start_idx:start_idx+10], start=start_idx):
            print(f"[{i+1}/{len(queries)}] Searching: {query}")

            params = {
                "api_key": USDA_API_KEY,
                "query": query,
                "pageSize": 25,
                "dataType": "Branded,Foundation,Survey (FNDDS),SR Legacy"
            }

            try:
                response = requests.get(f"{self.usda_base_url}/foods/search", params=params)
                if response.status_code == 200:
                    data = response.json()
                    if "foods" in data and len(data["foods"]) > 0:
                        # Take top 3 results for each query
                        foods.extend(data["foods"][:3])
                        print(f"  [OK] Found {min(3, len(data['foods']))} items")
                    else:
                        print(f"  [SKIP] No results")
                else:
                    print(f"  [ERROR] Status {response.status_code}")

                time.sleep(0.5)  # Rate limiting

            except Exception as e:
                print(f"  [ERROR] {str(e)}")

        return foods

    def fetch_all_comprehensive(self):
        """Fetch comprehensive food data in batches"""
        print(f"Total unique queries: {len(self.search_queries)}")
        print("Starting comprehensive food data collection...")

        all_foods = []
        batch_size = 10

        for i in range(0, min(500, len(self.search_queries)), batch_size):  # Limit to 500 queries for now
            print(f"\n--- Batch {i//batch_size + 1} ---")
            batch_foods = self.fetch_batch(self.search_queries, i)
            all_foods.extend(batch_foods)

            # Save progress every 50 queries
            if (i + batch_size) % 50 == 0:
                self.save_progress(all_foods, f"foods_batch_{i+batch_size}.json")

        self.all_foods = all_foods
        return all_foods

    def save_progress(self, foods, filename):
        """Save intermediate progress"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(foods, f, indent=2, ensure_ascii=False)
        print(f"  [SAVED] Progress saved to {filename} ({len(foods)} items)")

    def save_final(self):
        """Save final comprehensive dataset"""
        # Save raw data
        with open("comprehensive_foods_raw.json", 'w', encoding='utf-8') as f:
            json.dump(self.all_foods, f, indent=2, ensure_ascii=False)

        print(f"\n[SUCCESS] Saved {len(self.all_foods)} total food items")

        # Process and save structured data
        processed = []
        for food in self.all_foods:
            try:
                item = {
                    "name": food.get("description", ""),
                    "brand": food.get("brandOwner", ""),
                    "fdc_id": str(food.get("fdcId", "")),
                    "category": food.get("foodCategory", ""),
                    "barcode": food.get("gtinUpc", ""),
                    "nutrients": {}
                }

                # Extract nutrients
                if "foodNutrients" in food:
                    for nutrient in food["foodNutrients"]:
                        name = nutrient.get("nutrientName", "")
                        value = nutrient.get("value", 0)

                        if "Energy" in name:
                            item["nutrients"]["calories"] = value
                        elif name == "Protein":
                            item["nutrients"]["protein_g"] = value
                        elif "Carbohydrate" in name and "Fiber" not in name:
                            item["nutrients"]["carbs_g"] = value
                        elif "Fat" in name and "saturated" not in name and "trans" not in name:
                            item["nutrients"]["fat_g"] = value
                        elif "Fiber" in name:
                            item["nutrients"]["fiber_g"] = value
                        elif "Sugars" in name and "added" not in name:
                            item["nutrients"]["sugar_g"] = value
                        elif name == "Sodium, Na":
                            item["nutrients"]["sodium_mg"] = value

                processed.append(item)
            except Exception as e:
                print(f"Error processing: {e}")

        with open("comprehensive_foods_processed.json", 'w', encoding='utf-8') as f:
            json.dump(processed, f, indent=2, ensure_ascii=False)

        print(f"[SUCCESS] Processed {len(processed)} food items")

        # Generate category summary
        categories = {}
        for item in processed:
            cat = item.get("category", "Unknown")
            categories[cat] = categories.get(cat, 0) + 1

        print("\n=== Food Categories Summary ===")
        for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True)[:20]:
            print(f"  {cat}: {count} items")

def main():
    fetcher = ComprehensiveFoodFetcher()
    print(f"Generated {len(fetcher.search_queries)} unique search queries")

    # Fetch comprehensive data
    fetcher.fetch_all_comprehensive()
    fetcher.save_final()

if __name__ == "__main__":
    main()