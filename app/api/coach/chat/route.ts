import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      )
    }

    const body = await req.json()
    
    // Validate required fields
    if (!body.coach_type || !body.message) {
      return NextResponse.json(
        { error: 'coach_type and message are required', success: false },
        { status: 400 }
      )
    }

    // Call Python backend
    const response = await fetch(`${BACKEND_URL}/api/v1/coach/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': user.id,
      },
      body: JSON.stringify({
        coach_type: body.coach_type,
        message: body.message,
        conversation_id: body.conversation_id || null
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Backend error' }))
      return NextResponse.json(
        { 
          error: errorData.detail || 'Failed to get coach response',
          success: false
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { 
        error: 'Chat failed',
        success: false
      },
      { status: 500 }
    )
  }
}
