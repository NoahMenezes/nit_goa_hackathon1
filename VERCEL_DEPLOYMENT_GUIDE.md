# Vercel Deployment Guide - CityPulse Application

## 🚀 Complete Vercel Deployment with Admin Authentication

This guide covers deploying the CityPulse application to Vercel with the new admin authentication system.

---

## 📋 Prerequisites

Before deploying to Vercel, ensure you have:

1. ✅ Supabase account with database setup
2. ✅ Vercel account
3. ✅ GitHub repository connected to Vercel
4. ✅ All environment variables ready

---

## 🔧 Step 1: Prepare Environment Variables

You'll need to configure these environment variables in Vercel:

### Required Variables

```env
# Supabase Configuration (CRITICAL)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# JWT Configuration (CRITICAL)
JWT_SECRET=your_secure_jwt_secret_32_chars_minimum

# Admin Authentication (CRITICAL)
ADMIN_IDS=ADMIN001,ADMIN002,ADMIN003

# Application Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Optional Variables

```env
# MapTiler (if using maps)
NEXT_PUBLIC_MAPTILER_API_KEY=your_maptiler_key

# Cloudinary (if using image uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 🔐 Step 2: Generate Secure Credentials

### 1. Generate JWT Secret

```bash
# Generate a strong JWT secret
openssl rand -base64 32
```

Copy the output and use it as `JWT_SECRET`.

### 2. Get Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️

### 3. Create Admin IDs

Define your admin IDs (comma-separated):
```
ADMIN_IDS=ADMIN001,ADMIN002,ADMIN003
```

**Important**: Share these Admin IDs securely with your administrators. They'll need these IDs to log in.

---

## 🌐 Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Click "Add New" → "Project"

2. **Import Git Repository**
   - Select your GitHub repository
   - Click "Import"

3. **Configure Project**
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (or your project root)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

4. **Add Environment Variables**
   - Go to "Environment Variables" section
   - Add each variable from Step 1
   - Set for: **Production**, **Preview**, and **Development**

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow prompts and add environment variables when asked
```

---

## 🔒 Step 4: Configure Environment Variables in Vercel

### Via Dashboard

1. Go to your project in Vercel
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | Production, Preview, Development |
| `JWT_SECRET` | Generated secret | Production, Preview, Development |
| `ADMIN_IDS` | Comma-separated IDs | Production, Preview, Development |
| `NODE_ENV` | `production` | Production only |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL | Production, Preview, Development |

4. Click "Save" after each entry
5. Redeploy the application for changes to take effect

### Via Vercel CLI

```bash
# Set production environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add JWT_SECRET production
vercel env add ADMIN_IDS production
vercel env add NODE_ENV production

# Redeploy
vercel --prod
```

---

## 🗄️ Step 5: Setup Supabase Database

Ensure your Supabase database has all required tables:

1. **Go to Supabase SQL Editor**
   - https://supabase.com/dashboard/project/YOUR_PROJECT/editor

2. **Run the Schema**
   - Open your project's `supabase/schema.sql`
   - Copy all contents
   - Paste into SQL Editor
   - Click "Run"

3. **Verify Tables Created**
   - Go to Table Editor
   - Confirm these tables exist:
     - `users`
     - `issues`
     - `comments`
     - `votes`

4. **Check RLS Policies**
   - Ensure Row Level Security is enabled
   - Verify policies allow proper access

---

## ✅ Step 6: Verify Deployment

### 1. Check Health Endpoint

Visit: `https://your-app.vercel.app/api/health`

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

### 2. Test Citizen Signup

```bash
curl -X POST https://your-app.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123",
    "confirmPassword": "TestPass123"
  }'
```

### 3. Test Admin Login

```bash
curl -X POST https://your-app.vercel.app/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourapp.com",
    "password": "AdminPass123",
    "adminId": "ADMIN001"
  }'
```

### 4. Visit Application

- Homepage: `https://your-app.vercel.app`
- Citizen Login: `https://your-app.vercel.app/login`
- Citizen Signup: `https://your-app.vercel.app/signup`
- Admin Login: `https://your-app.vercel.app/login` (use Admin toggle)

---

## 🎯 Admin Authentication Flow

### How Admin Login Works

1. **Admins cannot sign up** through the regular signup page
2. **Admin accounts must be created manually** in the database
3. **Admin login requires three credentials**:
   - Email
   - Password
   - Admin ID (from `ADMIN_IDS` environment variable)

### Creating Admin Accounts

#### Option 1: Via Supabase Dashboard

1. Go to Supabase Table Editor
2. Open `users` table
3. Click "Insert row"
4. Fill in:
   - `email`: admin@yourapp.com
   - `password`: (hash using bcrypt)
   - `role`: admin
   - `name`: Admin Name
5. Save

#### Option 2: Via SQL

```sql
-- Insert admin user (password must be hashed with bcrypt)
-- Example: password "AdminPass123" hashed
INSERT INTO users (name, email, password, role)
VALUES (
  'Admin User',
  'admin@yourapp.com',
  '$2b$10$Ut7Ku4Dlnf0CUX4wjKHVAuTCCW2kFlp7QodpsCjsessXvlZ1rYqtK',
  'admin'
);
```

#### Option 3: Create Admin Script

Create a file `scripts/create-admin.js`:

```javascript
const bcrypt = require('bcryptjs');

async function generateAdminPassword() {
  const password = 'YourAdminPassword';
  const hash = await bcrypt.hash(password, 10);
  console.log('Password hash:', hash);
  console.log('Use this in your SQL INSERT statement');
}

generateAdminPassword();
```

Run: `node scripts/create-admin.js`

---

## 🔐 Security Best Practices

### 1. Environment Variables

- ✅ Never commit `.env.local` to Git
- ✅ Use different secrets for dev/staging/production
- ✅ Rotate `JWT_SECRET` periodically
- ✅ Keep `SUPABASE_SERVICE_ROLE_KEY` secret
- ✅ Use strong, unique Admin IDs

### 2. Admin IDs

- ✅ Use random, unpredictable IDs
- ✅ Don't use sequential IDs (e.g., ADMIN001, ADMIN002)
- ✅ Generate with: `openssl rand -hex 8`
- ✅ Share securely (never via email/Slack)

### 3. Database Security

- ✅ Enable Row Level Security (RLS)
- ✅ Review RLS policies regularly
- ✅ Use service role key only in backend
- ✅ Monitor admin login attempts

### 4. Production Hardening

```env
# Use strong JWT secret (32+ characters)
JWT_SECRET=$(openssl rand -base64 32)

# Use cryptographically secure Admin IDs
ADMIN_IDS=$(openssl rand -hex 8),$(openssl rand -hex 8)
```

---

## 🐛 Troubleshooting

### Issue: "Database not configured"

**Solution:**
- Verify `NEXT_PUBLIC_SUPABASE_URL` is set
- Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- Check variables are set for correct environment
- Redeploy after adding variables

### Issue: "User registration fails"

**Solution:**
- Check `SUPABASE_SERVICE_ROLE_KEY` is set
- Verify database schema is deployed
- Check RLS policies allow user creation

### Issue: "Invalid Admin ID"

**Solution:**
- Check `ADMIN_IDS` environment variable is set
- Verify Admin ID matches exactly (case-sensitive)
- Check for typos or extra spaces
- Redeploy after updating

### Issue: "Admin account doesn't exist"

**Solution:**
- Admin accounts must be created manually
- Use Supabase Dashboard or SQL to create
- Ensure `role` is set to 'admin' or 'authority'

### Issue: Build fails on Vercel

**Solution:**
```bash
# Check build locally first
npm run build

# View build logs in Vercel dashboard
# Common issues:
# - Missing dependencies
# - Type errors
# - Missing environment variables during build
```

---

## 📊 Monitoring & Logs

### View Deployment Logs

1. Go to Vercel Dashboard
2. Select your project
3. Click on the deployment
4. View "Build Logs" and "Function Logs"

### Check Runtime Logs

```bash
# Using Vercel CLI
vercel logs

# Filter by function
vercel logs --filter=/api/auth/admin-login
```

### Monitor Performance

- Vercel Analytics: Dashboard → Analytics
- Check API response times
- Monitor error rates
- Track admin login attempts

---

## 🔄 Updating Deployment

### Update Environment Variables

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Update the variable
3. Click "Save"
4. Go to Deployments
5. Click "Redeploy" on latest deployment

### Update Code

```bash
# Push to main branch
git add .
git commit -m "Update authentication"
git push origin main

# Vercel auto-deploys on push
# Or manually trigger:
vercel --prod
```

---

## 📱 Multi-Environment Setup

### Development

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
ADMIN_IDS=DEV_ADMIN001,DEV_ADMIN002
```

### Preview (Staging)

```env
NEXT_PUBLIC_APP_URL=https://your-app-preview.vercel.app
NODE_ENV=production
ADMIN_IDS=STAGING_ADMIN001,STAGING_ADMIN002
```

### Production

```env
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
ADMIN_IDS=PROD_ADMIN_X7K9M2,PROD_ADMIN_P3Q8N5
```

---

## ✅ Deployment Checklist

Before going live, verify:

- [ ] All environment variables set in Vercel
- [ ] JWT_SECRET is strong and unique
- [ ] ADMIN_IDS are cryptographically secure
- [ ] SUPABASE_SERVICE_ROLE_KEY is set
- [ ] Database schema deployed to Supabase
- [ ] RLS policies are active
- [ ] Health endpoint returns "up"
- [ ] Test citizen signup works
- [ ] Test admin login works
- [ ] Admin accounts created in database
- [ ] Admin IDs shared securely with admins
- [ ] Domain configured (if custom)
- [ ] SSL/HTTPS enabled (automatic on Vercel)
- [ ] Error tracking configured
- [ ] Monitoring enabled

---

## 🎓 Summary

### Authentication System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    CityPulse Auth Flow                  │
└─────────────────────────────────────────────────────────┘

Citizen Flow:
1. Visit /signup → Create account (role: citizen)
2. Visit /login → Login with email + password
3. Redirected to /dashboard

Admin Flow:
1. Admin account created manually in database
2. Visit /login → Toggle "Admin Login"
3. Enter: email + password + Admin ID
4. System verifies all three credentials
5. Redirected to /admin

Security:
- Citizens cannot signup as admin
- Admins must have valid Admin ID
- Admin IDs stored in environment variable
- Rate limiting: 3 attempts for admin login
- All passwords hashed with bcrypt
- JWT tokens for session management
```

---

## 📞 Support & Resources

### Vercel Documentation
- [Next.js Deployment](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

### Supabase Documentation
- [Getting Started](https://supabase.com/docs)
- [Database Guide](https://supabase.com/docs/guides/database)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

### CityPulse Documentation
- `SETUP_GUIDE.md` - Local development setup
- `FIX_USER_DATA_NOT_SAVING.md` - Database troubleshooting
- `ISSUES_FOUND_AND_FIXED.md` - Common issues and solutions

---

**Last Updated**: 2024  
**Status**: Production Ready ✅  
**Vercel Compatible**: Yes ✅  
**Admin Auth**: Implemented ✅