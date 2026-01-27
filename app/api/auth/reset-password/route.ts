import { NextRequest } from "next/server";
import { userDb } from "@/lib/db";
import { hashPassword, validatePassword } from "@/lib/auth";
import {
  createPublicRoute,
  successResponse,
  errorResponse,
} from "@/lib/api-middleware";

// In-memory token storage (shared with forgot-password)
// In production, use Redis or database
const resetTokens = new Map<string, { email: string; expires: number }>();

async function handleResetPassword(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password, confirmPassword } = body;

    // Validate input
    if (!token || !password || !confirmPassword) {
      return errorResponse(
        "Token, password, and confirmation are required",
        400,
      );
    }

    // Check passwords match
    if (password !== confirmPassword) {
      return errorResponse("Passwords do not match", 400);
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return errorResponse(passwordValidation.errors.join(", "), 400, {
        errors: passwordValidation.errors,
      });
    }

    // Verify token
    const tokenData = resetTokens.get(token);
    if (!tokenData) {
      return errorResponse("Invalid or expired reset token", 400);
    }

    if (tokenData.expires < Date.now()) {
      resetTokens.delete(token);
      return errorResponse(
        "Reset token has expired. Please request a new one.",
        400,
      );
    }

    // Find user
    const user = await userDb.findByEmail(tokenData.email);
    if (!user) {
      return errorResponse("User not found", 404);
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update password
    await userDb.update(user.id, { password: hashedPassword });

    // Invalidate token
    resetTokens.delete(token);

    console.log(`✅ Password reset successful for: ${user.email}`);

    return successResponse(
      {
        message:
          "Password reset successful. You can now login with your new password.",
      },
      200,
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return errorResponse("Failed to reset password", 500);
  }
}

// Verify token endpoint (GET) - check if token is valid
async function handleVerifyToken(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return errorResponse("Token is required", 400);
    }

    const tokenData = resetTokens.get(token);
    if (!tokenData || tokenData.expires < Date.now()) {
      return errorResponse("Invalid or expired token", 400);
    }

    return successResponse(
      {
        valid: true,
        email: tokenData.email,
      },
      200,
    );
  } catch (error) {
    console.error("Verify token error:", error);
    return errorResponse("Failed to verify token", 500);
  }
}

// Export handlers with middleware
export const POST = createPublicRoute(handleResetPassword, {
  allowedMethods: ["POST"],
});

export const GET = createPublicRoute(handleVerifyToken, {
  allowedMethods: ["GET"],
});

// Export the resetTokens map so forgot-password can access it
export { resetTokens };
