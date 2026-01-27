import { NextRequest, NextResponse } from "next/server";
import { userDb, issueDb } from "@/lib/db";
import { getUserFromRequest, sanitizeUser } from "@/lib/auth";
import { ApiResponse, User } from "@/lib/types";

// GET /api/user - Get current user profile
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

    const userData = await userDb.findById(user.userId);
    if (!userData) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        } as ApiResponse,
        { status: 404 },
      );
    }

    // Get user's issues
    const userIssues = await issueDb.findByUserId(user.userId);

    // Calculate user stats
    const stats = {
      totalIssues: userIssues.length,
      openIssues: userIssues.filter((i) => i.status === "open").length,
      inProgressIssues: userIssues.filter((i) => i.status === "in-progress")
        .length,
      resolvedIssues: userIssues.filter((i) => i.status === "resolved").length,
      totalVotes: userIssues.reduce((sum, issue) => sum + issue.votes, 0),
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          user: sanitizeUser(userData),
          stats,
        },
      } as ApiResponse,
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch user profile",
      } as ApiResponse,
      { status: 500 },
    );
  }
}

// PUT /api/user - Update user profile
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { name, avatar } = body;

    // Validation
    if (name && name.trim().length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: "Name must be at least 2 characters long",
        } as ApiResponse,
        { status: 400 },
      );
    }

    // Update user
    const updates: Partial<User> = {};
    if (name) updates.name = name.trim();
    if (avatar !== undefined) updates.avatar = avatar;

    const updatedUser = await userDb.update(user.userId, updates);

    if (!updatedUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update user profile",
        } as ApiResponse,
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully",
        data: sanitizeUser(updatedUser),
      } as ApiResponse,
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update user profile",
      } as ApiResponse,
      { status: 500 },
    );
  }
}

// DELETE /api/user - Delete user account
export async function DELETE(request: NextRequest) {
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

    // Delete all user's issues
    const userIssues = await issueDb.findByUserId(user.userId);
    for (const issue of userIssues) {
      await issueDb.delete(issue.id);
    }

    // Delete user
    const deleted = await userDb.delete(user.userId);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to delete user account",
        } as ApiResponse,
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Account deleted successfully",
      } as ApiResponse,
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting user account:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete user account",
      } as ApiResponse,
      { status: 500 },
    );
  }
}
