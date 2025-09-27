import requests
import json
import time
import base64
import hashlib
import hmac
import urllib.parse
from datetime import datetime
from typing import List, Dict, Any

# API Credentials
USDA_API_KEY = "9Ll2QcieCELrmwpilpYfNAgkMqecK4XqImZa9mmq"
FATSECRET_CLIENT_ID = "068a40a35f694ce1aa2024fd3c506e8c"
FATSECRET_CLIENT_SECRET = "5be104ee1a884a3fbf98a2dcc443ab3b"
NUTRITIONIX_APP_ID = "4d33bc00"
NUTRITIONIX_APP_KEY = "698a1db06ca28066c6ddb67c63297e88"

class FoodDataFetcher:
    def __init__(self):
        self.usda_base_url = "https://api.nal.usda.gov/fdc/v1"
        self.fatsecret_base_url = "https://platform.fatsecret.com/rest/server.api"
        self.nutritionix_base_url = "https://trackapi.nutritionix.com/v2"
        self.fatsecret_token = None
        self.all_foods = []

    def get_fatsecret_token(self):
        """Get OAuth 2.0 token for FatSecret API"""
        token_url = "https://oauth.fatsecret.com/connect/token"
        auth = base64.b64encode(f"{FATSECRET_CLIENT_ID}:{FATSECRET_CLIENT_SECRET}".encode()).decode()

        headers = {
            "Authorization": f"Basic {auth}",
            "Content-Type": "application/x-www-form-urlencoded"
        }

        data = {
            "grant_type": "client_credentials",
            "scope": "basic"
        }

        response = requests.post(token_url, headers=headers, data=data)
        if response.status_code == 200:
            self.fatsecret_token = response.json()["access_token"]
            print("[SUCCESS] FatSecret OAuth token obtained")
            return True
        else:
            print(f"[ERROR] Failed to get FatSecret token: {response.text}")
            return False

    def fetch_usda_foods(self, queries: List[str], data_types: List[str] = None) -> List[Dict]:
        """Fetch foods from USDA FoodData Central"""
        print("\n=== Fetching from USDA FoodData Central ===")
        foods = []

        for query in queries:
            print(f"Searching for: {query}")

            params = {
                "api_key": USDA_API_KEY,
                "query": query,
                "pageSize": 50,
                "pageNumber": 1
            }

            if data_types:
                params["dataType"] = ",".join(data_types)

            try:
                response = requests.get(f"{self.usda_base_url}/foods/search", params=params)
                if response.status_code == 200:
                    data = response.json()
                    if "foods" in data:
                        foods.extend(data["foods"])
                        print(f"  [OK] Found {len(data['foods'])} items for '{query}'")
                    time.sleep(0.5)  # Rate limiting
                else:
                    print(f"  [ERROR] Error: {response.status_code}")
            except Exception as e:
                print(f"  [ERROR] Exception: {str(e)}")

        return foods

    def fetch_fatsecret_foods(self, queries: List[str]) -> List[Dict]:
        """Fetch foods from FatSecret API"""
        if not self.fatsecret_token and not self.get_fatsecret_token():
            return []

        print("\n=== Fetching from FatSecret ===")
        foods = []

        headers = {
            "Authorization": f"Bearer {self.fatsecret_token}",
            "Content-Type": "application/json"
        }

        for query in queries:
            print(f"Searching for: {query}")

            params = {
                "method": "foods.search",
                "search_expression": query,
                "format": "json",
                "max_results": 50
            }

            try:
                response = requests.get(self.fatsecret_base_url, headers=headers, params=params)
                if response.status_code == 200:
                    data = response.json()
                    if "foods" in data and "food" in data["foods"]:
                        food_list = data["foods"]["food"]
                        if isinstance(food_list, dict):
                            food_list = [food_list]
                        foods.extend(food_list)
                        print(f"  [OK] Found {len(food_list)} items for '{query}'")
                    time.sleep(0.5)  # Rate limiting
                else:
                    print(f"  [ERROR] Error: {response.status_code}")
            except Exception as e:
                print(f"  [ERROR] Exception: {str(e)}")

        return foods

    def fetch_nutritionix_foods(self, queries: List[str]) -> List[Dict]:
        """Fetch foods from Nutritionix API"""
        print("\n=== Fetching from Nutritionix ===")
        foods = []

        headers = {
            "x-app-id": NUTRITIONIX_APP_ID,
            "x-app-key": NUTRITIONIX_APP_KEY,
            "Content-Type": "application/json"
        }

        for query in queries:
            print(f"Searching for: {query}")

            # Search for foods
            search_url = f"{self.nutritionix_base_url}/search/instant"
            params = {
                "query": query,
                "branded": True,
                "common": True,
                "detailed": True
            }

            try:
                response = requests.get(search_url, headers=headers, params=params)
                if response.status_code == 200:
                    data = response.json()

                    # Combine branded and common foods
                    all_items = []
                    if "branded" in data:
                        all_items.extend(data["branded"])
                    if "common" in data:
                        all_items.extend(data["common"])

                    foods.extend(all_items)
                    print(f"  [OK] Found {len(all_items)} items for '{query}'")
                    time.sleep(0.5)  # Rate limiting
                else:
                    print(f"  [ERROR] Error: {response.status_code}")
            except Exception as e:
                print(f"  [ERROR] Exception: {str(e)}")

        return foods

    def fetch_all_foods(self):
        """Fetch popular foods from all sources"""

        # Popular search terms covering various categories
        search_queries = [
            # Protein bars
            "Quest protein bar", "Nature Valley", "Clif Bar", "RXBAR", "KIND bar",
            "Pure Protein bar", "ONE bar", "Premier Protein", "Gatorade protein",

            # Fast food items
            "Chipotle bowl", "Chipotle burrito", "Subway sandwich", "McDonald's Big Mac",
            "Chick-fil-A sandwich", "Jimmy John's", "Panera sandwich", "Five Guys burger",
            "Wendy's Baconator", "Taco Bell burrito",

            # Common proteins
            "chicken breast", "ground beef", "salmon", "eggs", "greek yogurt",
            "whey protein", "turkey breast", "tuna", "cottage cheese", "tofu",

            # Common carbs
            "white rice", "brown rice", "oatmeal", "quinoa", "sweet potato",
            "pasta", "bread", "bagel", "cereal", "granola",

            # Fruits & vegetables
            "apple", "banana", "orange", "strawberries", "blueberries",
            "broccoli", "spinach", "carrots", "tomatoes", "avocado",

            # Snacks & beverages
            "Coca Cola", "Pepsi", "Gatorade", "Monster energy", "Red Bull",
            "Doritos", "Cheetos", "almonds", "peanut butter", "cheese",

            # Supplements
            "Muscle Milk", "Ensure", "Boost", "creatine", "BCAA",
            "multivitamin", "fish oil", "protein powder"
        ]

        # Fetch from USDA (focusing on branded and foundation foods)
        usda_foods = self.fetch_usda_foods(
            search_queries,
            data_types=["Branded", "Foundation", "Survey (FNDDS)"]
        )
        self.all_foods.extend([{"source": "usda", "data": food} for food in usda_foods])

        # Fetch from FatSecret
        fatsecret_foods = self.fetch_fatsecret_foods(search_queries[:20])  # Limit due to rate limits
        self.all_foods.extend([{"source": "fatsecret", "data": food} for food in fatsecret_foods])

        # Fetch from Nutritionix
        nutritionix_foods = self.fetch_nutritionix_foods(search_queries[:20])  # Limit due to rate limits
        self.all_foods.extend([{"source": "nutritionix", "data": food} for food in nutritionix_foods])

        print(f"\n=== Total foods collected: {len(self.all_foods)} ===")

    def save_to_file(self, filename: str = "food_data_raw.json"):
        """Save collected food data to JSON file"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.all_foods, f, indent=2, ensure_ascii=False)
        print(f"[SUCCESS] Data saved to {filename}")

def main():
    fetcher = FoodDataFetcher()
    fetcher.fetch_all_foods()
    fetcher.save_to_file("food_data_raw.json")

    # Also save individual source files for easier processing
    usda_foods = [f["data"] for f in fetcher.all_foods if f["source"] == "usda"]
    fatsecret_foods = [f["data"] for f in fetcher.all_foods if f["source"] == "fatsecret"]
    nutritionix_foods = [f["data"] for f in fetcher.all_foods if f["source"] == "nutritionix"]

    with open("usda_foods.json", 'w', encoding='utf-8') as f:
        json.dump(usda_foods, f, indent=2, ensure_ascii=False)

    with open("fatsecret_foods.json", 'w', encoding='utf-8') as f:
        json.dump(fatsecret_foods, f, indent=2, ensure_ascii=False)

    with open("nutritionix_foods.json", 'w', encoding='utf-8') as f:
        json.dump(nutritionix_foods, f, indent=2, ensure_ascii=False)

    print("\n[SUCCESS] Individual source files saved")
    print(f"  - USDA: {len(usda_foods)} foods")
    print(f"  - FatSecret: {len(fatsecret_foods)} foods")
    print(f"  - Nutritionix: {len(nutritionix_foods)} foods")

if __name__ == "__main__":
    main()