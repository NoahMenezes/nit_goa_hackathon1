import { NextRequest } from "next/server";
import { userDb } from "@/lib/db";
import { generateSecureToken } from "@/lib/auth";
import {
  createPublicRoute,
  successResponse,
  errorResponse,
} from "@/lib/api-middleware";

// In-memory token storage (in production, use Redis or database)
const verificationTokens = new Map<
  string,
  { email: string; expires: number }
>();

// Clean up expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of verificationTokens.entries()) {
    if (data.expires < now) {
      verificationTokens.delete(token);
    }
  }
}, 60000); // Clean every minute

// POST - Send verification email
async function handleSendVerification(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return errorResponse("Email is required", 400);
    }

    // Find user
    const user = await userDb.findByEmail(email.toLowerCase());
    if (!user) {
      return errorResponse("User not found", 404);
    }

    // Check if already verified
    if (user.emailVerified) {
      return successResponse(
        {
          message: "Email is already verified",
        },
        200,
      );
    }

    // Generate verification token
    const verificationToken = generateSecureToken();
    const expiresAt = Date.now() + 86400000; // 24 hours from now

    // Store token
    verificationTokens.set(verificationToken, {
      email: user.email,
      expires: expiresAt,
    });

    // Construct verification URL
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify-email?token=${verificationToken}`;

    // In production, send actual email here
    // For development, log the verification link
    console.log("\n================================");
    console.log("📧 EMAIL VERIFICATION REQUEST");
    console.log("================================");
    console.log(`Email: ${user.email}`);
    console.log(`Name: ${user.name}`);
    console.log(`Verification Link: ${verifyUrl}`);
    console.log(`Expires: ${new Date(expiresAt).toLocaleString()}`);
    console.log("================================\n");

    // TODO: Send email using your email service
    /*
    await sendEmail({
      to: user.email,
      subject: "Verify Your CityPulse Email",
      html: `
        <h2>Welcome to CityPulse!</h2>
        <p>Hello ${user.name},</p>
        <p>Please verify your email address by clicking the link below:</p>
        <p><a href="${verifyUrl}">Verify Email</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create this account, please ignore this email.</p>
      `
    });
    */

    return successResponse(
      {
        message: "Verification email sent. Please check your inbox.",
      },
      200,
    );
  } catch (error) {
    console.error("Send verification error:", error);
    return errorResponse("Failed to send verification email", 500);
  }
}

// GET - Verify email with token
async function handleVerifyEmail(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return errorResponse("Verification token is required", 400);
    }

    // Verify token
    const tokenData = verificationTokens.get(token);
    if (!tokenData) {
      return errorResponse("Invalid or expired verification token", 400);
    }

    if (tokenData.expires < Date.now()) {
      verificationTokens.delete(token);
      return errorResponse(
        "Verification token has expired. Please request a new one.",
        400,
      );
    }

    // Find user
    const user = await userDb.findByEmail(tokenData.email);
    if (!user) {
      return errorResponse("User not found", 404);
    }

    // Check if already verified
    if (user.emailVerified) {
      verificationTokens.delete(token);
      return successResponse(
        {
          message: "Email is already verified",
        },
        200,
      );
    }

    // Mark email as verified
    await userDb.update(user.id, { emailVerified: true });

    // Invalidate token
    verificationTokens.delete(token);

    console.log(`✅ Email verified successfully for: ${user.email}`);

    return successResponse(
      {
        message:
          "Email verified successfully! You can now access all features.",
      },
      200,
    );
  } catch (error) {
    console.error("Verify email error:", error);
    return errorResponse("Failed to verify email", 500);
  }
}

// Export handlers with middleware
export const POST = createPublicRoute(handleSendVerification, {
  allowedMethods: ["POST"],
});

export const GET = createPublicRoute(handleVerifyEmail, {
  allowedMethods: ["GET"],
});

// Export the tokens map for testing
export { verificationTokens };
