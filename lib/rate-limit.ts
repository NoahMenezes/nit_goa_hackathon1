// Rate limiting utility for API endpoints
import { NextRequest, NextResponse } from "next/server";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for rate limits
// In production, use Redis or similar
const rateLimitStore: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    Object.keys(rateLimitStore).forEach((key) => {
      if (rateLimitStore[key].resetTime < now) {
        delete rateLimitStore[key];
      }
    });
  },
  5 * 60 * 1000,
);

export interface RateLimitConfig {
  maxRequests: number; // Maximum requests allowed
  windowMs: number; // Time window in milliseconds
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

// Default rate limit configurations
export const RATE_LIMITS = {
  // General API requests
  DEFAULT: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: "Too many requests, please try again later",
  },
  // Authentication endpoints (login, signup)
  AUTH: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: "Too many authentication attempts, please try again later",
  },
  // File uploads
  UPLOAD: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: "Upload limit reached, please try again later",
  },
  // Issue creation
  CREATE_ISSUE: {
    maxRequests: 20,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: "Too many issues created, please try again later",
  },
  // Admin endpoints
  ADMIN: {
    maxRequests: 200,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: "Admin rate limit exceeded",
  },
  // Public endpoints (no auth required)
  PUBLIC: {
    maxRequests: 50,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: "Too many requests, please try again later",
  },
};

/**
 * Get client identifier from request
 */
function getClientId(request: NextRequest): string {
  // Try to get user ID from auth token
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    // In a real implementation, decode the token to get user ID
    // For now, use the token itself as identifier
    if (token) {
      return `user:${token.substring(0, 20)}`; // Use first 20 chars
    }
  }

  // Fall back to IP address
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0] || realIp || "unknown";

  return `ip:${ip}`;
}

/**
 * Check rate limit for a request
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = RATE_LIMITS.DEFAULT,
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  error?: string;
} {
  const clientId = getClientId(request);
  const key = `${clientId}:${request.nextUrl.pathname}`;
  const now = Date.now();

  // Get or create rate limit entry
  let entry = rateLimitStore[key];

  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired one
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    rateLimitStore[key] = entry;
  }

  // Increment count
  entry.count++;

  // Check if limit exceeded
  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      error: config.message || "Rate limit exceeded",
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Rate limit middleware wrapper
 */
export function withRateLimit(
  handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>,
  config: RateLimitConfig = RATE_LIMITS.DEFAULT,
) {
  return async (request: NextRequest, ...args: unknown[]) => {
    const result = checkRateLimit(request, config);

    if (!result.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": config.maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": result.resetTime.toString(),
            "Retry-After": Math.ceil(
              (result.resetTime - Date.now()) / 1000,
            ).toString(),
          },
        },
      );
    }

    // Add rate limit headers to response
    const response = await handler(request, ...args);

    response.headers.set("X-RateLimit-Limit", config.maxRequests.toString());
    response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
    response.headers.set("X-RateLimit-Reset", result.resetTime.toString());

    return response;
  };
}

/**
 * Reset rate limit for a specific client and path
 */
export function resetRateLimit(clientId: string, path: string): void {
  const key = `${clientId}:${path}`;
  delete rateLimitStore[key];
}

/**
 * Clear all rate limits (use with caution)
 */
export function clearAllRateLimits(): void {
  Object.keys(rateLimitStore).forEach((key) => {
    delete rateLimitStore[key];
  });
}

/**
 * Get current rate limit info for a client
 */
export function getRateLimitInfo(
  clientId: string,
  path: string,
): {
  count: number;
  resetTime: number;
  exists: boolean;
} {
  const key = `${clientId}:${path}`;
  const entry = rateLimitStore[key];

  if (!entry) {
    return {
      count: 0,
      resetTime: 0,
      exists: false,
    };
  }

  return {
    count: entry.count,
    resetTime: entry.resetTime,
    exists: true,
  };
}
