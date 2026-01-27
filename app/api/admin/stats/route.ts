// Admin Stats API - Ward-wise analytics and performance metrics
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { issueDb } from "@/lib/db";

// GET /api/admin/stats - Get comprehensive admin statistics
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.error?.includes("Forbidden") ? 403 : 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const ward = searchParams.get("ward");

    let issues = await issueDb.getAll();

    // Filter by ward if specified
    if (ward) {
      issues = issues.filter((issue) => issue.ward === ward);
    }

    // Overall statistics
    const totalIssues = issues.length;
    const openIssues = issues.filter((i) => i.status === "open").length;
    const inProgressIssues = issues.filter(
      (i) => i.status === "in-progress",
    ).length;
    const resolvedIssues = issues.filter((i) => i.status === "resolved").length;
    const closedIssues = issues.filter((i) => i.status === "closed").length;

    // Priority breakdown
    const criticalIssues = issues.filter(
      (i) => i.priority === "critical",
    ).length;
    const highPriorityIssues = issues.filter(
      (i) => i.priority === "high",
    ).length;
    const mediumPriorityIssues = issues.filter(
      (i) => i.priority === "medium",
    ).length;
    const lowPriorityIssues = issues.filter((i) => i.priority === "low").length;

    // Category breakdown
    const categoryBreakdown = issues.reduce(
      (acc, issue) => {
        const existing = acc.find((item) => item.category === issue.category);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ category: issue.category, count: 1 });
        }
        return acc;
      },
      [] as { category: string; count: number }[],
    );

    // Ward-wise breakdown
    const wardBreakdown = issues.reduce(
      (acc, issue) => {
        const wardName = issue.ward || "Unassigned";
        const existing = acc.find((item) => item.ward === wardName);
        if (existing) {
          existing.total++;
          if (issue.status === "open") existing.open++;
          if (issue.status === "in-progress") existing.inProgress++;
          if (issue.status === "resolved") existing.resolved++;
        } else {
          acc.push({
            ward: wardName,
            total: 1,
            open: issue.status === "open" ? 1 : 0,
            inProgress: issue.status === "in-progress" ? 1 : 0,
            resolved: issue.status === "resolved" ? 1 : 0,
          });
        }
        return acc;
      },
      [] as {
        ward: string;
        total: number;
        open: number;
        inProgress: number;
        resolved: number;
      }[],
    );

    // Calculate average resolution time (in days)
    const resolvedWithTime = issues.filter(
      (i) => i.status === "resolved" && i.resolvedAt,
    );
    let averageResolutionTime = 0;
    if (resolvedWithTime.length > 0) {
      const totalResolutionTime = resolvedWithTime.reduce((sum, issue) => {
        const created = new Date(issue.createdAt).getTime();
        const resolved = new Date(issue.resolvedAt!).getTime();
        const days = (resolved - created) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);
      averageResolutionTime = totalResolutionTime / resolvedWithTime.length;
    }

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const count = issues.filter((issue) => {
        const issueDate = issue.createdAt.split("T")[0];
        return issueDate === dateStr;
      }).length;

      recentActivity.push({ date: dateStr, count });
    }

    // Resolution rate by ward
    const wardPerformance = wardBreakdown.map((ward) => ({
      ward: ward.ward,
      total: ward.total,
      resolved: ward.resolved,
      resolutionRate:
        ward.total > 0
          ? ((ward.resolved / ward.total) * 100).toFixed(1)
          : "0.0",
    }));

    // Top reported categories
    const topCategories = [...categoryBreakdown]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Issues requiring attention (high/critical priority, open status)
    const attentionRequired = issues.filter(
      (i) =>
        (i.priority === "high" || i.priority === "critical") &&
        i.status === "open",
    ).length;

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalIssues,
          openIssues,
          inProgressIssues,
          resolvedIssues,
          closedIssues,
          attentionRequired,
          averageResolutionTime: parseFloat(averageResolutionTime.toFixed(2)),
        },
        priorityBreakdown: {
          critical: criticalIssues,
          high: highPriorityIssues,
          medium: mediumPriorityIssues,
          low: lowPriorityIssues,
        },
        categoryBreakdown,
        topCategories,
        wardBreakdown,
        wardPerformance,
        recentActivity,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch statistics" },
      { status: 500 },
    );
  }
}
