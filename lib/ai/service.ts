/**
 * AI Service for CityPulse - Issue Analysis and Categorization
 *
 * This service integrates with OpenAI GPT-4o-mini to provide:
 * - Automatic issue categorization
 * - Priority level detection
 * - Description enhancement suggestions
 * - Duplicate issue detection
 */

import { IssueCategory, IssuePriority } from "@/lib/types";

// Configuration
const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY || "AIzaSyDuJd2qad4u38nh81icRcMm4lkGnJqoyEk";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Debug logging
console.log("🔧 Gemini AI Configuration:");
console.log("  Model:", GEMINI_MODEL);
console.log(
  "  API Key:",
  GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 10)}...` : "NOT SET",
);
console.log("  API URL:", GEMINI_API_URL);

export interface AICategorizationRequest {
  title: string;
  description: string;
  location?: string;
  imageAnalysis?: string; // Optional pre-analyzed image description
}

export interface AICategorizationResponse {
  category: IssueCategory;
  priority: IssuePriority;
  confidence: number; // 0-1 scale
  reasoning: string;
  suggestedTitle?: string;
  tags?: string[];
}

export interface AIDuplicateCheckRequest {
  title: string;
  description: string;
  category: IssueCategory;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  existingIssues: Array<{
    id: string;
    title: string;
    description: string;
    category: IssueCategory;
    location: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  }>;
}

export interface AIDuplicateCheckResponse {
  isDuplicate: boolean;
  confidence: number;
  duplicateOf?: string; // Issue ID
  reasoning: string;
}

/**
 * System prompt for issue categorization
 */
const CATEGORIZATION_SYSTEM_PROMPT = `You are an AI assistant for CityPulse, a civic issue reporting platform in Goa, India. Your task is to analyze citizen-reported issues and categorize them accurately.

Available categories:
- pothole: Road potholes, craters, damaged road surfaces
- streetlight: Non-functioning or damaged street lights, dark streets
- garbage: Waste accumulation, overflowing bins, littering, illegal dumping
- water_leak: Water pipeline leaks, burst pipes, water wastage
- road: Road damage, cracks, uneven surfaces (not potholes), road construction issues
- sanitation: Public toilet issues, sewage problems, hygiene concerns
- drainage: Blocked drains, flooding, poor drainage systems
- electricity: Power outages, electrical issues, transformer problems
- traffic: Traffic congestion, signal issues, parking problems, traffic safety
- other: Issues that don't fit the above categories

Priority levels (based on FACILITY IMPORTANCE and HEALTH RISK):
- critical: Immediate danger to life, property, or public health. Includes:
  * Major health risks (sewage overflow, contaminated water, biohazards)
  * Life-threatening hazards (electrical hazards, severe structural damage)
  * Critical facility failures (hospitals, schools, emergency services access)
  * Severe traffic safety issues causing accidents
- high: Significant health concerns or important facility issues. Includes:
  * Sanitation problems affecting public health (garbage accumulation, drainage blockage)
  * Important facility damage (main roads, public water supply, major streetlights)
  * Moderate health risks (water leaks, pest infestation from waste)
  * Issues affecting essential services or high-traffic areas
- medium: Notable impact but manageable health/facility concerns. Includes:
  * Minor facility issues (side street potholes, single streetlight)
  * Low health risk sanitation issues (isolated garbage)
  * Non-critical infrastructure (cosmetic road damage, minor drainage)
- low: Minimal health risk and low facility importance. Includes:
  * Cosmetic issues with no health impact
  * Minor inconveniences in low-traffic areas
  * Non-urgent maintenance items

IMPORTANT: Prioritize based on:
1. HEALTH RISK (highest weight) - disease transmission, contamination, injury risk
2. FACILITY IMPORTANCE - hospitals, schools, main roads > residential streets
3. PUBLIC SAFETY - potential for accidents or harm
4. IMPACT SCALE - number of people affected

Analyze the issue and provide:
1. The most appropriate category
2. Priority level based on severity and potential impact
3. Confidence score (0.0 to 1.0)
4. Brief reasoning for your decision
5. Suggested improvements to the title (if needed)
6. Relevant tags for better searchability

Consider the context of Goa - a coastal region with monsoon seasons, tourism, and specific infrastructure challenges.

Respond ONLY with valid JSON in this exact format:
{
  "category": "category_name",
  "priority": "priority_level",
  "confidence": 0.95,
  "reasoning": "Brief explanation of the categorization",
  "suggestedTitle": "Optional improved title",
  "tags": ["tag1", "tag2", "tag3"]
}`;

/**
 * System prompt for duplicate detection
 */
const DUPLICATE_DETECTION_SYSTEM_PROMPT = `You are an AI assistant for CityPulse that detects duplicate issue reports. Your task is to determine if a new issue report is a duplicate of any existing issues.

Consider these factors:
1. Semantic similarity of titles and descriptions
2. Geographic proximity (issues within 100m are likely the same)
3. Category match
4. Temporal relevance (recent issues are more likely to be duplicates)

Two issues are duplicates if they report the SAME specific problem at the SAME location, even if worded differently.

Different issues at the same general area (e.g., different potholes on the same street) are NOT duplicates.

Respond ONLY with valid JSON in this exact format:
{
  "isDuplicate": true/false,
  "confidence": 0.95,
  "duplicateOf": "issue_id_if_duplicate",
  "reasoning": "Brief explanation"
}`;

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Call Google Gemini API with error handling and retry logic
 */
async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  maxRetries = 2,
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured");
  }

  console.log("🤖 Calling Gemini API...");
  console.log("  Model:", GEMINI_MODEL);
  console.log("  Attempt 1 of", maxRetries + 1);

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\n${userPrompt}\n\nRespond with ONLY valid JSON, no markdown formatting.`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500,
          responseMimeType: "application/json",
        },
      };

      console.log(
        "📤 Request URL:",
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY.substring(0, 10)}...`,
      );

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("📥 Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Gemini API Error:", errorData);
        throw new Error(
          `Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`,
        );
      }

      const data = await response.json();
      console.log("✅ Gemini API Response received");

      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        console.error("❌ No content in response:", data);
        throw new Error("No content in Gemini response");
      }

      console.log("✅ Successfully got AI response");
      return content;
    } catch (error) {
      console.error(`❌ Attempt ${attempt + 1} failed:`, error);
      if (attempt === maxRetries) {
        throw error;
      }
      console.log(`🔄 Retrying in ${Math.pow(2, attempt)} seconds...`);
      // Wait before retry (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000),
      );
    }
  }

  throw new Error("Failed to call Gemini API after retries");
}

/**
 * Categorize an issue using AI
 */
export async function categorizeIssue(
  request: AICategorizationRequest,
): Promise<AICategorizationResponse> {
  const userPrompt = `Please analyze this civic issue report and categorize it:

Title: ${request.title}

Description: ${request.description}

Location: ${request.location || "Not specified"}

${request.imageAnalysis ? `Image Analysis: ${request.imageAnalysis}` : ""}

Provide your analysis in JSON format.`;

  try {
    const responseContent = await callGemini(
      CATEGORIZATION_SYSTEM_PROMPT,
      userPrompt,
    );

    const parsed = JSON.parse(responseContent);

    // Validate the response
    const validCategories: IssueCategory[] = [
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

    const validPriorities: IssuePriority[] = [
      "low",
      "medium",
      "high",
      "critical",
    ];

    if (!validCategories.includes(parsed.category)) {
      parsed.category = "other";
    }

    if (!validPriorities.includes(parsed.priority)) {
      parsed.priority = "medium";
    }

    if (
      typeof parsed.confidence !== "number" ||
      parsed.confidence < 0 ||
      parsed.confidence > 1
    ) {
      parsed.confidence = 0.5;
    }

    return {
      category: parsed.category,
      priority: parsed.priority,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning || "AI categorization completed",
      suggestedTitle: parsed.suggestedTitle,
      tags: parsed.tags || [],
    };
  } catch (error) {
    console.error("Error in AI categorization:", error);

    // Fallback to rule-based categorization
    return fallbackCategorization(request);
  }
}

/**
 * Check for duplicate issues using AI
 */
export async function checkDuplicate(
  request: AIDuplicateCheckRequest,
): Promise<AIDuplicateCheckResponse> {
  // If no existing issues, can't be a duplicate
  if (!request.existingIssues || request.existingIssues.length === 0) {
    return {
      isDuplicate: false,
      confidence: 1.0,
      reasoning: "No existing issues to compare against",
    };
  }

  // Filter to nearby issues (within 500m) and same category
  const nearbyIssues = request.existingIssues.filter((issue) => {
    const distance = calculateDistance(
      request.coordinates.lat,
      request.coordinates.lng,
      issue.coordinates.lat,
      issue.coordinates.lng,
    );
    return distance <= 500 && issue.category === request.category;
  });

  if (nearbyIssues.length === 0) {
    return {
      isDuplicate: false,
      confidence: 1.0,
      reasoning: "No similar issues found nearby",
    };
  }

  const userPrompt = `Analyze if this new issue report is a duplicate of any existing issues:

NEW ISSUE:
Title: ${request.title}
Description: ${request.description}
Category: ${request.category}
Location: ${request.location}

EXISTING NEARBY ISSUES:
${nearbyIssues
  .map(
    (issue, idx) => `
${idx + 1}. [ID: ${issue.id}]
   Title: ${issue.title}
   Description: ${issue.description}
   Location: ${issue.location}
   Distance: ${Math.round(calculateDistance(request.coordinates.lat, request.coordinates.lng, issue.coordinates.lat, issue.coordinates.lng))}m away
`,
  )
  .join("\n")}

Determine if the new issue is reporting the same specific problem as any existing issue.`;

  try {
    const responseContent = await callGemini(
      DUPLICATE_DETECTION_SYSTEM_PROMPT,
      userPrompt,
    );

    const parsed = JSON.parse(responseContent);

    return {
      isDuplicate: parsed.isDuplicate || false,
      confidence: parsed.confidence || 0.5,
      duplicateOf: parsed.duplicateOf,
      reasoning: parsed.reasoning || "Duplicate check completed",
    };
  } catch (error) {
    console.error("Error in duplicate detection:", error);

    // Conservative fallback - assume not duplicate on error
    return {
      isDuplicate: false,
      confidence: 0.5,
      reasoning: "Could not perform duplicate detection due to an error",
    };
  }
}

/**
 * Fallback rule-based categorization when AI is unavailable
 */
function fallbackCategorization(
  request: AICategorizationRequest,
): AICategorizationResponse {
  const text = `${request.title} ${request.description}`.toLowerCase();

  // Simple keyword-based categorization
  const categoryKeywords: Record<IssueCategory, string[]> = {
    pothole: ["pothole", "crater", "hole in road", "road damage"],
    streetlight: [
      "street light",
      "streetlight",
      "light not working",
      "dark street",
      "lamp",
    ],
    garbage: ["garbage", "trash", "waste", "litter", "bin", "dump"],
    water_leak: ["water leak", "pipe burst", "water flowing", "tap leaking"],
    road: ["road", "pavement", "crack", "surface"],
    sanitation: ["toilet", "sewage", "sanitation", "hygiene"],
    drainage: ["drain", "flooding", "waterlogging", "blocked drain"],
    electricity: ["power", "electricity", "blackout", "transformer"],
    traffic: ["traffic", "signal", "parking", "congestion"],
    other: [],
  };

  let category: IssueCategory = "other";
  let maxMatches = 0;

  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    const matches = keywords.filter((keyword) => text.includes(keyword)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      category = cat as IssueCategory;
    }
  }

  // Simple priority determination
  let priority: IssuePriority = "medium";
  if (
    text.includes("urgent") ||
    text.includes("dangerous") ||
    text.includes("emergency")
  ) {
    priority = "high";
  } else if (
    text.includes("minor") ||
    text.includes("small") ||
    text.includes("cosmetic")
  ) {
    priority = "low";
  }

  return {
    category,
    priority,
    confidence: maxMatches > 0 ? 0.6 : 0.3,
    reasoning: "Fallback rule-based categorization (AI unavailable)",
    tags: [],
  };
}

/**
 * Check if AI service is available
 */
export function isAIServiceAvailable(): boolean {
  return !!GEMINI_API_KEY;
}

/**
 * Get AI service status
 */
export function getAIServiceStatus(): {
  available: boolean;
  model: string;
  features: string[];
} {
  return {
    available: isAIServiceAvailable(),
    model: GEMINI_MODEL,
    features: isAIServiceAvailable()
      ? [
          "categorization",
          "priority_detection",
          "duplicate_check",
          "suggestions",
        ]
      : ["fallback_categorization"],
  };
}
