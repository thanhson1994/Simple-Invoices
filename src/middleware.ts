import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * SECURITY MIDDLEWARE
 *
 * This middleware provides:
 * 1. Authentication checks for protected routes
 * 2. Security headers for all responses
 * 3. Automatic redirect to login for unauthenticated users
 */

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/invoices", "/customers", "/settings"];

// Public routes (accessible without authentication)
const publicRoutes = ["/login", "/register", "/forgot-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get access token from cookie
  const accessToken = request.cookies.get("access_token")?.value;
  const isAuthenticated = !!accessToken;

  // Check if the current route is protected
  // Home page (/) is also protected but needs exact match to avoid matching all routes
  const isProtectedRoute =
    pathname === "/" ||
    protectedRoutes.some((route) => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // Redirect unauthenticated users to login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login page
  if (isAuthenticated && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Clone the response
  const response = NextResponse.next();

  // SECURITY HEADERS
  // These headers provide defense-in-depth security

  // Prevent clickjacking attacks
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Enable browser XSS protection
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Control referrer information
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Content Security Policy
  // Adjust this based on your actual needs (fonts, images, APIs, etc.)
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self' data:;
    connect-src 'self' https://*.101digital.io;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  response.headers.set("Content-Security-Policy", cspHeader);

  // Permissions Policy (formerly Feature-Policy)
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );

  // Strict Transport Security (HSTS) - only in production
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }

  return response;
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
  ],
};
