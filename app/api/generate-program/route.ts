import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { request_id } = await request.json();

    if (!request_id) {
      return NextResponse.json({ error: 'Request ID required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get program generation request
    const { data: genRequest, error: requestError } = await supabase
      .from('program_generation_requests')
      .select('*')
      .eq('id', request_id)
      .single();

    if (requestError || !genRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const user_id = genRequest.user_id;

    // Get user onboarding data
    const { data: onboarding, error: onboardingError } = await supabase
      .from('user_onboarding')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (onboardingError || !onboarding) {
      return NextResponse.json({ error: 'Onboarding data not found' }, { status: 404 });
    }

    // Get profile embedding text for context
    const { data: embedding } = await supabase
      .from('user_profile_embeddings')
      .select('profile_text')
      .eq('user_id', user_id)
      .single();

    // Build context for AI
    const context = `
User Profile:
${embedding?.profile_text || 'No profile data available'}

Additional Request Details:
- Specific Performance Goal: ${genRequest.specific_performance_goal || 'None specified'}
- Event Date: ${genRequest.event_date || 'No specific date'}
- Focus Areas/Weak Points: ${(genRequest.weak_points || []).join(', ') || 'None specified'}
- Recovery Capacity: ${genRequest.recovery_capacity}
- Preferred Workout Duration: ${genRequest.preferred_workout_duration}
- Additional Context: ${genRequest.additional_context || 'None'}
`;

    // Generate program using AI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert fitness coach creating personalized training and nutrition programs. Generate a ${onboarding.program_duration_weeks}-week program with ${onboarding.desired_training_frequency} workouts per week and ${onboarding.daily_meal_preference} meals per day.

Return a JSON object with this EXACT structure:
{
  "program_name": "Descriptive program name",
  "program_description": "Brief description of the program approach",
  "weekly_schedule": [
    {
      "week_number": 1,
      "focus": "Week focus/theme",
      "workouts": [
        {
          "day_of_week": 1-7,
          "workout_name": "Workout name",
          "workout_type": "strength|cardio|hiit|flexibility",
          "duration_minutes": 30-90,
          "exercises": [
            {
              "name": "Exercise name",
              "sets": 3,
              "reps": "8-12",
              "rest_seconds": 60,
              "notes": "Form cues"
            }
          ]
        }
      ],
      "daily_meals": [
        {
          "meal_number": 1-6,
          "meal_name": "Breakfast|Snack|Lunch|Dinner",
          "calories": 400-800,
          "protein_g": 20-50,
          "carbs_g": 30-80,
          "fat_g": 10-30,
          "foods": [
            {
              "item": "Food item",
              "quantity": "Amount",
              "calories": 100-500
            }
          ]
        }
      ]
    }
  ]
}`
        },
        {
          role: 'user',
          content: context
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const programData = JSON.parse(completion.choices[0].message.content || '{}');

    // Calculate total calories
    const dailyCalories = Math.round(
      ((onboarding.current_weight_kg * 2.2) * (onboarding.biological_sex === 'male' ? 15 : 14)) *
      (onboarding.current_activity_level === 'sedentary' ? 1.2 :
       onboarding.current_activity_level === 'lightly_active' ? 1.375 :
       onboarding.current_activity_level === 'moderately_active' ? 1.55 : 1.725)
    );

    // Adjust based on goal
    const calorieAdjustment =
      onboarding.primary_goal === 'lose_fat' ? -500 :
      onboarding.primary_goal === 'build_muscle' ? +300 : 0;

    const targetCalories = dailyCalories + calorieAdjustment;

    // Create program enrollment
    const { data: program, error: programError } = await supabase
      .from('user_program_enrollments')
      .insert({
        user_id,
        program_name: programData.program_name || 'Custom AI Program',
        program_type: 'ai_generated',
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + (onboarding.program_duration_weeks * 7 * 24 * 60 * 60 * 1000)).toISOString(),
        target_calories: targetCalories,
        target_protein_g: Math.round(onboarding.current_weight_kg * 1.8),
        target_carbs_g: Math.round((targetCalories * 0.45) / 4),
        target_fat_g: Math.round((targetCalories * 0.30) / 9),
        notes: programData.program_description
      })
      .select()
      .single();

    if (programError) {
      console.error('Program creation error:', programError);
      throw programError;
    }

    // Update request status
    await supabase
      .from('program_generation_requests')
      .update({
        status: 'completed',
        generated_program_id: program.id,
        completed_at: new Date().toISOString()
      })
      .eq('id', request_id);

    return NextResponse.json({
      success: true,
      program_id: program.id,
      message: 'Program generated successfully'
    });
  } catch (error) {
    console.error('Program generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate program' },
      { status: 500 }
    );
  }
}
