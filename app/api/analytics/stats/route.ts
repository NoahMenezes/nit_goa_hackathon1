import { NextRequest, NextResponse } from "next/server";
import { issueDb } from "@/lib/db";
import { Issue, ApiResponse } from "@/lib/types";

interface DashboardStats {
  totalActiveIssues: number;
  criticalIssues: number;
  issuesTrend: number; // percentage change
  slaComplianceRate: number;
  slaBreaches: number;
  slaComplianceTrend: number;
  averageResolutionTime: number; // in days
  resolutionTimeTrend: number;
  citizenSatisfaction: number;
  satisfactionTrend: number;
  resolvedThisMonth: number;
  issuesByCategory: Record<string, number>;
  issuesByStatus: Record<string, number>;
  issuesByPriority: Record<string, number>;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    location?: string;
    timestamp: string;
  }>;
}

// Calculate percentage change
function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

// Calculate average resolution time in days
function calculateAvgResolutionTime(issues: Issue[]): number {
  const resolvedIssues = issues.filter(
    (issue) => issue.status === "resolved" && issue.resolvedAt
  );

  if (resolvedIssues.length === 0) return 0;

  const totalDays = resolvedIssues.reduce((sum, issue) => {
    const created = new Date(issue.createdAt).getTime();
    const resolved = new Date(issue.resolvedAt!).getTime();
    const days = (resolved - created) / (1000 * 60 * 60 * 24);
    return sum + days;
  }, 0);

  return Number((totalDays / resolvedIssues.length).toFixed(1));
}

// Calculate SLA compliance (assuming 72 hours SLA for all issues)
function calculateSLACompliance(issues: Issue[]): {
  complianceRate: number;
  breaches: number;
} {
  const SLA_HOURS = 72;
  const resolvedIssues = issues.filter(
    (issue) => issue.status === "resolved" && issue.resolvedAt
  );

  if (resolvedIssues.length === 0) {
    return { complianceRate: 100, breaches: 0 };
  }

  let breaches = 0;
  resolvedIssues.forEach((issue) => {
    const created = new Date(issue.createdAt).getTime();
    const resolved = new Date(issue.resolvedAt!).getTime();
    const hours = (resolved - created) / (1000 * 60 * 60);
    if (hours > SLA_HOURS) {
      breaches++;
    }
  });

  const complianceRate = Number(
    (((resolvedIssues.length - breaches) / resolvedIssues.length) * 100).toFixed(1)
  );

  return { complianceRate, breaches };
}

// Calculate citizen satisfaction based on resolution rate and time
function calculateSatisfaction(issues: Issue[]): number {
  const totalIssues = issues.length;
  if (totalIssues === 0) return 5.0;

  const resolvedIssues = issues.filter((issue) => issue.status === "resolved");
  const resolutionRate = resolvedIssues.length / totalIssues;

  const avgResolutionTime = calculateAvgResolutionTime(issues);
  const timeFactor = Math.max(0, 1 - avgResolutionTime / 10); // Better score for faster resolution

  // Weighted score: 70% resolution rate, 30% time factor
  const score = resolutionRate * 0.7 + timeFactor * 0.3;
  return Number((score * 5).toFixed(1)); // Scale to 5.0
}

// Get recent activity from issues
function getRecentActivity(issues: Issue[]): DashboardStats["recentActivity"] {
  const activities: DashboardStats["recentActivity"] = [];

  // Sort by most recent
  const sortedIssues = [...issues].sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt).getTime() -
      new Date(a.updatedAt || a.createdAt).getTime()
  );

  // Get last 5 activities
  for (const issue of sortedIssues.slice(0, 5)) {
    const timeDiff = Date.now() - new Date(issue.updatedAt || issue.createdAt).getTime();
    const minutesAgo = Math.floor(timeDiff / (1000 * 60));
    const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
    const daysAgo = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    let timeStr = "";
    if (daysAgo > 0) {
      timeStr = `${daysAgo}d ago`;
    } else if (hoursAgo > 0) {
      timeStr = `${hoursAgo}h ago`;
    } else {
      timeStr = `${minutesAgo}m ago`;
    }

    let activityType = "new";
    let message = "";

    if (issue.status === "resolved") {
      activityType = "resolved";
      message = `${issue.category.replace("_", " ")} resolved - ${issue.location}`;
    } else if (issue.status === "in-progress") {
      activityType = "in-progress";
      message = `${issue.category.replace("_", " ")} in progress - ${issue.location}`;
    } else if (issue.priority === "critical" || issue.priority === "high") {
      activityType = "critical";
      message = `${issue.priority} priority: ${issue.category.replace("_", " ")} - ${issue.location}`;
    } else {
      activityType = "new";
      message = `New ${issue.category.replace("_", " ")} reported - ${issue.location}`;
    }

    activities.push({
      id: issue.id,
      type: activityType,
      message: `${message} • ${timeStr}`,
      location: issue.location,
      timestamp: issue.updatedAt || issue.createdAt,
    });
  }

  return activities;
}

export async function GET(request: NextRequest) {
  try {
    // Fetch all issues
    const allIssues = await issueDb.getAll();

    // Current period (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const currentPeriodIssues = allIssues.filter(
      (issue) => new Date(issue.createdAt) >= thirtyDaysAgo
    );

    const previousPeriodIssues = allIssues.filter((issue) => {
      const created = new Date(issue.createdAt);
      return created >= sixtyDaysAgo && created < thirtyDaysAgo;
    });

    // Calculate total active issues (not resolved or closed)
    const activeIssues = allIssues.filter(
      (issue) => issue.status !== "resolved" && issue.status !== "closed"
    );
    const totalActiveIssues = activeIssues.length;

    const prevActiveIssues = previousPeriodIssues.filter(
      (issue) => issue.status !== "resolved" && issue.status !== "closed"
    ).length;

    // Calculate critical issues
    const criticalIssues = activeIssues.filter(
      (issue) => issue.priority === "critical" || issue.priority === "high"
    ).length;

    // Calculate trends
    const issuesTrend = calculateTrend(
      currentPeriodIssues.length,
      previousPeriodIssues.length
    );

    // SLA Compliance
    const currentSLA = calculateSLACompliance(currentPeriodIssues);
    const previousSLA = calculateSLACompliance(previousPeriodIssues);
    const slaComplianceTrend = calculateTrend(
      currentSLA.complianceRate,
      previousSLA.complianceRate
    );

    // Average Resolution Time
    const currentAvgResolutionTime = calculateAvgResolutionTime(currentPeriodIssues);
    const previousAvgResolutionTime = calculateAvgResolutionTime(previousPeriodIssues);
    const resolutionTimeTrend =
      previousAvgResolutionTime > 0
        ? -calculateTrend(currentAvgResolutionTime, previousAvgResolutionTime)
        : 0;

    // Citizen Satisfaction
    const currentSatisfaction = calculateSatisfaction(currentPeriodIssues);
    const previousSatisfaction = calculateSatisfaction(previousPeriodIssues);
    const satisfactionTrend =
      previousSatisfaction > 0
        ? Number((currentSatisfaction - previousSatisfaction).toFixed(1))
        : 0;

    // Resolved this month
    const resolvedThisMonth = currentPeriodIssues.filter(
      (issue) => issue.status === "resolved"
    ).length;

    // Issues by category
    const issuesByCategory: Record<string, number> = {};
    allIssues.forEach((issue) => {
      issuesByCategory[issue.category] =
        (issuesByCategory[issue.category] || 0) + 1;
    });

    // Issues by status
    const issuesByStatus: Record<string, number> = {};
    allIssues.forEach((issue) => {
      issuesByStatus[issue.status] = (issuesByStatus[issue.status] || 0) + 1;
    });

    // Issues by priority
    const issuesByPriority: Record<string, number> = {};
    allIssues.forEach((issue) => {
      issuesByPriority[issue.priority] =
        (issuesByPriority[issue.priority] || 0) + 1;
    });

    // Recent activity
    const recentActivity = getRecentActivity(allIssues);

    const stats: DashboardStats = {
      totalActiveIssues,
      criticalIssues,
      issuesTrend,
      slaComplianceRate: currentSLA.complianceRate,
      slaBreaches: currentSLA.breaches,
      slaComplianceTrend,
      averageResolutionTime: currentAvgResolutionTime,
      resolutionTimeTrend,
      citizenSatisfaction: currentSatisfaction,
      satisfactionTrend,
      resolvedThisMonth,
      issuesByCategory,
      issuesByStatus,
      issuesByPriority,
      recentActivity,
    };

    return NextResponse.json(
      {
        success: true,
        data: stats,
      } as ApiResponse<DashboardStats>,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching analytics stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch analytics stats",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
