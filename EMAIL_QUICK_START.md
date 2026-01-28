# Email Notifications - Quick Start Guide

## ✅ What's Been Set Up

Email notifications are now fully integrated into OurStreet! Users will automatically receive professional emails when they:
- **Sign up** - Welcome email with account details and platform overview
- **Log in** - Security notification with login details (IP, time, device)

## 🚀 Quick Setup (3 Steps)

### 1. Environment Variables
Your `.env` file needs:
```env
RESEND_API_KEY=re_AzooEQsa_BdtfiZf1ZFTrBAZhjtZJU5rQ
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=citypulse-secret-key-change-in-production
```

These have been added to your `.env` file automatically.

### 2. Test It Out
```bash
# Start the dev server
npm run dev

# Visit http://localhost:3000/signup
# Create a new account with YOUR REAL EMAIL

# Check your inbox for the welcome email!
```

### 3. Test Login Email
```bash
# Visit http://localhost:3000/login
# Login with your credentials

# Check your inbox for the login notification!
```

## 📧 Email Features

### Welcome Email (Signup)
✨ **Professional Design** with brand colors
- Personalized greeting with user's name
- Platform overview and key features
- "Get Started" button to dashboard
- Account details (email, registration date)
- Security tips and best practices

### Login Notification Email
🔐 **Security Alert** for account safety
- Login confirmation with timestamp
- IP address and device/browser info
- Security warning if login wasn't recognized
- "Go to Dashboard" button
- Account security recommendations

## 🎨 Email Design Preview

```
┌─────────────────────────────────────┐
│  🏙️ OurStreet (Gradient Header)   │
├─────────────────────────────────────┤
│  Hello [Name]! 👋                   │
│                                     │
│  [Personalized message content]    │
│                                     │
│  ┌───────────────────────────┐     │
│  │   [Call-to-Action Button] │     │
│  └───────────────────────────┘     │
│                                     │
│  • Feature list or details          │
│  • Important information            │
│  • Security tips                    │
│                                     │
│  Best regards,                      │
│  The OurStreet Team                 │
├─────────────────────────────────────┤
│  Footer: Links | Support | Legal   │
└─────────────────────────────────────┘
```

## 📁 Files Added

- ✅ `lib/email.ts` - Email service with Resend integration
- ✅ `app/api/auth/signup/route.ts` - Updated with welcome email
- ✅ `app/api/auth/login/route.ts` - Updated with login email
- ✅ `.env` - Environment variables configured
- ✅ `EMAIL_SETUP.md` - Complete documentation
- ✅ `EMAIL_QUICK_START.md` - This file!

## ⚡ How It Works

### Signup Flow
```
User Signs Up
    ↓
Account Created
    ↓
JWT Token Generated
    ↓
Welcome Email Sent (async) ← Doesn't block signup!
    ↓
User Redirected to Dashboard
```

### Login Flow
```
User Logs In
    ↓
Credentials Verified
    ↓
JWT Token Generated
    ↓
Login Email Sent (async) ← Doesn't block login!
    ↓
User Redirected to Dashboard
```

**Key Point:** Emails are sent asynchronously, so authentication is never delayed!

## 🔍 Troubleshooting

### Email Not Received?
1. **Check spam/junk folder** - It might be filtered
2. **Wait 1-2 minutes** - Emails can take time
3. **Verify API key** - Check `.env` has correct key
4. **Check console logs** - Look for error messages
5. **Use real email** - Test emails won't work

### Console Shows Error?
```
Failed to send welcome email: [error]
```
Don't worry! The signup/login still works. Email failure doesn't break authentication.

### Resend Limits (Free Tier)
- 100 emails per day
- 3,000 emails per month
- Using test domain: `onboarding@resend.dev`

## 🎯 For Production

Before deploying to production:

1. **Verify your domain** in Resend dashboard
2. **Update from address** in `lib/email.ts`:
   ```typescript
   from: "OurStreet <noreply@yoursite.com>"
   ```
3. **Update environment variables**:
   ```env
   NEXT_PUBLIC_APP_URL=https://yoursite.com
   ```
4. **Consider upgrading** Resend plan if needed

## 📊 Testing Checklist

- [ ] Environment variables are set in `.env`
- [ ] Dev server is running (`npm run dev`)
- [ ] Created test account with real email
- [ ] Received welcome email in inbox
- [ ] Logged in with test account
- [ ] Received login notification email
- [ ] Emails look good on desktop
- [ ] Emails look good on mobile
- [ ] Brand colors match (purple/pink)
- [ ] All links work correctly

## 💡 What Users See

### Welcome Email Subject
> "Welcome to OurStreet - Account Created Successfully! 🎉"

### Login Email Subject
> "New Login to Your OurStreet Account 🔐"

Both emails:
- ✅ Mobile responsive
- ✅ Professional design
- ✅ Brand colors (#9E7AFF, #FE8BBB)
- ✅ Clear call-to-action
- ✅ Security information
- ✅ Support links

## 🎉 You're All Set!

Email notifications are live and ready to go!

**Next Steps:**
1. Test with your own email
2. Review the email designs
3. Customize if needed (see `EMAIL_SETUP.md`)
4. Deploy to production with custom domain

**Questions?**
- Full docs: `EMAIL_SETUP.md`
- Resend docs: https://resend.com/docs
- Check console for errors

---

**Made with ❤️ for OurStreet Community**