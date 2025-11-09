# 🔴 CRITICAL FIX: User Data Not Saving

## Problem Summary

**Issue**: User data is not being saved and disappears after server restart.

**Root Cause**: The application is using in-memory storage instead of Supabase because environment variables are not configured.

---

## 🚀 Quick Fix (5 minutes)

### Step 1: Create `.env.local` file

```bash
cp .env.local.example .env.local
```

### Step 2: Get Supabase Credentials

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/bceawmcnwvxvffhmwibp/settings/api
2. Copy these three values:
   - **Project URL**
   - **anon/public key**
   - **service_role key** (⚠️ CRITICAL for user registration!)

### Step 3: Edit `.env.local`

Open `.env.local` and replace the placeholder values:

```env
# REQUIRED - Get from Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://bceawmcnwvxvffhmwibp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste_your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=paste_your_service_role_key_here

# REQUIRED - Generate a secure secret
JWT_SECRET=paste_generated_secret_here

# OPTIONAL
NODE_ENV=development
```

### Step 4: Generate JWT Secret

Run this command and copy the output:

```bash
openssl rand -base64 32
```

Paste it as the `JWT_SECRET` value in `.env.local`.

### Step 5: Setup Database Tables (First Time Only)

1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/bceawmcnwvxvffhmwibp/editor
2. Open the file: `supabase/schema.sql`
3. Copy ALL content from that file
4. Paste into Supabase SQL Editor
5. Click "Run"
6. Verify tables created in Table Editor

### Step 6: Restart Development Server

```bash
# Kill existing process
pkill -f "next dev"

# Clear cache
rm -rf .next

# Start fresh
npm run dev
```

---

## ✅ Verification

### 1. Check Environment Setup

```bash
node scripts/diagnose-auth.js
```

Should show all green checkmarks ✅

### 2. Check Database Connection

Visit: http://localhost:3000/api/health

Should return:
```json
{
  "success": true,
  "status": "healthy",
  "checks": {
    "database": {
      "status": "up"
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

Should return a success response with a token.

### 4. Verify Data in Supabase

1. Go to Supabase Table Editor
2. Open the `users` table
3. You should see the newly created user
4. **This data will persist!** ✅

---

## 🔍 How to Know It's Working

### ❌ BEFORE (Using In-Memory Storage):

Console will show:
```
⚠️ Using in-memory database (data will be lost on restart)
```

Data disappears when you restart the server.

### ✅ AFTER (Using Supabase):

Console will show:
```
✅ Using Supabase database
```

Data persists in Supabase database permanently.

---

## 🚨 Common Errors & Solutions

### Error: "Failed to create user"

**Cause**: Missing `SUPABASE_SERVICE_ROLE_KEY`

**Solution**: 
1. Get the service role key from Supabase Dashboard → Settings → API
2. Add it to `.env.local`: `SUPABASE_SERVICE_ROLE_KEY=your_key_here`
3. Restart server

### Error: "Database not configured"

**Cause**: Supabase URL or anon key not set

**Solution**:
1. Verify `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Check for typos
3. Restart server

### Error: "relation 'users' does not exist"

**Cause**: Database tables not created

**Solution**:
1. Go to Supabase SQL Editor
2. Run the entire `supabase/schema.sql` file
3. Check Table Editor to verify tables exist

### Data still not saving

**Checklist**:
- [ ] `.env.local` file exists in project root
- [ ] All three Supabase credentials are set (URL, anon key, service role key)
- [ ] JWT_SECRET is set
- [ ] Database tables created in Supabase
- [ ] Server restarted after adding credentials
- [ ] Console shows "✅ Using Supabase database"

---

## 📋 What Was Wrong?

The application has a smart database layer that automatically detects if Supabase is configured:

```
lib/db.ts checks:
├─ Supabase credentials found? 
│  ├─ YES → Use db-supabase.ts (persistent storage)
│  └─ NO  → Use db-memory.ts (temporary storage)
```

**Before fix**: No credentials → In-memory storage → Data lost on restart  
**After fix**: Credentials set → Supabase storage → Data persists forever

---

## 🎯 Key Files

- **`.env.local`** - Environment variables (YOU NEED TO CREATE THIS!)
- **`lib/db.ts`** - Detects which database to use
- **`lib/supabase.ts`** - Supabase client configuration
- **`lib/db-supabase.ts`** - Supabase database operations
- **`supabase/schema.sql`** - Database schema

---

## 🛠️ Automated Fix Scripts

### Check what's wrong:
```bash
node scripts/diagnose-auth.js
```

### Guided setup:
```bash
bash fix-auth-setup.sh
```

---

## 📚 Additional Resources

- **Detailed Setup Guide**: See `SETUP_GUIDE.md`
- **Supabase Dashboard**: https://supabase.com/dashboard
- **API Documentation**: Check `/docs` directory

---

## ⚡ TL;DR

1. Create `.env.local` from `.env.local.example`
2. Get 3 keys from Supabase (URL, anon key, service role key)
3. Generate JWT secret: `openssl rand -base64 32`
4. Put all values in `.env.local`
5. Run database schema in Supabase SQL Editor
6. Restart server: `npm run dev`
7. Test: http://localhost:3000/api/health
8. ✅ Done! Data now saves permanently.

---

**Need help?** Run `node scripts/diagnose-auth.js` for detailed diagnostics.