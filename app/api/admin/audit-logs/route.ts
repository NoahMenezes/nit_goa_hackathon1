// Admin Audit Logs API - View system audit logs
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  getAuditLogs,
  getAuditStats,
  getSecurityEvents,
  exportAuditLogs,
  AuditAction,
  AuditResource,
} from "@/lib/audit-log";
import { logAdminAction, getRequestMetadata } from "@/lib/audit-log";

// GET /api/admin/audit-logs - Get audit logs with filters
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await requireAdmin(request);
    if (!authResult.authorized || !authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.error?.includes("Forbidden") ? 403 : 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const { ipAddress, userAgent } = getRequestMetadata(request);

    // Get filter parameters
    const userId = searchParams.get("userId") || undefined;
    const action = searchParams.get("action") as AuditAction | undefined;
    const resource = searchParams.get("resource") as AuditResource | undefined;
    const successParam = searchParams.get("success");
    const success =
      successParam !== null ? successParam === "true" : undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");
    const export_logs = searchParams.get("export") === "true";
    const statsOnly = searchParams.get("stats") === "true";
    const securityOnly = searchParams.get("security") === "true";

    // Log admin access to audit logs
    logAdminAction({
      userId: authResult.user.userId,
      userEmail: authResult.user.email,
      userRole: authResult.user.role,
      action: "create",
      resource: "admin",
      ipAddress,
      userAgent,
      details: {
        endpoint: "audit-logs",
        filters: {
          userId,
          action,
          resource,
          success,
          startDate,
          endDate,
        },
      },
      success: true,
    });

    // Handle different query types
    if (export_logs) {
      // Export logs as JSON
      const jsonData = exportAuditLogs({ startDate, endDate });

      return new NextResponse(jsonData, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="audit-logs-${Date.now()}.json"`,
        },
      });
    }

    if (statsOnly) {
      // Return statistics only
      const stats = getAuditStats(startDate, endDate);

      return NextResponse.json({
        success: true,
        data: stats,
      });
    }

    if (securityOnly) {
      // Return security events only
      const securityEvents = getSecurityEvents(limit);

      return NextResponse.json({
        success: true,
        data: {
          logs: securityEvents,
          total: securityEvents.length,
        },
      });
    }

    // Get filtered audit logs
    const result = getAuditLogs({
      userId,
      action,
      resource,
      success,
      startDate,
      endDate,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: {
        logs: result.logs,
        total: result.total,
        limit,
        offset,
        hasMore: offset + limit < result.total,
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch audit logs",
      },
      { status: 500 }
    );
  }
}
