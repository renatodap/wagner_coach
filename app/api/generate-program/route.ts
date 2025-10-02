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
          content: `You are an expert fitness coach creating personalized training and nutrition programs. Generate a ${duration_weeks}-week program with ${onboarding.desired_training_frequency} workouts per week and ${onboarding.daily_meal_preference} meals per day.

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

    // Insert program days, workouts, and meals
    const startDate = new Date();

    for (const week of programData.weekly_schedule || []) {
      const weekNumber = week.week_number;

      // Process workouts for this week
      for (const workout of week.workouts || []) {
        const dayNumber = (weekNumber - 1) * 7 + workout.day_of_week;
        const dayDate = new Date(startDate);
        dayDate.setDate(dayDate.getDate() + dayNumber - 1);

        const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayOfWeek = daysOfWeek[dayDate.getDay()];

        // Insert program day
        const { data: programDay, error: dayError } = await supabase
          .from('ai_program_days')
          .insert({
            program_id: aiProgram.id,
            day_number: dayNumber,
            day_date: dayDate.toISOString().split('T')[0],
            day_of_week: dayOfWeek,
            day_name: dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1),
            day_focus: week.focus || ''
          })
          .select()
          .single();

        if (dayError) {
          console.error('Day creation error:', dayError);
          continue;
        }

        // Insert workout
        await supabase
          .from('ai_program_workouts')
          .insert({
            program_day_id: programDay.id,
            program_id: aiProgram.id,
            workout_type: workout.workout_type || 'strength',
            name: workout.workout_name || 'Workout',
            duration_minutes: workout.duration_minutes || 60,
            exercises: workout.exercises || [],
            workout_details: workout
          });

        // Insert meals for this day
        for (const meal of week.daily_meals || []) {
          await supabase
            .from('ai_program_meals')
            .insert({
              program_day_id: programDay.id,
              program_id: aiProgram.id,
              meal_type: meal.meal_name?.toLowerCase() === 'breakfast' ? 'breakfast' :
                        meal.meal_name?.toLowerCase() === 'lunch' ? 'lunch' :
                        meal.meal_name?.toLowerCase() === 'dinner' ? 'dinner' : 'snack',
              meal_order: meal.meal_number || 0,
              name: meal.meal_name || 'Meal',
              total_calories: meal.calories || 0,
              total_protein_g: meal.protein_g || 0,
              total_carbs_g: meal.carbs_g || 0,
              total_fat_g: meal.fat_g || 0,
              foods: meal.foods || []
            });
        }
      }
    }

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
