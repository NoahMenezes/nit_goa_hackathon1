// Gemini AI Integration for OurStreet Civic Issue Categorization
// Uses Google Gemini 1.5 Pro/Flash for intelligent issue classification

import { IssueCategory, IssuePriority } from "./types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface AICategorization {
  category: IssueCategory;
  priority: IssuePriority;
  confidence: number;
  reasoning: string;
  suggestedTitle?: string;
  tags?: string[];
  severityScore: number; // 0-100
  urgencyScore: number; // 0-100
}

export interface CategorizationInput {
  title: string;
  description: string;
  location?: string;
  ward?: string;
  imageUrls?: string[];
  existingIssuesInArea?: number;
}

// Category keywords for better classification
const CATEGORY_KEYWORDS: Record<IssueCategory, string[]> = {
  pothole: [
    "pothole",
    "hole",
    "crack",
    "damaged road",
    "road damage",
    "crater",
    "pit",
    "depression",
    "cavity",
  ],
  streetlight: [
    "streetlight",
    "lamp",
    "light",
    "lighting",
    "bulb",
    "pole",
    "illumination",
    "dark",
    "not working",
  ],
  garbage: [
    "garbage",
    "trash",
    "waste",
    "litter",
    "rubbish",
    "dump",
    "disposal",
    "dustbin",
    "cleanup",
  ],
  water_leak: [
    "water leak",
    "leak",
    "pipe",
    "burst",
    "overflow",
    "flooding",
    "water supply",
    "pipeline",
  ],
  road: [
    "road",
    "street",
    "pavement",
    "footpath",
    "sidewalk",
    "pathway",
    "traffic",
    "highway",
  ],
  sanitation: [
    "sanitation",
    "toilet",
    "sewage",
    "drain",
    "hygiene",
    "cleaning",
    "sewer",
    "septic",
  ],
  drainage: [
    "drainage",
    "drain",
    "clogged",
    "blocked",
    "waterlogging",
    "overflow",
    "gutter",
    "stormwater",
  ],
  electricity: [
    "electricity",
    "power",
    "electric",
    "wire",
    "cable",
    "transformer",
    "outage",
    "blackout",
  ],
  traffic: [
    "traffic",
    "signal",
    "sign",
    "congestion",
    "jam",
    "accident",
    "crossing",
    "junction",
  ],
  other: ["other", "miscellaneous", "general", "various"],
};

// Urgency indicators for priority calculation
const URGENCY_INDICATORS = {
  critical: [
    "emergency",
    "urgent",
    "dangerous",
    "hazard",
    "immediate",
    "critical",
    "life-threatening",
    "accident",
    "injury",
    "unsafe",
  ],
  high: [
    "severe",
    "major",
    "serious",
    "broken",
    "burst",
    "flooding",
    "blocked",
    "damage",
  ],
  medium: [
    "moderate",
    "need repair",
    "fix",
    "maintenance",
    "issue",
    "problem",
    "concern",
  ],
  low: ["minor", "small", "little", "cosmetic", "aesthetic", "improvement"],
};

/**
 * Categorize issue using Gemini AI
 */
export async function categorizeIssue(
  input: CategorizationInput,
): Promise<AICategorization> {
  if (!GEMINI_API_KEY) {
    console.warn("Gemini API key not found, using fallback categorization");
    return fallbackCategorization(input);
  }

  try {
    const prompt = buildPrompt(input);
    const response = await callGeminiAPI(prompt, input.imageUrls);

    if (!response) {
      throw new Error("Empty response from Gemini API");
    }

    const result = parseGeminiResponse(response);

    // Enhance with frequency data if available
    if (input.existingIssuesInArea && input.existingIssuesInArea > 5) {
      result.urgencyScore = Math.min(100, result.urgencyScore + 15);
      result.reasoning += ` This area has ${input.existingIssuesInArea} existing issues, increasing urgency.`;
    }

    return result;
  } catch (error) {
    console.error("Error in AI categorization:", error);
    // Fallback to rule-based categorization
    return fallbackCategorization(input);
  }
}

/**
 * Build prompt for Gemini AI
 */
function buildPrompt(input: CategorizationInput): string {
  const categories = Object.keys(CATEGORY_KEYWORDS).join(", ");

  return `You are an expert civic issue classifier for a municipal complaint system. Analyze the following civic issue report and provide a detailed categorization.

**Issue Title:** ${input.title}

**Issue Description:** ${input.description}

${input.location ? `**Location:** ${input.location}` : ""}
${input.ward ? `**Ward/Area:** ${input.ward}` : ""}

**Available Categories:** ${categories}

**Priority Levels:** critical, high, medium, low

Please analyze this issue and respond in the following JSON format:
{
  "category": "one of the available categories",
  "priority": "critical, high, medium, or low",
  "confidence": 0.95,
  "reasoning": "Brief explanation of why this category and priority were chosen",
  "suggestedTitle": "A clearer, more descriptive title if the original is vague",
  "tags": ["tag1", "tag2", "tag3"],
  "severityScore": 85,
  "urgencyScore": 90
}

**Scoring Guidelines:**
- severityScore (0-100): How severe is the damage/impact?
- urgencyScore (0-100): How quickly does this need attention?

**Priority Assignment:**
- critical: Immediate danger, safety hazard, affects many people (urgencyScore > 85)
- high: Significant impact, needs prompt attention (urgencyScore 60-85)
- medium: Moderate issue, normal processing (urgencyScore 30-60)
- low: Minor issue, can wait (urgencyScore < 30)

Consider factors like:
1. Public safety risk
2. Impact on daily life
3. Number of people affected
4. Potential for escalation
5. Infrastructure criticality

Respond ONLY with valid JSON, no additional text.`;
}

/**
 * Call Gemini API
 */
async function callGeminiAPI(
  prompt: string,
  imageUrls?: string[],
): Promise<string> {
  const parts: Array<{ text: string }> = [{ text: prompt }];

  // Add images if provided (for future enhancement)
  if (imageUrls && imageUrls.length > 0) {
    // Note: Image support would require base64 encoding
    // For now, we'll just note it in the prompt
    parts[0].text += `\n\n**Note:** ${imageUrls.length} image(s) provided for visual context.`;
  }

  const requestBody = {
    contents: [
      {
        parts,
      },
    ],
    generationConfig: {
      temperature: 0.4, // Lower temperature for more consistent categorization
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
    ],
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error("Invalid response structure from Gemini API");
  }

  const text = data.candidates[0].content.parts[0].text;
  return text;
}

/**
 * Parse Gemini response
 */
function parseGeminiResponse(response: string): AICategorization {
  try {
    // Remove markdown code blocks if present
    let cleanedResponse = response.trim();
    if (cleanedResponse.startsWith("```json")) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, "");
    }
    if (cleanedResponse.startsWith("```")) {
      cleanedResponse = cleanedResponse.replace(/```\n?/g, "");
    }
    if (cleanedResponse.endsWith("```")) {
      cleanedResponse = cleanedResponse.slice(0, -3);
    }

    const parsed = JSON.parse(cleanedResponse.trim());

    // Validate and normalize
    return {
      category: validateCategory(parsed.category),
      priority: validatePriority(parsed.priority),
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.7)),
      reasoning: parsed.reasoning || "AI-based categorization",
      suggestedTitle: parsed.suggestedTitle,
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
      severityScore: Math.min(100, Math.max(0, parsed.severityScore || 50)),
      urgencyScore: Math.min(100, Math.max(0, parsed.urgencyScore || 50)),
    };
  } catch (error) {
    console.error("Error parsing Gemini response:", error);
    throw new Error("Failed to parse AI response");
  }
}

/**
 * Fallback categorization using rule-based approach
 */
function fallbackCategorization(input: CategorizationInput): AICategorization {
  const text = `${input.title} ${input.description}`.toLowerCase();

  // Find best matching category
  let bestCategory: IssueCategory = "other";
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.filter((keyword) => text.includes(keyword)).length;
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category as IssueCategory;
    }
  }

  // Calculate priority based on urgency indicators
  let urgencyScore = 30; // Default medium-low

  for (const [level, indicators] of Object.entries(URGENCY_INDICATORS)) {
    const matches = indicators.filter((indicator) => text.includes(indicator));
    if (matches.length > 0) {
      switch (level) {
        case "critical":
          urgencyScore = Math.max(urgencyScore, 90);
          break;
        case "high":
          urgencyScore = Math.max(urgencyScore, 70);
          break;
        case "medium":
          urgencyScore = Math.max(urgencyScore, 45);
          break;
        case "low":
          urgencyScore = Math.min(urgencyScore, 25);
          break;
      }
    }
  }

  const priority = scoreToPriority(urgencyScore);

  return {
    category: bestCategory,
    priority,
    confidence: bestScore > 0 ? 0.6 : 0.3,
    reasoning: `Rule-based categorization. Matched ${bestScore} keywords for ${bestCategory}.`,
    tags: extractTags(text),
    severityScore: urgencyScore - 10,
    urgencyScore,
  };
}

/**
 * Convert urgency score to priority level
 */
function scoreToPriority(score: number): IssuePriority {
  if (score >= 85) return "critical";
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

/**
 * Extract tags from text
 */
function extractTags(text: string): string[] {
  const tags: string[] = [];

  if (text.includes("road") || text.includes("street")) tags.push("road");
  if (text.includes("urgent") || text.includes("immediate"))
    tags.push("urgent");
  if (text.includes("water")) tags.push("water");
  if (text.includes("electric")) tags.push("electrical");
  if (text.includes("danger") || text.includes("unsafe")) tags.push("safety");

  return tags.slice(0, 5);
}

/**
 * Validate category
 */
function validateCategory(category: string): IssueCategory {
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

  if (validCategories.includes(category as IssueCategory)) {
    return category as IssueCategory;
  }

  return "other";
}

/**
 * Validate priority
 */
function validatePriority(priority: string): IssuePriority {
  const validPriorities: IssuePriority[] = [
    "low",
    "medium",
    "high",
    "critical",
  ];

  if (validPriorities.includes(priority as IssuePriority)) {
    return priority as IssuePriority;
  }

  return "medium";
}

/**
 * Analyze issue frequency in an area
 */
export async function analyzeAreaFrequency(
  coordinates: { lat: number; lng: number },
  radius: number = 0.01, // ~1km
): Promise<number> {
  // This would query the database for issues near these coordinates
  // For now, return 0 as placeholder
  // TODO: Implement actual database query with radius parameter
  console.log(
    "Analyzing area frequency for coordinates:",
    coordinates,
    "within radius:",
    radius,
  );
  return 0;
}
