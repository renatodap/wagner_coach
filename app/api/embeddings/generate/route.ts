import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google AI for embeddings
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { content, contentType, userId, metadata, contentId, update } = await request.json();

    if (!content || !contentType || !userId) {
      return Response.json(
        { error: 'Content, contentType, and userId are required' },
        { status: 400 }
      );
    }

    if (content.trim().length === 0) {
      return Response.json(
        { error: 'Content cannot be empty' },
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

    // Generate embedding using Google's model
    const model = genAI.getGenerativeModel({ model: 'embedding-001' });
    const result = await model.embedContent(content);
    const embedding = result.embedding.values;

    // Ensure embedding has correct dimensions (768 for Google's model)
    if (embedding.length !== 768) {
      console.warn(`Unexpected embedding dimensions: ${embedding.length}`);
    }

    // Store or update embedding in database
    const embeddingData = {
      user_id: userId,
      content_type: contentType,
      content,
      metadata: metadata || {},
      embedding
    };

    let storedData;

    if (update && contentId) {
      // Update existing embedding
      const { data, error } = await supabase
        .from('user_context_embeddings')
        .update({
          content,
          embedding,
          metadata: metadata || {},
        } as any) // Type assertion needed for dynamic table
        .eq('user_id', userId)
        .eq('id', contentId)
        .select()
        .single();

      if (error) throw error;
      storedData = data;
    } else {
      // Check if we should update an existing record based on content_id in metadata
      if (metadata?.contentId) {
        const { data: existing } = await supabase
          .from('user_context_embeddings')
          .select('id')
          .eq('user_id', userId)
          .eq('content_type', contentType)
          .eq('metadata->>contentId', metadata.contentId)
          .single();

        if (existing) {
          const { data, error } = await supabase
            .from('user_context_embeddings')
            .update({
              content,
              embedding,
              metadata,
            } as any) // Type assertion needed for dynamic table
            .eq('id', existing.id)
            .select()
            .single();

          if (error) throw error;
          storedData = data;
        }
      }

      // If no existing record, insert new
      if (!storedData) {
        const { data, error } = await supabase
          .from('user_context_embeddings')
          .insert(embeddingData as any) // Type assertion needed for dynamic table
          .select()
          .single();

        if (error) throw error;
        storedData = data;
      }
    }

    // Also store in specific table if it's a workout completion
    if (contentType === 'workout' && metadata?.workoutCompletionId) {
      await supabase
        .from('workout_completions')
        .update({ embedding })
        .eq('id', metadata.workoutCompletionId);
    }

    // Store goal embedding in profile if it's a goal
    if (contentType === 'goal') {
      await supabase
        .from('profiles')
        .update({ goals_embedding: embedding })
        .eq('id', userId);
    }

    return Response.json({
      embedding,
      id: storedData.id,
      stored: true
    });

  } catch (error) {
    console.error('Embedding generation error:', error);
    return Response.json(
      {
        error: 'Failed to generate embedding',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}