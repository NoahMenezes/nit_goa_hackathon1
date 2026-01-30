import { NextRequest, NextResponse } from "next/server";
import { postIssueToSocialMedia } from "@/lib/social-media/issue-poster-workflow";
import { Issue } from "@/lib/types";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require admin authentication for social media posting
    const authResult = await requireAdmin(request);
    if (!authResult.authorized) {
      return NextResponse.json(
        {
          success: false,
          error: authResult.error || "Unauthorized - Admin access required",
        },
        { status: 401 },
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.id || !body.title || !body.description || !body.category) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: id, title, description, category",
        },
        { status: 400 },
      );
    }

    // Construct issue object
    const issue: Issue = {
      id: body.id,
      title: body.title,
      description: body.description,
      category: body.category,
      location: body.location || "Unknown location",
      coordinates: {
        lat: body.latitude || 0,
        lng: body.longitude || 0,
      },
      photoUrl: body.photoUrl || body.photo_url || undefined,
      status: body.status || "open",
      priority: body.priority || "medium",
      userId: body.userId || body.user_id || "anonymous",
      votes: body.votes || 0,
      comments: body.comments || [],
      createdAt: body.createdAt || body.created_at || new Date().toISOString(),
      updatedAt: body.updatedAt || body.updated_at || new Date().toISOString(),
    };

    // Get options from request
    const includeImage = body.includeImage !== false;
    const autoApprove = body.autoApprove === true;

    console.log(
      `📢 API: Posting issue to social media: ${issue.title} (by admin: ${authResult.user?.email})`,
    );

    // Run the LangGraph workflow
    const result = await postIssueToSocialMedia(issue, {
      includeImage,
      autoApprove,
    });

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          message: "Issue posted to social media successfully",
          tweetId: result.tweetId,
          tweetUrl: result.url,
          postedBy: authResult.user?.email,
        },
        { status: 200 },
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to post to social media",
        },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Error in social media post API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  // Require authentication even for status check
  const authResult = await requireAdmin(request);
  if (!authResult.authorized) {
    return NextResponse.json(
      {
        success: false,
        error: authResult.error || "Unauthorized - Admin access required",
      },
      { status: 401 },
    );
  }

  // Return status of social media configuration
  const twitterConfigured = !!(
    process.env.TWITTER_API_KEY &&
    process.env.TWITTER_API_SECRET &&
    process.env.TWITTER_ACCESS_TOKEN &&
    process.env.TWITTER_ACCESS_SECRET
  );

  const geminiConfigured = !!process.env.GEMINI_API_KEY;

  const autoPostEnabled = process.env.ENABLE_SOCIAL_MEDIA_AUTO_POST === "true";
  const autoApprove = process.env.SOCIAL_MEDIA_AUTO_APPROVE === "true";
  const postPriorities =
    process.env.SOCIAL_MEDIA_POST_PRIORITIES || "high,critical";

  return NextResponse.json(
    {
      success: true,
      status: {
        twitterConfigured,
        geminiConfigured,
        autoPostEnabled,
        autoApprove,
        postPriorities: postPriorities.split(","),
        ready: twitterConfigured && geminiConfigured,
      },
    },
    { status: 200 },
  );
}
