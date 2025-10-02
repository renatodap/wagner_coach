import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Use OpenRouter with DeepSeek V3 (FREE)
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENROUTER_API_KEY ? "https://openrouter.ai/api/v1" : undefined,
});

const MODEL = process.env.OPENROUTER_API_KEY
  ? "deepseek/deepseek-chat:free"
  : "gpt-4-turbo-preview";

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

    // Calculate program duration
    let duration_weeks = 12; // default
    let end_date = new Date();

    if (genRequest.event_date) {
      // Calculate weeks from today to event date
      const eventDate = new Date(genRequest.event_date);
      const today = new Date();
      const diffTime = Math.abs(eventDate.getTime() - today.getTime());
      const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
      duration_weeks = Math.max(4, Math.min(diffWeeks, 52)); // 4-52 weeks range
      end_date = eventDate;
    } else {
      // Default 12 weeks from today
      end_date = new Date(Date.now() + (12 * 7 * 24 * 60 * 60 * 1000));
    }

    // Get profile embedding text for context
    const { data: embedding } = await supabase
      .from('user_profile_embeddings')
      .select('profile_text')
      .eq('user_id', user_id)
      .single();

    // Build context for AI
    const userContext = `
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

    console.log(`Generating ${duration_weeks}-week program with ${onboarding.desired_training_frequency} workouts/week and ${onboarding.daily_meal_preference} meals/day`);

    // Generate program using Claude 3.5 Sonnet
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an expert fitness and nutrition coach creating a complete ${duration_weeks}-week personalized training and nutrition program.

CRITICAL REQUIREMENTS:
1. Generate ${duration_weeks} weeks with 7 days each (${duration_weeks * 7} total days)
2. Include ${onboarding.desired_training_frequency} workout days per week
3. Each day must have ${onboarding.daily_meal_preference} complete meals
4. Workouts should vary day-to-day and show progressive overload
5. Meals must vary EVERY DAY - no repeating meals
6. Rest days should still have complete meal plans
7. Include specific exercises with sets, reps, and form cues
8. Include specific foods with quantities and calories

Return a JSON object with this EXACT structure:
{
  "program_name": "Descriptive program name based on user goals",
  "program_description": "2-3 sentence overview of the program approach and what makes it effective",
  "weeks": [
    {
      "week_number": 1,
      "week_focus": "Week 1 focus/theme (e.g., 'Foundation Building', 'Strength Base')",
      "days": [
        {
          "day_number": 1,
          "day_of_week": "monday",
          "is_rest_day": false,
          "day_focus": "Brief description of day focus",
          "workouts": [
            {
              "name": "Workout name",
              "type": "strength",
              "duration_minutes": 60,
              "exercises": [
                {
                  "name": "Exercise name",
                  "sets": 4,
                  "reps": "8-10",
                  "rest_seconds": 90,
                  "notes": "Form cues and technique tips"
                }
              ]
            }
          ],
          "meals": [
            {
              "meal_number": 1,
              "meal_type": "breakfast",
              "meal_time": "07:00",
              "name": "Meal name",
              "calories": 500,
              "protein_g": 35,
              "carbs_g": 50,
              "fat_g": 18,
              "foods": [
                {
                  "item": "Food item",
                  "quantity": "Amount with unit",
                  "calories": 210
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}

IMPORTANT RULES:
- Each week must have exactly 7 days
- Day numbers should be absolute (1-${duration_weeks * 7})
- Meals must be DIFFERENT every single day
- Progressive overload: gradually increase weight/reps/intensity across weeks
- Vary exercises to prevent boredom and overuse
- Meal times should be spread throughout the day
- Total daily calories should match user's goals (bulking/cutting/maintenance)
- Include warmup exercises for workout days
`
        },
        {
          role: 'user',
          content: userContext
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 16000,
    });

    const programData = JSON.parse(completion.choices[0].message.content || '{}');

    console.log('Program generated:', {
      name: programData.program_name,
      weeks: programData.weeks?.length,
      totalDays: programData.weeks?.reduce((sum: number, w: any) => sum + (w.days?.length || 0), 0)
    });

    // Deactivate all existing programs for this user
    await supabase
      .from('ai_generated_programs')
      .update({ is_active: false, status: 'completed' })
      .eq('user_id', user_id)
      .eq('is_active', true);

    // Create AI generated program
    const { data: aiProgram, error: programError } = await supabase
      .from('ai_generated_programs')
      .insert({
        user_id,
        name: programData.program_name || 'Custom AI Program',
        description: programData.program_description || '',
        duration_weeks: duration_weeks,
        total_days: duration_weeks * 7,
        start_date: new Date().toISOString().split('T')[0],
        end_date: end_date.toISOString().split('T')[0],
        is_active: true,
        status: 'active',
        generation_context: {
          specific_goal: genRequest.specific_performance_goal,
          event_date: genRequest.event_date,
          weak_points: genRequest.weak_points,
          recovery_capacity: genRequest.recovery_capacity,
          workout_duration: genRequest.preferred_workout_duration
        },
        primary_focus: genRequest.weak_points || []
      })
      .select()
      .single();

    if (programError) {
      console.error('Program creation error:', programError);
      throw programError;
    }

    console.log('AI Program created:', aiProgram.id);

    // Insert all program days, workouts, and meals from the structured output
    const startDate = new Date();
    let dayInsertCount = 0;
    let workoutInsertCount = 0;
    let mealInsertCount = 0;

    for (const week of programData.weeks || []) {
      for (const day of week.days || []) {
        const dayNumber = day.day_number;
        const dayDate = new Date(startDate);
        dayDate.setDate(dayDate.getDate() + dayNumber - 1);

        // Insert day
        const { data: programDay, error: dayError } = await supabase
          .from('ai_program_days')
          .insert({
            program_id: aiProgram.id,
            day_number: dayNumber,
            day_date: dayDate.toISOString().split('T')[0],
            day_of_week: day.day_of_week || '',
            day_name: (day.day_of_week || '').charAt(0).toUpperCase() + (day.day_of_week || '').slice(1),
            day_focus: day.day_focus || '',
            is_completed: false
          })
          .select()
          .single();

        if (dayError) {
          console.error(`Error creating day ${dayNumber}:`, dayError);
          throw dayError;
        }

        dayInsertCount++;

        // Insert workouts for this day
        if (!day.is_rest_day && day.workouts && day.workouts.length > 0) {
          for (let i = 0; i < day.workouts.length; i++) {
            const workout = day.workouts[i];

            const { error: workoutError } = await supabase
              .from('ai_program_workouts')
              .insert({
                program_day_id: programDay.id,
                program_id: aiProgram.id,
                workout_type: workout.type || 'strength',
                workout_order: i,
                name: workout.name || 'Workout',
                duration_minutes: workout.duration_minutes || 60,
                exercises: workout.exercises || [],
                workout_details: workout
              });

            if (workoutError) {
              console.error(`Error creating workout for day ${dayNumber}:`, workoutError);
              throw workoutError;
            }

            workoutInsertCount++;
          }
        }

        // Insert meals for this day
        if (day.meals && day.meals.length > 0) {
          for (const meal of day.meals) {
            const { error: mealError } = await supabase
              .from('ai_program_meals')
              .insert({
                program_day_id: programDay.id,
                program_id: aiProgram.id,
                meal_type: meal.meal_type || 'other',
                meal_time: meal.meal_time || null,
                meal_order: meal.meal_number || 0,
                name: meal.name || 'Meal',
                total_calories: meal.calories || 0,
                total_protein_g: meal.protein_g || 0,
                total_carbs_g: meal.carbs_g || 0,
                total_fat_g: meal.fat_g || 0,
                foods: meal.foods || []
              });

            if (mealError) {
              console.error(`Error creating meal for day ${dayNumber}:`, mealError);
              throw mealError;
            }

            mealInsertCount++;
          }
        }
      }
    }

    console.log(`Inserted ${dayInsertCount} days, ${workoutInsertCount} workouts, ${mealInsertCount} meals`);

    // Update request status
    await supabase
      .from('program_generation_requests')
      .update({
        status: 'completed',
        generated_program_id: aiProgram.id,
        completed_at: new Date().toISOString()
      })
      .eq('id', request_id);

    return NextResponse.json({
      success: true,
      program_id: aiProgram.id,
      message: 'Program generated successfully',
      stats: {
        days: dayInsertCount,
        workouts: workoutInsertCount,
        meals: mealInsertCount
      }
    });
  } catch (error) {
    console.error('Program generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate program', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
