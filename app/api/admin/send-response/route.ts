import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { userDb, generateId, issueDb } from "@/lib/db";
import { sendEmail } from "@/lib/email";

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
    console.log("=== Admin Send Response API Started ===");

    // Get authorization token
    const authHeader = request.headers.get("authorization");
    console.log("Authorization header present:", !!authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("No authorization token provided");
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
      console.log(
        "Token verified for user:",
        decoded.email,
        "Role:",
        decoded.role,
      );
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json(
        { success: false, message: "Unauthorized - Invalid token" },
        { status: 401 },
      );
    }

    if (decoded.role !== "admin") {
      console.error("User is not admin:", decoded.role);
      return NextResponse.json(
        { success: false, message: "Forbidden - Admin access required" },
        { status: 403 },
      );
    }

    // Parse request body
    const body = await request.json();
    const { email, response, adminName } = body;
    console.log(
      "Request body parsed - Email:",
      email,
      "Admin:",
      adminName,
      "Response length:",
      response?.length,
    );

    // Validate input
    if (!email || !response) {
      console.error(
        "Missing required fields - Email:",
        !!email,
        "Response:",
        !!response,
      );
      return NextResponse.json(
        { success: false, message: "Email and response are required" },
        { status: 400 },
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("Invalid email format:", email);
      return NextResponse.json(
        { success: false, message: "Invalid email format" },
        { status: 400 },
      );
    }

    // Find the user by email
    console.log("Fetching all users...");
    const allUsers = await userDb.getAll();
    console.log("Total users found:", allUsers.length);
    const targetUser = allUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim(),
    );

    if (!targetUser) {
      console.error("User not found with email:", email);
      console.log("Available emails:", allUsers.map((u) => u.email).join(", "));
      return NextResponse.json(
        { success: false, message: "User not found with provided email" },
        { status: 404 },
      );
    }

    console.log("Target user found:", targetUser.name, targetUser.email);

    // Get all issues from the user
    console.log("Fetching all issues...");
    const allIssues = await issueDb.getAll();
    console.log("Total issues found:", allIssues.length);
    const userIssues = allIssues
      .filter((issue) => issue.userId === targetUser.id)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    console.log("User issues found:", userIssues.length);

    if (userIssues.length === 0) {
      console.error("No issues found for user:", targetUser.email);
      return NextResponse.json(
        { success: false, message: "No issues found for this user" },
        { status: 404 },
      );
    }

    // Get the most recent issue
    const mostRecentIssue = userIssues[0];
    console.log(
      "Most recent issue:",
      mostRecentIssue.id,
      mostRecentIssue.title,
    );

    // Add admin response as a comment to the issue
    const comment = {
      id: generateId(),
      issueId: mostRecentIssue.id,
      userId: decoded.userId,
      userName: `${adminName || "Admin"} (Admin Response)`,
      content: response.trim(),
      createdAt: new Date().toISOString(),
    };

    console.log("Adding comment to issue...");
    mostRecentIssue.comments.push(comment);

    try {
      await issueDb.update(mostRecentIssue.id, mostRecentIssue);
      console.log("Issue updated successfully with comment");
    } catch (updateError) {
      console.error("Failed to update issue:", updateError);
      throw updateError;
    }

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

    // Send email notification to the user
    console.log("Attempting to send email notification...");
    try {
      const emailResult = await sendEmail({
        to: targetUser.email,
        subject: `Admin Response to Your Issue: ${mostRecentIssue.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Admin Response Received</h1>
            </div>

            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
                  Hello <strong>${targetUser.name}</strong>,
                </p>

                <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
                  An administrator has responded to your issue. Here are the details:
                </p>

                <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">Your Issue</h3>
                  <p style="color: #1e3a8a; margin: 0; font-size: 16px; font-weight: 600;">${mostRecentIssue.title}</p>
                </div>

                <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <h3 style="color: #065f46; margin: 0 0 10px 0; font-size: 18px;">Admin Response</h3>
                  <p style="color: #047857; margin: 0; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${response.trim()}</p>
                </div>

                <div style="background: #fef3c7; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="color: #92400e; margin: 0; font-size: 14px;">
                    <strong>Response By:</strong> ${adminName || "Admin"}
                  </p>
                </div>

                <div style="text-align: center; margin-top: 30px;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/issues/${mostRecentIssue.id}"
                     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block;">
                    View Full Issue Details
                  </a>
                </div>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 14px; margin: 0;">
                    You can view this response and continue the conversation in the comments section of your issue.
                  </p>
                </div>
              </div>

              <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
                <p>© ${new Date().getFullYear()} OurStreet - Local Issue Reporting Platform</p>
                <p style="margin-top: 5px;">This is an automated notification. Please do not reply to this email.</p>
              </div>
            </div>
          </div>
        `,
      });

      console.log("Email send result:", emailResult);
      console.log(`Email notification sent to ${targetUser.email}`);
    } catch (emailError) {
      console.error("Failed to send email notification:", emailError);
      console.error(
        "Email error details:",
        emailError instanceof Error ? emailError.message : emailError,
      );
      // Don't fail the request if email fails
    }

    console.log("Preparing success response...");
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
    console.error("=== ERROR in Admin Send Response API ===");
    console.error("Error sending admin response:", err);
    console.error(
      "Error stack:",
      err instanceof Error ? err.stack : "No stack trace",
    );
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
