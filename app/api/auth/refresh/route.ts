// Token Refresh API - Refresh JWT tokens before expiry
import { NextRequest, NextResponse } from "next/server";
import { verifyToken, generateToken } from "@/lib/auth";
import { userDb } from "@/lib/db";
import { AuthResponse } from "@/lib/types";
import { logAuth, getRequestMetadata } from "@/lib/audit-log";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const { ipAddress, userAgent } = getRequestMetadata(request);
  let userEmail = "";

  try {
    // Apply rate limiting
    const rateLimitResult = checkRateLimit(request, RATE_LIMITS.AUTH);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many refresh attempts. Please try again later.",
          retryAfter: Math.ceil(
            (rateLimitResult.resetTime - Date.now()) / 1000
          ),
        } as AuthResponse,
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": RATE_LIMITS.AUTH.maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    // Get token from Authorization header or cookie
    const authHeader = request.headers.get("authorization");
    const cookieToken = request.cookies.get("token")?.value;
    const token = authHeader?.replace("Bearer ", "") || cookieToken;

    if (!token) {
      logAuth({
        userEmail: "unknown",
        action: "login",
        ipAddress,
        userAgent,
        success: false,
        errorMessage: "No token provided for refresh",
      });

      return NextResponse.json(
        {
          success: false,
          error: "No token provided",
        } as AuthResponse,
        { status: 401 }
      );
    }

    // Verify the existing token
    const decoded = verifyToken(token);

    if (!decoded) {
      logAuth({
        userEmail: "unknown",
        action: "login",
        ipAddress,
        userAgent,
        success: false,
        errorMessage: "Invalid or expired token for refresh",
      });

      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired token",
        } as AuthResponse,
        { status: 401 }
      );
    }

    userEmail = decoded.email;

    // Verify user still exists and is active
    const user = await userDb.findById(decoded.userId);

    if (!user) {
      logAuth({
        userId: decoded.userId,
        userEmail: decoded.email,
        action: "login",
        ipAddress,
        userAgent,
        success: false,
        errorMessage: "User not found during token refresh",
      });

      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        } as AuthResponse,
        { status: 401 }
      );
    }

    // Check if user role has changed
    if (user.role !== decoded.role) {
      // User role has changed, include updated info in new token
      logAuth({
        userId: user.id,
        userEmail: user.email,
        action: "login",
        ipAddress,
        userAgent,
        success: true,
      });
    }

    // Generate new token with potentially updated role
    const newToken = generateToken(user.id, user.email, user.role);

    // Log successful token refresh
    logAuth({
      userId: user.id,
      userEmail: user.email,
      action: "login",
      ipAddress,
      userAgent,
      success: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Token refreshed successfully",
        token: newToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
        },
      } as AuthResponse,
      {
        status: 200,
        headers: {
          "X-RateLimit-Limit": RATE_LIMITS.AUTH.maxRequests.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
        },
      }
    );
  } catch (error) {
    console.error("Token refresh error:", error);

    logAuth({
      userEmail: userEmail || "unknown",
      action: "login",
      ipAddress,
      userAgent,
      success: false,
      errorMessage:
        error instanceof Error ? error.message : "Token refresh failed",
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to refresh token. Please login again.",
      } as AuthResponse,
      { status: 500 }
    );
  }
}
