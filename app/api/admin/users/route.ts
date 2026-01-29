import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClientByRole } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";
import { ApiResponse } from "@/lib/types";

// Helper to check if user is admin
function requireAdmin(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) {
    return {
      authorized: false,
      error: "Unauthorized - Please login",
      status: 401,
    };
  }
  if (user.role !== "admin") {
    return {
      authorized: false,
      error: "Forbidden - Admin access required",
      status: 403,
    };
  }
  return { authorized: true, user };
}

// GET /api/admin/users - Get all users with filters, search, and pagination
export async function GET(request: NextRequest) {
  try {
    const authCheck = requireAdmin(request);
    if (!authCheck.authorized) {
      return NextResponse.json(
        { success: false, error: authCheck.error } as ApiResponse,
        { status: authCheck.status },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const offset = (page - 1) * pageSize;

    const supabase = getSupabaseClientByRole("admin", true);
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Database not configured" } as ApiResponse,
        { status: 500 },
      );
    }

    // Build query
    let query = supabase.from("users").select(
      `
        id,
        name,
        email,
        role,
        status,
        avatar,
        banned_until,
        ban_reason,
        last_login_at,
        created_at,
        updated_at
      `,
      { count: "exact" },
    );

    // Apply filters
    if (role) {
      query = query.eq("role", role);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (search && search.trim().length > 0) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // Apply pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data: users, error, count } = await query;

    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch users" } as ApiResponse,
        { status: 500 },
      );
    }

    // Get activity stats for each user
    const usersWithStats = await Promise.all(
      (users || []).map(async (user) => {
        const { data: issuesData } = await supabase
          .from("issues")
          .select("id, status", { count: "exact", head: true })
          .eq("user_id", user.id);

        const { data: commentsData } = await supabase
          .from("comments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);

        const { data: votesData } = await supabase
          .from("votes")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);

        return {
          ...user,
          activity: {
            issuesReported: issuesData?.length || 0,
            commentsPosted: commentsData?.length || 0,
            votesGiven: votesData?.length || 0,
          },
        };
      }),
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          users: usersWithStats,
          total: count || 0,
          page,
          pageSize,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
      } as ApiResponse,
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in GET /api/admin/users:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" } as ApiResponse,
      { status: 500 },
    );
  }
}

// PUT /api/admin/users - Update user (role, status, etc.)
export async function PUT(request: NextRequest) {
  try {
    const authCheck = requireAdmin(request);
    if (!authCheck.authorized) {
      return NextResponse.json(
        { success: false, error: authCheck.error } as ApiResponse,
        { status: authCheck.status },
      );
    }

    const body = await request.json();
    const { userId, role, status, notes } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" } as ApiResponse,
        { status: 400 },
      );
    }

    // Validate role
    if (role && !["citizen", "admin", "authority"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role" } as ApiResponse,
        { status: 400 },
      );
    }

    // Validate status
    if (
      status &&
      !["active", "suspended", "banned", "deleted"].includes(status)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid status" } as ApiResponse,
        { status: 400 },
      );
    }

    const supabase = getSupabaseClientByRole("admin", true);
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Database not configured" } as ApiResponse,
        { status: 500 },
      );
    }

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (fetchError || !existingUser) {
      return NextResponse.json(
        { success: false, error: "User not found" } as ApiResponse,
        { status: 404 },
      );
    }

    // Prevent self-modification of critical fields
    if (authCheck.user?.userId === userId) {
      if (status && status !== "active") {
        return NextResponse.json(
          {
            success: false,
            error: "Cannot suspend/ban yourself",
          } as ApiResponse,
          { status: 400 },
        );
      }
      if (role && role !== existingUser.role) {
        return NextResponse.json(
          {
            success: false,
            error: "Cannot change your own role",
          } as ApiResponse,
          { status: 400 },
        );
      }
    }

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (role) updates.role = role;
    if (status) updates.status = status;

    // Update user
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating user:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update user" } as ApiResponse,
        { status: 500 },
      );
    }

    // Log audit trail
    await supabase.from("audit_logs").insert({
      user_id: authCheck.user?.userId,
      action: "user_updated",
      resource_type: "user",
      resource_id: userId,
      changes: updates,
      metadata: { notes },
    });

    return NextResponse.json(
      {
        success: true,
        message: "User updated successfully",
        data: { user: updatedUser },
      } as ApiResponse,
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in PUT /api/admin/users:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" } as ApiResponse,
      { status: 500 },
    );
  }
}

// DELETE /api/admin/users - Delete user
export async function DELETE(request: NextRequest) {
  try {
    const authCheck = requireAdmin(request);
    if (!authCheck.authorized) {
      return NextResponse.json(
        { success: false, error: authCheck.error } as ApiResponse,
        { status: authCheck.status },
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" } as ApiResponse,
        { status: 400 },
      );
    }

    // Prevent self-deletion
    if (authCheck.user?.userId === userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete your own account",
        } as ApiResponse,
        { status: 400 },
      );
    }

    const supabase = getSupabaseClientByRole("admin", true);
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Database not configured" } as ApiResponse,
        { status: 500 },
      );
    }

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("id", userId)
      .single();

    if (fetchError || !existingUser) {
      return NextResponse.json(
        { success: false, error: "User not found" } as ApiResponse,
        { status: 404 },
      );
    }

    // Soft delete - set status to deleted
    const { error: deleteError } = await supabase
      .from("users")
      .update({
        status: "deleted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return NextResponse.json(
        { success: false, error: "Failed to delete user" } as ApiResponse,
        { status: 500 },
      );
    }

    // Log audit trail
    await supabase.from("audit_logs").insert({
      user_id: authCheck.user?.userId,
      action: "user_deleted",
      resource_type: "user",
      resource_id: userId,
      metadata: {
        deleted_user_email: existingUser.email,
        deleted_user_name: existingUser.name,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "User deleted successfully",
      } as ApiResponse,
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in DELETE /api/admin/users:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" } as ApiResponse,
      { status: 500 },
    );
  }
}
