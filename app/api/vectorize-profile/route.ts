import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { user_id } = await request.json();

    if (!user_id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get user onboarding data
    const { data: onboarding, error: onboardingError } = await supabase
      .from('user_onboarding')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (onboardingError || !onboarding) {
      return NextResponse.json({ error: 'Onboarding data not found' }, { status: 404 });
    }

    // Generate profile text
    const profileText = `Goal: ${onboarding.primary_goal}. Persona: ${onboarding.user_persona}. Activity Level: ${onboarding.current_activity_level}. Training Frequency: ${onboarding.desired_training_frequency} days/week. Program Duration: ${onboarding.program_duration_weeks} weeks. Sex: ${onboarding.biological_sex}. Age: ${onboarding.age}. Weight: ${onboarding.current_weight_kg}kg. Height: ${onboarding.height_cm}cm. Meals per day: ${onboarding.daily_meal_preference}. Training Times: ${(onboarding.training_time_preferences || []).join(', ')}. Dietary Restrictions: ${(onboarding.dietary_restrictions || []).join(', ')}. Equipment: ${(onboarding.equipment_access || []).join(', ')}. Injuries: ${(onboarding.injury_limitations || []).join(', ')}. Experience: ${onboarding.experience_level}.`;

    // Generate embedding using OpenAI
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: profileText,
    });

    const embedding = embeddingResponse.data[0].embedding;

    // Upsert embedding
    const { error: upsertError } = await supabase
      .from('user_profile_embeddings')
      .upsert(
        {
          user_id,
          profile_text: profileText,
          embedding,
          last_updated: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (upsertError) {
      throw upsertError;
    }

    return NextResponse.json({
      success: true,
      message: 'Profile vectorized successfully'
    });
  } catch (error) {
    console.error('Vectorization error:', error);
    return NextResponse.json(
      { error: 'Failed to vectorize profile' },
      { status: 500 }
    );
  }
}
