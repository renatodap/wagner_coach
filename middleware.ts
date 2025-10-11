import createMiddleware from 'next-intl/middleware';
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { locales } from './i18n';

// Create the next-intl middleware
const intlMiddleware = createMiddleware({
  locales: locales,
  defaultLocale: 'en',
  localePrefix: 'always' // Always show locale in URL
});

export async function middleware(request: NextRequest) {
  // First, handle i18n routing
  const response = intlMiddleware(request);

  // Then handle auth
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
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Extract locale and pathname without locale
  const pathnameWithoutLocale = request.nextUrl.pathname.replace(/^\/(en|pt)/, '') || '/'

  // Public routes that don't require auth (without locale prefix)
  const isPublicRoute = pathnameWithoutLocale === '/' ||
                        pathnameWithoutLocale === '/auth' ||
                        pathnameWithoutLocale.startsWith('/auth/') ||
                        pathnameWithoutLocale.startsWith('/_next') ||
                        pathnameWithoutLocale.startsWith('/api')

  // If no user and trying to access protected route, redirect to auth
  if (!user && !isPublicRoute) {
    const locale = request.nextUrl.pathname.split('/')[1]
    return NextResponse.redirect(new URL(`/${locale}/auth`, request.url))
  }

  // If user exists, check onboarding status (except for auth routes)
  if (user && !isPublicRoute && pathnameWithoutLocale !== '/auth/onboarding') {
    const { data: onboarding } = await supabase
      .from('user_onboarding')
      .select('completed')
      .eq('user_id', user.id)
      .single()

    // If onboarding not completed, redirect to onboarding
    if (!onboarding?.completed) {
      const locale = request.nextUrl.pathname.split('/')[1]
      return NextResponse.redirect(new URL(`/${locale}/auth/onboarding`, request.url))
    }
  }

  // If user completed onboarding and tries to access onboarding page, redirect to dashboard
  if (user && pathnameWithoutLocale === '/auth/onboarding') {
    const { data: onboarding } = await supabase
      .from('user_onboarding')
      .select('completed')
      .eq('user_id', user.id)
      .single()

    if (onboarding?.completed) {
      const locale = request.nextUrl.pathname.split('/')[1]
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
