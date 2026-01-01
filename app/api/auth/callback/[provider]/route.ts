import { NextRequest, NextResponse } from 'next/server';
import { GOOGLE_CONFIG, OUTLOOK_CONFIG } from '@/lib/auth-config';
import { encrypt } from '@/lib/encryption';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/dashboard?error=${error}`, request.url));
  }

  const storedState = request.cookies.get('oauth_state')?.value;
  if (!state || state !== storedState) {
    return NextResponse.redirect(new URL('/dashboard?error=csrf_mismatch', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/dashboard?error=no_code', request.url));
  }

  let tokens: {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  } = {};

  try {
    if (provider === 'google') {
      const response = await fetch(GOOGLE_CONFIG.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CONFIG.clientId,
          client_secret: GOOGLE_CONFIG.clientSecret,
          redirect_uri: GOOGLE_CONFIG.redirectUri,
          grant_type: 'authorization_code',
        }),
      });
      tokens = await response.json();
    } else if (provider === 'outlook') {
      const response = await fetch(OUTLOOK_CONFIG.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: OUTLOOK_CONFIG.clientId,
          client_secret: OUTLOOK_CONFIG.clientSecret,
          redirect_uri: OUTLOOK_CONFIG.redirectUri,
          grant_type: 'authorization_code',
        }),
      });
      tokens = await response.json();
    }

    if (tokens.error) {
      throw new Error(tokens.error_description || tokens.error);
    }

    // Encrypt tokens
    const tokenData = JSON.stringify({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: Date.now() + ((tokens.expires_in || 3600) * 1000),
      provider,
    });

    const encryptedTokens = encrypt(tokenData);

    const response = NextResponse.redirect(new URL('/dashboard?auth=success', request.url));
    
    // Store encrypted tokens in HTTP-only cookie
    response.cookies.set('auth_session', encryptedTokens, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
    });

    // Clear state cookie
    response.cookies.delete('oauth_state');

    return response;

  } catch (err: unknown) {
    console.error('Token exchange error:', err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.redirect(new URL(`/dashboard?error=${encodeURIComponent(errorMessage)}`, request.url));
  }
}
