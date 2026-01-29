import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { userDb, generateId } from "@/lib/db";

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

    // Create a response record that will be visible to all users
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

    // Get all users to send notification to all accounts
    const allUsers = await userDb.getAll();

    // In a real implementation, you would store these in a notifications table
    // For now, we're just storing the response which can be queried by all users
    console.log(
      `Admin response sent to ${email} - visible to all ${allUsers.length} users`,
    );

    return NextResponse.json(
      {
        success: true,
        message: "Response sent successfully to all users",
        data: {
          responseId: responseDocument.id,
          recipientEmail: email.toLowerCase().trim(),
          sentAt: responseDocument.createdAt,
          visibleToUsers: allUsers.length,
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
