import { NextRequest, NextResponse } from "next/server";
import { userDb } from "@/lib/db";
import {
  comparePasswords,
  validateEmail,
  generateToken,
  sanitizeUser,
} from "@/lib/auth";
import { AuthResponse } from "@/lib/types";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { logAuth, getRequestMetadata } from "@/lib/audit-log";

// Admin ID verification - can be stored in environment variable or database
// For Vercel deployment, use environment variable
const VALID_ADMIN_IDS = (
  process.env.ADMIN_IDS || "ADMIN001,ADMIN002,ADMIN003"
)
  .split(",")
  .map((id) => id.trim());

interface AdminLoginRequest {
  email: string;
  password: string;
  adminId: string;
}

export async function POST(request: NextRequest) {
  const { ipAddress, userAgent } = getRequestMetadata(request);
  let userEmail = "";

  try {
    // Apply rate limiting for admin login attempts (stricter than regular login)
    const rateLimitResult = checkRateLimit(request, {
      ...RATE_LIMITS.AUTH,
      maxRequests: 3, // Only 3 attempts for admin login
    });

    if (!rateLimitResult.allowed) {
      // Log rate limit exceeded event
      logAuth({
        userEmail: "unknown",
        action: "admin_login",
        ipAddress,
        userAgent,
        success: false,
        errorMessage: "Rate limit exceeded for admin login",
      });

      return NextResponse.json(
        {
          success: false,
          error:
            rateLimitResult.error ||
            "Too many admin login attempts. Please try again later.",
          retryAfter: Math.ceil(
            (rateLimitResult.resetTime - Date.now()) / 1000,
          ),
        } as AuthResponse,
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "3",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
            "Retry-After": Math.ceil(
              (rateLimitResult.resetTime - Date.now()) / 1000,
            ).toString(),
          },
        },
      );
    }

    const body: AdminLoginRequest = await request.json();
    const { email, password, adminId } = body;
    userEmail = email;

    // Validation
    if (!email || !password || !adminId) {
      logAuth({
        userEmail: email || "unknown",
        action: "admin_login",
        ipAddress,
        userAgent,
        success: false,
        errorMessage: "Missing required fields",
      });

      return NextResponse.json(
        {
          success: false,
          error: "Email, password, and Admin ID are required",
        } as AuthResponse,
        { status: 400 },
      );
    }

    // Validate email format
    if (!validateEmail(email)) {
      logAuth({
        userEmail: email,
        action: "admin_login",
        ipAddress,
        userAgent,
        success: false,
        errorMessage: "Invalid email format",
      });

      return NextResponse.json(
        {
          success: false,
          error: "Invalid email address",
        } as AuthResponse,
        { status: 400 },
      );
    }

    // Verify Admin ID
    if (!VALID_ADMIN_IDS.includes(adminId.trim())) {
      logAuth({
        userEmail: email,
        action: "admin_login",
        ipAddress,
        userAgent,
        success: false,
        errorMessage: `Invalid Admin ID: ${adminId}`,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Invalid Admin ID. Please contact system administrator.",
        } as AuthResponse,
        { status: 401 },
      );
    }

    // Find user by email
    const user = await userDb.findByEmail(email.toLowerCase());
    if (!user) {
      logAuth({
        userEmail: email,
        action: "admin_login",
        ipAddress,
        userAgent,
        success: false,
        errorMessage: "User not found",
      });

      return NextResponse.json(
        {
          success: false,
          error: "Invalid email, password, or Admin ID",
        } as AuthResponse,
        { status: 401 },
      );
    }

    // Verify user is an admin or authority
    if (user.role !== "admin" && user.role !== "authority") {
      logAuth({
        userId: user.id,
        userEmail: user.email,
        action: "admin_login",
        ipAddress,
        userAgent,
        success: false,
        errorMessage: `User role ${user.role} attempted admin login`,
      });

      return NextResponse.json(
        {
          success: false,
          error:
            "This account does not have administrator privileges. Please use regular login.",
        } as AuthResponse,
        { status: 403 },
      );
    }

    // Compare passwords
    const isPasswordValid = await comparePasswords(password, user.password);
    if (!isPasswordValid) {
      logAuth({
        userId: user.id,
        userEmail: user.email,
        action: "admin_login",
        ipAddress,
        userAgent,
        success: false,
        errorMessage: "Invalid password",
      });

      return NextResponse.json(
        {
          success: false,
          error: "Invalid email, password, or Admin ID",
        } as AuthResponse,
        { status: 401 },
      );
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.role);

    // Log successful admin login
    logAuth({
      userId: user.id,
      userEmail: user.email,
      action: "admin_login",
      ipAddress,
      userAgent,
      success: true,
      metadata: {
        adminId: adminId,
        role: user.role,
      },
    });

    // Return success response with rate limit headers
    return NextResponse.json(
      {
        success: true,
        message: "Admin login successful",
        user: sanitizeUser(user),
        token,
      } as AuthResponse,
      {
        status: 200,
        headers: {
          "X-RateLimit-Limit": "3",
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
        },
      },
    );
  } catch (error) {
    console.error("Admin login error:", error);

    // Log error
    logAuth({
      userEmail: userEmail || "unknown",
      action: "admin_login",
      ipAddress,
      userAgent,
      success: false,
      errorMessage:
        error instanceof Error ? error.message : "Internal server error",
    });

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error. Please try again later.",
      } as AuthResponse,
      { status: 500 },
    );
  }
}
