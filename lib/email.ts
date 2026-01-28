import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    const data = await resend.emails.send({
      from: "OurStreet <onboarding@resend.dev>", // Change this to your verified domain
      to: [to],
      subject,
      html,
    });

    return { success: true, data };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error };
  }
}

export async function sendWelcomeEmail(name: string, email: string) {
  const subject = "Welcome to OurStreet - Account Created Successfully! 🎉";
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to OurStreet</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          .header {
            background: linear-gradient(135deg, #9E7AFF 0%, #FE8BBB 100%);
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 32px;
            font-weight: bold;
          }
          .content {
            padding: 40px 30px;
            color: #333333;
            line-height: 1.6;
          }
          .content h2 {
            color: #9E7AFF;
            font-size: 24px;
            margin-top: 0;
          }
          .content p {
            font-size: 16px;
            margin: 16px 0;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #9E7AFF 0%, #FE8BBB 100%);
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
          }
          .features {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 8px;
            margin: 24px 0;
          }
          .features ul {
            margin: 12px 0;
            padding-left: 20px;
          }
          .features li {
            margin: 8px 0;
            color: #555555;
          }
          .footer {
            background-color: #f5f5f5;
            padding: 30px;
            text-align: center;
            color: #888888;
            font-size: 14px;
          }
          .footer a {
            color: #9E7AFF;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏙️ OurStreet</h1>
          </div>

          <div class="content">
            <h2>Welcome to OurStreet, ${name}! 🎉</h2>

            <p>
              Congratulations! Your account has been successfully created. We're thrilled to have you join our community of engaged citizens working together to make our streets better.
            </p>

            <p>
              OurStreet is your platform to report civic issues, track their resolution in real-time, and collaborate with your community and local authorities to create lasting positive change.
            </p>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard" class="button">
                Get Started Now
              </a>
            </div>

            <div class="features">
              <h3 style="color: #9E7AFF; margin-top: 0;">What You Can Do:</h3>
              <ul>
                <li><strong>Report Issues:</strong> Submit civic problems with photos, descriptions, and GPS location</li>
                <li><strong>Track Progress:</strong> Monitor the status of reported issues in real-time</li>
                <li><strong>View Interactive Map:</strong> See all community issues on a city-wide map</li>
                <li><strong>Community Engagement:</strong> Upvote issues and collaborate with neighbors</li>
                <li><strong>Impact Analytics:</strong> Access comprehensive reports and statistics</li>
              </ul>
            </div>

            <p>
              <strong>Your Account Details:</strong><br>
              Email: ${email}<br>
              Registration Date: ${new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            </p>

            <p>
              If you have any questions or need assistance, our support team is here to help. Simply reply to this email or visit our help center.
            </p>

            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>The OurStreet Team</strong><br>
              <em>Empowering communities through technology</em>
            </p>
          </div>

          <div class="footer">
            <p>
              © ${new Date().getFullYear()} OurStreet. All rights reserved.
            </p>
            <p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}">Visit Website</a> |
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard">Dashboard</a> |
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/map">View Map</a>
            </p>
            <p style="margin-top: 16px; font-size: 12px; color: #aaaaaa;">
              This email was sent to ${email} because you created an account on OurStreet.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
}

export async function sendLoginEmail(name: string, email: string, ipAddress?: string, userAgent?: string) {
  const subject = "New Login to Your OurStreet Account 🔐";
  const loginTime = new Date().toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "long",
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login Notification</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          .header {
            background: linear-gradient(135deg, #9E7AFF 0%, #FE8BBB 100%);
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: bold;
          }
          .content {
            padding: 40px 30px;
            color: #333333;
            line-height: 1.6;
          }
          .content h2 {
            color: #9E7AFF;
            font-size: 22px;
            margin-top: 0;
          }
          .content p {
            font-size: 16px;
            margin: 16px 0;
          }
          .login-details {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 8px;
            margin: 24px 0;
            border-left: 4px solid #9E7AFF;
          }
          .login-details p {
            margin: 8px 0;
            font-size: 14px;
          }
          .login-details strong {
            color: #333333;
          }
          .alert-box {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
          }
          .alert-box p {
            margin: 0;
            color: #856404;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background-color: #dc3545;
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
          }
          .footer {
            background-color: #f5f5f5;
            padding: 30px;
            text-align: center;
            color: #888888;
            font-size: 14px;
          }
          .footer a {
            color: #9E7AFF;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Login Notification</h1>
          </div>

          <div class="content">
            <h2>Hello ${name},</h2>

            <p>
              We detected a successful login to your OurStreet account. This email is to confirm that you recently accessed your account and to help you keep track of your account security.
            </p>

            <div class="login-details">
              <p><strong>📅 Login Time:</strong> ${loginTime}</p>
              ${ipAddress ? `<p><strong>🌐 IP Address:</strong> ${ipAddress}</p>` : ""}
              ${userAgent ? `<p><strong>💻 Device/Browser:</strong> ${userAgent.substring(0, 100)}${userAgent.length > 100 ? "..." : ""}</p>` : ""}
              <p><strong>📧 Account Email:</strong> ${email}</p>
            </div>

            <div class="alert-box">
              <p>
                <strong>⚠️ Didn't recognize this login?</strong><br>
                If this wasn't you, please secure your account immediately by changing your password and contacting our support team.
              </p>
            </div>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard" class="button" style="background: linear-gradient(135deg, #9E7AFF 0%, #FE8BBB 100%);">
                Go to Dashboard
              </a>
            </div>

            <p style="margin-top: 30px;">
              <strong>Security Tips:</strong>
            </p>
            <ul style="color: #555555; line-height: 1.8;">
              <li>Never share your password with anyone</li>
              <li>Use a strong, unique password</li>
              <li>Enable two-factor authentication when available</li>
              <li>Be cautious of phishing emails</li>
              <li>Regularly review your account activity</li>
            </ul>

            <p style="margin-top: 30px;">
              Thank you for being a valued member of the OurStreet community. Together, we're making our neighborhoods better, one report at a time.
            </p>

            <p style="margin-top: 20px;">
              Best regards,<br>
              <strong>The OurStreet Team</strong><br>
              <em>Empowering communities through technology</em>
            </p>
          </div>

          <div class="footer">
            <p>
              © ${new Date().getFullYear()} OurStreet. All rights reserved.
            </p>
            <p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}">Visit Website</a> |
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard">Dashboard</a> |
              <a href="mailto:support@ourstreet.com">Contact Support</a>
            </p>
            <p style="margin-top: 16px; font-size: 12px; color: #aaaaaa;">
              This is an automated security notification sent to ${email}.<br>
              If you did not perform this login, please contact support immediately.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
}
