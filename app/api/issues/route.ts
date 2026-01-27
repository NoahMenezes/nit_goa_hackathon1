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
export async function POST(request: NextRequest) {
  try {
    // Get user from auth token (allow guest users for demo)
    let user = getUserFromRequest(request);

    // If no user, create a guest user object
    if (!user) {
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
