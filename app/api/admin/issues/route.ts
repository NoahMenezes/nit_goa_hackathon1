// Admin Issues Management API
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { issueDb } from "@/lib/db";
import { logAdminAction, getRequestMetadata } from "@/lib/audit-log";

// GET /api/admin/issues - Get all issues with filters (admin only)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.error?.includes("Forbidden") ? 403 : 401 },
      );
    }

    const { ipAddress, userAgent } = getRequestMetadata(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const priority = searchParams.get("priority");
    const ward = searchParams.get("ward");
    const assignedTo = searchParams.get("assignedTo");

    let issues = await issueDb.getAll();

    // Apply filters
    if (status) {
      issues = issues.filter((issue) => issue.status === status);
    }
    if (category) {
      issues = issues.filter((issue) => issue.category === category);
    }
    if (priority) {
      issues = issues.filter((issue) => issue.priority === priority);
    }
    if (ward) {
      issues = issues.filter((issue) => issue.ward === ward);
    }
    if (assignedTo) {
      issues = issues.filter((issue) => issue.assignedTo === assignedTo);
    }

    // Sort by priority and date
    issues.sort((a, b) => {
      const priorityOrder: Record<string, number> = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
      };
      const aPriority = priorityOrder[a.priority] || 0;
      const bPriority = priorityOrder[b.priority] || 0;

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Log admin access
    logAdminAction({
      userId: authResult.user!.userId,
      userEmail: authResult.user!.email,
      userRole: authResult.user!.role,
      action: "create",
      resource: "admin",
      ipAddress,
      userAgent,
      details: {
        endpoint: "admin/issues",
        method: "GET",
        filters: { status, category, priority, ward, assignedTo },
        resultCount: issues.length,
      },
      success: true,
    });

    return NextResponse.json({
      success: true,
      data: issues,
    });
  } catch (error) {
    console.error("Admin get issues error:", error);

    // Log failure
    const { ipAddress, userAgent } = getRequestMetadata(request);
    logAdminAction({
      userId: "unknown",
      userEmail: "unknown",
      userRole: "admin",
      action: "create",
      resource: "admin",
      ipAddress,
      userAgent,
      details: { endpoint: "admin/issues", method: "GET" },
      success: false,
      errorMessage:
        error instanceof Error ? error.message : "Failed to fetch issues",
    });

    return NextResponse.json(
      { success: false, error: "Failed to fetch issues" },
      { status: 500 },
    );
  }
}

// PATCH /api/admin/issues - Bulk update issues (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.error?.includes("Forbidden") ? 403 : 401 },
      );
    }

    const { ipAddress, userAgent } = getRequestMetadata(request);

    const body = await request.json();
    const { issueIds, updates } = body;

    if (!issueIds || !Array.isArray(issueIds) || issueIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Issue IDs are required" },
        { status: 400 },
      );
    }

    if (!updates || typeof updates !== "object") {
      return NextResponse.json(
        { success: false, error: "Updates object is required" },
        { status: 400 },
      );
    }

    const updatedIssues = [];
    const errors = [];

    for (const issueId of issueIds) {
      const updated = await issueDb.update(issueId, updates);
      if (updated) {
        updatedIssues.push(updated);
      } else {
        errors.push(`Issue ${issueId} not found`);
      }
    }

    // Log bulk update action
    logAdminAction({
      userId: authResult.user!.userId,
      userEmail: authResult.user!.email,
      userRole: authResult.user!.role,
      action: "bulk_update",
      resource: "issue",
      ipAddress,
      userAgent,
      details: {
        issueIds,
        updates,
        updatedCount: updatedIssues.length,
        errorCount: errors.length,
      },
      success: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        updated: updatedIssues.length,
        issues: updatedIssues,
        errors: errors.length > 0 ? errors : undefined,
      },
      message: `Successfully updated ${updatedIssues.length} issue(s)`,
    });
  } catch (error) {
    console.error("Admin bulk update error:", error);

    // Log failure
    const { ipAddress, userAgent } = getRequestMetadata(request);
    logAdminAction({
      userId: "unknown",
      userEmail: "unknown",
      userRole: "admin",
      action: "bulk_update",
      resource: "issue",
      ipAddress,
      userAgent,
      details: { endpoint: "admin/issues", method: "PATCH" },
      success: false,
      errorMessage:
        error instanceof Error ? error.message : "Failed to update issues",
    });

    return NextResponse.json(
      { success: false, error: "Failed to update issues" },
      { status: 500 },
    );
  }
}
