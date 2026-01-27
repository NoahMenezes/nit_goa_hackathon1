// Authentication utilities for OurStreet with proper security
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "./types";

// JWT secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";

// Warning for missing JWT_SECRET
if (!JWT_SECRET && process.env.NODE_ENV !== "production") {
  console.warn(
    "⚠️ WARNING: JWT_SECRET not set. Using insecure fallback for development. " +
      "Generate a secure secret with: openssl rand -base64 32",
  );
}

const FALLBACK_SECRET = "ourstreet-secret-key-change-in-production";
const ACTUAL_JWT_SECRET = JWT_SECRET || FALLBACK_SECRET;

// Generate JWT token
export function generateToken(
  userId: string,
  email: string,
  role: string,
): string {
  // Runtime check for production
  if (!JWT_SECRET && process.env.NODE_ENV === "production") {
    throw new Error(
      "CRITICAL: JWT_SECRET environment variable is not set in production. " +
        "Generate one with: openssl rand -base64 32",
    );
  }

  const payload = {
    userId,
    email,
    role,
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, ACTUAL_JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(
  token: string,
): { userId: string; email: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, ACTUAL_JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
    };
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

// Get user from request
export function getUserFromRequest(
  request: NextRequest,
): { userId: string; email: string; role: string } | null {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  return verifyToken(token);
}

// Hash password with bcrypt
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Compare password with hash
export async function comparePasswords(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Validate email format
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Sanitize user (remove password)
export function sanitizeUser(user: User): Omit<User, "password"> {
  const { password, ...sanitizedUser } = user;
  void password; // Mark as intentionally unused
  return sanitizedUser;
}

// Middleware helper for protected routes
export async function requireAuth(request: NextRequest): Promise<{
  authorized: boolean;
  user: { userId: string; email: string; role: string } | null;
  error?: string;
}> {
  const user = getUserFromRequest(request);

  if (!user) {
    return {
      authorized: false,
      user: null,
      error: "Unauthorized - Please login",
    };
  }

  return {
    authorized: true,
    user,
  };
}

// Check if user is admin
export function isAdmin(role: string): boolean {
  return role === "admin" || role === "authority";
}

// Generate secure random token for password reset, etc.
export function generateSecureToken(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15) +
    Date.now().toString(36)
  );
}

// Middleware helper for admin-only routes
export async function requireAdmin(request: NextRequest): Promise<{
  authorized: boolean;
  user: { userId: string; email: string; role: string } | null;
  error?: string;
}> {
  const authResult = await requireAuth(request);

  if (!authResult.authorized || !authResult.user) {
    return authResult;
  }

  if (!isAdmin(authResult.user.role)) {
    return {
      authorized: false,
      user: null,
      error: "Forbidden - Admin access required",
    };
  }

  return authResult;
}

// Middleware helper for authority-only routes
export async function requireAuthority(request: NextRequest): Promise<{
  authorized: boolean;
  user: { userId: string; email: string; role: string } | null;
  error?: string;
}> {
  const authResult = await requireAuth(request);

  if (!authResult.authorized || !authResult.user) {
    return authResult;
  }

  if (
    authResult.user.role !== "authority" &&
    authResult.user.role !== "admin"
  ) {
    return {
      authorized: false,
      user: null,
      error: "Forbidden - Authority access required",
    };
  }

  return authResult;
}
