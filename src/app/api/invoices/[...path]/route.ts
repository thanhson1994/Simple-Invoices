import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken, getOrgToken, setOrgTokenOnResponse } from '@/lib/cookies';
import { ensureOrgToken } from '@/lib/org-token';
import { buildInvoiceServiceUrl } from '@/lib/service-url';

/**
 * BFF PROXY ROUTE: Invoice Service
 * 
 * SECURITY: Backend-for-Frontend pattern
 * - Access tokens never reach the browser
 * - All API calls proxied through Next.js server
 * - Tokens read from httpOnly cookies
 * - Client only sees responses, never tokens
 * 
 * Usage from client:
 * fetch('/api/invoices')
 * fetch('/api/invoices/123')
 */

export async function GET(request: NextRequest) {
  try {
    // Get tokens from secure httpOnly cookies
    const accessToken = await getAccessToken();
    const existingOrgToken = await getOrgToken();
    let orgToken = existingOrgToken;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Requirement: resolve org-token from users/me profile before invoice requests.
    orgToken = await ensureOrgToken({ forceProfileLookup: true });

    if (!orgToken) {
      return NextResponse.json(
        { error: 'Organization token not found from user profile' },
        { status: 403 }
      );
    }

    const invoiceServiceUrl = process.env.INVOICE_SERVICE_URL;
    
    if (!invoiceServiceUrl) {
      console.error('INVOICE_SERVICE_URL not configured');
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 500 }
      );
    }

    // Extract the path after /api/invoices/
    const url = new URL(request.url);
    const apiPath = url.pathname.replace('/api/invoices/', '');
    const queryString = url.search;

    // Construct headers
    const headers: HeadersInit = {
      'Authorization': `Bearer ${accessToken}`,
      'Operation-Mode': 'SYNC',
      'Content-Type': 'application/json',
    };

    // Add org-token if available
    if (orgToken) {
      headers['org-token'] = orgToken;
    }

    // Forward request to actual invoice service
    const targetUrl = `${buildInvoiceServiceUrl(invoiceServiceUrl, apiPath)}${queryString}`;
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Invoice service error', details: data },
        { status: response.status }
      );
    }

    const nextResponse = NextResponse.json(data);
    if (!existingOrgToken && orgToken) {
      setOrgTokenOnResponse(nextResponse, orgToken);
    }

    return nextResponse;
  } catch (error) {
    console.error('Invoice service proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = await getAccessToken();
    const existingOrgToken = await getOrgToken();
    let orgToken = existingOrgToken;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    orgToken = await ensureOrgToken({ forceProfileLookup: true });

    if (!orgToken) {
      return NextResponse.json(
        { error: 'Organization token not found from user profile' },
        { status: 403 }
      );
    }

    const invoiceServiceUrl = process.env.INVOICE_SERVICE_URL;
    
    if (!invoiceServiceUrl) {
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 500 }
      );
    }

    const url = new URL(request.url);
    const apiPath = url.pathname.replace('/api/invoices/', '');
    const body = await request.json();

    const headers: HeadersInit = {
      'Authorization': `Bearer ${accessToken}`,
      'Operation-Mode': 'SYNC',
      'Content-Type': 'application/json',
    };

    if (orgToken) {
      headers['org-token'] = orgToken;
    }

    const targetUrl = buildInvoiceServiceUrl(invoiceServiceUrl, apiPath);
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Invoice service error', details: data },
        { status: response.status }
      );
    }

    const nextResponse = NextResponse.json(data);
    if (!existingOrgToken && orgToken) {
      setOrgTokenOnResponse(nextResponse, orgToken);
    }

    return nextResponse;
  } catch (error) {
    console.error('Invoice service proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const accessToken = await getAccessToken();
    const existingOrgToken = await getOrgToken();
    let orgToken = existingOrgToken;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    orgToken = await ensureOrgToken({ forceProfileLookup: true });

    if (!orgToken) {
      return NextResponse.json(
        { error: 'Organization token not found from user profile' },
        { status: 403 }
      );
    }

    const invoiceServiceUrl = process.env.INVOICE_SERVICE_URL;
    
    if (!invoiceServiceUrl) {
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 500 }
      );
    }

    const url = new URL(request.url);
    const apiPath = url.pathname.replace('/api/invoices/', '');
    const body = await request.json();

    const headers: HeadersInit = {
      'Authorization': `Bearer ${accessToken}`,
      'Operation-Mode': 'SYNC',
      'Content-Type': 'application/json',
    };

    if (orgToken) {
      headers['org-token'] = orgToken;
    }

    const targetUrl = buildInvoiceServiceUrl(invoiceServiceUrl, apiPath);
    const response = await fetch(targetUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Invoice service error', details: data },
        { status: response.status }
      );
    }

    const nextResponse = NextResponse.json(data);
    if (!existingOrgToken && orgToken) {
      setOrgTokenOnResponse(nextResponse, orgToken);
    }

    return nextResponse;
  } catch (error) {
    console.error('Invoice service proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const accessToken = await getAccessToken();
    const existingOrgToken = await getOrgToken();
    let orgToken = existingOrgToken;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    orgToken = await ensureOrgToken({ forceProfileLookup: true });

    if (!orgToken) {
      return NextResponse.json(
        { error: 'Organization token not found from user profile' },
        { status: 403 }
      );
    }

    const invoiceServiceUrl = process.env.INVOICE_SERVICE_URL;
    
    if (!invoiceServiceUrl) {
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 500 }
      );
    }

    const url = new URL(request.url);
    const apiPath = url.pathname.replace('/api/invoices/', '');

    const headers: HeadersInit = {
      'Authorization': `Bearer ${accessToken}`,
      'Operation-Mode': 'SYNC',
      'Content-Type': 'application/json',
    };

    if (orgToken) {
      headers['org-token'] = orgToken;
    }

    const targetUrl = buildInvoiceServiceUrl(invoiceServiceUrl, apiPath);
    const response = await fetch(targetUrl, {
      method: 'DELETE',
      headers,
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Invoice service error', details: data },
        { status: response.status }
      );
    }

    const nextResponse = NextResponse.json(data);
    if (!existingOrgToken && orgToken) {
      setOrgTokenOnResponse(nextResponse, orgToken);
    }

    return nextResponse;
  } catch (error) {
    console.error('Invoice service proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
