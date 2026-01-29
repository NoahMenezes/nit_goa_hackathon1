import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClientByRole } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";
import { ApiResponse } from "@/lib/types";

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Please login to view notifications",
        } as ApiResponse,
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const unreadOnly = searchParams.get("unread") === "true";
    const type = searchParams.get("type");

    const offset = (page - 1) * pageSize;

    // Get Supabase client based on user role
    const supabase = getSupabaseClientByRole(user.role, false);
    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          error: "Database not configured",
        } as ApiResponse,
        { status: 500 }
      );
    }

    // Build query
    let query = supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", user.userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    // Apply filters
    if (unreadOnly) {
      query = query.eq("read", false);
    }

    if (type) {
      query = query.eq("type", type);
    }

    const { data: notifications, error, count } = await query;

    if (error) {
      console.error("Error fetching notifications:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch notifications",
        } as ApiResponse,
        { status: 500 }
      );
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.userId)
      .eq("read", false);

    return NextResponse.json(
      {
        success: true,
        data: {
          notifications: notifications || [],
          total: count || 0,
          unreadCount: unreadCount || 0,
          page,
          pageSize,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/notifications:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}

// POST /api/notifications/mark-all-read - Mark all notifications as read
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Please login",
        } as ApiResponse,
        { status: 401 }
      );
    }

    const supabase = getSupabaseClientByRole(user.role, false);
    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          error: "Database not configured",
        } as ApiResponse,
        { status: 500 }
      );
    }

    const body = await request.json();
    const action = body.action;

    if (action === "mark_all_read") {
      // Mark all unread notifications as read
      const { error, count } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.userId)
        .eq("read", false)
        .select("*", { count: "exact", head: true });

      if (error) {
        console.error("Error marking notifications as read:", error);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to mark notifications as read",
          } as ApiResponse,
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "All notifications marked as read",
          data: {
            markedCount: count || 0,
          },
        } as ApiResponse,
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid action",
      } as ApiResponse,
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in POST /api/notifications:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
