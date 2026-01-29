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
    let useSupabase = false;

    if (supabaseClient) {
      console.log(
        `Checking if user exists in ${role} Supabase database: ${email.toLowerCase()}`,
      );

      try {
        const { data, error: checkError } = await supabaseClient
          .from("users")
          .select("id, email")
          .eq("email", email.toLowerCase())
          .maybeSingle();

        if (checkError) {
          console.error(
            `Supabase error in ${role} database:`,
            checkError.message,
          );
          console.warn(`Falling back to in-memory database for ${role}`);
          existingUser = await userDb.findByEmail(email.toLowerCase());
        } else {
          existingUser = data;
          useSupabase = true;
        }
      } catch (error) {
        console.error(`Supabase connection failed for ${role}:`, error);
        console.warn(`Using in-memory database as fallback`);
        existingUser = await userDb.findByEmail(email.toLowerCase());
      }
    } else {
      console.log(`No Supabase client for ${role}, using in-memory database`);
      existingUser = await userDb.findByEmail(email.toLowerCase());
    }

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

    let newUser;

    if (useSupabase && supabaseClient) {
      try {
        const { data, error: insertError } = await supabaseClient
          .from("users")
          .insert({
            name: name.trim(),
            email: email.toLowerCase(),
            password: hashedPassword,
            role: role,
          })
          .select()
          .single();

        if (insertError || !data) {
          console.error(`Supabase insert failed:`, insertError?.message);
          console.warn(`Falling back to in-memory database`);
          try {
            newUser = await userDb.create({
              name: name.trim(),
              email: email.toLowerCase(),
              password: hashedPassword,
              role: role,
            });
            console.log(`✅ Fallback: User created in in-memory database`);
          } catch (memError) {
            console.error(`❌ In-memory DB create failed:`, memError);
            newUser = null;
          }
        } else {
          newUser = data;
          console.log(`✅ User created in Supabase ${role} database`);
        }
      } catch (error) {
        console.error(`Supabase error during user creation:`, error);
        console.warn(`Using in-memory database as fallback`);
        try {
          newUser = await userDb.create({
            name: name.trim(),
            email: email.toLowerCase(),
            password: hashedPassword,
            role: role,
          });
          console.log(`✅ Fallback: User created in in-memory database`);
        } catch (memError) {
          console.error(`❌ In-memory DB create failed:`, memError);
          newUser = null;
        }
      }
    } else {
      try {
        console.log(`Creating user in in-memory database...`);
        newUser = await userDb.create({
          name: name.trim(),
          email: email.toLowerCase(),
          password: hashedPassword,
          role: role,
        });
        if (newUser) {
          console.log(`✅ User created in in-memory database:`, newUser.id);
        }
      } catch (memError) {
        console.error(`❌ In-memory DB create failed:`, memError);
        console.error(`Error details:`, {
          name: name.trim(),
          email: email.toLowerCase(),
          role,
          errorMessage:
            memError instanceof Error ? memError.message : String(memError),
          errorStack: memError instanceof Error ? memError.stack : "N/A",
        });
        newUser = null;
      }
    }

    if (!newUser) {
      console.error(`❌ Failed to create user - newUser is null/undefined`);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to create user`,
        } as AuthResponse,
        { status: 500 },
      );
    }

    console.log(`✅ User created successfully:`, {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    // Generate token
    const token = generateToken(newUser.id, newUser.email, newUser.role);

    // Send welcome email with role (async, don't wait for it)
    sendWelcomeEmail(newUser.name, newUser.email, newUser.role).catch(
      (error) => {
        console.error("Failed to send welcome email:", error);
        // Don't fail the signup if email fails
      },
    );

    // Normalize user object for response
    const userForResponse = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      password: newUser.password || hashedPassword,
      role: newUser.role || role,
      avatar: newUser.avatar || null,
      createdAt:
        newUser.created_at || newUser.createdAt || new Date().toISOString(),
      updatedAt:
        newUser.updated_at || newUser.updatedAt || new Date().toISOString(),
    };

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: `Account created successfully`,
        user: sanitizeUser(userForResponse),
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
