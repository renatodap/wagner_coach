import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { getSystemPrompt } from '@/lib/ai/coaching-prompts';
import { getUserContext } from '@/lib/ai/rag';

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

    // Rate limiting check
    const rateLimitKey = `coach:${userId}`;
    const { data: rateData } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('endpoint', 'coach')
      .single();

    if (rateData) {
      const resetTime = new Date(rateData.reset_at);
      if (resetTime > new Date() && rateData.requests >= 100) {
        return Response.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    }

    // Get user context for RAG
    const context = await getUserContext(userId, message);

    // Get conversation history if exists
    let conversationHistory = [];
    if (conversationId) {
      const { data: conv } = await supabase
        .from('ai_conversations')
        .select('messages')
        .eq('id', conversationId)
        .single();

      if (conv?.messages) {
        conversationHistory = conv.messages.slice(-10); // Last 10 messages for context
      }
    }

    // Build messages array for AI
    const messages = [
      {
        role: 'system' as const,
        content: getSystemPrompt(context)
      },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: message
      }
    ];

    // Stream response from OpenAI
    const result = await streamText({
      model: openai('gpt-4-turbo'),
      messages,
      temperature: 0.7,
      maxTokens: 1000,
    });

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        // Send conversation ID if new conversation
        if (!conversationId) {
          const newConvId = crypto.randomUUID();
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ conversationId: newConvId })}\n\n`)
          );
        }

        // Stream the AI response
        for await (const chunk of result.textStream) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`)
          );
        }

        // Send completion signal
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    });

    // Update rate limit
    if (rateData) {
      await supabase
        .from('rate_limits')
        .update({
          requests: rateData.requests + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('endpoint', 'coach');
    } else {
      await supabase
        .from('rate_limits')
        .insert({
          user_id: userId,
          endpoint: 'coach',
          requests: 1,
          window: 86400, // 24 hours
          reset_at: new Date(Date.now() + 86400000).toISOString()
        });
    }

    return new Response(stream, {
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