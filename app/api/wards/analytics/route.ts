import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { geminiClient } from "@/lib/gemini-client";
import { WardWithMetrics, WardIssue } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wardId = searchParams.get("wardId");
    const analyze = searchParams.get("analyze") === "true";

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 500 },
      );
    }

    // Fetch ward data with statistics
    let query = supabase
      .from("wards")
      .select(
        `
        *,
        ward_analytics(*),
        ward_performance_metrics(*)
      `,
      )
      .order("ward_number");

    if (wardId) {
      query = query.eq("id", wardId);
    }

    const { data: wards, error: wardsError } = await query;

    if (wardsError) {
      console.error("Error fetching wards:", wardsError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch ward data" },
        { status: 500 },
      );
    }

    // Fetch issues grouped by ward
    const { data: issues, error: issuesError } = await supabase
      .from("issues")
      .select("*");

    if (issuesError) {
      console.error("Error fetching issues:", issuesError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch issues" },
        { status: 500 },
      );
    }

    // Process ward analytics
    const wardAnalytics = await Promise.all(
      wards.map(async (ward: WardWithMetrics) => {
        const wardIssues = issues.filter(
          (i: WardIssue) => i.ward_id === ward.id,
        );

        const categoryBreakdown: Record<string, number> = {};
        const priorityBreakdown: Record<string, number> = {};

        wardIssues.forEach((issue: WardIssue) => {
          categoryBreakdown[issue.category] =
            (categoryBreakdown[issue.category] || 0) + 1;
          priorityBreakdown[issue.priority] =
            (priorityBreakdown[issue.priority] || 0) + 1;
        });

        const now = new Date();
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const resolvedIssues = wardIssues.filter(
          (i: WardIssue) => i.status === "resolved",
        );
        const avgResolutionTime =
          resolvedIssues.length > 0
            ? resolvedIssues.reduce((sum: number, issue: WardIssue) => {
                if (issue.resolved_at && issue.created_at) {
                  const diff =
                    new Date(issue.resolved_at).getTime() -
                    new Date(issue.created_at).getTime();
                  return sum + diff / (1000 * 60 * 60); // Convert to hours
                }
                return sum;
              }, 0) / resolvedIssues.length
            : 0;

        const analytics = {
          wardId: ward.id,
          wardName: ward.ward_name,
          wardNumber: ward.ward_number,
          totalIssues: wardIssues.length,
          openIssues: wardIssues.filter((i) => i.status === "open").length,
          inProgressIssues: wardIssues.filter((i) => i.status === "in-progress")
            .length,
          resolvedIssues: resolvedIssues.length,
          criticalIssues: wardIssues.filter((i) => i.priority === "critical")
            .length,
          avgResolutionHours: avgResolutionTime,
          categoryBreakdown,
          priorityBreakdown,
          issuesLastWeek: wardIssues.filter(
            (i) => new Date(i.created_at) >= lastWeek,
          ).length,
          issuesLastMonth: wardIssues.filter(
            (i) => new Date(i.created_at) >= lastMonth,
          ).length,
          population: ward.population,
          metrics: ward.ward_performance_metrics?.[0]
            ? {
                responseTimeHours:
                  ward.ward_performance_metrics[0].response_time_hours,
                resolutionRate:
                  (ward.ward_performance_metrics[0].resolved_issues /
                    ward.ward_performance_metrics[0].total_issues) *
                  100,
                citizenSatisfaction:
                  ward.ward_performance_metrics[0].citizen_satisfaction_score,
                slaComplianceRate: 85,
                resourceUtilization: 80,
                budgetSpent: 50000,
                allocatedBudget: 75000,
              }
            : {
                responseTimeHours: 12,
                resolutionRate: 75,
                citizenSatisfaction: 4.2,
                slaComplianceRate: 85,
                resourceUtilization: 80,
                budgetSpent: 50000,
                allocatedBudget: 75000,
              },
        };

        // If analyze flag is true, use Gemini AI for insights
        let aiInsights = null;
        if (analyze) {
          try {
            aiInsights = await geminiClient.analyzeWardPerformance(
              {
                wardName: analytics.wardName,
                wardNumber: String(analytics.wardNumber),
                totalIssues: analytics.totalIssues,
                openIssues: analytics.openIssues,
                resolvedIssues: analytics.resolvedIssues,
                inProgressIssues: analytics.inProgressIssues,
                criticalIssues: analytics.criticalIssues,
                avgResolutionHours: analytics.avgResolutionHours,
                categoryBreakdown: analytics.categoryBreakdown,
                priorityBreakdown: analytics.priorityBreakdown,
                issuesLastWeek: analytics.issuesLastWeek,
                issuesLastMonth: analytics.issuesLastMonth,
                population: analytics.population,
              },
              analytics.metrics,
            );
          } catch (error) {
            console.error("Error generating AI insights:", error);
          }
        }

        return {
          ...analytics,
          aiInsights,
        };
      }),
    );

    return NextResponse.json({
      success: true,
      data: wardAnalytics,
    });
  } catch (error) {
    console.error("Error in ward analytics:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wardId } = body;

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 500 },
      );
    }

    // Fetch ward data
    const { data: ward, error: wardError } = await supabase
      .from("wards")
      .select("*")
      .eq("id", wardId)
      .single();

    if (wardError || !ward) {
      return NextResponse.json(
        { success: false, error: "Ward not found" },
        { status: 404 },
      );
    }

    // Fetch issues for this ward
    const { data: issues, error: issuesError } = await supabase
      .from("issues")
      .select("*")
      .eq("ward_id", wardId);

    if (issuesError) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch issues" },
        { status: 500 },
      );
    }

    // Calculate analytics
    const categoryBreakdown: Record<string, number> = {};
    const priorityBreakdown: Record<string, number> = {};

    issues.forEach((issue: WardIssue) => {
      categoryBreakdown[issue.category] =
        (categoryBreakdown[issue.category] || 0) + 1;
      priorityBreakdown[issue.priority] =
        (priorityBreakdown[issue.priority] || 0) + 1;
    });

    const resolvedIssues = issues.filter(
      (i: WardIssue) => i.status === "resolved",
    );
    const avgResolutionTime =
      resolvedIssues.length > 0
        ? resolvedIssues.reduce((sum: number, issue: WardIssue) => {
            if (issue.resolved_at && issue.created_at) {
              const diff =
                new Date(issue.resolved_at).getTime() -
                new Date(issue.created_at).getTime();
              return sum + diff / (1000 * 60 * 60);
            }
            return sum;
          }, 0) / resolvedIssues.length
        : 0;

    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const wardData = {
      wardName: ward.ward_name,
      wardNumber: ward.ward_number,
      totalIssues: issues.length,
      openIssues: issues.filter((i: WardIssue) => i.status === "open").length,
      inProgressIssues: issues.filter(
        (i: WardIssue) => i.status === "in-progress",
      ).length,
      resolvedIssues: resolvedIssues.length,
      criticalIssues: issues.filter((i: WardIssue) => i.priority === "critical")
        .length,
      avgResolutionHours: avgResolutionTime,
      categoryBreakdown,
      priorityBreakdown,
      issuesLastWeek: issues.filter(
        (i: WardIssue) => new Date(i.created_at) >= lastWeek,
      ).length,
      issuesLastMonth: issues.filter(
        (i: WardIssue) => new Date(i.created_at) >= lastMonth,
      ).length,
      population: ward.population,
    };

    // Fetch latest performance metrics
    const { data: metrics } = await supabase
      .from("ward_performance_metrics")
      .select("*")
      .eq("ward_id", wardId)
      .order("metric_date", { ascending: false })
      .limit(1);

    const performanceMetrics = metrics?.[0]
      ? {
          responseTimeHours: metrics[0].response_time_hours,
          resolutionRate:
            (metrics[0].resolved_issues / metrics[0].total_issues) * 100,
          citizenSatisfaction: metrics[0].citizen_satisfaction_score,
          slaComplianceRate: 85,
          resourceUtilization: 80,
          budgetSpent: 50000,
          allocatedBudget: 75000,
        }
      : {
          responseTimeHours: 12,
          resolutionRate: 75,
          citizenSatisfaction: 4.2,
          slaComplianceRate: 85,
          resourceUtilization: 80,
          budgetSpent: 50000,
          allocatedBudget: 75000,
        };

    // Generate AI insights
    const aiInsights = await geminiClient.analyzeWardPerformance(
      wardData,
      performanceMetrics,
    );

    // Store analytics in database
    const { error: insertError } = await supabase
      .from("ward_analytics")
      .upsert({
        ward_id: wardId,
        analysis_date: new Date().toISOString().split("T")[0],
        total_issues: wardData.totalIssues,
        open_issues: wardData.openIssues,
        resolved_issues: wardData.resolvedIssues,
        avg_resolution_time_hours: wardData.avgResolutionHours,
        category_breakdown: categoryBreakdown,
        priority_breakdown: priorityBreakdown,
        performance_score: aiInsights.performanceScore,
        trend_analysis: {
          direction: aiInsights.trendAnalysis.direction,
          keyFactors: aiInsights.trendAnalysis.keyFactors,
        },
        ai_insights: aiInsights.insights,
        ai_recommendations: aiInsights.recommendations,
      });

    if (insertError) {
      console.error("Error storing analytics:", insertError);
    }

    return NextResponse.json({
      success: true,
      data: {
        ward: wardData,
        metrics: performanceMetrics,
        aiInsights,
      },
    });
  } catch (error) {
    console.error("Error generating ward analysis:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
