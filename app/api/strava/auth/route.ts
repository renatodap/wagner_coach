import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authUrl = new URL('https://www.strava.com/oauth/authorize');

  authUrl.searchParams.set('client_id', process.env.STRAVA_CLIENT_ID!);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'read,activity:read_all,profile:read_all');
  authUrl.searchParams.set('redirect_uri', process.env.STRAVA_REDIRECT_URI!);
  authUrl.searchParams.set('approval_prompt', 'force');
  authUrl.searchParams.set('state', 'strava_connect'); // CSRF protection

  return NextResponse.redirect(authUrl.toString());
}