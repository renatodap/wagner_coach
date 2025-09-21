import { NextRequest } from 'next/server';
import { getUserContext } from '@/lib/ai/rag';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return Response.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const context = await getUserContext(userId, '');

    return Response.json(context);

  } catch (error) {
    console.error('Context retrieval error:', error);
    return Response.json(
      {
        error: 'Failed to retrieve user context',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}