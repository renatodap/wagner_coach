import { createClient } from '@/lib/supabase/client';
import { Food } from '@/types/nutrition-v2';
import OpenAI from 'openai';

export interface ParsedFood {
  name: string;
  brand?: string;
  quantity: number;
  unit: string;
  matchedFoodId?: string;
  confidence: number;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
}

export interface EnhancedParsedMeal {
  meal_name: string;
  meal_category: string;
  logged_at: string;
  foods: ParsedFood[];
  total_calories?: number;
  total_protein_g?: number;
  total_carbs_g?: number;
  total_fat_g?: number;
  confidence: 'high' | 'medium' | 'low';
  warnings: string[];
  requires_confirmation: boolean;
}

export class EnhancedMealParser {
  private openai: OpenAI | null = null;
  private supabase = createClient();
  private foodCache = new Map<string, Food[]>();

  constructor(apiKey?: string, useOpenRouter: boolean = false) {
    if (apiKey) {
      if (useOpenRouter) {
        this.openai = new OpenAI({
          apiKey,
          baseURL: 'https://openrouter.ai/api/v1',
          dangerouslyAllowBrowser: true,
          defaultHeaders: {
            'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
            'X-Title': 'Wagner Coach Enhanced Meal Parser'
          }
        });
      } else {
        this.openai = new OpenAI({
          apiKey,
          dangerouslyAllowBrowser: true
        });
      }
    }
  }

  async parse(description: string, userId?: string): Promise<EnhancedParsedMeal> {
    const warnings: string[] = [];

    // Step 1: Extract structured data from natural language
    const extracted = await this.extractStructuredData(description);

    // Step 2: Match foods against database
    const matchedFoods: ParsedFood[] = [];
    for (const food of extracted.foods) {
      const matched = await this.matchFoodInDatabase(food, warnings);
      matchedFoods.push(matched);
    }

    // Step 3: Handle restaurant/brand specific items
    const finalFoods = await this.handleRestaurantItems(matchedFoods, extracted.restaurant);

    // Step 4: Check user history for patterns (if userId provided)
    if (userId) {
      await this.enrichWithUserHistory(finalFoods, userId, description);
    }

    // Step 5: Calculate totals
    const totals = this.calculateTotals(finalFoods);

    // Step 6: Determine confidence and if confirmation needed
    const confidence = this.calculateConfidence(finalFoods, warnings);
    const requiresConfirmation = confidence !== 'high' || warnings.length > 0;

    return {
      meal_name: extracted.meal_name,
      meal_category: extracted.meal_category,
      logged_at: extracted.logged_at,
      foods: finalFoods,
      total_calories: totals.calories,
      total_protein_g: totals.protein,
      total_carbs_g: totals.carbs,
      total_fat_g: totals.fat,
      confidence,
      warnings,
      requires_confirmation: requiresConfirmation
    };
  }

  private async extractStructuredData(description: string): Promise<any> {
    if (!this.openai) {
      return this.extractWithRegex(description);
    }

    const systemPrompt = `Extract structured meal data from natural language. Return JSON with:
{
  "meal_name": "string",
  "meal_category": "breakfast|lunch|dinner|snack|pre_workout|post_workout|other",
  "logged_at": "ISO timestamp",
  "restaurant": "restaurant/brand name or null",
  "foods": [
    {
      "name": "food item name",
      "brand": "specific brand if mentioned",
      "quantity": number,
      "unit": "g|ml|oz|cup|piece|bowl|serving",
      "modifiers": ["extra", "no cheese", "double protein"] // customizations
    }
  ]
}

Key rules:
- For restaurant items, extract the restaurant name
- Break compound items into components when possible
- Include all modifiers (double, extra, no, light, etc.)
- Use standard units, convert colloquial terms (handful = 30g, pinch = 1g)
- For ambiguous quantities, use typical serving sizes`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: description }
        ],
        temperature: 0.3,
        max_tokens: 600,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) throw new Error('No AI response');

      return JSON.parse(response);
    } catch (error) {
      console.error('AI extraction failed:', error);
      return this.extractWithRegex(description);
    }
  }

  private extractWithRegex(description: string): any {
    // Fallback regex-based extraction
    const lower = description.toLowerCase();
    const foods: any[] = [];

    // Restaurant detection
    const restaurantPatterns = [
      /at\s+(\w+(?:\s+\w+)?)/i,
      /from\s+(\w+(?:\s+\w+)?)/i,
      /(\w+(?:\s+\w+)?)\s+(?:bowl|burger|sandwich|salad)/i
    ];

    let restaurant = null;
    for (const pattern of restaurantPatterns) {
      const match = lower.match(pattern);
      if (match) {
        restaurant = match[1];
        break;
      }
    }

    // Basic food extraction (simplified)
    const foodPattern = /(\d*\.?\d*)\s*(cups?|bowls?|pieces?|g|ml|oz)?\s*(?:of\s+)?([a-z\s]+?)(?:,|and|with|$)/gi;
    let match;
    while ((match = foodPattern.exec(lower)) !== null) {
      const quantity = parseFloat(match[1]) || 1;
      const unit = match[2] || 'serving';
      const name = match[3].trim();

      if (name.length > 2) {
        foods.push({ name, quantity, unit, modifiers: [] });
      }
    }

    // Time and category detection
    const hour = new Date().getHours();
    let category = 'other';
    if (lower.includes('breakfast') || (hour >= 5 && hour < 11)) category = 'breakfast';
    else if (lower.includes('lunch') || (hour >= 11 && hour < 15)) category = 'lunch';
    else if (lower.includes('dinner') || (hour >= 17 && hour < 21)) category = 'dinner';
    else if (lower.includes('snack')) category = 'snack';

    return {
      meal_name: description.substring(0, 50),
      meal_category: category,
      logged_at: new Date().toISOString(),
      restaurant,
      foods
    };
  }

  private async matchFoodInDatabase(
    food: any,
    warnings: string[]
  ): Promise<ParsedFood> {
    // Search in database for matching foods
    const searchTerm = food.brand ? `${food.brand} ${food.name}` : food.name;

    const { data: matches, error } = await this.supabase
      .from('foods')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`)
      .limit(5);

    if (error) {
      console.error('Database search error:', error);
      warnings.push(`Could not search for "${food.name}" in database`);
      return {
        ...food,
        confidence: 0.2
      };
    }

    if (!matches || matches.length === 0) {
      warnings.push(`No match found for "${food.name}" - using estimates`);
      return {
        ...food,
        confidence: 0.3,
        // Use rough estimates
        calories: 200,
        protein_g: 10,
        carbs_g: 20,
        fat_g: 10
      };
    }

    // Score matches based on similarity
    const scored = matches.map(match => ({
      ...match,
      score: this.calculateSimilarity(searchTerm, `${match.brand || ''} ${match.name}`)
    }));

    scored.sort((a, b) => b.score - a.score);
    const bestMatch = scored[0];

    if (bestMatch.score < 0.5) {
      warnings.push(`Low confidence match for "${food.name}"`);
    }

    // Calculate nutrition based on quantity
    const multiplier = this.calculateMultiplier(
      food.quantity,
      food.unit,
      bestMatch.serving_size,
      bestMatch.serving_unit
    );

    return {
      name: bestMatch.name,
      brand: bestMatch.brand,
      quantity: food.quantity,
      unit: food.unit,
      matchedFoodId: bestMatch.id,
      confidence: bestMatch.score,
      calories: (bestMatch.calories || 0) * multiplier,
      protein_g: (bestMatch.protein_g || 0) * multiplier,
      carbs_g: (bestMatch.carbs_g || 0) * multiplier,
      fat_g: (bestMatch.fat_g || 0) * multiplier
    };
  }

  private async handleRestaurantItems(
    foods: ParsedFood[],
    restaurant: string | null
  ): Promise<ParsedFood[]> {
    if (!restaurant) return foods;

    // Check if we have restaurant-specific items in database
    const { data: restaurantFoods } = await this.supabase
      .from('foods')
      .select('*')
      .ilike('brand', `%${restaurant}%`)
      .limit(20);

    if (restaurantFoods && restaurantFoods.length > 0) {
      // Re-match foods with restaurant-specific items
      return foods.map(food => {
        const restaurantMatch = restaurantFoods.find(rf =>
          rf.name.toLowerCase().includes(food.name.toLowerCase())
        );

        if (restaurantMatch) {
          return {
            ...food,
            matchedFoodId: restaurantMatch.id,
            brand: restaurantMatch.brand,
            calories: restaurantMatch.calories,
            protein_g: restaurantMatch.protein_g,
            carbs_g: restaurantMatch.carbs_g,
            fat_g: restaurantMatch.fat_g,
            confidence: 0.9
          };
        }

        return food;
      });
    }

    return foods;
  }

  private async enrichWithUserHistory(
    foods: ParsedFood[],
    userId: string,
    description: string
  ): Promise<void> {
    // Check for patterns like "the usual" or "same as yesterday"
    const lower = description.toLowerCase();

    if (lower.includes('usual') || lower.includes('regular')) {
      // Find frequently logged meals
      const { data: frequentMeals } = await this.supabase
        .from('meal_logs')
        .select('*, foods:meal_log_foods(*, food:foods(*))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      // Analyze patterns and suggest matches
      // This would need more sophisticated pattern matching
    }

    if (lower.includes('same as yesterday')) {
      // Get yesterday's meals
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: yesterdayMeals } = await this.supabase
        .from('meal_logs')
        .select('*, foods:meal_log_foods(*, food:foods(*))')
        .eq('user_id', userId)
        .gte('logged_at', yesterday.toISOString().split('T')[0])
        .lt('logged_at', new Date().toISOString().split('T')[0]);

      // Match and suggest
    }
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple similarity calculation - could use Levenshtein distance
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1;
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;

    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);
    const commonWords = words1.filter(w => words2.includes(w));

    return commonWords.length / Math.max(words1.length, words2.length);
  }

  private calculateMultiplier(
    quantity: number,
    unit: string,
    servingSize: number,
    servingUnit: string
  ): number {
    // Unit conversion logic
    const conversions: Record<string, number> = {
      'g': 1,
      'oz': 28.35,
      'ml': 1,
      'cup': 240,
      'tbsp': 15,
      'tsp': 5,
      'piece': servingSize,
      'serving': servingSize,
      'bowl': servingSize * 1.5 // Assume bowl is 1.5x serving
    };

    const quantityInGrams = quantity * (conversions[unit] || servingSize);
    const servingInGrams = servingSize * (conversions[servingUnit] || 1);

    return quantityInGrams / servingInGrams;
  }

  private calculateTotals(foods: ParsedFood[]) {
    return foods.reduce((acc, food) => ({
      calories: acc.calories + (food.calories || 0),
      protein: acc.protein + (food.protein_g || 0),
      carbs: acc.carbs + (food.carbs_g || 0),
      fat: acc.fat + (food.fat_g || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }

  private calculateConfidence(foods: ParsedFood[], warnings: string[]): 'high' | 'medium' | 'low' {
    if (warnings.length > 2) return 'low';

    const avgConfidence = foods.reduce((sum, f) => sum + f.confidence, 0) / foods.length;

    if (avgConfidence > 0.8 && warnings.length === 0) return 'high';
    if (avgConfidence > 0.5) return 'medium';
    return 'low';
  }
}