import { NextRequest, NextResponse } from "next/server";
import { issueDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { ApiResponse, WARDS } from "@/lib/types";
import { generateImpactReport } from "@/lib/analytics";

// GET /api/analytics/impact-report - Get comprehensive impact report
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Please login",
        } as ApiResponse,
        { status: 401 },
      );
    }

    // Only admins and authorities can access detailed analytics
    if (user.role !== "admin" && user.role !== "authority") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden - Admin or authority access required",
        } as ApiResponse,
        { status: 403 },
      );
    }

    // Get query parameters for date range
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let dateRange: { start: string; end: string } | undefined;
    if (startDate && endDate) {
      dateRange = { start: startDate, end: endDate };
    }

    // Get all issues
    const allIssues = await issueDb.getAll();

    // Generate comprehensive impact report
    const report = generateImpactReport(
      allIssues,
      Array.from(WARDS),
      dateRange,
    );

    return NextResponse.json(
      {
        success: true,
        data: report,
      } as ApiResponse,
      { status: 200 },
    );
  } catch (error) {
    console.error("Error generating impact report:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate impact report",
      } as ApiResponse,
      { status: 500 },
    );
  }
}
