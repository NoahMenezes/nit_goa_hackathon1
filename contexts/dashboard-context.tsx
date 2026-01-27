"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { isAuthenticated } from "@/lib/api-client";

// API data types
interface ApiActivityItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

interface IssueData {
  id: number;
  location?: string;
  coordinates?: { lat: number; lng: number };
  priority?: string;
  status?: string;
  category?: string;
}

export interface DashboardStats {
  totalActiveIssues: number;
  slaComplianceRate: number;
  averageResolutionTime: number;
  citizenSatisfaction: number;
  criticalIssuesPending: number;
  slaBreeches: number;
  resolvedIssuesThisMonth: number;
  trendPercentages: {
    activeIssues: number;
    slaCompliance: number;
    resolutionTime: number;
    satisfaction: number;
  };
}

export interface HotspotData {
  month: string;
  potholes: number;
  streetlights: number;
  water: number;
  sanitation: number;
  predicted: number;
}

export interface ResourceDemand {
  week: string;
  maintenance: number;
  emergency: number;
  planned: number;
  capacity: number;
}

export interface SLAAlert {
  id: string;
  issueId: number;
  title: string;
  category: string;
  priority: string;
  status: string;
  reportedDate: string;
  slaDeadline: string;
  timeRemaining: string;
  location: string;
  assignedTo: string;
  riskLevel: string;
  estimatedImpact: string;
}

export interface DepartmentPerformance {
  department: string;
  totalIssues: number;
  resolved: number;
  avgResolutionTime: number;
  slaCompliance: number;
  efficiency: number;
}

export interface ActivityItem {
  id: number;
  type: string;
  message: string;
  timestamp: string;
  severity: string;
}

export interface PredictiveInsight {
  expectedIssues: {
    nextWeek: number;
    nextMonth: number;
    peakDays: string[];
    highRiskAreas: string[];
  };
  resourceNeeds: {
    additionalStaff: number;
    equipmentUpgrade: string[];
    budgetIncrease: number;
  };
  recommendations: string[];
}

export interface GeospatialData {
  area: string;
  lat: number;
  lng: number;
  issueCount: number;
  riskScore: number;
  category: string;
}

interface DashboardContextType {
  stats: DashboardStats;
  hotspotData: HotspotData[];
  resourceDemand: ResourceDemand[];
  slaAlerts: SLAAlert[];
  departmentPerformance: DepartmentPerformance[];
  recentActivity: ActivityItem[];
  predictiveInsights: PredictiveInsight | null;
  geospatialData: GeospatialData[];
  isLoading: boolean;
  error: string | null;
  fetchDashboardData: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  updateStats: () => Promise<void>;
  clearError: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined,
);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<DashboardStats>({
    totalActiveIssues: 0,
    slaComplianceRate: 0,
    averageResolutionTime: 0,
    citizenSatisfaction: 0,
    criticalIssuesPending: 0,
    slaBreeches: 0,
    resolvedIssuesThisMonth: 0,
    trendPercentages: {
      activeIssues: 0,
      slaCompliance: 0,
      resolutionTime: 0,
      satisfaction: 0,
    },
  });

  const [hotspotData] = useState<HotspotData[]>([]);
  const [resourceDemand] = useState<ResourceDemand[]>([]);
  const [slaAlerts] = useState<SLAAlert[]>([]);
  const [departmentPerformance] = useState<DepartmentPerformance[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [predictiveInsights, setPredictiveInsights] =
    useState<PredictiveInsight | null>(null);
  const [geospatialData, setGeospatialData] = useState<GeospatialData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data using analytics/stats endpoint
  const fetchDashboardData = useCallback(async () => {
    // Don't fetch if user is not authenticated
    if (!isAuthenticated()) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use analytics/stats endpoint for comprehensive dashboard data
      const response = await fetch("/api/analytics/stats");
      const result = await response.json();

      // Update all dashboard state
      if (result.success && result.data) {
        const apiData = result.data;
        setStats({
          totalActiveIssues: apiData.totalActiveIssues || 0,
          slaComplianceRate: apiData.slaComplianceRate || 0,
          averageResolutionTime: apiData.averageResolutionTime || 0,
          citizenSatisfaction: apiData.citizenSatisfaction || 0,
          criticalIssuesPending: apiData.criticalIssues || 0,
          slaBreeches: apiData.slaBreaches || 0,
          resolvedIssuesThisMonth: apiData.resolvedThisMonth || 0,
          trendPercentages: {
            activeIssues: apiData.issuesTrend || 0,
            slaCompliance: apiData.slaComplianceTrend || 0,
            resolutionTime: apiData.resolutionTimeTrend || 0,
            satisfaction: apiData.satisfactionTrend || 0,
          },
        });

        // Set recent activity from API
        if (apiData.recentActivity && Array.isArray(apiData.recentActivity)) {
          const mappedActivity: ActivityItem[] = apiData.recentActivity.map(
            (item: ApiActivityItem, index: number) => ({
              id: parseInt(item.id) || Date.now() + index,
              type: item.type || "info",
              message: item.message || "",
              timestamp: item.timestamp || new Date().toISOString(),
              severity:
                item.type === "resolved"
                  ? "success"
                  : item.type === "critical"
                    ? "error"
                    : item.type === "in-progress"
                      ? "warning"
                      : "info",
            }),
          );
          setRecentActivity(mappedActivity);
        }
      }

      // Fetch issues for geospatial data
      const issuesResponse = await fetch(
        "/api/issues?limit=100&sortBy=createdAt&sortOrder=desc",
      );
      const issuesResult = await issuesResponse.json();

      if (issuesResult.success && issuesResult.data?.issues) {
        const issues = issuesResult.data.issues;

        // Group issues by area/location for geospatial data
        const locationMap = new Map<
          string,
          { issues: IssueData[]; coords: { lat: number; lng: number } }
        >();

        issues.forEach((issue: IssueData) => {
          const area = issue.location || "Unknown";
          if (!locationMap.has(area)) {
            locationMap.set(area, {
              issues: [],
              coords: issue.coordinates || { lat: 15.2993, lng: 74.124 },
            });
          }
          locationMap.get(area)!.issues.push(issue);
        });

        // Convert to geospatial data format
        const geoData: GeospatialData[] = Array.from(locationMap.entries()).map(
          ([area, data]) => {
            const criticalCount = data.issues.filter(
              (i: IssueData) =>
                i.priority === "critical" || i.priority === "high",
            ).length;
            const openCount = data.issues.filter(
              (i: IssueData) => i.status === "open",
            ).length;

            // Calculate risk score based on issue count and priority
            const riskScore = Math.min(
              10,
              data.issues.length * 0.5 + criticalCount * 1.5 + openCount * 0.8,
            );

            return {
              area,
              lat: data.coords.lat,
              lng: data.coords.lng,
              issueCount: data.issues.length,
              riskScore: parseFloat(riskScore.toFixed(1)),
              category: data.issues[0]?.category || "other",
            };
          },
        );

        setGeospatialData(geoData);

        // Generate predictive insights
        const openIssues = issues.filter(
          (i: IssueData) => i.status === "open",
        ).length;
        const totalIssues = issues.length;
        const avgIssuesPerWeek =
          totalIssues > 0 ? Math.ceil(totalIssues / 4) : 5;

        // Find high-risk areas
        const highRiskAreas = geoData
          .filter((area) => area.riskScore > 7)
          .map((area) => area.area)
          .slice(0, 3);

        // Calculate resource needs
        const additionalStaff = Math.ceil(openIssues / 10);

        setPredictiveInsights({
          expectedIssues: {
            nextWeek: Math.ceil(avgIssuesPerWeek * 1.2),
            nextMonth: Math.ceil(avgIssuesPerWeek * 4.5),
            peakDays: ["Monday", "Wednesday"],
            highRiskAreas:
              highRiskAreas.length > 0 ? highRiskAreas : ["City Center"],
          },
          resourceNeeds: {
            additionalStaff,
            equipmentUpgrade:
              openIssues > 20
                ? ["GPS tracking", "Mobile units"]
                : ["Mobile units"],
            budgetIncrease: Math.ceil((openIssues / totalIssues) * 100),
          },
          recommendations: [
            highRiskAreas.length > 0
              ? `Focus resources on high-risk areas: ${highRiskAreas.join(", ")}`
              : "Continue monitoring current issue distribution",
            openIssues > 15
              ? `Allocate ${additionalStaff} additional response teams to handle open issues`
              : "Current staffing levels are adequate",
            "Implement preventive maintenance in areas with recurring issues",
          ],
        });
      } else if (result.error) {
        // API returned an error
        // Don't set error for auth failures - user will be redirected to login
        if (
          !result.error.includes("Unauthorized") &&
          !result.error.includes("Authentication required")
        ) {
          setError(result.error);
        }
        // Silently fail for auth errors since api-client handles redirect
      }

      // Note: The API client handles retries internally for 500+ errors
      // We don't need manual retry logic here
    } catch (err) {
      // Catch any thrown errors (like ApiError from api-client)
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch dashboard data";

      // Don't show error for auth failures - user will be redirected to login
      if (
        !errorMessage.includes("Unauthorized") &&
        !errorMessage.includes("Authentication required")
      ) {
        setError(errorMessage);
      }

      // Keep existing default data visible on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update stats only
  const updateStats = useCallback(async () => {
    // Don't fetch if user is not authenticated
    if (!isAuthenticated()) {
      return;
    }

    try {
      const response = await fetch("/api/analytics/stats");
      const result = await response.json();

      if (result.success && result.data) {
        const apiData = result.data;
        setStats({
          totalActiveIssues: apiData.totalActiveIssues || 0,
          slaComplianceRate: apiData.slaComplianceRate || 0,
          averageResolutionTime: apiData.averageResolutionTime || 0,
          citizenSatisfaction: apiData.citizenSatisfaction || 0,
          criticalIssuesPending: apiData.criticalIssues || 0,
          slaBreeches: apiData.slaBreaches || 0,
          resolvedIssuesThisMonth: apiData.resolvedThisMonth || 0,
          trendPercentages: {
            activeIssues: apiData.issuesTrend || 0,
            slaCompliance: apiData.slaComplianceTrend || 0,
            resolutionTime: apiData.resolutionTimeTrend || 0,
            satisfaction: apiData.satisfactionTrend || 0,
          },
        });

        // Update recent activity from API
        if (apiData.recentActivity && Array.isArray(apiData.recentActivity)) {
          const mappedActivity: ActivityItem[] = apiData.recentActivity.map(
            (item: ApiActivityItem, index: number) => ({
              id: parseInt(item.id) || Date.now() + index,
              type: item.type || "info",
              message: item.message || "",
              timestamp: item.timestamp || new Date().toISOString(),
              severity:
                item.type === "resolved"
                  ? "success"
                  : item.type === "critical"
                    ? "error"
                    : item.type === "in-progress"
                      ? "warning"
                      : "info",
            }),
          );
          setRecentActivity(mappedActivity);
        }
      }
    } catch (err) {
      // Silently fail - dashboard will show cached data
      void err;
    }
  }, []);

  // Refresh dashboard
  const refreshDashboard = useCallback(async () => {
    await fetchDashboardData();
  }, [fetchDashboardData]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch dashboard data on mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh dashboard every 5 minutes
  useEffect(() => {
    const interval = setInterval(
      () => {
        updateStats();
      },
      5 * 60 * 1000,
    ); // 5 minutes

    return () => clearInterval(interval);
  }, [updateStats]);

  const value: DashboardContextType = {
    stats,
    hotspotData,
    resourceDemand,
    slaAlerts,
    departmentPerformance,
    recentActivity,
    predictiveInsights,
    geospatialData,
    isLoading,
    error,
    fetchDashboardData,
    refreshDashboard,
    updateStats,
    clearError,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

// Custom hook to use dashboard context
export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
