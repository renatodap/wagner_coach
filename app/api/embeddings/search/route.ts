import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const {
      query,
      userId,
      limit = 10,
      threshold = 0.5,
      contentTypes
    } = await request.json();

    if (!query || !userId) {
      return Response.json(
        { error: 'Query and userId are required' },
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

    const startTime = Date.now();

    // Generate embedding for the query
    const model = genAI.getGenerativeModel({ model: 'embedding-001' });
    const result = await model.embedContent(query);
    const queryEmbedding = result.embedding.values;

    // Perform semantic search using pgvector
    let searchQuery = supabase.rpc('search_user_context', {
      query_embedding: queryEmbedding,
      target_user_id: userId,
      match_threshold: threshold,
      match_count: limit
    });

    // Filter by content types if specified
    if (contentTypes && contentTypes.length > 0) {
      searchQuery = searchQuery.in('content_type', contentTypes);
    }

    const { data: results, error } = await searchQuery;

    if (error) {
      console.error('Search error:', error);
      throw error;
    }

    const processingTime = Date.now() - startTime;

    return Response.json({
      results: results || [],
      query,
      processingTime
    });

  } catch (error) {
    console.error('Embedding search error:', error);
    return Response.json(
      {
        error: 'Failed to search embeddings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}