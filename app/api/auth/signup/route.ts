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

    if (!supabaseClient) {
      console.error(`No Supabase client available for ${role} database`);
      return NextResponse.json(
        {
          success: false,
          error: `Database configuration error for ${role} database. Please contact support.`,
        } as AuthResponse,
        { status: 500 },
      );
    }

    console.log(
      `Checking if user exists in ${role} database: ${email.toLowerCase()}`,
    );

    let existingUser;
    // Check in the appropriate Supabase database using maybeSingle() to avoid errors
    const { data, error: checkError } = await supabaseClient
      .from("users")
      .select("id, email")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (checkError) {
      console.error(
        `Error checking user existence in ${role} database:`,
        checkError,
      );
      return NextResponse.json(
        {
          success: false,
          error: `Database error while checking user. Please try again.`,
        } as AuthResponse,
        { status: 500 },
      );
    }

    existingUser = data;

    if (existingUser) {
      console.log(
        `User already exists in ${role} database: ${email.toLowerCase()}`,
      );
      return NextResponse.json(
        {
          success: false,
          error: `User with this email already exists in ${role} database`,
        } as AuthResponse,
        { status: 409 },
      );
    }

    console.log(
      `User does not exist in ${role} database, proceeding with signup`,
    );

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user in the appropriate database
    console.log(`Creating user in ${role} database with role: ${role}`);

    const { data: newUser, error: insertError } = await supabaseClient
      .from("users")
      .insert({
        name: name.trim(),
        email: email.toLowerCase(),
        password: hashedPassword,
        role: role,
      })
      .select()
      .single();

    if (insertError || !newUser) {
      console.error(`Failed to create user in ${role} database:`, insertError);
      console.error(`Insert error details:`, {
        code: insertError?.code,
        message: insertError?.message,
        details: insertError?.details,
        hint: insertError?.hint,
      });
      return NextResponse.json(
        {
          success: false,
          error: `Failed to create user in ${role} database: ${insertError?.message || "Unknown error"}`,
        } as AuthResponse,
        { status: 500 },
      );
    }

    console.log(
      `✅ User created successfully in ${role} database: ${newUser.email} with ID: ${newUser.id}`,
    );

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
