import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

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
    console.log('[Coach API] Calling backend:', `${BACKEND_URL}/api/v1/coach/chat`)
    console.log('[Coach API] User ID:', user.id)
    console.log('[Coach API] Coach type:', body.coach_type)

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

    console.log('[Coach API] Backend response status:', response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Backend error' }))
      console.error('[Coach API] Backend error:', errorData)

      // Provide helpful error messages
      let userMessage = errorData.detail || 'Failed to get coach response'
      if (response.status === 404 || !BACKEND_URL) {
        userMessage = 'Backend server not configured. Please set NEXT_PUBLIC_BACKEND_URL environment variable.'
      } else if (response.status >= 500) {
        userMessage = 'Backend server error. Please check backend logs.'
      }

      return NextResponse.json(
        {
          error: userMessage,
          success: false,
          debug: {
            backendUrl: BACKEND_URL,
            status: response.status,
            detail: errorData.detail
          }
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('[Coach API] Unexpected error:', error)

    // Check if backend is unreachable
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    let userMessage = 'Chat failed'

    if (errorMessage.includes('fetch') || errorMessage.includes('ECONNREFUSED')) {
      userMessage = 'Cannot reach backend server. Please ensure backend is running at ' + BACKEND_URL
    }

    return NextResponse.json(
      {
        error: userMessage,
        success: false,
        debug: {
          backendUrl: BACKEND_URL,
          errorMessage,
          hint: 'Start backend: cd fitness-backend && uvicorn app.main:app --reload'
        }
      },
      { status: 500 }
    )
  }
}
