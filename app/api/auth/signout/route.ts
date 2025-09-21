import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL('/auth', request.url));
}

export async function POST(request: NextRequest) {
  const supabase = createClient();

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL('/auth', request.url));
}