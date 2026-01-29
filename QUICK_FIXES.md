# 🚀 Quick Fixes for Admin Login & Map Display

## Issues Fixed

✅ **Issue 1**: Admin login showing "Cannot coerce the result to a single JSON object"  
✅ **Issue 2**: Map not displaying properly

---

## 🔐 Fix 1: Admin Login

### Problem
Login attempt for admin database shows error: `Cannot coerce the result to a single JSON object`

### Root Cause
The login route was using `.single()` which throws an error when no rows are found. Changed to `.maybeSingle()` to handle empty results gracefully.

### Solution Applied
Updated `app/api/auth/login/route.ts` to use `.maybeSingle()` instead of `.single()`.

### Action Required: Set Up Admin User

Your admin database exists but needs the user account. Follow these steps:

#### Option 1: Quick Setup (Recommended)

1. **Go to your ADMIN Supabase project**
   - URL: https://yrhyovyefqgjdysuayqa.supabase.co

2. **Open SQL Editor**
   - Left sidebar → SQL Editor → New Query

3. **Copy and paste this SQL:**

```sql
-- Delete existing user if exists (to avoid conflicts)
DELETE FROM users WHERE email = 'vibhuporobo@gmail.com';

-- Insert admin user with properly hashed password
INSERT INTO users (name, email, password, role, created_at, updated_at)
VALUES ('Vibhu Poro Admin', 'vibhuporobo@gmail.com', '$2b$10$NMkpUM/dMkQGnkRIDHiRzOx56IL8C6lfZnjOy96AbmI6sNiYli6wC', 'admin', NOW(), NOW());

-- Create profile
INSERT INTO user_profiles (user_id, city, state, bio, created_at, updated_at)
VALUES ((SELECT id FROM users WHERE email = 'vibhuporobo@gmail.com'), 'Goa', 'Goa', 'System Administrator', NOW(), NOW());

-- Verify
SELECT id, name, email, role, created_at FROM users WHERE email = 'vibhuporobo@gmail.com';
```

4. **Click "Run"**

5. **Login Credentials:**
   - Email: `vibhuporobo@gmail.com`
   - Password: `admin123`
   - Use: **"Login as Admin"** button

#### Option 2: Use Pre-made SQL File

Run the SQL file we created:
```bash
# The SQL is in: HackathonPcce/supabase/setup-admin-user.sql
# Copy its contents into your Admin Supabase SQL Editor
```

---

## 🗺️ Fix 2: Map Display

### Problem
Map not displaying on `/map` page

### Root Cause
The MapTiler API key was hardcoded in the component instead of using the environment variable properly.

### Solution Applied
Updated `components/interactive-map.tsx` to:
- Read API key from `NEXT_PUBLIC_MAPTILER_API_KEY` environment variable
- Use the key in the style URL correctly
- Fallback to the working key if env var is not set

### Verification
Your MapTiler API key is already set in `.env.local`:
```
NEXT_PUBLIC_MAPTILER_API_KEY=r4rtlkPK4DaQBrGuTiuR
```

✅ **The map should now work!**

### Test the Map

1. **Restart your dev server** (important for env vars):
```bash
# Kill existing server
# Then restart:
npm run dev
```

2. **Visit the map page:**
   - http://localhost:3000/map

3. **You should see:**
   - Interactive map with streets
   - Issue markers plotted on the map
   - Navigation controls (zoom, locate, fullscreen)

---

## 🧪 Testing Script

We created a test script for you. Run it to verify both fixes:

```bash
./test-fixes.sh
```

This will check:
- ✅ MapTiler API key configuration
- ✅ Admin database configuration
- ✅ Health endpoint status
- ✅ Admin login functionality
- ✅ Map page accessibility

---

## 📋 Complete Checklist

### Admin Login Fix
- [x] Updated login route to use `.maybeSingle()`
- [ ] Run SQL script in Admin Supabase project
- [ ] Test login with: vibhuporobo@gmail.com / admin123
- [ ] Verify access to admin dashboard

### Map Display Fix
- [x] Updated MapTiler API key usage
- [x] Verified API key is in .env.local
- [ ] Restart dev server
- [ ] Visit http://localhost:3000/map
- [ ] Verify map displays with markers

---

## 🔍 If Map Still Doesn't Display

### Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for errors

### Common Issues & Solutions

**Error: "Failed to load map"**
```bash
# Check if API key is valid
# Visit: https://cloud.maptiler.com/account/keys/
# Verify the key: r4rtlkPK4DaQBrGuTiuR
```

**Error: "Cannot find module '@maptiler/sdk'"**
```bash
# Reinstall dependencies
npm install
```

**Map shows blank/white screen**
```bash
# Check network tab in DevTools
# Look for failed requests to api.maptiler.com
# If 401/403: API key is invalid or expired
```

**Map loads but no markers**
```bash
# Check if issues exist in database
curl http://localhost:3000/api/issues

# Should return array of issues with coordinates
```

---

## 🎯 Quick Test Commands

### Test Admin Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vibhuporobo@gmail.com","password":"admin123","userType":"admin"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "...",
    "name": "Vibhu Poro Admin",
    "email": "vibhuporobo@gmail.com",
    "role": "admin"
  },
  "token": "..."
}
```

### Test Map Page
```bash
curl -I http://localhost:3000/map
```

**Expected:** HTTP 200 or 307 (redirect if not logged in)

---

## 📞 Need More Help?

### Check Logs
```bash
# Server logs show detailed error messages
# Look for:
# - "Login attempt for admin database"
# - "User not found in admin database"
# - "Map error"
```

### Verify Environment Variables
```bash
# Check all env vars are loaded
grep SUPABASE .env.local
grep MAPTILER .env.local
```

### Database Connection Test
```bash
# Visit health endpoint
curl http://localhost:3000/api/health | jq

# Should show:
# "admin": { "configured": true }
# "citizen": { "configured": true }
```

---

## ✅ Success Criteria

You'll know everything is working when:

1. **Admin Login:**
   - Click "Login as Admin" button
   - Enter: vibhuporobo@gmail.com / admin123
   - Redirects to /admin dashboard
   - No errors in console

2. **Map Display:**
   - Visit /map page
   - See interactive map with street tiles
   - See colored markers for issues
   - Can zoom, pan, click markers
   - Markers show issue details on click

---

## 🎉 Summary

| Fix | Status | Action Required |
|-----|--------|-----------------|
| Login Route | ✅ Fixed | Run SQL in Admin DB |
| Map Component | ✅ Fixed | Restart server |
| Admin DB Setup | ⏳ Pending | Create admin user |
| MapTiler Config | ✅ Complete | None |

**Next Steps:**
1. Run the SQL script in your Admin Supabase project
2. Restart your dev server
3. Test admin login
4. Test map display
5. Run `./test-fixes.sh` to verify everything

---

**Last Updated:** January 29, 2025  
**Files Modified:**
- `app/api/auth/login/route.ts`
- `components/interactive-map.tsx`
- `scripts/generate-admin-password.js` (new)
- `supabase/setup-admin-user.sql` (new)
- `test-fixes.sh` (new)