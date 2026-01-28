# Environment Variables Documentation

This document lists all environment variables used by the OurStreet/CityPulse application.

## 🔴 Critical Variables (Required)

These variables **MUST** be set for the application to function securely in production.

### `JWT_SECRET`

**Required in production**

Secret key used to sign and verify JWT authentication tokens.

- **Minimum length**: 32 characters
- **Generate with**: `openssl rand -base64 32`
- **Impact if missing**: App will fail to start in production; uses insecure fallback in development

```bash
JWT_SECRET=your-secure-random-string-at-least-32-chars
```

### `NEXT_PUBLIC_APP_URL`

**Required for email links and CORS**

The public URL where the application is hosted.

```bash
# Development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## 🟡 Recommended Variables (Data Persistence)

Without these, the app uses an in-memory database and **data will be lost on restart**.

### `NEXT_PUBLIC_SUPABASE_URL`

Your Supabase project URL.

- **Get from**: Supabase Dashboard → Settings → API → Project URL

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Your Supabase anonymous/public key.

- **Get from**: Supabase Dashboard → Settings → API → anon/public key

```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### `SUPABASE_SERVICE_ROLE_KEY`

Supabase service role key for server-side admin operations. This key bypasses Row Level Security (RLS).

- **⚠️ Never expose to client-side code**
- **Get from**: Supabase Dashboard → Settings → API → service_role key

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🟢 Optional Variables (Enhanced Features)

### AI Categorization

#### `GEMINI_API_KEY`

Google Gemini API key for AI-powered issue categorization.

- **Get from**: [Google AI Studio](https://aistudio.google.com/)
- **Fallback**: Uses rule-based categorization when not set

```bash
GEMINI_API_KEY=AIzaSy...
```

#### `GEMINI_MODEL`

Which Gemini model to use. Defaults to `gemini-1.5-flash`.

```bash
GEMINI_MODEL=gemini-1.5-flash
```

### Maps

#### `NEXT_PUBLIC_MAPTILER_API_KEY`

MapTiler API key for interactive maps.

- **Get from**: [MapTiler Cloud](https://cloud.maptiler.com/)
- **Free tier**: 100,000 map loads/month

```bash
NEXT_PUBLIC_MAPTILER_API_KEY=abc123...
```

### Voice Agent

#### `NEXT_PUBLIC_AGENT_ID`

ElevenLabs voice agent ID for voice chat feature.

- **Get from**: ElevenLabs Dashboard → Conversational AI → Your Agent

```bash
NEXT_PUBLIC_AGENT_ID=agent_xxxxx
```

### Image Uploads

#### `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`

Cloudinary cloud name for image uploads.

```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
```

#### `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`

Cloudinary unsigned upload preset.

```bash
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
```

### Email Notifications (Not yet implemented)

#### `RESEND_API_KEY`

Resend API key for email notifications.

```bash
RESEND_API_KEY=re_...
```

### SMS Notifications (Not yet implemented)

#### `TWILIO_ACCOUNT_SID`

Twilio Account SID.

```bash
TWILIO_ACCOUNT_SID=AC...
```

#### `TWILIO_AUTH_TOKEN`

Twilio Auth Token.

```bash
TWILIO_AUTH_TOKEN=abc...
```

#### `TWILIO_PHONE_NUMBER`

Twilio phone number for sending SMS.

```bash
TWILIO_PHONE_NUMBER=+1234567890
```

---

## 🔒 Security Configuration

### `REQUIRE_AUTH_FOR_ISSUES`

Set to `true` to require authentication for issue creation. By default, guest users can create issues (for demo purposes).

```bash
REQUIRE_AUTH_FOR_ISSUES=true
```

---

## 📋 Complete Example (.env.local)

```bash
# ═══════════════════════════════════════════════════════════════════════
# CRITICAL (Required for production)
# ═══════════════════════════════════════════════════════════════════════

# JWT Secret - Generate with: openssl rand -base64 32
JWT_SECRET=your-secure-random-string-at-least-32-characters-long

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ═══════════════════════════════════════════════════════════════════════
# RECOMMENDED (For data persistence)
# ═══════════════════════════════════════════════════════════════════════

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ═══════════════════════════════════════════════════════════════════════
# OPTIONAL (Enhanced features)
# ═══════════════════════════════════════════════════════════════════════

# AI Categorization (Google Gemini)
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash

# Maps (MapTiler)
NEXT_PUBLIC_MAPTILER_API_KEY=your-maptiler-key

# Voice Agent (ElevenLabs)
NEXT_PUBLIC_AGENT_ID=agent_xxxxx

# Image Uploads (Cloudinary)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-preset

# ═══════════════════════════════════════════════════════════════════════
# SECURITY (Production settings)
# ═══════════════════════════════════════════════════════════════════════

# Require authentication for issue creation (recommended for production)
REQUIRE_AUTH_FOR_ISSUES=true
```

---

## 🔍 Verification

Run the environment verification script to check your configuration:

```bash
npm run verify-env
```

Or check the health endpoint:

```bash
curl http://localhost:3000/api/health
```

---

## 🚀 Deployment Checklist

Before deploying to production, ensure:

- [ ] `JWT_SECRET` is set to a unique, secure value (32+ characters)
- [ ] `NEXT_PUBLIC_APP_URL` points to your production domain
- [ ] Supabase credentials are configured for data persistence
- [ ] `REQUIRE_AUTH_FOR_ISSUES=true` if you want to require authentication
- [ ] No hardcoded secrets in source code
- [ ] Environment variables are set in your hosting platform (Vercel, etc.)