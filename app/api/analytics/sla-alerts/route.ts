import { NextRequest, NextResponse } from "next/server";
import { issueDb } from "@/lib/db";
import { Issue, ApiResponse } from "@/lib/types";

interface SLAAlert {
  id: string;
  ticketId: string;
  title: string;
  category: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in-progress" | "resolved" | "closed";
  location: string;
  assignedTo: string;
  createdAt: string;
  slaDeadline: string;
  timeRemaining: string;
  timeRemainingHours: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  estimatedCompletionTime: string;
  impact: string;
}

// SLA times in hours based on priority
const SLA_HOURS: Record<string, number> = {
  critical: 24,
  high: 48,
  medium: 72,
  low: 120,
};

// Calculate time remaining
function calculateTimeRemaining(createdAt: string, slaHours: number): {
  timeRemaining: string;
  timeRemainingHours: number;
  riskLevel: "low" | "medium" | "high" | "critical";
} {
  const created = new Date(createdAt).getTime();
  const deadline = created + slaHours * 60 * 60 * 1000;
  const now = Date.now();
  const remaining = deadline - now;
  const remainingHours = remaining / (1000 * 60 * 60);

  let timeRemaining = "";
  let riskLevel: "low" | "medium" | "high" | "critical" = "low";

  if (remainingHours < 0) {
    const overdue = Math.abs(remainingHours);
    if (overdue < 24) {
      timeRemaining = `${Math.floor(overdue)}h overdue`;
    } else {
      timeRemaining = `${Math.floor(overdue / 24)}d overdue`;
    }
    riskLevel = "critical";
  } else if (remainingHours < 24) {
    timeRemaining = `${Math.floor(remainingHours)}h remaining`;
    riskLevel = remainingHours < 6 ? "critical" : "high";
  } else {
    const days = Math.floor(remainingHours / 24);
    const hours = Math.floor(remainingHours % 24);
    timeRemaining = `${days}d ${hours}h remaining`;

    if (remainingHours < 48) {
      riskLevel = "medium";
    } else {
      riskLevel = "low";
    }
  }

  return {
    timeRemaining,
    timeRemainingHours: remainingHours,
    riskLevel,
  };
}

// Get department/assigned to based on category
function getAssignedDepartment(category: string): string {
  const assignments: Record<string, string> = {
    pothole: "Roads & Infrastructure",
    road: "Roads & Infrastructure",
    streetlight: "Electrical Services",
    electricity: "Electrical Services",
    water_leak: "Water & Sewage Dept",
    drainage: "Water & Sewage Dept",
    sanitation: "Sanitation Dept",
    garbage: "Sanitation Dept",
    traffic: "Traffic Management",
    other: "General Maintenance",
  };

  return assignments[category] || "General Maintenance";
}

// Get impact description
function getImpactDescription(category: string, priority: string): string {
  const impacts: Record<string, Record<string, string>> = {
    pothole: {
      critical: "Major road hazard - Risk of accidents",
      high: "Traffic disruption - Vehicle damage risk",
      medium: "Minor inconvenience to commuters",
      low: "Cosmetic road damage",
    },
    streetlight: {
      critical: "Public safety risk - Multiple lights out",
      high: "Safety concern - Dark area at night",
      medium: "Reduced visibility in area",
      low: "Single light malfunction",
    },
    water_leak: {
      critical: "Major water loss - Property damage risk",
      high: "Significant water wastage",
      medium: "Moderate leak - Needs attention",
      low: "Minor drip - Low priority",
    },
    traffic: {
      critical: "Major intersection failure - Safety risk",
      high: "Traffic congestion - Delay expected",
      medium: "Minor traffic flow issue",
      low: "Traffic sign maintenance",
    },
    sanitation: {
      critical: "Health hazard - Immediate action required",
      high: "Sanitation concern - Public health risk",
      medium: "Cleanliness issue needs attention",
      low: "Routine maintenance required",
    },
    garbage: {
      critical: "Major accumulation - Health hazard",
      high: "Overflow situation - Pest risk",
      medium: "Bin needs emptying",
      low: "Routine collection needed",
    },
  };

  const categoryImpacts = impacts[category] || impacts.garbage;
  return categoryImpacts[priority] || "Requires municipal attention";
}

// Estimate completion time
function estimateCompletionTime(
  category: string,
  priority: string,
  status: string
): string {
  if (status === "resolved" || status === "closed") {
    return "Completed";
  }

  // Base time in hours
  const baseTimes: Record<string, number> = {
    pothole: 48,
    road: 72,
    streetlight: 24,
    electricity: 36,
    water_leak: 24,
    drainage: 48,
    sanitation: 12,
    garbage: 8,
    traffic: 24,
    other: 48,
  };

  let baseTime = baseTimes[category] || 48;

  // Adjust based on priority
  if (priority === "critical") baseTime *= 0.5;
  else if (priority === "high") baseTime *= 0.7;
  else if (priority === "low") baseTime *= 1.5;

  // Adjust based on status
  if (status === "in-progress") {
    baseTime *= 0.6; // Already started, estimate 60% of original time
  }

  const hours = Math.round(baseTime);
  if (hours < 24) {
    return `~${hours} hours`;
  } else {
    const days = Math.round(hours / 24);
    return `~${days} days`;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const riskFilter = searchParams.get("risk") as "low" | "medium" | "high" | "critical" | null;
    const limit = parseInt(searchParams.get("limit") || "50");

    // Fetch all open and in-progress issues
    const allIssues = await issueDb.getAll();
    const activeIssues = allIssues.filter(
      (issue) => issue.status === "open" || issue.status === "in-progress"
    );

    // Convert to SLA alerts
    const alerts: SLAAlert[] = activeIssues.map((issue) => {
      const slaHours = SLA_HOURS[issue.priority] || SLA_HOURS.medium;
      const { timeRemaining, timeRemainingHours, riskLevel } =
        calculateTimeRemaining(issue.createdAt, slaHours);

      const slaDeadline = new Date(
        new Date(issue.createdAt).getTime() + slaHours * 60 * 60 * 1000
      ).toISOString();

      return {
        id: issue.id,
        ticketId: issue.id.substring(0, 8).toUpperCase(),
        title: issue.title,
        category: issue.category,
        priority: issue.priority,
        status: issue.status,
        location: issue.location,
        assignedTo: getAssignedDepartment(issue.category),
        createdAt: issue.createdAt,
        slaDeadline,
        timeRemaining,
        timeRemainingHours,
        riskLevel,
        estimatedCompletionTime: estimateCompletionTime(
          issue.category,
          issue.priority,
          issue.status
        ),
        impact: getImpactDescription(issue.category, issue.priority),
      };
    });

    // Filter by risk level if specified
    let filteredAlerts = alerts;
    if (riskFilter) {
      filteredAlerts = alerts.filter((alert) => alert.riskLevel === riskFilter);
    }

    // Sort by time remaining (most urgent first)
    filteredAlerts.sort((a, b) => a.timeRemainingHours - b.timeRemainingHours);

    // Apply limit
    const limitedAlerts = filteredAlerts.slice(0, limit);

    // Calculate summary statistics
    const summary = {
      total: filteredAlerts.length,
      critical: filteredAlerts.filter((a) => a.riskLevel === "critical").length,
      high: filteredAlerts.filter((a) => a.riskLevel === "high").length,
      medium: filteredAlerts.filter((a) => a.riskLevel === "medium").length,
      low: filteredAlerts.filter((a) => a.riskLevel === "low").length,
      overdue: filteredAlerts.filter((a) => a.timeRemainingHours < 0).length,
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          alerts: limitedAlerts,
          summary,
        },
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching SLA alerts:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch SLA alerts",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
