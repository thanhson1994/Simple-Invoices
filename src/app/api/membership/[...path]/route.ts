import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/cookies";
import { buildMembershipServiceUrl } from "@/lib/service-url";

/**
 * BFF PROXY ROUTE: Membership Service
 *
 * SECURITY: Backend-for-Frontend pattern
 * - Access tokens never reach the browser
 * - All API calls proxied through Next.js server
 * - Tokens read from httpOnly cookies
 * - Client only sees responses, never tokens
 *
 * Usage from client:
 * fetch('/api/membership/users/me')
 */

export async function GET(request: NextRequest) {
  try {
    // Get tokens from secure httpOnly cookies
    const accessToken = await getAccessToken();

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membershipServiceUrl = process.env.MEMBERSHIP_SERVICE_URL;

    if (!membershipServiceUrl) {
      console.error("MEMBERSHIP_SERVICE_URL not configured");
      return NextResponse.json(
        { error: "Service configuration error" },
        { status: 500 },
      );
    }

    // Extract the path after /api/membership/
    const url = new URL(request.url);
    const apiPath = url.pathname.replace("/api/membership/", "");
    const queryString = url.search;

    // Forward request to actual membership service
    const targetUrl = `${buildMembershipServiceUrl(membershipServiceUrl, apiPath)}${queryString}`;

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Operation-Mode": "SYNC",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Membership service error", details: data },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Membership service proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
