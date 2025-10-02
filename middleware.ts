import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // TEMPORARY: Bypass all middleware to fix hanging issue
  // Will re-enable auth after getting correct Supabase keys
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
