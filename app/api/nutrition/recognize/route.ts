import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { FoodRecognitionResult, RecognizedFood, LogMealAPIResponse } from '@/types/nutrition';
import crypto from 'crypto';

// Simple in-memory cache for development
const recognitionCache = new Map<string, { data: FoodRecognitionResult; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Rate limiting
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;

function sanitizeText(text: string): string {
  // Remove HTML tags and trim
  return text.replace(/<[^>]*>/g, '').trim();
}

function generateImageHash(imageData: string): string {
  return crypto.createHash('md5').update(imageData).digest('hex');
}

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRequests = rateLimitMap.get(userId) || [];

  // Filter out old requests
  const recentRequests = userRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);

  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  recentRequests.push(now);
  rateLimitMap.set(userId, recentRequests);
  return true;
}

function transformLogMealResponse(apiResponse: LogMealAPIResponse): FoodRecognitionResult {
  const foods: RecognizedFood[] = apiResponse.recognition_results.food_items.map((item, index) => ({
    id: `food_${index}_${Date.now()}`,
    name: sanitizeText(item.name),
    quantity: item.quantity,
    unit: item.unit,
    nutrition: {
      calories: Math.round((apiResponse.nutritional_info?.total_calories || 0) * (item.prob || 0.5)),
      protein_g: parseFloat(((apiResponse.nutritional_info?.total_proteins || 0) * (item.prob || 0.5)).toFixed(1)),
      carbs_g: parseFloat(((apiResponse.nutritional_info?.total_carbs || 0) * (item.prob || 0.5)).toFixed(1)),
      fat_g: parseFloat(((apiResponse.nutritional_info?.total_fats || 0) * (item.prob || 0.5)).toFixed(1))
    },
    confidence: item.prob,
    category: 'food'
  }));

  const totalNutrition = {
    calories: apiResponse.nutritional_info?.total_calories || 0,
    protein_g: apiResponse.nutritional_info?.total_proteins || 0,
    carbs_g: apiResponse.nutritional_info?.total_carbs || 0,
    fat_g: apiResponse.nutritional_info?.total_fats || 0
  };

  const avgConfidence = foods.reduce((sum, food) => sum + food.confidence, 0) / (foods.length || 1);

  return {
    imageId: `img_${Date.now()}`,
    foods,
    totalNutrition,
    confidence: avgConfidence,
    timestamp: new Date().toISOString()
  };
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { image, userId } = body;

    // Validate image format
    if (!image || !image.startsWith('data:image')) {
      return NextResponse.json(
        { success: false, error: 'Invalid image format' },
        { status: 400 }
      );
    }

    // Check image size (approximate check for base64)
    const imageSizeApprox = (image.length * 3) / 4;
    if (imageSizeApprox > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Image too large (max 10MB)' },
        { status: 400 }
      );
    }

    // Check authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Rate limiting
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please wait a minute before trying again.',
          retryAfter: 60
        },
        { status: 429 }
      );
    }

    // Check cache
    const imageHash = generateImageHash(image);
    const cached = recognitionCache.get(imageHash);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        cached: true
      });
    }

    // Call LogMeal API (or mock for development)
    const LOGMEAL_API_KEY = process.env.LOGMEAL_API_KEY;
    const LOGMEAL_API_URL = process.env.LOGMEAL_API_URL || 'https://api.logmeal.com';

    if (!LOGMEAL_API_KEY) {
      // Mock response for development
      const mockResponse: LogMealAPIResponse = {
        recognition_results: {
          food_items: [
            {
              food_id: 'mock_001',
              name: 'Mixed Salad',
              prob: 0.85,
              quantity: 200,
              unit: 'g'
            },
            {
              food_id: 'mock_002',
              name: 'Grilled Chicken',
              prob: 0.92,
              quantity: 150,
              unit: 'g'
            }
          ]
        },
        nutritional_info: {
          total_calories: 350,
          total_proteins: 42,
          total_carbs: 15,
          total_fats: 12
        }
      };

      const result = transformLogMealResponse(mockResponse);

      // Cache the result
      recognitionCache.set(imageHash, {
        data: result,
        timestamp: Date.now()
      });

      return NextResponse.json({
        success: true,
        data: result,
        cached: false
      });
    }

    // Real API call
    try {
      const response = await fetch(`${LOGMEAL_API_URL}/v2/recognition/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOGMEAL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: image.split(',')[1], // Remove data URL prefix
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          return NextResponse.json(
            {
              success: false,
              error: 'Rate limit exceeded',
              retryAfter: retryAfter ? parseInt(retryAfter) : 60
            },
            { status: 429 }
          );
        }

        throw new Error(`API request failed: ${response.statusText}`);
      }

      const apiResponse: LogMealAPIResponse = await response.json();
      const result = transformLogMealResponse(apiResponse);

      // Cache the result
      recognitionCache.set(imageHash, {
        data: result,
        timestamp: Date.now()
      });

      return NextResponse.json({
        success: true,
        data: result,
        cached: false
      });

    } catch (apiError) {
      console.error('LogMeal API error:', apiError);
      return NextResponse.json(
        {
          success: false,
          error: 'Recognition service unavailable. Please try again later.'
        },
        { status: 503 }
      );
    }

  } catch (error) {
    console.error('Recognition error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process image' },
      { status: 500 }
    );
  }
}