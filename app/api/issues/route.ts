import { NextRequest, NextResponse } from "next/server";
import { issueDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import {
  Issue,
  CreateIssueRequest,
  ApiResponse,
  IssueFilters,
} from "@/lib/types";
import { categorizeIssue, isAIServiceAvailable } from "@/lib/ai/service";
import { sendEmail } from "@/lib/email";
import { postIssueToSocialMedia } from "@/lib/social-media/issue-poster-workflow";

// ============================================================================
// SECURITY CONFIGURATION
// ============================================================================
// Set to true in production to require authentication for issue creation
// Currently allows guest users for demo/hackathon purposes
const REQUIRE_AUTH_FOR_ISSUE_CREATION =
  process.env.REQUIRE_AUTH_FOR_ISSUES === "true";

// Validation helpers
function isValidCoordinate(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function sanitizeUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    // Only allow http and https protocols
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return null;
    }
    return parsedUrl.href;
  } catch {
    return null;
  }
}

function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/[<>]/g, ""); // Remove potential HTML tags
}

// GET /api/issues - Get all issues with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract filters from query params
    const filters: IssueFilters = {
      status:
        (searchParams.get("status") as IssueFilters["status"]) || undefined,
      category:
        (searchParams.get("category") as IssueFilters["category"]) || undefined,
      priority:
        (searchParams.get("priority") as IssueFilters["priority"]) || undefined,
      userId: searchParams.get("userId") || undefined,
      search: searchParams.get("search") || undefined,
      sortBy:
        (searchParams.get("sortBy") as IssueFilters["sortBy"]) || "createdAt",
      sortOrder:
        (searchParams.get("sortOrder") as IssueFilters["sortOrder"]) || "desc",
      limit: parseInt(searchParams.get("limit") || "100"),
      offset: parseInt(searchParams.get("offset") || "0"),
    };

    let issues = await issueDb.getAll();

    // Apply filters
    if (filters.status) {
      issues = issues.filter((issue: Issue) => issue.status === filters.status);
    }

    if (filters.category) {
      issues = issues.filter(
        (issue: Issue) => issue.category === filters.category,
      );
    }

    if (filters.priority) {
      issues = issues.filter(
        (issue: Issue) => issue.priority === filters.priority,
      );
    }

    if (filters.userId) {
      issues = issues.filter((issue: Issue) => issue.userId === filters.userId);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      issues = issues.filter(
        (issue: Issue) =>
          issue.title.toLowerCase().includes(searchLower) ||
          issue.description.toLowerCase().includes(searchLower) ||
          issue.location.toLowerCase().includes(searchLower),
      );
    }

    // Sort issues
    issues.sort((a: Issue, b: Issue) => {
      const sortBy = filters.sortBy || "createdAt";
      let aVal: string | number = a[sortBy as keyof Issue] as string | number;
      let bVal: string | number = b[sortBy as keyof Issue] as string | number;

      if (sortBy === "createdAt") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (filters.sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    // Apply pagination
    const total = issues.length;
    const paginatedIssues = issues.slice(
      filters.offset,
      filters.offset! + filters.limit!,
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          issues: paginatedIssues,
          total,
          limit: filters.limit,
          offset: filters.offset,
        },
      } as ApiResponse,
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching issues:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch issues",
      } as ApiResponse,
      { status: 500 },
    );
  }
}

// POST /api/issues - Create a new issue
// NOTE: This endpoint allows guest users by default for demo purposes.
// Set REQUIRE_AUTH_FOR_ISSUES=true in production to require authentication.
export async function POST(request: NextRequest) {
  try {
    // Get user from auth token
    let user = getUserFromRequest(request);

    // Check if authentication is required
    if (REQUIRE_AUTH_FOR_ISSUE_CREATION && !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required to report issues",
        } as ApiResponse,
        { status: 401 },
      );
    }

    // If no user and guest access is allowed, create a guest user object
    if (!user) {
      console.log(
        "⚠️ Guest user creating issue - consider enabling REQUIRE_AUTH_FOR_ISSUES in production",
      );
      user = {
        userId: "guest-" + Date.now(),
        email: "guest@ourstreet.com",
        role: "citizen",
      };
    }

    const body: CreateIssueRequest = await request.json();
    const {
      title,
      description,
      category,
      location,
      coordinates,
      photoUrl,
      useAI,
      aiSuggestion,
    } = body;

    // Validation - Check required fields
    if (!title || !description || !category || !location) {
      return NextResponse.json(
        {
          success: false,
          error: "Title, description, category, and location are required",
        } as ApiResponse,
        { status: 400 },
      );
    }

    // Sanitize inputs
    const sanitizedTitle = sanitizeInput(title);
    const sanitizedDescription = sanitizeInput(description);
    const sanitizedLocation = sanitizeInput(location);

    // Validate title length
    if (sanitizedTitle.length < 5 || sanitizedTitle.length > 200) {
      return NextResponse.json(
        {
          success: false,
          error: "Title must be between 5 and 200 characters long",
        } as ApiResponse,
        { status: 400 },
      );
    }

    // Validate description length
    if (
      sanitizedDescription.length < 10 ||
      sanitizedDescription.length > 2000
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Description must be between 10 and 2000 characters long",
        } as ApiResponse,
        { status: 400 },
      );
    }

    // Validate location length
    if (sanitizedLocation.length < 3 || sanitizedLocation.length > 500) {
      return NextResponse.json(
        {
          success: false,
          error: "Location must be between 3 and 500 characters long",
        } as ApiResponse,
        { status: 400 },
      );
    }

    // Validate category
    const validCategories = [
      "pothole",
      "streetlight",
      "garbage",
      "water_leak",
      "road",
      "sanitation",
      "drainage",
      "electricity",
      "traffic",
      "other",
    ];

    if (!validCategories.includes(category)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid category",
        } as ApiResponse,
        { status: 400 },
      );
    }

    // Validate coordinates
    if (!coordinates || !coordinates.lat || !coordinates.lng) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid coordinates are required",
        } as ApiResponse,
        { status: 400 },
      );
    }

    // Validate coordinate values
    if (
      typeof coordinates.lat !== "number" ||
      typeof coordinates.lng !== "number"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Coordinates must be valid numbers",
        } as ApiResponse,
        { status: 400 },
      );
    }

    if (!isValidCoordinate(coordinates.lat, coordinates.lng)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180",
        } as ApiResponse,
        { status: 400 },
      );
    }

    // Validate and sanitize photo URL if provided
    let validPhotoUrl: string | undefined;
    if (photoUrl) {
      if (typeof photoUrl !== "string") {
        return NextResponse.json(
          {
            success: false,
            error: "Photo URL must be a string",
          } as ApiResponse,
          { status: 400 },
        );
      }

      const sanitized = sanitizeUrl(photoUrl);
      if (!sanitized) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid photo URL format",
          } as ApiResponse,
          { status: 400 },
        );
      }
      validPhotoUrl = sanitized;
    }

    // Determine priority and category using AI if requested
    let finalCategory = category;
    let priority: "low" | "medium" | "high" | "critical" = "medium";
    let aiMetadata: Issue["aiMetadata"] | undefined;

    // Check if AI categorization should be used
    if (useAI && isAIServiceAvailable()) {
      try {
        console.log("Using AI for categorization and priority scoring...");
        const aiResult = await categorizeIssue({
          title: sanitizedTitle,
          description: sanitizedDescription,
          location: sanitizedLocation,
        });

        // Store AI metadata
        aiMetadata = {
          usedAI: true,
          aiCategory: aiResult.category,
          aiPriority: aiResult.priority,
          confidence: aiResult.confidence,
          reasoning: aiResult.reasoning,
          tags: aiResult.tags,
          manualOverride: false,
        };

        // Use AI suggestions
        finalCategory = aiResult.category;
        priority = aiResult.priority;

        console.log(
          `AI categorization: ${finalCategory}, priority: ${priority}, confidence: ${aiResult.confidence}`,
        );
      } catch (error) {
        console.error(
          "AI categorization failed, falling back to manual:",
          error,
        );
        // Fall through to manual categorization
      }
    } else if (aiSuggestion) {
      // User applied AI suggestion manually
      aiMetadata = {
        usedAI: true,
        aiCategory: aiSuggestion.category,
        aiPriority: aiSuggestion.priority,
        confidence: aiSuggestion.confidence,
        reasoning: aiSuggestion.reasoning,
        tags: [],
        manualOverride: aiSuggestion.manualOverride || false,
      };

      // Use the category and priority from AI suggestion if user chose it
      if (category === aiSuggestion.category) {
        finalCategory = aiSuggestion.category;
        priority = aiSuggestion.priority;
      } else {
        // User overrode AI suggestion
        aiMetadata.manualOverride = true;
        finalCategory = category;
        // Manual priority determination
        if (["water_leak", "electricity", "traffic"].includes(category)) {
          priority = "high";
        } else if (["pothole", "streetlight"].includes(category)) {
          priority = "medium";
        } else {
          priority = "low";
        }
      }
    } else {
      // Manual categorization - determine priority based on category
      if (["water_leak", "electricity", "traffic"].includes(category)) {
        priority = "high";
      } else if (["pothole", "streetlight"].includes(category)) {
        priority = "medium";
      } else {
        priority = "low";
      }
    }

    // Create new issue with sanitized data
    const newIssue = await issueDb.create({
      title: sanitizedTitle,
      description: sanitizedDescription,
      category: finalCategory,
      location: sanitizedLocation,
      coordinates: {
        lat: coordinates.lat,
        lng: coordinates.lng,
      },
      photoUrl: validPhotoUrl,
      status: "open",
      priority,
      userId: user.userId,
      aiMetadata,
    });

    if (!newIssue) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create issue",
        } as ApiResponse,
        { status: 500 },
      );
    }

    // Send email notification about the report submission
    try {
      const priorityColors = {
        low: "#10b981",
        medium: "#f59e0b",
        high: "#ef4444",
        critical: "#dc2626",
      };

      const priorityLabels = {
        low: "Low Priority",
        medium: "Medium Priority",
        high: "High Priority",
        critical: "Critical Priority",
      };

      const categoryLabels: Record<string, string> = {
        pothole: "Pothole",
        streetlight: "Streetlight",
        garbage: "Garbage",
        water_leak: "Water Leak",
        road: "Road Issue",
        sanitation: "Sanitation",
        drainage: "Drainage",
        electricity: "Electricity",
        traffic: "Traffic",
        other: "Other",
      };

      await sendEmail({
        to: user.email,
        subject: `Report Submitted Successfully - ${sanitizedTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Report Submitted</title>
              <style>
                body {
                  margin: 0;
                  padding: 0;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  background-color: #f5f5f5;
                }
                .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: #ffffff;
                }
                .header {
                  background: linear-gradient(135deg, #9E7AFF 0%, #FE8BBB 100%);
                  padding: 40px 20px;
                  text-align: center;
                }
                .header h1 {
                  color: #ffffff;
                  margin: 0;
                  font-size: 28px;
                  font-weight: bold;
                }
                .content {
                  padding: 40px 30px;
                  color: #333333;
                  line-height: 1.6;
                }
                .badge {
                  display: inline-block;
                  padding: 6px 12px;
                  border-radius: 6px;
                  font-size: 12px;
                  font-weight: 600;
                  color: #ffffff;
                }
                .issue-details {
                  background-color: #f9f9f9;
                  padding: 20px;
                  border-radius: 8px;
                  margin: 20px 0;
                  border-left: 4px solid #9E7AFF;
                }
                .issue-details p {
                  margin: 10px 0;
                  font-size: 14px;
                }
                .issue-details strong {
                  color: #333333;
                }
                .footer {
                  background-color: #f5f5f5;
                  padding: 30px;
                  text-align: center;
                  color: #888888;
                  font-size: 14px;
                }
                .button {
                  display: inline-block;
                  padding: 14px 32px;
                  background: linear-gradient(135deg, #9E7AFF 0%, #FE8BBB 100%);
                  color: #ffffff;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: 600;
                  margin: 20px 0;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>✅ Report Submitted Successfully</h1>
                </div>

                <div class="content">
                  <p>Hello,</p>

                  <p>
                    Thank you for reporting an issue on OurStreet. Your report has been successfully submitted and is now being reviewed by our team.
                  </p>

                  <div class="issue-details">
                    <p><strong>Report ID:</strong> ${newIssue.id}</p>
                    <p><strong>Title:</strong> ${sanitizedTitle}</p>
                    <p><strong>Category:</strong> ${categoryLabels[finalCategory] || finalCategory}</p>
                    <p><strong>Location:</strong> ${sanitizedLocation}</p>
                    <p><strong>Priority:</strong> <span class="badge" style="background-color: ${priorityColors[priority]}">${priorityLabels[priority]}</span></p>
                    <p><strong>Status:</strong> <span class="badge" style="background-color: #3b82f6">Open</span></p>
                    <p><strong>Description:</strong> ${sanitizedDescription.substring(0, 200)}${sanitizedDescription.length > 200 ? "..." : ""}</p>
                    <p><strong>Submitted:</strong> ${new Date(newIssue.createdAt).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}</p>
                  </div>

                  <p>
                    <strong>What happens next?</strong>
                  </p>
                  <ul>
                    <li>Our team will review your report within 24-48 hours</li>
                    <li>You'll receive updates as the status changes</li>
                    <li>You can track progress on your dashboard</li>
                    <li>Community members can upvote and support your report</li>
                  </ul>

                  <div style="text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/issues/${newIssue.id}" class="button">
                      View Report Details
                    </a>
                  </div>

                  <p style="margin-top: 30px;">
                    Thank you for helping make our community better!
                  </p>

                  <p>
                    Best regards,<br>
                    <strong>The OurStreet Team</strong>
                  </p>
                </div>

                <div class="footer">
                  <p>© ${new Date().getFullYear()} OurStreet. All rights reserved.</p>
                  <p>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard" style="color: #9E7AFF; text-decoration: none;">Dashboard</a> |
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/issues/${newIssue.id}" style="color: #9E7AFF; text-decoration: none;">View Report</a>
                  </p>
                </div>
              </div>
            </body>
          </html>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send report submission email:", emailError);
      // Don't fail the request if email fails
    }

    // Attempt automated social media posting
    try {
      const autoPostEnabled = process.env.ENABLE_SOCIAL_MEDIA_AUTO_POST === "true";
      const autoApprove = process.env.SOCIAL_MEDIA_AUTO_APPROVE === "true";

      if (autoPostEnabled) {
        console.log(`🚀 Triggering auto-post for issue ${newIssue.id}`);

        // We run this asynchronously to not block the main response
        postIssueToSocialMedia(newIssue, {
          includeImage: true,
          autoApprove: autoApprove
        }).then(result => {
          if (result.success) {
            console.log(`✅ Auto-posted issue ${newIssue.id} to social media: ${result.url}`);
          } else {
            console.warn(`⚠️ Auto-posting failed for issue ${newIssue.id}: ${result.error}`);
          }
        }).catch(err => {
          console.error(`❌ Fatal error in auto-posting workflow for issue ${newIssue.id}:`, err);
        });
      }
    } catch (socialError) {
      console.error("Error initiating social media auto-post:", socialError);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Issue reported successfully",
        data: newIssue,
      } as ApiResponse<Issue>,
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating issue:", error);

    // Check for specific error types
    let errorMessage = "Failed to create issue. Please try again.";
    if (error instanceof SyntaxError) {
      errorMessage = "Invalid request format. Please check your data.";
    } else if (error instanceof Error && error.message.includes("database")) {
      errorMessage = "Database error. Please try again later.";
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      } as ApiResponse,
      { status: 500 },
    );
  }
}

// DELETE /api/issues - Delete all issues (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        } as ApiResponse,
        { status: 401 },
      );
    }

    // In production, check if user is admin
    // For now, we'll allow it for demo purposes

    return NextResponse.json(
      {
        success: true,
        message: "Bulk delete not implemented for safety",
      } as ApiResponse,
      { status: 403 },
    );
  } catch (error) {
    console.error("Error in DELETE issues:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      } as ApiResponse,
      { status: 500 },
    );
  }
}
