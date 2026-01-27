import { NextRequest, NextResponse } from "next/server";
import { userDb } from "@/lib/db";
import {
  comparePasswords,
  validateEmail,
  generateToken,
  sanitizeUser,
} from "@/lib/auth";
import { LoginRequest, AuthResponse } from "@/lib/types";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { logAuth, getRequestMetadata } from "@/lib/audit-log";

export async function POST(request: NextRequest) {
  const { ipAddress, userAgent } = getRequestMetadata(request);
  let userEmail = "";

  try {
    // Apply rate limiting for login attempts
    const rateLimitResult = checkRateLimit(request, RATE_LIMITS.AUTH);

    if (!rateLimitResult.allowed) {
      // Log rate limit exceeded event
      logAuth({
        userEmail: "unknown",
        action: "login",
        ipAddress,
        userAgent,
        success: false,
        errorMessage: "Rate limit exceeded",
      });

      return NextResponse.json(
        {
          success: false,
          error:
            rateLimitResult.error ||
            "Too many login attempts. Please try again later.",
          retryAfter: Math.ceil(
            (rateLimitResult.resetTime - Date.now()) / 1000,
          ),
        } as AuthResponse,
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": RATE_LIMITS.AUTH.maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
            "Retry-After": Math.ceil(
              (rateLimitResult.resetTime - Date.now()) / 1000,
            ).toString(),
          },
        },
      );
    }

    const body: LoginRequest = await request.json();
    const { email, password } = body;
    userEmail = email;

    // Validation
    if (!email || !password) {
      logAuth({
        userEmail: email || "unknown",
        action: "login",
        ipAddress,
        userAgent,
        success: false,
        errorMessage: "Missing email or password",
      });

      return NextResponse.json(
        {
          success: false,
          error: "Email and password are required",
        } as AuthResponse,
        { status: 400 },
      );
    }

    // Validate email format
    if (!validateEmail(email)) {
      logAuth({
        userEmail: email,
        action: "login",
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

    // Find user by email
    const user = await userDb.findByEmail(email.toLowerCase());
    if (!user) {
      logAuth({
        userEmail: email,
        action: "login",
        ipAddress,
        userAgent,
        success: false,
        errorMessage: "User not found",
      });

      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password",
        } as AuthResponse,
        { status: 401 },
      );
    }

    // Compare passwords
    const isPasswordValid = await comparePasswords(password, user.password);
    if (!isPasswordValid) {
      logAuth({
        userId: user.id,
        userEmail: user.email,
        action: "login",
        ipAddress,
        userAgent,
        success: false,
        errorMessage: "Invalid password",
      });

      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password",
        } as AuthResponse,
        { status: 401 },
      );
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.role);

    // Log successful login
    logAuth({
      userId: user.id,
      userEmail: user.email,
      action: "login",
      ipAddress,
      userAgent,
      success: true,
    });

    // Return success response with rate limit headers
    return NextResponse.json(
      {
        success: true,
        message: "Login successful",
        user: sanitizeUser(user),
        token,
      } as AuthResponse,
      {
        status: 200,
        headers: {
          "X-RateLimit-Limit": RATE_LIMITS.AUTH.maxRequests.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
        },
      },
    );
  } catch (error) {
    console.error("Login error:", error);

    // Log error
    logAuth({
      userEmail: userEmail || "unknown",
      action: "login",
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
