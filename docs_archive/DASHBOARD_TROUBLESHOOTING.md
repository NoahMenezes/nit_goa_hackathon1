# Dashboard Troubleshooting Guide

Quick reference for debugging common dashboard issues in CityPulse/OurStreet.

## Quick Diagnostics

### 1. Is the user authenticated?
```typescript
// Open browser console and run:
document.cookie.includes('citypulse_auth_token')
// Should return: true

localStorage.getItem('citypulse_user_data')
// Should return: JSON object with user data
```

### 2. Is the API endpoint responding?
```bash
# In browser console:
fetch('/api/dashboard', {
  headers: {
    'Authorization': `Bearer ${document.cookie.match(/citypulse_auth_token=([^;]+)/)?.[1]}`
  }
}).then(r => r.json()).then(console.log)
```

### 3. Check environment variables
```bash
# In terminal:
grep JWT_SECRET .env.local
# Should show: JWT_SECRET=your-secret-here
```

## Common Issues & Solutions

### Issue 1: "Unauthorized - Please login" Error

**Symptoms:**
- Dashboard shows "Unauthorized" error
- Console shows 401 errors
- User appears logged in but dashboard won't load

**Causes:**
- Auth token expired or missing
- JWT_SECRET mismatch between login and dashboard
- Token not being sent with request

**Solutions:**

1. **Clear auth and re-login:**
```javascript
// In browser console:
document.cookie = 'citypulse_auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
localStorage.removeItem('citypulse_user_data')
// Then login again
```

2. **Verify JWT_SECRET is set:**
```bash
# .env.local should have:
JWT_SECRET=your-secret-key-here
```

3. **Check token in request:**
```javascript
// In browser DevTools > Network tab
// Click on the /api/dashboard request
// Check Headers section
// Should see: Authorization: Bearer <token>
```

### Issue 2: Dashboard Shows Empty/Default Data

**Symptoms:**
- Dashboard loads but shows placeholder numbers
- Stats don't update
- No real data visible

**Causes:**
- Database is empty
- API not returning data
- Response parsing issue

**Solutions:**

1. **Check if issues exist:**
```bash
# In browser console:
fetch('/api/issues').then(r => r.json()).then(console.log)
# Should return array of issues
```

2. **Seed some test data:**
- Go to `/map` page
- Report a test issue
- Refresh dashboard

3. **Check API response structure:**
```javascript
fetch('/api/dashboard', {
  headers: {
    'Authorization': `Bearer ${document.cookie.match(/citypulse_auth_token=([^;]+)/)?.[1]}`
  }
}).then(r => r.json()).then(data => {
  console.log('API Response:', data);
  console.log('Has data?', data.success && data.data);
})
```

### Issue 3: "Failed to fetch dashboard data" Error

**Symptoms:**
- Generic error message
- Dashboard won't load at all
- Network errors in console

**Causes:**
- Server not running
- API route error
- Network connectivity issue

**Solutions:**

1. **Verify dev server is running:**
```bash
npm run dev
# Should show: ready - started server on 0.0.0.0:3000
```

2. **Check for API errors:**
```bash
# Look at terminal where dev server is running
# Should NOT see errors like:
# ⨯ Error in /api/dashboard: ...
```

3. **Test API directly:**
```bash
curl http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Issue 4: Dashboard Loads Slowly

**Symptoms:**
- Long loading times
- Spinner shows for many seconds
- Page feels laggy

**Causes:**
- Large dataset
- No database indexes
- Network latency

**Solutions:**

1. **Check issue count:**
```javascript
fetch('/api/issues').then(r => r.json()).then(data => {
  console.log('Total issues:', data.data?.length);
})
```

2. **Enable React DevTools Profiler** to identify slow components

3. **Consider pagination** if you have 1000+ issues

### Issue 5: Session Expires Too Quickly

**Symptoms:**
- Dashboard works then suddenly shows "Unauthorized"
- User kicked out frequently
- Token expires unexpectedly

**Causes:**
- JWT token has short expiry
- Session check too frequent
- Clock skew between client/server

**Solutions:**

1. **Adjust token expiry:**
```typescript
// In lib/auth.ts
const JWT_EXPIRES_IN = "7d"; // Change to "30d" for longer sessions
```

2. **Adjust session check interval:**
```typescript
// In contexts/auth-context.tsx
// Change from 5 minutes to 15 minutes:
5 * 60 * 1000  →  15 * 60 * 1000
```

### Issue 6: Console Warnings/Errors

**Symptoms:**
- Red errors in browser console
- Yellow warnings about console.error
- Next.js ESLint warnings

**Status:** ✅ Fixed in latest version

If you still see them:
```bash
# Pull latest changes
git pull origin main

# Reinstall dependencies
npm install

# Clear Next.js cache
rm -rf .next
npm run dev
```

## Debugging Workflow

### Step-by-Step Debugging Process

1. **Open Browser DevTools** (F12 or Cmd+Opt+I)

2. **Go to Console Tab**
   - Look for errors (red text)
   - Look for warnings (yellow text)
   - Note any failed requests

3. **Go to Network Tab**
   - Filter by "Fetch/XHR"
   - Find `/api/dashboard` request
   - Check Status Code (should be 200)
   - Check Response (should have success: true)
   - Check Request Headers (should have Authorization)

4. **Go to Application Tab**
   - Check Cookies → should see `citypulse_auth_token`
   - Check Local Storage → should see `citypulse_user_data`

5. **Check Terminal**
   - Look at your dev server output
   - Look for error stack traces
   - Look for 401/500 status codes

## Advanced Debugging

### Enable Debug Mode

Add to `.env.local`:
```bash
NODE_ENV=development
NEXT_PUBLIC_DEBUG=true
```

### View Full API Responses

```javascript
// In browser console:
window.DEBUG_API = true;

// Then reload page and check console for detailed logs
```

### Test Auth Flow

```javascript
// Complete auth test in console:
async function testAuth() {
  // 1. Login
  const loginRes = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'YourPassword123'
    })
  });
  const loginData = await loginRes.json();
  console.log('Login:', loginData);

  // 2. Get token
  const token = document.cookie.match(/citypulse_auth_token=([^;]+)/)?.[1];
  console.log('Token:', token ? 'Found' : 'Missing');

  // 3. Test dashboard
  const dashRes = await fetch('/api/dashboard', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const dashData = await dashRes.json();
  console.log('Dashboard:', dashData);
}

testAuth();
```

## Environment Setup Checklist

- [ ] Node.js 18+ installed
- [ ] npm install completed without errors
- [ ] .env.local exists
- [ ] JWT_SECRET is set (minimum 32 characters)
- [ ] Dev server running on port 3000
- [ ] Browser on http://localhost:3000
- [ ] Cookies enabled in browser
- [ ] localStorage enabled in browser

## Common Environment Issues

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

### Module Not Found Errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors
```bash
npm run type-check
# Fix any errors shown
```

## Performance Monitoring

### Check Dashboard Load Time
```javascript
performance.mark('dashboard-start');

// After dashboard loads:
performance.mark('dashboard-end');
performance.measure('dashboard-load', 'dashboard-start', 'dashboard-end');
console.log(performance.getEntriesByName('dashboard-load')[0].duration);
```

### Monitor API Response Times
```javascript
// In browser DevTools > Network
// Look at "Time" column for /api/dashboard
// Should be < 500ms for good performance
```

## Getting Help

If none of these solutions work:

1. **Check the logs:**
   - Browser console
   - Dev server terminal
   - Network tab in DevTools

2. **Create a minimal reproduction:**
   - Clear all data
   - Create fresh user
   - Try dashboard again

3. **Check for updates:**
   - Pull latest code: `git pull`
   - Update dependencies: `npm update`

4. **File an issue with:**
   - Exact error message
   - Browser console screenshot
   - Network tab screenshot
   - Steps to reproduce

## Quick Fixes Summary

| Issue | Quick Fix |
|-------|-----------|
| 401 Unauthorized | Clear cookies, re-login |
| Empty dashboard | Report test issue, refresh |
| Slow loading | Check issue count |
| Session expires | Increase JWT_EXPIRES_IN |
| Console errors | Pull latest code |
| Port conflict | Kill process or use different port |

## Health Check Endpoints

Test these to verify system health:

```bash
# API health
curl http://localhost:3000/api/health

# Auth working
curl http://localhost:3000/api/auth/session

# Dashboard accessible (with auth)
curl http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Success Indicators

Dashboard is working correctly when:
- ✅ No console errors (red text)
- ✅ Network tab shows 200 status for /api/dashboard
- ✅ Stats update when you report/resolve issues
- ✅ No session expiry for at least 7 days
- ✅ Load time < 1 second
- ✅ Authorization header present in requests

---

**Last Updated:** January 2024
**Version:** 2.0
**Status:** Production Ready