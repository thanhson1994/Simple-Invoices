# Simple Invoice

A secure invoicing web application built with Next.js 16.x, TypeScript, and Tailwind CSS v4, implementing industry-standard security best practices.

## 🔒 Security Features

This application implements comprehensive security measures following OWASP and Next.js best practices:

- ✅ **Server-side token exchange** - OAuth2 authentication handled entirely on the server
- ✅ **HttpOnly cookies** - Tokens stored securely, inaccessible to JavaScript (XSS protection)
- ✅ **Backend-for-Frontend (BFF) pattern** - All external API calls proxied through Next.js
- ✅ **Zero token exposure** - Tokens never reach the browser bundle
- ✅ **Security headers** - CSP, XSS protection, clickjacking prevention, HSTS
- ✅ **Environment isolation** - Secrets never exposed via NEXT*PUBLIC*\* variables
- ✅ **Input validation** - Server-side validation for all inputs
- ✅ **Authentication middleware** - Automatic protection for routes

**📖 For detailed security documentation, see [SECURITY.md](SECURITY.md)**

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd simple-invoice
pnpm install
```

### 2. Configure Environment

Copy the environment template and add your credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:

```bash
# DO NOT commit this file!
OAUTH_TOKEN_URL=https://your-auth-server.com/oauth2/token
OAUTH_CLIENT_ID=your_client_id
OAUTH_CLIENT_SECRET=your_client_secret
OAUTH_SCOPE=openid

MEMBERSHIP_SERVICE_URL=https://your-membership-service.com
INVOICE_SERVICE_URL=https://your-invoice-service.com

SESSION_SECRET=generate_a_random_secret_at_least_32_chars_long
```

**⚠️ IMPORTANT:** Never commit `.env.local` to version control!

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### 4. Test Authentication

1. Navigate to `/login`
2. Enter your credentials
3. Verify successful redirect to `/dashboard`
4. Check DevTools to confirm no tokens in localStorage/sessionStorage

## 🏗️ Project Structure

```
simple-invoice/
├── src/
│   ├── app/
│   │   ├── api/                  # BFF proxy routes
│   │   │   ├── invoices/         # Invoice service proxy
│   │   │   └── membership/       # Membership service proxy
│   │   ├── login/                # Login page
│   │   ├── dashboard/            # Protected dashboard
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── lib/
│   │   ├── auth.ts              # Server actions for auth
│   │   ├── cookies.ts           # Secure cookie utilities
│   │   └── api-client.ts        # Client-side API utilities
│   └── middleware.ts            # Auth & security middleware
├── .env.example                 # Environment template (commit)
├── .env.local                   # Actual secrets (git-ignored)
├── SECURITY.md                  # Security documentation
├── AGENTS.md                    # Agent guidelines
└── next.config.ts               # Security headers config
```

## 🔐 Security Architecture

### Authentication Flow

```
1. User submits credentials → Login Page (Client Component)
2. Server Action called → auth.ts (Server-only)
3. OAuth token exchange → External Auth Server
4. Tokens stored → HttpOnly cookies (Server)
5. Redirect to dashboard → User never sees tokens
```

### API Call Flow

```
Client Component
    ↓ fetch('/api/invoices')
Next.js BFF Route
    ↓ Read token from cookie (server-side)
External API
    ↓ Response
Next.js BFF Route
    ↓ Clean response (no tokens)
Client Component
```

## 📋 Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

## 🧪 Security Testing

### Verify Token Security

Open browser DevTools console and run:

```javascript
// Should return null - tokens not in storage
localStorage.getItem("access_token");
sessionStorage.getItem("access_token");
```

Check Application → Cookies → Verify `access_token` has:

- ✅ HttpOnly flag
- ✅ Secure flag (in production)
- ✅ SameSite=Lax

### Test Protected Routes

1. Access `/dashboard` while logged out → Redirects to `/login`
2. Login with valid credentials → Redirects to `/dashboard`
3. Logout → Clears cookies and redirects to `/login`

## 🛠️ Technologies

- **Framework:** Next.js 16.x (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Package Manager:** pnpm
- **Authentication:** OAuth2 Password Grant
- **Security:** HttpOnly cookies, CSP, HSTS, XSS protection

## 📚 Key Files

| File                                       | Purpose                              |
| ------------------------------------------ | ------------------------------------ |
| [`src/lib/auth.ts`](src/lib/auth.ts)       | Server actions for authentication    |
| [`src/lib/cookies.ts`](src/lib/cookies.ts) | Secure cookie management             |
| [`src/middleware.ts`](src/middleware.ts)   | Authentication & security middleware |
| [`src/app/api/`](src/app/api/)             | BFF proxy routes                     |
| [`SECURITY.md`](SECURITY.md)               | Complete security documentation      |

## 🚨 Security Best Practices

### ✅ DO

- Use server-only environment variables (no `NEXT_PUBLIC_*` for secrets)
- Store tokens in httpOnly cookies
- Call your own BFF API routes from the client
- Validate inputs on the server
- Use Server Actions for mutations
- Keep dependencies updated

### ❌ DON'T

- Store tokens in localStorage/sessionStorage
- Expose secrets in client bundle
- Call external APIs directly from client
- Trust client-side validation alone
- Commit `.env.local` to git
- Use `NEXT_PUBLIC_*` for sensitive data

## 📖 Learn More

- [Security Documentation](SECURITY.md) - Complete security guide
- [Next.js Documentation](https://nextjs.org/docs)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)

## 🤝 Contributing

Please ensure all security best practices are followed:

1. Never commit secrets or credentials
2. Use server-side code for sensitive operations
3. Test authentication flows
4. Update security documentation when needed

## 📄 License

[Your License Here]

---

**Security Note:** This application demonstrates production-ready security practices for Next.js applications. All credentials are handled server-side, tokens are stored in httpOnly cookies, and external API calls are proxied through the Next.js server.
