import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSystemPrompt, formatCoachResponse } from '@/lib/ai/coaching-prompts';
import { getConsolidatedUserContext } from '@/lib/ai/rag';
import { modelRouter, TaskType } from '@/lib/ai/model-router';

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId, userId } = await request.json();

    if (!message || !userId) {
      return Response.json(
        { error: 'Message and userId are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify user authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // PHASE 1: RATE LIMITING - Check and enforce rate limits
    const { data: rateLimit } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('endpoint', 'coach')
      .single();

    if (rateLimit) {
      const resetTime = new Date(rateLimit.reset_at);
      const now = new Date();

      // If window has passed, reset the counter
      if (resetTime <= now) {
        await supabase
          .from('rate_limits')
          .update({
            requests: 1,
            reset_at: new Date(Date.now() + rateLimit.window_seconds * 1000).toISOString(),
            updated_at: now.toISOString()
          })
          .eq('user_id', userId)
          .eq('endpoint', 'coach');
      } else if (rateLimit.requests >= 100) {
        // Rate limit exceeded
        return Response.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      } else {
        // Increment request count
        await supabase
          .from('rate_limits')
          .update({
            requests: rateLimit.requests + 1,
            updated_at: now.toISOString()
          })
          .eq('user_id', userId)
          .eq('endpoint', 'coach');
      }
    } else {
      // Create new rate limit entry
      await supabase
        .from('rate_limits')
        .insert({
          user_id: userId,
          endpoint: 'coach',
          requests: 1,
          window_seconds: 86400, // 24 hours
          reset_at: new Date(Date.now() + 86400000).toISOString()
        });
    }

    // PHASE 2: Get consolidated context using RPC function (single database call)
    const context = await getConsolidatedUserContext(userId, message);

    // Debug logging to check context
    console.log('[Coach] User context received:');
    console.log('- Profile:', context.profile ? 'Present' : 'Missing');
    console.log('- Workouts:', context.workoutStats);
    console.log('- Activities:', context.stravaActivities?.length || 0);
    console.log('- Nutrition stats:', context.nutritionStats);
    console.log('- Recent meals:', context.recentMeals?.length || 0);

    // Get conversation history if exists
    let conversationHistory: Array<{ role: string; content: string }> = [];
    let existingConversationId = conversationId;

    if (conversationId) {
      const { data: conv } = await supabase
        .from('ai_conversations')
        .select('messages')
        .eq('id', conversationId)
        .single();

      if (conv && conv.messages && Array.isArray(conv.messages)) {
        conversationHistory = conv.messages.slice(-10); // Last 10 messages for context
      }
    }

    // Create new conversation if needed
    if (!existingConversationId) {
      existingConversationId = crypto.randomUUID();
    }

    // Build messages array for AI
    const messages = [
      {
        role: 'system' as const,
        content: getSystemPrompt(context)
      },
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: message
      }
    ];

    // OPTIMIZED: Use FREE model with intelligent routing
    // DeepSeek R1 beats GPT-4 at reasoning and is 100% FREE!
    console.log('[Coach] Using optimized FREE model via model router');

    const stream = await modelRouter.stream(
      {
        type: 'conversational' as TaskType,
        requiresReasoning: true
      },
      messages,
      {
        onModelSwitch: (model) => console.log(`[Coach] Switched to model: ${model}`)
      }
    );

    // Handle streaming response manually
    let fullResponse = '';
    const onFinish = async (text: string) => {
        // PHASE 1: CONVERSATION PERSISTENCE - Save conversation after completion
        try {
          const newMessages = [
            ...conversationHistory,
            { role: 'user', content: message },
            { role: 'assistant', content: text }
          ];

          if (conversationId) {
            // Update existing conversation
            await supabase
              .from('ai_conversations')
              .update({
                messages: newMessages,
                last_message_at: new Date().toISOString(),
                context_used: {
                  profile: context.profile,
                  workoutStats: context.workoutStats,
                  recentWorkouts: context.recentWorkouts?.length || 0,
                  goals: context.goals?.length || 0
                }
              })
              .eq('id', conversationId);
          } else {
            // Create new conversation
            await supabase
              .from('ai_conversations')
              .insert({
                id: existingConversationId,
                user_id: userId,
                title: message.substring(0, 100), // First 100 chars as title
                messages: newMessages,
                last_message_at: new Date().toISOString(),
                context_used: {
                  profile: context.profile,
                  workoutStats: context.workoutStats,
                  recentWorkouts: context.recentWorkouts?.length || 0,
                  goals: context.goals?.length || 0
                }
              });
          }
        } catch (error) {
          console.error('Error saving conversation:', error);
        }

        // PHASE 3: Add response citations
        const citationText = formatCoachResponse(text, context);
        if (citationText && citationText !== text) {
          // Update the saved message with citations
          try {
            const updatedMessages = [
              ...conversationHistory,
              { role: 'user', content: message },
              { role: 'assistant', content: citationText }
            ];

            await supabase
              .from('ai_conversations')
              .update({
                messages: updatedMessages
              })
              .eq('id', existingConversationId);
          } catch (error) {
            console.error('Error updating conversation with citations:', error);
          }
        }
    };

    // Create a custom stream that includes conversation ID and citations
    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        // Send conversation ID first
        if (!conversationId) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ conversationId: existingConversationId })}\n\n`)
          );
        }

        // Stream the AI response
        const reader = stream.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  if (content) {
                    fullResponse += content;
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                    );
                  }
                } catch (e) {
                  // Ignore parse errors for streaming chunks
                }
              }
            }
          }

          // Finish and save
          await onFinish(fullResponse);

          // Add citations at the end
          const citationText = formatCoachResponse('', context);
          if (citationText) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content: '\n\n' + citationText })}\n\n`)
            );
          }

          // Send completion signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(customStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Coach API error:', error);
    return Response.json(
      {
        error: 'An error occurred processing your request',
        userMessage: 'Sorry, I encountered an error. Please try again.'
      },
      { status: 500 }
    );
  }
}