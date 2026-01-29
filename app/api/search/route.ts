import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClientByRole } from "@/lib/supabase";
import { ApiResponse } from "@/lib/types";

// GET /api/search - Search issues with full-text search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const location = searchParams.get("location");
    const wardId = searchParams.get("wardId");
    const userId = searchParams.get("userId");
    const sortBy = searchParams.get("sortBy") || "relevance"; // relevance, date, votes
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const offset = (page - 1) * pageSize;

    // Get Supabase client (public access for search)
    const supabase = getSupabaseClientByRole("citizen", false);
    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          error: "Database not configured",
        } as ApiResponse,
        { status: 500 }
      );
    }

    // Start building the query
    let baseQuery = supabase
      .from("issues")
      .select("*", { count: "exact" });

    // Apply full-text search if query is provided
    if (query && query.trim().length > 0) {
      // Use PostgreSQL full-text search
      // This searches in title, description, and location
      const searchTerm = query.trim();

      // For simple search, use ilike (case-insensitive LIKE)
      // In production, you'd want to use proper full-text search with to_tsvector
      baseQuery = baseQuery.or(
        `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`
      );
    }

    // Apply filters
    if (category) {
      baseQuery = baseQuery.eq("category", category);
    }

    if (status) {
      baseQuery = baseQuery.eq("status", status);
    }

    if (priority) {
      baseQuery = baseQuery.eq("priority", priority);
    }

    if (location) {
      baseQuery = baseQuery.ilike("location", `%${location}%`);
    }

    if (wardId) {
      baseQuery = baseQuery.eq("ward_id", wardId);
    }

    if (userId) {
      baseQuery = baseQuery.eq("user_id", userId);
    }

    // Apply sorting
    switch (sortBy) {
      case "date":
        baseQuery = baseQuery.order("created_at", { ascending: false });
        break;
      case "votes":
        baseQuery = baseQuery.order("votes", { ascending: false });
        break;
      case "priority":
        baseQuery = baseQuery.order("priority", { ascending: false });
        break;
      case "relevance":
      default:
        // For relevance, sort by created_at if we have a search query
        // In production, you'd use ts_rank for proper relevance scoring
        if (query && query.trim().length > 0) {
          baseQuery = baseQuery.order("votes", { ascending: false });
        } else {
          baseQuery = baseQuery.order("created_at", { ascending: false });
        }
        break;
    }

    // Apply pagination
    baseQuery = baseQuery.range(offset, offset + pageSize - 1);

    const { data: issues, error, count } = await baseQuery;

    if (error) {
      console.error("Error searching issues:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to search issues",
        } as ApiResponse,
        { status: 500 }
      );
    }

    // Get aggregated filter counts for faceted search
    let categoryCountsPromise = Promise.resolve({ data: [] });
    let statusCountsPromise = Promise.resolve({ data: [] });

    if (query && query.trim().length > 0) {
      // Get category breakdown
      categoryCountsPromise = supabase
        .from("issues")
        .select("category")
        .or(
          `title.ilike.%${query.trim()}%,description.ilike.%${query.trim()}%,location.ilike.%${query.trim()}%`
        );

      // Get status breakdown
      statusCountsPromise = supabase
        .from("issues")
        .select("status")
        .or(
          `title.ilike.%${query.trim()}%,description.ilike.%${query.trim()}%,location.ilike.%${query.trim()}%`
        );
    }

    const [categoryResult, statusResult] = await Promise.all([
      categoryCountsPromise,
      statusCountsPromise,
    ]);

    // Count categories and statuses
    const categoryCounts: Record<string, number> = {};
    const statusCounts: Record<string, number> = {};

    if (categoryResult.data) {
      categoryResult.data.forEach((item: any) => {
        categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
      });
    }

    if (statusResult.data) {
      statusResult.data.forEach((item: any) => {
        statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          issues: issues || [],
          total: count || 0,
          page,
          pageSize,
          totalPages: Math.ceil((count || 0) / pageSize),
          filters: {
            query,
            category,
            status,
            priority,
            location,
            wardId,
            userId,
            sortBy,
          },
          facets: {
            categories: categoryCounts,
            statuses: statusCounts,
          },
        },
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/search:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
