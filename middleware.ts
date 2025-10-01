import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Check if required env vars are present
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Missing Supabase environment variables')
    // Allow request to continue if env vars missing to prevent site from hanging
    return response
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    // Add timeout to prevent hanging
    const sessionPromise = supabase.auth.getSession()
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))

    const result = await Promise.race([sessionPromise, timeoutPromise])

    // If timeout occurred, allow request to continue
    if (!result) {
      console.error('Supabase session check timed out')
      return response
    }

    const { data: { session }, error } = result as any

    // If error occurred, allow request to continue
    if (error) {
      console.error('Supabase session error:', error)
      return response
    }

    // Protected routes
    if (!session && (
      request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/workouts') ||
      request.nextUrl.pathname.startsWith('/activities') ||
      request.nextUrl.pathname.startsWith('/settings') ||
      request.nextUrl.pathname.startsWith('/workout') ||
      request.nextUrl.pathname.startsWith('/analytics') ||
      request.nextUrl.pathname.startsWith('/coach') ||
      request.nextUrl.pathname.startsWith('/nutrition') ||
      request.nextUrl.pathname.startsWith('/programs') ||
      request.nextUrl.pathname.startsWith('/profile')
    )) {
      return NextResponse.redirect(new URL('/auth', request.url))
    }

    // Redirect to dashboard if logged in and trying to access auth pages or home
    if (session && (
      request.nextUrl.pathname === '/auth' ||
      request.nextUrl.pathname === '/'
    )) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
  } catch (error) {
    // Log error but allow request to continue to prevent site from breaking
    console.error('Middleware error:', error)
    return response
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}