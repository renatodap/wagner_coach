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

    // EXACT SAME PROMPT as backend food_vision_service.py
    const systemPrompt = `You are a food recognition AI for a fitness app.

Analyze the image and determine:
1. Is this image showing food/meals? (yes/no)
2. If yes, identify all food items visible
3. Estimate portion sizes
4. Calculate approximate nutritional content (calories, protein, carbs, fats)
5. Determine meal type (breakfast, lunch, dinner, snack)

Return ONLY valid JSON (no markdown, no explanation):
{
    "is_food": true/false,
    "food_items": [
        {"name": "food name", "quantity": "amount", "unit": "g/oz/cups"}
    ],
    "nutrition": {
        "calories": estimated_total_calories,
        "protein_g": estimated_protein_grams,
        "carbs_g": estimated_carbs_grams,
        "fats_g": estimated_fats_grams
    },
    "meal_type": "breakfast/lunch/dinner/snack",
    "description": "Natural language description of the meal for coach context",
    "confidence": 0.0-1.0,
    "reasoning": "Brief explanation of analysis"
}

If NOT food, return:
{
    "is_food": false,
    "description": "Brief description of what the image shows",
    "confidence": 1.0
}`

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
