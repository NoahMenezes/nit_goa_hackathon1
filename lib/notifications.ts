// Notification utilities for OurStreet
// Supports email notifications via Resend API
// SMS can be integrated with Twilio or similar service

import { NotificationPayload, NotificationResponse } from "./types";

/**
 * Send email notification using Resend API
 * Set RESEND_API_KEY in environment variables to enable
 */
export async function sendEmailNotification(
  to: string,
  subject: string,
  htmlContent: string,
): Promise<NotificationResponse> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("RESEND_API_KEY not configured - email notification skipped");
    return {
      success: false,
      error: "Email service not configured",
    };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from:
          process.env.EMAIL_FROM || "OurStreet <notifications@ourstreet.app>",
        to: [to],
        subject,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Email send failed:", error);
      return {
        success: false,
        error: `Failed to send email: ${error}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.id,
    };
  } catch (error) {
    console.error("Email notification error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send SMS notification using Twilio API (placeholder)
 * Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to enable
 */
export async function sendSMSNotification(
  to: string,
  message: string,
): Promise<NotificationResponse> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromPhone) {
    console.warn("Twilio not configured - SMS notification skipped");
    return {
      success: false,
      error: "SMS service not configured",
    };
  }

  try {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${auth}`,
        },
        body: new URLSearchParams({
          To: to,
          From: fromPhone,
          Body: message,
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("SMS send failed:", error);
      return {
        success: false,
        error: `Failed to send SMS: ${error}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.sid,
    };
  } catch (error) {
    console.error("SMS notification error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send notification based on payload
 */
export async function sendNotification(
  payload: NotificationPayload,
): Promise<{ email?: NotificationResponse; sms?: NotificationResponse }> {
  const results: { email?: NotificationResponse; sms?: NotificationResponse } =
    {};

  // Generate email content
  if (payload.recipient.email) {
    const { subject, html } = generateEmailContent(payload);
    results.email = await sendEmailNotification(
      payload.recipient.email,
      subject,
      html,
    );
  }

  // Generate SMS content
  if (payload.recipient.phone) {
    const smsMessage = generateSMSContent(payload);
    results.sms = await sendSMSNotification(
      payload.recipient.phone,
      smsMessage,
    );
  }

  return results;
}

/**
 * Generate email content based on notification type
 */
function generateEmailContent(payload: NotificationPayload): {
  subject: string;
  html: string;
} {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const issueUrl = `${baseUrl}/issues/${payload.issueId}`;

  switch (payload.type) {
    case "status_change":
      return {
        subject: `Issue Status Updated: ${payload.issueTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
                .status-open { background: #fef3c7; color: #92400e; }
                .status-in-progress { background: #dbeafe; color: #1e40af; }
                .status-resolved { background: #d1fae5; color: #065f46; }
                .status-closed { background: #e5e7eb; color: #374151; }
                .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🔔 Issue Status Update</h1>
                </div>
                <div class="content">
                  <h2>${payload.issueTitle}</h2>
                  <p>The status of your reported issue has been updated:</p>
                  ${payload.data.oldStatus ? `<p>Previous Status: <span class="status-badge status-${payload.data.oldStatus}">${payload.data.oldStatus.toUpperCase()}</span></p>` : ""}
                  <p>New Status: <span class="status-badge status-${payload.data.newStatus}">${payload.data.newStatus?.toUpperCase()}</span></p>
                  ${payload.data.message ? `<p><strong>Update:</strong> ${payload.data.message}</p>` : ""}
                  <a href="${issueUrl}" class="button">View Issue Details</a>
                  <p>Thank you for helping improve our community!</p>
                </div>
                <div class="footer">
                  <p>OurStreet - Community Issue Tracking</p>
                  <p>This is an automated notification. Please do not reply to this email.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      };

    case "resolution":
      return {
        subject: `✅ Issue Resolved: ${payload.issueTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
                .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>✅ Issue Resolved!</h1>
                </div>
                <div class="content">
                  <div class="success-icon">🎉</div>
                  <h2>${payload.issueTitle}</h2>
                  <p><strong>Great news!</strong> Your reported issue has been successfully resolved.</p>
                  ${payload.data.message ? `<p><strong>Resolution Details:</strong> ${payload.data.message}</p>` : ""}
                  <a href="${issueUrl}" class="button">View Resolution Photos</a>
                  <p>We appreciate your contribution to making our community better. Your report helped us address this issue quickly!</p>
                  <p><em>Please feel free to view the before/after photos and leave feedback.</em></p>
                </div>
                <div class="footer">
                  <p>OurStreet - Community Issue Tracking</p>
                  <p>This is an automated notification. Please do not reply to this email.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      };

    case "comment":
      return {
        subject: `New Comment on: ${payload.issueTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .comment-box { background: white; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
                .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>💬 New Comment</h1>
                </div>
                <div class="content">
                  <h2>${payload.issueTitle}</h2>
                  <p>Someone has commented on an issue you're following:</p>
                  <div class="comment-box">
                    <p>${payload.data.message || "View the comment on the issue page."}</p>
                  </div>
                  <a href="${issueUrl}" class="button">View Issue & Reply</a>
                </div>
                <div class="footer">
                  <p>OurStreet - Community Issue Tracking</p>
                  <p>This is an automated notification. Please do not reply to this email.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      };

    case "assignment":
      return {
        subject: `Issue Assigned to You: ${payload.issueTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .alert-box { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
                .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📋 New Assignment</h1>
                </div>
                <div class="content">
                  <h2>${payload.issueTitle}</h2>
                  <div class="alert-box">
                    <strong>⚠️ Action Required:</strong> A new issue has been assigned to you.
                  </div>
                  ${payload.data.message ? `<p>${payload.data.message}</p>` : ""}
                  <a href="${issueUrl}" class="button">View & Start Work</a>
                  <p>Please review the issue details and update the status accordingly.</p>
                </div>
                <div class="footer">
                  <p>OurStreet - Community Issue Tracking</p>
                  <p>This is an automated notification. Please do not reply to this email.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      };

    default:
      return {
        subject: `Update: ${payload.issueTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
            <body>
              <h2>${payload.issueTitle}</h2>
              <p>${payload.data.message || "Your issue has been updated."}</p>
              <p><a href="${issueUrl}">View Issue</a></p>
            </body>
          </html>
        `,
      };
  }
}

/**
 * Generate SMS content based on notification type
 */
function generateSMSContent(payload: NotificationPayload): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const issueUrl = `${baseUrl}/issues/${payload.issueId}`;

  switch (payload.type) {
    case "status_change":
      return `OurStreet: Issue "${payload.issueTitle}" status changed to ${payload.data.newStatus?.toUpperCase()}. View: ${issueUrl}`;

    case "resolution":
      return `OurStreet: Great news! Your issue "${payload.issueTitle}" has been RESOLVED. View photos: ${issueUrl}`;

    case "comment":
      return `OurStreet: New comment on "${payload.issueTitle}". View: ${issueUrl}`;

    case "assignment":
      return `OurStreet: Issue "${payload.issueTitle}" assigned to you. View: ${issueUrl}`;

    default:
      return `OurStreet: Update on "${payload.issueTitle}". View: ${issueUrl}`;
  }
}
