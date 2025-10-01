import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { API_BASE_URL } from '@/lib/api-config';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { query, limit = 5, threshold = 0.7 } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Call Python backend embeddings search endpoint
    const backendResponse = await fetch(`${API_BASE_URL}/api/v1/embeddings/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': user.id,
      },
      body: JSON.stringify({
        query,
        limit,
        threshold
      }),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      return NextResponse.json(
        { error: errorText || 'Failed to search embeddings' },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Embedding search error:', error);
    return NextResponse.json(
      { error: 'Failed to search embeddings' },
      { status: 500 }
    );
  }
}
