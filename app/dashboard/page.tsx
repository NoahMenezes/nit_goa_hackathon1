"use client";

import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { SectionCards } from "@/components/section-cards";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  TrendingUp,
  AlertTriangle,
  Activity,
  MapPin,
  Users,
  Clock,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useEffect, useRef } from "react";
import { NeonGradientCard } from "@/components/magicui/neon-gradient-card";
import { RotatingText } from "@/components/magicui/rotating-text";
import { useDashboard } from "@/contexts/dashboard-context";
import { Button } from "@/components/ui/button";
import { BasicMapExample } from "@/components/my-map";
import { ProtectedRoute } from "@/components/protected-route";
import GradientBlinds from "@/components/ui/gradient-blinds";

export default function Page() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const {
    stats,
    recentActivity,
    predictiveInsights,
    geospatialData,
    isLoading,
    refreshDashboard,
  } = useDashboard();
  const gradientBlindsContainerRef = useRef<HTMLDivElement>(null);

  // Removed SLA alerts notification logic as SLA feature is not implemented
  useEffect(() => {
    if (stats.criticalIssuesPending > 0) {
      const timer = setTimeout(() => {
        if (stats.criticalIssuesPending > 0) {
          toast.error("Critical Issues Alert!", {
            description: `${stats.criticalIssuesPending} critical issue(s) pending attention`,
            action: {
              label: "View Dashboard",
              onClick: () => console.log("View critical issues"),
            },
          });
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [stats.criticalIssuesPending]);

  return (
    <div
      className="flex flex-col min-h-screen relative overflow-hidden"
      onMouseMove={(e) => {
        // Forward mouse events to GradientBlinds even when over content
        if (gradientBlindsContainerRef.current) {
          const container = gradientBlindsContainerRef.current;
          const canvas = container.querySelector("canvas");
          if (canvas) {
            const event = new PointerEvent("pointermove", {
              clientX: e.clientX,
              clientY: e.clientY,
              bubbles: true,
            });
            canvas.dispatchEvent(event);
          }
        }
      }}
    >
      {/* Gradient Blinds Background */}
      <div
        ref={gradientBlindsContainerRef}
        className="fixed inset-0 w-full h-full z-0 pointer-events-none"
      >
        <GradientBlinds
          gradientColors={["#FF00FF", "#00FFFF", "#FF0080", "#8000FF"]}
          angle={0}
          noise={0.4}
          blindCount={12}
          blindMinWidth={50}
          spotlightRadius={0.9}
          spotlightSoftness={0.5}
          spotlightOpacity={2.5}
          mouseDampening={0.08}
          distortAmount={0}
          shineDirection="left"
          mixBlendMode="screen"
        />
      </div>

      {/* Glassmorphism overlay for readability */}
      <div className="fixed inset-0 w-full h-full z-1 bg-linear-to-br from-white/40 via-white/30 to-white/50 dark:from-black/40 dark:via-black/30 dark:to-black/50 backdrop-blur-md pointer-events-none" />

      <div className="flex flex-1 flex-col relative z-10">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {/* Dashboard Header */}
            <div className="px-4 lg:px-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    <RotatingText text="OurStreet - Issue Tracking Dashboard" />
                  </h1>
                  <p className="text-muted-foreground">
                    Real-time civic issue reporting, tracking, and resolution
                    management for urban communities
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"
                  >
                    <Activity className="h-3 w-3 mr-1" />
                    {isLoading ? "Updating..." : "System Active"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300"
                  >
                    <Bell className="h-3 w-3 mr-1" />
                    {stats.criticalIssuesPending} Critical Issues
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshDashboard}
                    disabled={isLoading}
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </Button>
                </div>
              </div>
            </div>

            {/* Key Performance Metrics */}
            <SectionCards />

            {/* Hotspot Trend Projection & Resource Demand Charts */}
            <div className="px-4 lg:px-6">
              <div className="mb-4">
                <h2 className="text-2xl font-bold tracking-tight mb-2">
                  Hotspot Trend Projection & Resource Demand
                </h2>
                <p className="text-muted-foreground">
                  AI-powered predictions for issue hotspots and resource
                  allocation optimization
                </p>
              </div>
              <ChartAreaInteractive />
            </div>

            {/* Additional Insights Grid */}
            <div className="px-4 lg:px-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Real-time Activity Feed */}
                <NeonGradientCard className="transition-all duration-300 ease-in-out hover:scale-[1.03] cursor-pointer">
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-2 text-lg font-semibold text-black dark:text-white">
                      <Activity className="h-5 w-5 text-blue-500" />
                      Recent Activity
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 text-sm">
                      Latest system updates and resolved issues
                    </div>
                    <div className="space-y-3 text-black dark:text-white">
                      {recentActivity.slice(0, 5).map((activity, index) => {
                        const severityColors = {
                          success: "bg-green-500",
                          warning: "bg-yellow-500",
                          error: "bg-red-500",
                          info: "bg-blue-500",
                        };
                        const severityIcons = {
                          success: <MapPin className="h-3 w-3" />,
                          warning: <Clock className="h-3 w-3" />,
                          error: <AlertTriangle className="h-3 w-3" />,
                          info: <Users className="h-3 w-3" />,
                        };
                        return (
                          <div
                            key={`${activity.id}-${index}`}
                            className="flex items-start gap-3"
                          >
                            <div
                              className={`w-2 h-2 ${severityColors[activity.severity as keyof typeof severityColors] || "bg-gray-500"} rounded-full mt-2`}
                            ></div>
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-medium">
                                {activity.message}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                {
                                  severityIcons[
                                    activity.severity as keyof typeof severityIcons
                                  ]
                                }
                                {new Date(activity.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </NeonGradientCard>

                {/* Predictive Insights */}
                <NeonGradientCard className="transition-all duration-300 ease-in-out hover:scale-[1.03] cursor-pointer">
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-2 text-lg font-semibold text-black dark:text-white">
                      <TrendingUp className="h-5 w-5 text-purple-500" />
                      Predictive Insights
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 text-sm">
                      AI-powered recommendations and forecasts
                    </div>
                    <div className="space-y-4">
                      {predictiveInsights && (
                        <>
                          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                            <h4 className="font-medium text-sm mb-1 text-black dark:text-white">
                              Hotspot Prediction
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {predictiveInsights.expectedIssues.nextWeek} new
                              civic issues predicted for next week
                            </p>
                          </div>
                          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                            <h4 className="font-medium text-sm mb-1 text-black dark:text-white">
                              Resource Allocation
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              Deploy{" "}
                              {predictiveInsights.resourceNeeds.additionalStaff}{" "}
                              additional teams based on demand forecast
                            </p>
                          </div>
                          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                            <h4 className="font-medium text-sm mb-1 text-black dark:text-white">
                              Peak Days
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {predictiveInsights.expectedIssues.peakDays.join(
                                " & ",
                              )}{" "}
                              show higher citizen reports
                            </p>
                          </div>
                          {predictiveInsights.recommendations[0] && (
                            <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                              <h4 className="font-medium text-sm mb-1 text-black dark:text-white">
                                Top Recommendation
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {predictiveInsights.recommendations[0]}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </NeonGradientCard>

                {/* Community Impact Assessment */}
                <NeonGradientCard className="transition-all duration-300 ease-in-out hover:scale-[1.03] cursor-pointer">
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-2 text-lg font-semibold text-black dark:text-white">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      Community Impact Assessment
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 text-sm">
                      High-impact areas requiring urgent civic attention
                    </div>
                    <div className="space-y-3 text-black dark:text-white">
                      {geospatialData
                        .sort((a, b) => b.riskScore - a.riskScore)
                        .slice(0, 4)
                        .map((area) => {
                          const riskLevel =
                            area.riskScore > 7.5
                              ? {
                                  label: "High Risk",
                                  className:
                                    "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200",
                                }
                              : area.riskScore > 6
                                ? {
                                    label: "Medium Risk",
                                    className:
                                      "bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200",
                                  }
                                : {
                                    label: "Low Risk",
                                    className:
                                      "bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200",
                                  };
                          return (
                            <div
                              key={area.area}
                              className="flex items-center justify-between"
                            >
                              <div>
                                <p className="font-medium text-sm text-black dark:text-white">
                                  {area.area}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {area.issueCount} active issues
                                </p>
                              </div>
                              <Badge className={riskLevel.className}>
                                {riskLevel.label}
                              </Badge>
                            </div>
                          );
                        })}
                      {predictiveInsights &&
                        predictiveInsights.recommendations.length > 1 && (
                          <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                            <p className="text-xs font-medium text-orange-800 dark:text-orange-200">
                              {predictiveInsights.recommendations[1] ||
                                "Increase municipal response teams in high-impact areas"}
                            </p>
                          </div>
                        )}
                    </div>
                  </div>
                </NeonGradientCard>
              </div>
            </div>
          </div>

          {/* Map Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <div className="lg:col-span-2">
              <NeonGradientCard className="max-w-full p-6" borderSize={0.5}>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Interactive Map View
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Explore civic issues on an interactive map with real-time
                    data
                  </p>
                </div>
                <BasicMapExample />
              </NeonGradientCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
