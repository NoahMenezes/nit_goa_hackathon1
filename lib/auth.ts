// Authentication utilities for OurStreet with proper security
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "./types";

// JWT secret - MUST be set via environment variable
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";

// Validate JWT_SECRET at startup
const isProduction = process.env.NODE_ENV === "production";
const isDevelopment = process.env.NODE_ENV === "development";

// Development-only fallback - NEVER use in production
const DEV_ONLY_FALLBACK = "dev-only-insecure-secret-do-not-use-in-prod";

// Determine the actual secret to use
function getJWTSecret(): string {
  if (JWT_SECRET && JWT_SECRET.length >= 32) {
    return JWT_SECRET;
  }

  if (isProduction) {
    throw new Error(
      "CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not set or is too short (min 32 chars). " +
        "Generate one with: openssl rand -base64 32",
    );
  }

  // Only allow fallback in development with clear warning
  if (isDevelopment) {
    console.warn(
      "\n" +
        "⚠️ ═══════════════════════════════════════════════════════════════════════\n" +
        "⚠️ SECURITY WARNING: Using insecure development-only JWT secret!\n" +
        "⚠️ Set JWT_SECRET env variable before deploying to production.\n" +
        "⚠️ Generate one with: openssl rand -base64 32\n" +
        "⚠️ ═══════════════════════════════════════════════════════════════════════\n",
    );
    return DEV_ONLY_FALLBACK;
  }

  throw new Error("JWT_SECRET must be configured");
}

// Lazily initialize to allow for proper error handling
let _cachedJWTSecret: string | null = null;
function getActualJWTSecret(): string {
  if (!_cachedJWTSecret) {
    _cachedJWTSecret = getJWTSecret();
  }
  return _cachedJWTSecret;
}

// Generate JWT token
export function generateToken(
  userId: string,
  email: string,
  role: string,
): string {
  const secret = getActualJWTSecret();

  const payload = {
    userId,
    email,
    role,
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, secret, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(
  token: string,
): { userId: string; email: string; role: string } | null {
  try {
    const secret = getActualJWTSecret();
    const decoded = jwt.verify(token, secret) as {
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

// Check if JWT is properly configured (useful for health checks)
export function isJWTConfigured(): boolean {
  try {
    getActualJWTSecret();
    return true;
  } catch {
    return false;
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
