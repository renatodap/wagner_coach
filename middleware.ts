import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Public routes that don't require auth
  const isPublicRoute = request.nextUrl.pathname === '/' ||
                        request.nextUrl.pathname === '/auth' ||
                        request.nextUrl.pathname.startsWith('/auth/') ||
                        request.nextUrl.pathname.startsWith('/_next') ||
                        request.nextUrl.pathname.startsWith('/api')

  // MVP allowed routes (dashboard, coach, profile, and nutrition for authenticated users)
  const isMvpAllowedRoute = request.nextUrl.pathname === '/dashboard-mvp' ||
                            request.nextUrl.pathname === '/coach-v3-mvp' ||
                            request.nextUrl.pathname === '/coach-v2-mvp' ||
                            request.nextUrl.pathname === '/coach-v3' ||
                            request.nextUrl.pathname.startsWith('/profile') ||
                            request.nextUrl.pathname.startsWith('/nutrition')

  // If authenticated user lands on root, redirect to dashboard
  if (user && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard-mvp', request.url))
  }

  // If no user and trying to access protected route, redirect to auth
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  // If user is authenticated but accessing non-MVP route (except onboarding), redirect to dashboard
  if (user && !isPublicRoute && !isMvpAllowedRoute && request.nextUrl.pathname !== '/auth/onboarding') {
    return NextResponse.redirect(new URL('/dashboard-mvp', request.url))
  }

  // If user exists, check onboarding status (except for auth routes)
  if (user && !isPublicRoute && request.nextUrl.pathname !== '/auth/onboarding') {
    const { data: onboarding } = await supabase
      .from('user_onboarding')
      .select('completed')
      .eq('user_id', user.id)
      .single()

    // If onboarding not completed, redirect to onboarding
    if (!onboarding?.completed) {
      return NextResponse.redirect(new URL('/auth/onboarding', request.url))
    }
  }

  // If user completed onboarding and tries to access onboarding page, redirect to dashboard
  if (user && request.nextUrl.pathname === '/auth/onboarding') {
    const { data: onboarding } = await supabase
      .from('user_onboarding')
      .select('completed')
      .eq('user_id', user.id)
      .single()

    if (onboarding?.completed) {
      return NextResponse.redirect(new URL('/dashboard-mvp', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
