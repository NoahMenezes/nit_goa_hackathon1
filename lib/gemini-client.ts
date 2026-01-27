// Gemini AI Client for Analytics and Insights
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

if (!GEMINI_API_KEY) {
  console.warn("Warning: GEMINI_API_KEY not set in environment variables");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export interface WardAnalyticsData {
  wardName: string;
  wardNumber: string;
  totalIssues: number;
  openIssues: number;
  resolvedIssues: number;
  inProgressIssues: number;
  criticalIssues: number;
  avgResolutionHours: number;
  categoryBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
  issuesLastWeek: number;
  issuesLastMonth: number;
  population?: number;
}

export interface PerformanceMetrics {
  responseTimeHours: number;
  resolutionRate: number;
  citizenSatisfaction: number;
  slaComplianceRate: number;
  resourceUtilization: number;
  budgetSpent: number;
  allocatedBudget: number;
}

export interface AIAnalysisResult {
  insights: string;
  recommendations: string[];
  trendAnalysis: {
    direction: "improving" | "declining" | "stable";
    keyFactors: string[];
  };
  performanceScore: number;
  priorityActions: string[];
}

export interface ImpactReportData {
  wardName: string;
  periodStart: string;
  periodEnd: string;
  issuesAddressed: number;
  citizensImpacted: number;
  costSavings: number;
  efficiencyImprovement: number;
  beforeMetrics: Partial<PerformanceMetrics>;
  afterMetrics: Partial<PerformanceMetrics>;
}

export class GeminiAnalyticsClient {
  private model;
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = !!GEMINI_API_KEY;
    if (this.isConfigured) {
      this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }
  }

  /**
   * Analyze ward performance data and generate insights
   */
  async analyzeWardPerformance(
    data: WardAnalyticsData,
    metrics: PerformanceMetrics
  ): Promise<AIAnalysisResult> {
    if (!this.isConfigured) {
      return this.getFallbackAnalysis(data, metrics);
    }

    try {
      const prompt = this.buildWardAnalysisPrompt(data, metrics);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseAnalysisResponse(text, data, metrics);
    } catch (error) {
      console.error("Gemini API error:", error);
      return this.getFallbackAnalysis(data, metrics);
    }
  }

  /**
   * Generate comparative analysis across multiple wards
   */
  async compareWards(
    wards: Array<WardAnalyticsData & { metrics: PerformanceMetrics }>
  ): Promise<{
    summary: string;
    rankings: Array<{ wardName: string; rank: number; score: number }>;
    insights: string[];
  }> {
    if (!this.isConfigured) {
      return this.getFallbackComparison(wards);
    }

    try {
      const prompt = this.buildComparisonPrompt(wards);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseComparisonResponse(text, wards);
    } catch (error) {
      console.error("Gemini API error:", error);
      return this.getFallbackComparison(wards);
    }
  }

  /**
   * Generate impact report with AI-powered insights
   */
  async generateImpactReport(
    data: ImpactReportData
  ): Promise<{
    summary: string;
    keyAchievements: string[];
    challenges: string[];
    recommendations: string[];
    impactScore: number;
  }> {
    if (!this.isConfigured) {
      return this.getFallbackImpactReport(data);
    }

    try {
      const prompt = this.buildImpactReportPrompt(data);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseImpactReportResponse(text, data);
    } catch (error) {
      console.error("Gemini API error:", error);
      return this.getFallbackImpactReport(data);
    }
  }

  /**
   * Predict future trends based on historical data
   */
  async predictTrends(
    historicalData: Array<{
      date: string;
      issues: number;
      resolved: number;
      category: string;
    }>
  ): Promise<{
    predictions: Array<{ period: string; expectedIssues: number }>;
    confidence: number;
    factors: string[];
  }> {
    if (!this.isConfigured || historicalData.length < 7) {
      return this.getFallbackPrediction(historicalData);
    }

    try {
      const prompt = this.buildPredictionPrompt(historicalData);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parsePredictionResponse(text, historicalData);
    } catch (error) {
      console.error("Gemini API error:", error);
      return this.getFallbackPrediction(historicalData);
    }
  }

  /**
   * Generate resource allocation recommendations
   */
  async recommendResourceAllocation(
    wardData: WardAnalyticsData,
    availableResources: {
      staff: number;
      budget: number;
      equipment: string[];
    }
  ): Promise<{
    staffAllocation: Array<{ category: string; count: number }>;
    budgetAllocation: Array<{ category: string; amount: number }>;
    equipmentNeeds: string[];
    reasoning: string;
  }> {
    if (!this.isConfigured) {
      return this.getFallbackResourceRecommendation(wardData, availableResources);
    }

    try {
      const prompt = this.buildResourcePrompt(wardData, availableResources);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseResourceResponse(text, wardData, availableResources);
    } catch (error) {
      console.error("Gemini API error:", error);
      return this.getFallbackResourceRecommendation(wardData, availableResources);
    }
  }

  // Private helper methods
  private buildWardAnalysisPrompt(
    data: WardAnalyticsData,
    metrics: PerformanceMetrics
  ): string {
    return `
You are an AI analyst for a civic issue management system. Analyze the following ward performance data and provide actionable insights.

Ward: ${data.wardName} (${data.wardNumber})
Population: ${data.population || "N/A"}

Issue Statistics:
- Total Issues: ${data.totalIssues}
- Open: ${data.openIssues}
- In Progress: ${data.inProgressIssues}
- Resolved: ${data.resolvedIssues}
- Critical: ${data.criticalIssues}
- Average Resolution Time: ${data.avgResolutionHours.toFixed(1)} hours

Category Breakdown: ${JSON.stringify(data.categoryBreakdown)}
Priority Breakdown: ${JSON.stringify(data.priorityBreakdown)}

Recent Trends:
- Issues Last Week: ${data.issuesLastWeek}
- Issues Last Month: ${data.issuesLastMonth}

Performance Metrics:
- Response Time: ${metrics.responseTimeHours.toFixed(1)} hours
- Resolution Rate: ${metrics.resolutionRate.toFixed(1)}%
- Citizen Satisfaction: ${metrics.citizenSatisfaction.toFixed(1)}/5
- SLA Compliance: ${metrics.slaComplianceRate.toFixed(1)}%
- Resource Utilization: ${metrics.resourceUtilization.toFixed(1)}%
- Budget Utilization: ${((metrics.budgetSpent / metrics.allocatedBudget) * 100).toFixed(1)}%

Please provide:
1. A concise summary of the ward's performance (2-3 sentences)
2. 3-5 specific, actionable recommendations
3. Trend analysis indicating if performance is improving, declining, or stable
4. Key factors affecting performance
5. A performance score out of 100
6. Top 3 priority actions

Format your response as JSON with keys: insights, recommendations (array), trendDirection, trendFactors (array), performanceScore, priorityActions (array)
`;
  }

  private buildComparisonPrompt(
    wards: Array<WardAnalyticsData & { metrics: PerformanceMetrics }>
  ): string {
    const wardSummaries = wards.map(
      (w) => `
${w.wardName}: ${w.resolvedIssues}/${w.totalIssues} resolved (${((w.resolvedIssues / w.totalIssues) * 100).toFixed(1)}%),
Resolution Time: ${w.avgResolutionHours.toFixed(1)}h, Satisfaction: ${w.metrics.citizenSatisfaction.toFixed(1)}/5
`
    );

    return `
Compare the performance of these wards and provide rankings:

${wardSummaries.join("\n")}

Provide:
1. A summary comparing overall performance
2. Rankings with scores (0-100) for each ward
3. Key insights about best and worst performers
4. Recommendations for improvement

Format as JSON with keys: summary, rankings (array with wardName, rank, score), insights (array)
`;
  }

  private buildImpactReportPrompt(data: ImpactReportData): string {
    return `
Generate an impact report for ward ${data.wardName} for the period ${data.periodStart} to ${data.periodEnd}.

Metrics:
- Issues Addressed: ${data.issuesAddressed}
- Citizens Impacted: ${data.citizensImpacted}
- Cost Savings: $${data.costSavings.toLocaleString()}
- Efficiency Improvement: ${data.efficiencyImprovement}%

Before Metrics: ${JSON.stringify(data.beforeMetrics)}
After Metrics: ${JSON.stringify(data.afterMetrics)}

Provide:
1. Executive summary (3-4 sentences)
2. 4-6 key achievements
3. 3-5 challenges faced
4. 3-5 recommendations for future
5. Overall impact score (0-100)

Format as JSON with keys: summary, keyAchievements (array), challenges (array), recommendations (array), impactScore
`;
  }

  private buildPredictionPrompt(
    historicalData: Array<{
      date: string;
      issues: number;
      resolved: number;
      category: string;
    }>
  ): string {
    return `
Based on this historical data, predict issue trends for the next 4 weeks:

${historicalData.map((d) => `${d.date}: ${d.issues} issues (${d.category})`).join("\n")}

Provide:
1. Weekly predictions for the next 4 weeks
2. Confidence level (0-100)
3. Key factors influencing the trend

Format as JSON with keys: predictions (array with period, expectedIssues), confidence, factors (array)
`;
  }

  private buildResourcePrompt(
    wardData: WardAnalyticsData,
    availableResources: {
      staff: number;
      budget: number;
      equipment: string[];
    }
  ): string {
    return `
Given this ward data and available resources, recommend optimal allocation:

Ward: ${wardData.wardName}
Issue Categories: ${JSON.stringify(wardData.categoryBreakdown)}
Critical Issues: ${wardData.criticalIssues}

Available Resources:
- Staff: ${availableResources.staff}
- Budget: $${availableResources.budget.toLocaleString()}
- Equipment: ${availableResources.equipment.join(", ")}

Recommend:
1. Staff allocation by category
2. Budget allocation by category
3. Additional equipment needs
4. Reasoning for allocations

Format as JSON with keys: staffAllocation (array), budgetAllocation (array), equipmentNeeds (array), reasoning
`;
  }

  private parseAnalysisResponse(
    text: string,
    data: WardAnalyticsData,
    metrics: PerformanceMetrics
  ): AIAnalysisResult {
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        return {
          insights: parsed.insights || "Analysis completed",
          recommendations: parsed.recommendations || [],
          trendAnalysis: {
            direction: parsed.trendDirection || "stable",
            keyFactors: parsed.trendFactors || [],
          },
          performanceScore: parsed.performanceScore || this.calculatePerformanceScore(data, metrics),
          priorityActions: parsed.priorityActions || [],
        };
      }
    } catch (error) {
      console.error("Failed to parse Gemini response:", error);
    }

    return this.getFallbackAnalysis(data, metrics);
  }

  private parseComparisonResponse(
    text: string,
    wards: Array<WardAnalyticsData & { metrics: PerformanceMetrics }>
  ): {
    summary: string;
    rankings: Array<{ wardName: string; rank: number; score: number }>;
    insights: string[];
  } {
    try {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
    } catch (error) {
      console.error("Failed to parse comparison response:", error);
    }

    return this.getFallbackComparison(wards);
  }

  private parseImpactReportResponse(
    text: string,
    data: ImpactReportData
  ): {
    summary: string;
    keyAchievements: string[];
    challenges: string[];
    recommendations: string[];
    impactScore: number;
  } {
    try {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
    } catch (error) {
      console.error("Failed to parse impact report:", error);
    }

    return this.getFallbackImpactReport(data);
  }

  private parsePredictionResponse(
    text: string,
    historicalData: Array<{
      date: string;
      issues: number;
      resolved: number;
      category: string;
    }>
  ): {
    predictions: Array<{ period: string; expectedIssues: number }>;
    confidence: number;
    factors: string[];
  } {
    try {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
    } catch (error) {
      console.error("Failed to parse prediction:", error);
    }

    return this.getFallbackPrediction(historicalData);
  }

  private parseResourceResponse(
    text: string,
    wardData: WardAnalyticsData,
    availableResources: {
      staff: number;
      budget: number;
      equipment: string[];
    }
  ): {
    staffAllocation: Array<{ category: string; count: number }>;
    budgetAllocation: Array<{ category: string; amount: number }>;
    equipmentNeeds: string[];
    reasoning: string;
  } {
    try {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
    } catch (error) {
      console.error("Failed to parse resource response:", error);
    }

    return this.getFallbackResourceRecommendation(wardData, availableResources);
  }

  private calculatePerformanceScore(
    data: WardAnalyticsData,
    metrics: PerformanceMetrics
  ): number {
    const resolutionRate = (data.resolvedIssues / Math.max(data.totalIssues, 1)) * 100;
    const satisfactionScore = (metrics.citizenSatisfaction / 5) * 100;
    const slaScore = metrics.slaComplianceRate;
    const efficiencyScore = 100 - Math.min((data.avgResolutionHours / 72) * 100, 100);

    return Math.round(
      resolutionRate * 0.3 +
      satisfactionScore * 0.25 +
      slaScore * 0.25 +
      efficiencyScore * 0.2
    );
  }

  private getFallbackAnalysis(
    data: WardAnalyticsData,
    metrics: PerformanceMetrics
  ): AIAnalysisResult {
    const score = this.calculatePerformanceScore(data, metrics);
    const resolutionRate = (data.resolvedIssues / Math.max(data.totalIssues, 1)) * 100;

    const recommendations: string[] = [];
    if (data.criticalIssues > data.totalIssues * 0.1) {
      recommendations.push("Prioritize critical issues - they exceed 10% of total issues");
    }
    if (metrics.slaComplianceRate < 90) {
      recommendations.push("Improve SLA compliance through better resource allocation");
    }
    if (data.avgResolutionHours > 48) {
      recommendations.push("Reduce average resolution time with process optimization");
    }
    if (metrics.citizenSatisfaction < 4.0) {
      recommendations.push("Enhance citizen communication and engagement");
    }

    return {
      insights: `Ward ${data.wardName} has ${resolutionRate.toFixed(1)}% resolution rate with ${data.openIssues} open issues. Performance score: ${score}/100.`,
      recommendations: recommendations.length > 0 ? recommendations : ["Continue current practices"],
      trendAnalysis: {
        direction: data.issuesLastWeek > data.issuesLastMonth / 4 ? "declining" : "improving",
        keyFactors: ["Issue volume", "Resolution capacity", "Resource availability"],
      },
      performanceScore: score,
      priorityActions: recommendations.slice(0, 3),
    };
  }

  private getFallbackComparison(
    wards: Array<WardAnalyticsData & { metrics: PerformanceMetrics }>
  ): {
    summary: string;
    rankings: Array<{ wardName: string; rank: number; score: number }>;
    insights: string[];
  } {
    const rankings = wards
      .map((w) => ({
        wardName: w.wardName,
        rank: 0,
        score: this.calculatePerformanceScore(w, w.metrics),
      }))
      .sort((a, b) => b.score - a.score)
      .map((w, i) => ({ ...w, rank: i + 1 }));

    return {
      summary: `Analyzed ${wards.length} wards. Top performer: ${rankings[0].wardName} with ${rankings[0].score}/100.`,
      rankings,
      insights: [
        `${rankings[0].wardName} leads with highest performance score`,
        `Average performance score across wards: ${(rankings.reduce((sum, r) => sum + r.score, 0) / rankings.length).toFixed(1)}`,
        "Focus on improving lower-performing wards through resource reallocation",
      ],
    };
  }

  private getFallbackImpactReport(data: ImpactReportData): {
    summary: string;
    keyAchievements: string[];
    challenges: string[];
    recommendations: string[];
    impactScore: number;
  } {
    return {
      summary: `Ward ${data.wardName} addressed ${data.issuesAddressed} issues affecting ${data.citizensImpacted} citizens during ${data.periodStart} to ${data.periodEnd}.`,
      keyAchievements: [
        `Resolved ${data.issuesAddressed} civic issues`,
        `Impacted ${data.citizensImpacted} citizens positively`,
        `Achieved cost savings of $${data.costSavings.toLocaleString()}`,
        `Improved efficiency by ${data.efficiencyImprovement}%`,
      ],
      challenges: [
        "Managing high issue volume during peak periods",
        "Balancing resource allocation across categories",
        "Maintaining citizen satisfaction standards",
      ],
      recommendations: [
        "Implement predictive maintenance to reduce reactive issues",
        "Enhance citizen communication channels",
        "Optimize resource scheduling based on demand patterns",
      ],
      impactScore: Math.min(75 + data.efficiencyImprovement, 100),
    };
  }

  private getFallbackPrediction(
    historicalData: Array<{
      date: string;
      issues: number;
      resolved: number;
      category: string;
    }>
  ): {
    predictions: Array<{ period: string; expectedIssues: number }>;
    confidence: number;
    factors: string[];
  } {
    const avgIssues =
      historicalData.reduce((sum, d) => sum + d.issues, 0) / historicalData.length;

    return {
      predictions: [
        { period: "Week 1", expectedIssues: Math.round(avgIssues * 0.95) },
        { period: "Week 2", expectedIssues: Math.round(avgIssues) },
        { period: "Week 3", expectedIssues: Math.round(avgIssues * 1.05) },
        { period: "Week 4", expectedIssues: Math.round(avgIssues * 1.1) },
      ],
      confidence: 65,
      factors: ["Historical trends", "Seasonal patterns", "Current open issues"],
    };
  }

  private getFallbackResourceRecommendation(
    wardData: WardAnalyticsData,
    availableResources: {
      staff: number;
      budget: number;
      equipment: string[];
    }
  ): {
    staffAllocation: Array<{ category: string; count: number }>;
    budgetAllocation: Array<{ category: string; amount: number }>;
    equipmentNeeds: string[];
    reasoning: string;
  } {
    const categories = Object.keys(wardData.categoryBreakdown);
    const totalIssues = Object.values(wardData.categoryBreakdown).reduce(
      (sum, count) => sum + count,
      0
    );

    const staffAllocation = categories.map((cat) => ({
      category: cat,
      count: Math.max(
        1,
        Math.round(
          (wardData.categoryBreakdown[cat] / totalIssues) * availableResources.staff
        )
      ),
    }));

    const budgetAllocation = categories.map((cat) => ({
      category: cat,
      amount: Math.round(
        (wardData.categoryBreakdown[cat] / totalIssues) * availableResources.budget
      ),
    }));

    return {
      staffAllocation,
      budgetAllocation,
      equipmentNeeds: ["Basic maintenance tools", "Communication devices"],
      reasoning:
        "Resource allocation based on proportional distribution according to issue category volumes",
    };
  }
}

// Export singleton instance
export const geminiClient = new GeminiAnalyticsClient();
