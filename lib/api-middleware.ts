// API Middleware for CityPulse
// Centralized middleware for authentication, error handling, validation, and CORS

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "./auth";

// ============================================================================
// TYPES
// ============================================================================

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export type ApiHandler<T = unknown> = (
  request: AuthenticatedRequest,
) => Promise<NextResponse<T>>;

export interface MiddlewareOptions {
  requireAuth?: boolean;
  requireRoles?: string[];
  allowedMethods?: string[];
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
}

// ============================================================================
// CORS CONFIGURATION
// ============================================================================

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_APP_URL || "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400", // 24 hours
};

/**
 * Add CORS headers to response
 */
export function addCorsHeaders(response: NextResponse): NextResponse {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Handle OPTIONS preflight requests
 */
export function handleCorsPreFlight(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

// ============================================================================
// ERROR RESPONSE HELPERS
// ============================================================================

export function errorResponse(
  message: string,
  statusCode: number = 500,
  details?: Record<string, unknown>,
) {
  const response = NextResponse.json(
    {
      success: false,
      error: message,
      ...details,
    },
    { status: statusCode },
  );

  return addCorsHeaders(response);
}

export function successResponse<T>(data: T, statusCode: number = 200) {
  const response = NextResponse.json(
    {
      success: true,
      ...data,
    },
    { status: statusCode },
  );

  return addCorsHeaders(response);
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Authenticate user from request
 */
export function authenticateRequest(request: NextRequest): {
  authenticated: boolean;
  user: { userId: string; email: string; role: string } | null;
} {
  const user = getUserFromRequest(request);

  return {
    authenticated: !!user,
    user,
  };
}

/**
 * Require authentication middleware
 */
export function requireAuth(
  handler: ApiHandler,
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const { authenticated, user } = authenticateRequest(request);

    if (!authenticated || !user) {
      return errorResponse("Authentication required", 401, {
        code: "UNAUTHORIZED",
      });
    }

    // Attach user to request
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = user;

    return handler(authenticatedRequest);
  };
}

/**
 * Require specific role(s)
 */
export function requireRole(roles: string | string[]) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (
    handler: ApiHandler,
  ): ((request: NextRequest) => Promise<NextResponse>) => {
    return async (request: NextRequest) => {
      const { authenticated, user } = authenticateRequest(request);

      if (!authenticated || !user) {
        return errorResponse("Authentication required", 401, {
          code: "UNAUTHORIZED",
        });
      }

      if (!allowedRoles.includes(user.role)) {
        return errorResponse(
          "You don't have permission to access this resource",
          403,
          {
            code: "FORBIDDEN",
            requiredRoles: allowedRoles,
            userRole: user.role,
          },
        );
      }

      // Attach user to request
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = user;

      return handler(authenticatedRequest);
    };
  };
}

/**
 * Require admin or authority role
 */
export const requireAdmin = requireRole(["admin", "authority"]);

/**
 * Require authority role
 */
export const requireAuthority = requireRole(["authority", "admin"]);

// ============================================================================
// METHOD VALIDATION MIDDLEWARE
// ============================================================================

/**
 * Validate HTTP method
 */
export function validateMethod(allowedMethods: string[]) {
  return (
    handler: ApiHandler,
  ): ((request: NextRequest) => Promise<NextResponse>) => {
    return async (request: NextRequest) => {
      // Handle OPTIONS for CORS
      if (request.method === "OPTIONS") {
        return handleCorsPreFlight();
      }

      if (!allowedMethods.includes(request.method)) {
        return errorResponse(`Method ${request.method} not allowed`, 405, {
          code: "METHOD_NOT_ALLOWED",
          allowedMethods,
        });
      }

      return handler(request as AuthenticatedRequest);
    };
  };
}

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

/**
 * Wrap handler with error handling
 */
export function withErrorHandling(
  handler: ApiHandler,
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    try {
      return await handler(request as AuthenticatedRequest);
    } catch (error) {
      console.error("API Error:", error);

      // Handle known error types
      if (error instanceof Error) {
        // Database errors
        if (error.message.includes("database")) {
          return errorResponse("Database error occurred", 500, {
            code: "DATABASE_ERROR",
          });
        }

        // Validation errors
        if (error.message.includes("validation")) {
          return errorResponse(error.message, 400, {
            code: "VALIDATION_ERROR",
          });
        }

        // Return generic error with message
        return errorResponse(error.message, 500, {
          code: "INTERNAL_ERROR",
        });
      }

      // Unknown error
      return errorResponse("An unexpected error occurred", 500, {
        code: "UNKNOWN_ERROR",
      });
    }
  };
}

// ============================================================================
// REQUEST VALIDATION MIDDLEWARE
// ============================================================================

/**
 * Validate request body
 */
export function validateBody<T>(
  schema: (body: unknown) => { valid: boolean; errors?: string[] },
) {
  return (
    handler: ApiHandler<T>,
  ): ((request: NextRequest) => Promise<NextResponse>) => {
    return async (request: NextRequest) => {
      try {
        const body = await request.json();
        const validation = schema(body);

        if (!validation.valid) {
          return errorResponse("Validation failed", 400, {
            code: "VALIDATION_ERROR",
            errors: validation.errors || [],
          });
        }

        return handler(request as AuthenticatedRequest);
      } catch {
        return errorResponse("Invalid JSON in request body", 400, {
          code: "INVALID_JSON",
        });
      }
    };
  };
}

// ============================================================================
// RATE LIMITING (Simple in-memory implementation)
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Simple rate limiting middleware
 */
export function rateLimit(maxRequests: number, windowMs: number) {
  return (
    handler: ApiHandler,
  ): ((request: NextRequest) => Promise<NextResponse>) => {
    return async (request: NextRequest) => {
      // Get client identifier (IP or user ID)
      const ip =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const user = getUserFromRequest(request);
      const identifier = user?.userId || ip;

      const now = Date.now();
      const entry = rateLimitStore.get(identifier);

      // Clean up expired entries periodically
      if (Math.random() < 0.01) {
        // 1% chance
        for (const [key, value] of rateLimitStore.entries()) {
          if (value.resetTime < now) {
            rateLimitStore.delete(key);
          }
        }
      }

      if (!entry || entry.resetTime < now) {
        // Create new entry
        rateLimitStore.set(identifier, {
          count: 1,
          resetTime: now + windowMs,
        });
      } else if (entry.count >= maxRequests) {
        // Rate limit exceeded
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

        const response = errorResponse(
          "Too many requests. Please try again later.",
          429,
          {
            code: "RATE_LIMITED",
            retryAfter,
          },
        );

        response.headers.set("Retry-After", retryAfter.toString());
        response.headers.set("X-RateLimit-Limit", maxRequests.toString());
        response.headers.set("X-RateLimit-Remaining", "0");
        response.headers.set("X-RateLimit-Reset", entry.resetTime.toString());

        return response;
      } else {
        // Increment count
        entry.count += 1;
      }

      const currentEntry = rateLimitStore.get(identifier)!;
      const response = await handler(request as AuthenticatedRequest);

      // Add rate limit headers
      response.headers.set("X-RateLimit-Limit", maxRequests.toString());
      response.headers.set(
        "X-RateLimit-Remaining",
        Math.max(0, maxRequests - currentEntry.count).toString(),
      );
      response.headers.set(
        "X-RateLimit-Reset",
        currentEntry.resetTime.toString(),
      );

      return response;
    };
  };
}

// ============================================================================
// COMPOSITION HELPERS
// ============================================================================

/**
 * Compose multiple middleware functions
 */
export function compose(
  ...middlewares: Array<(handler: ApiHandler) => ApiHandler>
) {
  return (handler: ApiHandler): ApiHandler => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler,
    );
  };
}

/**
 * Create a protected API route with common middleware
 */
export function createProtectedRoute(
  handler: ApiHandler,
  options: MiddlewareOptions = {},
) {
  const {
    requireAuth: needsAuth = true,
    requireRoles = [],
    allowedMethods = ["GET", "POST", "PUT", "DELETE"],
    rateLimit: rateLimitConfig,
  } = options;

  let composedHandler = handler;

  // Apply error handling first
  composedHandler = withErrorHandling(composedHandler);

  // Apply method validation
  composedHandler = validateMethod(allowedMethods)(composedHandler);

  // Apply rate limiting if configured
  if (rateLimitConfig) {
    composedHandler = rateLimit(
      rateLimitConfig.maxRequests,
      rateLimitConfig.windowMs,
    )(composedHandler);
  }

  // Apply role-based auth if needed
  if (requireRoles.length > 0) {
    composedHandler = requireRole(requireRoles)(composedHandler);
  } else if (needsAuth) {
    // Apply basic auth if no specific roles required
    composedHandler = requireAuth(composedHandler);
  }

  return composedHandler;
}

/**
 * Create a public API route (no auth required)
 */
export function createPublicRoute(
  handler: ApiHandler,
  options: Omit<MiddlewareOptions, "requireAuth" | "requireRoles"> = {},
) {
  return createProtectedRoute(handler, {
    ...options,
    requireAuth: false,
    requireRoles: [],
  });
}

// ============================================================================
// LOGGING MIDDLEWARE
// ============================================================================

/**
 * Log API requests
 */
export function withLogging(handler: ApiHandler): ApiHandler {
  return async (request: AuthenticatedRequest) => {
    const start = Date.now();
    const { method, url } = request;
    const user = request.user;

    console.log(`[API] ${method} ${url} - User: ${user?.email || "Anonymous"}`);

    const response = await handler(request);
    const duration = Date.now() - start;

    console.log(`[API] ${method} ${url} - ${response.status} - ${duration}ms`);

    return response;
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

const middleware = {
  requireAuth,
  requireRole,
  requireAdmin,
  requireAuthority,
  validateMethod,
  withErrorHandling,
  validateBody,
  rateLimit,
  compose,
  createProtectedRoute,
  createPublicRoute,
  withLogging,
  errorResponse,
  successResponse,
  addCorsHeaders,
  handleCorsPreFlight,
};

export default middleware;
