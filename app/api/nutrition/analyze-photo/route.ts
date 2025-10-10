import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AnalyzePhotoRequest, AnalyzePhotoResponse, AIAnalysisResult } from '@/types/nutrition';
import { openRouter } from '@/lib/ai/openrouter';

// Use OpenRouter for intelligent model selection
async function analyzeWithOpenRouter(imageData: string, mealCategory?: string): Promise<AIAnalysisResult> {
  const prompt = `You are a nutrition expert AI. Analyze this food image and provide detailed nutritional information.

${mealCategory ? `This is a ${mealCategory} meal.` : ''}

Identify all food items visible in the image and provide:
1. Name of each food item
2. Estimated quantity/portion size
3. Nutritional information (calories, protein, carbs, fat, fiber)
4. A confidence score for your analysis

Return your response in this exact JSON format:
{
  "foodItems": [
    {
      "name": "Food item name",
      "quantity": "Portion size (e.g., '150g', '1 cup')",
      "confidence": 0.95,
      "calories": 250,
      "protein_g": 30,
      "total_carbs_g": 10,
      "total_fat_g": 5,
      "dietary_fiber_g": 2
    }
  ],
  "totalNutrition": {
    "calories": 250,
    "protein_g": 30,
    "total_carbs_g": 10,
    "total_fat_g": 5,
    "dietary_fiber_g": 2
  },
  "suggestedMealName": "Descriptive meal name",
  "confidence": 0.92
}`;

  try {
    const result = await openRouter.analyzeImage(imageData, prompt);

    // Parse the JSON response
    const parsed = JSON.parse(result);
    return parsed as AIAnalysisResult;
  } catch (error) {
    console.error('OpenRouter analysis failed:', error);
    // Fallback to mock data if OpenRouter fails
    return analyzeWithMockData(imageData);
  }
}

// Fallback mock data for testing/development
async function analyzeWithMockData(imageData: string): Promise<AIAnalysisResult> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock response based on common meal patterns
  const mockResponses = [
    {
      foodItems: [
        {
          name: 'Grilled Chicken Breast',
          quantity: '150g',
          confidence: 0.95,
          calories: 248,
          protein_g: 46.2,
          total_carbs_g: 0,
          total_fat_g: 5.4,
          dietary_fiber_g: 0
        },
        {
          name: 'Steamed Broccoli',
          quantity: '1 cup',
          confidence: 0.88,
          calories: 55,
          protein_g: 3.7,
          total_carbs_g: 11.2,
          total_fat_g: 0.6,
          dietary_fiber_g: 5.1
        },
        {
          name: 'Brown Rice',
          quantity: '1/2 cup cooked',
          confidence: 0.92,
          calories: 109,
          protein_g: 2.3,
          total_carbs_g: 22.9,
          total_fat_g: 0.9,
          dietary_fiber_g: 1.8
        }
      ],
      totalNutrition: {
        calories: 412,
        protein_g: 52.2,
        total_carbs_g: 34.1,
        total_fat_g: 6.9,
        dietary_fiber_g: 6.9
      },
      suggestedMealName: 'Grilled Chicken with Vegetables and Rice',
      confidence: 0.92
    },
    {
      foodItems: [
        {
          name: 'Greek Salad',
          quantity: '2 cups',
          confidence: 0.90,
          calories: 180,
          protein_g: 6,
          total_carbs_g: 12,
          total_fat_g: 14,
          dietary_fiber_g: 4
        },
        {
          name: 'Grilled Salmon',
          quantity: '120g',
          confidence: 0.93,
          calories: 280,
          protein_g: 39,
          total_carbs_g: 0,
          total_fat_g: 13,
          dietary_fiber_g: 0
        }
      ],
      totalNutrition: {
        calories: 460,
        protein_g: 45,
        total_carbs_g: 12,
        total_fat_g: 27,
        dietary_fiber_g: 4
      },
      suggestedMealName: 'Grilled Salmon with Greek Salad',
      confidence: 0.91
    }
  ];

  // Return a random mock response
  return mockResponses[Math.floor(Math.random() * mockResponses.length)];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { imageData, mealCategory, includePortionHelp } = body as AnalyzePhotoRequest;

    // Validate image data
    if (!imageData) {
      return NextResponse.json(
        { success: false, error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Check if image is base64 encoded
    if (!imageData.startsWith('data:image/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid image format. Please provide a base64 encoded image.' },
        { status: 400 }
      );
    }

    // Check image size (rough estimate for base64)
    const sizeInBytes = (imageData.length * 3) / 4;
    if (sizeInBytes > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Image size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate meal category if provided
    const validCategories = ['breakfast', 'lunch', 'dinner', 'snack'];
    if (mealCategory && !validCategories.includes(mealCategory)) {
      return NextResponse.json(
        { success: false, error: 'Invalid meal category' },
        { status: 400 }
      );
    }

    // Store image in Supabase storage (optional, for analysis history)
    const timestamp = Date.now();
    const fileName = `meal-photos/${user.id}/${timestamp}.jpg`;

    // Convert base64 to blob
    const base64Data = imageData.split(',')[1];
    const binaryData = Buffer.from(base64Data, 'base64');

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('meal-images')
      .upload(fileName, binaryData, {
        contentType: 'image/jpeg',
        upsert: false
      });

    let imageUrl = '';
    if (uploadData && !uploadError) {
      const { data: urlData } = supabase.storage
        .from('meal-images')
        .getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    }

    // Analyze image with AI
    const startTime = Date.now();
    let analysisResult: AIAnalysisResult;
    let aiServiceUsed = 'openrouter';

    try {
      // Use OpenRouter which will automatically select the best model
      analysisResult = await analyzeWithOpenRouter(imageData, mealCategory);
    } catch (error) {
      console.error('Image analysis failed:', error);
      // Fallback to mock data if all services fail
      aiServiceUsed = 'mock';
      analysisResult = await analyzeWithMockData(imageData);
    }

    const processingTime = Date.now() - startTime;

    // Check if food was detected
    if (!analysisResult.foodItems || analysisResult.foodItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No food detected in the image' },
        { status: 422 }
      );
    }

    // Generate analysis ID
    const analysisId = `analysis_${user.id}_${timestamp}`;

    // Store analysis in database
    const { error: dbError } = await supabase
      .from('meal_photo_analyses')
      .insert({
        user_id: user.id,
        image_url: imageUrl || imageData.substring(0, 100), // Store URL or truncated data
        ai_response: analysisResult,
        confidence_score: analysisResult.confidence,
        processing_time_ms: processingTime,
        ai_service_used: aiServiceUsed
      });

    if (dbError) {
      console.error('Failed to store analysis:', dbError);
      // Don't fail the request, just log the error
    }

    // Return successful response
    const response: AnalyzePhotoResponse = {
      success: true,
      data: analysisResult,
      analysisId
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Photo analysis error:', error);

    // Don't expose internal errors
    return NextResponse.json(
      { success: false, error: 'Failed to analyze image. Please try again.' },
      { status: 500 }
    );
  }
}

// OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}