import { Food } from '@/types/nutrition-v2';
import OpenAI from 'openai';
import type { SupabaseClient } from '@supabase/supabase-js';

// Sanity check limits for nutrition data
const NUTRITION_LIMITS = {
  calories: { min: 0, max: 2000, unit: 'per serving' },
  protein_g: { min: 0, max: 100, unit: 'grams' },
  carbs_g: { min: 0, max: 200, unit: 'grams' },
  fat_g: { min: 0, max: 100, unit: 'grams' },
  fiber_g: { min: 0, max: 50, unit: 'grams' },
  serving_size: { min: 1, max: 2000, unit: 'grams or ml' }
};

// Rate limiting configuration
const RATE_LIMITS = {
  perUserPerDay: 10,        // Max 10 searches per user per day
  perUserPerMonth: 100,     // Max 100 searches per user per month
  globalPerDay: 500,        // Max 500 searches across all users per day
  costLimitPerMonth: 50     // Stop at $50/month in API costs
};

export interface PerplexitySearchResult {
  found: boolean;
  foodData?: {
    name: string;
    brand?: string;
    serving_size: number;
    serving_unit: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g?: number;
    source_url?: string;
    confidence: 'high' | 'medium' | 'low';
  };
  requiresValidation: boolean;
  sanityChecksPassed: boolean;
  warnings: string[];
  searchCost: number;
}

export class SafePerplexityParser {
  private perplexity: OpenAI;
  private supabase: SupabaseClient;
  private userId: string;

  constructor(openRouterKey: string, supabase: SupabaseClient, userId: string) {
    this.supabase = supabase;
    this.userId = userId;

    this.perplexity = new OpenAI({
      apiKey: openRouterKey,
      baseURL: 'https://openrouter.ai/api/v1',
      dangerouslyAllowBrowser: false, // Server-side only
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://wagner-coach.vercel.app',
        'X-Title': 'Wagner Coach Nutrition Search'
      }
    });
  }

  async searchForFood(
    foodName: string,
    brand?: string
  ): Promise<PerplexitySearchResult> {
    const warnings: string[] = [];

    // Step 1: Check rate limits
    const canSearch = await this.checkRateLimits();
    if (!canSearch.allowed) {
      return {
        found: false,
        requiresValidation: false,
        sanityChecksPassed: false,
        warnings: [canSearch.reason || 'Rate limit exceeded'],
        searchCost: 0
      };
    }

    // Step 2: Check if already searched recently (cache)
    const cached = await this.checkRecentSearches(foodName, brand);
    if (cached) {
      return {
        found: true,
        foodData: cached,
        requiresValidation: false,
        sanityChecksPassed: true,
        warnings: ['Using cached search result from recent query'],
        searchCost: 0
      };
    }

    // Step 3: Perform Perplexity search
    try {
      const searchQuery = brand
        ? `${brand} ${foodName} nutrition facts calories protein carbs fat per serving official website`
        : `${foodName} nutrition facts calories protein carbs fat fiber per serving USDA`;

      console.log('🔍 SafePerplexity search:', searchQuery);

      const completion = await this.perplexity.chat.completions.create({
        model: 'perplexity/sonar-medium-online', // Correct model name
        messages: [
          {
            role: 'system',
            content: `You are a nutrition data researcher. Search for ACCURATE nutrition information from OFFICIAL sources only.

IMPORTANT: Only use data from:
- Official brand websites
- USDA database
- FDA labels
- Verified nutrition databases

Return ONLY a JSON object with this format:
{
  "found": true/false,
  "name": "exact product name",
  "brand": "brand name or null",
  "serving_size": number,
  "serving_unit": "g|ml|oz|piece",
  "calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fat_g": number,
  "fiber_g": number or null,
  "source_url": "URL where data was found",
  "confidence": "high|medium|low"
}

If you cannot find reliable nutrition data from official sources, return:
{
  "found": false,
  "confidence": "low"
}`
          },
          {
            role: 'user',
            content: `Find official nutrition information for: ${searchQuery}`
          }
        ],
        temperature: 0.1, // Low temperature for factual accuracy
        max_tokens: 500,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from Perplexity');
      }

      // Step 4: Parse and validate response
      const parsed = JSON.parse(response);

      if (!parsed.found) {
        await this.recordSearch(foodName, brand, false, 0.01);
        return {
          found: false,
          requiresValidation: false,
          sanityChecksPassed: false,
          warnings: ['No reliable nutrition data found'],
          searchCost: 0.01
        };
      }

      // Step 5: Run sanity checks
      const sanityResult = this.runSanityChecks(parsed, warnings);

      if (!sanityResult.passed) {
        warnings.push('Failed sanity checks - data seems unrealistic');
        await this.recordSearch(foodName, brand, false, 0.01);
        return {
          found: false,
          requiresValidation: false,
          sanityChecksPassed: false,
          warnings,
          searchCost: 0.01
        };
      }

      // Step 6: Record successful search
      await this.recordSearch(foodName, brand, true, 0.01);
      await this.cacheSearchResult(foodName, brand, parsed);

      return {
        found: true,
        foodData: {
          name: parsed.name,
          brand: parsed.brand,
          serving_size: parsed.serving_size,
          serving_unit: parsed.serving_unit,
          calories: Math.round(parsed.calories),
          protein_g: Math.round(parsed.protein_g * 10) / 10,
          carbs_g: Math.round(parsed.carbs_g * 10) / 10,
          fat_g: Math.round(parsed.fat_g * 10) / 10,
          fiber_g: parsed.fiber_g ? Math.round(parsed.fiber_g * 10) / 10 : undefined,
          source_url: parsed.source_url,
          confidence: parsed.confidence
        },
        requiresValidation: true, // Always require user validation
        sanityChecksPassed: true,
        warnings: warnings.length > 0 ? warnings : ['Please verify this nutrition data'],
        searchCost: 0.01
      };

    } catch (error) {
      console.error('Perplexity search error:', error);
      await this.recordSearch(foodName, brand, false, 0.01);
      return {
        found: false,
        requiresValidation: false,
        sanityChecksPassed: false,
        warnings: ['Search failed: ' + (error instanceof Error ? error.message : 'Unknown error')],
        searchCost: 0.01
      };
    }
  }

  private runSanityChecks(data: any, warnings: string[]): { passed: boolean } {
    let passed = true;

    // Check each nutrition value against limits
    for (const [field, limits] of Object.entries(NUTRITION_LIMITS)) {
      const value = data[field];
      if (value !== undefined && value !== null) {
        if (value < limits.min || value > limits.max) {
          warnings.push(`${field} value (${value}) seems unrealistic (expected ${limits.min}-${limits.max} ${limits.unit})`);
          passed = false;
        }
      }
    }

    // Additional logic checks
    const totalMacros = (data.protein_g || 0) * 4 +
                       (data.carbs_g || 0) * 4 +
                       (data.fat_g || 0) * 9;

    const calorieDeviation = Math.abs(totalMacros - data.calories);

    // Allow 20% deviation in calorie calculation
    if (calorieDeviation > data.calories * 0.2) {
      warnings.push(`Calories (${data.calories}) don't match macros calculation (${Math.round(totalMacros)})`);
      passed = false;
    }

    // Check if fiber exceeds carbs
    if (data.fiber_g && data.carbs_g && data.fiber_g > data.carbs_g) {
      warnings.push('Fiber cannot exceed total carbohydrates');
      passed = false;
    }

    return { passed };
  }

  private async checkRateLimits(): Promise<{ allowed: boolean; reason?: string }> {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Check user daily limit
    const { count: userDailyCount } = await this.supabase
      .from('perplexity_searches')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', this.userId)
      .gte('created_at', todayStart.toISOString());

    if (userDailyCount && userDailyCount >= RATE_LIMITS.perUserPerDay) {
      return { allowed: false, reason: 'Daily search limit reached (10 searches)' };
    }

    // Check user monthly limit
    const { count: userMonthlyCount } = await this.supabase
      .from('perplexity_searches')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', this.userId)
      .gte('created_at', monthStart.toISOString());

    if (userMonthlyCount && userMonthlyCount >= RATE_LIMITS.perUserPerMonth) {
      return { allowed: false, reason: 'Monthly search limit reached (100 searches)' };
    }

    // Check global daily limit
    const { count: globalDailyCount } = await this.supabase
      .from('perplexity_searches')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString());

    if (globalDailyCount && globalDailyCount >= RATE_LIMITS.globalPerDay) {
      return { allowed: false, reason: 'System daily limit reached. Try again tomorrow.' };
    }

    // Check monthly cost limit
    const { data: monthCosts } = await this.supabase
      .from('perplexity_searches')
      .select('search_cost')
      .gte('created_at', monthStart.toISOString());

    if (monthCosts) {
      const totalCost = monthCosts.reduce((sum, record) => sum + (record.search_cost || 0), 0);
      if (totalCost >= RATE_LIMITS.costLimitPerMonth) {
        return { allowed: false, reason: 'Monthly cost limit reached. Service paused.' };
      }
    }

    return { allowed: true };
  }

  private async checkRecentSearches(foodName: string, brand?: string): Promise<any> {
    // Check if this exact search was done in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentSearch } = await this.supabase
      .from('perplexity_searches')
      .select('cached_result')
      .eq('search_term', `${brand || ''} ${foodName}`.trim().toLowerCase())
      .eq('success', true)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (recentSearch?.cached_result) {
      console.log('📦 Using cached search result');
      return recentSearch.cached_result;
    }

    return null;
  }

  private async recordSearch(
    foodName: string,
    brand: string | undefined,
    success: boolean,
    cost: number
  ): Promise<void> {
    await this.supabase.from('perplexity_searches').insert({
      user_id: this.userId,
      search_term: `${brand || ''} ${foodName}`.trim().toLowerCase(),
      success,
      search_cost: cost,
      created_at: new Date().toISOString()
    });
  }

  private async cacheSearchResult(
    foodName: string,
    brand: string | undefined,
    result: any
  ): Promise<void> {
    await this.supabase
      .from('perplexity_searches')
      .update({ cached_result: result })
      .eq('user_id', this.userId)
      .eq('search_term', `${brand || ''} ${foodName}`.trim().toLowerCase())
      .order('created_at', { ascending: false })
      .limit(1);
  }

  async saveToDatabase(
    foodData: any,
    validated: boolean = false
  ): Promise<{ success: boolean; foodId?: string; error?: string }> {
    try {
      const insertData = {
        name: foodData.name,
        brand: foodData.brand,
        serving_size: foodData.serving_size,
        serving_unit: foodData.serving_unit,
        calories: foodData.calories,
        protein_g: foodData.protein_g,
        carbs_g: foodData.carbs_g,
        fat_g: foodData.fat_g,
        fiber_g: foodData.fiber_g,
        created_by: this.userId,
        is_verified: validated,
        is_public: validated, // Only make public if user validated
        description: `Found via web search. Source: ${foodData.source_url || 'Perplexity AI'}. Confidence: ${foodData.confidence}`
      };

      const { data: newFood, error } = await this.supabase
        .from('foods')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Failed to save food:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Saved to database:', newFood.id);
      return { success: true, foodId: newFood.id };

    } catch (error) {
      console.error('Database save error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}