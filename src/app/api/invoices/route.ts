import { NextRequest, NextResponse } from "next/server";
import {
  getAccessToken,
  getOrgToken,
  getRefreshToken,
  setOrgTokenOnResponse,
} from "@/lib/cookies";
import { ensureOrgToken } from "@/lib/org-token";
import { buildInvoiceServiceUrl } from "@/lib/service-url";
import { isTokenExpired, logout, refreshAccessToken } from "@/lib/auth";

/**
 * Helper function to get a valid access token
 * Automatically refreshes if the current token is expired
 */
async function getValidAccessToken(): Promise<string | null> {
  let accessToken = await getAccessToken();
  const refreshToken = await getRefreshToken();
  if (!accessToken && !refreshToken) {
    return null;
  }

  // Check if token is expired and try to refresh
  if ((await isTokenExpired(accessToken)) && refreshToken) {
    console.log("Access token expired, attempting to refresh...");
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      return null;
    }
    // Get the new token after refresh
    accessToken = await getAccessToken();
  }

  return accessToken || null;
}

export async function GET(request: NextRequest) {
  try {
    const accessToken = await getValidAccessToken();
    const existingOrgToken = await getOrgToken();
    let orgToken = existingOrgToken;

    if (!accessToken) {
      await logout();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    orgToken = await ensureOrgToken({ forceProfileLookup: true });

    if (!orgToken) {
      return NextResponse.json(
        { error: "Organization token not found from user profile" },
        { status: 403 },
      );
    }

    const invoiceServiceUrl = process.env.INVOICE_SERVICE_URL;
    if (!invoiceServiceUrl) {
      return NextResponse.json(
        { error: "Service configuration error" },
        { status: 500 },
      );
    }

    const queryString = new URL(request.url).search;

    const targetUrl = `${buildInvoiceServiceUrl(invoiceServiceUrl, "invoices")}${queryString}`;
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Operation-Mode": "SYNC",
        "Content-Type": "application/json",
        "org-token": orgToken,
      },
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Invoice service error", details: data },
        { status: response.status },
      );
    }

    const nextResponse = NextResponse.json(data);
    if (!existingOrgToken && orgToken) {
      setOrgTokenOnResponse(nextResponse, orgToken);
    }

    return nextResponse;
  } catch (error) {
    console.error("Invoice service proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = await getValidAccessToken();
    const existingOrgToken = await getOrgToken();
    let orgToken = existingOrgToken;

    if (!accessToken) {
      await logout();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    orgToken = await ensureOrgToken({ forceProfileLookup: true });

    if (!orgToken) {
      return NextResponse.json(
        { error: "Organization token not found from user profile" },
        { status: 403 },
      );
    }

    const invoiceServiceUrl = process.env.INVOICE_SERVICE_URL;
    if (!invoiceServiceUrl) {
      return NextResponse.json(
        { error: "Service configuration error" },
        { status: 500 },
      );
    }

    const body = await request.json();

    const targetUrl = buildInvoiceServiceUrl(invoiceServiceUrl, "invoices");
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Operation-Mode": "SYNC",
        "Content-Type": "application/json",
        "org-token": orgToken,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Invoice service error", details: data },
        { status: response.status },
      );
    }

    const nextResponse = NextResponse.json(data);
    if (!existingOrgToken && orgToken) {
      setOrgTokenOnResponse(nextResponse, orgToken);
    }

    return nextResponse;
  } catch (error) {
    console.error("Invoice service proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
