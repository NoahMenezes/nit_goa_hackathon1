import { NextRequest, NextResponse } from "next/server";
import { voteDb, issueDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { ApiResponse } from "@/lib/types";

// POST /api/issues/[id]/vote - Toggle vote for an issue
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Please login to vote",
        } as ApiResponse,
        { status: 401 },
      );
    }

    const { id } = await params;

    // Check if issue exists
    const issue = await issueDb.findById(id);
    if (!issue) {
      return NextResponse.json(
        {
          success: false,
          error: "Issue not found",
        } as ApiResponse,
        { status: 404 },
      );
    }

    // Check if user already voted
    const existingVote = await voteDb.findByUserAndIssue(user.userId, id);

    if (existingVote) {
      // User already voted - remove vote (downvote/unvote)
      await voteDb.delete(existingVote.id);
      await issueDb.decrementVotes(id);

      const updatedIssue = await issueDb.findById(id);

      return NextResponse.json(
        {
          success: true,
          message: "Vote removed",
          data: {
            voted: false,
            votes: updatedIssue?.votes || 0,
          },
        } as ApiResponse,
        { status: 200 },
      );
    } else {
      // User hasn't voted - add vote (upvote)
      await voteDb.create({
        issueId: id,
        userId: user.userId,
      });
      await issueDb.incrementVotes(id);

      const updatedIssue = await issueDb.findById(id);

      return NextResponse.json(
        {
          success: true,
          message: "Vote added",
          data: {
            voted: true,
            votes: updatedIssue?.votes || 0,
          },
        } as ApiResponse,
        { status: 200 },
      );
    }
  } catch (error) {
    console.error("Error toggling vote:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to toggle vote",
      } as ApiResponse,
      { status: 500 },
    );
  }
}

// GET /api/issues/[id]/vote - Check if user has voted for an issue
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        {
          success: true,
          data: {
            voted: false,
          },
        } as ApiResponse,
        { status: 200 },
      );
    }

    const { id } = await params;

    // Check if issue exists
    const issue = await issueDb.findById(id);
    if (!issue) {
      return NextResponse.json(
        {
          success: false,
          error: "Issue not found",
        } as ApiResponse,
        { status: 404 },
      );
    }

    // Check if user has voted
    const existingVote = await voteDb.findByUserAndIssue(user.userId, id);

    return NextResponse.json(
      {
        success: true,
        data: {
          voted: !!existingVote,
          votes: issue.votes,
        },
      } as ApiResponse,
      { status: 200 },
    );
  } catch (error) {
    console.error("Error checking vote:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check vote status",
      } as ApiResponse,
      { status: 500 },
    );
  }
}
