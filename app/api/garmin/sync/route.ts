import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward the request to the Python backend
    const response = await fetch(`${API_BASE_URL}/api/v1/integrations/garmin/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: body.email,
        password: body.password,
        user_id: body.userId,
        days_back: body.daysBack || 30
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText || 'Failed to sync with Garmin' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Garmin sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync with Garmin' },
      { status: 500 }
    );
  }
}
