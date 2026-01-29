import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { userDb, generateId, issueDb } from "@/lib/db";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

interface AdminResponse {
  id: string;
  recipientEmail: string;
  response: string;
  adminName: string;
  adminId: string;
  createdAt: string;
  status: string;
  type: string;
}

// In-memory storage for admin responses (will be lost on server restart)
// In production, this should be stored in a database
const adminResponses: AdminResponse[] = [];

export async function POST(request: NextRequest) {
  try {
    // Get authorization token
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - No token provided" },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7);

    // Verify token and check admin role
    let decoded: JWTPayload;
    try {
      decoded = verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Invalid token" },
        { status: 401 },
      );
    }

    if (decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Forbidden - Admin access required" },
        { status: 403 },
      );
    }

    // Parse request body
    const body = await request.json();
    const { email, response, adminName } = body;

    // Validate input
    if (!email || !response) {
      return NextResponse.json(
        { success: false, message: "Email and response are required" },
        { status: 400 },
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email format" },
        { status: 400 },
      );
    }

    // Find the user by email
    const allUsers = await userDb.getAll();
    const targetUser = allUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim(),
    );

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: "User not found with provided email" },
        { status: 404 },
      );
    }

    // Get all issues from the user
    const allIssues = await issueDb.getAll();
    const userIssues = allIssues
      .filter((issue) => issue.userId === targetUser.id)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    if (userIssues.length === 0) {
      return NextResponse.json(
        { success: false, message: "No issues found for this user" },
        { status: 404 },
      );
    }

    // Get the most recent issue
    const mostRecentIssue = userIssues[0];

    // Add admin response as a comment to the issue
    const comment = {
      id: generateId(),
      issueId: mostRecentIssue.id,
      userId: decoded.userId,
      userName: `${adminName || "Admin"} (Admin Response)`,
      content: response.trim(),
      createdAt: new Date().toISOString(),
    };

    mostRecentIssue.comments.push(comment);
    await issueDb.update(mostRecentIssue.id, mostRecentIssue);

    // Create a response record for tracking
    const responseDocument: AdminResponse = {
      id: generateId(),
      recipientEmail: email.toLowerCase().trim(),
      response: response.trim(),
      adminName: adminName || "Admin",
      adminId: decoded.userId,
      createdAt: new Date().toISOString(),
      status: "sent",
      type: "voice-agent-response",
    };

    // Store the response
    adminResponses.push(responseDocument);

    console.log(
      `Admin response added as comment to issue ${mostRecentIssue.id} for user ${targetUser.email}`,
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "Response sent successfully and added to user's most recent issue",
        data: {
          responseId: responseDocument.id,
          recipientEmail: email.toLowerCase().trim(),
          issueId: mostRecentIssue.id,
          issueTitle: mostRecentIssue.title,
          sentAt: responseDocument.createdAt,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("Error sending admin response:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// GET endpoint to retrieve all admin responses (for admin view) or user-specific responses
export async function GET(request: NextRequest) {
  try {
    // Get authorization token
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - No token provided" },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7);

    // Verify token
    let decoded: JWTPayload;
    try {
      decoded = verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Invalid token" },
        { status: 401 },
      );
    }

    // Get responses - all users can see all responses (as per requirement)
    // But we can filter by recipient email if needed
    const responses = [...adminResponses].reverse(); // Most recent first

    return NextResponse.json(
      {
        success: true,
        data: responses,
        count: responses.length,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("Error fetching admin responses:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
