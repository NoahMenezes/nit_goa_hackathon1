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
import { sendLoginEmail } from "@/lib/email";
import { getSupabaseClientByRole } from "@/lib/supabase";

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
    const { email, password, userType = "citizen" } = body;
    userEmail = email;

    // Log which database is being used for authentication
    console.log(`Login attempt for ${userType} database: ${email}`);

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

    // Find user by email in the appropriate database
    // For Supabase, we check the specific database based on userType
    const supabaseClient = getSupabaseClientByRole(userType, true);

    let user;
    if (supabaseClient) {
      console.log(
        `Attempting login in ${userType} Supabase database: ${email}`,
      );

      try {
        // Query the appropriate Supabase database
        // Use .maybeSingle() to avoid errors when no rows are found
        const { data, error } = await supabaseClient
          .from("users")
          .select("*")
          .eq("email", email.toLowerCase())
          .maybeSingle();

        if (error) {
          console.error(
            `Supabase error in ${userType} database:`,
            error.message,
          );
          console.warn(`Falling back to in-memory database for login`);
          user = await userDb.findByEmail(email.toLowerCase());
        } else if (!data) {
          console.log(
            `User not found in ${userType} Supabase database, checking in-memory database`,
          );
          user = await userDb.findByEmail(email.toLowerCase());
        } else {
          user = data;
        }
      } catch (error) {
        console.error(`Supabase connection failed for ${userType}:`, error);
        console.warn(`Using in-memory database as fallback for login`);
        user = await userDb.findByEmail(email.toLowerCase());
      }
    } else {
      console.log(
        `No Supabase client for ${userType}, using in-memory database`,
      );
      // Fallback to in-memory database
      user = await userDb.findByEmail(email.toLowerCase());
    }
    if (!user) {
      logAuth({
        userEmail: email,
        action: "login",
        ipAddress,
        userAgent,
        success: false,
        errorMessage: `User not found in ${userType} database`,
      });

      return NextResponse.json(
        {
          success: false,
          error: `Invalid email or password. Please ensure you're using the correct login button (${userType}).`,
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
        errorMessage: `Invalid password for ${userType} account`,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password",
        } as AuthResponse,
        { status: 401 },
      );
    }

    // Generate token with userType information
    const token = generateToken(user.id, user.email, user.role || userType);

    // Log successful login
    logAuth({
      userId: user.id,
      userEmail: user.email,
      action: "login",
      ipAddress,
      userAgent,
      success: true,
    });

    console.log(`Successful login to ${userType} database: ${user.email}`);

    // Send login notification email with role (async, don't wait for it)
    sendLoginEmail(
      user.name,
      user.email,
      ipAddress,
      userAgent,
      user.role,
    ).catch((error) => {
      console.error("Failed to send login notification email:", error);
      // Don't fail the login if email fails
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
