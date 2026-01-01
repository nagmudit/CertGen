import { NextRequest, NextResponse } from 'next/server';
import { GOOGLE_CONFIG, OUTLOOK_CONFIG } from '@/lib/auth-config';
import { randomBytes } from 'crypto';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const state = randomBytes(16).toString('hex');
  
  // Store state in cookie to verify later (CSRF protection)
  const cookieStore = new NextResponse().cookies;
  
  let url = '';
  
  if (provider === 'google') {
    const params = new URLSearchParams({
      client_id: GOOGLE_CONFIG.clientId,
      redirect_uri: GOOGLE_CONFIG.redirectUri,
      response_type: 'code',
      scope: GOOGLE_CONFIG.scopes.join(' '),
      access_type: 'offline',
      state: state,
      prompt: 'consent', // Force consent to get refresh token
    });
    url = `${GOOGLE_CONFIG.authUrl}?${params.toString()}`;
  } else if (provider === 'outlook') {
    const params = new URLSearchParams({
      client_id: OUTLOOK_CONFIG.clientId,
      redirect_uri: OUTLOOK_CONFIG.redirectUri,
      response_type: 'code',
      scope: OUTLOOK_CONFIG.scopes.join(' '),
      response_mode: 'query',
      state: state,
    });
    url = `${OUTLOOK_CONFIG.authUrl}?${params.toString()}`;
  } else {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  }

  const response = NextResponse.redirect(url);
  response.cookies.set('oauth_state', state, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 10 // 10 minutes
  });
  
  return response;
}
