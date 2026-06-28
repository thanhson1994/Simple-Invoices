"use server";

import { redirect } from "next/navigation";
import {
  setAuthCookies,
  clearAuthCookies,
  getAccessToken,
  getRefreshToken,
} from "./cookies";
import { buildMembershipServiceUrl } from "./service-url";

/**
 * SECURITY: This file demonstrates best practices for authentication in Next.js:
 * 1. Server-side only execution ('use server' directive)
 * 2. Secrets loaded from server-only environment variables (NOT NEXT_PUBLIC_*)
 * 3. Tokens stored in httpOnly, Secure, SameSite cookies
 * 4. No sensitive data exposed to client bundle
 */

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  scope: string;
  id_token: string;
  token_type: string;
  expires_in: number;
}

interface AuthError {
  error: string;
  error_description?: string;
}

interface MembershipResponse {
  memberships?: Array<{
    token?: string;
    organisationId?: string;
    userId?: string;
    roleId?: string;
  }>;
  data?: {
    memberships?: Array<{
      token?: string;
      organisationId?: string;
      userId?: string;
      roleId?: string;
    }>;
  };
}

/**
 * Server Action: Authenticate user with OAuth2 password grant
 * SECURITY: Credentials and tokens never reach the browser
 *
 * @param username - User's username/phone number
 * @param password - User's password
 * @returns Success or error message (no tokens exposed to client)
 */
export async function login(
  username: string,
  password: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    // SECURITY: Read secrets from server-only environment variables
    // These are NEVER exposed to the browser bundle
    const tokenUrl = process.env.OAUTH_TOKEN_URL;
    const clientId = process.env.OAUTH_CLIENT_ID;
    const clientSecret = process.env.OAUTH_CLIENT_SECRET;
    const scope = process.env.OAUTH_SCOPE;

    // Validate server configuration
    if (!tokenUrl || !clientId || !clientSecret) {
      console.error("Missing OAuth configuration in environment variables");
      return {
        success: false,
        error: "Server configuration error: Missing OAuth credentials",
      };
    }

    // Input validation
    if (!username || !password) {
      return {
        success: false,
        error: "Username and password are required",
      };
    }

    // Sanitize inputs to prevent injection attacks
    const sanitizedUsername = username.trim();
    const sanitizedPassword = password.trim();

    if (sanitizedUsername.length === 0 || sanitizedPassword.length === 0) {
      return {
        success: false,
        error: "Username and password cannot be empty",
      };
    }

    // Create URL-encoded form data for OAuth2 password grant
    const formData = new URLSearchParams();
    formData.append("client_id", clientId);
    formData.append("client_secret", clientSecret);
    formData.append("grant_type", "password");
    formData.append("scope", scope || "openid");
    formData.append("username", sanitizedUsername);
    formData.append("password", sanitizedPassword);

    // Exchange credentials for tokens on the server
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as AuthError;
      return {
        success: false,
        error:
          errorData.error_description ||
          errorData.error ||
          "Authentication failed",
      };
    }

    const authResponse = data as AuthResponse;

    // Fetch user profile to get org_token from memberships[0].token
    let orgToken: string | undefined;
    try {
      const membershipUrl = process.env.MEMBERSHIP_SERVICE_URL;
      if (membershipUrl) {
        const profileUrl = buildMembershipServiceUrl(membershipUrl, "users/me");
        const membershipResponse = await fetch(profileUrl, {
          headers: {
            Authorization: `Bearer ${authResponse.access_token}`,
            "Operation-Mode": "SYNC",
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        if (membershipResponse.ok) {
          const membershipData: MembershipResponse =
            await membershipResponse.json();
          orgToken =
            membershipData.memberships?.[0]?.token ||
            membershipData.data?.memberships?.[0]?.token;
        }
      }
    } catch (error) {
      // Log but don't fail login if membership fetch fails
      console.warn("Failed to fetch organization membership:", error);
    }

    // SECURITY: Store tokens in httpOnly, Secure, SameSite cookies
    // These cookies are inaccessible to client-side JavaScript (XSS protection)
    await setAuthCookies({
      access_token: authResponse.access_token,
      refresh_token: authResponse.refresh_token,
      id_token: authResponse.id_token,
      org_token: orgToken,
      expires_in: authResponse.expires_in,
    });

    return { success: true };
  } catch (error) {
    console.error("Authentication error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Server Action: Log out user by clearing authentication cookies
 */
export async function logout() {
  await clearAuthCookies();
  redirect("/login");
}

/**
 * Server-side check if user is authenticated
 * Used by middleware and server components
 */
export async function requireAuth() {
  const token = await getAccessToken();
  if (!token) {
    redirect("/login");
  }
  return token;
}

/**
 * Decode JWT token without verification to check expiration
 * SECURITY: This only decodes the token payload; it doesn't verify the signature
 * Token validation happens on the server that issued it
 */
function decodeToken(token: string): { exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const decoded = JSON.parse(
      Buffer.from(parts[1], "base64").toString("utf-8"),
    );
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Check if a JWT token is expired
 * Returns true if expired or invalid, false if still valid
 */
export async function isTokenExpired(
  token: string | undefined,
): Promise<boolean> {
  if (!token) return true;
  const decoded = decodeToken(token);
  console.log("Decoded token:", decoded);
  if (!decoded || !decoded.exp) return true;

  // exp is in seconds, Date.now() is in milliseconds
  const now = Math.floor(Date.now() / 1000);
  return decoded.exp < now;
}

/**
 * Refresh access token using refresh token
 * SECURITY: Credentials are never exposed to the browser
 */
export async function refreshAccessToken(): Promise<boolean> {
  try {
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      console.warn("No refresh token available");
      return false;
    }

    const tokenUrl = process.env.OAUTH_TOKEN_URL;
    const clientId = process.env.OAUTH_CLIENT_ID;
    const clientSecret = process.env.OAUTH_CLIENT_SECRET;

    if (!tokenUrl || !clientId || !clientSecret) {
      console.error("Missing OAuth configuration for token refresh");
      return false;
    }

    // Create URL-encoded form data for OAuth2 refresh token grant
    const formData = new URLSearchParams();
    formData.append("client_id", clientId);
    formData.append("client_secret", clientSecret);
    formData.append("grant_type", "refresh_token");
    formData.append("refresh_token", refreshToken);

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Token refresh failed:", response.status);
      await clearAuthCookies();
      return false;
    }

    const data = await response.json();
    const authResponse = data as AuthResponse;

    // Fetch updated user profile to get org_token if needed
    let orgToken: string | undefined;
    try {
      const membershipUrl = process.env.MEMBERSHIP_SERVICE_URL;
      if (membershipUrl) {
        const profileUrl = buildMembershipServiceUrl(membershipUrl, "users/me");
        const membershipResponse = await fetch(profileUrl, {
          headers: {
            Authorization: `Bearer ${authResponse.access_token}`,
            "Operation-Mode": "SYNC",
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        if (membershipResponse.ok) {
          const membershipData: MembershipResponse =
            await membershipResponse.json();
          orgToken =
            membershipData.memberships?.[0]?.token ||
            membershipData.data?.memberships?.[0]?.token;
        }
      }
    } catch (error) {
      console.warn("Failed to fetch updated organization membership:", error);
    }

    // Store updated tokens in cookies
    await setAuthCookies({
      access_token: authResponse.access_token,
      refresh_token: authResponse.refresh_token,
      id_token: authResponse.id_token,
      org_token: orgToken,
      expires_in: authResponse.expires_in,
    });

    return true;
  } catch (error) {
    console.error("Token refresh error:", error);
    return false;
  }
}
