import OpenAI from 'openai';

export interface ParsedMeal {
  meal_name: string;
  meal_category: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout' | 'other';
  logged_at: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  notes?: string;
  confidence: 'high' | 'medium' | 'low';
  assumptions?: string[];
}

interface NutritionEstimate {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
}

// Common food nutrition data per 100g (approximate values)
const FOOD_DATABASE: Record<string, NutritionEstimate> = {
  // Fruits
  'apple': { calories: 52, protein_g: 0.3, carbs_g: 14, fat_g: 0.2, fiber_g: 2.4 },
  'banana': { calories: 89, protein_g: 1.1, carbs_g: 23, fat_g: 0.3, fiber_g: 2.6 },
  'orange': { calories: 47, protein_g: 0.9, carbs_g: 12, fat_g: 0.1, fiber_g: 2.4 },

  // Proteins
  'egg': { calories: 155, protein_g: 13, carbs_g: 1.1, fat_g: 11, fiber_g: 0 },
  'chicken breast': { calories: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6, fiber_g: 0 },
  'salmon': { calories: 208, protein_g: 20, carbs_g: 0, fat_g: 13, fiber_g: 0 },
  'beef': { calories: 250, protein_g: 26, carbs_g: 0, fat_g: 15, fiber_g: 0 },

  // Grains
  'bread': { calories: 265, protein_g: 9, carbs_g: 49, fat_g: 3.2, fiber_g: 2.7 },
  'rice': { calories: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3, fiber_g: 0.4 },
  'pasta': { calories: 131, protein_g: 5, carbs_g: 25, fat_g: 1.1, fiber_g: 1.8 },
  'oats': { calories: 389, protein_g: 17, carbs_g: 66, fat_g: 7, fiber_g: 11 },

  // Dairy
  'milk': { calories: 42, protein_g: 3.4, carbs_g: 5, fat_g: 1, fiber_g: 0 },
  'cheese': { calories: 402, protein_g: 25, carbs_g: 1.3, fat_g: 33, fiber_g: 0 },
  'yogurt': { calories: 59, protein_g: 10, carbs_g: 3.6, fat_g: 0.4, fiber_g: 0 },

  // Vegetables
  'broccoli': { calories: 34, protein_g: 2.8, carbs_g: 7, fat_g: 0.4, fiber_g: 2.6 },
  'spinach': { calories: 23, protein_g: 2.9, carbs_g: 3.6, fat_g: 0.4, fiber_g: 2.2 },
  'carrot': { calories: 41, protein_g: 0.9, carbs_g: 10, fat_g: 0.2, fiber_g: 2.8 },

  // Restaurant items (per serving)
  'chipotle bowl': { calories: 700, protein_g: 30, carbs_g: 90, fat_g: 25, fiber_g: 15 },
  'burrito bowl': { calories: 700, protein_g: 30, carbs_g: 90, fat_g: 25, fiber_g: 15 },
  'burger': { calories: 550, protein_g: 25, carbs_g: 45, fat_g: 30, fiber_g: 2 },
  'pizza': { calories: 285, protein_g: 12, carbs_g: 36, fat_g: 10, fiber_g: 2 },
  'sandwich': { calories: 350, protein_g: 20, carbs_g: 40, fat_g: 12, fiber_g: 3 },
};

// Standard serving sizes in grams
const SERVING_SIZES: Record<string, number> = {
  'apple': 182, // 1 medium apple
  'banana': 118, // 1 medium banana
  'orange': 154, // 1 medium orange
  'egg': 50, // 1 large egg
  'bread': 30, // 1 slice
  'toast': 30, // 1 slice
  'milk': 244, // 1 cup
  'yogurt': 245, // 1 cup
  'chipotle bowl': 650, // 1 bowl
  'burrito bowl': 650, // 1 bowl
  'burger': 200, // 1 burger
  'pizza': 107, // 1 slice
  'sandwich': 150, // 1 sandwich
};

export class MealParser {
  private openai: OpenAI | null = null;
  private useOpenAI: boolean = false;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true // Note: In production, use server-side API calls
      });
      this.useOpenAI = true;
      console.log('MealParser: OpenAI initialized');
    } else {
      console.log('MealParser: No API key, using rule-based parsing');
    }
  }

  async parseMealDescription(description: string): Promise<ParsedMeal> {
    const now = new Date();
    const currentTime = now.toISOString();

    // Try AI parsing first if available
    if (this.useOpenAI && this.openai) {
      try {
        console.log('Attempting AI parsing for:', description);
        const result = await this.parseWithAI(description, currentTime);
        console.log('AI parsing successful');
        return result;
      } catch (error) {
        console.error('AI parsing failed, falling back to rule-based parsing:', error);
      }
    }

    // Fallback to rule-based parsing
    console.log('Using rule-based parsing for:', description);
    return this.parseWithRules(description, currentTime);
  }

  private async parseWithAI(description: string, currentTime: string): Promise<ParsedMeal> {
    if (!this.openai) throw new Error('OpenAI client not initialized');

    const systemPrompt = `You are a nutrition assistant that parses natural language meal descriptions into structured data.
Parse the user's meal description and return a JSON object with these fields:
- meal_name: string (concise name for the meal)
- meal_category: one of "breakfast", "lunch", "dinner", "snack", "pre_workout", "post_workout", "other"
- logged_at: ISO timestamp (adjust from current time ${currentTime} based on user's description)
- calories: number or null (estimate if possible)
- protein_g: number or null (grams of protein)
- carbs_g: number or null (grams of carbohydrates)
- fat_g: number or null (grams of fat)
- fiber_g: number or null (grams of fiber)
- notes: string or null (any additional notes)
- confidence: "high", "medium", or "low" (based on how specific the input was)
- assumptions: array of strings (list any assumptions made)

For time references:
- "today" or no time specified: use current date
- "yesterday": subtract 1 day
- "last night": previous day evening
- Specific times: adjust accordingly

For nutrition estimates:
- Use standard serving sizes and nutrition data
- If quantities aren't specified, assume typical serving sizes
- For complex dishes, make reasonable estimates
- When uncertain, provide conservative estimates and note assumptions

Return ONLY valid JSON, no additional text.`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Using cheaper model for simple parsing
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: description }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from AI');
    }

    try {
      const parsed = JSON.parse(response);
      return this.validateParsedMeal(parsed);
    } catch (error) {
      console.error('Failed to parse AI response:', response);
      throw error;
    }
  }

  private parseWithRules(description: string, currentTime: string): ParsedMeal {
    const lower = description.toLowerCase();
    const now = new Date(currentTime);

    // Parse time references
    let loggedAt = new Date(currentTime);
    if (lower.includes('yesterday')) {
      loggedAt.setDate(loggedAt.getDate() - 1);
      // Set appropriate time based on meal type mentioned
      if (lower.includes('breakfast')) {
        loggedAt.setHours(8, 0, 0, 0);
      } else if (lower.includes('lunch')) {
        loggedAt.setHours(12, 30, 0, 0);
      } else if (lower.includes('dinner')) {
        loggedAt.setHours(19, 0, 0, 0);
      }
    } else if (lower.includes('last night')) {
      loggedAt.setDate(loggedAt.getDate() - 1);
      loggedAt.setHours(19, 0, 0, 0);
    }

    // Extract time if mentioned
    const timeMatch = lower.match(/at (\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const period = timeMatch[3];

      if (period === 'pm' && hours < 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0;

      loggedAt.setHours(hours, minutes, 0, 0);
    }

    // Determine meal category
    let category: ParsedMeal['meal_category'] = 'other';
    if (lower.includes('breakfast')) category = 'breakfast';
    else if (lower.includes('lunch')) category = 'lunch';
    else if (lower.includes('dinner')) category = 'dinner';
    else if (lower.includes('snack')) category = 'snack';
    else if (lower.includes('pre-workout') || lower.includes('preworkout')) category = 'pre_workout';
    else if (lower.includes('post-workout') || lower.includes('postworkout')) category = 'post_workout';
    else {
      // Guess based on time
      const hour = loggedAt.getHours();
      if (hour >= 5 && hour < 11) category = 'breakfast';
      else if (hour >= 11 && hour < 15) category = 'lunch';
      else if (hour >= 17 && hour < 21) category = 'dinner';
      else category = 'snack';
    }

    // Extract quantities and foods
    const foods: Array<{ name: string; quantity: number; unit: string }> = [];
    const assumptions: string[] = [];

    // Pattern for quantity + food
    const quantityPattern = /(\d+(?:\.\d+)?)\s*(g|kg|ml|l|cups?|tbsp|tsp|oz)?\s*(?:of\s+)?([a-z\s]+?)(?:,|and|\.|$)/gi;
    let match;
    while ((match = quantityPattern.exec(lower)) !== null) {
      const quantity = parseFloat(match[1]);
      const unit = match[2] || 'servings';
      const foodName = match[3].trim();

      // Skip if foodName is too short or is a connector word
      if (foodName.length > 2 && !['for', 'at', 'with'].includes(foodName)) {
        foods.push({ name: foodName, quantity, unit });
      }
    }

    // Pattern for "a/an" + food (single serving)
    const singlePattern = /\b(?:a|an|one|1)\s+([a-z\s]+?)(?:,|and|\.|for|at|$)/gi;
    while ((match = singlePattern.exec(lower)) !== null) {
      const foodName = match[1].trim();
      if (foodName.length > 2 && !foods.some(f => f.name === foodName)) {
        foods.push({ name: foodName, quantity: 1, unit: 'serving' });
      }
    }

    // Calculate nutrition
    let totalNutrition: NutritionEstimate = {
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0
    };

    let hasNutritionData = false;

    for (const food of foods) {
      // Find matching food in database
      let nutritionData: NutritionEstimate | null = null;
      let matchedFood = '';

      for (const [dbFood, nutrition] of Object.entries(FOOD_DATABASE)) {
        if (food.name.includes(dbFood) || dbFood.includes(food.name)) {
          nutritionData = nutrition;
          matchedFood = dbFood;
          break;
        }
      }

      if (nutritionData) {
        hasNutritionData = true;
        let grams = food.quantity * 100; // Default assume quantity is per 100g

        // Convert to grams based on unit
        if (food.unit === 'g') {
          grams = food.quantity;
        } else if (food.unit === 'kg') {
          grams = food.quantity * 1000;
        } else if (food.unit === 'serving' || food.unit === 'servings') {
          // Use standard serving size if available
          const servingSize = SERVING_SIZES[matchedFood] || 100;
          grams = food.quantity * servingSize;
        }

        // Calculate nutrition based on quantity
        const multiplier = grams / 100;
        totalNutrition.calories += nutritionData.calories * multiplier;
        totalNutrition.protein_g += nutritionData.protein_g * multiplier;
        totalNutrition.carbs_g += nutritionData.carbs_g * multiplier;
        totalNutrition.fat_g += nutritionData.fat_g * multiplier;
        totalNutrition.fiber_g += nutritionData.fiber_g * multiplier;
      } else {
        assumptions.push(`Could not find nutrition data for "${food.name}"`);
      }
    }

    // Generate meal name
    let mealName = foods.map(f => f.name).join(', ');
    if (!mealName) {
      // Try to extract a meal name from the description
      if (lower.includes('chipotle')) {
        mealName = 'Chipotle Bowl';
      } else if (lower.includes('burger')) {
        mealName = 'Burger';
      } else if (lower.includes('pizza')) {
        mealName = 'Pizza';
      } else if (lower.includes('sandwich')) {
        mealName = 'Sandwich';
      } else {
        mealName = description.substring(0, 50);
      }
    } else {
      // Capitalize the meal name properly
      mealName = mealName.split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }

    // Determine confidence
    let confidence: ParsedMeal['confidence'] = 'high';
    if (!hasNutritionData) {
      confidence = 'low';
      assumptions.push('No nutrition data available, estimates may be inaccurate');
    } else if (assumptions.length > 0) {
      confidence = 'medium';
    }

    return {
      meal_name: mealName,
      meal_category: category,
      logged_at: loggedAt.toISOString(),
      calories: hasNutritionData ? Math.round(totalNutrition.calories) : null,
      protein_g: hasNutritionData ? Math.round(totalNutrition.protein_g * 10) / 10 : null,
      carbs_g: hasNutritionData ? Math.round(totalNutrition.carbs_g * 10) / 10 : null,
      fat_g: hasNutritionData ? Math.round(totalNutrition.fat_g * 10) / 10 : null,
      fiber_g: hasNutritionData ? Math.round(totalNutrition.fiber_g * 10) / 10 : null,
      notes: `Parsed from: "${description}"`,
      confidence,
      assumptions: assumptions.length > 0 ? assumptions : undefined
    };
  }

  private validateParsedMeal(data: any): ParsedMeal {
    // Ensure all required fields are present and valid
    const validCategories = ['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout', 'other'];
    const validConfidences = ['high', 'medium', 'low'];

    return {
      meal_name: data.meal_name || 'Unnamed meal',
      meal_category: validCategories.includes(data.meal_category) ? data.meal_category : 'other',
      logged_at: data.logged_at || new Date().toISOString(),
      calories: typeof data.calories === 'number' ? data.calories : null,
      protein_g: typeof data.protein_g === 'number' ? data.protein_g : null,
      carbs_g: typeof data.carbs_g === 'number' ? data.carbs_g : null,
      fat_g: typeof data.fat_g === 'number' ? data.fat_g : null,
      fiber_g: typeof data.fiber_g === 'number' ? data.fiber_g : null,
      notes: data.notes || undefined,
      confidence: validConfidences.includes(data.confidence) ? data.confidence : 'low',
      assumptions: Array.isArray(data.assumptions) ? data.assumptions : undefined
    };
  }
}