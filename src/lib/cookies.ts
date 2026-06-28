import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Secure cookie configuration
 * - httpOnly: Prevents JavaScript access (XSS protection)
 * - secure: Only sent over HTTPS in production
 * - sameSite: CSRF protection
 * - path: Available throughout the app
 */

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const ORG_TOKEN_KEY = "org_token";
const ID_TOKEN_KEY = "id_token";

/**
 * Set authentication tokens in secure httpOnly cookies
 */
export async function setAuthCookies(tokens: {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  org_token?: string;
  expires_in?: number;
}) {
  const cookieStore = await cookies();

  // Set access token with expiration based on expires_in (default 1 hour)
  const maxAge = tokens.expires_in || 3600; // seconds

  cookieStore.set(ACCESS_TOKEN_KEY, tokens.access_token, {
    ...COOKIE_OPTIONS,
    maxAge,
  });

  if (tokens.refresh_token) {
    // Refresh tokens typically last longer (7 days)
    cookieStore.set(REFRESH_TOKEN_KEY, tokens.refresh_token, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });
  }

  if (tokens.id_token) {
    cookieStore.set(ID_TOKEN_KEY, tokens.id_token, {
      ...COOKIE_OPTIONS,
      maxAge,
    });
  }

  if (tokens.org_token) {
    await setOrgTokenCookie(tokens.org_token, maxAge);
  }
}

/**
 * Set organization token cookie independently.
 */
export async function setOrgTokenCookie(orgToken: string, maxAge = 3600) {
  const cookieStore = await cookies();
  cookieStore.set(ORG_TOKEN_KEY, orgToken, {
    ...COOKIE_OPTIONS,
    maxAge,
  });
}

/**
 * Set organization token cookie on a route handler response.
 */
export function setOrgTokenOnResponse(
  response: NextResponse,
  orgToken: string,
  maxAge = 3600,
) {
  response.cookies.set(ORG_TOKEN_KEY, orgToken, {
    ...COOKIE_OPTIONS,
    maxAge,
  });
}

/**
 * Get access token from secure cookie
 */
export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_KEY)?.value;
}

/**
 * Get refresh token from secure cookie
 */
export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_TOKEN_KEY)?.value;
}

/**
 * Get organization token from secure cookie
 */
export async function getOrgToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ORG_TOKEN_KEY)?.value;
}

/**
 * Get ID token from secure cookie
 */
export async function getIdToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ID_TOKEN_KEY)?.value;
}

/**
 * Check if user is authenticated (has valid access token)
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  return !!token;
}

/**
 * Clear all authentication cookies (logout)
 */
export async function clearAuthCookies() {
  const cookieStore = await cookies();

  cookieStore.delete(ACCESS_TOKEN_KEY);
  cookieStore.delete(REFRESH_TOKEN_KEY);
  cookieStore.delete(ID_TOKEN_KEY);
  cookieStore.delete(ORG_TOKEN_KEY);
}
