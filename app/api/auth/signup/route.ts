import { NextRequest, NextResponse } from "next/server";
import { userDb } from "@/lib/db";
import {
  hashPassword,
  validateEmail,
  generateToken,
  sanitizeUser,
} from "@/lib/auth";
import { SignupRequest, AuthResponse } from "@/lib/types";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body: SignupRequest = await request.json();
    const { name, email, password, confirmPassword, role = "citizen" } = body;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "All fields are required",
        } as AuthResponse,
        { status: 400 },
      );
    }

    // Validate name
    if (name.trim().length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: "Name must be at least 2 characters long",
        } as AuthResponse,
        { status: 400 },
      );
    }

    // Validate email
    if (!validateEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email address",
        } as AuthResponse,
        { status: 400 },
      );
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Passwords do not match",
        } as AuthResponse,
        { status: 400 },
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must be at least 8 characters long",
        } as AuthResponse,
        { status: 400 },
      );
    }

    // Check if user already exists
    const existingUser = await userDb.findByEmail(email.toLowerCase());
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "User with this email already exists",
        } as AuthResponse,
        { status: 409 },
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const newUser = await userDb.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role,
    });

    if (!newUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create user. Please try again.",
        } as AuthResponse,
        { status: 500 },
      );
    }

    // Generate token
    const token = generateToken(newUser.id, newUser.email, newUser.role);

    // Send welcome email (async, don't wait for it)
    sendWelcomeEmail(newUser.name, newUser.email).catch((error) => {
      console.error("Failed to send welcome email:", error);
      // Don't fail the signup if email fails
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        user: sanitizeUser(newUser),
        token,
      } as AuthResponse,
      { status: 201 },
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error. Please try again later.",
      } as AuthResponse,
      { status: 500 },
    );
  }
}
