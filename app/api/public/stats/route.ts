import { NextRequest, NextResponse } from "next/server";
import { issueDb, userDb } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { generatePublicStats } from "@/lib/analytics";

// GET /api/public/stats - Get public transparency statistics (no auth required)
export async function GET() {
  try {
    // Get all issues
    const allIssues = await issueDb.getAll();

    // Get user count
    const allUsers = await userDb.getAll();
    const userCount = allUsers.length;

    // Generate public statistics (anonymized)
    const stats = generatePublicStats(allIssues, userCount);

    return NextResponse.json(
      {
        success: true,
        data: stats,
      } as ApiResponse,
      {
        status: 200,
        headers: {
          // Enable CORS for public endpoint
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          // Cache for 5 minutes
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching public stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch public statistics",
      } as ApiResponse,
      { status: 500 },
    );
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
