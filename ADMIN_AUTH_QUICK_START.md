# Admin Authentication - Quick Start Guide

## 🚀 5-Minute Setup

### For Developers

**1. Add Admin IDs to Environment**
```bash
# Edit .env.local
ADMIN_IDS=ADMIN001,ADMIN002,ADMIN003
```

**2. Restart Server**
```bash
npm run dev
```

**3. Create Admin Account**
```bash
node scripts/create-admin-user.js
```

**4. Test Admin Login**
- Go to: http://localhost:3000/login
- Click "Admin Login" button
- Enter: Email + Password + Admin ID
- Should redirect to /admin

---

## 📝 What Changed?

### ❌ What You CAN'T Do Anymore
- **Cannot signup as admin** through /signup page
- **Admin accounts must be created manually** in database

### ✅ What You CAN Do
- **Citizen signup** works normally at /signup
- **Admin login** requires Admin ID at /login (toggle to admin mode)
- **Regular login** still works for citizens

---

## 🔑 Two Login Modes

### Citizen Login (Default)
```
📧 Email: user@example.com
🔑 Password: ********
[Login] → /dashboard
```

### Admin Login (Toggle Button)
```
📧 Email: admin@example.com
🔑 Password: ********
🆔 Admin ID: ADMIN001
[Login as Administrator] → /admin
```

---

## 🛠️ Creating Admin Accounts

### Method 1: Interactive Script (Recommended)
```bash
node scripts/create-admin-user.js
```
Follow prompts, get SQL command, paste into Supabase.

### Method 2: Manual SQL
```sql
-- Generate password hash first
-- Use: https://bcrypt-generator.com/ or the script above

INSERT INTO users (id, name, email, password, role, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Admin Name',
  'admin@example.com',
  '$2b$10$hash_from_bcrypt',
  'admin',
  NOW(),
  NOW()
);
```

### Method 3: Supabase Table Editor
1. Go to Table Editor → `users` table
2. Click "Insert row"
3. Fill in fields (role = 'admin')
4. Hash password using bcrypt first!

---

## 🔐 Security Overview

### Three Required Credentials for Admin Login
1. **Email** - Known to admin
2. **Password** - Known to admin  
3. **Admin ID** - Stored in environment variable

### Why Admin ID?
- **Extra security layer** - Can't login as admin without it
- **Environment-specific** - Different IDs for dev/staging/prod
- **Rotatable** - Change IDs without changing passwords
- **Auditable** - Track which Admin ID was used

---

## 🌐 Vercel Deployment

### Step 1: Add Environment Variable
```
Vercel Dashboard → Settings → Environment Variables
Name: ADMIN_IDS
Value: ADMIN001,ADMIN002,ADMIN003
```

### Step 2: Generate Secure Admin IDs
```bash
# Generate cryptographically secure IDs
openssl rand -hex 8
```

### Step 3: Create Admin in Production Database
- Use Supabase Dashboard
- Run SQL from creation script
- Or use Table Editor

### Step 4: Share Admin IDs Securely
- Use password manager
- Encrypted communication
- NOT via email or Slack

---

## 🧪 Testing

### Test Citizen Flow
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

### Test Admin Login
```bash
curl -X POST http://localhost:3000/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "AdminPass123",
    "adminId": "ADMIN001"
  }'
```

---

## 🐛 Troubleshooting

### "Invalid Admin ID"
- Check `ADMIN_IDS` in .env.local
- Verify exact match (case-sensitive)
- Restart server after changes

### "This account does not have administrator privileges"
- Check user's role in database
- Must be 'admin' or 'authority'
- Not 'citizen'

### "Too many admin login attempts"
- Wait 15 minutes
- Rate limit: 3 attempts only
- Stricter than regular login (5 attempts)

### "User not found"
- Admin account must exist in database
- Create using script or SQL
- Check email spelling

---

## 📊 Key Files

### Modified Files
- `components/signup-form.tsx` - Removed admin signup
- `components/login-form.tsx` - Added admin login toggle
- `contexts/auth-context.tsx` - Added adminLogin function
- `.env.local.example` - Added ADMIN_IDS
- `.env.example` - Added ADMIN_IDS

### New Files
- `app/api/auth/admin-login/route.ts` - Admin login endpoint
- `scripts/create-admin-user.js` - Admin creation script
- `VERCEL_DEPLOYMENT_GUIDE.md` - Deployment instructions
- `ADMIN_AUTH_CHANGELOG.md` - Complete change log

---

## 📱 User Experience

### Signup Page (/signup)
```
┌─────────────────────────────┐
│   Join OurStreet            │
├─────────────────────────────┤
│ Name: [_________________]   │
│ Email: [________________]   │
│ Password: [_____________]   │
│ Confirm: [______________]   │
│                             │
│ [Create Account] ← Citizen  │
└─────────────────────────────┘
```

### Login Page (/login)
```
┌─────────────────────────────┐
│ [Citizen] [Admin 🛡️]        │
├─────────────────────────────┤
│ Email: [________________]   │
│ Admin ID: [_____________]   │ ← Only in admin mode
│ Password: [_____________]   │
│                             │
│ [Login as Administrator]    │
└─────────────────────────────┘
```

---

## 🎯 Environment Variables Reference

### Required
```env
# Database (CRITICAL)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# JWT (CRITICAL)
JWT_SECRET=xxx

# Admin Auth (CRITICAL)
ADMIN_IDS=ADMIN001,ADMIN002,ADMIN003
```

### Generate Secrets
```bash
# JWT Secret
openssl rand -base64 32

# Admin IDs (production)
openssl rand -hex 8
```

---

## 🔄 Migration from Old System

### If You Had Admin Signup Before

**Your existing admin accounts still work!**

1. Add `ADMIN_IDS` to environment
2. Share Admin IDs with existing admins
3. They can now login with Admin ID
4. No database changes needed

### Old Admin Login
```
❌ Email + Password → Login
   (This no longer works for admins)
```

### New Admin Login
```
✅ Email + Password + Admin ID → Login
   (This is required now)
```

---

## 📞 Quick Help

### Commands
```bash
# Diagnose issues
node scripts/diagnose-auth.js

# Create admin
node scripts/create-admin-user.js

# Test endpoints
bash test-auth-endpoints.sh

# Check health
curl http://localhost:3000/api/health
```

### Documentation
- **This file** - Quick reference
- `VERCEL_DEPLOYMENT_GUIDE.md` - Full deployment guide
- `ADMIN_AUTH_CHANGELOG.md` - All changes explained
- `SETUP_GUIDE.md` - Local development setup

---

## ✅ Checklist

### Local Development
- [ ] Added `ADMIN_IDS` to .env.local
- [ ] Restarted dev server
- [ ] Created admin account in database
- [ ] Tested citizen signup
- [ ] Tested admin login
- [ ] Both flows working

### Production Deployment
- [ ] Added `ADMIN_IDS` to Vercel
- [ ] Used secure Admin IDs (not ADMIN001)
- [ ] Created admin in production database
- [ ] Shared Admin IDs securely
- [ ] Tested on production URL
- [ ] Verified both citizen and admin flows

---

## 🎓 Summary

**Citizens:**
- Sign up at /signup ✅
- Login at /login (default mode) ✅
- No Admin ID needed ✅

**Admins:**
- Created manually in database ⚙️
- Login at /login (admin mode) ✅
- Require Admin ID ✅
- Enhanced security 🔒

**System:**
- Vercel deployable ✅
- Environment-based Admin IDs ✅
- No breaking changes to database ✅
- Backward compatible ✅

---

**Last Updated:** 2024-11-09
**Status:** ✅ Production Ready
**Version:** 1.0.0

For detailed information, see `VERCEL_DEPLOYMENT_GUIDE.md` or `ADMIN_AUTH_CHANGELOG.md`.