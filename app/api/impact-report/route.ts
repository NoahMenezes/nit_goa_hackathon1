import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { geminiClient } from "@/lib/gemini-client";
import { WardIssue } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wardId = searchParams.get("wardId");
    const reportType = searchParams.get("type") || "monthly";

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 500 },
      );
    }

    // Fetch impact reports
    let query = supabase
      .from("impact_reports")
      .select(
        `
        *,
        wards(ward_number, ward_name)
      `,
      )
      .order("report_period_start", { ascending: false });

    if (wardId) {
      query = query.eq("ward_id", wardId);
    }

    if (reportType) {
      query = query.eq("report_type", reportType);
    }

    const { data: reports, error } = await query;

    if (error) {
      console.error("Error fetching impact reports:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch impact reports" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error("Error in impact report GET:", error);
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
    const { wardId, periodStart, periodEnd, reportType = "monthly" } = body;

    if (!wardId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 500 },
      );
    }

    // Fetch ward information
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

    // Fetch issues for the period
    const { data: issues, error: issuesError } = await supabase
      .from("issues")
      .select("*")
      .eq("ward_id", wardId)
      .gte("created_at", periodStart)
      .lte("created_at", periodEnd);

    if (issuesError) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch issues" },
        { status: 500 },
      );
    }

    // Fetch performance metrics for before and after
    const { data: beforeMetrics } = await supabase
      .from("ward_performance_metrics")
      .select("*")
      .eq("ward_id", wardId)
      .lt("metric_date", periodStart)
      .order("metric_date", { ascending: false })
      .limit(1)
      .single();

    const { data: afterMetrics } = await supabase
      .from("ward_performance_metrics")
      .select("*")
      .eq("ward_id", wardId)
      .gte("metric_date", periodEnd)
      .order("metric_date", { ascending: true })
      .limit(1)
      .single();

    // Calculate impact metrics
    const issuesAddressed = issues.filter(
      (i: WardIssue) => i.status === "resolved" || i.status === "closed",
    ).length;

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

    // Estimate citizens impacted (rough estimate: 10-50 per issue based on category)
    const citizensImpacted = issues.reduce((sum: number, issue: WardIssue) => {
      const impactMap: Record<string, number> = {
        pothole: 50,
        streetlight: 30,
        garbage: 40,
        water_leak: 35,
        road: 100,
        sanitation: 45,
        drainage: 40,
        electricity: 60,
        traffic: 150,
        other: 20,
      };
      return sum + (impactMap[issue.category] || 25);
    }, 0);

    // Estimate cost savings (based on issue type and quick resolution)
    const costSavings = resolvedIssues.reduce(
      (sum: number, issue: WardIssue) => {
        const resolutionHours =
          issue.resolved_at && issue.created_at
            ? (new Date(issue.resolved_at).getTime() -
                new Date(issue.created_at).getTime()) /
              (1000 * 60 * 60)
            : 0;

        // Quick resolution = cost savings
        const savingsMultiplier = resolutionHours < 48 ? 1.5 : 1.0;

        const baseCostSavings: Record<string, number> = {
          pothole: 500,
          streetlight: 200,
          garbage: 150,
          water_leak: 300,
          road: 1000,
          sanitation: 250,
          drainage: 400,
          electricity: 350,
          traffic: 800,
          other: 150,
        };

        return (
          sum + (baseCostSavings[issue.category] || 200) * savingsMultiplier
        );
      },
      0,
    );

    // Calculate efficiency improvement
    const efficiencyImprovement =
      beforeMetrics && afterMetrics
        ? ((afterMetrics.resolution_rate - beforeMetrics.resolution_rate) /
            beforeMetrics.resolution_rate) *
          100
        : 0;

    // Prepare data for AI analysis
    const impactData = {
      wardName: ward.ward_name,
      periodStart,
      periodEnd,
      issuesAddressed,
      citizensImpacted,
      costSavings,
      efficiencyImprovement,
      beforeMetrics: beforeMetrics
        ? {
            responseTimeHours: beforeMetrics.response_time_hours,
            resolutionRate: beforeMetrics.resolution_rate,
            citizenSatisfaction: beforeMetrics.citizen_satisfaction,
            slaComplianceRate: beforeMetrics.sla_compliance_rate,
          }
        : {},
      afterMetrics: afterMetrics
        ? {
            responseTimeHours: afterMetrics.response_time_hours,
            resolutionRate: afterMetrics.resolution_rate,
            citizenSatisfaction: afterMetrics.citizen_satisfaction,
            slaComplianceRate: afterMetrics.sla_compliance_rate,
          }
        : {},
    };

    // Generate AI impact report
    const aiReport = await geminiClient.generateImpactReport(impactData);

    // Store report in database
    const { data: savedReport, error: saveError } = await supabase
      .from("impact_reports")
      .insert({
        ward_id: wardId,
        report_period_start: periodStart,
        report_period_end: periodEnd,
        total_issues_addressed: issuesAddressed,
        citizens_impacted: citizensImpacted,
        cost_savings: costSavings,
        efficiency_improvement: efficiencyImprovement,
        key_achievements: aiReport.keyAchievements,
        challenges: aiReport.challenges,
        recommendations: aiReport.recommendations,
        ai_generated_summary: aiReport.summary,
        report_type: reportType,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving impact report:", saveError);
      // Continue even if save fails - return the generated report
    }

    return NextResponse.json({
      success: true,
      data: {
        report: savedReport || {
          ward_id: wardId,
          report_period_start: periodStart,
          report_period_end: periodEnd,
          total_issues_addressed: issuesAddressed,
          citizens_impacted: citizensImpacted,
          cost_savings: costSavings,
          efficiency_improvement: efficiencyImprovement,
          key_achievements: aiReport.keyAchievements,
          challenges: aiReport.challenges,
          recommendations: aiReport.recommendations,
          ai_generated_summary: aiReport.summary,
          report_type: reportType,
        },
        aiAnalysis: aiReport,
        metrics: {
          issuesAddressed,
          citizensImpacted,
          costSavings,
          efficiencyImprovement,
          avgResolutionTime,
          beforeMetrics: impactData.beforeMetrics,
          afterMetrics: impactData.afterMetrics,
        },
      },
    });
  } catch (error) {
    console.error("Error generating impact report:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get("id");

    if (!reportId) {
      return NextResponse.json(
        { success: false, error: "Report ID required" },
        { status: 400 },
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 500 },
      );
    }

    const { error } = await supabase
      .from("impact_reports")
      .delete()
      .eq("id", reportId);

    if (error) {
      console.error("Error deleting impact report:", error);
      return NextResponse.json(
        { success: false, error: "Failed to delete report" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Report deleted successfully",
    });
  } catch (error) {
    console.error("Error in impact report DELETE:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
