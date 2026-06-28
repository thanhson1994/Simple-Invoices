# SimpleInvoice - Technical Documentation

**Version:** 1.0  
**Last Updated:** June 28, 2026  
**Application:** SimpleInvoice - Secure Invoice Management System

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Solution Architecture](#solution-architecture)
3. [Technology Stack](#technology-stack)
4. [Core Features](#core-features)
5. [Security Architecture](#security-architecture)
6. [Design Decisions](#design-decisions)
7. [Implementation Details](#implementation-details)
8. [Data Flow](#data-flow)
9. [API Design](#api-design)
10. [Assumptions](#assumptions)
11. [Testing Considerations](#testing-considerations)
12. [Deployment Considerations](#deployment-considerations)
13. [Future Enhancements](#future-enhancements)

---

## Executive Summary

SimpleInvoice is a modern, secure web application built with Next.js 16.x that provides comprehensive invoice management capabilities. The application implements industry-standard security practices including OAuth2 authentication, Backend-for-Frontend (BFF) pattern, and secure cookie-based session management.

### Key Highlights

- **Framework:** Next.js 16.x with App Router
- **Security:** OAuth2, HttpOnly cookies, BFF pattern, comprehensive security headers
- **Features:** User authentication, invoice creation, invoice listing with search/filter/sort
- **Architecture:** Server-first approach with minimal client-side JavaScript
- **Styling:** Tailwind CSS v4 with dark mode support

---

## Solution Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                            User Browser                              │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────────────┐    │
│  │ Login Page │  │ Invoice List │  │ Create Invoice Modal    │    │
│  │  (Client)  │  │   (Client)   │  │     (Client)            │    │
│  └────────────┘  └──────────────┘  └─────────────────────────┘    │
│         │                │                      │                    │
│         └────────────────┼──────────────────────┘                    │
│                          │ (HTTPS, No Tokens)                        │
└──────────────────────────┼───────────────────────────────────────────┘
                           │
                           │ HttpOnly Cookies
                           │
┌──────────────────────────▼───────────────────────────────────────────┐
│                      Next.js Application                              │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    Middleware Layer                          │    │
│  │  • Authentication Check                                      │    │
│  │  • Security Headers (CSP, HSTS, XSS Protection)             │    │
│  │  • Route Protection                                          │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                           │                                           │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                  Server Components                           │    │
│  │  • Home Page (requireAuth)                                   │    │
│  │  • Invoice Detail Page                                       │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                           │                                           │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   Server Actions                             │    │
│  │  • login(username, password)                                 │    │
│  │  • logout()                                                  │    │
│  │  • requireAuth()                                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                           │                                           │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              BFF API Routes (Proxy Layer)                    │    │
│  │  • /api/invoices                                             │    │
│  │  • /api/invoices/[...path]                                   │    │
│  │  • /api/membership/[...path]                                 │    │
│  │                                                              │    │
│  │  Functions:                                                  │    │
│  │  1. Extract tokens from HttpOnly cookies                    │    │
│  │  2. Add Authorization headers                                │    │
│  │  3. Forward requests to external services                    │    │
│  │  4. Transform responses                                      │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                           │                                           │
└───────────────────────────┼───────────────────────────────────────────┘
                            │ (Bearer Token + org-token)
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
┌───────▼──────────┐                   ┌────────▼─────────┐
│  OAuth2 Server   │                   │ Invoice Service  │
│  (WSO2 IS)       │                   │                  │
│                  │                   │ Membership API   │
│ • Token Exchange │                   │                  │
│ • User Profile   │                   │ Invoice CRUD     │
└──────────────────┘                   └──────────────────┘
```

### Architecture Layers

#### 1. Presentation Layer (Client)

- **React Client Components**: Interactive UI elements (forms, modals, lists)
- **Server Components**: Static content, pre-rendered pages
- **Styling**: Tailwind CSS v4 with utility-first approach
- **State Management**: React hooks (useState, useEffect), Formik for forms

#### 2. Application Layer (Next.js Server)

- **Middleware**: Authentication enforcement, security headers
- **Server Actions**: Secure server-side operations (`login`, `logout`, `requireAuth`)
- **API Routes**: BFF proxy endpoints for external services
- **Cookie Management**: Secure token storage utilities

#### 3. Integration Layer (BFF)

- **API Proxies**: Intermediate layer between client and external services
- **Token Management**: Server-side token extraction and injection
- **Error Handling**: Consistent error transformation
- **Request/Response Transformation**: Data normalization

#### 4. External Services

- **OAuth2 Server**: WSO2 Identity Server for authentication
- **Invoice Service**: External API for invoice operations
- **Membership Service**: User profile and organization data

---

## Technology Stack

### Core Technologies

| Category            | Technology   | Version | Purpose                              |
| ------------------- | ------------ | ------- | ------------------------------------ |
| **Framework**       | Next.js      | 16.2.9  | React framework with App Router      |
| **Runtime**         | Node.js      | 20+     | JavaScript runtime                   |
| **Language**        | TypeScript   | 5.x     | Type-safe development                |
| **UI Library**      | React        | 19.2.4  | Component-based UI                   |
| **Styling**         | Tailwind CSS | 4.x     | Utility-first CSS                    |
| **Form Management** | Formik       | 2.4.9   | Form state and validation            |
| **Validation**      | Yup          | 1.7.1   | Schema validation                    |
| **Package Manager** | pnpm         | Latest  | Fast, disk-efficient package manager |

### Development Tools

- **ESLint**: Code quality and consistency
- **TypeScript Compiler**: Type checking
- **PostCSS**: CSS processing with Tailwind
- **VS Code**: Recommended IDE

### Authentication & Security

- **OAuth2**: Password grant flow
- **HttpOnly Cookies**: Secure token storage
- **CSP Headers**: Content Security Policy
- **HSTS**: HTTP Strict Transport Security

---

## Core Features

### 1. User Authentication

#### Architecture

The authentication system implements OAuth2 password grant flow with server-side token exchange, ensuring credentials and tokens never reach the client bundle.

#### Authentication Flow

```
┌─────────┐                  ┌──────────────┐                  ┌─────────────┐
│ Browser │                  │  Next.js     │                  │ OAuth2      │
│         │                  │  Server      │                  │ Server      │
└────┬────┘                  └──────┬───────┘                  └──────┬──────┘
     │                              │                                  │
     │  1. Submit Login Form        │                                  │
     │  POST /login                 │                                  │
     │  (username, password)        │                                  │
     ├─────────────────────────────>│                                  │
     │                              │                                  │
     │                              │  2. Server Action: login()       │
     │                              │     Exchange credentials          │
     │                              │     for tokens                    │
     │                              ├─────────────────────────────────>│
     │                              │                                  │
     │                              │  3. OAuth2 Token Response        │
     │                              │     (access_token, refresh_token,│
     │                              │      id_token, expires_in)       │
     │                              │<─────────────────────────────────┤
     │                              │                                  │
     │                              │  4. Fetch User Profile           │
     │                              │     (get org_token)              │
     │                              ├─────────────────────────────────>│
     │                              │                                  │
     │                              │  5. Profile Response             │
     │                              │     (memberships[].token)        │
     │                              │<─────────────────────────────────┤
     │                              │                                  │
     │                              │  6. Store tokens in              │
     │                              │     HttpOnly cookies             │
     │                              │     (access_token, refresh_token,│
     │                              │      id_token, org_token)        │
     │                              │                                  │
     │  7. Success Response         │                                  │
     │     (no tokens, just status) │                                  │
     │<─────────────────────────────┤                                  │
     │                              │                                  │
     │  8. Redirect to Dashboard    │                                  │
     │                              │                                  │
```

#### Implementation Details

**File:** `src/lib/auth.ts`

**Key Components:**

1. **Server Action - `login()`**
   - Executes only on server (`'use server'` directive)
   - Reads credentials from client
   - Exchanges credentials for tokens with OAuth2 server
   - Fetches user profile to obtain organization token
   - Stores all tokens in HttpOnly cookies
   - Returns only success/error status (no tokens exposed)

2. **Server Action - `logout()`**
   - Clears all authentication cookies
   - Redirects to login page

3. **Server Action - `requireAuth()`**
   - Validates access token presence
   - Redirects to login if unauthenticated
   - Used in Server Components to enforce authentication

**Security Features:**

- ✅ Server-only execution (credentials never in client bundle)
- ✅ Environment variables read from `process.env` (not `NEXT_PUBLIC_*`)
- ✅ Input validation and sanitization
- ✅ HttpOnly cookies (JavaScript cannot access)
- ✅ Secure flag in production (HTTPS-only)
- ✅ SameSite cookie attribute (CSRF protection)
- ✅ Automatic token expiration
- ✅ Safe error messages (no sensitive info leaked)

**Cookie Configuration:**

**File:** `src/lib/cookies.ts`

```typescript
const COOKIE_OPTIONS = {
  httpOnly: true, // XSS protection
  secure: process.env.NODE_ENV === "production", // HTTPS only in prod
  sameSite: "lax" as const, // CSRF protection
  path: "/", // Available app-wide
};
```

**Tokens Stored:**

- `access_token`: API authentication (default 1 hour expiration)
- `refresh_token`: Token renewal (7-day expiration for long-lived sessions)
- `id_token`: User identity (same expiration as access_token)
- `org_token`: Organization context (synced with access_token expiration)

**Token Refresh Mechanism:**

The application implements automatic access token refresh using the OAuth2 refresh token grant:

1. **Automatic Expiration Check**: Before each API call, the system checks if the access token is expired or expiring soon (60-second buffer)
2. **Silent Refresh**: If expired, the system automatically exchanges the refresh_token for a new access_token
3. **Transparent to Client**: Token refresh happens server-side; the client receives no interruption
4. **Graceful Degradation**: If refresh fails (e.g., refresh_token expired), user is logged out automatically

**Token Refresh Flow:**

```
┌─────────────────┐
│ API Request     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check Token     │ (isTokenExpired with 60s buffer)
│ Expiration      │
└────────┬────────┘
         │
         ├─ Still Valid ──────────────────┐
         │                                │
         └─ Expired/Expiring Soon ─┐     │
                                   │     │
                                   ▼     │
                          ┌──────────────┤
                          │ Refresh      │
                          │ Token        │
                          │ (grant_type: │
                          │ refresh_token│
                          └──────────────┤
                                   │     │
                          ┌────────┴──┐  │
                          │           │  │
                      Success    Failure │
                          │           │  │
                          ▼           ▼  ▼
                      ┌────────────────────┐
                      │ Proceed with API   │
                      │ Call (or Logout)   │
                      └────────────────────┘
```

#### Token Refresh Implementation

**Files:**

- `src/lib/auth.ts` - `refreshAccessToken()` function
- `src/lib/cookies.ts` - Token storage and retrieval
- `src/app/api/invoices/route.ts` - Automatic refresh before API calls

**Key Functions:**

1. **`isTokenExpired(token)`**
   - Decodes JWT token without verification
   - Checks expiration time (exp claim)
   - Adds 60-second buffer to refresh before actual expiration
   - Returns `true` if expired or invalid

2. **`refreshAccessToken()`**
   - Uses refresh_token to obtain new access_token
   - OAuth2 grant type: `refresh_token`
   - Clears cookies if refresh fails (security)
   - Fetches updated organization token from membership service
   - Updates all token cookies with new values
   - Returns `boolean` indicating success/failure

3. **`getValidAccessToken()` (in API routes)**
   - Called before each external API request
   - Checks if current token is expired
   - Automatically refreshes if needed
   - Returns valid access token or null

**Token Lifetime Details:**

```typescript
// Access Token
maxAge: expires_in || 3600 // seconds (typically 1 hour from OAuth2 server)

// Refresh Token
maxAge: 7 * 24 * 60 * 60 // 7 days (allows long-lived sessions)

// Refresh Buffer
60 seconds before actual expiration (proactive refresh)
```

**Cookie Configuration:**

```typescript
const COOKIE_OPTIONS = {
  httpOnly: true, // XSS protection
  secure: production_only, // HTTPS-only in production
  sameSite: "lax", // CSRF protection
  path: "/", // Available app-wide
  maxAge: varies, // Different for each token type
};
```

#### Middleware Protection

**File:** `src/middleware.ts`

The middleware provides automatic route protection:

```typescript
// Protected routes - require authentication
const protectedRoutes = ["/dashboard", "/invoices", "/customers", "/settings"];

// Public routes - accessible without auth
const publicRoutes = ["/login", "/register", "/forgot-password"];
```

**Middleware Functions:**

1. Extract `access_token` from cookies
2. Check if current route is protected
3. Redirect unauthenticated users to login
4. Redirect authenticated users away from login
5. Apply security headers to all responses

**Note:** Token expiration is checked at the API level (not middleware) to allow seamless refresh during active sessions

#### Login Page

**File:** `src/app/login/page.tsx`

**Features:**

- Client Component for interactivity
- Form state management with React hooks
- Calls server action for authentication
- Loading states and error handling
- Redirect after successful login
- Preserves original destination URL

**UI Elements:**

- Username input
- Password input (type="password")
- Submit button with loading state
- Error message display
- Responsive design with Tailwind CSS
- Dark mode support

---

### 2. Create Invoice

#### Architecture

Invoice creation uses a client-side modal with Formik for form management and Yup for validation. The form submits to a BFF API route that proxies requests to the external invoice service.

#### Create Invoice Flow

```
┌─────────┐                 ┌──────────────┐                 ┌─────────────┐
│ Browser │                 │  Next.js     │                 │ Invoice     │
│         │                 │  Server      │                 │ Service     │
└────┬────┘                 └──────┬───────┘                 └──────┬──────┘
     │                             │                                │
     │  1. Click "Create Invoice"  │                                │
     │     (Open Modal)            │                                │
     │                             │                                │
     │  2. Fill Form Fields        │                                │
     │     • Invoice Number        │                                │
     │     • Customer Info         │                                │
     │     • Line Items            │                                │
     │     • Bank Details          │                                │
     │                             │                                │
     │  3. Submit Form             │                                │
     │     POST /api/invoices      │                                │
     │     { invoices: [...] }     │                                │
     ├────────────────────────────>│                                │
     │                             │                                │
     │                             │  4. Extract tokens from        │
     │                             │     HttpOnly cookies           │
     │                             │     (access_token, org_token)  │
     │                             │                                │
     │                             │  5. Forward to Invoice Service │
     │                             │     POST /invoices             │
     │                             │     Headers:                   │
     │                             │       Authorization: Bearer    │
     │                             │       org-token: xxx           │
     │                             ├───────────────────────────────>│
     │                             │                                │
     │                             │  6. Process Invoice Creation   │
     │                             │     Validate data              │
     │                             │     Save to database           │
     │                             │                                │
     │                             │  7. Success Response           │
     │                             │<───────────────────────────────┤
     │                             │                                │
     │  8. Success Toast           │                                │
     │     "Invoice created!"      │                                │
     │<────────────────────────────┤                                │
     │                             │                                │
     │  9. Refresh Invoice List    │                                │
     │                             │                                │
```

#### Implementation Details

**Modal Component:** `src/components/invoices/CreateInvoiceModal.tsx`

**Form Structure:**

```typescript
interface InvoiceCreatePayload {
  // Basic Invoice Info
  invoiceNumber: string; // Required
  invoiceReference?: string; // Optional
  currency: string; // Required (default: "GBP")
  invoiceDate: string; // Required (ISO date)
  dueDate: string; // Required (ISO date, must be >= invoiceDate)
  description?: string; // Optional

  // Customer Information
  customer: {
    firstName: string; // Required, min 2 chars
    lastName: string; // Required, min 2 chars
    contact: {
      email: string; // Required, valid email
      mobileNumber?: string; // Optional
    };
    addresses: Array<{
      premise: string; // Required (building/street)
      city: string; // Required
      postcode: string; // Required
      countryCode: string; // Required (2-letter, e.g., "GB")
      county?: string; // Optional
      addressType: "BILLING" | "SHIPPING"; // Required
    }>;
  };

  // Bank Account (Optional)
  bankAccount?: {
    accountName: string;
    accountNumber: string;
    sortCode: string;
    bankId?: string;
  };

  // Line Items
  items: Array<{
    itemName: string; // Required, min 2 chars
    description: string; // Required
    quantity: number; // Required, positive integer
    rate: number; // Required, positive decimal
    itemReference?: string; // Optional
    itemUOM?: string; // Optional (unit of measure)
  }>;

  // Extensions (Discounts/Charges)
  extensions: Array<{
    addDeduct: "ADD" | "DEDUCT";
    value: number;
    type: "PERCENTAGE" | "FIXED_VALUE";
    name: string;
  }>;
}
```

**Validation Schema:** `src/lib/validations/invoice-schema.ts`

Uses Yup for comprehensive validation:

```typescript
export const invoiceValidationSchema = Yup.object().shape({
  invoiceNumber: Yup.string()
    .trim()
    .required("Invoice number is required")
    .min(3, "Invoice number must be at least 3 characters"),

  dueDate: Yup.date()
    .required("Due date is required")
    .min(Yup.ref("invoiceDate"), "Due date must be on or after invoice date"),

  customer: Yup.object().shape({
    firstName: Yup.string()
      .trim()
      .required("First name is required")
      .min(2, "First name must be at least 2 characters"),

    contact: Yup.object().shape({
      email: Yup.string()
        .trim()
        .required("Email is required")
        .email("Invalid email format"),
    }),

    addresses: Yup.array().min(1, "At least one address is required"),
  }),

  items: Yup.array()
    .of(
      Yup.object().shape({
        quantity: Yup.number()
          .required("Quantity is required")
          .positive("Quantity must be greater than 0")
          .integer("Quantity must be a whole number"),

        rate: Yup.number()
          .required("Rate is required")
          .positive("Rate must be greater than 0"),
      }),
    )
    .min(1, "At least one item is required"),
});
```

**BFF API Route:** `src/app/api/invoices/route.ts`

**POST Handler:**

```typescript
export async function POST(request: NextRequest) {
  try {
    // 1. Extract tokens from HttpOnly cookies
    const accessToken = await getAccessToken();
    const orgToken = await ensureOrgToken({ forceProfileLookup: true });

    // 2. Validate authentication
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!orgToken) {
      return NextResponse.json(
        { error: "Organization token not found" },
        { status: 403 },
      );
    }

    // 3. Parse request body
    const body = await request.json();

    // 4. Forward to external invoice service
    const response = await fetch(
      `${process.env.INVOICE_SERVICE_URL}/invoice-service/1.0.0/invoices`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "org-token": orgToken,
          "Operation-Mode": "SYNC",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );

    // 5. Return response to client
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

**Client-Side API Call:** `src/lib/api-client.ts`

```typescript
export const invoiceApi = {
  async create<T>(payload: { invoices: InvoiceCreatePayload[] }) {
    return apiFetch<T>("/api/invoices", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
```

#### User Experience

1. **Opening the Modal**
   - User clicks "Create Invoice" button on the invoice list page
   - Modal appears with empty form

2. **Form Sections**
   - **Invoice Details**: Number, reference, currency, dates, description
   - **Customer Information**: Name, email, phone, billing address
   - **Bank Account**: Optional bank details for payment
   - **Line Items**: Item name, description, quantity, rate
   - **Extensions**: Optional discounts or additional charges

3. **Validation**
   - Real-time validation on blur
   - Inline error messages below each field
   - Form-level validation on submit
   - Required fields marked with red asterisk

4. **Submission**
   - Submit button shows loading state
   - Form disabled during submission
   - Success toast notification on completion
   - Invoice list automatically refreshes
   - Modal closes and form resets

5. **Error Handling**
   - Network errors: "Failed to create invoice"
   - Validation errors: Field-specific messages
   - Server errors: Displayed in toast notification

#### Form Features

- **Formik Integration**: State management, validation, submission
- **Yup Validation**: Schema-based validation rules
- **Toast Notifications**: Success/error feedback
- **Responsive Design**: Works on mobile and desktop
- **Dark Mode**: Full dark mode support
- **Accessibility**: ARIA labels, keyboard navigation

---

### 3. List / Search / View Invoices

#### Architecture

The invoice listing feature uses a client component that fetches data from the BFF API. It supports pagination, sorting, filtering, and search capabilities.

#### Invoice List Flow

```
┌─────────┐                 ┌──────────────┐                 ┌─────────────┐
│ Browser │                 │  Next.js     │                 │ Invoice     │
│         │                 │  Server      │                 │ Service     │
└────┬────┘                 └──────┬───────┘                 └──────┬──────┘
     │                             │                                │
     │  1. Load Invoice List Page  │                                │
     │     GET /                   │                                │
     ├────────────────────────────>│                                │
     │                             │                                │
     │                             │  2. requireAuth() check        │
     │                             │     (Server Component)         │
     │                             │                                │
     │  3. HTML with Client        │                                │
     │     Component placeholder   │                                │
     │<────────────────────────────┤                                │
     │                             │                                │
     │  4. Client Component mounts │                                │
     │     Fetch invoices          │                                │
     │     GET /api/invoices       │                                │
     │     ?pageNum=1&pageSize=10  │                                │
     │     &sortBy=CREATED_DATE    │                                │
     │     &ordering=DESCENDING    │                                │
     ├────────────────────────────>│                                │
     │                             │                                │
     │                             │  5. Extract tokens from cookies│
     │                             │     (access_token, org_token)  │
     │                             │                                │
     │                             │  6. Forward to Invoice Service │
     │                             │     GET /invoices?...          │
     │                             ├───────────────────────────────>│
     │                             │                                │
     │                             │  7. Query database             │
     │                             │     Apply filters              │
     │                             │     Sort results               │
     │                             │     Paginate                   │
     │                             │                                │
     │                             │  8. Invoice List Response      │
     │                             │<───────────────────────────────┤
     │                             │                                │
     │  9. Render invoices         │                                │
     │<────────────────────────────┤                                │
     │                             │                                │
     │  10. User actions:          │                                │
     │      • Sort by column       │                                │
     │      • Search keyword       │                                │
     │      • Change page          │                                │
     │      • Filter by status     │                                │
     │      • View details         │                                │
     │                             │                                │
```

#### Implementation Details

**List Component:** `src/components/invoices/InvoiceListView.tsx`

**State Management:**

```typescript
const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [pageNum, setPageNum] = useState(1);
const [pageSize, setPageSize] = useState(10);
const [totalRecords, setTotalRecords] = useState(0);
const [sortBy, setSortBy] = useState<InvoiceSortBy>("CREATED_DATE");
const [ordering, setOrdering] = useState<InvoiceOrdering>("DESCENDING");
const [keyword, setKeyword] = useState("");
const [statusFilter, setStatusFilter] = useState<string>("");
```

**Query Parameters:**

```typescript
interface InvoiceQueryParams {
  fromDate?: string; // Filter by date range (ISO date)
  toDate?: string; // Filter by date range (ISO date)
  pageSize?: number; // Items per page (default: 10)
  pageNum?: number; // Current page (1-indexed)
  ordering?: "ASCENDING" | "DESCENDING"; // Sort direction
  sortBy?:
    | "INVOICE_DATE"
    | "STATUS"
    | "TOTAL_AMOUNT"
    | "DUE_AMOUNT"
    | "DUE_DATE"
    | "CREATED_DATE";
  status?: string; // Filter by status
  keyword?: string; // Search term
}
```

**Data Fetching:**

```typescript
useEffect(() => {
  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);

    const result = await invoiceApi.getAllWithQuery<InvoiceListResponse>({
      pageNum,
      pageSize,
      sortBy,
      ordering,
      keyword: keyword || undefined,
      status: statusFilter || undefined,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result.data) {
      const parsed = parseInvoiceResponse(result.data, pageNum, pageSize);
      setInvoices(parsed.items);
      setTotalRecords(parsed.totalRecords);
    }

    setLoading(false);
  };

  fetchInvoices();
}, [pageNum, pageSize, sortBy, ordering, keyword, statusFilter]);
```

**Response Normalization:**

The `parseInvoiceResponse()` function handles various response formats from the external service:

```typescript
function parseInvoiceResponse(
  payload: unknown,
  fallbackPageNum: number,
  fallbackPageSize: number,
): InvoiceListResult {
  const response = payload as Record<string, unknown>;

  // Extract data array
  const dataArray = Array.isArray(response.data) ? response.data : [];

  // Normalize each invoice item
  const rows: InvoiceRow[] = dataArray.map((item, idx) =>
    normalizeInvoiceItem(item, idx),
  );

  // Extract paging information
  const paging = response.paging || {};

  return {
    items: rows,
    pageNum: paging.pageNumber || fallbackPageNum,
    pageSize: paging.pageSize || fallbackPageSize,
    totalRecords: paging.totalRecords || rows.length,
    totalPages: Math.ceil((paging.totalRecords || rows.length) / pageSize),
  };
}
```

**Data Normalization:**

The `normalizeInvoiceItem()` function standardizes invoice data:

```typescript
function normalizeInvoiceItem(
  raw: Record<string, unknown>,
  index: number,
): InvoiceRow {
  return {
    id: String(raw.id || raw.invoiceId || raw.uid || `invoice-${index}`),
    invoiceNumber: String(raw.invoiceNumber || raw.invoiceNo || "N/A"),
    status: extractStatus(raw), // Handles various status formats
    customerName: extractCustomerName(raw), // Handles various customer formats
    currency: String(raw.currency || raw.currencyCode || "GBP"),
    totalAmount: Number(raw.totalAmount || raw.total || 0),
    createdDate: String(raw.createdDate || raw.createdAt),
    dueDate: String(raw.dueDate),
  };
}
```

#### UI Features

**Table Columns:**

1. **Invoice Number**: Clickable link to detail page
2. **Customer**: Customer name
3. **Status**: Badge with color coding
4. **Amount**: Currency and total amount
5. **Created**: Date created
6. **Due Date**: Payment due date
7. **Actions**: View details button

**Controls:**

1. **Create Invoice Button**
   - Opens modal for creating new invoice
   - Located at top right

2. **Search Input**
   - Debounced search (searches on typing pause)
   - Searches across invoice numbers, customer names

3. **Status Filter Dropdown**
   - Filter by invoice status (Paid, Unpaid, Overdue, etc.)
   - "All Status" option to clear filter

4. **Sort Controls**
   - Click column headers to sort
   - Toggle ascending/descending order
   - Sortable columns: Invoice Date, Status, Amount, Due Date, Created Date

5. **Pagination**
   - Previous/Next buttons
   - Page number display (e.g., "Page 1 of 5")
   - Page size selector (10, 25, 50, 100 items per page)

**Loading States:**

- Skeleton loader during initial fetch
- Spinner during refetch
- Disabled controls during loading

**Empty States:**

- "No invoices found" when list is empty
- "No invoices match your search" when search returns no results
- Prompt to create first invoice

**Error States:**

- Error message display
- Retry button
- Specific error messages for different error types

#### Invoice Detail View

**File:** `src/app/invoices/[id]/page.tsx`

**Implementation:**

- Server Component for SEO and performance
- Fetches single invoice by ID
- Displays all invoice fields in a structured layout
- "Back to Invoices" navigation link

**Data Fetching:**

```typescript
async function fetchInvoiceDetail(
  invoiceId: string,
): Promise<InvoiceDetailRecord | null> {
  const accessToken = await getAccessToken();
  const orgToken = await ensureOrgToken();

  const response = await fetch(
    `${process.env.INVOICE_SERVICE_URL}/invoice-service/1.0.0/invoices/${invoiceId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "org-token": orgToken,
        "Operation-Mode": "SYNC",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  return payload.data || payload;
}
```

**UI Layout:**

- Two-column grid for invoice fields
- Label and value pairs
- Formatted dates and currency
- Status badge
- Customer information section
- Line items table
- Bank account details (if available)

**Navigation:**

- URL pattern: `/invoices/[id]`
- Dynamic route parameter
- 404 page if invoice not found

---

## Security Architecture

### Security Principles

The application follows defense-in-depth security principles with multiple layers of protection:

1. **Server-Side Token Exchange**: OAuth2 authentication handled entirely on server
2. **HttpOnly Cookies**: Tokens stored securely, inaccessible to JavaScript
3. **BFF Pattern**: All external API calls proxied through Next.js
4. **Security Headers**: CSP, HSTS, XSS protection, clickjacking prevention
5. **Input Validation**: Server-side and client-side validation
6. **HTTPS Enforcement**: Secure flag on cookies in production

### Security Layers

#### 1. Transport Security

**HTTPS Enforcement:**

- Strict-Transport-Security header in production
- Secure flag on cookies (HTTPS-only)
- Automatic HTTP to HTTPS redirect

**Headers Applied:**

```typescript
// Prevent clickjacking
X-Frame-Options: DENY

// Prevent MIME sniffing
X-Content-Type-Options: nosniff

// Enable XSS filter
X-XSS-Protection: 1; mode=block

// Control referrer
Referrer-Policy: strict-origin-when-cross-origin

// Content Security Policy
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self' data:;
  connect-src 'self' https://*.101digital.io;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';

// Permissions Policy
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()

// HSTS (production only)
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

#### 2. Authentication Security

**OAuth2 Implementation:**

- Password grant flow for trusted first-party apps
- Server-side credential exchange
- Token stored in HttpOnly cookies
- Automatic token expiration
- Organization token for multi-tenancy

**Cookie Security:**

```typescript
{
  httpOnly: true,              // Cannot be accessed by JavaScript
  secure: true,                // HTTPS-only (production)
  sameSite: 'lax',            // CSRF protection
  path: '/',                   // Available app-wide
  maxAge: 3600,               // Auto-expire (seconds)
}
```

**Why HttpOnly Cookies?**

❌ **localStorage/sessionStorage** are vulnerable to:

- XSS attacks (any script can read them)
- No automatic expiration
- Accessible to all scripts on the page
- Cannot be marked secure or httpOnly

✅ **HttpOnly Cookies** provide:

- XSS protection (JavaScript cannot access)
- CSRF protection (with SameSite attribute)
- Automatic expiration
- Secure transmission (HTTPS-only)
- Server-side token management

#### 3. API Security (BFF Pattern)

**Why BFF?**

Traditional approach (❌ Insecure):

```
Browser → External API
(with token in request)
```

BFF approach (✅ Secure):

```
Browser → Next.js API → External API
(no token)   (with token from cookie)
```

**Benefits:**

- Tokens never reach browser
- Single security boundary
- Request/response transformation
- Consistent error handling
- Rate limiting possible
- Caching possible
- Token refresh logic centralized

**Implementation:**

All external API calls go through Next.js API routes:

```typescript
// ✅ CORRECT: Call internal API
const response = await fetch("/api/invoices");

// ❌ WRONG: Call external API directly
const response = await fetch("https://external-api.com/invoices", {
  headers: { Authorization: `Bearer ${token}` }, // Token in browser!
});
```

#### 4. Input Validation

**Client-Side Validation:**

- Formik + Yup for forms
- Real-time validation on blur
- Type checking with TypeScript
- Format validation (email, phone, dates)

**Server-Side Validation:**

- Input sanitization in server actions
- Type validation
- Length checks
- Format validation
- SQL injection prevention (using parameterized queries)

**Example:**

```typescript
// src/lib/auth.ts
export async function login(username: string, password: string) {
  // Input validation
  if (!username || !password) {
    return { success: false, error: "Username and password are required" };
  }

  // Sanitization
  const sanitizedUsername = username.trim();
  const sanitizedPassword = password.trim();

  if (sanitizedUsername.length === 0 || sanitizedPassword.length === 0) {
    return { success: false, error: "Username and password cannot be empty" };
  }

  // ... proceed with authentication
}
```

#### 5. Authorization

**Route Protection:**

- Middleware checks authentication on every request
- Protected routes require valid access token
- Automatic redirect to login if unauthenticated
- Server Components can enforce auth with `requireAuth()`

**Organization-Level Security:**

- Organization token (`org_token`) required for API calls
- Multi-tenancy support
- User can only access data for their organization

#### 6. Error Handling

**Safe Error Messages:**

- No sensitive information in error messages
- Generic errors for authentication failures
- Detailed errors logged server-side only
- User-friendly messages for UI

**Example:**

```typescript
// ❌ WRONG: Exposes sensitive info
return { error: "OAuth server returned 401: Invalid client_secret" };

// ✅ CORRECT: Safe error message
return { error: "Authentication failed. Please check your credentials." };
// Log detailed error server-side only
console.error("OAuth error:", detailedError);
```

### Security Checklist

✅ **Authentication**

- [x] OAuth2 password grant flow
- [x] Server-side token exchange
- [x] HttpOnly cookies for token storage
- [x] Automatic token expiration (1 hour)
- [x] Automatic token refresh (using 7-day refresh tokens)
- [x] Proactive refresh (60-second buffer before expiration)
- [x] Secure flag in production
- [x] SameSite cookie attribute
- [x] Token refresh on every API request

✅ **Authorization**

- [x] Middleware-based route protection
- [x] Server Component authentication checks
- [x] Organization-level access control

✅ **Transport Security**

- [x] HTTPS enforcement in production
- [x] Strict-Transport-Security header
- [x] Secure cookies

✅ **Application Security**

- [x] Content Security Policy (CSP)
- [x] XSS protection headers
- [x] Clickjacking protection (X-Frame-Options)
- [x] MIME sniffing prevention
- [x] Referrer policy

✅ **Input Validation**

- [x] Client-side validation (Formik + Yup)
- [x] Server-side validation
- [x] Input sanitization
- [x] Type checking (TypeScript)

✅ **API Security**

- [x] BFF pattern implementation
- [x] Token never exposed to client
- [x] Server-side token injection
- [x] CORS headers configured

✅ **Environment Security**

- [x] Secrets in server-only env vars
- [x] No NEXT*PUBLIC*\* for sensitive data
- [x] .env.local git-ignored
- [x] .env.example provided

✅ **Error Handling**

- [x] Safe error messages
- [x] No sensitive data in responses
- [x] Server-side error logging
- [x] Consistent error format

---

## Design Decisions

### 1. Framework Choice: Next.js 16.x App Router

**Decision:** Use Next.js with App Router instead of Pages Router or other frameworks.

**Rationale:**

- **Server Components**: Better performance, less JavaScript shipped to client
- **Server Actions**: Secure server-side operations without API routes
- **Built-in Middleware**: Easy route protection and security headers
- **File-based Routing**: Intuitive project structure
- **TypeScript Support**: First-class TypeScript integration
- **React 19**: Latest React features (Suspense, Concurrent Rendering)
- **SSR/SSG**: SEO benefits for public pages
- **Developer Experience**: Excellent DX with Fast Refresh

**Trade-offs:**

- Learning curve for App Router (newer than Pages Router)
- Some third-party libraries may not fully support App Router yet
- Need to understand client vs. server components

### 2. Authentication: Server-Side Token Exchange

**Decision:** Implement OAuth2 authentication entirely on the server using Server Actions.

**Rationale:**

- **Security**: Credentials and secrets never reach the browser
- **Token Protection**: HttpOnly cookies prevent XSS attacks
- **Simplified Client**: Client code doesn't need to handle authentication
- **Compliance**: Meets security best practices and compliance requirements
- **Session Management**: Server has full control over session lifecycle

**Alternatives Considered:**

- ❌ Client-side OAuth with localStorage: Vulnerable to XSS
- ❌ Third-party auth libraries: Added complexity, not needed for our use case
- ❌ Session-based auth with database: Adds database dependency for sessions

### 3. API Design: Backend-for-Frontend (BFF) Pattern

**Decision:** Proxy all external API calls through Next.js API routes.

**Rationale:**

- **Token Security**: Tokens extracted from HttpOnly cookies server-side
- **Consistency**: Single point for API logic, error handling, transformations
- **Flexibility**: Can add caching, rate limiting, request transformation
- **Monitoring**: Centralized logging and error tracking
- **CORS Management**: Avoid CORS issues with external APIs

**Alternatives Considered:**

- ❌ Direct API calls from client: Exposes tokens
- ❌ GraphQL gateway: Overkill for our simple use case
- ❌ Service mesh: Too complex for single app

### 4. Styling: Tailwind CSS v4

**Decision:** Use Tailwind CSS utility-first approach.

**Rationale:**

- **Rapid Development**: Build UIs quickly with utility classes
- **Consistency**: Design system built into framework
- **Dark Mode**: Built-in dark mode support
- **Performance**: Minimal CSS shipped (only used classes)
- **Customization**: Easy to customize with config
- **Responsive**: Mobile-first responsive utilities
- **Community**: Large community, extensive resources

**Alternatives Considered:**

- ❌ CSS Modules: More verbose, harder to maintain
- ❌ Styled Components: Runtime overhead, SSR complexity
- ❌ Plain CSS: Lacks consistency, hard to maintain at scale

### 5. Form Management: Formik + Yup

**Decision:** Use Formik for form state and Yup for validation.

**Rationale:**

- **Developer Experience**: Simplified form handling
- **Validation**: Schema-based validation with Yup
- **Error Handling**: Built-in error message management
- **Performance**: Optimized re-renders
- **Integration**: Works well with React hooks
- **Maturity**: Battle-tested, stable libraries

**Alternatives Considered:**

- ❌ React Hook Form: Different API, both are good choices
- ❌ Manual form handling: Too much boilerplate
- ❌ Uncontrolled forms: Harder to validate and manage

### 6. State Management: React Hooks

**Decision:** Use built-in React hooks (useState, useEffect) without global state library.

**Rationale:**

- **Simplicity**: No additional dependencies needed
- **Sufficient**: App state is localized to components
- **Performance**: No overhead from global state library
- **Learning Curve**: Standard React patterns

**Alternatives Considered:**

- ❌ Redux: Overkill for our simple state needs
- ❌ Zustand/Jotai: Not needed for component-level state
- ❌ Context API: Would add unnecessary complexity

### 7. TypeScript: Strict Mode

**Decision:** Enable TypeScript strict mode for all code.

**Rationale:**

- **Type Safety**: Catch errors at compile time
- **IDE Support**: Better autocomplete and refactoring
- **Documentation**: Types serve as inline documentation
- **Maintainability**: Easier to understand and modify code
- **Confidence**: Refactor with confidence

**Trade-offs:**

- Initial setup time for types
- Learning curve for team members unfamiliar with TypeScript

### 8. Package Manager: pnpm

**Decision:** Use pnpm instead of npm or yarn.

**Rationale:**

- **Disk Efficiency**: Content-addressable storage saves disk space
- **Speed**: Faster than npm, comparable to yarn
- **Strict**: Better dependency resolution
- **Monorepo Support**: Good for future scaling
- **Growing Adoption**: Increasingly popular in modern projects

### 9. Error Boundaries: Per-Component Approach

**Decision:** Handle errors at the component level with try-catch and error states.

**Rationale:**

- **Granular Control**: Each component handles its own errors
- **User Experience**: Errors don't crash entire app
- **Simplicity**: No additional error boundary components needed for simple cases

**Future Enhancement:**

- Could add React Error Boundaries for production error tracking

### 10. Data Fetching: Client-Side for Lists, Server-Side for Details

**Decision:** Use client-side fetching for interactive lists, server-side for detail pages.

**Rationale:**

- **Lists**: Need interactivity (search, sort, paginate) → Client Component
- **Details**: Can be pre-rendered for SEO → Server Component
- **Balance**: Optimizes for both UX and performance

---

## Implementation Details

### Project Structure

```
simple-invoice/
├── src/
│   ├── app/                      # App Router pages
│   │   ├── layout.tsx           # Root layout (metadata, fonts)
│   │   ├── page.tsx             # Home page (invoice list)
│   │   ├── globals.css          # Global styles
│   │   │
│   │   ├── login/               # Login page
│   │   │   └── page.tsx
│   │   │
│   │   ├── invoices/            # Invoice pages
│   │   │   └── [id]/
│   │   │       └── page.tsx     # Invoice detail (Server Component)
│   │   │
│   │   └── api/                 # BFF API routes
│   │       ├── invoices/
│   │       │   ├── route.ts     # GET/POST /api/invoices
│   │       │   └── [...path]/
│   │       │       └── route.ts  # Catch-all for sub-routes
│   │       └── membership/
│   │           └── [...path]/
│   │               └── route.ts
│   │
│   ├── components/               # React components
│   │   ├── Toast.tsx            # Toast notification
│   │   └── invoices/
│   │       ├── InvoiceListView.tsx    # Invoice list (Client)
│   │       └── CreateInvoiceModal.tsx # Create modal (Client)
│   │
│   ├── lib/                      # Utility libraries
│   │   ├── auth.ts              # Server actions (login, logout, requireAuth)
│   │   ├── cookies.ts           # Cookie management
│   │   ├── api-client.ts        # Client API utilities
│   │   ├── types.ts             # TypeScript types
│   │   ├── org-token.ts         # Organization token management
│   │   ├── service-url.ts       # Service URL builders
│   │   └── validations/
│   │       └── invoice-schema.ts # Yup validation schemas
│   │
│   ├── hooks/                    # Custom React hooks
│   │   └── useToast.ts          # Toast notification hook
│   │
│   └── middleware.ts             # Next.js middleware (auth, security)
│
├── public/                       # Static assets
│
├── .env.example                  # Environment template (committed)
├── .env.local                    # Actual secrets (git-ignored)
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.ts            # Tailwind configuration
├── postcss.config.mjs            # PostCSS configuration
├── eslint.config.mjs             # ESLint configuration
├── package.json                  # Dependencies
├── pnpm-lock.yaml                # Lock file
│
├── README.md                     # Quick start guide
├── SECURITY.md                   # Security documentation
├── IMPLEMENTATION.md             # Implementation summary
└── TECHNICAL_DOCUMENTATION.md    # This file
```

### Environment Configuration

**File:** `.env.local` (git-ignored)

```bash
# OAuth2 Configuration
OAUTH_TOKEN_URL=https://is-wso2-dev.101digital.io/t/101digital.core/oauth2/token
OAUTH_CLIENT_ID=your_client_id_here
OAUTH_CLIENT_SECRET=your_client_secret_here
OAUTH_SCOPE=openid

# External Service URLs
MEMBERSHIP_SERVICE_URL=https://membership.101digital.io
INVOICE_SERVICE_URL=https://invoice.101digital.io

# Session Secret (min 32 characters)
SESSION_SECRET=your_random_secret_here_min_32_chars
```

**Important:**

- ✅ DO commit `.env.example` with placeholder values
- ❌ NEVER commit `.env.local` with real credentials
- ✅ DO use `process.env.VARIABLE_NAME` for server-only vars
- ❌ NEVER use `NEXT_PUBLIC_*` prefix for secrets

### TypeScript Configuration

**File:** `tsconfig.json`

Key settings:

- `strict: true` - Enable all strict type checking options
- `noUncheckedIndexedAccess: true` - Add undefined to index signatures
- `esModuleInterop: true` - Better CommonJS/ESM interop
- Path aliases: `@/*` → `./src/*`

### Tailwind Configuration

**File:** `tailwind.config.ts`

- Content paths configured for all component files
- Dark mode: `class` strategy
- Default theme extended with custom colors
- Geist Sans and Geist Mono fonts configured

### Next.js Configuration

**File:** `next.config.ts`

```typescript
const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // ... more headers
        ],
      },
    ];
  },

  // Image optimization configuration
  images: {
    domains: [],
  },
};
```

---

## Data Flow

### Authentication Flow

```
┌──────────┐
│  User    │
└────┬─────┘
     │
     │ 1. Enter credentials
     ▼
┌────────────────────┐
│  Login Page        │  Client Component
│  (Client)          │  - Form state
└────┬───────────────┘  - Validation
     │
     │ 2. Call server action: login(username, password)
     ▼
┌────────────────────┐
│  auth.ts           │  Server Action
│  login()           │  - 'use server'
└────┬───────────────┘  - Server-only
     │
     │ 3. POST to OAuth2 server
     ▼
┌────────────────────┐
│  OAuth2 Server     │  External Service
│  (WSO2 IS)         │  - Validate credentials
└────┬───────────────┘  - Return tokens
     │
     │ 4. Tokens: { access_token, refresh_token, id_token, expires_in }
     ▼
┌────────────────────┐
│  auth.ts           │  Server Action
│  (continued)       │  - Fetch user profile
└────┬───────────────┘  - Extract org_token
     │
     │ 5. Store tokens in HttpOnly cookies
     ▼
┌────────────────────┐
│  cookies.ts        │  Server Utility
│  setAuthCookies()  │  - httpOnly: true
└────┬───────────────┘  - secure: true (prod)
     │                    - sameSite: 'lax'
     │
     │ 6. Return { success: true } (no tokens to client)
     ▼
┌────────────────────┐
│  Login Page        │  Client Component
│  (Client)          │  - Redirect to /
└────┬───────────────┘
     │
     │ 7. Redirect to home page
     ▼
┌────────────────────┐
│  Middleware        │  Next.js Middleware
│                    │  - Check access_token cookie
└────┬───────────────┘  - Allow access to protected route
     │
     │ 8. Render protected page
     ▼
┌────────────────────┐
│  Home Page         │  Server Component
│  (Server)          │  - requireAuth() check
└────────────────────┘  - Render invoice list
```

### Token Refresh Flow

The token refresh happens transparently whenever an API request is made. If the access token is expired or expiring soon (within 60 seconds), the system automatically exchanges the refresh token for a new access token.

```
┌──────────────────────┐
│  API Request         │  from Client/Server
│  (any endpoint)      │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────────────────────────────┐
│  getValidAccessToken()                       │  in API route
│  (src/app/api/invoices/route.ts)             │
└──────┬───────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────┐
│  getAccessToken()                            │  from cookies
└──────┬───────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────┐
│  isTokenExpired(token)                       │  check exp + 60s buffer
└──────┬───────────────────────────────────────┘
       │
       ├─── Valid ───────────────┐
       │                         │
       │                    ┌────▼──────────────────────┐
       │                    │  Proceed with API call    │
       │                    │  Using current token      │
       │                    └────┬─────────────────────┘
       │                         │
       └─── Expired/Expiring ─┐  │
                              │  │
                              ▼  ▼
                    ┌──────────────────────────────────────────┐
                    │  refreshAccessToken()                    │
                    │  (src/lib/auth.ts)                       │
                    └──────┬───────────────────────────────────┘
                           │
                           ▼
                    ┌──────────────────────────────────────────┐
                    │  OAuth2 Token Endpoint                   │
                    │  (POST /oauth2/token)                    │
                    │  grant_type: refresh_token               │
                    └──────┬───────────────────────────────────┘
                           │
                    ┌──────┴─────────────┐
                    │                    │
                 Success             Failure
                    │                    │
                    ▼                    ▼
            ┌─────────────────┐  ┌──────────────────┐
            │ New Token       │  │ Clear Cookies    │
            │ Received        │  │ & Log Out User   │
            │ (1 hour valid)  │  └──────────────────┘
            └────┬────────────┘
                 │
                 ▼
         ┌──────────────────────┐
         │ setAuthCookies()     │
         │ Update all tokens    │
         │ (including org_token)│
         └────┬─────────────────┘
              │
              ▼
         ┌────────────────────┐
         │ Proceed with API   │
         │ Using new token    │
         └────────────────────┘
```

**Key Features:**

1. **Proactive Refresh**: Tokens are refreshed 60 seconds before actual expiration
2. **Transparent**: Client experiences no interruption
3. **Automatic**: Happens on every API request automatically
4. **Graceful Failure**: If refresh fails, user is logged out for security
5. **Organization Token**: Updated along with access token

### Invoice Creation Flow

```
┌──────────┐
│  User    │
└────┬─────┘
     │
     │ 1. Click "Create Invoice"
     ▼
┌─────────────────────────┐
│  CreateInvoiceModal     │  Client Component
│  (Client)               │  - Open modal
└────┬────────────────────┘  - Render form
     │
     │ 2. Fill form fields
     │    - Invoice details
     │    - Customer info
     │    - Line items
     ▼
┌─────────────────────────┐
│  Formik                 │  Form Library
│  + Yup                  │  - Manage state
└────┬────────────────────┘  - Validate input
     │
     │ 3. Submit form
     ▼
┌─────────────────────────┐
│  CreateInvoiceModal     │  Client Component
│  handleSubmit()         │  - Clean up data
└────┬────────────────────┘  - Call API
     │
     │ 4. POST /api/invoices { invoices: [...] }
     ▼
┌─────────────────────────┐
│  /api/invoices/route.ts │  BFF API Route
│  POST handler           │  - Extract cookies
└────┬────────────────────┘  - Validate auth
     │
     │ 5. Read cookies: access_token, org_token
     ▼
┌─────────────────────────┐
│  cookies.ts             │  Server Utility
│  getAccessToken()       │  - Read from cookies
│  getOrgToken()          │  - Server-side only
└────┬────────────────────┘
     │
     │ 6. Tokens: { accessToken, orgToken }
     ▼
┌─────────────────────────┐
│  /api/invoices/route.ts │  BFF API Route
│  POST handler           │  - Add auth headers
│  (continued)            │  - Forward request
└────┬────────────────────┘
     │
     │ 7. POST to external service
     │    Headers: { Authorization: "Bearer ...", org-token: "..." }
     │    Body: { invoices: [...] }
     ▼
┌─────────────────────────┐
│  Invoice Service        │  External API
│  (External)             │  - Validate data
└────┬────────────────────┘  - Create invoice
     │                        - Return response
     │
     │ 8. Response: { data: { invoiceId, ... } }
     ▼
┌─────────────────────────┐
│  /api/invoices/route.ts │  BFF API Route
│  POST handler           │  - Return response
│  (continued)            │  - No transformation
└────┬────────────────────┘
     │
     │ 9. JSON response
     ▼
┌─────────────────────────┐
│  CreateInvoiceModal     │  Client Component
│  handleSubmit()         │  - Show success toast
│  (continued)            │  - Refresh list
└────┬────────────────────┘  - Close modal
     │
     │ 10. Success!
     ▼
┌─────────────────────────┐
│  InvoiceListView        │  Client Component
│  (Client)               │  - Refetch invoices
└─────────────────────────┘  - Display updated list
```

### Invoice List Fetching Flow

```
┌──────────┐
│  User    │
└────┬─────┘
     │
     │ 1. Navigate to home page
     ▼
┌─────────────────────────┐
│  Middleware             │  Next.js Middleware
│                         │  - Check auth
└────┬────────────────────┘  - Apply headers
     │
     │ 2. Access granted
     ▼
┌─────────────────────────┐
│  Home Page              │  Server Component
│  src/app/page.tsx       │  - requireAuth()
└────┬────────────────────┘  - Render layout
     │
     │ 3. Render client component
     ▼
┌─────────────────────────┐
│  InvoiceListView        │  Client Component
│  (Client)               │  - Mount component
└────┬────────────────────┘  - Run useEffect
     │
     │ 4. useEffect triggers fetch
     ▼
┌─────────────────────────┐
│  api-client.ts          │  Client Utility
│  invoiceApi.getAllWith │  - Build URL
│  Query()                │  - Add query params
└────┬────────────────────┘
     │
     │ 5. GET /api/invoices?pageNum=1&pageSize=10&sortBy=CREATED_DATE&ordering=DESCENDING
     ▼
┌─────────────────────────┐
│  /api/invoices/route.ts │  BFF API Route
│  GET handler            │  - Extract cookies
└────┬────────────────────┘  - Validate auth
     │
     │ 6. Read cookies: access_token, org_token
     ▼
┌─────────────────────────┐
│  cookies.ts             │  Server Utility
│  getAccessToken()       │  - Read from cookies
│  ensureOrgToken()       │  - Get or fetch org token
└────┬────────────────────┘
     │
     │ 7. Tokens: { accessToken, orgToken }
     ▼
┌─────────────────────────┐
│  /api/invoices/route.ts │  BFF API Route
│  GET handler            │  - Add auth headers
│  (continued)            │  - Forward request
└────┬────────────────────┘
     │
     │ 8. GET to external service
     │    Headers: { Authorization: "Bearer ...", org-token: "..." }
     │    Query: ?pageNum=1&pageSize=10&sortBy=CREATED_DATE...
     ▼
┌─────────────────────────┐
│  Invoice Service        │  External API
│  (External)             │  - Query database
└────┬────────────────────┘  - Apply filters
     │                        - Sort & paginate
     │                        - Return results
     │
     │ 9. Response: { data: [...], paging: { ... } }
     ▼
┌─────────────────────────┐
│  /api/invoices/route.ts │  BFF API Route
│  GET handler            │  - Return response
│  (continued)            │  - No transformation
└────┬────────────────────┘
     │
     │ 10. JSON response
     ▼
┌─────────────────────────┐
│  InvoiceListView        │  Client Component
│  fetchInvoices()        │  - Parse response
│  (continued)            │  - Normalize data
└────┬────────────────────┘  - Update state
     │
     │ 11. setState(invoices)
     ▼
┌─────────────────────────┐
│  InvoiceListView        │  Client Component
│  (Client)               │  - Render table
└─────────────────────────┘  - Display invoices
```

---

## API Design

### BFF API Routes

The application implements a Backend-for-Frontend (BFF) pattern where all external API calls are proxied through Next.js API routes.

#### Token Refresh in API Routes

All API routes that access external services automatically handle token refresh. Here's the standard pattern:

**Implementation Example:**

```typescript
import { isTokenExpired, refreshAccessToken } from "@/lib/auth";
import { getAccessToken, getOrgToken } from "@/lib/cookies";

// Helper function used in all API routes
async function getValidAccessToken(): Promise<string | null> {
  let accessToken = await getAccessToken();

  if (!accessToken) {
    return null;
  }

  // Check if token is expired (with 60-second buffer)
  if (await isTokenExpired(accessToken)) {
    // Automatically refresh the token
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      return null; // Refresh failed, user must re-login
    }
    // Get the new token after refresh
    accessToken = await getAccessToken();
  }

  return accessToken || null;
}

export async function GET(request: NextRequest) {
  try {
    // Get valid access token (auto-refreshes if needed)
    const accessToken = await getValidAccessToken();

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Proceed with API call using valid token
    const orgToken = await getOrgToken();
    const response = await fetch(externalServiceUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "org-token": orgToken,
      },
    });

    return NextResponse.json(await response.json());
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

**Key Points:**

1. Call `getValidAccessToken()` before making external API calls
2. If token is expired, it's automatically refreshed
3. If refresh fails (token expired beyond 7 days), user is logged out
4. The token refresh happens transparently
5. No client-side involvement needed

#### Invoice API Routes

**Base Route:** `/api/invoices`

**File:** `src/app/api/invoices/route.ts`

##### GET /api/invoices

**Purpose:** Fetch list of invoices with filtering, sorting, and pagination.

**Query Parameters:**

- `pageNum` (number): Page number (1-indexed)
- `pageSize` (number): Items per page
- `sortBy` (string): Sort field (CREATED_DATE, INVOICE_DATE, TOTAL_AMOUNT, etc.)
- `ordering` (string): Sort direction (ASCENDING, DESCENDING)
- `keyword` (string): Search term
- `status` (string): Filter by status
- `fromDate` (string): Date range start (ISO date)
- `toDate` (string): Date range end (ISO date)

**Request Example:**

```
GET /api/invoices?pageNum=1&pageSize=10&sortBy=CREATED_DATE&ordering=DESCENDING
```

**Response:**

```json
{
  "data": [
    {
      "id": "invoice-123",
      "invoiceNumber": "INV-2024-001",
      "status": "PAID",
      "customerName": "John Doe",
      "currency": "GBP",
      "totalAmount": 1250.0,
      "createdDate": "2024-01-15T10:30:00Z",
      "dueDate": "2024-02-15T00:00:00Z"
    }
    // ... more invoices
  ],
  "paging": {
    "pageNumber": 1,
    "pageSize": 10,
    "totalRecords": 45
  }
}
```

##### POST /api/invoices

**Purpose:** Create new invoice(s).

**Request Body:**

```json
{
  "invoices": [
    {
      "invoiceNumber": "INV-2024-002",
      "currency": "GBP",
      "invoiceDate": "2024-01-20",
      "dueDate": "2024-02-20",
      "customer": {
        "firstName": "Jane",
        "lastName": "Smith",
        "contact": {
          "email": "jane@example.com"
        },
        "addresses": [
          {
            "premise": "123 Main St",
            "city": "London",
            "postcode": "SW1A 1AA",
            "countryCode": "GB",
            "addressType": "BILLING"
          }
        ]
      },
      "items": [
        {
          "itemName": "Web Design Services",
          "description": "Homepage redesign",
          "quantity": 1,
          "rate": 1500.0
        }
      ]
    }
  ]
}
```

**Response:**

```json
{
  "status": "SUCCESS",
  "data": [
    {
      "id": "invoice-456",
      "invoiceId": "invoice-456",
      "invoiceNumber": "INV-2024-002"
      // ... full invoice details
    }
  ]
}
```

**Catch-All Route:** `/api/invoices/[...path]`

**File:** `src/app/api/invoices/[...path]/route.ts`

Handles sub-routes like:

- `GET /api/invoices/{id}` - Get single invoice
- `PUT /api/invoices/{id}` - Update invoice
- `DELETE /api/invoices/{id}` - Delete invoice

#### Membership API Routes

**Catch-All Route:** `/api/membership/[...path]`

**File:** `src/app/api/membership/[...path]/route.ts`

Handles membership service endpoints:

- `GET /api/membership/users/me` - Get current user profile
- `GET /api/membership/users/{id}` - Get user by ID
- Other membership-related endpoints

### Client API Utilities

**File:** `src/lib/api-client.ts`

**Base Fetch Wrapper:**

```typescript
async function apiFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: "include", // Send cookies
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.error || `Request failed with status ${response.status}`,
        details: data.details,
      };
    }

    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}
```

**Invoice API Client:**

```typescript
export const invoiceApi = {
  // Get all invoices
  async getAll<T>(params?: Record<string, string>) {
    const queryString = params
      ? "?" + new URLSearchParams(params).toString()
      : "";
    return apiFetch<T>(`/api/invoices${queryString}`);
  },

  // Get all with typed query params
  async getAllWithQuery<T>(params: InvoiceQueryParams) {
    const query = new URLSearchParams();

    if (params.sortBy) query.set("sortBy", params.sortBy);
    if (params.ordering) query.set("ordering", params.ordering);
    if (params.pageNum) query.set("pageNum", params.pageNum.toString());
    if (params.pageSize) query.set("pageSize", params.pageSize.toString());
    if (params.keyword) query.set("keyword", params.keyword);
    if (params.status) query.set("status", params.status);

    return apiFetch<T>(`/api/invoices?${query.toString()}`);
  },

  // Create invoice
  async create<T>(payload: { invoices: InvoiceCreatePayload[] }) {
    return apiFetch<T>("/api/invoices", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Get single invoice
  async getById<T>(id: string) {
    return apiFetch<T>(`/api/invoices/${id}`);
  },
};
```

### External Service URLs

Services are configured via environment variables and accessed through URL builder utilities.

**File:** `src/lib/service-url.ts`

```typescript
export function buildInvoiceServiceUrl(
  baseUrl: string,
  endpoint: string,
): string {
  return `${baseUrl}/invoice-service/1.0.0/${endpoint}`;
}

export function buildMembershipServiceUrl(
  baseUrl: string,
  endpoint: string,
): string {
  return `${baseUrl}/membership-service/1.0.0/${endpoint}`;
}
```

**External Services:**

1. **OAuth2 Server** (WSO2 Identity Server)
   - Token endpoint: `/oauth2/token`
   - User info endpoint: `/userinfo`

2. **Invoice Service**
   - Base path: `/invoice-service/1.0.0`
   - Endpoints:
     - `GET /invoices` - List invoices
     - `POST /invoices` - Create invoice
     - `GET /invoices/{id}` - Get invoice
     - `PUT /invoices/{id}` - Update invoice
     - `DELETE /invoices/{id}` - Delete invoice

3. **Membership Service**
   - Base path: `/membership-service/1.0.0`
   - Endpoints:
     - `GET /users/me` - Current user profile
     - `GET /users/{id}` - User by ID

---

## Assumptions

### Technical Assumptions

1. **OAuth2 Password Grant Flow**
   - Assumed that the application is a trusted first-party client
   - Password grant flow is acceptable for this use case
   - Client credentials can be securely stored server-side

2. **External Service Reliability**
   - Invoice service is available and responsive
   - Membership service provides consistent data format
   - OAuth2 server has high availability

3. **Network**
   - Application will be deployed in an environment with HTTPS
   - Stable network connection between Next.js server and external services
   - WebSocket connections not required

4. **Browser Compatibility**
   - Modern browsers with ES6+ support
   - JavaScript enabled
   - Cookies enabled
   - LocalStorage not required

5. **Data Format**
   - External services return JSON responses
   - Date formats are ISO 8601
   - Currency codes follow ISO 4217 (3-letter codes)
   - Country codes follow ISO 3166-1 alpha-2 (2-letter codes)

### Business Assumptions

1. **User Access**
   - Users have valid credentials for the OAuth2 system
   - Users belong to at least one organization
   - Users have permission to view and create invoices

2. **Invoice Data**
   - Invoice numbers are unique within an organization
   - Customers can have multiple addresses
   - Invoices can have multiple line items
   - Currency is required and defaults to GBP

3. **Organization Model**
   - Each user belongs to one or more organizations
   - Organization token (org_token) is required for API calls
   - Data is isolated per organization (multi-tenancy)

4. **Invoice Status**
   - Invoice status is provided by the external service
   - Status can be one of: Draft, Sent, Paid, Overdue, Cancelled
   - Status format may vary (string, object, array)

5. **Pagination**
   - Default page size is 10 items
   - Page numbers start at 1 (not 0)
   - Total record count is provided by the service

### Security Assumptions

1. **Environment**
   - Application will be deployed behind HTTPS in production
   - Server has secure environment variable storage
   - Server is not compromised

2. **Token Lifetime**
   - Access tokens expire within 1 hour (from OAuth2 server)
   - Refresh tokens expire after 7 days (long-lived session support)
   - Automatic token refresh is implemented and active
   - Token refresh happens proactively (60-second buffer before expiration)
   - Token refresh happens transparently during API calls
   - If refresh fails, user is logged out automatically

3. **Session Management**
   - Users remain logged in for up to 7 days (refresh token lifetime)
   - After 7 days without activity, user must re-authenticate
   - Active users experience seamless token refresh without interruption
   - Automatic token refresh on every API request (server-side)
   - Concurrent sessions are allowed (each session has independent cookies)

4. **Data Privacy**
   - Invoice data is not considered highly sensitive
   - No PCI DSS compliance required (no card data)
   - GDPR compliance handled by external services

### UI/UX Assumptions

1. **User Expectations**
   - Users are familiar with web applications
   - Invoice management is the primary use case
   - Dark mode is a nice-to-have feature

2. **Device Support**
   - Primary use case is desktop/laptop
   - Mobile support is secondary but functional
   - Tablet support follows mobile patterns

3. **Accessibility**
   - WCAG 2.1 AA compliance is a goal but not strictly enforced
   - Keyboard navigation is supported
   - Screen reader compatibility is basic

4. **Performance**
   - Initial page load under 3 seconds on 4G connection
   - Time to interactive under 5 seconds
   - List refresh under 1 second

### Operational Assumptions

1. **Deployment**
   - Application will be deployed on a Node.js-compatible platform
   - Environment variables can be securely configured
   - Build process runs in CI/CD pipeline

2. **Monitoring**
   - Server-side logging is available
   - Error tracking service can be integrated later
   - Performance monitoring is not critical for MVP

3. **Scaling**
   - Initial user base is small (< 100 concurrent users)
   - Stateless server allows horizontal scaling if needed
   - Database scaling handled by external services

4. **Maintenance**
   - Regular Next.js updates are planned
   - Security patches will be applied promptly
   - Feature enhancements based on user feedback

---

## Testing Considerations

### Unit Testing

**Recommended Tools:**

- **Jest**: Test runner
- **React Testing Library**: Component testing
- **MSW (Mock Service Worker)**: API mocking

**Test Coverage Recommendations:**

1. **Server Actions** (`src/lib/auth.ts`)
   - Test successful login
   - Test invalid credentials
   - Test missing environment variables
   - Test network errors
   - Test token storage

2. **API Routes** (`src/app/api/`)
   - Test authentication checks
   - Test token extraction from cookies
   - Test error handling
   - Test response transformation

3. **Components** (`src/components/`)
   - Test form validation
   - Test user interactions
   - Test error states
   - Test loading states

4. **Utilities** (`src/lib/`)
   - Test cookie management
   - Test API client functions
   - Test data normalization
   - Test validation schemas

### Integration Testing

**Recommended Tools:**

- **Playwright**: End-to-end testing
- **Cypress**: Alternative E2E framework

**Test Scenarios:**

1. **Authentication Flow**
   - User can login with valid credentials
   - User sees error message with invalid credentials
   - User is redirected to login when accessing protected route
   - User is redirected to dashboard after login

2. **Invoice Creation**
   - User can open create invoice modal
   - Form validation works correctly
   - Invoice is created successfully
   - Invoice list is refreshed after creation
   - Error handling works for API failures

3. **Invoice Listing**
   - Invoices are displayed in table
   - Pagination works correctly
   - Sorting works for each column
   - Search filters results
   - Status filter works

4. **Invoice Detail**
   - Detail page displays invoice data
   - Back button navigates to list
   - 404 page shown for non-existent invoice

### Security Testing

**Test Checklist:**

1. **Token Security**
   - [ ] Verify tokens are not in localStorage/sessionStorage
   - [ ] Verify tokens are in HttpOnly cookies
   - [ ] Verify secure flag is set in production
   - [ ] Verify SameSite attribute is set

2. **Authentication**
   - [ ] Verify unauthenticated users cannot access protected routes
   - [ ] Verify tokens expire correctly
   - [ ] Verify logout clears all cookies

3. **Authorization**
   - [ ] Verify org_token is required for API calls
   - [ ] Verify users can only access their organization's data

4. **Input Validation**
   - [ ] Verify client-side validation
   - [ ] Verify server-side validation
   - [ ] Test SQL injection prevention
   - [ ] Test XSS prevention

5. **Security Headers**
   - [ ] Verify CSP header is present
   - [ ] Verify HSTS header in production
   - [ ] Verify X-Frame-Options header
   - [ ] Verify X-Content-Type-Options header

### Manual Testing Checklist

**Authentication:**

- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Logout
- [ ] Access protected route without auth
- [ ] Refresh page while authenticated

**Invoice Creation:**

- [ ] Fill form with valid data
- [ ] Submit form
- [ ] Validate required fields
- [ ] Test email validation
- [ ] Test date validation (due date >= invoice date)
- [ ] Test numeric validation (quantity, rate)
- [ ] Submit with minimal required fields
- [ ] Submit with all optional fields
- [ ] Test error handling

**Invoice Listing:**

- [ ] View invoice list
- [ ] Sort by each column
- [ ] Toggle sort direction
- [ ] Search by keyword
- [ ] Filter by status
- [ ] Change page size
- [ ] Navigate between pages
- [ ] View invoice details
- [ ] Refresh list after creation

**UI/UX:**

- [ ] Test on desktop (1920x1080)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667)
- [ ] Test dark mode
- [ ] Test light mode
- [ ] Test loading states
- [ ] Test error states
- [ ] Test empty states

**Browser Compatibility:**

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## Deployment Considerations

### Environment Setup

1. **Environment Variables**
   - Copy `.env.example` to `.env.local`
   - Fill in all required values
   - Never commit `.env.local`
   - Use secure secret management in production

2. **Build Process**

   ```bash
   # Install dependencies
   pnpm install

   # Run linter
   pnpm lint

   # Build for production
   pnpm build

   # Start production server
   pnpm start
   ```

3. **Production Checklist**
   - [ ] HTTPS enabled
   - [ ] Environment variables configured
   - [ ] SESSION_SECRET is random and secure (min 32 chars)
   - [ ] OAuth credentials are for production environment
   - [ ] Service URLs point to production APIs
   - [ ] Error logging configured
   - [ ] Performance monitoring set up

### Hosting Options

**Recommended Platforms:**

1. **Vercel** (Recommended)
   - Built by Next.js creators
   - Automatic deployments from Git
   - Environment variable management
   - Edge functions support
   - Free tier available

2. **Netlify**
   - Good Next.js support
   - Git-based deployments
   - Environment variables
   - Free tier available

3. **AWS**
   - Deploy to EC2 or ECS
   - Use AWS Secrets Manager for env vars
   - CloudFront for CDN
   - More complex but flexible

4. **Docker**
   - Containerize the application
   - Deploy to Kubernetes or Docker Swarm
   - Good for on-premise deployment

### Docker Deployment

**Dockerfile Example:**

```dockerfile
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

**docker-compose.yml Example:**

```yaml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - OAUTH_TOKEN_URL=${OAUTH_TOKEN_URL}
      - OAUTH_CLIENT_ID=${OAUTH_CLIENT_ID}
      - OAUTH_CLIENT_SECRET=${OAUTH_CLIENT_SECRET}
      - OAUTH_SCOPE=${OAUTH_SCOPE}
      - MEMBERSHIP_SERVICE_URL=${MEMBERSHIP_SERVICE_URL}
      - INVOICE_SERVICE_URL=${INVOICE_SERVICE_URL}
      - SESSION_SECRET=${SESSION_SECRET}
    restart: unless-stopped
```

### Performance Optimization

1. **Build Optimization**
   - Enable React Compiler (experimental in Next.js 16)
   - Use `output: 'standalone'` for smaller Docker images
   - Optimize images with Next.js Image component

2. **Caching**
   - Add HTTP caching headers for static assets
   - Consider Redis for session storage in scaled environments
   - Cache API responses where appropriate

3. **Monitoring**
   - Set up error tracking (Sentry, LogRocket)
   - Monitor performance (New Relic, Datadog)
   - Track user analytics (Google Analytics, Plausible)

### Security in Production

1. **HTTPS**
   - Use TLS 1.2 or higher
   - Use strong cipher suites
   - Enable HSTS header

2. **Secrets Management**
   - Use platform-specific secret management
   - Rotate secrets regularly
   - Never log secrets

3. **Updates**
   - Keep dependencies up to date
   - Monitor security advisories
   - Apply patches promptly

4. **Rate Limiting**
   - Add rate limiting to API routes
   - Protect login endpoint from brute force
   - Use services like Cloudflare for DDoS protection

### Backup and Recovery

1. **Data Backup**
   - External services handle data backup
   - No application-level backup needed

2. **Disaster Recovery**
   - Document deployment process
   - Keep infrastructure as code
   - Test recovery procedures

---

## Future Enhancements

### Short-term (1-3 months)

1. **Token Refresh Enhancements** ✅ **Base Implementation Complete**
   - ✅ Automatic token refresh with refresh_token implemented
   - ✅ Silent token renewal before expiration active
   - ✅ Better session management with 7-day tokens
   - Future enhancements:
     - Add token refresh event listeners and logging
     - Implement token refresh failure notifications to user
     - Add session timeout warnings before expiration
     - Implement "Remember Me" functionality with optional longer-lived tokens

2. **Enhanced Error Handling**
   - React Error Boundaries for graceful error recovery
   - Better error messages with actionable steps
   - Error tracking integration (Sentry)

3. **Invoice Management**
   - Edit existing invoices
   - Delete invoices
   - Duplicate invoices
   - Send invoices via email

4. **Advanced Filtering**
   - Date range picker for filtering
   - Multiple status selection
   - Advanced search with multiple fields

5. **Export Functionality**
   - Export invoices to PDF
   - Export to CSV
   - Print invoices

### Medium-term (3-6 months)

1. **Dashboard**
   - Revenue analytics
   - Invoice status breakdown
   - Recent activity feed
   - Overdue invoice alerts

2. **Customer Management**
   - Customer list view
   - Customer detail view
   - Customer creation/editing
   - Link customers to invoices

3. **Payment Tracking**
   - Record payments
   - Payment history
   - Partial payment support
   - Payment reminders

4. **Invoice Templates**
   - Customizable invoice templates
   - Company logo upload
   - Custom fields
   - Multiple templates per organization

5. **Bulk Operations**
   - Bulk invoice creation from CSV
   - Bulk status updates
   - Bulk email sending

### Long-term (6+ months)

1. **Multi-currency Support**
   - Currency conversion
   - Exchange rate tracking
   - Multi-currency reports

2. **Recurring Invoices**
   - Schedule recurring invoices
   - Auto-generation
   - Subscription management

3. **Advanced Reporting**
   - Custom reports
   - Revenue forecasting
   - Tax reports
   - Export to accounting software

4. **Team Management**
   - Multiple users per organization
   - Role-based access control
   - Activity audit log
   - Team member invitations

5. **Mobile App**
   - Native iOS app
   - Native Android app
   - Invoice creation on mobile
   - Push notifications

6. **API for Third-party Integration**
   - Public API for integrations
   - Webhooks for events
   - API documentation
   - Developer portal

7. **AI Features**
   - Auto-fill invoice data
   - Smart categorization
   - Fraud detection
   - Payment prediction

---

## Conclusion

SimpleInvoice is a modern, secure invoice management application built with industry best practices in mind. The application demonstrates:

- **Security-first approach**: OAuth2, HttpOnly cookies, BFF pattern, automatic token refresh, security headers
- **Modern architecture**: Next.js 16 App Router, Server Components, Server Actions
- **Session management**: Automatic token refresh with 7-day refresh tokens
- **Developer experience**: TypeScript, Tailwind CSS, Formik, comprehensive documentation
- **User experience**: Responsive design, dark mode, intuitive UI, real-time validation

The architecture is designed to be maintainable, scalable, and secure. The modular structure allows for easy feature additions and modifications without compromising existing functionality.

### Key Strengths

1. **Security**: Comprehensive security measures at every layer, including automatic token refresh
2. **Session Management**: Extended 7-day sessions with automatic token refresh
3. **Maintainability**: Clean code structure, TypeScript, good documentation
4. **Scalability**: Stateless architecture, BFF pattern allows easy scaling
5. **User Experience**: Modern UI, responsive design, intuitive workflows
6. **Developer Experience**: Good tooling, clear patterns, well-documented

### Areas for Improvement

1. **Testing**: No automated tests currently implemented
2. **Error Tracking**: No error monitoring service integrated
3. **Token Refresh Monitoring**: Add logging and notifications for token refresh failures
4. **Performance Monitoring**: No performance tracking implemented
5. **Advanced Features**: Limited feature set (MVP)

### Recommendations for Reviewers

1. **Review Security Implementation**
   - Examine token management in `src/lib/auth.ts` and `src/lib/cookies.ts`
   - Review token refresh implementation with 60-second buffer
   - Verify middleware protection in `src/middleware.ts`
   - Check security headers configuration

2. **Examine Code Quality**
   - TypeScript type definitions in `src/lib/types.ts`
   - Component structure and organization
   - Error handling patterns
   - Token refresh flow in API routes

3. **Test Core Features**
   - Complete authentication flow
   - Create invoice workflow
   - Invoice list with filtering and sorting
   - View invoice detail
   - Test session persistence and token refresh

4. **Evaluate Architecture**
   - BFF pattern implementation with token refresh
   - Automatic token refresh in API routes
   - Server vs. Client component split
   - API route design with `getValidAccessToken()` pattern

5. **Consider Future Scalability**
   - How would token refresh monitoring be added?
   - How would role-based access control be added?
   - How would advanced features integrate?
   - How would cross-tab session synchronization work?

---

## Appendix

### Glossary

- **BFF**: Backend-for-Frontend - A pattern where a dedicated backend proxies requests to external services
- **CSP**: Content Security Policy - HTTP header that helps prevent XSS attacks
- **HSTS**: HTTP Strict Transport Security - Forces browsers to use HTTPS
- **HttpOnly**: Cookie flag that prevents JavaScript access
- **OAuth2**: Authorization framework for token-based authentication
- **Refresh Token**: Long-lived token (7 days) used to obtain new access tokens
- **SameSite**: Cookie attribute for CSRF protection
- **Server Action**: Next.js feature for server-side function execution
- **Server Component**: React component that renders only on the server
- **Token Expiration Buffer**: Proactive refresh window (60 seconds before actual expiration)
- **XSS**: Cross-Site Scripting - Security vulnerability allowing script injection

### References

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [OWASP Security Cheat Sheet](https://cheatsheetseries.owasp.org/)
- [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Contact

For questions about this implementation, please refer to:

- `README.md` - Quick start guide
- `SECURITY.md` - Security details
- `IMPLEMENTATION.md` - Implementation summary

---

**Document Version:** 1.0  
**Last Updated:** June 28, 2026  
**Author:** Development Team  
**Status:** Final
