import { Food } from '@/types/nutrition-v2';
import OpenAI from 'openai';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ParsedFoodItem {
  name: string;
  brand?: string;
  quantity: number;
  unit: string;
  foodId?: string;
  nutrition: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g?: number;
  };
  confidence: 'high' | 'medium' | 'low';
  source: 'database' | 'perplexity' | 'estimate';
  needsConfirmation: boolean;
  fallbackNutrition?: boolean; // Flag for when we had to use estimates
}

export interface IntelligentParsedMeal {
  meal_name: string;
  category: string;
  logged_at: string;
  foods: ParsedFoodItem[];
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  confidence: 'high' | 'medium' | 'low';
  warnings: string[];
  requiresUserConfirmation: boolean;
}

export class IntelligentMealParser {
  private openai: OpenAI;
  private perplexity: OpenAI;
  private supabase: SupabaseClient;

  constructor(openRouterKey: string, supabase: SupabaseClient) {
    this.supabase = supabase;
    // Standard OpenAI-compatible endpoint
    this.openai = new OpenAI({
      apiKey: openRouterKey,
      baseURL: 'https://openrouter.ai/api/v1',
      dangerouslyAllowBrowser: true,
      defaultHeaders: {
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
        'X-Title': 'Wagner Coach Meal Parser'
      }
    });

    // Perplexity for web searches
    this.perplexity = new OpenAI({
      apiKey: openRouterKey,
      baseURL: 'https://openrouter.ai/api/v1',
      dangerouslyAllowBrowser: true,
      defaultHeaders: {
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
        'X-Title': 'Wagner Coach Nutrition Search'
      }
    });
  }

  async parse(description: string, userId?: string): Promise<IntelligentParsedMeal> {
    console.log('🧠 Intelligent parsing:', description);

    // Step 1: Extract structured food items using LLM
    const extracted = await this.extractFoodItems(description);
    console.log('📋 Extracted items:', extracted);

    // Step 2: Match each food against database, use Perplexity if needed
    const parsedFoods: ParsedFoodItem[] = [];
    const warnings: string[] = [];

    for (const item of extracted.foods) {
      const parsed = await this.parseFood(item, warnings, userId);
      parsedFoods.push(parsed);
    }

    // Step 3: Calculate totals
    const totals = this.calculateTotals(parsedFoods);

    // Step 4: Determine confidence
    const overallConfidence = this.calculateOverallConfidence(parsedFoods);
    const requiresConfirmation = parsedFoods.some(f => f.needsConfirmation) || overallConfidence === 'low';

    return {
      meal_name: extracted.meal_name,
      category: extracted.category,
      logged_at: extracted.logged_at,
      foods: parsedFoods,
      total_calories: totals.calories,
      total_protein_g: totals.protein,
      total_carbs_g: totals.carbs,
      total_fat_g: totals.fat,
      confidence: overallConfidence,
      warnings,
      requiresUserConfirmation: requiresConfirmation
    };
  }

  private async extractFoodItems(description: string): Promise<any> {
    const prompt = `Extract food items from this meal description. Return JSON only:

{
  "meal_name": "descriptive name",
  "category": "breakfast|lunch|dinner|snack|pre_workout|post_workout|other",
  "logged_at": "${new Date().toISOString()}",
  "foods": [
    {
      "name": "food name",
      "brand": "brand/restaurant if mentioned",
      "quantity": number,
      "unit": "g|ml|oz|cup|piece|serving|bowl",
      "modifiers": ["extra", "double", "no cheese"] // optional
    }
  ]
}

Examples:
- "subway outlaw" → {"name": "outlaw", "brand": "subway", "quantity": 1, "unit": "serving"}
- "2 cups rice" → {"name": "rice", "quantity": 2, "unit": "cup"}
- "handful almonds" → {"name": "almonds", "quantity": 30, "unit": "g"}`;

    const completion = await this.openai.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: description }
      ],
      temperature: 0.3,
      max_tokens: 800,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error('No response from extraction');

    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse extraction:', response);
      throw new Error('Failed to extract food items');
    }
  }

  private async parseFood(
    item: any,
    warnings: string[],
    userId?: string
  ): Promise<ParsedFoodItem> {
    console.log('🔍 Parsing food:', item);

    // Step 1: Search existing database
    const dbMatch = await this.searchDatabase(item);

    if (dbMatch.found) {
      console.log('✅ Found in database:', dbMatch.food.name);
      return this.createParsedFood(item, dbMatch.food, 'database', 'high', false);
    }

    console.log('❌ Not found in database, trying Perplexity...');

    // Step 2: Search with Perplexity
    try {
      const perplexityResult = await this.searchWithPerplexity(item);

      if (perplexityResult) {
        console.log('🌐 Perplexity found:', perplexityResult);

        // Step 3: Try to add to database for future use
        const newFood = await this.addToDatabase(perplexityResult, userId);

        if (newFood) {
          warnings.push(`Found "${item.name}" via web search and added to your database`);
          return this.createParsedFood(item, newFood, 'perplexity', 'medium', true);
        } else {
          // Database insert failed, but we still have nutrition data
          warnings.push(`Found "${item.name}" via web search - could not save to database`);
          return this.createFallbackFood(item, perplexityResult, 'perplexity', true);
        }
      }
    } catch (error) {
      console.error('Perplexity search failed:', error);
      warnings.push(`Could not find nutrition data for "${item.name}"`);
    }

    // Step 3: Fallback to rough estimates
    console.log('💭 Using estimates for:', item.name);
    warnings.push(`Using rough estimates for "${item.name}" - accuracy not guaranteed`);

    const estimated = this.createEstimate(item);
    return this.createFallbackFood(item, estimated, 'estimate', true);
  }

  private async searchDatabase(item: any): Promise<{found: boolean, food?: Food}> {
    const searchTerms = [
      item.brand ? `${item.brand} ${item.name}` : item.name,
      item.name,
      item.brand
    ].filter(Boolean);

    for (const term of searchTerms) {
      const { data: matches } = await this.supabase
        .from('foods')
        .select('*')
        .or(`name.ilike.%${term}%,brand.ilike.%${term}%`)
        .limit(5);

      if (matches && matches.length > 0) {
        // Score matches and return best one
        const scored = matches.map(food => ({
          food,
          score: this.calculateSimilarity(term.toLowerCase(), `${food.brand || ''} ${food.name}`.toLowerCase())
        }));

        scored.sort((a, b) => b.score - a.score);

        if (scored[0].score > 0.6) {
          return { found: true, food: scored[0].food };
        }
      }
    }

    return { found: false };
  }

  private async searchWithPerplexity(item: any): Promise<any> {
    const searchQuery = item.brand
      ? `${item.brand} ${item.name} nutrition facts calories protein carbs fat fiber`
      : `${item.name} nutrition facts calories protein carbs fat per serving`;

    console.log('🔍 Perplexity search:', searchQuery);

    const completion = await this.perplexity.chat.completions.create({
      model: 'perplexity/llama-3.1-sonar-large-128k-online',
      messages: [
        {
          role: 'system',
          content: `You are a nutrition researcher. Search for accurate nutrition information and return ONLY a JSON object with this exact format:
{
  "name": "food name",
  "brand": "brand name or null",
  "serving_size": number,
  "serving_unit": "g|ml|oz|piece",
  "calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fat_g": number,
  "fiber_g": number,
  "source": "website or database used"
}

If you cannot find reliable nutrition data, return null.
Only return the JSON, no other text.`
        },
        {
          role: 'user',
          content: `Find nutrition information for: ${searchQuery}`
        }
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response || response.trim() === 'null') {
      return null;
    }

    try {
      const parsed = JSON.parse(response);
      console.log('📊 Perplexity result:', parsed);
      return parsed;
    } catch (error) {
      console.error('Failed to parse Perplexity response:', response);
      return null;
    }
  }

  private async addToDatabase(nutritionData: any, userId?: string): Promise<Food | null> {
    console.log('💾 Attempting to add to database:', nutritionData.name);

    try {
      const foodData = {
        name: nutritionData.name,
        brand: nutritionData.brand || null,
        serving_size: nutritionData.serving_size || 100,
        serving_unit: nutritionData.serving_unit || 'g',
        calories: nutritionData.calories || null,
        protein_g: nutritionData.protein_g || null,
        carbs_g: nutritionData.carbs_g || null,
        fat_g: nutritionData.fat_g || null,
        fiber_g: nutritionData.fiber_g || null,
        created_by: userId || null,
        is_verified: false, // User-added via AI search
        is_public: false,   // Only visible to this user initially
        description: `Added via AI search. Source: ${nutritionData.source || 'web search'}`
      };

      const { data: newFood, error } = await this.supabase
        .from('foods')
        .insert(foodData)
        .select()
        .single();

      if (error) {
        console.error('⚠️ Failed to add food to database (this is OK):', error.message);
        console.log('Will use fallback nutrition instead');
        return null;
      }

      console.log('✅ Successfully added to database:', newFood.id);
      return newFood;
    } catch (error) {
      console.error('⚠️ Database insert error (falling back to estimates):', error);
      return null;
    }
  }

  private createParsedFood(
    item: any,
    food: Food,
    source: 'database' | 'perplexity',
    confidence: 'high' | 'medium',
    needsConfirmation: boolean
  ): ParsedFoodItem {
    // Calculate nutrition based on quantity
    const multiplier = this.calculateMultiplier(
      item.quantity,
      item.unit,
      food.serving_size,
      food.serving_unit
    );

    return {
      name: food.name,
      brand: food.brand || undefined,
      quantity: item.quantity,
      unit: item.unit,
      foodId: food.id,
      nutrition: {
        calories: Math.round((food.calories || 0) * multiplier),
        protein_g: Math.round((food.protein_g || 0) * multiplier * 10) / 10,
        carbs_g: Math.round((food.carbs_g || 0) * multiplier * 10) / 10,
        fat_g: Math.round((food.fat_g || 0) * multiplier * 10) / 10,
        fiber_g: Math.round((food.fiber_g || 0) * multiplier * 10) / 10
      },
      confidence,
      source,
      needsConfirmation
    };
  }

  private createFallbackFood(
    item: any,
    nutritionData: any,
    source: 'perplexity' | 'estimate',
    needsConfirmation: boolean
  ): ParsedFoodItem {
    // Create parsed food without database ID (fallback nutrition)
    const multiplier = this.calculateMultiplier(
      item.quantity,
      item.unit,
      nutritionData.serving_size || 100,
      nutritionData.serving_unit || 'g'
    );

    return {
      name: nutritionData.name || item.name,
      brand: nutritionData.brand || item.brand,
      quantity: item.quantity,
      unit: item.unit,
      foodId: undefined, // No database ID
      nutrition: {
        calories: Math.round((nutritionData.calories || 0) * multiplier),
        protein_g: Math.round((nutritionData.protein_g || 0) * multiplier * 10) / 10,
        carbs_g: Math.round((nutritionData.carbs_g || 0) * multiplier * 10) / 10,
        fat_g: Math.round((nutritionData.fat_g || 0) * multiplier * 10) / 10,
        fiber_g: Math.round((nutritionData.fiber_g || 0) * multiplier * 10) / 10
      },
      confidence: source === 'perplexity' ? 'medium' : 'low',
      source,
      needsConfirmation,
      fallbackNutrition: true
    };
  }

  private createEstimate(item: any): any {
    // Very rough estimates based on food type
    const name = item.name.toLowerCase();

    let calories = 200;
    let protein = 10;
    let carbs = 20;
    let fat = 10;

    if (name.includes('protein') || name.includes('chicken') || name.includes('beef')) {
      calories = 300;
      protein = 25;
      carbs = 5;
      fat = 15;
    } else if (name.includes('salad') || name.includes('vegetable')) {
      calories = 100;
      protein = 5;
      carbs = 15;
      fat = 2;
    } else if (name.includes('bowl') || name.includes('burrito')) {
      calories = 600;
      protein = 25;
      carbs = 70;
      fat = 20;
    }

    return {
      calories,
      protein_g: protein,
      carbs_g: carbs,
      fat_g: fat,
      serving_size: 100,
      serving_unit: 'g',
      name: item.name,
      brand: item.brand
    };
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1.0;
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;

    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);
    const commonWords = words1.filter(w => words2.includes(w));

    return commonWords.length / Math.max(words1.length, words2.length);
  }

  private calculateMultiplier(quantity: number, unit: string, servingSize: number, servingUnit: string): number {
    // Convert everything to grams for calculation
    const unitToGrams: Record<string, number> = {
      'g': 1,
      'kg': 1000,
      'oz': 28.35,
      'ml': 1, // Approximate for liquids
      'cup': 240,
      'tbsp': 15,
      'tsp': 5,
      'piece': servingSize,
      'serving': servingSize,
      'bowl': servingSize * 1.5 // Assume bowls are 1.5x serving
    };

    const quantityInGrams = quantity * (unitToGrams[unit] || servingSize);
    const servingInGrams = servingSize * (unitToGrams[servingUnit] || 1);

    return quantityInGrams / servingInGrams;
  }

  private calculateTotals(foods: ParsedFoodItem[]) {
    return foods.reduce((acc, food) => ({
      calories: acc.calories + food.nutrition.calories,
      protein: acc.protein + food.nutrition.protein_g,
      carbs: acc.carbs + food.nutrition.carbs_g,
      fat: acc.fat + food.nutrition.fat_g
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }

  private calculateOverallConfidence(foods: ParsedFoodItem[]): 'high' | 'medium' | 'low' {
    if (foods.length === 0) return 'low';

    const confidenceScores = foods.map(f =>
      f.confidence === 'high' ? 3 : f.confidence === 'medium' ? 2 : 1
    );

    const avgScore = confidenceScores.reduce((a, b) => a + b) / confidenceScores.length;

    if (avgScore >= 2.5) return 'high';
    if (avgScore >= 1.5) return 'medium';
    return 'low';
  }
}