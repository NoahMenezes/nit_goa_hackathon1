import { NextRequest, NextResponse } from "next/server";
import { issueDb } from "@/lib/db";
import { Issue, ApiResponse } from "@/lib/types";

interface TrendData {
  hotspotTrends: Array<{
    month: string;
    potholes: number;
    streetlights: number;
    water: number;
    sanitation: number;
    drainage: number;
    electricity: number;
    traffic: number;
    other: number;
    predicted: number;
  }>;
  resourceDemand: Array<{
    week: string;
    maintenance: number;
    emergency: number;
    planned: number;
    capacity: number;
  }>;
  departmentPerformance: Array<{
    department: string;
    resolved: number;
    pending: number;
    avgTime: number;
  }>;
  predictionAccuracy: Array<{
    week: string;
    predicted: number;
    actual: number;
    accuracy: number;
  }>;
}

// Get month name from date
function getMonthName(date: Date): string {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return months[date.getMonth()];
}

// Get week number
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Calculate hotspot trends (last 8 months)
function calculateHotspotTrends(issues: Issue[]): TrendData["hotspotTrends"] {
  const monthlyData: Record<
    string,
    {
      month: string;
      potholes: number;
      streetlights: number;
      water: number;
      sanitation: number;
      drainage: number;
      electricity: number;
      traffic: number;
      other: number;
      total: number;
    }
  > = {};

  // Get last 8 months
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    monthlyData[monthKey] = {
      month: getMonthName(date),
      potholes: 0,
      streetlights: 0,
      water: 0,
      sanitation: 0,
      drainage: 0,
      electricity: 0,
      traffic: 0,
      other: 0,
      total: 0,
    };
  }

  // Count issues by category and month
  issues.forEach((issue) => {
    const date = new Date(issue.createdAt);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;

    if (monthlyData[monthKey]) {
      const category = issue.category.toLowerCase();
      if (category === "pothole") monthlyData[monthKey].potholes++;
      else if (category === "streetlight") monthlyData[monthKey].streetlights++;
      else if (category === "water_leak") monthlyData[monthKey].water++;
      else if (category === "sanitation") monthlyData[monthKey].sanitation++;
      else if (category === "drainage") monthlyData[monthKey].drainage++;
      else if (category === "electricity") monthlyData[monthKey].electricity++;
      else if (category === "traffic") monthlyData[monthKey].traffic++;
      else monthlyData[monthKey].other++;

      monthlyData[monthKey].total++;
    }
  });

  // Convert to array and add predictions
  const trends = Object.values(monthlyData).map((data, index, array) => {
    // Simple prediction: average of last 3 months + 10% growth
    let predicted = data.total;
    if (index >= 2) {
      const avg =
        (array[index - 2].total + array[index - 1].total + data.total) / 3;
      predicted = Math.round(avg * 1.1);
    } else {
      predicted = Math.round(data.total * 1.15);
    }

    return {
      ...data,
      predicted,
    };
  });

  return trends;
}

// Calculate resource demand (last 6 weeks)
function calculateResourceDemand(issues: Issue[]): TrendData["resourceDemand"] {
  const weeklyData: Record<
    string,
    {
      week: string;
      emergency: number;
      maintenance: number;
      planned: number;
    }
  > = {};

  // Get last 6 weeks
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const weekNum = getWeekNumber(date);
    const weekKey = `Week ${weekNum}`;
    weeklyData[weekKey] = {
      week: weekKey,
      emergency: 0,
      maintenance: 0,
      planned: 0,
    };
  }

  // Categorize issues by priority and week
  issues.forEach((issue) => {
    const date = new Date(issue.createdAt);
    const weekNum = getWeekNumber(date);
    const weekKey = `Week ${weekNum}`;

    if (weeklyData[weekKey]) {
      if (issue.priority === "critical" || issue.priority === "high") {
        weeklyData[weekKey].emergency += 2; // High priority takes more resources
      } else if (issue.status === "in-progress") {
        weeklyData[weekKey].maintenance += 1.5;
      } else {
        weeklyData[weekKey].planned += 1;
      }
    }
  });

  // Convert to array and normalize to percentage
  const demand = Object.values(weeklyData).map((data) => {
    const total = data.emergency + data.maintenance + data.planned;
    const capacity = 100;

    return {
      week: data.week,
      emergency: Math.min(Math.round((data.emergency / total) * 100), 100),
      maintenance: Math.min(Math.round((data.maintenance / total) * 100), 100),
      planned: Math.min(Math.round((data.planned / total) * 100), 100),
      capacity,
    };
  });

  return demand;
}

// Calculate department performance
function calculateDepartmentPerformance(
  issues: Issue[]
): TrendData["departmentPerformance"] {
  const departments: Record<
    string,
    { resolved: number; pending: number; totalTime: number }
  > = {
    "Water & Sewage": { resolved: 0, pending: 0, totalTime: 0 },
    "Roads & Infrastructure": { resolved: 0, pending: 0, totalTime: 0 },
    "Electrical Services": { resolved: 0, pending: 0, totalTime: 0 },
    "Sanitation": { resolved: 0, pending: 0, totalTime: 0 },
    "Traffic Management": { resolved: 0, pending: 0, totalTime: 0 },
    "General Maintenance": { resolved: 0, pending: 0, totalTime: 0 },
  };

  // Map categories to departments
  const categoryToDept: Record<string, string> = {
    water_leak: "Water & Sewage",
    drainage: "Water & Sewage",
    pothole: "Roads & Infrastructure",
    road: "Roads & Infrastructure",
    streetlight: "Electrical Services",
    electricity: "Electrical Services",
    sanitation: "Sanitation",
    garbage: "Sanitation",
    traffic: "Traffic Management",
    other: "General Maintenance",
  };

  issues.forEach((issue) => {
    const dept = categoryToDept[issue.category] || "General Maintenance";

    if (issue.status === "resolved" && issue.resolvedAt) {
      departments[dept].resolved++;
      const created = new Date(issue.createdAt).getTime();
      const resolved = new Date(issue.resolvedAt).getTime();
      const days = (resolved - created) / (1000 * 60 * 60 * 24);
      departments[dept].totalTime += days;
    } else if (issue.status !== "closed") {
      departments[dept].pending++;
    }
  });

  const performance = Object.entries(departments).map(([dept, data]) => ({
    department: dept,
    resolved: data.resolved,
    pending: data.pending,
    avgTime:
      data.resolved > 0
        ? Number((data.totalTime / data.resolved).toFixed(1))
        : 0,
  }));

  return performance;
}

// Calculate prediction accuracy (simulated for last 6 weeks)
function calculatePredictionAccuracy(
  issues: Issue[]
): TrendData["predictionAccuracy"] {
  const weeklyData: Record<string, { actual: number }> = {};

  // Get last 6 weeks
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const weekNum = getWeekNumber(date);
    const weekKey = `Week ${weekNum}`;
    weeklyData[weekKey] = {
      actual: 0,
    };
  }

  // Count actual issues per week
  issues.forEach((issue) => {
    const date = new Date(issue.createdAt);
    const weekNum = getWeekNumber(date);
    const weekKey = `Week ${weekNum}`;

    if (weeklyData[weekKey]) {
      weeklyData[weekKey].actual++;
    }
  });

  // Calculate predictions and accuracy
  const accuracy = Object.entries(weeklyData).map(([week, data], index, arr) => {
    // Predict based on previous weeks average
    let predicted = data.actual;
    if (index > 0) {
      const prevActuals = arr.slice(Math.max(0, index - 2), index).map((w) => w[1].actual);
      const avg = prevActuals.reduce((sum, val) => sum + val, 0) / prevActuals.length;
      predicted = Math.round(avg * 1.05); // 5% growth prediction
    }

    // Calculate accuracy percentage
    const accuracyPct =
      predicted > 0
        ? Math.round((1 - Math.abs(data.actual - predicted) / predicted) * 100)
        : 100;

    return {
      week,
      predicted,
      actual: data.actual,
      accuracy: Math.max(0, Math.min(100, accuracyPct)),
    };
  });

  return accuracy;
}

export async function GET(request: NextRequest) {
  try {
    // Fetch all issues
    const allIssues = await issueDb.getAll();

    // Filter to last 8 months for better performance
    const eightMonthsAgo = new Date();
    eightMonthsAgo.setMonth(eightMonthsAgo.getMonth() - 8);

    const recentIssues = allIssues.filter(
      (issue) => new Date(issue.createdAt) >= eightMonthsAgo
    );

    // Calculate all trend data
    const hotspotTrends = calculateHotspotTrends(recentIssues);
    const resourceDemand = calculateResourceDemand(recentIssues);
    const departmentPerformance = calculateDepartmentPerformance(recentIssues);
    const predictionAccuracy = calculatePredictionAccuracy(recentIssues);

    const trendData: TrendData = {
      hotspotTrends,
      resourceDemand,
      departmentPerformance,
      predictionAccuracy,
    };

    return NextResponse.json(
      {
        success: true,
        data: trendData,
      } as ApiResponse<TrendData>,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching trend data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch trend data",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
