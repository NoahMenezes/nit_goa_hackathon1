# Dual Database Quick Start Guide

## 🚀 Quick Overview

OurStreet now uses **2 separate Supabase databases**:
- **Citizen Database** - For regular users (default)
- **Admin Database** - For administrators

---

## ⚡ 5-Minute Setup

### 1. Create Two Supabase Projects

Go to https://supabase.com/dashboard and create:
- Project 1: `yourapp-citizen`
- Project 2: `yourapp-admin`

### 2. Get API Keys for BOTH Projects

For each project, go to **Settings → API** and copy:
- Project URL
- anon/public key
- service_role key

### 3. Add to `.env.local`

```env
# CITIZEN DATABASE
NEXT_PUBLIC_SUPABASE_CITIZEN_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_CITIZEN_ANON_KEY=eyJhbGci...
SUPABASE_CITIZEN_SERVICE_ROLE_KEY=eyJhbGci...

# ADMIN DATABASE
NEXT_PUBLIC_SUPABASE_ADMIN_URL=https://yyyyy.supabase.co
NEXT_PUBLIC_SUPABASE_ADMIN_ANON_KEY=eyJhbGci...
SUPABASE_ADMIN_SERVICE_ROLE_KEY=eyJhbGci...
```

### 4. Run Migrations on BOTH Databases

Run the same SQL migrations on both Supabase projects.

### 5. Restart Your App

```bash
npm run dev
```

---

## 🎯 How It Works

### Signup
- **Default:** Creates user in **Citizen Database**
- **Option:** Select "Administrator" to create in **Admin Database**

### Login Page
Two buttons:
- 🔵 **Login as Citizen** → Authenticates against Citizen Database → Redirects to `/dashboard`
- 🟣 **Login as Admin** → Authenticates against Admin Database → Redirects to `/admin`

---

## 📝 Example Usage

### Create Citizen Account
1. Go to `/signup`
2. Select "User (Citizen)" (default)
3. Fill form and submit
4. ✅ Account created in **Citizen Database**

### Create Admin Account
1. Go to `/signup`
2. Select "Administrator"
3. Fill form and submit
4. ✅ Account created in **Admin Database**

### Login as Citizen
1. Go to `/login`
2. Click **"Login as Citizen"** (blue button)
3. Enter credentials
4. ✅ Authenticated against **Citizen Database**
5. Redirects to `/dashboard`

### Login as Admin
1. Go to `/login`
2. Click **"Login as Admin"** (purple button)
3. Enter credentials
4. ✅ Authenticated against **Admin Database**
5. Redirects to `/admin`

---

## ⚠️ Important Notes

### Database Separation
- Same email can exist in **BOTH** databases (they're completely separate)
- Citizen credentials won't work with "Login as Admin" button
- Admin credentials won't work with "Login as Citizen" button

### Must Use Correct Button
```
❌ Citizen user clicks "Login as Admin"
   → Error: "User not found in admin database"
   → Solution: Click "Login as Citizen"

❌ Admin user clicks "Login as Citizen"
   → Error: "User not found in citizen database"
   → Solution: Click "Login as Admin"
```

---

## 🧪 Quick Test

### Test 1: Create Accounts
```bash
# Create citizen account
1. Signup as "User (Citizen)"
2. Email: citizen@test.com
3. Check Citizen DB → Should see user

# Create admin account
1. Signup as "Administrator"
2. Email: admin@test.com
3. Check Admin DB → Should see user
```

### Test 2: Test Separation
```bash
# Same email, both databases
1. Signup as Citizen: test@example.com
2. Signup as Admin: test@example.com
3. ✅ Both should succeed (separate databases!)
```

### Test 3: Login with Correct Buttons
```bash
# Citizen login
1. Login as Citizen button
2. Email: citizen@test.com
3. ✅ Should work

# Admin login
1. Login as Admin button
2. Email: admin@test.com
3. ✅ Should work
```

---

## 🔍 Verify Setup

### Check Environment Variables
```bash
# All 6 should be set
echo $NEXT_PUBLIC_SUPABASE_CITIZEN_URL
echo $NEXT_PUBLIC_SUPABASE_CITIZEN_ANON_KEY
echo $SUPABASE_CITIZEN_SERVICE_ROLE_KEY
echo $NEXT_PUBLIC_SUPABASE_ADMIN_URL
echo $NEXT_PUBLIC_SUPABASE_ADMIN_ANON_KEY
echo $SUPABASE_ADMIN_SERVICE_ROLE_KEY
```

### Check Health Endpoint
```bash
curl http://localhost:3000/api/health
```

Should show both databases configured and connected.

---

## 🚨 Common Issues

### "Citizen database not configured"
- Missing `NEXT_PUBLIC_SUPABASE_CITIZEN_URL` or `NEXT_PUBLIC_SUPABASE_CITIZEN_ANON_KEY`
- Add to `.env.local` and restart server

### "Admin database not configured"
- Missing `NEXT_PUBLIC_SUPABASE_ADMIN_URL` or `NEXT_PUBLIC_SUPABASE_ADMIN_ANON_KEY`
- Add to `.env.local` and restart server

### "User not found in [citizen/admin] database"
- You're using the wrong login button
- Use "Login as Citizen" for citizen accounts
- Use "Login as Admin" for admin accounts

### Login doesn't work with either button
- Check if account actually exists in that database
- Verify password is correct
- Check server logs for detailed error

---

## 📊 What's Created Where

| Action | Database Used | Redirects To |
|--------|--------------|--------------|
| Signup as Citizen | Citizen DB | `/dashboard` |
| Signup as Admin | Admin DB | `/admin` |
| Login as Citizen | Citizen DB | `/dashboard` |
| Login as Admin | Admin DB | `/admin` |

---

## 🔐 Security Notes

### Service Role Keys
- ⚠️ **NEVER** expose service role keys to client
- Only use in API routes (server-side)
- Keep `.env.local` in `.gitignore`

### Database Isolation
- Complete data separation
- No cross-database queries
- Independent security policies
- Separate access controls

---

## 📁 Files Modified

| File | Change |
|------|--------|
| `lib/supabase.ts` | Added dual database clients |
| `components/login-form.tsx` | Two login buttons |
| `components/signup-form.tsx` | Role selector with DB info |
| `app/api/auth/login/route.ts` | Routes by userType |
| `app/api/auth/signup/route.ts` | Creates in correct DB |
| `lib/types.ts` | Added userType to LoginRequest |
| `contexts/auth-context.tsx` | Accepts userType parameter |

---

## 🎓 Code Examples

### Get Citizen Database Client
```typescript
import { getSupabaseClient } from "@/lib/supabase";

// Anon key (client-side safe)
const client = getSupabaseClient("citizen", false);

// Service role (server-side only!)
const client = getSupabaseClient("citizen", true);
```

### Get Admin Database Client
```typescript
import { getSupabaseClient } from "@/lib/supabase";

// Anon key
const client = getSupabaseClient("admin", false);

// Service role (server-side only!)
const client = getSupabaseClient("admin", true);
```

### Check If Configured
```typescript
import { isCitizenDbConfigured, isAdminDbConfigured } from "@/lib/supabase";

if (isCitizenDbConfigured()) {
  console.log("✓ Citizen DB ready");
}

if (isAdminDbConfigured()) {
  console.log("✓ Admin DB ready");
}
```

---

## ✅ Checklist

Setup complete when you can:
- [ ] See 6 environment variables in `.env.local`
- [ ] Create citizen account
- [ ] Create admin account
- [ ] Login as citizen (blue button)
- [ ] Login as admin (purple button)
- [ ] See users in respective Supabase projects
- [ ] `/api/health` shows both DBs connected

---

## 📚 Full Documentation

For detailed information, see:
- [DUAL_DATABASE_SETUP.md](./DUAL_DATABASE_SETUP.md) - Complete guide
- [ENV_CONFIG.md](./ENV_CONFIG.md) - All environment variables
- [COPY_TO_ENV_LOCAL.txt](./COPY_TO_ENV_LOCAL.txt) - Template file

---

**Remember:** You need **TWO separate Supabase projects** for this to work!

**Quick Test:** If you can login with the same email using both buttons (created separately in each DB), it's working! 🎉