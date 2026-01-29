// LangGraph Workflow for Automated Social Media Posting
// Uses AI to generate engaging content and posts civic issues to X/Twitter

import { StateGraph, END, START } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { getTwitterClient, TweetResult } from "./twitter-client";
import { Issue } from "@/lib/types";

// ============================================================================
// STATE DEFINITION
// ============================================================================

export interface IssuePostingState {
  // Input
  issue: Issue;
  includeImage: boolean;

  // Processing
  tweetText?: string;
  mediaId?: string;
  shouldPost: boolean;

  // Output
  result?: TweetResult;
  error?: string;

  // Metadata
  attempts: number;
  moderationStatus: "pending" | "approved" | "rejected";
}

// ============================================================================
// AI CONTENT GENERATOR
// ============================================================================

class IssueContentGenerator {
  private model: ChatGoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    this.model = new ChatGoogleGenerativeAI({
      apiKey: apiKey,
      temperature: 0.7,
    });
  }

  /**
   * Generate engaging tweet text from an issue
   */
  async generateTweet(issue: Issue): Promise<string> {
    const prompt = `You are a civic engagement social media manager. Create an engaging, informative tweet about this civic issue.

ISSUE DETAILS:
- Category: ${issue.category}
- Title: ${issue.title}
- Description: ${issue.description}
- Location: ${issue.location}
- Status: ${issue.status}
- Priority: ${issue.priority || "medium"}
- Date Reported: ${new Date(issue.createdAt).toLocaleDateString()}

REQUIREMENTS:
1. Keep it under 280 characters
2. Use appropriate emojis (🚨 for urgent, 🔧 for repairs, 🗑️ for waste, 💡 for lights, etc.)
3. Include the location
4. Make it action-oriented and engaging
5. Add relevant hashtags (#CivicIssue #${issue.category.replace(/_/g, "")} #CommunityAlert)
6. Use urgency-appropriate language based on priority
7. DO NOT include any URLs or links
8. Be factual and professional

Generate ONLY the tweet text, nothing else.`;

    try {
      const response = await this.model.invoke(prompt);
      let tweetText = response.content.toString().trim();

      // Remove any quotes that AI might add
      tweetText = tweetText.replace(/^["']|["']$/g, "");

      // Ensure it's within Twitter's character limit
      if (tweetText.length > 280) {
        // Truncate and add ellipsis
        tweetText = tweetText.substring(0, 277) + "...";
      }

      console.log(
        `✅ Generated tweet (${tweetText.length} chars): ${tweetText}`,
      );

      return tweetText;
    } catch (error) {
      console.error("Error generating tweet:", error);
      // Fallback to simple format
      return this.generateFallbackTweet(issue);
    }
  }

  /**
   * Generate a simple fallback tweet without AI
   */
  private generateFallbackTweet(issue: Issue): string {
    const categoryEmoji: Record<string, string> = {
      pothole: "🚧",
      streetlight: "💡",
      garbage: "🗑️",
      water_leak: "💧",
      road: "🛣️",
      sanitation: "🧹",
      drainage: "🌊",
      electricity: "⚡",
      traffic: "🚦",
      other: "📢",
    };

    const emoji = categoryEmoji[issue.category] || "🚨";
    const category = issue.category.replace(/_/g, " ").toUpperCase();
    const location = issue.location.split(",")[0]; // Get first part of location

    let tweet = `${emoji} ${category} Alert!\n\n${issue.title}\n\n📍 ${location}\n\n`;

    // Add priority indicator
    if (issue.priority === "high" || issue.priority === "critical") {
      tweet = "🚨 URGENT: " + tweet;
    }

    // Add hashtags
    tweet += `#CivicIssue #${category.replace(/ /g, "")}`;

    // Ensure under 280 characters
    if (tweet.length > 280) {
      const titleLength = 280 - tweet.length + issue.title.length - 20;
      tweet = tweet.replace(
        issue.title,
        issue.title.substring(0, titleLength) + "...",
      );
    }

    return tweet;
  }

  /**
   * Assess if an issue should be posted based on content moderation
   */
  async moderateContent(issue: Issue): Promise<{
    shouldPost: boolean;
    reason?: string;
  }> {
    const prompt = `You are a content moderation assistant. Review this civic issue report and determine if it's appropriate to post on social media.

ISSUE:
Title: ${issue.title}
Description: ${issue.description}
Category: ${issue.category}

MODERATION CRITERIA - Reject if:
1. Contains profanity or offensive language
2. Contains personal attacks or harassment
3. Contains false or misleading information
4. Contains spam or promotional content
5. Contains private/sensitive information (addresses, phone numbers, emails)
6. Is duplicate or spam content

Respond with ONLY "APPROVE" or "REJECT" followed by a brief reason.
Example: "APPROVE: Valid civic issue report"
Example: "REJECT: Contains personal information"`;

    try {
      const response = await this.model.invoke(prompt);
      const result = response.content.toString().trim();

      const shouldPost = result.toUpperCase().startsWith("APPROVE");
      const reason = result.split(":")[1]?.trim() || result;

      console.log(
        `🔍 Moderation result: ${shouldPost ? "✅ APPROVED" : "❌ REJECTED"} - ${reason}`,
      );

      return { shouldPost, reason };
    } catch (error) {
      console.error("Error in content moderation:", error);
      // Default to approve if moderation fails (to avoid blocking legitimate content)
      return { shouldPost: true, reason: "Moderation service unavailable" };
    }
  }
}

// ============================================================================
// WORKFLOW NODES
// ============================================================================

/**
 * Node 1: Content Moderation
 * Checks if the issue content is appropriate for social media
 */
async function moderateIssue(
  state: IssuePostingState,
): Promise<Partial<IssuePostingState>> {
  console.log(`📋 Moderating issue: ${state.issue.title}`);

  try {
    const generator = new IssueContentGenerator();
    const moderation = await generator.moderateContent(state.issue);

    if (!moderation.shouldPost) {
      console.log(`❌ Issue rejected: ${moderation.reason}`);
      return {
        shouldPost: false,
        moderationStatus: "rejected",
        error: moderation.reason,
      };
    }

    console.log(`✅ Issue approved for posting`);
    return {
      shouldPost: true,
      moderationStatus: "approved",
    };
  } catch (error) {
    console.error("Error in moderation:", error);
    // Default to approve to avoid blocking
    return {
      shouldPost: true,
      moderationStatus: "approved",
    };
  }
}

/**
 * Node 2: Generate Tweet Content
 * Uses AI to create engaging tweet text
 */
async function generateContent(
  state: IssuePostingState,
): Promise<Partial<IssuePostingState>> {
  console.log(`✍️ Generating tweet content for: ${state.issue.title}`);

  try {
    const generator = new IssueContentGenerator();
    const tweetText = await generator.generateTweet(state.issue);

    return { tweetText };
  } catch (error) {
    console.error("Error generating content:", error);
    return {
      error: "Failed to generate tweet content",
      shouldPost: false,
    };
  }
}

/**
 * Node 3: Upload Media (if available)
 * Uploads issue photo to Twitter
 */
async function uploadMedia(
  state: IssuePostingState,
): Promise<Partial<IssuePostingState>> {
  if (!state.includeImage || !state.issue.photoUrl) {
    console.log("📷 No image to upload, skipping media upload");
    return {};
  }

  console.log(`📤 Uploading image: ${state.issue.photoUrl}`);

  try {
    const twitterClient = getTwitterClient();

    if (!twitterClient.isReady()) {
      console.warn("⚠️ Twitter client not ready, posting without image");
      return {};
    }

    // Fetch the image from URL
    const response = await fetch(state.issue.photoUrl);
    if (!response.ok) {
      console.error("Failed to fetch image from URL");
      return {};
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Upload to Twitter
    const mediaId = await twitterClient.uploadMedia(buffer, contentType);

    if (mediaId) {
      console.log(`✅ Media uploaded successfully: ${mediaId}`);
      return { mediaId };
    } else {
      console.warn("⚠️ Media upload failed, will post without image");
      return {};
    }
  } catch (error) {
    console.error("Error uploading media:", error);
    // Continue without image
    return {};
  }
}

/**
 * Node 4: Post to Twitter
 * Posts the generated tweet to X/Twitter
 */
async function postToTwitter(
  state: IssuePostingState,
): Promise<Partial<IssuePostingState>> {
  if (!state.shouldPost) {
    console.log("⏭️ Skipping post - not approved");
    return { result: { success: false, error: "Not approved for posting" } };
  }

  if (!state.tweetText) {
    console.error("❌ No tweet text available");
    return {
      result: { success: false, error: "No tweet content generated" },
      error: "Missing tweet text",
    };
  }

  console.log(`📤 Posting to X/Twitter...`);

  try {
    const twitterClient = getTwitterClient();

    if (!twitterClient.isReady()) {
      return {
        result: {
          success: false,
          error:
            "Twitter client not configured. Please set up API credentials.",
        },
        error: "Twitter not configured",
      };
    }

    // Post the tweet
    const result = await twitterClient.postTweet({
      text: state.tweetText,
      mediaIds: state.mediaId ? [state.mediaId] : undefined,
    });

    if (result.success) {
      console.log(`✅ Tweet posted successfully: ${result.url}`);
    } else {
      console.error(`❌ Tweet posting failed: ${result.error}`);
    }

    return { result };
  } catch (error) {
    console.error("Error posting to Twitter:", error);
    return {
      result: {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      error: "Posting failed",
    };
  }
}

// ============================================================================
// CONDITIONAL EDGE LOGIC
// ============================================================================

/**
 * Decide whether to proceed with posting after moderation
 */
function shouldProceedAfterModeration(state: IssuePostingState): string {
  if (!state.shouldPost) {
    return "end";
  }
  return "generate_content";
}

/**
 * Decide whether to upload media or go straight to posting
 */
function shouldUploadMedia(state: IssuePostingState): string {
  if (state.includeImage && state.issue.photoUrl) {
    return "upload_media";
  }
  return "post_to_twitter";
}

// ============================================================================
// WORKFLOW DEFINITION
// ============================================================================

/**
 * Create the LangGraph workflow for social media posting
 */
export function createIssuePostingWorkflow() {
  const workflow = new StateGraph<IssuePostingState>({
    channels: {
      issue: null,
      includeImage: null,
      tweetText: null,
      mediaId: null,
      shouldPost: null,
      result: null,
      error: null,
      attempts: null,
      moderationStatus: null,
    },
  });

  // Add nodes
  workflow.addNode("moderate_issue", moderateIssue);
  workflow.addNode("generate_content", generateContent);
  workflow.addNode("upload_media", uploadMedia);
  workflow.addNode("post_to_twitter", postToTwitter);

  // Define edges
  workflow.addEdge(START, "moderate_issue");
  workflow.addConditionalEdges("moderate_issue", shouldProceedAfterModeration, {
    generate_content: "generate_content",
    end: END,
  });
  workflow.addConditionalEdges("generate_content", shouldUploadMedia, {
    upload_media: "upload_media",
    post_to_twitter: "post_to_twitter",
  });
  workflow.addEdge("upload_media", "post_to_twitter");
  workflow.addEdge("post_to_twitter", END);

  return workflow.compile();
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Post an issue to social media using the workflow
 */
export async function postIssueToSocialMedia(
  issue: Issue,
  options: {
    includeImage?: boolean;
    autoApprove?: boolean;
  } = {},
): Promise<TweetResult> {
  const { includeImage = true, autoApprove = false } = options;

  console.log(
    `\n🚀 Starting social media posting workflow for issue: ${issue.id}`,
  );
  console.log(`   Title: ${issue.title}`);
  console.log(`   Category: ${issue.category}`);
  console.log(`   Include image: ${includeImage}`);

  try {
    const workflow = createIssuePostingWorkflow();

    const initialState: IssuePostingState = {
      issue,
      includeImage,
      shouldPost: autoApprove, // Skip moderation if auto-approved
      attempts: 0,
      moderationStatus: autoApprove ? "approved" : "pending",
    };

    // Run the workflow
    const result = await workflow.invoke(initialState);

    console.log(`\n✅ Workflow completed`);

    if (result.result) {
      return result.result;
    } else {
      return {
        success: false,
        error: result.error || "Workflow completed without result",
      };
    }
  } catch (error) {
    console.error("Error in social media posting workflow:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown workflow error",
    };
  }
}

/**
 * Batch post multiple issues to social media
 */
export async function postMultipleIssues(
  issues: Issue[],
  options: {
    includeImages?: boolean;
    delayBetweenPosts?: number; // milliseconds
    autoApprove?: boolean;
  } = {},
): Promise<{ success: number; failed: number; results: TweetResult[] }> {
  const {
    includeImages = true,
    delayBetweenPosts = 5000,
    autoApprove = false,
  } = options;

  console.log(`\n📢 Batch posting ${issues.length} issues to social media...`);

  const results: TweetResult[] = [];
  let success = 0;
  let failed = 0;

  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i];
    console.log(
      `\n[${i + 1}/${issues.length}] Processing issue: ${issue.title}`,
    );

    try {
      const result = await postIssueToSocialMedia(issue, {
        includeImage: includeImages,
        autoApprove,
      });

      results.push(result);

      if (result.success) {
        success++;
      } else {
        failed++;
      }

      // Add delay between posts to avoid rate limits
      if (i < issues.length - 1) {
        console.log(
          `⏳ Waiting ${delayBetweenPosts / 1000}s before next post...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayBetweenPosts));
      }
    } catch (error) {
      console.error(`❌ Failed to process issue ${issue.id}:`, error);
      failed++;
      results.push({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  console.log(`\n📊 Batch posting complete:`);
  console.log(`   ✅ Success: ${success}`);
  console.log(`   ❌ Failed: ${failed}`);

  return { success, failed, results };
}
