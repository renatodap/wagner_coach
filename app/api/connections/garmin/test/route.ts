import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Test Garmin Connect connection
 *
 * This endpoint:
 * 1. Authenticates the user via Supabase
 * 2. Forwards the test request to Python backend with auth token
 * 3. Returns the test result
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated session
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    const user = session?.user;

    if (authError || !user || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({
        error: 'Email and password are required'
      }, { status: 400 });
    }

    // Forward to Python backend with authentication
    const backendUrl = process.env.GARMIN_BACKEND_URL || 'http://localhost:8000';

    console.log(`[Garmin Test] Forwarding request to ${backendUrl}/api/v1/garmin/test-connection`);

    const response = await fetch(`${backendUrl}/api/v1/garmin/test-connection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[Garmin Test] Backend error:`, data);
      return NextResponse.json(data, { status: response.status });
    }

    console.log(`[Garmin Test] Connection successful for ${email}`);

    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('[Garmin Test] Unexpected error:', error);
    return NextResponse.json({
      error: 'Failed to test Garmin connection',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
