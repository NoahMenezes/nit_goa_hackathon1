# Email Notification Setup Guide

## 📧 Overview

OurStreet now sends professional email notifications to users for authentication events using Resend API.

## ✨ Features Implemented

### 1. Welcome Email (Signup)
When a user creates a new account, they receive a beautifully designed welcome email containing:
- **Personalized greeting** with their name
- **Account confirmation** message
- **Platform overview** and key features
- **Call-to-action button** to access dashboard
- **Account details** (email, registration date)
- **Security tips** and best practices
- **Professional branding** with gradient header

### 2. Login Notification Email
When a user logs into their account, they receive a security notification email with:
- **Login confirmation** notification
- **Session details** (date, time, IP address, browser/device)
- **Security alert** if login wasn't recognized
- **Quick access button** to dashboard
- **Security recommendations**
- **Professional design** matching brand colors

## 🛠️ Setup Instructions

### Step 1: Install Dependencies

The `resend` package has been installed:
```bash
npm install resend
```

### Step 2: Configure Environment Variables

Your `.env` file should contain:
```env
RESEND_API_KEY=re_AzooEQsa_BdtfiZf1ZFTrBAZhjtZJU5rQ
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important Notes:**
- The `.env` file has been created from `.env.example`
- RESEND_API_KEY is already configured
- Change `NEXT_PUBLIC_APP_URL` to your production URL when deploying

### Step 3: Verify Resend Domain (Production)

For production use, you need to:
1. Go to [Resend Dashboard](https://resend.com/domains)
2. Add and verify your custom domain
3. Update the `from` field in `lib/email.ts`:
   ```typescript
   from: "OurStreet <noreply@yourdomain.com>"
   ```

Currently using: `onboarding@resend.dev` (Resend's test domain)

## 📁 Files Created/Modified

### New Files
1. **`lib/email.ts`** - Email service with Resend integration
   - `sendEmail()` - Generic email sending function
   - `sendWelcomeEmail()` - Welcome email for new signups
   - `sendLoginEmail()` - Login notification email

### Modified Files
1. **`app/api/auth/signup/route.ts`**
   - Added welcome email after successful signup
   - Email sent asynchronously (doesn't block signup)
   - Error handling (signup still succeeds if email fails)

2. **`app/api/auth/login/route.ts`**
   - Added login notification email
   - Includes IP address and user agent
   - Sent asynchronously (doesn't block login)
   - Error handling (login still succeeds if email fails)

3. **`.env.example`**
   - Already contains RESEND_API_KEY configuration

4. **`.env`**
   - Created from .env.example with your API key

## 🎨 Email Design

Both emails feature:
- **Modern, responsive design** that works on all devices
- **Brand colors** (Purple #9E7AFF, Pink #FE8BBB)
- **Professional typography** with system fonts
- **Gradient headers** matching your website design
- **Clear call-to-action buttons**
- **Footer with links** (Website, Dashboard, Support)
- **Security information** and tips

### Email Preview Structure

```
┌─────────────────────────────────┐
│  Gradient Header (Purple/Pink) │
│       🏙️ OurStreet             │
└─────────────────────────────────┘
│                                 │
│  Personalized Greeting          │
│  Main Message Content           │
│  ┌───────────────────────┐      │
│  │  [Action Button]      │      │
│  └───────────────────────┘      │
│  Feature List / Details         │
│  Security Tips / Info           │
│  Signature                      │
│                                 │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│  Footer (Links, Copyright)      │
└─────────────────────────────────┘
```

## 🔒 Security Features

### Login Email Security
- **IP Address tracking** - Shows where login occurred
- **Device/Browser info** - User agent details
- **Timestamp** - Exact login time with timezone
- **Security warning** - Alert if login wasn't recognized
- **Action button** - Quick access to account

### Privacy & Compliance
- Emails sent only for authentication events
- User email never shared with third parties
- Unsubscribe link can be added if needed
- GDPR compliant (informational emails)

## 🚀 Testing

### Test Signup Email
1. Start your development server:
   ```bash
   npm run dev
   ```

2. Visit: `http://localhost:3000/signup`

3. Create a new account with a **real email address**

4. Check your inbox for the welcome email

### Test Login Email
1. Visit: `http://localhost:3000/login`

2. Login with your credentials

3. Check your inbox for the login notification

### Troubleshooting

**Email not received?**
- Check spam/junk folder
- Verify RESEND_API_KEY is correct in `.env`
- Check console logs for errors
- Verify your email address is valid
- Wait a few minutes (emails might be delayed)

**Resend free tier limits:**
- 100 emails per day
- 3,000 emails per month
- Using test domain `onboarding@resend.dev`

## 📊 Email Behavior

### Asynchronous Sending
Emails are sent **asynchronously** to avoid blocking:
- Signup completes immediately
- Login completes immediately
- Email sends in background
- If email fails, user isn't affected

### Error Handling
```typescript
sendWelcomeEmail(user.name, user.email).catch((error) => {
  console.error("Failed to send welcome email:", error);
  // Signup still succeeds
});
```

## 🎯 Customization Options

### Change Email Content

Edit `lib/email.ts` to customize:

**Welcome Email:**
- Subject line
- Greeting message
- Feature list
- Button text/URL
- Footer content

**Login Email:**
- Security message
- Alert box styling
- Security tips
- Button text/URL

### Add More Email Types

You can add more email functions:

```typescript
export async function sendPasswordResetEmail(email: string, resetToken: string) {
  // Implementation
}

export async function sendIssueUpdateEmail(email: string, issueTitle: string) {
  // Implementation
}
```

### Change Email Styling

Modify the inline CSS in the HTML templates:
- Colors: Update hex values
- Fonts: Change font-family
- Layout: Adjust padding, margins
- Buttons: Modify button styles

## 📈 Production Deployment

### Before Going Live:

1. **Verify Your Domain**
   - Add your domain to Resend
   - Update DNS records
   - Wait for verification

2. **Update Configuration**
   ```env
   RESEND_API_KEY=re_your_production_key
   NEXT_PUBLIC_APP_URL=https://yoursite.com
   ```

3. **Update From Address**
   ```typescript
   from: "OurStreet <noreply@yoursite.com>"
   ```

4. **Upgrade Resend Plan** (if needed)
   - Free: 3,000 emails/month
   - Pro: 50,000+ emails/month

5. **Add Monitoring**
   - Track email delivery rates
   - Monitor bounce rates
   - Set up alerts for failures

## 📝 Email Templates

### Welcome Email Includes:
✅ Personalized greeting
✅ Success confirmation
✅ Platform feature overview
✅ Dashboard access button
✅ Account details
✅ Security tips
✅ Support information

### Login Email Includes:
✅ Login confirmation
✅ Session details (time, IP, device)
✅ Security alert message
✅ Dashboard quick access
✅ Security recommendations
✅ Support contact

## 🔍 Monitoring & Analytics

### Check Email Status
Visit [Resend Dashboard](https://resend.com/emails) to:
- View sent emails
- Check delivery status
- See open rates (if enabled)
- Monitor failures/bounces

### Console Logging
Errors are logged to console:
```
Failed to send welcome email: [error details]
Failed to send login notification email: [error details]
```

## ✅ Checklist

- [x] Resend package installed
- [x] Email service created (`lib/email.ts`)
- [x] Welcome email implemented
- [x] Login email implemented
- [x] Signup route updated
- [x] Login route updated
- [x] Environment variables configured
- [x] Error handling added
- [x] Asynchronous sending
- [x] Professional email design
- [x] Mobile responsive templates
- [ ] Custom domain verified (for production)
- [ ] Production deployment

## 🎉 Result

Your users will now receive:
- **Professional welcome email** when they sign up
- **Security notification email** when they log in
- **Beautiful branded emails** matching your website design
- **Important account information** and security tips

All emails are sent automatically, don't block authentication, and provide a great user experience!

## 💡 Future Enhancements

Consider adding:
- Password reset emails
- Issue status update notifications
- Weekly digest emails
- Community activity notifications
- Email preferences/settings page
- Unsubscribe functionality
- Email templates in multiple languages

---

**Questions or Issues?**
- Check Resend documentation: https://resend.com/docs
- Review console logs for errors
- Test with different email providers
- Contact Resend support if needed