# 🔐 CityPulse Authentication & API Setup Guide

**Complete guide to authentication flow, API connections, and database integration**

---

## 📋 Table of Contents

1. [Quick Overview](#quick-overview)
2. [Authentication Architecture](#authentication-architecture)
3. [Setup Instructions](#setup-instructions)
4. [API Client Usage](#api-client-usage)
5. [Password Reset & Email Verification](#password-reset--email-verification)
6. [Protected Routes](#protected-routes)
7. [Database Connections](#database-connections)
8. [Testing Authentication](#testing-authentication)
9. [Troubleshooting](#troubleshooting)
</parameter>

---

## Quick Overview

CityPulse uses a **3-layer architecture** for clean separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
│  • contexts/auth-context.tsx (React Context)                │
│  • lib/api-client.ts (API Communication)                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     SERVER LAYER                            │
│  • app/api/* (Next.js API Routes)                           │
│  • lib/api-middleware.ts (Request Processing)               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  AUTHENTICATION LAYER                       │
│  • lib/auth.ts (JWT & Password Management)                  │
│  • lib/db.ts (Database Operations)                          │
└─────────────────────────────────────────────────────────────┘
```

### Key Features

✅ **JWT-based authentication** (7-day expiry)  
✅ **Secure cookie storage** (HTTP-only, SameSite: strict)  
✅ **Automatic token refresh** on API calls  
✅ **Role-based access control** (citizen, authority, admin)  
✅ **Session validation** (5-minute interval checks)  
✅ **Auto-retry on network errors** (3 attempts)  
✅ **Comprehensive error handling**  
✅ **CORS support** for cross-origin requests  
✅ **Password reset** via email (1-hour token expiry)  
✅ **Email verification** (24-hour token expiry)  

---

## Authentication Architecture

### Token Storage Strategy

**JWT Token:**
- Stored in: Secure HTTP cookie (`citypulse_auth_token`)
- Expiry: 7 days
- Security: SameSite=Strict, Secure (HTTPS only in production)

**User Data:**
- Stored in: localStorage (`citypulse_user_data`)
- Contains: Non-sensitive data only (name, email, role, avatar)
- Purpose: Quick access without decoding JWT

### Authentication Flow

#### 1. Signup/Login Flow

```
User submits credentials
        ↓
Frontend (contexts/auth-context.tsx)
        ↓
API Client (lib/api-client.ts)
        ↓
API Route (app/api/auth/login/route.ts)
        ↓
Auth Service validates credentials (lib/auth.ts)
        ↓
Database lookup (lib/db.ts → Supabase or in-memory)
        ↓
JWT Token generated
        ↓
Token → Secure cookie
User data → localStorage
        ↓
Redirect to dashboard
```

#### 2. Authenticated Request Flow

```
User makes request (e.g., create issue)
        ↓
API Client auto-adds Authorization header
        ↓
API Route receives request
        ↓
Middleware validates JWT (lib/api-middleware.ts)
        ↓
Token verified (lib/auth.ts)
        ↓
User object attached to request
        ↓
Route handler processes request
        ↓
Response returned to client
```

#### 3. Session Expiry Flow

```
User session expires (after 7 days)
        ↓
Next API request receives 401 Unauthorized
        ↓
API Client clears tokens
        ↓
User redirected to /login?session_expired=true
        ↓
User must re-authenticate
```

---

## Setup Instructions

### 1. Environment Variables

Create `.env.local` file:

```bash
# CRITICAL - Required for production
JWT_SECRET=your_secure_jwt_secret_here_change_in_production
NEXT_PUBLIC_APP_URL=http://localhost:3000

# RECOMMENDED - For data persistence
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OPTIONAL - For AI features
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash

# OPTIONAL - For maps
NEXT_PUBLIC_MAPTILER_API_KEY=your_maptiler_key
```

**Generate JWT Secret:**

```bash
openssl rand -base64 32
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Verify Environment

```bash
npm run verify-env
```

### 4. Start Development Server

```bash
npm run dev
```

### 5. Run Integration Tests

```bash
# In another terminal
npm run test:integration
```

---

## API Client Usage

### Importing the API Client

```typescript
import api from '@/lib/api-client';
```

### Authentication Operations

#### Signup

```typescript
const result = await api.auth.signup({
  name: "John Doe",
  email: "john@example.com",
  password: "SecurePass123",
  confirmPassword: "SecurePass123"
});

if (result.success) {
  console.log("User created:", result.user);
  console.log("Token:", result.token);
  // Token is automatically stored in cookies
} else {
  console.error("Signup failed:", result.error);
}
```

#### Login

```typescript
const result = await api.auth.login({
  email: "john@example.com",
  password: "SecurePass123"
});

if (result.success) {
  console.log("Logged in:", result.user);
  // Automatically redirected or update UI
} else {
  console.error("Login failed:", result.error);
}
```

#### Logout

```typescript
api.auth.logout();
// Clears tokens and redirects to /login
```

#### Check Session

```typescript
const isValid = await api.auth.checkSession();
if (!isValid) {
  console.log("Session expired, please log in again");
}
```

### Issue Operations

#### Create Issue

```typescript
const response = await api.issues.create({
  title: "Pothole on Main Street",
  description: "Large pothole causing traffic problems",
  category: "pothole",
  location: "Main St & 5th Ave",
  coordinates: { lat: 15.4909, lng: 73.8278 },
  photoUrl: "https://cloudinary.com/..."
});

if (response.success) {
  console.log("Issue created:", response.data);
}
```

#### Get All Issues (with filters)

```typescript
const response = await api.issues.getAll({
  status: "open",
  category: "pothole",
  priority: "high",
  sortBy: "createdAt",
  sortOrder: "desc",
  limit: 20,
  offset: 0
});

if (response.success) {
  console.log("Issues:", response.data.issues);
  console.log("Total:", response.data.total);
}
```

#### Get Single Issue

```typescript
const response = await api.issues.getById("issue-123");

if (response.success) {
  console.log("Issue:", response.data);
}
```

#### Update Issue

```typescript
const response = await api.issues.update("issue-123", {
  status: "in-progress",
  priority: "high"
});
```

#### Delete Issue

```typescript
const response = await api.issues.delete("issue-123");
```

### Comment Operations

```typescript
// Get comments
const comments = await api.comments.getByIssueId("issue-123");

// Add comment
const newComment = await api.comments.create("issue-123", {
  content: "This is a serious issue!"
});

// Delete comment
await api.comments.delete("issue-123", "comment-456");
```

### Vote Operations

```typescript
// Toggle vote (upvote/remove vote)
const result = await api.votes.toggle("issue-123");

if (result.success) {
  console.log("Voted:", result.data.voted);
  console.log("Total votes:", result.data.votes);
}

// Get vote status
const status = await api.votes.getStatus("issue-123");
```

### AI Categorization

```typescript
const result = await api.ai.categorize({
  title: "Big hole in the road",
  description: "There's a dangerous hole on Main Street",
  location: "Main St & 5th Ave"
});

if (result.success) {
  console.log("Category:", result.data.category); // "pothole"
  console.log("Priority:", result.data.priority); // "high"
  console.log("Confidence:", result.data.confidence); // 0.95
}
```

### File Upload

```typescript
const file = document.querySelector('input[type="file"]').files[0];
const result = await api.upload.uploadImage(file);

if (result.success) {
  console.log("Image URL:", result.data.url);
}
```

---

## Password Reset & Email Verification

### Forgot Password Flow

**1. User requests password reset:**

```typescript
import api from '@/lib/api-client';

const result = await api.auth.forgotPassword("user@example.com");

if (result.success) {
  console.log("Reset email sent!");
  // Show success message to user
}
```

**2. User clicks link in email:**
- Link format: `https://yourapp.com/reset-password?token=abc123...`
- Token valid for 1 hour

**3. User enters new password:**

```typescript
const result = await api.auth.resetPassword({
  token: "abc123...",
  password: "NewSecurePass123",
  confirmPassword: "NewSecurePass123"
});

if (result.success) {
  // Redirect to login
  router.push("/login");
}
```

### Email Verification Flow

**1. Send verification email (after signup):**

```typescript
const result = await api.auth.sendVerificationEmail("user@example.com");

if (result.success) {
  console.log("Verification email sent!");
}
```

**2. User clicks verification link:**
- Link format: `https://yourapp.com/verify-email?token=xyz789...`
- Token valid for 24 hours

**3. Email automatically verified:**
- The `/verify-email` page handles verification automatically
- User is redirected to dashboard after success

### Using the UI Pages

**Forgot Password Page:**
- URL: `/forgot-password`
- Accessible from login page via "Forgot password?" link
- User enters email → receives reset link
- Clean, professional UI with success/error states

**Reset Password Page:**
- URL: `/reset-password?token=...`
- Validates token before showing form
- Password strength requirements enforced
- Shows success message and redirects to login

**Email Verification Page:**
- URL: `/verify-email?token=...`
- Automatically processes verification on load
- Shows success/failure states
- Option to resend verification email

### API Endpoints

```typescript
// Forgot password
POST /api/auth/forgot-password
Body: { email: string }

// Reset password
POST /api/auth/reset-password
Body: { token: string, password: string, confirmPassword: string }

// Verify reset token
GET /api/auth/reset-password?token=xyz

// Send verification email
POST /api/auth/verify-email
Body: { email: string }

// Verify email
GET /api/auth/verify-email?token=xyz
```

### Security Features

✅ **Token expiry:** Reset tokens expire after 1 hour, verification after 24 hours  
✅ **One-time use:** Tokens are invalidated after successful use  
✅ **Email enumeration protection:** Same response whether email exists or not  
✅ **Password validation:** Enforces strong password requirements  
✅ **Secure token generation:** Cryptographically secure random tokens  

### Development vs Production

**Development Mode:**
- Reset/verification links are logged to console
- No actual emails sent (unless configured)
- Easy testing without email service

**Production Mode:**
- Replace console.log with actual email service (Resend, SendGrid, etc.)
- Uncomment email sending code in API routes
- Set up email templates

---

## Protected Routes

### Using Auth Context in Components

```typescript
import { useAuth } from '@/contexts/auth-context';

function MyComponent() {
  const { 
    user, 
    isLoading, 
    isAuthenticated, 
    login, 
    logout,
    refreshUser,
    checkSession
  } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h1>Welcome, {user?.name}!</h1>
      <p>Role: {user?.role}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Protecting Pages with Middleware

Create `middleware.ts` in project root:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard', '/report', '/admin'];
const authRoutes = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('citypulse_auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Redirect to login if accessing protected route without token
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect to dashboard if accessing auth pages with token
  if (authRoutes.some(route => pathname.startsWith(route)) && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## Database Connections

### Auto-Switching Database Layer

CityPulse automatically chooses between Supabase and in-memory storage:

```typescript
// lib/db.ts
const useSupabase = isSupabaseConfigured();
export const userDb = useSupabase ? supabaseDb.userDb : memoryDb.userDb;
export const issueDb = useSupabase ? supabaseDb.issueDb : memoryDb.issueDb;
```

**Priority:**
1. ✅ Supabase (if both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set)
2. ⚠️ In-memory fallback (data lost on server restart)

### Using Database Operations

```typescript
import { userDb, issueDb, commentDb, voteDb } from '@/lib/db';

// User operations
const user = await userDb.create({
  name: "John Doe",
  email: "john@example.com",
  password: "hashedPassword",
  role: "citizen"
});

const foundUser = await userDb.findByEmail("john@example.com");
const userById = await userDb.findById("user-123");

// Issue operations
const issue = await issueDb.create({
  title: "Test Issue",
  description: "Description",
  category: "pothole",
  location: "Main St",
  coordinates: { lat: 15.49, lng: 73.82 },
  userId: "user-123"
});

const allIssues = await issueDb.getAll();
const issue = await issueDb.findById("issue-123");
```

### Supabase Setup

1. Create account at https://supabase.com
2. Create new project
3. Run SQL migrations (see `SUPABASE_SETUP_GUIDE.md`)
4. Copy project URL and anon key
5. Add to `.env.local`

---

## Testing Authentication

### Automated Tests

```bash
npm run test:integration
```

This tests:
- Environment configuration
- Database connectivity
- Health check endpoint
- User signup flow
- User login flow
- JWT token generation
- Protected route access
- Issue CRUD operations

### Manual Testing with cURL

**Signup:**

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123",
    "confirmPassword": "TestPass123"
  }'
```

**Login:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

**Protected Route (replace TOKEN):**

```bash
curl http://localhost:3000/api/user \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Create Issue:**

```bash
curl -X POST http://localhost:3000/api/issues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "title": "Test Issue",
    "description": "Testing API",
    "category": "other",
    "location": "Test Location",
    "coordinates": { "lat": 15.4909, "lng": 73.8278 }
  }'
```

**Forgot Password:**

```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Reset Password (replace TOKEN):**

```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token":"YOUR_RESET_TOKEN",
    "password":"NewPass123",
    "confirmPassword":"NewPass123"
  }'
```

**Send Verification Email:**

```bash
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

---

## Troubleshooting

### Issue: "JWT_SECRET not set" error

**Solution:**
```bash
# Generate a secret
openssl rand -base64 32

# Add to .env.local
echo "JWT_SECRET=<your-generated-secret>" >> .env.local

# Restart server
npm run dev
```

### Issue: Session expires immediately

**Possible causes:**
- JWT_SECRET changed between requests
- Clock skew on server
- Cookie not being set properly

**Solution:**
```typescript
// Check browser DevTools → Application → Cookies
// Should see: citypulse_auth_token

// Check JWT expiry
import jwt from 'jsonwebtoken';
const decoded = jwt.decode(token);
console.log(decoded.exp); // Should be 7 days in future
```

### Issue: "Database connection failed"

**For Supabase:**
- Verify URL and key in `.env.local`
- Check Supabase project is not paused
- Ensure tables exist (run migrations)

**For In-Memory:**
- Restart server
- Data is lost on restart (expected behavior)

### Issue: CORS errors in production

**Solution:**
```typescript
// Ensure NEXT_PUBLIC_APP_URL is set correctly
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

// API client will use relative URLs automatically
```

### Issue: "Rate limit exceeded"

The API has built-in rate limiting:
- Auth endpoints: 5 requests per 15 minutes
- Regular endpoints: 100 requests per minute

**Solution:**
- Wait for rate limit window to reset
- Check `Retry-After` header in response
- Implement client-side rate limiting

### Issue: Protected routes accessible without auth

**Check:**
1. Middleware is properly configured
2. Token is being sent in Authorization header
3. JWT_SECRET matches between sign and verify

```typescript
// Debug middleware
export function middleware(request: NextRequest) {
  console.log('Path:', request.nextUrl.pathname);
  console.log('Token:', request.cookies.get('citypulse_auth_token'));
  // ...rest of middleware
}
```

---

## API Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200000
Retry-After: 60
```

---

## Security Best Practices

✅ **DO:**
- Use HTTPS in production
- Generate strong JWT secrets (32+ characters)
- Validate all user inputs
- Use prepared statements for database queries
- Implement rate limiting
- Log authentication events
- Use secure cookie flags (HttpOnly, Secure, SameSite)

❌ **DON'T:**
- Hardcode JWT_SECRET in code
- Store sensitive data in localStorage
- Send passwords in URL parameters
- Trust client-side validation alone
- Store JWTs in localStorage (use cookies instead)
- Expose detailed error messages in production

---

## Additional Resources

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md) - Database setup
- [API Documentation](./DEPLOYMENT_GUIDE.md#api-endpoints-reference) - Full API reference
- [Next.js Docs](https://nextjs.org/docs) - Framework documentation

---

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section above
2. Run `npm run test:integration` to diagnose issues
3. Check browser console and server logs
4. Verify environment variables with `npm run verify-env`

---

## Quick Reference Card

### New Features Added

| Feature | Endpoint | Page | Description |
|---------|----------|------|-------------|
| Forgot Password | `POST /api/auth/forgot-password` | `/forgot-password` | Request password reset link |
| Reset Password | `POST /api/auth/reset-password` | `/reset-password?token=...` | Set new password with token |
| Send Verification | `POST /api/auth/verify-email` | - | Send email verification link |
| Verify Email | `GET /api/auth/verify-email?token=...` | `/verify-email?token=...` | Confirm email address |

### User Journey

**Signup → Verify Email → Login → Use App**

1. User signs up at `/signup`
2. (Optional) System sends verification email
3. User clicks verification link → `/verify-email?token=...`
4. Email verified, user can now access all features

**Forgot Password → Reset → Login**

1. User clicks "Forgot password?" on `/login`
2. User enters email at `/forgot-password`
3. User receives reset link via email
4. User clicks link → `/reset-password?token=...`
5. User enters new password
6. User redirected to `/login` with new password

---

**Last Updated:** January 2025  
**Version:** 2.0.0  
**Status:** Production Ready ✅  
**New Features:** Password Reset & Email Verification