import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClientByRole } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";
import { ApiResponse } from "@/lib/types";

// PUT /api/notifications/[id] - Mark notification as read
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

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

    // Check if notification exists and belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.userId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Notification not found",
        } as ApiResponse,
        { status: 404 }
      );
    }

    // Mark as read
    const { data, error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id)
      .eq("user_id", user.userId)
      .select()
      .single();

    if (error) {
      console.error("Error marking notification as read:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to mark notification as read",
        } as ApiResponse,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Notification marked as read",
        data: {
          notification: data,
        },
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in PUT /api/notifications/[id]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/[id] - Delete notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

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

    // Check if notification exists and belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.userId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Notification not found",
        } as ApiResponse,
        { status: 404 }
      );
    }

    // Delete notification
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("user_id", user.userId);

    if (error) {
      console.error("Error deleting notification:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to delete notification",
        } as ApiResponse,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Notification deleted successfully",
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in DELETE /api/notifications/[id]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
