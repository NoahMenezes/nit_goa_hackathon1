// Admin Users Management API
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { userDb } from "@/lib/db";

// GET /api/admin/users - Get all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.error?.includes("Forbidden") ? 403 : 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    let users = await userDb.getAll();

    // Filter by role if specified
    if (role) {
      users = users.filter((user) => user.role === role);
    }

    // Remove passwords from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const sanitizedUsers = users.map(({ password, ...sanitizedUser }) => {
      return sanitizedUser;
    });

    return NextResponse.json({
      success: true,
      data: sanitizedUsers,
    });
  } catch (error) {
    console.error("Admin get users error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

// PATCH /api/admin/users - Update user role (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.error?.includes("Forbidden") ? 403 : 401 },
      );
    }

    const body = await request.json();
    const { userId, role } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 },
      );
    }

    if (!role || !["citizen", "admin", "authority"].includes(role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid role is required (citizen, admin, authority)",
        },
        { status: 400 },
      );
    }

    const user = await userDb.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const updated = await userDb.update(userId, { role });
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Failed to update user" },
        { status: 500 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...sanitizedUser } = updated;

    return NextResponse.json({
      success: true,
      data: sanitizedUser,
      message: "User role updated successfully",
    });
  } catch (error) {
    console.error("Admin update user error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/users - Delete user (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.error?.includes("Forbidden") ? 403 : 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 },
      );
    }

    const user = await userDb.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Prevent deleting yourself
    if (authResult.user?.userId === userId) {
      return NextResponse.json(
        { success: false, error: "Cannot delete your own account" },
        { status: 400 },
      );
    }

    const deleted = await userDb.delete(userId);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Failed to delete user" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Admin delete user error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete user" },
      { status: 500 },
    );
  }
}
