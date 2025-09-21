import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';

// Initialize Google AI for embeddings
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

interface EmbeddingRequest {
  userId?: string; // Optional, will use authenticated user if not provided
  contentType: 'profile' | 'goal' | 'preference';
  content: string;
  metadata?: Record<string, any>;
  update?: boolean;
  contentId?: string; // For updates
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

    const body: EmbeddingRequest = await request.json();
    const {
      contentType,
      content,
      metadata = {},
      update = false,
      contentId
    } = body;

    const userId = body.userId || user.id;

    // Validate request
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    if (!['profile', 'goal', 'preference'].includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }

    // Generate content hash for deduplication
    const contentHash = crypto
      .createHash('sha256')
      .update(content.trim())
      .digest('hex');

    // Generate embedding using Google AI
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(content);
    const embedding = result.embedding.values;

    // Ensure embedding has correct dimensions
    if (embedding.length !== 768) {
      console.warn(`Unexpected embedding dimensions: ${embedding.length}`);
    }

    let storedData;

    if (contentType === 'profile') {
      // Store in profile_embeddings table
      if (update && contentId) {
        const { data, error } = await supabase
          .from('profile_embeddings')
          .update({
            content_hash: contentHash,
            embedding,
            metadata: {
              ...metadata,
              generated_at: new Date().toISOString(),
              model: 'text-embedding-004'
            }
          })
          .eq('user_id', userId)
          .eq('id', contentId)
          .select()
          .single();

        if (error) throw error;
        storedData = data;
      } else {
        // Check for existing embedding with same content hash
        const { data: existing } = await supabase
          .from('profile_embeddings')
          .select('id')
          .eq('user_id', userId)
          .eq('content_hash', contentHash)
          .single();

        if (existing) {
          // Update existing embedding
          const { data, error } = await supabase
            .from('profile_embeddings')
            .update({
              embedding,
              metadata: {
                ...metadata,
                generated_at: new Date().toISOString(),
                model: 'text-embedding-004'
              }
            })
            .eq('id', existing.id)
            .select()
            .single();

          if (error) throw error;
          storedData = data;
        } else {
          // Create new embedding
          const { data, error } = await supabase
            .from('profile_embeddings')
            .insert({
              user_id: userId,
              content_hash: contentHash,
              embedding,
              metadata: {
                ...metadata,
                generated_at: new Date().toISOString(),
                model: 'text-embedding-004'
              }
            })
            .select()
            .single();

          if (error) throw error;
          storedData = data;
        }
      }
    } else if (contentType === 'goal') {
      // Store in goal_embeddings table
      const goalId = metadata.goalId;
      if (!goalId) {
        return NextResponse.json(
          { error: 'Goal ID required for goal embeddings' },
          { status: 400 }
        );
      }

      if (update && contentId) {
        const { data, error } = await supabase
          .from('goal_embeddings')
          .update({
            content_hash: contentHash,
            embedding,
            metadata: {
              ...metadata,
              generated_at: new Date().toISOString(),
              model: 'text-embedding-004'
            }
          })
          .eq('goal_id', goalId)
          .eq('user_id', userId)
          .eq('id', contentId)
          .select()
          .single();

        if (error) throw error;
        storedData = data;
      } else {
        // Check for existing embedding
        const { data: existing } = await supabase
          .from('goal_embeddings')
          .select('id')
          .eq('goal_id', goalId)
          .eq('user_id', userId)
          .eq('content_hash', contentHash)
          .single();

        if (existing) {
          // Update existing
          const { data, error } = await supabase
            .from('goal_embeddings')
            .update({
              embedding,
              metadata: {
                ...metadata,
                generated_at: new Date().toISOString(),
                model: 'text-embedding-004'
              }
            })
            .eq('id', existing.id)
            .select()
            .single();

          if (error) throw error;
          storedData = data;
        } else {
          // Create new
          const { data, error } = await supabase
            .from('goal_embeddings')
            .insert({
              goal_id: goalId,
              user_id: userId,
              content_hash: contentHash,
              embedding,
              metadata: {
                ...metadata,
                generated_at: new Date().toISOString(),
                model: 'text-embedding-004'
              }
            })
            .select()
            .single();

          if (error) throw error;
          storedData = data;
        }
      }
    }

    return NextResponse.json({
      success: true,
      embeddingId: storedData?.id,
      dimensions: embedding.length,
      stored: true,
      contentHash
    });

  } catch (error) {
    console.error('Embedding generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate embedding' },
      { status: 500 }
    );
  }
}

// Generate embeddings for existing profiles
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Get user goals
    const { data: goals, error: goalsError } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (goalsError) {
      throw goalsError;
    }

    let profileEmbeddingsGenerated = 0;
    let goalEmbeddingsGenerated = 0;

    // Generate profile embeddings
    if (profile.about_me) {
      try {
        await generateEmbedding(user.id, 'profile', profile.about_me, {
          source_field: 'about_me',
          profile_id: profile.id
        });
        profileEmbeddingsGenerated++;
      } catch (err) {
        console.error('Failed to generate profile embedding:', err);
      }
    }

    // Generate goal embeddings
    for (const goal of goals || []) {
      if (goal.goal_description) {
        try {
          await generateEmbedding(user.id, 'goal', goal.goal_description, {
            goalId: goal.id,
            goal_type: goal.goal_type,
            source_field: 'goal_description'
          });
          goalEmbeddingsGenerated++;
        } catch (err) {
          console.error(`Failed to generate embedding for goal ${goal.id}:`, err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      profileEmbeddingsGenerated,
      goalEmbeddingsGenerated,
      totalEmbeddings: profileEmbeddingsGenerated + goalEmbeddingsGenerated
    });

  } catch (error) {
    console.error('Batch embedding generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate embeddings' },
      { status: 500 }
    );
  }
}

// Helper function to generate embeddings
async function generateEmbedding(
  userId: string,
  contentType: 'profile' | 'goal',
  content: string,
  metadata: Record<string, any>
) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/profile/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      contentType,
      content,
      metadata
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to generate ${contentType} embedding`);
  }

  return response.json();
}