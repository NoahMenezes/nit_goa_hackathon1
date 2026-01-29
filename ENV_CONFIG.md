# Complete .env.local Configuration Guide

Copy this entire configuration to your `.env.local` file in the project root and fill in your actual API keys.

---

## 📋 Complete .env.local Template

```env
# ═══════════════════════════════════════════════════════════════════════
# 🔴 CRITICAL - Required for Production
# ═══════════════════════════════════════════════════════════════════════

# JWT Secret - MUST be at least 32 characters
# Generate with: openssl rand -base64 32
# CHANGE THIS IN PRODUCTION!
JWT_SECRET=citypulse-secret-key-change-in-production-use-openssl-rand-base64-32

# Application URL - Change to your production domain when deploying
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ═══════════════════════════════════════════════════════════════════════
# 🟡 RECOMMENDED - Database & Data Persistence (Supabase - Dual Database)
# ═══════════════════════════════════════════════════════════════════════
# We use TWO separate Supabase databases:
# 1. CITIZEN Database - For regular users/citizens
# 2. ADMIN Database - For administrators

# ─────────────────────────────────────────────────────────────────────
# CITIZEN Database (Primary/Default)
# ─────────────────────────────────────────────────────────────────────
# Get from: https://supabase.com/dashboard/project/_/settings/api
# This database is used for:
# - Citizen signups (default)
# - Citizen logins
# - Issue reporting by citizens

NEXT_PUBLIC_SUPABASE_CITIZEN_URL=your_citizen_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_CITIZEN_ANON_KEY=your_citizen_supabase_anon_key_here
SUPABASE_CITIZEN_SERVICE_ROLE_KEY=your_citizen_supabase_service_role_key_here

# ─────────────────────────────────────────────────────────────────────
# ADMIN Database (Administrative)
# ─────────────────────────────────────────────────────────────────────
# Get from: https://supabase.com/dashboard/project/_/settings/api
# This database is used for:
# - Admin signups
# - Admin logins
# - Administrative operations

NEXT_PUBLIC_SUPABASE_ADMIN_URL=your_admin_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ADMIN_ANON_KEY=your_admin_supabase_anon_key_here
SUPABASE_ADMIN_SERVICE_ROLE_KEY=your_admin_supabase_service_role_key_here

# ═══════════════════════════════════════════════════════════════════════
# 🟢 OPTIONAL - Enhanced Features
# ═══════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────────
# MapTiler - Interactive Maps
# ─────────────────────────────────────────────────────────────────────
# Get from: https://cloud.maptiler.com/
# Free tier: 100,000 map loads/month
# Steps: 1. Create account → 2. Dashboard → 3. API Keys section

NEXT_PUBLIC_MAPTILER_API_KEY=your_maptiler_api_key_here

# ─────────────────────────────────────────────────────────────────────
# ElevenLabs - Voice Agent
# ─────────────────────────────────────────────────────────────────────
# Get from: https://elevenlabs.io/app/conversational-ai
# Pre-configured agent (you can use this or replace with your own)

ELEVENLABS_AI_AGENT=agent_8701kfjzrrhcf408keqd06k3pryw
NEXT_PUBLIC_AGENT_ID=agent_8701kfjzrrhcf408keqd06k3pryw
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=agent_8701kfjzrrhcf408keqd06k3pryw

# ─────────────────────────────────────────────────────────────────────
# Google Gemini - AI Categorization
# ─────────────────────────────────────────────────────────────────────
# Get from: https://aistudio.google.com/app/apikey
# Free tier: 1,500 requests/day
# Fallback: Uses rule-based categorization if not set

GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# ─────────────────────────────────────────────────────────────────────
# Cloudinary - Image Uploads
# ─────────────────────────────────────────────────────────────────────
# Get from: https://cloudinary.com/console
# Steps: 1. Dashboard → 2. Settings → 3. Upload → 4. Create unsigned preset

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name_here
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_upload_preset_here

# ─────────────────────────────────────────────────────────────────────
# Resend - Email Notifications
# ─────────────────────────────────────────────────────────────────────
# Get from: https://resend.com/api-keys
# Free tier: 100 emails/day, 3,000/month
# Pre-configured key (you can use this or replace with your own)

RESEND_API_KEY=re_AzooEQsa_BdtfiZf1ZFTrBAZhjtZJU5rQ

# ─────────────────────────────────────────────────────────────────────
# Twilio - SMS Notifications (Future Implementation)
# ─────────────────────────────────────────────────────────────────────
# Get from: https://console.twilio.com/
# Not yet implemented in the app

# TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
# TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
# TWILIO_PHONE_NUMBER=+1234567890

# ═══════════════════════════════════════════════════════════════════════
# 🔒 SECURITY & CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════

# Require authentication for issue creation
# Set to 'true' in production to prevent spam
REQUIRE_AUTH_FOR_ISSUES=false

# Node Environment
NODE_ENV=development
```

---

## 🎯 Quick Setup Priority

### ⚡ Minimum to Get Started (5 minutes)
Just add these to start using the app:
```env
JWT_SECRET=citypulse-secret-key-change-in-production
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### ⭐ Recommended Setup (15 minutes)
Add these for full functionality with data persistence:
```env
# From above PLUS:

# Citizen Database (Required)
NEXT_PUBLIC_SUPABASE_CITIZEN_URL=...
NEXT_PUBLIC_SUPABASE_CITIZEN_ANON_KEY=...
SUPABASE_CITIZEN_SERVICE_ROLE_KEY=...

# Admin Database (Required)
NEXT_PUBLIC_SUPABASE_ADMIN_URL=...
NEXT_PUBLIC_SUPABASE_ADMIN_ANON_KEY=...
SUPABASE_ADMIN_SERVICE_ROLE_KEY=...

# Other services
NEXT_PUBLIC_MAPTILER_API_KEY=...
GEMINI_API_KEY=...
```

### 🚀 Complete Setup (30 minutes)
Add all variables for every feature.

---

## 📍 Where to Get Each API Key

### 1. MapTiler (Required for Maps)
- **URL**: https://cloud.maptiler.com/
- **Steps**:
  1. Create free account
  2. Go to Dashboard
  3. Click "API Keys" in left menu
  4. Copy your key or create new one
- **Free Tier**: 100,000 map loads/month

### 2. Supabase (Required for Data Persistence - DUAL DATABASE SETUP)
- **URL**: https://supabase.com/dashboard
- **Important**: You need to create **TWO separate projects** - one for Citizens and one for Admins
- **Steps for EACH project**:
  1. Create new project (repeat for both Citizen and Admin)
  2. Go to Settings → API
  3. For **CITIZEN Database**:
     - Copy "Project URL" → `NEXT_PUBLIC_SUPABASE_CITIZEN_URL`
     - Copy "anon/public" key → `NEXT_PUBLIC_SUPABASE_CITIZEN_ANON_KEY`
     - Copy "service_role" key → `SUPABASE_CITIZEN_SERVICE_ROLE_KEY`
  4. For **ADMIN Database**:
     - Copy "Project URL" → `NEXT_PUBLIC_SUPABASE_ADMIN_URL`
     - Copy "anon/public" key → `NEXT_PUBLIC_SUPABASE_ADMIN_ANON_KEY`
     - Copy "service_role" key → `SUPABASE_ADMIN_SERVICE_ROLE_KEY`
- **Free Tier**: 500MB database, 1GB file storage (per project)
- **Why Two Databases?**: 
  - Complete data separation between citizens and administrators
  - Enhanced security and access control
  - Independent scaling and management

### 3. Google Gemini (Optional - AI Features)
- **URL**: https://aistudio.google.com/app/apikey
- **Steps**:
  1. Sign in with Google account
  2. Click "Get API Key"
  3. Create API key
  4. Copy the key
- **Free Tier**: 1,500 requests/day

### 4. ElevenLabs (Optional - Voice Agent)
- **URL**: https://elevenlabs.io/app/conversational-ai
- **Steps**:
  1. Create account
  2. Go to Conversational AI
  3. Create or select an agent
  4. Copy the Agent ID
- **Note**: Pre-configured agent already included in template

### 5. Cloudinary (Optional - Image Uploads)
- **URL**: https://cloudinary.com/console
- **Steps**:
  1. Create free account
  2. Dashboard → Settings → Upload
  3. Scroll to "Upload presets"
  4. Create "Unsigned" upload preset
  5. Copy Cloud Name and Preset Name
- **Free Tier**: 25GB storage, 25GB bandwidth/month

### 6. Resend (Optional - Email Notifications)
- **URL**: https://resend.com/api-keys
- **Steps**:
  1. Create account
  2. Go to API Keys
  3. Create new API key
  4. Copy the key
- **Note**: Pre-configured key already included in template
- **Free Tier**: 100 emails/day, 3,000/month

---

## 🔐 Security Best Practices

1. **Never commit `.env.local` to Git** (already in .gitignore)
2. **Generate strong JWT_SECRET** in production:
   ```bash
   openssl rand -base64 32
   ```
3. **Keep service role keys secret** - never expose to client
4. **Use different keys** for development and production
5. **Rotate API keys** periodically in production

---

## ✅ Verification

After setting up your `.env.local`, verify the configuration:

```bash
# Check if all required variables are set
npm run verify-env

# Or test the health endpoint
npm run dev
# Then visit: http://localhost:3000/api/health
```

---

## 🚨 Troubleshooting

### "JWT_SECRET not configured"
- Add `JWT_SECRET` with at least 32 characters to `.env.local`
- Restart your dev server

### "MapTiler API key not configured"
- Add `NEXT_PUBLIC_MAPTILER_API_KEY` to `.env.local`
- Get key from https://cloud.maptiler.com/
- Restart dev server

### "AI service is not configured"
- Add `GEMINI_API_KEY` to `.env.local`
- Get key from https://aistudio.google.com/app/apikey
- Optional - app will use rule-based categorization as fallback

### "Using in-memory database"
- Add Supabase credentials to `.env.local`
- Make sure you've set up BOTH citizen and admin database credentials
- Data will persist after adding Supabase configurations

### "Citizen/Admin database not configured"
- Ensure you've created TWO separate Supabase projects
- Check that all 6 Supabase environment variables are set (3 for each database)
- Verify the URLs are correct and keys match their respective projects

### Maps not loading
- Verify `NEXT_PUBLIC_MAPTILER_API_KEY` is correct
- Check browser console for errors
- Ensure key has proper permissions in MapTiler dashboard

---

## 📦 After Configuration

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **Test the features**:
   - Visit `/dashboard` - should see maps
   - Visit `/voice-agent` - should see voice assistant
   - Create an issue - should work with AI categorization
   - Check `/api/health` - should show all services configured

3. **For production deployment**, update:
   - `NEXT_PUBLIC_APP_URL` to your production domain
   - `JWT_SECRET` to a new secure value
   - Set all keys in your hosting platform (Vercel, etc.)

---

## 📝 Notes

- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- Other variables are only accessible server-side
- The app will work with minimal configuration but some features will be disabled
- Pre-configured keys (ElevenLabs, Resend) are included for quick testing
- Replace pre-configured keys with your own for production use
- **IMPORTANT**: The dual-database setup requires TWO separate Supabase projects:
  - Citizen Database: Used by default for all citizen operations
  - Admin Database: Used only for admin authentication and operations
  - Both databases should have identical table schemas but separate data

---

## 🆘 Need Help?

- Check `/api/health` endpoint for service status
- Run `npm run verify-env` to check configuration
- See `docs/ENV_VARIABLES.md` for detailed documentation
- Check browser console for client-side errors
- Check terminal/server logs for backend errors