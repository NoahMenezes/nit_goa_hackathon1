# CityPulse Diagnostic & Fix Scripts

This directory contains diagnostic tools and automated scripts to help set up and troubleshoot the CityPulse application.

---

## 📋 Available Scripts

### 1. `diagnose-auth.js` ⚕️

**Purpose**: Comprehensive diagnostic tool for authentication and database configuration.

**Usage**:
```bash
node scripts/diagnose-auth.js
```

**What it checks**:
- ✅ `.env.local` file existence
- ✅ All required environment variables
- ✅ Database configuration files
- ✅ Authentication endpoint files
- ✅ Supabase schema
- ✅ Provides actionable recommendations

**Output**:
- Color-coded status messages
- Detailed issue analysis
- Step-by-step recommendations
- Exit code 0 if all OK, 1 if issues found

**When to use**:
- Before starting development
- When user data isn't saving
- After environment changes
- When troubleshooting authentication issues

---

### 2. `verify-env.js` 🔍

**Purpose**: Verifies environment variables during build process.

**Usage**:
```bash
node scripts/verify-env.js
```

**What it checks**:
- Critical variables (JWT_SECRET, Supabase credentials)
- Optional variables (API keys, external services)
- Provides warnings for missing optional variables

**When to use**:
- Automatically runs before build (`npm run build`)
- Manual verification after setup

---

## 🛠️ Root-Level Scripts

These scripts are in the project root directory:

### 3. `fix-auth-setup.sh` 🔧

**Purpose**: Interactive guided setup for authentication and database configuration.

**Usage**:
```bash
bash fix-auth-setup.sh
```

**What it does**:
1. Checks if `.env.local` exists
2. Validates environment variables
3. Can generate JWT secrets
4. Tests database connection
5. Provides step-by-step guidance

**Interactive features**:
- Prompts to create `.env.local` if missing
- Offers to generate JWT_SECRET
- Tests database connectivity
- Color-coded output with recommendations

---

### 4. `test-auth-endpoints.sh` 🧪

**Purpose**: Comprehensive test suite for authentication and database endpoints.

**Usage**:
```bash
bash test-auth-endpoints.sh
```

**What it tests**:
1. ✅ Health check endpoint
2. ✅ User registration
3. ✅ User login
4. ✅ Duplicate email prevention
5. ✅ Issue creation (authenticated)
6. ✅ Public access (unauthenticated)
7. ✅ Unauthorized access prevention
8. ✅ Invalid credentials rejection
9. ✅ Input validation
10. ✅ Password confirmation

**Output**:
- Pass/fail for each test
- Detailed error messages
- Summary report
- Test user credentials for verification

**Prerequisites**:
- Server must be running (`npm run dev`)
- Database must be configured

---

## 🚀 Quick Start Workflow

### First Time Setup

1. **Run diagnostics to see what's missing**:
   ```bash
   node scripts/diagnose-auth.js
   ```

2. **Use automated fix script**:
   ```bash
   bash fix-auth-setup.sh
   ```

3. **Follow the prompts to**:
   - Create `.env.local`
   - Add Supabase credentials
   - Generate JWT secret

4. **Verify everything works**:
   ```bash
   node scripts/diagnose-auth.js
   ```

5. **Test all endpoints**:
   ```bash
   npm run dev  # Start server first
   bash test-auth-endpoints.sh
   ```

---

## 🔍 Troubleshooting Guide

### Issue: "User data not saving"

```bash
# Step 1: Diagnose the problem
node scripts/diagnose-auth.js

# Step 2: Fix configuration
bash fix-auth-setup.sh

# Step 3: Restart server
pkill -f "next dev"
npm run dev

# Step 4: Test
bash test-auth-endpoints.sh
```

### Issue: "Database connection failed"

```bash
# Check environment variables
node scripts/diagnose-auth.js

# Verify credentials in Supabase dashboard
# Update .env.local with correct values

# Test health endpoint
curl http://localhost:3000/api/health
```

### Issue: "User registration fails"

**Common causes**:
1. Missing `SUPABASE_SERVICE_ROLE_KEY`
2. Database tables not created
3. RLS policies blocking inserts

**Fix**:
```bash
# Check for service role key
grep SUPABASE_SERVICE_ROLE_KEY .env.local

# If missing, add it from Supabase Dashboard → Settings → API

# Verify database schema deployed
# Run supabase/schema.sql in Supabase SQL Editor
```

---

## 📊 Script Output Examples

### Successful Diagnosis

```
╔══════════════════════════════════════════════════════════════╗
║     CityPulse Authentication & Database Diagnostic          ║
╚══════════════════════════════════════════════════════════════╝

══════════════════════════════════════════════════════════════════════
Environment Variables Check
══════════════════════════════════════════════════════════════════════

✅ .env.local file exists
✅ JWT_SECRET is configured
✅ NEXT_PUBLIC_SUPABASE_URL is set: https://...
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY is set: eyJ...
✅ SUPABASE_SERVICE_ROLE_KEY is set: eyJ...

══════════════════════════════════════════════════════════════════════
Issue Analysis & Recommendations
══════════════════════════════════════════════════════════════════════

✅ No critical issues detected!

Your authentication and database setup appears to be correct.
```

### Failed Tests

```
❌ FAIL - Database connection is DOWN
❌ FAIL - User registration failed
   Response: {"success":false,"error":"Database not configured"}

Issues detected:
   • SUPABASE_SERVICE_ROLE_KEY is missing - USER REGISTRATION WILL FAIL!

Recommendations:
   1. Get the key from Supabase Dashboard → Settings → API
   2. Add it to .env.local as SUPABASE_SERVICE_ROLE_KEY=your_key_here
```

---

## 🔐 Security Notes

### Safe to Share
- Script output (after redacting keys)
- Error messages
- Test results

### NEVER Share
- `.env.local` contents
- JWT_SECRET value
- SUPABASE_SERVICE_ROLE_KEY
- Any API keys or tokens

### Best Practices
1. Keep `.env.local` in `.gitignore` ✅
2. Use different keys for dev/prod
3. Rotate keys periodically
4. Never commit secrets to Git
5. Use environment variables in deployment

---

## 🎯 Script Dependencies

### Node.js Scripts
- **Runtime**: Node.js v18+ required
- **Dependencies**: Uses built-in Node modules (fs, path)
- **No npm install needed**: Scripts use only core modules

### Bash Scripts
- **Shell**: Bash 3.2+ (included on macOS/Linux)
- **Dependencies**: 
  - `curl` (for HTTP requests)
  - `grep` (for text processing)
  - `lsof` (for port checking)

---

## 📚 Related Documentation

- **`../SETUP_GUIDE.md`** - Complete setup instructions
- **`../FIX_USER_DATA_NOT_SAVING.md`** - Quick fix for data persistence
- **`../ISSUES_FOUND_AND_FIXED.md`** - Detailed issue analysis
- **`../README.md`** - Project overview

---

## 🤝 Contributing

### Adding New Diagnostic Checks

To add a new check to `diagnose-auth.js`:

```javascript
function checkNewFeature() {
  printHeader('New Feature Check');
  
  // Your check logic
  if (featureWorking) {
    printStatus('success', 'Feature is working');
  } else {
    printStatus('error', 'Feature needs attention');
  }
  
  return featureWorking;
}

// Add to main execution
const results = {
  envVars: checkEnvironmentVariables(),
  newFeature: checkNewFeature(),  // Add here
};
```

### Adding New Endpoint Tests

To add a test to `test-auth-endpoints.sh`:

```bash
print_header "Test N: Your New Test"

RESPONSE=$(curl -s "$BASE_URL/api/your-endpoint")
SUCCESS=$(echo "$RESPONSE" | grep -o '"success":true' || echo "")

if [ -n "$SUCCESS" ]; then
    print_test "pass" "Test passed"
else
    print_test "fail" "Test failed"
    echo "Response: $RESPONSE"
fi
```

---

## 🐛 Debugging Scripts

### Enable Verbose Mode

For bash scripts:
```bash
bash -x fix-auth-setup.sh
```

For Node scripts:
```bash
NODE_DEBUG=* node scripts/diagnose-auth.js
```

### Common Issues

1. **Permission Denied**
   ```bash
   chmod +x fix-auth-setup.sh
   chmod +x test-auth-endpoints.sh
   ```

2. **Module Not Found**
   - Ensure you're in project root
   - Check Node.js version: `node --version`

3. **curl Command Not Found**
   - macOS: Included by default
   - Linux: `sudo apt-get install curl`

---

## 📞 Support

If scripts don't work as expected:

1. Check you're in the project root directory
2. Verify Node.js is installed: `node --version`
3. Ensure bash is available: `bash --version`
4. Read error messages carefully
5. Check related documentation

For detailed help, see the main documentation files in the project root.

---

## ✨ Summary

| Script | Purpose | When to Use | Output |
|--------|---------|-------------|--------|
| `diagnose-auth.js` | Check configuration | Before setup, troubleshooting | Detailed diagnosis |
| `verify-env.js` | Verify env vars | Before build | Pass/fail status |
| `fix-auth-setup.sh` | Guided setup | Initial setup | Interactive prompts |
| `test-auth-endpoints.sh` | Test API | After setup | Test results |

**Pro Tip**: Run `diagnose-auth.js` whenever something doesn't work. It will tell you exactly what's wrong!

---

**Last Updated**: 2024
**Maintained By**: CityPulse Development Team