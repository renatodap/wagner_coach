import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface EnhancedChatRequest {
  message: string;
  context?: {
    includeProfile: boolean;
    includeGoals: boolean;
    focusGoal?: string;
    requestType?: 'workout' | 'nutrition' | 'general';
  };
  conversationId?: string;
}

interface EnhancedChatResponse {
  response: string;
  contextUsed: {
    profileData: boolean;
    goalsReferenced: string[];
    limitationsConsidered: string[];
    equipmentMentioned: string[];
  };
  recommendations?: AIRecommendation[];
  followUpQuestions?: string[];
}

interface AIRecommendation {
  type: 'workout' | 'nutrition' | 'goal_adjustment' | 'equipment' | 'education';
  title: string;
  description: string;
  action?: string;
  priority: 'high' | 'medium' | 'low';
}

interface AIContext {
  userProfile: any;
  activeGoals: any[];
  capabilities: any;
  limitations: any;
  preferences: any;
  history: any;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: EnhancedChatRequest = await request.json();
    const {
      message,
      context = {
        includeProfile: true,
        includeGoals: true,
        requestType: 'general'
      },
      conversationId
    } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get user context if requested
    let userContext: AIContext | null = null;
    if (context.includeProfile || context.includeGoals) {
      const contextResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/context?` +
        new URLSearchParams({
          requestType: context.requestType || 'general',
          query: message,
          includeHistory: 'true',
          ...(context.focusGoal && { goalFocus: context.focusGoal })
        }),
        {
          headers: {
            'Authorization': request.headers.get('Authorization') || '',
            'Cookie': request.headers.get('Cookie') || ''
          }
        }
      );

      if (contextResponse.ok) {
        const contextData = await contextResponse.json();
        userContext = contextData.context;
      }
    }

    // Generate AI response with context
    const aiResponse = await generateContextualResponse(
      message,
      userContext,
      context.requestType || 'general'
    );

    // Store conversation if conversationId provided
    if (conversationId) {
      try {
        await supabase
          .from('ai_conversations')
          .insert({
            id: conversationId,
            user_id: user.id,
            messages: [
              { role: 'user', content: message, timestamp: new Date().toISOString() },
              { role: 'assistant', content: aiResponse.response, timestamp: new Date().toISOString() }
            ],
            context_used: aiResponse.contextUsed,
            last_message_at: new Date().toISOString()
          });
      } catch (err) {
        console.error('Failed to store conversation:', err);
        // Don't fail the request if conversation storage fails
      }
    }

    return NextResponse.json(aiResponse);

  } catch (error) {
    console.error('Enhanced chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}

async function generateContextualResponse(
  message: string,
  context: AIContext | null,
  requestType: string
): Promise<EnhancedChatResponse> {
  // Build system prompt with user context
  let systemPrompt = buildSystemPrompt(context, requestType);

  // Initialize context tracking
  const contextUsed = {
    profileData: !!context,
    goalsReferenced: [] as string[],
    limitationsConsidered: [] as string[],
    equipmentMentioned: [] as string[]
  };

  // Build user prompt with context awareness
  let userPrompt = message;
  if (context) {
    userPrompt = buildContextualUserPrompt(message, context, contextUsed);
  }

  try {
    // Use OpenAI/Claude API to generate response
    const response = await generateAIResponse(systemPrompt, userPrompt);

    // Generate recommendations based on context
    const recommendations = generateRecommendations(context, message, requestType);

    // Generate follow-up questions
    const followUpQuestions = generateFollowUpQuestions(context, message, requestType);

    return {
      response,
      contextUsed,
      recommendations,
      followUpQuestions
    };

  } catch (error) {
    console.error('AI generation error:', error);

    // Fallback response
    return {
      response: "I'm having trouble processing your request right now. Could you please try rephrasing your question?",
      contextUsed,
      recommendations: [],
      followUpQuestions: []
    };
  }
}

function buildSystemPrompt(context: AIContext | null, requestType: string): string {
  let prompt = `You are Wagner Coach, an AI fitness and wellness coach. You provide personalized, encouraging, and practical advice.

Your core principles:
- Always be supportive and motivational
- Provide actionable, specific advice
- Consider safety first in all recommendations
- Respect individual limitations and preferences
- Focus on sustainable, long-term habits

`;

  if (context) {
    prompt += `\nPersonalized Context for this user:

PROFILE:
- Name: ${context.userProfile.basic.name}
- Experience: ${context.userProfile.basic.experience || 'Not specified'}
- Age: ${context.userProfile.basic.age || 'Not specified'}

PHYSICAL INFO:
- Height: ${context.userProfile.physical.height || 'Not specified'}
- Weight: ${context.userProfile.physical.weight || 'Not specified'}
- Physical Limitations: ${context.userProfile.physical.limitations.length > 0 ? context.userProfile.physical.limitations.join(', ') : 'None specified'}

GOALS (${context.activeGoals.length} active):
${context.activeGoals.map(goal =>
  `- ${goal.type}: ${goal.description} (Priority: ${goal.priority}, Progress: ${goal.progress}%)`
).join('\n')}

CAPABILITIES:
- Equipment Available: ${context.capabilities.equipment.length > 0 ? context.capabilities.equipment.join(', ') : 'Bodyweight only'}
- Skill Level: ${context.capabilities.skillLevel}
- Time Available: ${context.capabilities.timeAvailable || 'Not specified'}
- Training Environment: ${context.capabilities.trainingEnvironment}

LIMITATIONS:
- Physical: ${context.limitations.physical.length > 0 ? context.limitations.physical.join(', ') : 'None'}
- Time: ${context.limitations.time || 'Not specified'}
- Equipment: ${context.limitations.equipment.length > 0 ? context.limitations.equipment.join(', ') : 'None'}
- Dietary: ${context.limitations.dietary.length > 0 ? context.limitations.dietary.join(', ') : 'None'}

PREFERENCES:
- Preferred Activities: ${context.preferences.activities.length > 0 ? context.preferences.activities.join(', ') : 'None specified'}
- Motivation Factors: ${context.preferences.motivationFactors.length > 0 ? context.preferences.motivationFactors.join(', ') : 'None specified'}
- Training Style: ${context.preferences.trainingStyle || 'Not specified'}

HISTORY:
- Total Workouts: ${context.history.totalWorkouts}
- Recent Activity: ${context.history.recentWorkouts.length} recent workouts

IMPORTANT: Always reference and respect the user's goals, limitations, and preferences in your response. Be specific about how your advice relates to their personal context.`;
  }

  if (requestType === 'workout') {
    prompt += `\n\nFOCUS: This is a workout-related request. Prioritize exercise recommendations, training plans, and fitness guidance.`;
  } else if (requestType === 'nutrition') {
    prompt += `\n\nFOCUS: This is a nutrition-related request. Prioritize dietary advice, meal planning, and nutritional guidance.`;
  }

  return prompt;
}

function buildContextualUserPrompt(
  message: string,
  context: AIContext,
  contextUsed: any
): string {
  let enhancedMessage = message;

  // Track what context elements are referenced
  if (context.activeGoals.length > 0) {
    contextUsed.goalsReferenced = context.activeGoals.map(g => g.id);
  }

  if (context.limitations.physical.length > 0) {
    contextUsed.limitationsConsidered = context.limitations.physical;
  }

  if (context.capabilities.equipment.length > 0) {
    contextUsed.equipmentMentioned = context.capabilities.equipment;
  }

  // Add context hints to the message
  enhancedMessage += `\n\n[Context: Consider my ${context.activeGoals.length} active goals, available equipment (${context.capabilities.equipment.join(', ') || 'bodyweight only'}), and any limitations I've mentioned.]`;

  return enhancedMessage;
}

async function generateAIResponse(systemPrompt: string, userPrompt: string): Promise<string> {
  // This would integrate with your preferred AI service
  // For now, return a contextual template response

  return `I understand you're asking about: "${userPrompt}"

Based on your profile and goals, here's my personalized recommendation:

[This would be generated by your AI service like OpenAI GPT or Claude, using the system prompt and user prompt]

Your personalized approach should consider your current fitness level, available equipment, and specific goals. I'm here to help you succeed with a plan that fits your lifestyle and preferences.

Would you like me to create a specific action plan for this?`;
}

function generateRecommendations(
  context: AIContext | null,
  message: string,
  requestType: string
): AIRecommendation[] {
  const recommendations: AIRecommendation[] = [];

  if (!context) return recommendations;

  // Goal-based recommendations
  context.activeGoals.forEach(goal => {
    if (goal.progress < 30) {
      recommendations.push({
        type: 'goal_adjustment',
        title: `Accelerate progress on ${goal.type}`,
        description: `Your ${goal.type} goal (${goal.description}) is at ${goal.progress}% progress. Consider adjusting your approach.`,
        action: 'review_goal_strategy',
        priority: 'high'
      });
    }
  });

  // Equipment recommendations
  if (context.capabilities.equipment.length === 0 || context.capabilities.equipment.includes('bodyweight')) {
    recommendations.push({
      type: 'equipment',
      title: 'Expand your equipment options',
      description: 'Consider adding basic equipment like resistance bands or dumbbells to increase workout variety.',
      priority: 'medium'
    });
  }

  // Workout recommendations based on request type
  if (requestType === 'workout') {
    recommendations.push({
      type: 'workout',
      title: 'Personalized workout plan',
      description: `Create a ${context.capabilities.trainingEnvironment} workout using your available equipment.`,
      action: 'create_workout_plan',
      priority: 'high'
    });
  }

  return recommendations.slice(0, 3); // Limit to 3 recommendations
}

function generateFollowUpQuestions(
  context: AIContext | null,
  message: string,
  requestType: string
): string[] {
  const questions: string[] = [];

  if (!context) {
    return [
      "What are your main fitness goals?",
      "What equipment do you have available?",
      "How much time do you have for workouts?"
    ];
  }

  // Goal-specific follow-ups
  if (context.activeGoals.length > 0) {
    questions.push(`How are you feeling about your progress on your ${context.activeGoals[0].type} goal?`);
  }

  // Equipment-specific follow-ups
  if (context.capabilities.equipment.length > 0) {
    questions.push(`Would you like me to suggest exercises using your ${context.capabilities.equipment.join(' and ')}?`);
  }

  // Request-type specific follow-ups
  if (requestType === 'workout') {
    questions.push("What type of workout are you in the mood for today?");
    questions.push("How much time do you have for your workout?");
  } else if (requestType === 'nutrition') {
    questions.push("Are you looking for meal prep ideas or specific nutritional guidance?");
    questions.push("Do you have any dietary restrictions I should consider?");
  } else {
    questions.push("What aspect of your fitness journey would you like to focus on?");
    questions.push("Is there anything specific you'd like help with today?");
  }

  return questions.slice(0, 3); // Limit to 3 questions
}