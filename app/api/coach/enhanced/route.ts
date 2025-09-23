/**
 * Enhanced AI Coach API with Memory System
 * Provides coaching with memory, preferences, and conversation history
 */

import { createClient } from '@/utils/supabase/server';
import { OpenAI } from 'openai';
import { EnhancedContextBuilder } from '@/lib/ai/enhanced-context';
import { ContextCompressor } from '@/lib/ai/context-compressor';
import { MemoryExtractor } from '@/lib/ai/memory-extractor';
import { getCachedSystemPrompt, buildIntentSpecificInstructions } from '@/lib/ai/enhanced-coaching-prompts';

function getAIClient() {
  // Use OpenRouter with Gemini 2.0 Flash (1M token context!)
  if (process.env.OPENROUTER_API_KEY) {
    return new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://wagner-coach.vercel.app',
        'X-Title': process.env.OPENROUTER_APP_NAME || 'Wagner Coach',
      },
    });
  }

  // Fallback to OpenAI
  if (process.env.OPENAI_API_KEY) {
    return new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  throw new Error('No AI API key configured (OPENROUTER_API_KEY or OPENAI_API_KEY)');
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { message, conversationId } = await request.json();

    if (!message) {
      return new Response('Message is required', { status: 400 });
    }

    // Build enhanced context
    const contextBuilder = new EnhancedContextBuilder();
    const enhancedContext = await contextBuilder.buildContext(user.id);

    // Compress context if needed (Gemini can handle much more!)
    const compressor = new ContextCompressor();
    const compressedContext = await compressor.compressContext(enhancedContext, 50000);

    // Build cached system prompt with enhanced context (70% cost savings!)
    const systemPromptContent = await getCachedSystemPrompt(compressedContext);

    // Get conversation history if exists
    let messages: any[] = [{ role: 'system', content: systemPromptContent }];

    if (conversationId) {
      const { data: conversation } = await supabase
        .from('ai_conversations')
        .select('messages')
        .eq('id', conversationId)
        .single();

      if (conversation?.messages) {
        // Add previous messages but limit to recent ones to save tokens
        const previousMessages = conversation.messages.slice(-10);
        messages = [
          ...messages,
          ...previousMessages.filter((m: any) => m.role !== 'system'),
        ];
      }
    }

    // Add intent-specific coaching instructions to user message
    const intentInstructions = buildIntentSpecificInstructions(message, compressedContext);
    const enhancedMessage = message + intentInstructions;

    // Add new user message with coaching instructions
    messages.push({ role: 'user', content: enhancedMessage });

    // Get AI response with streaming
    const aiClient = getAIClient();

    // Use Gemini 2.0 Flash for massive 1M token context window
    const model = process.env.AI_MODEL || 'google/gemini-2.0-flash-exp:free';

    const stream = await aiClient.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2000, // Gemini can handle more output
      stream: true,
    });

    // Create a new conversation or update existing
    let currentConversationId = conversationId;
    if (!currentConversationId) {
      const { data: newConversation, error } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: user.id,
          messages: messages,
          title: message.substring(0, 50),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
      } else {
        currentConversationId = newConversation.id;
      }
    }

    // Extract facts and create summary in the background
    const extractor = new MemoryExtractor(process.env.OPENAI_API_KEY);

    // Set up SSE response
    const encoder = new TextEncoder();
    const customReadable = new ReadableStream({
      async start(controller) {
        let fullResponse = '';

        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || '';
            fullResponse += text;

            // Send chunk to client
            const data = JSON.stringify({ text, conversationId: currentConversationId });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          // Update conversation with assistant response
          if (currentConversationId) {
            messages.push({ role: 'assistant', content: fullResponse });

            await supabase
              .from('ai_conversations')
              .update({ messages })
              .eq('id', currentConversationId);

            // Extract facts and summary asynchronously
            extractAndStoreFacts(
              messages.slice(-4), // Last 2 exchanges
              user.id,
              currentConversationId,
              extractor,
              supabase
            ).catch(console.error);
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(customReadable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Coach API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get coach response' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

async function extractAndStoreFacts(
  recentMessages: any[],
  userId: string,
  conversationId: string,
  extractor: MemoryExtractor,
  supabase: any
) {
  try {
    // Extract facts
    const facts = await extractor.extractFactsFromConversation(recentMessages, userId);

    // Store high-confidence facts
    const factsToStore = facts.filter(f => f.confidence >= 0.7);

    if (factsToStore.length > 0) {
      const factRecords = factsToStore.map(fact => ({
        user_id: userId,
        fact_type: fact.type,
        content: fact.content,
        confidence: fact.confidence,
        source: 'conversation',
        metadata: fact.metadata || {},
      }));

      const { data: storedFacts, error } = await supabase
        .from('user_memory_facts')
        .insert(factRecords)
        .select();

      if (error) {
        console.error('Error storing facts:', error);
      }

      // Generate and store conversation summary
      const summary = await extractor.summarizeConversation(recentMessages, userId);

      await supabase
        .from('conversation_summaries')
        .insert({
          user_id: userId,
          conversation_id: conversationId,
          summary: summary.summary,
          key_topics: summary.keyTopics,
          extracted_facts: storedFacts?.map(f => f.id) || [],
          action_items: summary.actionItems,
          sentiment: summary.sentiment,
        });
    }

    // Update preference profile if needed
    await updatePreferenceProfile(userId, facts, supabase);
  } catch (error) {
    console.error('Error extracting/storing facts:', error);
  }
}

async function updatePreferenceProfile(userId: string, facts: any[], supabase: any) {
  if (facts.length === 0) return;

  // Get existing profile
  const { data: existingProfile } = await supabase
    .from('user_preference_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  const updates: any = existingProfile || {
    user_id: userId,
    workout_preferences: {},
    nutrition_preferences: {},
    communication_style: {},
    constraints: {},
    motivators: [],
  };

  // Update based on new facts
  for (const fact of facts) {
    if (fact.type === 'preference' && fact.metadata) {
      if (fact.metadata.time) {
        updates.workout_preferences.preferredTime = fact.metadata.time;
      }
      if (fact.metadata.activity) {
        if (fact.content.includes('dislike') || fact.content.includes('avoid')) {
          updates.workout_preferences.avoidedExercises =
            updates.workout_preferences.avoidedExercises || [];
          if (!updates.workout_preferences.avoidedExercises.includes(fact.metadata.activity)) {
            updates.workout_preferences.avoidedExercises.push(fact.metadata.activity);
          }
        }
      }
    }

    if (fact.type === 'constraint' && fact.metadata) {
      if (fact.metadata.allergen) {
        updates.nutrition_preferences.allergies =
          updates.nutrition_preferences.allergies || [];
        if (!updates.nutrition_preferences.allergies.includes(fact.metadata.allergen)) {
          updates.nutrition_preferences.allergies.push(fact.metadata.allergen);
        }
      }
      if (fact.metadata.body_part) {
        updates.constraints.injuries = updates.constraints.injuries || [];
        const existingInjury = updates.constraints.injuries.find(
          (i: any) => i.bodyPart === fact.metadata.body_part
        );
        if (!existingInjury) {
          updates.constraints.injuries.push({
            bodyPart: fact.metadata.body_part,
            restrictions: fact.metadata.avoid || [],
            severity: 'moderate',
          });
        }
      }
    }
  }

  // Upsert the profile
  await supabase
    .from('user_preference_profiles')
    .upsert(updates, { onConflict: 'user_id' });
}