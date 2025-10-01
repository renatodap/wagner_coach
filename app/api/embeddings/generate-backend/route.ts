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
    const { content, contentType, contentId } = body;

    if (!content || !contentType || !contentId) {
      return NextResponse.json(
        { error: 'Content, contentType, and contentId are required' },
        { status: 400 }
      );
    }

    // Call Python backend embeddings endpoint
    const backendResponse = await fetch(`${API_BASE_URL}/api/v1/embeddings/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': user.id,
      },
      body: JSON.stringify({
        content,
        content_type: contentType,
        content_id: contentId
      }),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      return NextResponse.json(
        { error: errorText || 'Failed to generate embedding' },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Embedding generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate embedding' },
      { status: 500 }
    );
  }
}
