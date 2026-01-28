// Health Check API - Monitor system health and dependencies
import { NextRequest, NextResponse } from "next/server";
import { userDb } from "@/lib/db";
import { getSupabaseStatus, testConnection } from "@/lib/supabase";
import { isJWTConfigured } from "@/lib/auth";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: {
      status: "up" | "down";
      responseTime?: number;
      error?: string;
    };
    storage: {
      status: "configured" | "not_configured";
      provider?: string;
    };
    environment: {
      status: "ok" | "warning";
      warnings?: string[];
    };
  };
}

// Store server start time
const startTime = Date.now();

// GET /api/health - Health check endpoint
export async function GET(_request: NextRequest) {
  const checkStartTime = Date.now();

  try {
    // Check database connectivity using improved status checking
    let dbStatus: "up" | "down" = "down";
    let dbResponseTime: number | undefined;
    let dbError: string | undefined;

    // Get Supabase configuration status
    const supabaseStatus = getSupabaseStatus();

    try {
      if (supabaseStatus.configured) {
        // Test actual Supabase connection
        const connectionTest = await testConnection();
        dbResponseTime = connectionTest.latencyMs;
        dbStatus = connectionTest.connected ? "up" : "down";
        dbError = connectionTest.error;
      } else {
        // Fallback: test in-memory database
        const dbCheckStart = Date.now();
        await userDb.getAll();
        dbResponseTime = Date.now() - dbCheckStart;
        dbStatus = "up";
        // Note that we're using in-memory DB
        if (process.env.NODE_ENV === "production") {
          dbError = "Using in-memory database - data will not persist";
        }
      }
    } catch (error) {
      dbError =
        error instanceof Error ? error.message : "Database check failed";
      dbStatus = "down";
    }

    // Check storage configuration
    const cloudinaryConfigured = !!(
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
    );
    const supabaseConfigured = !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const storageStatus =
      cloudinaryConfigured || supabaseConfigured
        ? "configured"
        : "not_configured";
    const storageProvider = cloudinaryConfigured
      ? "cloudinary"
      : supabaseConfigured
        ? "supabase"
        : undefined;

    // Check environment configuration
    const envWarnings: string[] = [];

    // Check JWT configuration using the improved helper
    if (!isJWTConfigured()) {
      envWarnings.push("JWT_SECRET not configured or invalid");
    }

    // Check for Supabase in production
    if (process.env.NODE_ENV === "production" && !supabaseStatus.configured) {
      envWarnings.push(
        "Supabase not configured in production - using in-memory database",
      );
    }

    if (!supabaseStatus.urlValid && supabaseStatus.hasUrl) {
      envWarnings.push("Invalid Supabase URL format");
    }

    if (!cloudinaryConfigured && !supabaseConfigured) {
      envWarnings.push("No storage provider configured for file uploads");
    }

    // Check for AI service
    if (!process.env.GEMINI_API_KEY) {
      envWarnings.push("GEMINI_API_KEY not configured - AI features disabled");
    }

    // Determine overall health status
    let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy";

    if (dbStatus === "down") {
      overallStatus = "unhealthy";
    } else if (envWarnings.length > 0) {
      overallStatus = "degraded";
    }

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - startTime,
      version: process.env.npm_package_version || "1.0.0",
      checks: {
        database: {
          status: dbStatus,
          responseTime: dbResponseTime,
          error: dbError,
        },
        storage: {
          status: storageStatus,
          provider: storageProvider,
        },
        environment: {
          status: envWarnings.length > 0 ? "warning" : "ok",
          warnings: envWarnings.length > 0 ? envWarnings : undefined,
        },
      },
    };

    // Return appropriate status code
    const statusCode = overallStatus === "unhealthy" ? 503 : 200;

    return NextResponse.json(healthStatus, {
      status: statusCode,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Response-Time": `${Date.now() - checkStartTime}ms`,
      },
    });
  } catch (error) {
    console.error("Health check error:", error);

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        uptime: Date.now() - startTime,
        version: process.env.npm_package_version || "1.0.0",
        error: error instanceof Error ? error.message : "Health check failed",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-Response-Time": `${Date.now() - checkStartTime}ms`,
        },
      },
    );
  }
}

// HEAD /api/health - Quick health check (no body)
export async function HEAD(_request: NextRequest) {
  try {
    // Quick check - just verify server is responding
    await userDb.getAll();

    return new NextResponse(null, {
      status: 200,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (_error) {
    return new NextResponse(null, {
      status: 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }
}
