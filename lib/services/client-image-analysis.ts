/**
 * Client-Side Image Analysis Service
 *
 * Analyzes food/workout images using OpenAI Vision API directly in the browser.
 * This prevents images from being sent to the backend, saving storage space.
 *
 * The analysis result is attached to the user's text message before sending to backend.
 */

import OpenAI from 'openai'

interface ImageAnalysisResult {
  success: boolean
  is_food: boolean
  description: string
  food_items?: Array<{
    name: string
    quantity: string
    unit: string
  }>
  nutrition?: {
    calories: number
    protein_g: number
    carbs_g: number
    fats_g: number
  }
  meal_type?: string
  confidence: number
  reasoning?: string
  api_used: string
  error?: string
}

/**
 * Convert File to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      // Remove data:image/xxx;base64, prefix
      const base64Data = base64.split(',')[1]
      resolve(base64Data)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Analyze image using OpenAI Vision API
 *
 * Uses the EXACT same prompt as backend food_vision_service.py
 */
export async function analyzeImage(
  imageFile: File,
  userMessage: string = ''
): Promise<ImageAnalysisResult> {
  try {
    // Get OpenAI API key from environment
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY

    if (!apiKey) {
      console.error('[ClientImageAnalysis] NEXT_PUBLIC_OPENAI_API_KEY not found in environment')
      return {
        success: false,
        is_food: false,
        description: 'Image analysis unavailable (API key not configured)',
        confidence: 0,
        api_used: 'none',
        error: 'Missing API key'
      }
    }

    // Convert image to base64
    const imageBase64 = await fileToBase64(imageFile)

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // Required for client-side usage
    })

    const systemPrompt = `You are a food recognition AI that works with a USDA food database of 1000+ foods.

YOUR JOB:
Identify foods using COMMON, DATABASE-FRIENDLY names that can be matched to USDA food database entries.
The backend will match your detected names to real foods and provide accurate nutrition data.

CRITICAL NAMING RULES:
1. Use STANDARD USDA-style names with cooking method
   ✅ GOOD: "Chicken Breast, Grilled" (matches database)
   ✅ GOOD: "Rice, White, Cooked" (matches database)
   ✅ GOOD: "Broccoli, Steamed" (matches database)
   ✅ GOOD: "Banana, Raw" (matches database)

   ❌ BAD: "Chick-fil-A Grilled Chicken Sandwich" (too specific, won't match)
   ❌ BAD: "My homemade fried rice" (too vague)
   ❌ BAD: "Optimum Nutrition Whey" (brand-specific, use "Whey Protein Isolate")

2. ONLY mention brands if packaging/logo CLEARLY visible
   - If no branding visible, use generic ingredient name
   - Prefer: "Protein Powder, Whey Isolate" over "Optimum Nutrition Gold Standard"

3. Include cooking method when relevant
   - "Chicken Breast, Grilled" NOT just "Chicken"
   - "Eggs, Scrambled" NOT just "Eggs"
   - "Broccoli, Steamed" NOT just "Broccoli"

4. Use common portion units
   - Meats: oz, g, breast, thigh, piece
   - Grains: cup, oz, g, slice
   - Vegetables: cup, oz, g
   - Liquids: cup, ml, oz

5. Be CONSERVATIVE with portions (underestimate better than overestimate)

NUTRITION ESTIMATES:
- Provide ROUGH estimates only (backend will use database values)
- Your nutrition is fallback for unmatched foods only
- Focus on accurate food identification, not perfect nutrition math

Analyze the image and determine:
1. Is this food? (yes/no)
2. List all visible foods with database-friendly names
3. Estimate conservative portions
4. Provide rough nutrition estimates (will be replaced by database values)
5. Identify meal type

Return ONLY valid JSON (no markdown):
{
    "is_food": true/false,
    "food_items": [
        {"name": "database-friendly name with cooking method", "quantity": "amount", "unit": "oz/g/cup"}
    ],
    "nutrition": {
        "calories": rough_total_estimate,
        "protein_g": rough_estimate,
        "carbs_g": rough_estimate,
        "fats_g": rough_estimate
    },
    "meal_type": "breakfast/lunch/dinner/snack",
    "description": "Natural language description",
    "confidence": 0.0-1.0,
    "reasoning": "Brief identification explanation"
}

If NOT food:
{
    "is_food": false,
    "description": "What the image shows",
    "confidence": 1.0
}

REMEMBER: Use generic, database-matchable names. The backend will find the best match from USDA database and provide accurate nutrition.`

    let userPrompt = 'Analyze this food image.'
    if (userMessage) {
      userPrompt += `\n\nUser's message: ${userMessage}`
    }

    console.log('[ClientImageAnalysis] Calling OpenAI Vision API...')

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using mini for cost efficiency (same as backend)
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            },
            { type: 'text', text: userPrompt }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.1 // Low temp for consistent analysis
    })

    // Parse JSON response
    let responseText = response.choices[0].message.content?.trim() || '{}'

    // Clean markdown code blocks if present
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    } else if (responseText.startsWith('```')) {
      responseText = responseText.replace(/```\n?/g, '').trim()
    }

    const analysis = JSON.parse(responseText)

    console.log('[ClientImageAnalysis] Analysis result:', {
      is_food: analysis.is_food,
      confidence: analysis.confidence,
      food_items_count: analysis.food_items?.length || 0
    })

    return {
      ...analysis,
      success: true,
      api_used: 'openai_vision_client'
    }
  } catch (error) {
    console.error('[ClientImageAnalysis] Failed to analyze image:', error)

    return {
      success: false,
      is_food: false,
      description: 'Failed to analyze image. Please try again.',
      confidence: 0,
      api_used: 'none',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Match AI-detected foods to database entries
 *
 * Calls backend /api/v1/foods/search endpoint to find best matches
 * from the USDA food database. Returns matched foods with accurate
 * nutrition data from the database instead of AI estimates.
 *
 * @param detectedFoods - Foods detected by AI vision
 * @param authToken - User's JWT token
 * @returns Matched foods with database nutrition data
 */
export async function matchFoodsToDatabase(
  detectedFoods: Array<{name: string, quantity: string, unit: string}>,
  authToken: string
): Promise<{
  matched_foods: Array<{
    id: string
    name: string
    brand_name?: string
    serving_size: number
    serving_unit: string
    calories?: number
    protein_g?: number
    carbs_g?: number
    fat_g?: number
    fiber_g?: number
    sugar_g?: number
    sodium_mg?: number
    detected_quantity: number
    detected_unit: string
    match_confidence: number
    match_method: string
    is_recent: boolean
  }>
  unmatched_foods: Array<{
    name: string
    reason: string
  }>
  total_detected: number
  total_matched: number
  match_rate: number
}> {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

    console.log('[ClientImageAnalysis] Matching foods to database:', detectedFoods)

    const response = await fetch(`${API_BASE_URL}/api/v1/foods/match-detected`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        detected_foods: detectedFoods
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[ClientImageAnalysis] Food matching failed:', response.status, errorText)

      // Return empty results if matching fails (fall back to AI estimates)
      return {
        matched_foods: [],
        unmatched_foods: detectedFoods.map(food => ({
          name: food.name,
          reason: `Database matching failed: ${response.statusText}`
        })),
        total_detected: detectedFoods.length,
        total_matched: 0,
        match_rate: 0
      }
    }

    const result = await response.json()

    console.log('[ClientImageAnalysis] Database matching result:', {
      matched_count: result.matched_foods?.length || 0,
      unmatched_count: result.unmatched_foods?.length || 0
    })

    return result
  } catch (error) {
    console.error('[ClientImageAnalysis] Failed to match foods to database:', error)

    // Return empty results on error (fall back to AI estimates)
    return {
      matched_foods: [],
      unmatched_foods: detectedFoods.map(food => ({
        name: food.name,
        reason: error instanceof Error ? error.message : 'Unknown error'
      })),
      total_detected: detectedFoods.length,
      total_matched: 0,
      match_rate: 0
    }
  }
}

/**
 * Build FoodDetected from database-matched foods
 *
 * Converts database matching results into the FoodDetected format
 * expected by InlineMealCard. Uses accurate database nutrition
 * instead of AI estimates.
 *
 * @param matchResult - Result from matchFoodsToDatabase()
 * @param analysisMetadata - Original analysis metadata (meal_type, description, confidence)
 * @returns FoodDetected object with database nutrition
 */
export function buildFoodDetectedFromDatabase(
  matchResult: {
    matched_foods: Array<{
      id: string
      name: string
      brand_name?: string
      serving_size: number
      serving_unit: string
      calories?: number
      protein_g?: number
      carbs_g?: number
      fat_g?: number
      fiber_g?: number
      sugar_g?: number
      sodium_mg?: number
      detected_quantity: number
      detected_unit: string
      match_confidence: number
      match_method: string
      is_recent: boolean
    }>
    unmatched_foods: Array<{
      name: string
      reason: string
    }>
    total_detected: number
    total_matched: number
    match_rate: number
  },
  analysisMetadata: {
    meal_type?: string
    description: string
    confidence: number
  }
): {
  is_food: boolean
  nutrition: {
    calories: number
    protein_g: number
    carbs_g: number
    fats_g: number
    fiber_g?: number
    sugar_g?: number
    sodium_mg?: number
  }
  food_items: Array<{
    name: string
    quantity?: string | number
    portion?: string
    calories?: number
    protein_g?: number
    carbs_g?: number
    fats_g?: number
  }>
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | null
  confidence: number
  description: string
} {
  // Calculate total nutrition from all matched foods
  let totalCalories = 0
  let totalProtein = 0
  let totalCarbs = 0
  let totalFats = 0
  let totalFiber = 0
  let totalSugar = 0
  let totalSodium = 0

  const foodItems = matchResult.matched_foods.map(match => {
    // Parse detected quantity to number
    const quantityNum = match.detected_quantity

    // Calculate multiplier based on detected quantity vs serving size
    // Note: This is a simple multiplier. In reality, we'd need to convert units properly.
    const multiplier = quantityNum / match.serving_size

    // Calculate nutrition for this specific food item
    const itemCalories = (match.calories || 0) * multiplier
    const itemProtein = (match.protein_g || 0) * multiplier
    const itemCarbs = (match.carbs_g || 0) * multiplier
    const itemFats = (match.fat_g || 0) * multiplier

    // Add to totals
    totalCalories += itemCalories
    totalProtein += itemProtein
    totalCarbs += itemCarbs
    totalFats += itemFats
    totalFiber += (match.fiber_g || 0) * multiplier
    totalSugar += (match.sugar_g || 0) * multiplier
    totalSodium += (match.sodium_mg || 0) * multiplier

    return {
      name: match.name,
      quantity: quantityNum,
      portion: `${match.detected_quantity} ${match.detected_unit}`,
      calories: Math.round(itemCalories),
      protein_g: Math.round(itemProtein * 10) / 10,
      carbs_g: Math.round(itemCarbs * 10) / 10,
      fats_g: Math.round(itemFats * 10) / 10
    }
  })

  // Add unmatched foods as items with no nutrition data
  // (The UI can show these with a warning or fallback message)
  matchResult.unmatched_foods.forEach(unmatched => {
    foodItems.push({
      name: `${unmatched.name} (unmatched)`,
      quantity: undefined,
      portion: undefined,
      calories: undefined,
      protein_g: undefined,
      carbs_g: undefined,
      fats_g: undefined
    })
  })

  return {
    is_food: true,
    nutrition: {
      calories: Math.round(totalCalories),
      protein_g: Math.round(totalProtein * 10) / 10,
      carbs_g: Math.round(totalCarbs * 10) / 10,
      fats_g: Math.round(totalFats * 10) / 10,
      fiber_g: totalFiber > 0 ? Math.round(totalFiber * 10) / 10 : undefined,
      sugar_g: totalSugar > 0 ? Math.round(totalSugar * 10) / 10 : undefined,
      sodium_mg: totalSodium > 0 ? Math.round(totalSodium) : undefined
    },
    food_items: foodItems,
    meal_type: analysisMetadata.meal_type as 'breakfast' | 'lunch' | 'dinner' | 'snack' | null,
    confidence: analysisMetadata.confidence,
    description: analysisMetadata.description
  }
}

/**
 * Convert ImageAnalysisResult to FoodDetected type for UI display
 *
 * This allows us to use the client-side analysis data directly in InlineMealCard
 * without waiting for the backend to return potentially incomplete data.
 */
export function convertToFoodDetected(analysis: ImageAnalysisResult): {
  is_food: boolean
  nutrition: {
    calories: number
    protein_g: number
    carbs_g: number
    fats_g: number
    fiber_g?: number
    sugar_g?: number
    sodium_mg?: number
  }
  food_items: Array<{
    name: string
    quantity?: string | number
    portion?: string
    calories?: number
    protein_g?: number
    carbs_g?: number
    fats_g?: number
  }>
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | null
  confidence: number
  description: string
} | null {
  if (!analysis.success || !analysis.is_food) {
    return null
  }

  const { food_items = [], nutrition, meal_type, description, confidence } = analysis

  return {
    is_food: true,
    nutrition: {
      calories: nutrition?.calories || 0,
      protein_g: nutrition?.protein_g || 0,
      carbs_g: nutrition?.carbs_g || 0,
      fats_g: nutrition?.fats_g || 0
    },
    food_items: food_items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      portion: `${item.quantity} ${item.unit}`,
      // For individual items, we don't have per-item macros from the analysis
      // The total nutrition is in the nutrition object above
      calories: undefined,
      protein_g: undefined,
      carbs_g: undefined,
      fats_g: undefined
    })),
    meal_type: meal_type as 'breakfast' | 'lunch' | 'dinner' | 'snack' | null,
    confidence: confidence || 0,
    description: description || 'Food detected from image'
  }
}

/**
 * Format analysis result as text to attach to user's message
 *
 * This text will be prepended to the user's message before sending to backend,
 * so the AI coach can reference the image analysis in its response.
 *
 * IMPORTANT: The analysis is wrapped in [SYSTEM_CONTEXT] markers so it can be:
 * - Hidden from the user UI (filtered out in UnifiedMessageBubble)
 * - Visible to the AI coach (sent to backend for RAG context)
 */
export function formatAnalysisAsText(analysis: ImageAnalysisResult): string {
  if (!analysis.success || !analysis.is_food) {
    return `[SYSTEM_CONTEXT]Image Analysis: ${analysis.description}[/SYSTEM_CONTEXT]`
  }

  const { food_items = [], nutrition, meal_type, description, confidence } = analysis

  const foodList = food_items.map(item =>
    `${item.name} (${item.quantity} ${item.unit})`
  ).join(', ')

  return `[SYSTEM_CONTEXT]
=== FOOD IMAGE ANALYSIS ===
Description: ${description}
Detected Foods: ${foodList}
Estimated Nutrition:
- Calories: ${nutrition?.calories || 'Unknown'} kcal
- Protein: ${nutrition?.protein_g || 'Unknown'} g
- Carbs: ${nutrition?.carbs_g || 'Unknown'} g
- Fats: ${nutrition?.fats_g || 'Unknown'} g
Meal Type: ${meal_type || 'Unknown'}
Confidence: ${Math.round((confidence || 0) * 100)}%
[/SYSTEM_CONTEXT]`
}
