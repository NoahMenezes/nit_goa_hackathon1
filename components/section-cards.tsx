"use client";

import {
  IconTrendingDown,
  IconTrendingUp,
  IconAlertTriangle,
  IconCircleCheck,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { NeonGradientCard } from "@/components/magicui/neon-gradient-card";
import { useDashboard } from "@/contexts/dashboard-context";
import { Skeleton } from "@/components/ui/skeleton";

export function SectionCards() {
  const { stats, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-6 border rounded-lg">
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-8 w-24 mb-6" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <NeonGradientCard className="@container/card transition-all duration-300 ease-in-out hover:scale-[1.03] cursor-pointer">
        <div className="flex flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">
                Active Issues
              </span>
              <span className="text-3xl font-bold tracking-tight text-foreground @sm/card:text-4xl">
                {stats.totalActiveIssues}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
              >
                <IconAlertTriangle className="h-3 w-3 mr-1" />
                {stats.criticalIssuesPending} Critical
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {stats.trendPercentages.activeIssues > 0 ? (
              <>
                <IconTrendingUp className="h-4 w-4 text-red-500" />
                <span className="text-red-600 dark:text-red-400 font-medium">
                  +{stats.trendPercentages.activeIssues.toFixed(1)}%
                </span>
              </>
            ) : (
              <>
                <IconTrendingDown className="h-4 w-4 text-green-500" />
                <span className="text-green-600 dark:text-green-400 font-medium">
                  {stats.trendPercentages.activeIssues.toFixed(1)}%
                </span>
              </>
            )}
            <span className="text-muted-foreground">from last month</span>
          </div>
        </div>
      </NeonGradientCard>

      <NeonGradientCard className="@container/card transition-all duration-300 ease-in-out hover:scale-[1.03] cursor-pointer">
        <div className="flex flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">
                SLA Compliance
              </span>
              <span className="text-3xl font-bold tracking-tight text-foreground @sm/card:text-4xl">
                {stats.slaComplianceRate}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
              >
                <IconCircleCheck className="h-3 w-3 mr-1" />
                Target 85%
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {stats.trendPercentages.slaCompliance > 0 ? (
              <>
                <IconTrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-green-600 dark:text-green-400 font-medium">
                  +{stats.trendPercentages.slaCompliance.toFixed(1)}%
                </span>
              </>
            ) : (
              <>
                <IconTrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-red-600 dark:text-red-400 font-medium">
                  {stats.trendPercentages.slaCompliance.toFixed(1)}%
                </span>
              </>
            )}
            <span className="text-muted-foreground">from last month</span>
          </div>
        </div>
      </NeonGradientCard>

      <NeonGradientCard className="@container/card transition-all duration-300 ease-in-out hover:scale-[1.03] cursor-pointer">
        <div className="flex flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">
                Avg Resolution
              </span>
              <span className="text-3xl font-bold tracking-tight text-foreground @sm/card:text-4xl">
                {stats.averageResolutionTime}d
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
              >
                <IconCircleCheck className="h-3 w-3 mr-1" />
                Target 3.5d
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {stats.trendPercentages.resolutionTime < 0 ? (
              <>
                <IconTrendingDown className="h-4 w-4 text-green-500" />
                <span className="text-green-600 dark:text-green-400 font-medium">
                  {stats.trendPercentages.resolutionTime.toFixed(1)}%
                </span>
              </>
            ) : (
              <>
                <IconTrendingUp className="h-4 w-4 text-red-500" />
                <span className="text-red-600 dark:text-red-400 font-medium">
                  +{stats.trendPercentages.resolutionTime.toFixed(1)}%
                </span>
              </>
            )}
            <span className="text-muted-foreground">from last month</span>
          </div>
        </div>
      </NeonGradientCard>

      <NeonGradientCard className="@container/card transition-all duration-300 ease-in-out hover:scale-[1.03] cursor-pointer">
        <div className="flex flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">
                Satisfaction
              </span>
              <span className="text-3xl font-bold tracking-tight text-foreground @sm/card:text-4xl">
                {stats.citizenSatisfaction}/5
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
              >
                <IconCircleCheck className="h-3 w-3 mr-1" />
                {stats.resolvedIssuesThisMonth} reviews
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {stats.trendPercentages.satisfaction > 0 ? (
              <>
                <IconTrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-green-600 dark:text-green-400 font-medium">
                  +{stats.trendPercentages.satisfaction.toFixed(1)}%
                </span>
              </>
            ) : (
              <>
                <IconTrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-red-600 dark:text-red-400 font-medium">
                  {stats.trendPercentages.satisfaction.toFixed(1)}%
                </span>
              </>
            )}
            <span className="text-muted-foreground">from last month</span>
          </div>
        </div>
      </NeonGradientCard>
    </div>
  );
}
