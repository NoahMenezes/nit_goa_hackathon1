# Dual Database Setup - Citizen & Admin Separation

## 🎯 Overview

OurStreet now uses **TWO separate Supabase databases** for enhanced security and data isolation:

1. **Citizen Database** - For regular users/citizens
2. **Admin Database** - For administrators only

This provides complete data separation, independent scaling, and enhanced security.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        OurStreet App                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐              ┌─────────────────┐       │
│  │  Signup Page    │              │   Login Page    │       │
│  │                 │              │                 │       │
│  │  • Citizen (⭐) │              │ [Login Citizen] │       │
│  │  • Admin        │              │ [Login Admin]   │       │
│  └────────┬────────┘              └────────┬────────┘       │
│           │                                 │                │
│           ▼                                 ▼                │
│  ┌──────────────────────────────────────────────────┐       │
│  │         Authentication Layer                      │       │
│  │  • Routes based on role/userType                 │       │
│  │  • Selects appropriate database                  │       │
│  └──────────────┬───────────────────┬───────────────┘       │
│                 │                   │                        │
└─────────────────┼───────────────────┼────────────────────────┘
                  │                   │
                  ▼                   ▼
    ┌─────────────────────┐  ┌─────────────────────┐
    │  Citizen Database   │  │   Admin Database    │
    │  (Supabase #1)      │  │   (Supabase #2)     │
    ├─────────────────────┤  ├─────────────────────┤
    │ • Users (citizens)  │  │ • Users (admins)    │
    │ • Issues            │  │ • Issues            │
    │ • Comments          │  │ • Comments          │
    │ • Votes             │  │ • Votes             │
    │ • User Profiles     │  │ • Admin Actions     │
    └─────────────────────┘  └─────────────────────┘
```

---

## 🔧 Environment Configuration

### Required Environment Variables

You need **6 environment variables** (3 for each database):

```env
# ═══════════════════════════════════════════════════════════
# CITIZEN DATABASE (Primary/Default)
# ═══════════════════════════════════════════════════════════
NEXT_PUBLIC_SUPABASE_CITIZEN_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_CITIZEN_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_CITIZEN_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ═══════════════════════════════════════════════════════════
# ADMIN DATABASE (Administrative)
# ═══════════════════════════════════════════════════════════
NEXT_PUBLIC_SUPABASE_ADMIN_URL=https://yyyyy.supabase.co
NEXT_PUBLIC_SUPABASE_ADMIN_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ADMIN_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Legacy Support

Old single-database variables are still supported for backward compatibility:
```env
NEXT_PUBLIC_SUPABASE_URL=...         # Falls back to this if citizen DB not set
NEXT_PUBLIC_SUPABASE_ANON_KEY=...    # Falls back to this if citizen DB not set
SUPABASE_SERVICE_ROLE_KEY=...        # Falls back to this if citizen DB not set
```

---

## 📋 Setup Steps

### Step 1: Create Two Supabase Projects

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Create **first project** for Citizens:
   - Name: `ourstreet-citizen` (or your choice)
   - Region: Choose closest to your users
   - Database password: Generate strong password
4. Create **second project** for Admins:
   - Name: `ourstreet-admin` (or your choice)
   - Region: Same as citizen database
   - Database password: Generate strong password

### Step 2: Run Migrations on BOTH Databases

You need to run the same schema on both databases.

#### For Citizen Database:

1. Go to Citizen project → SQL Editor
2. Run the migration script from `supabase/migrations/`
3. Verify tables are created: `users`, `issues`, `comments`, `votes`, `user_profiles`

#### For Admin Database:

1. Go to Admin project → SQL Editor
2. Run the **same migration script**
3. Verify tables are created (identical schema)

### Step 3: Get API Credentials

#### For Citizen Database:

1. Go to Citizen Project → Settings → API
2. Copy values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_CITIZEN_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_CITIZEN_ANON_KEY`
   - **service_role key** → `SUPABASE_CITIZEN_SERVICE_ROLE_KEY`

#### For Admin Database:

1. Go to Admin Project → Settings → API
2. Copy values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_ADMIN_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ADMIN_ANON_KEY`
   - **service_role key** → `SUPABASE_ADMIN_SERVICE_ROLE_KEY`

### Step 4: Update `.env.local`

Add all 6 variables to your `.env.local` file (see template in `COPY_TO_ENV_LOCAL.txt`)

### Step 5: Restart Your App

```bash
npm run dev
```

---

## 🔐 How Authentication Works

### Signup Flow

```
User fills signup form
    │
    ├─ Selects "Citizen" (default) ──────► Creates user in CITIZEN database
    │
    └─ Selects "Admin" ───────────────────► Creates user in ADMIN database
```

**Key Points:**
- Signup **defaults to Citizen** database
- Users can select account type during signup
- Each account type is stored in its respective database
- No data sharing between databases

### Login Flow

```
User arrives at login page
    │
    ├─ Clicks "Login as Citizen" ────────► Authenticates against CITIZEN database
    │                                       └─ Success → Redirects to /dashboard
    │
    └─ Clicks "Login as Admin" ──────────► Authenticates against ADMIN database
                                            └─ Success → Redirects to /admin
```

**Key Points:**
- Two separate login buttons
- Each button queries different database
- Credentials from one database won't work on the other
- Users must use the correct login button for their account type

### Example Scenarios

#### Scenario 1: Citizen User
```
1. Signs up → Account created in CITIZEN database
2. Logs in → Clicks "Login as Citizen"
3. Authenticated against CITIZEN database
4. Can report issues, comment, vote
```

#### Scenario 2: Admin User
```
1. Signs up (selects Admin) → Account created in ADMIN database
2. Logs in → Clicks "Login as Admin"
3. Authenticated against ADMIN database
4. Can manage issues, assign priorities, view all data
```

#### Scenario 3: Wrong Button Clicked
```
1. Citizen user clicks "Login as Admin"
   → ❌ Login fails: "User not found in admin database"
   → Solution: Use "Login as Citizen" button

2. Admin user clicks "Login as Citizen"
   → ❌ Login fails: "User not found in citizen database"
   → Solution: Use "Login as Admin" button
```

---

## 💻 Code Structure

### New Files Modified

1. **`lib/supabase.ts`** - Dual database client configuration
   - `citizenSupabase` - Citizen database client
   - `adminSupabase` - Admin database client
   - `getSupabaseClient(userType, useServiceRole)` - Smart client getter
   - `getSupabaseClientByRole(role, useServiceRole)` - Role-based client getter

2. **`components/login-form.tsx`** - Updated with two login buttons
   - "Login as Citizen" (blue button)
   - "Login as Admin" (purple button)

3. **`components/signup-form.tsx`** - Defaults to citizen database
   - Role selector (Citizen/Admin)
   - Clarified database separation

4. **`app/api/auth/login/route.ts`** - Dual database authentication
   - Accepts `userType` parameter
   - Routes to appropriate database

5. **`app/api/auth/signup/route.ts`** - Dual database user creation
   - Creates users in appropriate database based on role
   - Validates uniqueness per database

### Key Functions

```typescript
// Get client by user type
import { getSupabaseClient } from "@/lib/supabase";

const client = getSupabaseClient("citizen", false); // Citizen DB, anon key
const adminClient = getSupabaseClient("admin", true); // Admin DB, service role

// Get client by role string
import { getSupabaseClientByRole } from "@/lib/supabase";

const client = getSupabaseClientByRole("citizen", false);
const adminClient = getSupabaseClientByRole("admin", true);

// Check configuration status
import { isCitizenDbConfigured, isAdminDbConfigured } from "@/lib/supabase";

if (isCitizenDbConfigured()) {
  console.log("✓ Citizen database ready");
}

if (isAdminDbConfigured()) {
  console.log("✓ Admin database ready");
}

// Test connections
import { testAllConnections } from "@/lib/supabase";

const status = await testAllConnections();
console.log("Citizen DB:", status.citizen);
console.log("Admin DB:", status.admin);
```

---

## 🧪 Testing

### Test Citizen Database

```bash
# 1. Create a citizen account
# - Go to http://localhost:3000/signup
# - Select "User (Citizen)"
# - Create account

# 2. Login as citizen
# - Go to http://localhost:3000/login
# - Click "Login as Citizen"
# - Should redirect to /dashboard

# 3. Verify in Supabase
# - Check citizen database
# - Should see user in users table
```

### Test Admin Database

```bash
# 1. Create an admin account
# - Go to http://localhost:3000/signup
# - Select "Administrator"
# - Create account

# 2. Login as admin
# - Go to http://localhost:3000/login
# - Click "Login as Admin"
# - Should redirect to /admin

# 3. Verify in Supabase
# - Check admin database
# - Should see user in users table
```

### Test Database Separation

```bash
# 1. Create accounts in both databases with SAME email
#    - Create citizen account: user@example.com
#    - Create admin account: user@example.com
#    - Both should succeed (separate databases!)

# 2. Test login isolation
#    - Login with "Login as Citizen" → Should work
#    - Login with "Login as Admin" → Should work
#    - Each uses different database
```

---

## 🚨 Troubleshooting

### Error: "User not found in citizen database"

**Cause:** You're trying to login as citizen but account is in admin database

**Solution:** Use the "Login as Admin" button instead

---

### Error: "User not found in admin database"

**Cause:** You're trying to login as admin but account is in citizen database

**Solution:** Use the "Login as Citizen" button instead

---

### Error: "Citizen database not configured"

**Cause:** Missing citizen database environment variables

**Solution:**
1. Check `.env.local` has all 3 citizen variables:
   - `NEXT_PUBLIC_SUPABASE_CITIZEN_URL`
   - `NEXT_PUBLIC_SUPABASE_CITIZEN_ANON_KEY`
   - `SUPABASE_CITIZEN_SERVICE_ROLE_KEY`
2. Restart your dev server

---

### Error: "Admin database not configured"

**Cause:** Missing admin database environment variables

**Solution:**
1. Check `.env.local` has all 3 admin variables:
   - `NEXT_PUBLIC_SUPABASE_ADMIN_URL`
   - `NEXT_PUBLIC_SUPABASE_ADMIN_ANON_KEY`
   - `SUPABASE_ADMIN_SERVICE_ROLE_KEY`
2. Restart your dev server

---

### Both databases return empty

**Cause:** Tables not created in one or both databases

**Solution:**
1. Check each Supabase project
2. Go to Table Editor
3. Verify these tables exist:
   - `users`
   - `issues`
   - `comments`
   - `votes`
   - `user_profiles`
4. If missing, run migrations

---

### Can't login with either button

**Cause:** Account might not exist or password incorrect

**Solution:**
1. Check which database your account is in (Supabase dashboard)
2. Verify email and password
3. Try creating a new account
4. Check server logs for detailed error messages

---

## 🔒 Security Best Practices

### 1. Service Role Keys

**⚠️ CRITICAL:** Never expose service role keys to client-side code!

```typescript
// ✅ GOOD - Server-side only
// In API routes: app/api/auth/login/route.ts
const client = getSupabaseClient("admin", true); // Service role

// ❌ BAD - Never in client components
// In components/*.tsx
const client = getSupabaseClient("admin", true); // DON'T DO THIS!
```

### 2. Database Isolation

- Citizen database should NOT have admin user data
- Admin database should NOT have citizen user data
- Use Row Level Security (RLS) policies on both databases
- Different service role keys for each database

### 3. Production Deployment

When deploying to production:

```env
# Use different credentials for production!
# Citizen Production
NEXT_PUBLIC_SUPABASE_CITIZEN_URL=https://prod-citizen.supabase.co
NEXT_PUBLIC_SUPABASE_CITIZEN_ANON_KEY=prod_citizen_key...
SUPABASE_CITIZEN_SERVICE_ROLE_KEY=prod_citizen_service_key...

# Admin Production
NEXT_PUBLIC_SUPABASE_ADMIN_URL=https://prod-admin.supabase.co
NEXT_PUBLIC_SUPABASE_ADMIN_ANON_KEY=prod_admin_key...
SUPABASE_ADMIN_SERVICE_ROLE_KEY=prod_admin_service_key...
```

### 4. Monitoring

Monitor both databases separately:
- Set up alerts for unusual activity
- Track login attempts
- Monitor database size and performance
- Separate billing/quotas for each database

---

## 📊 Health Check

Check the health endpoint to verify both databases:

```bash
curl http://localhost:3000/api/health
```

Response will include:
```json
{
  "status": "healthy",
  "checks": {
    "database": {
      "citizen": {
        "status": "up",
        "configured": true,
        "responseTime": 45
      },
      "admin": {
        "status": "up",
        "configured": true,
        "responseTime": 38
      }
    }
  }
}
```

---

## 🎓 Benefits of Dual Database Setup

### 1. **Complete Data Isolation**
- Citizen data is physically separated from admin data
- Reduces risk of accidental data exposure
- Easier to comply with data protection regulations

### 2. **Independent Scaling**
- Scale citizen database independently (likely needs more resources)
- Admin database can remain smaller
- Different backup strategies per database

### 3. **Enhanced Security**
- Breach in one database doesn't affect the other
- Different access controls per database
- Separate API keys reduce attack surface

### 4. **Flexible Management**
- Different RLS policies per database
- Independent migration schedules
- Separate monitoring and alerts

### 5. **Cost Optimization**
- Free tier multiplied (2 x 500MB = 1GB total)
- Pay only for what each database uses
- Can downgrade one without affecting the other

---

## 🔄 Migration from Single Database

If you're upgrading from the old single-database setup:

### Step 1: Backup Existing Data
```sql
-- In your old Supabase project
-- Export all tables
```

### Step 2: Create New Projects
- Follow setup steps above

### Step 3: Migrate Data
```sql
-- Citizen Database: Import users where role = 'citizen'
-- Admin Database: Import users where role = 'admin'
```

### Step 4: Update Environment
- Add new dual database variables
- Keep legacy variables temporarily for backward compatibility

### Step 5: Test Thoroughly
- Test citizen login
- Test admin login
- Verify all features work

### Step 6: Remove Legacy
- Once stable, remove old NEXT_PUBLIC_SUPABASE_URL variables
- Delete old Supabase project

---

## 📞 Support

If you encounter issues:

1. Check this documentation
2. Review server logs: `npm run dev` output
3. Check Supabase dashboard for errors
4. Verify all 6 environment variables are set
5. Test database connections independently

---

## ✅ Quick Checklist

Before going live:

- [ ] Created 2 separate Supabase projects
- [ ] Ran migrations on both databases
- [ ] Added all 6 environment variables to `.env.local`
- [ ] Tested citizen signup and login
- [ ] Tested admin signup and login
- [ ] Verified database separation (same email in both DBs)
- [ ] Tested "wrong button" scenarios
- [ ] Checked `/api/health` endpoint
- [ ] Verified service role keys are not in client code
- [ ] Set up production credentials (if deploying)

---

## 📚 Related Documentation

- [Environment Variables Guide](./ENV_CONFIG.md)
- [Complete .env.local Template](./COPY_TO_ENV_LOCAL.txt)
- [Supabase Setup Guide](./docs/SUPABASE_SETUP.md)
- [Authentication Flow](./docs/AUTH.md)

---

**Last Updated:** 2024

**Version:** 2.0.0 - Dual Database Implementation