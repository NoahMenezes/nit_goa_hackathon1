# Citizen Signup Issue - Diagnosis and Fix

## 🔴 CRITICAL ISSUE IDENTIFIED

**Problem**: Citizens cannot sign up because the Citizen Database Service Role Key is not properly configured.

## 📋 Root Cause Analysis

### Issue Location
File: `app/api/auth/signup/route.ts` (Lines 57-65)

```typescript
const supabaseClient = getSupabaseClientByRole(role, true);

if (!supabaseClient) {
  console.error(`No Supabase client available for ${role} database`);
  return NextResponse.json(
    {
      success: false,
      error: `Database configuration error for ${role} database. Please contact support.`,
    } as AuthResponse,
    { status: 500 },
  );
}
```

### Why It Fails
1. The signup endpoint uses `getSupabaseClientByRole(role, true)` where `true` means "use service role key"
2. Service role keys are required for server-side operations like creating users
3. The citizen database service role client (`citizenSupabaseAdmin`) is created in `lib/supabase.ts` (Line 153-161)
4. If `SUPABASE_CITIZEN_SERVICE_ROLE_KEY` is missing or invalid, `citizenSupabaseAdmin` becomes `null`
5. When the signup endpoint checks for the client, it finds `null` and returns an error

## ✅ SOLUTION

### Step 1: Verify Environment Variables

Check your `.env.local` file has ALL THREE citizen database keys:

```env
# CITIZEN Database (Required for signups)
NEXT_PUBLIC_SUPABASE_CITIZEN_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_CITIZEN_ANON_KEY=your_anon_key_here
SUPABASE_CITIZEN_SERVICE_ROLE_KEY=your_service_role_key_here  # ⚠️ CRITICAL - THIS IS OFTEN MISSING!
```

### Step 2: Get the Service Role Key

1. Go to your Supabase Citizen Database project: https://supabase.com/dashboard
2. Navigate to **Settings** → **API**
3. Find the **Project API keys** section
4. Copy the **`service_role` secret** key (⚠️ NOT the anon key!)
5. Add it to your `.env.local` as `SUPABASE_CITIZEN_SERVICE_ROLE_KEY`

### Step 3: Restart the Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

## 🔍 Verification Steps

### 1. Check Configuration Status

Visit: `http://localhost:3000/api/health`

Look for the citizen database status:
```json
{
  "supabase": {
    "citizen": {
      "configured": true,
      "hasUrl": true,
      "hasAnonKey": true,
      "hasServiceKey": true,  // ⚠️ This should be TRUE
      "urlValid": true
    }
  }
}
```

### 2. Test Signup

1. Go to: `http://localhost:3000/signup`
2. Fill in the form with:
   - Full Name: Test User
   - Email: test@example.com
   - Account Type: User (Citizen)
   - Password: testpassword123
   - Confirm Password: testpassword123
3. Click "Create Account"
4. You should be redirected to `/dashboard`

### 3. Check Server Logs

Look for these success messages in your terminal:
```
Signup attempt for citizen database: test@example.com
Checking if user exists in citizen database: test@example.com
User does not exist in citizen database, proceeding with signup
Creating user in citizen database with role: citizen
✅ User created successfully in citizen database: test@example.com with ID: ...
```

## 🚨 Common Errors and Fixes

### Error: "Database configuration error for citizen database"
**Cause**: `SUPABASE_CITIZEN_SERVICE_ROLE_KEY` is missing or invalid
**Fix**: Add the correct service role key from Supabase dashboard

### Error: "relation 'users' does not exist"
**Cause**: Database tables haven't been created
**Fix**: Run the database migration:
```bash
# In your Supabase SQL Editor, run:
-- See supabase/migrations/create_tables.sql
```

### Error: "Failed to create user in citizen database: permission denied"
**Cause**: Using anon key instead of service role key
**Fix**: Double-check you copied the SERVICE_ROLE key (not the anon key)

### Error: "JWT expired" or "Invalid JWT"
**Cause**: Old JWT_SECRET or expired token
**Fix**: 
```env
# Generate new secret
JWT_SECRET=$(openssl rand -base64 32)
# Restart server
```

## 📊 Complete Configuration Checklist

- [ ] `NEXT_PUBLIC_SUPABASE_CITIZEN_URL` is set
- [ ] `NEXT_PUBLIC_SUPABASE_CITIZEN_ANON_KEY` is set
- [ ] `SUPABASE_CITIZEN_SERVICE_ROLE_KEY` is set ⚠️ **CRITICAL**
- [ ] URL format is valid (https://...)
- [ ] Keys are from the CITIZEN database project (not admin)
- [ ] Database tables are created (users, issues, comments, votes)
- [ ] RLS policies are properly configured
- [ ] Server has been restarted after adding keys

## 🔐 Security Notes

⚠️ **IMPORTANT**: The service role key bypasses Row Level Security (RLS) policies!

- **NEVER** expose service role keys to the client
- **ONLY** use them in server-side code (API routes)
- **NEVER** commit them to Git
- **ROTATE** them periodically in production

## 🎯 Why Separate Service Role Keys?

The app uses TWO databases with TWO sets of keys:

1. **Citizen Database**
   - ANON KEY: For client-side queries (limited permissions)
   - SERVICE ROLE KEY: For server operations like signup, admin tasks

2. **Admin Database**
   - ANON KEY: For admin client-side queries
   - SERVICE ROLE KEY: For admin server operations

This separation provides:
- ✅ Better security isolation
- ✅ Independent access control
- ✅ Separate audit trails
- ✅ Different RLS policies per database

## 🛠️ Quick Fix Script

Create a file `check-citizen-config.sh`:

```bash
#!/bin/bash

echo "🔍 Checking Citizen Database Configuration..."
echo ""

if [ -f .env.local ]; then
    echo "✅ .env.local exists"
    
    if grep -q "NEXT_PUBLIC_SUPABASE_CITIZEN_URL" .env.local; then
        echo "✅ CITIZEN_URL is set"
    else
        echo "❌ CITIZEN_URL is MISSING"
    fi
    
    if grep -q "NEXT_PUBLIC_SUPABASE_CITIZEN_ANON_KEY" .env.local; then
        echo "✅ CITIZEN_ANON_KEY is set"
    else
        echo "❌ CITIZEN_ANON_KEY is MISSING"
    fi
    
    if grep -q "SUPABASE_CITIZEN_SERVICE_ROLE_KEY" .env.local; then
        echo "✅ CITIZEN_SERVICE_ROLE_KEY is set"
    else
        echo "❌ CITIZEN_SERVICE_ROLE_KEY is MISSING ⚠️ THIS IS THE PROBLEM!"
    fi
else
    echo "❌ .env.local does not exist!"
    echo "Please create it from COPY_TO_ENV_LOCAL.txt"
fi

echo ""
echo "📝 To fix, add this to .env.local:"
echo "SUPABASE_CITIZEN_SERVICE_ROLE_KEY=your_service_role_key_from_supabase_dashboard"
```

Run it:
```bash
chmod +x check-citizen-config.sh
./check-citizen-config.sh
```

## 📚 Related Files

- `lib/supabase.ts` - Database client configuration
- `app/api/auth/signup/route.ts` - Signup endpoint
- `COPY_TO_ENV_LOCAL.txt` - Environment template
- `ENV_CONFIG.md` - Complete configuration guide

## 🎓 Understanding the Flow

```
User fills signup form
        ↓
SignupForm component (components/signup-form.tsx)
        ↓
AuthContext.signup() (contexts/auth-context.tsx)
        ↓
authAPI.signup() (lib/api-client.ts)
        ↓
POST /api/auth/signup (app/api/auth/signup/route.ts)
        ↓
getSupabaseClientByRole(role, true) (lib/supabase.ts)
        ↓
citizenSupabaseAdmin (created from SERVICE_ROLE_KEY)
        ↓
INSERT INTO users table
        ↓
Return success + JWT token
```

**FAILURE POINT**: If `SUPABASE_CITIZEN_SERVICE_ROLE_KEY` is missing, `citizenSupabaseAdmin` is `null`, and the flow breaks at step 6.

## ✨ After Fixing

Once configured correctly:
- ✅ Citizens can sign up successfully
- ✅ User data is persisted in Supabase citizen database
- ✅ Admins can still use separate admin database
- ✅ Both databases work independently
- ✅ Proper security isolation maintained

## 🚀 Next Steps After Fix

1. Test citizen signup with multiple users
2. Test admin signup (should use ADMIN database keys)
3. Verify users appear in correct Supabase projects
4. Test login for both citizen and admin accounts
5. Test issue reporting by citizens
6. Monitor server logs for any errors

## 📞 Support

If the issue persists after following all steps:
1. Check browser console for errors
2. Check server terminal for errors
3. Verify Supabase dashboard shows the tables
4. Test the connection: `http://localhost:3000/api/health`
5. Check that RLS policies allow service role access

---

**Last Updated**: 2024
**Priority**: 🔴 CRITICAL
**Impact**: Prevents all citizen signups
**Fix Time**: 5 minutes (just add the key!)