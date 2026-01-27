// Health Check API - Monitor system health and dependencies
import { NextRequest, NextResponse } from "next/server";
import { userDb } from "@/lib/db";

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
    // Check database connectivity
    let dbStatus: "up" | "down" = "down";
    let dbResponseTime: number | undefined;
    let dbError: string | undefined;

    try {
      const dbCheckStart = Date.now();
      // Try to fetch a small amount of data to verify DB connection
      await userDb.getAll();
      dbResponseTime = Date.now() - dbCheckStart;
      dbStatus = "up";
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

    if (!process.env.JWT_SECRET) {
      envWarnings.push("JWT_SECRET not configured");
    }

    if (
      process.env.JWT_SECRET === "ourstreet-secret-key-change-in-production"
    ) {
      envWarnings.push("Using default JWT_SECRET - change in production");
    }

    if (!cloudinaryConfigured && !supabaseConfigured) {
      envWarnings.push("No storage provider configured");
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
