// Minimal Google OAuth 2.0 (Authorization Code flow) helpers — hand-rolled,
// no external auth library, consistent with the rest of this project's
// custom auth (see src/lib/customerAuth.ts). Requires GOOGLE_CLIENT_ID and
// GOOGLE_CLIENT_SECRET in .env (from Google Cloud Console) plus
// NEXT_PUBLIC_SITE_URL for the redirect URI. See src/app/api/auth/google/
// for how these are used.

function getRedirectUri(): string {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  return `${siteUrl}/api/auth/google/callback`;
}

export function buildGoogleAuthUrl(state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID is not set. Add it to .env — see the comment above it.');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
    access_type: 'online'
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

type GoogleTokenResponse = {
  access_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
};

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set. Add them to .env.');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: getRedirectUri()
    })
  });

  if (!response.ok) {
    throw new Error(`Google token exchange failed: ${await response.text()}`);
  }
  return response.json();
}

export type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified: boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
  picture?: string;
};

// Fetched directly from Google's userinfo endpoint using the access token
// we just received server-to-server — no client-supplied data involved,
// so there's nothing to verify beyond a normal HTTPS response.
export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok) {
    throw new Error(`Google userinfo fetch failed: ${await response.text()}`);
  }
  return response.json();
}
