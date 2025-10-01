import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api-config';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret from request header
    const cronSecret = request.headers.get('X-Cron-Secret');

    if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid cron secret' },
        { status: 401 }
      );
    }

    // Call Python backend summarization endpoint
    const backendResponse = await fetch(`${API_BASE_URL}/api/v1/background-jobs/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Cron-Secret': cronSecret,
      },
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      return NextResponse.json(
        { error: errorText || 'Failed to run summarization' },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Summarization error:', error);
    return NextResponse.json(
      { error: 'Failed to run summarization' },
      { status: 500 }
    );
  }
}
