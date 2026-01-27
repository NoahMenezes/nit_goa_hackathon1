import { NextRequest, NextResponse } from "next/server";
import {
  categorizeIssue,
  isAIServiceAvailable,
  AICategorizationRequest,
} from "@/lib/ai/service";
import { ApiResponse } from "@/lib/types";

/**
 * POST /api/ai/categorize
 *
 * Analyzes issue text and suggests category, priority, and improvements
 *
 * Request body:
 * {
 *   title: string;
 *   description: string;
 *   location?: string;
 *   imageAnalysis?: string;
 * }
 *
 * Response:
 * {
 *   success: boolean;
 *   data?: {
 *     category: IssueCategory;
 *     priority: IssuePriority;
 *     confidence: number;
 *     reasoning: string;
 *     suggestedTitle?: string;
 *     tags?: string[];
 *   };
 *   error?: string;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check if AI service is available
    if (!isAIServiceAvailable()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "AI service is not configured. Please set GEMINI_API_KEY environment variable.",
        } as ApiResponse,
        { status: 503 },
      );
    }

    const body: AICategorizationRequest = await request.json();

    // Validate required fields
    if (!body.title || !body.description) {
      return NextResponse.json(
        {
          success: false,
          error: "Title and description are required",
        } as ApiResponse,
        { status: 400 },
      );
    }

    // Validate input lengths
    if (body.title.length < 5 || body.title.length > 200) {
      return NextResponse.json(
        {
          success: false,
          error: "Title must be between 5 and 200 characters",
        } as ApiResponse,
        { status: 400 },
      );
    }

    if (body.description.length < 10 || body.description.length > 2000) {
      return NextResponse.json(
        {
          success: false,
          error: "Description must be between 10 and 2000 characters",
        } as ApiResponse,
        { status: 400 },
      );
    }

    // Call AI service for categorization
    const result = await categorizeIssue({
      title: body.title,
      description: body.description,
      location: body.location,
      imageAnalysis: body.imageAnalysis,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Issue categorized successfully",
        data: result,
      } as ApiResponse,
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in AI categorization endpoint:", error);

    // Provide helpful error messages
    let errorMessage = "Failed to categorize issue";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        errorMessage = "AI service configuration error";
        statusCode = 503;
      } else if (error.message.includes("rate limit")) {
        errorMessage =
          "AI service rate limit exceeded. Please try again later.";
        statusCode = 429;
      } else if (error.message.includes("timeout")) {
        errorMessage = "AI service timeout. Please try again.";
        statusCode = 504;
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      } as ApiResponse,
      { status: statusCode },
    );
  }
}

/**
 * GET /api/ai/categorize
 *
 * Check AI service status
 */
export async function GET() {
  const available = isAIServiceAvailable();

  return NextResponse.json(
    {
      success: true,
      data: {
        available,
        message: available
          ? "AI categorization service is available"
          : "AI service not configured. Set GEMINI_API_KEY to enable.",
      },
    } as ApiResponse,
    { status: 200 },
  );
}
