// Analytics utilities for OurStreet
import {
  Issue,
  IssueCategory,
  IssuePriority,
  WardAnalytics,
  IssueHotspot,
  TrendData,
  ImpactReport,
  PublicStats,
} from "./types";

/**
 * Calculate average resolution time for a set of issues
 */
export function calculateAverageResolutionTime(issues: Issue[]): number {
  const resolvedIssues = issues.filter(
    (i) => i.status === "resolved" && i.resolvedAt,
  );

  if (resolvedIssues.length === 0) return 0;

  const totalTime = resolvedIssues.reduce((sum, issue) => {
    const created = new Date(issue.createdAt).getTime();
    const resolved = new Date(issue.resolvedAt!).getTime();
    const days = (resolved - created) / (1000 * 60 * 60 * 24);
    return sum + days;
  }, 0);

  return Math.round((totalTime / resolvedIssues.length) * 10) / 10;
}

/**
 * Get ward-specific analytics
 */
export function getWardAnalytics(issues: Issue[], ward: string): WardAnalytics {
  const wardIssues = issues.filter((i) => i.ward === ward);

  const totalIssues = wardIssues.length;
  const openIssues = wardIssues.filter((i) => i.status === "open").length;
  const inProgressIssues = wardIssues.filter(
    (i) => i.status === "in-progress",
  ).length;
  const resolvedIssues = wardIssues.filter(
    (i) => i.status === "resolved",
  ).length;

  const averageResolutionTime = calculateAverageResolutionTime(wardIssues);
  const resolutionRate =
    totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0;

  // Category breakdown
  const categoryMap = new Map<IssueCategory, number>();
  wardIssues.forEach((issue) => {
    const count = categoryMap.get(issue.category) || 0;
    categoryMap.set(issue.category, count + 1);
  });

  const categoryBreakdown = Array.from(categoryMap.entries()).map(
    ([category, count]) => ({
      category,
      count,
    }),
  );

  // Priority breakdown
  const priorityMap = new Map<IssuePriority, number>();
  wardIssues.forEach((issue) => {
    const count = priorityMap.get(issue.priority) || 0;
    priorityMap.set(issue.priority, count + 1);
  });

  const priorityBreakdown = Array.from(priorityMap.entries()).map(
    ([priority, count]) => ({
      priority,
      count,
    }),
  );

  return {
    ward,
    totalIssues,
    openIssues,
    inProgressIssues,
    resolvedIssues,
    averageResolutionTime,
    categoryBreakdown,
    resolutionRate,
    priorityBreakdown,
  };
}

/**
 * Identify issue hotspots based on location clustering
 */
export function identifyHotspots(
  issues: Issue[],
  radiusKm: number = 0.5,
): IssueHotspot[] {
  const hotspots: IssueHotspot[] = [];
  const processedIssues = new Set<string>();

  issues.forEach((issue) => {
    if (processedIssues.has(issue.id)) return;

    // Find nearby issues
    const nearbyIssues = issues.filter((other) => {
      if (processedIssues.has(other.id)) return false;
      const distance = calculateDistance(
        issue.coordinates.lat,
        issue.coordinates.lng,
        other.coordinates.lat,
        other.coordinates.lng,
      );
      return distance <= radiusKm;
    });

    if (nearbyIssues.length >= 3) {
      // Mark as hotspot
      nearbyIssues.forEach((i) => processedIssues.add(i.id));

      // Calculate centroid
      const avgLat =
        nearbyIssues.reduce((sum, i) => sum + i.coordinates.lat, 0) /
        nearbyIssues.length;
      const avgLng =
        nearbyIssues.reduce((sum, i) => sum + i.coordinates.lng, 0) /
        nearbyIssues.length;

      // Get unique categories
      const categories = Array.from(
        new Set(nearbyIssues.map((i) => i.category)),
      );

      // Determine severity
      const criticalCount = nearbyIssues.filter(
        (i) => i.priority === "critical",
      ).length;
      const highCount = nearbyIssues.filter(
        (i) => i.priority === "high",
      ).length;

      let severity: "low" | "medium" | "high" | "critical" = "low";
      if (criticalCount > 0) severity = "critical";
      else if (highCount >= 2) severity = "high";
      else if (nearbyIssues.length >= 5) severity = "medium";

      hotspots.push({
        location: nearbyIssues[0].location,
        ward: nearbyIssues[0].ward,
        coordinates: {
          lat: avgLat,
          lng: avgLng,
        },
        issueCount: nearbyIssues.length,
        categories,
        severity,
      });
    }
  });

  return hotspots.sort((a, b) => b.issueCount - a.issueCount);
}

/**
 * Calculate distance between two coordinates in kilometers
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Generate trend data for a date range
 */
export function generateTrendData(
  issues: Issue[],
  days: number = 30,
): TrendData[] {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const trendMap = new Map<
    string,
    { open: number; resolved: number; new: number }
  >();

  // Initialize all dates
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    trendMap.set(dateStr, { open: 0, resolved: 0, new: 0 });
  }

  // Count new issues per day
  issues.forEach((issue) => {
    const createdDate = new Date(issue.createdAt).toISOString().split("T")[0];
    if (trendMap.has(createdDate)) {
      const data = trendMap.get(createdDate)!;
      data.new += 1;
    }

    // Count resolved issues per day
    if (issue.resolvedAt) {
      const resolvedDate = new Date(issue.resolvedAt)
        .toISOString()
        .split("T")[0];
      if (trendMap.has(resolvedDate)) {
        const data = trendMap.get(resolvedDate)!;
        data.resolved += 1;
      }
    }
  });

  // Calculate cumulative open issues
  let cumulativeOpen = 0;
  const result: TrendData[] = [];

  Array.from(trendMap.keys())
    .sort()
    .forEach((date) => {
      const data = trendMap.get(date)!;
      cumulativeOpen = cumulativeOpen + data.new - data.resolved;

      result.push({
        date,
        openIssues: cumulativeOpen,
        resolvedIssues: data.resolved,
        newIssues: data.new,
      });
    });

  return result;
}

/**
 * Generate comprehensive impact report
 */
export function generateImpactReport(
  issues: Issue[],
  wards: string[],
  dateRange?: { start: string; end: string },
): ImpactReport {
  let filteredIssues = issues;

  // Apply date filter if provided
  if (dateRange) {
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    filteredIssues = issues.filter((i) => {
      const createdDate = new Date(i.createdAt);
      return createdDate >= startDate && createdDate <= endDate;
    });
  }

  const totalIssues = filteredIssues.length;
  const resolvedIssues = filteredIssues.filter(
    (i) => i.status === "resolved",
  ).length;
  const averageResolutionTime = calculateAverageResolutionTime(filteredIssues);
  const resolutionRate =
    totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0;

  // Ward analytics
  const wardAnalytics = wards.map((ward) =>
    getWardAnalytics(filteredIssues, ward),
  );

  // Hotspots
  const hotspots = identifyHotspots(filteredIssues);

  // Trends
  const trends = generateTrendData(filteredIssues);

  // Category performance
  const categoryMap = new Map<IssueCategory, Issue[]>();
  filteredIssues.forEach((issue) => {
    const categoryIssues = categoryMap.get(issue.category) || [];
    categoryIssues.push(issue);
    categoryMap.set(issue.category, categoryIssues);
  });

  const categoryPerformance = Array.from(categoryMap.entries()).map(
    ([category, categoryIssues]) => ({
      category,
      totalIssues: categoryIssues.length,
      resolvedIssues: categoryIssues.filter((i) => i.status === "resolved")
        .length,
      averageResolutionTime: calculateAverageResolutionTime(categoryIssues),
    }),
  );

  // Determine date range
  let reportDateRange = dateRange;
  if (!reportDateRange && filteredIssues.length > 0) {
    const dates = filteredIssues.map((i) => new Date(i.createdAt).getTime());
    reportDateRange = {
      start: new Date(Math.min(...dates)).toISOString(),
      end: new Date(Math.max(...dates)).toISOString(),
    };
  } else if (!reportDateRange) {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    reportDateRange = {
      start: thirtyDaysAgo.toISOString(),
      end: now.toISOString(),
    };
  }

  return {
    dateRange: reportDateRange,
    summary: {
      totalIssues,
      resolvedIssues,
      averageResolutionTime,
      resolutionRate,
    },
    wardAnalytics,
    hotspots,
    trends,
    categoryPerformance,
  };
}

/**
 * Generate public-facing statistics (anonymized)
 */
export function generatePublicStats(
  issues: Issue[],
  users: number,
): PublicStats {
  const totalIssuesReported = issues.length;
  const issuesResolved = issues.filter((i) => i.status === "resolved").length;
  const resolutionRate =
    totalIssuesReported > 0
      ? Math.round((issuesResolved / totalIssuesReported) * 100)
      : 0;
  const averageResolutionTime = calculateAverageResolutionTime(issues);

  // Ward performance
  const wardMap = new Map<string, Issue[]>();
  issues.forEach((issue) => {
    if (issue.ward) {
      const wardIssues = wardMap.get(issue.ward) || [];
      wardIssues.push(issue);
      wardMap.set(issue.ward, wardIssues);
    }
  });

  const wardPerformance = Array.from(wardMap.entries()).map(
    ([ward, wardIssues]) => ({
      ward,
      issuesReported: wardIssues.length,
      issuesResolved: wardIssues.filter((i) => i.status === "resolved").length,
      resolutionRate: Math.round(
        (wardIssues.filter((i) => i.status === "resolved").length /
          wardIssues.length) *
          100,
      ),
    }),
  );

  // Recent resolutions (last 10)
  const recentlyResolved = issues
    .filter((i) => i.status === "resolved" && i.resolvedAt)
    .sort(
      (a, b) =>
        new Date(b.resolvedAt!).getTime() - new Date(a.resolvedAt!).getTime(),
    )
    .slice(0, 10)
    .map((issue) => {
      const created = new Date(issue.createdAt).getTime();
      const resolved = new Date(issue.resolvedAt!).getTime();
      const resolutionTime =
        Math.round(((resolved - created) / (1000 * 60 * 60 * 24)) * 10) / 10;

      return {
        id: issue.id,
        title: issue.title,
        category: issue.category,
        ward: issue.ward,
        resolvedAt: issue.resolvedAt!,
        resolutionTime,
      };
    });

  // Category stats
  const categoryMap = new Map<
    IssueCategory,
    { total: number; resolved: number }
  >();
  issues.forEach((issue) => {
    const stats = categoryMap.get(issue.category) || { total: 0, resolved: 0 };
    stats.total += 1;
    if (issue.status === "resolved") stats.resolved += 1;
    categoryMap.set(issue.category, stats);
  });

  const categoryStats = Array.from(categoryMap.entries()).map(
    ([category, stats]) => ({
      category,
      count: stats.total,
      resolvedCount: stats.resolved,
    }),
  );

  return {
    totalIssuesReported,
    issuesResolved,
    resolutionRate,
    averageResolutionTime,
    activeUsers: users,
    wardPerformance,
    recentResolutions: recentlyResolved,
    categoryStats,
  };
}

/**
 * Format resolution time into human-readable string
 */
export function formatResolutionTime(days: number): string {
  if (days < 1) {
    const hours = Math.round(days * 24);
    return `${hours} hour${hours !== 1 ? "s" : ""}`;
  } else if (days < 7) {
    return `${Math.round(days)} day${Math.round(days) !== 1 ? "s" : ""}`;
  } else if (days < 30) {
    const weeks = Math.round(days / 7);
    return `${weeks} week${weeks !== 1 ? "s" : ""}`;
  } else {
    const months = Math.round(days / 30);
    return `${months} month${months !== 1 ? "s" : ""}`;
  }
}
