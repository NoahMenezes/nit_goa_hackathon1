import { NextRequest } from "next/server";
import { userDb } from "@/lib/db";
import { validateEmail, generateSecureToken } from "@/lib/auth";
import {
  createPublicRoute,
  successResponse,
  errorResponse,
} from "@/lib/api-middleware";

// In-memory token storage (in production, use Redis or database)
const resetTokens = new Map<string, { email: string; expires: number }>();

// Clean up expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of resetTokens.entries()) {
    if (data.expires < now) {
      resetTokens.delete(token);
    }
  }
}, 60000); // Clean every minute

async function handleForgotPassword(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email || !validateEmail(email)) {
      return errorResponse("Valid email address is required", 400);
    }

    // Check if user exists
    const user = await userDb.findByEmail(email.toLowerCase());

    // For security, always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return successResponse(
        {
          message:
            "If an account exists with this email, you will receive a password reset link shortly.",
        },
        200,
      );
    }

    // Generate reset token
    const resetToken = generateSecureToken();
    const expiresAt = Date.now() + 3600000; // 1 hour from now

    // Store token
    resetTokens.set(resetToken, {
      email: user.email,
      expires: expiresAt,
    });

    // Construct reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

    // In production, send actual email here
    // For development, log the reset link
    console.log("\n================================");
    console.log("🔐 PASSWORD RESET REQUEST");
    console.log("================================");
    console.log(`Email: ${user.email}`);
    console.log(`Name: ${user.name}`);
    console.log(`Reset Link: ${resetUrl}`);
    console.log(`Expires: ${new Date(expiresAt).toLocaleString()}`);
    console.log("================================\n");

    // TODO: Send email using your email service
    // Example with a service like Resend or SendGrid:
    /*
    await sendEmail({
      to: user.email,
      subject: "Reset Your CityPulse Password",
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello ${user.name},</p>
        <p>You requested to reset your password. Click the link below to reset it:</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    });
    */

    return successResponse(
      {
        message:
          "If an account exists with this email, you will receive a password reset link shortly.",
      },
      200,
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return errorResponse("Failed to process password reset request", 500);
  }
}

// Export with middleware
export const POST = createPublicRoute(handleForgotPassword, {
  allowedMethods: ["POST"],
});

// Export function to verify reset token (used by reset-password endpoint)
export function verifyResetToken(token: string): string | null {
  const data = resetTokens.get(token);

  if (!data) {
    return null;
  }

  if (data.expires < Date.now()) {
    resetTokens.delete(token);
    return null;
  }

  return data.email;
}

// Export function to invalidate token after use
export function invalidateResetToken(token: string): void {
  resetTokens.delete(token);
}
