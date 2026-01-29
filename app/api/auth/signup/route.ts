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
import { getSupabaseClientByRole } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body: SignupRequest = await request.json();
    const { name, email, password, confirmPassword, role = "citizen" } = body;

    // Log which database is being used for signup
    console.log(`Signup attempt for ${role} database: ${email}`);

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

    // Check if user already exists in the appropriate database
    const supabaseClient = getSupabaseClientByRole(role, true);

    let existingUser;
    if (supabaseClient) {
      // Check in the appropriate Supabase database
      const { data } = await supabaseClient
        .from("users")
        .select("id")
        .eq("email", email.toLowerCase())
        .single();
      existingUser = data;
    } else {
      // Fallback to in-memory database
      existingUser = await userDb.findByEmail(email.toLowerCase());
    }

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: `User with this email already exists in ${role} database`,
        } as AuthResponse,
        { status: 409 },
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user in the appropriate database
    let newUser;
    if (supabaseClient) {
      // Create user in the appropriate Supabase database
      const { data, error } = await supabaseClient
        .from("users")
        .insert({
          name: name.trim(),
          email: email.toLowerCase(),
          password: hashedPassword,
          role: role,
        })
        .select()
        .single();

      if (error || !data) {
        console.error(`Failed to create user in ${role} database:`, error);
        return NextResponse.json(
          {
            success: false,
            error: `Failed to create user in ${role} database. Please try again.`,
          } as AuthResponse,
          { status: 500 },
        );
      }
      newUser = data;
      console.log(
        `User created successfully in ${role} database: ${newUser.email}`,
      );
    } else {
      // Fallback to in-memory database
      newUser = await userDb.create({
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
        message: `${role === "admin" ? "Admin" : "Citizen"} account created successfully in ${role} database`,
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
