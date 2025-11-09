# CityPulse Setup Guide

## Issues Identified & Solutions

### 🔴 Critical Issue: User Data Not Being Saved

**Root Cause**: Environment variables are not configured, causing the application to use in-memory storage instead of Supabase. Data is lost on every server restart.

---

## Quick Fix Guide

### Step 1: Configure Environment Variables

1. **Copy the example file:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Get your Supabase credentials:**
   - Go to: https://supabase.com/dashboard/project/bceawmcnwvxvffhmwibp/settings/api
   - Copy the following:
     - Project URL
     - Anon/Public Key
     - Service Role Key (IMPORTANT for user registration!)

3. **Edit `.env.local` and add:**
   ```env
   # Supabase Configuration (REQUIRED)
   NEXT_PUBLIC_SUPABASE_URL=https://bceawmcnwvxvffhmwibp.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
   
   # JWT Secret (REQUIRED)
   JWT_SECRET=your_secure_jwt_secret_here
   
   # Environment
   NODE_ENV=development
   ```

4. **Generate a secure JWT secret:**
   ```bash
   openssl rand -base64 32
   ```
   Copy the output and paste it as the `JWT_SECRET` value.

### Step 2: Setup Supabase Database

1. **Go to Supabase SQL Editor:**
   - https://supabase.com/dashboard/project/bceawmcnwvxvffhmwibp/editor

2. **Run the schema:**
   - Open `supabase/schema.sql`
   - Copy all contents
   - Paste into Supabase SQL Editor
   - Click "Run"

3. **Verify tables created:**
   - Check Table Editor in Supabase
   - Should see: `users`, `issues`, `comments`, `votes`

### Step 3: Fix RLS Policies (If User Creation Fails)

If you get authentication errors when registering users, run this:

1. **Open Supabase SQL Editor**
2. **Run this fix:**
   ```sql
   -- Drop existing restrictive policies
   DROP POLICY IF EXISTS "Service role full access" ON users;
   DROP POLICY IF EXISTS "Allow user registration" ON users;
   
   -- Create permissive policies for user registration
   CREATE POLICY "Allow user registration" ON users
     FOR INSERT WITH CHECK (true);
   
   CREATE POLICY "Allow user read" ON users
     FOR SELECT USING (true);
   
   CREATE POLICY "Allow user update" ON users
     FOR UPDATE USING (true);
   ```

### Step 4: Restart Development Server

```bash
# Kill any running processes
pkill -f "next dev"

# Clear Next.js cache
rm -rf .next

# Restart
npm run dev
```

---

## Verification Steps

### 1. Check Environment Variables

```bash
node -e "console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ SET' : '❌ NOT SET'); console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ SET' : '❌ NOT SET'); console.log('SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ SET' : '❌ NOT SET'); console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ SET' : '❌ NOT SET');"
```

### 2. Check Database Connection

Visit: http://localhost:3000/api/health

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "checks": {
    "database": {
      "status": "up",
      "responseTime": 50
    }
  }
}
```

### 3. Test User Registration

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test1234",
    "confirmPassword": "Test1234"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "id": "...",
    "name": "Test User",
    "email": "test@example.com",
    "role": "citizen"
  },
  "token": "eyJ..."
}
```

### 4. Verify User in Database

1. Go to Supabase Table Editor
2. Open `users` table
3. You should see the newly created user

---

## Common Issues & Solutions

### Issue: "Database not configured" error

**Solution:**
- Check `.env.local` exists and has correct Supabase credentials
- Restart the dev server: `npm run dev`

### Issue: "Failed to create user" error

**Solution:**
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
- This key is required to bypass RLS policies during user creation
- Run the RLS policy fix SQL from Step 3

### Issue: Data disappears after restart

**Solution:**
- This means you're using in-memory storage
- Check that Supabase credentials are properly configured
- Look for console message: "✅ Using Supabase database" (good) vs "⚠️ Using in-memory database" (bad)

### Issue: "Unauthorized" when creating issues

**Solution:**
- Ensure you're sending the JWT token in the Authorization header
- Format: `Authorization: Bearer YOUR_TOKEN_HERE`
- Get token from signup/login response

---

## Architecture Overview

### Authentication Flow

1. **User Registration (POST /api/auth/signup)**
   - Validates input
   - Hashes password with bcrypt
   - Creates user in Supabase using SERVICE_ROLE_KEY
   - Returns JWT token

2. **User Login (POST /api/auth/login)**
   - Validates credentials
   - Compares password with bcrypt
   - Returns JWT token

3. **Protected Routes**
   - Check Authorization header
   - Verify JWT token
   - Extract user info from token

### Database Layer

The app uses a smart database abstraction:

```
lib/db.ts → Detects if Supabase is configured
            ↓                    ↓
     YES: db-supabase.ts    NO: db-memory.ts
```

- **db-supabase.ts**: Real Supabase database (persistent)
- **db-memory.ts**: In-memory storage (temporary, for development)

### Key Files

- `lib/auth.ts` - JWT authentication utilities
- `lib/db.ts` - Database abstraction layer
- `lib/db-supabase.ts` - Supabase implementation
- `lib/supabase.ts` - Supabase client configuration
- `app/api/auth/signup/route.ts` - User registration endpoint
- `app/api/auth/login/route.ts` - User login endpoint

---

## Testing the Complete Flow

### 1. Register a New User

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "confirmPassword": "SecurePass123"
  }'
```

Save the returned token.

### 2. Create an Issue

```bash
curl -X POST http://localhost:3000/api/issues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Broken Streetlight",
    "description": "Streetlight not working",
    "category": "streetlight",
    "location": "Main Street",
    "latitude": 15.4909,
    "longitude": 73.8278
  }'
```

### 3. Get All Issues

```bash
curl http://localhost:3000/api/issues
```

### 4. Vote on an Issue

```bash
curl -X POST http://localhost:3000/api/issues/ISSUE_ID/vote \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Security Notes

⚠️ **IMPORTANT:**

1. **Never commit `.env.local` to Git** - It's already in `.gitignore`
2. **Never expose `SUPABASE_SERVICE_ROLE_KEY`** - This bypasses all security
3. **Always use strong JWT secrets in production** - Generate with `openssl rand -base64 32`
4. **Keep dependencies updated** - Run `npm audit` regularly

---

## Production Deployment (Vercel)

1. **Add Environment Variables in Vercel:**
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.local`

2. **Important for Production:**
   ```env
   NODE_ENV=production
   JWT_SECRET=<generate-new-strong-secret>
   NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   ```

3. **Verify Deployment:**
   - Check https://your-app.vercel.app/api/health
   - Should show database status as "up"

---

## Need Help?

If issues persist:

1. Check server logs: `npm run dev` output
2. Check browser console for errors
3. Check Supabase logs: https://supabase.com/dashboard/project/bceawmcnwvxvffhmwibp/logs
4. Verify RLS policies in Supabase Authentication settings

---

## Quick Commands Reference

```bash
# Start development server
npm run dev

# Check environment
node scripts/verify-env.js

# Test API endpoints
./test-endpoints.sh

# Clean and restart
./clean-and-start.sh

# Generate JWT secret
openssl rand -base64 32
```
