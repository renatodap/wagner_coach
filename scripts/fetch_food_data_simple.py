import requests
import json
import time

# API Credentials
USDA_API_KEY = "9Ll2QcieCELrmwpilpYfNAgkMqecK4XqImZa9mmq"

def fetch_usda_foods():
    """Fetch popular foods from USDA FoodData Central"""
    print("=== Fetching from USDA FoodData Central ===")

    # Focus on very specific popular items
    search_queries = [
        "Quest protein bar chocolate chip",
        "Nature Valley granola bar",
        "Chipotle chicken bowl",
        "McDonald's Big Mac",
        "Subway turkey sandwich",
        "chicken breast raw",
        "banana",
        "brown rice cooked",
        "greek yogurt plain",
        "almonds"
    ]

    all_foods = []
    base_url = "https://api.nal.usda.gov/fdc/v1/foods/search"

    for query in search_queries:
        print(f"Searching for: {query}")

        params = {
            "api_key": USDA_API_KEY,
            "query": query,
            "pageSize": 10,
            "dataType": "Branded,Foundation,Survey (FNDDS)"
        }

        try:
            response = requests.get(base_url, params=params)
            if response.status_code == 200:
                data = response.json()
                if "foods" in data and len(data["foods"]) > 0:
                    all_foods.extend(data["foods"])
                    print(f"  [OK] Found {len(data['foods'])} items")
                time.sleep(1)  # Rate limiting
            else:
                print(f"  [ERROR] Status code: {response.status_code}")
        except Exception as e:
            print(f"  [ERROR] {str(e)}")

    return all_foods

def main():
    # Fetch USDA foods
    foods = fetch_usda_foods()

    # Save raw data
    with open("usda_sample_foods.json", 'w', encoding='utf-8') as f:
        json.dump(foods, f, indent=2, ensure_ascii=False)

    print(f"\n[SUCCESS] Saved {len(foods)} foods to usda_sample_foods.json")

    # Process and create simplified structure
    processed_foods = []
    for food in foods[:50]:  # Process first 50 items
        try:
            processed = {
                "name": food.get("description", ""),
                "brand": food.get("brandOwner", ""),
                "fdc_id": str(food.get("fdcId", "")),
                "barcode": food.get("gtinUpc", ""),
                "serving_size": 100,  # Default 100g
                "serving_unit": "g",
            }

            # Extract nutrients
            if "foodNutrients" in food:
                for nutrient in food["foodNutrients"]:
                    name = nutrient.get("nutrientName", "").lower()
                    value = nutrient.get("value", 0)

                    if "energy" in name or "calorie" in name:
                        processed["calories"] = value
                    elif "protein" in name:
                        processed["protein_g"] = value
                    elif "carbohydrate" in name and "fiber" not in name:
                        processed["carbs_g"] = value
                    elif "fat" in name and "saturated" not in name:
                        processed["fat_g"] = value
                    elif "fiber" in name:
                        processed["fiber_g"] = value
                    elif "sugar" in name and "added" not in name:
                        processed["sugar_g"] = value
                    elif "sodium" in name:
                        processed["sodium_mg"] = value

            processed_foods.append(processed)
        except Exception as e:
            print(f"Error processing food: {e}")

    # Save processed data
    with open("processed_foods.json", 'w', encoding='utf-8') as f:
        json.dump(processed_foods, f, indent=2, ensure_ascii=False)

    print(f"[SUCCESS] Processed {len(processed_foods)} foods")

    return processed_foods

if __name__ == "__main__":
    main()