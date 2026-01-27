"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  MapPin,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Activity,
  Zap,
  RefreshCw,
  Download,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface WardAnalytics {
  wardId: string;
  wardName: string;
  wardNumber: string;
  totalIssues: number;
  openIssues: number;
  inProgressIssues: number;
  resolvedIssues: number;
  criticalIssues: number;
  avgResolutionHours: number;
  categoryBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
  issuesLastWeek: number;
  issuesLastMonth: number;
  population?: number;
  metrics: {
    responseTimeHours: number;
    resolutionRate: number;
    citizenSatisfaction: number;
    slaComplianceRate: number;
    resourceUtilization: number;
    budgetSpent: number;
    allocatedBudget: number;
  };
  aiInsights?: {
    insights: string;
    recommendations: string[];
    trendAnalysis: {
      direction: "improving" | "declining" | "stable";
      keyFactors: string[];
    };
    performanceScore: number;
    priorityActions: string[];
  };
}

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

export default function WardsPage() {
  const [wards, setWards] = useState<WardAnalytics[]>([]);
  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);

  useEffect(() => {
    fetchWardAnalytics();
  }, []);

  const fetchWardAnalytics = async (analyze = false) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/wards/analytics?analyze=${analyze}`);
      const data = await response.json();

      if (data.success) {
        setWards(data.data);
        if (data.data.length > 0 && !selectedWard) {
          setSelectedWard(data.data[0].wardId);
        }
      } else {
        toast.error("Failed to fetch ward analytics");
      }
    } catch (error) {
      console.error("Error fetching ward analytics:", error);
      toast.error("Error loading ward data");
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeWithAI = async () => {
    if (!selectedWard) return;

    try {
      setIsAnalyzing(true);
      const response = await fetch("/api/wards/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wardId: selectedWard, forceAnalysis: true }),
      });

      const data = await response.json();

      if (data.success) {
        // Update the ward with AI insights
        setWards((prev) =>
          prev.map((w) =>
            w.wardId === selectedWard
              ? { ...w, aiInsights: data.data.aiInsights }
              : w
          )
        );
        setShowAIInsights(true);
        toast.success("AI Analysis completed successfully");
      } else {
        toast.error("Failed to generate AI analysis");
      }
    } catch (error) {
      console.error("Error analyzing ward:", error);
      toast.error("Error generating AI insights");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportReport = () => {
    const ward = wards.find((w) => w.wardId === selectedWard);
    if (!ward) return;

    const reportData = {
      ward: ward.wardName,
      generatedAt: new Date().toISOString(),
      summary: {
        totalIssues: ward.totalIssues,
        resolvedIssues: ward.resolvedIssues,
        openIssues: ward.openIssues,
        criticalIssues: ward.criticalIssues,
        avgResolutionTime: `${ward.avgResolutionHours.toFixed(1)} hours`,
      },
      performance: ward.metrics,
      aiInsights: ward.aiInsights,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ward-${ward.wardNumber}-report-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Report exported successfully");
  };

  const currentWard = wards.find((w) => w.wardId === selectedWard);

  // Prepare chart data
  const categoryChartData = currentWard
    ? Object.entries(currentWard.categoryBreakdown).map(([name, value]) => ({
        name: name.replace(/_/g, " ").toUpperCase(),
        value,
      }))
    : [];

  const priorityChartData = currentWard
    ? Object.entries(currentWard.priorityBreakdown).map(([name, value]) => ({
        name: name.toUpperCase(),
        value,
      }))
    : [];

  const performanceRadarData = currentWard
    ? [
        {
          metric: "Resolution Rate",
          value: currentWard.metrics.resolutionRate,
          fullMark: 100,
        },
        {
          metric: "SLA Compliance",
          value: currentWard.metrics.slaComplianceRate,
          fullMark: 100,
        },
        {
          metric: "Satisfaction",
          value: currentWard.metrics.citizenSatisfaction * 20,
          fullMark: 100,
        },
        {
          metric: "Resource Usage",
          value: currentWard.metrics.resourceUtilization,
          fullMark: 100,
        },
        {
          metric: "Budget Efficiency",
          value:
            ((currentWard.metrics.allocatedBudget -
              currentWard.metrics.budgetSpent) /
              currentWard.metrics.allocatedBudget) *
            100,
          fullMark: 100,
        },
      ]
    : [];

  const comparisonData = wards.map((w) => ({
    name: w.wardNumber,
    Issues: w.totalIssues,
    Resolved: w.resolvedIssues,
    Critical: w.criticalIssues,
    Score: w.aiInsights?.performanceScore || 0,
  }));

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Ward Management & Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered ward performance analysis and insights
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fetchWardAnalytics(false)}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportReport} disabled={!currentWard}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Ward Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Select Ward
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedWard || ""} onValueChange={setSelectedWard}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select a ward" />
            </SelectTrigger>
            <SelectContent>
              {wards.map((ward) => (
                <SelectItem key={ward.wardId} value={ward.wardId}>
                  {ward.wardNumber} - {ward.wardName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {currentWard && (
        <>
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentWard.totalIssues}</div>
                <p className="text-xs text-muted-foreground">
                  {currentWard.issuesLastWeek} new this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Resolution Rate
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currentWard.totalIssues > 0
                    ? (
                        (currentWard.resolvedIssues / currentWard.totalIssues) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground">
                  {currentWard.resolvedIssues} of {currentWard.totalIssues} resolved
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Resolution Time
                </CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currentWard.avgResolutionHours.toFixed(1)}h
                </div>
                <p className="text-xs text-muted-foreground">
                  Target: 24-48 hours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Critical Issues
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {currentWard.criticalIssues}
                </div>
                <p className="text-xs text-muted-foreground">
                  Require immediate attention
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Citizen Satisfaction
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currentWard.metrics.citizenSatisfaction.toFixed(1)}/5
                </div>
                <div className="flex gap-1 mt-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 flex-1 rounded ${
                        i < Math.round(currentWard.metrics.citizenSatisfaction)
                          ? "bg-yellow-400"
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  SLA Compliance
                </CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currentWard.metrics.slaComplianceRate.toFixed(1)}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${
                      currentWard.metrics.slaComplianceRate >= 90
                        ? "bg-green-500"
                        : currentWard.metrics.slaComplianceRate >= 75
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                    style={{
                      width: `${currentWard.metrics.slaComplianceRate}%`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Budget Utilization
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(
                    (currentWard.metrics.budgetSpent /
                      currentWard.metrics.allocatedBudget) *
                    100
                  ).toFixed(1)}
                  %
                </div>
                <p className="text-xs text-muted-foreground">
                  ${currentWard.metrics.budgetSpent.toLocaleString()} of $
                  {currentWard.metrics.allocatedBudget.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights Section */}
          <Card className="border-2 border-purple-200 dark:border-purple-900">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  <CardTitle>AI-Powered Insights</CardTitle>
                </div>
                <Button
                  onClick={analyzeWithAI}
                  disabled={isAnalyzing}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate AI Analysis
                    </>
                  )}
                </Button>
              </div>
              <CardDescription>
                Powered by Google Gemini AI for deep performance insights
              </CardDescription>
            </CardHeader>
            {currentWard.aiInsights && showAIInsights && (
              <CardContent className="space-y-4">
                {/* Performance Score */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Performance Score
                    </p>
                    <p className="text-3xl font-bold">
                      {currentWard.aiInsights.performanceScore}/100
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentWard.aiInsights.trendAnalysis.direction ===
                    "improving" ? (
                      <TrendingUp className="h-8 w-8 text-green-500" />
                    ) : currentWard.aiInsights.trendAnalysis.direction ===
                      "declining" ? (
                      <TrendingDown className="h-8 w-8 text-red-500" />
                    ) : (
                      <Activity className="h-8 w-8 text-yellow-500" />
                    )}
                    <Badge
                      variant="outline"
                      className={
                        currentWard.aiInsights.trendAnalysis.direction ===
                        "improving"
                          ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"
                          : currentWard.aiInsights.trendAnalysis.direction ===
                              "declining"
                            ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300"
                            : "bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300"
                      }
                    >
                      {currentWard.aiInsights.trendAnalysis.direction.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {/* Insights */}
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Key Insights
                  </h4>
                  <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                    {currentWard.aiInsights.insights}
                  </p>
                </div>

                {/* Recommendations */}
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {currentWard.aiInsights.recommendations.map((rec, i) => (
                      <li
                        key={i}
                        className="text-sm flex items-start gap-2 p-2 hover:bg-muted rounded"
                      >
                        <span className="text-purple-500 mt-0.5">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Priority Actions */}
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Priority Actions
                  </h4>
                  <div className="space-y-2">
                    {currentWard.aiInsights.priorityActions.map((action, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900"
                      >
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold">
                          {i + 1}
                        </span>
                        <span className="text-sm">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Factors */}
                <div className="space-y-2">
                  <h4 className="font-semibold">Key Factors</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentWard.aiInsights.trendAnalysis.keyFactors.map(
                      (factor, i) => (
                        <Badge key={i} variant="outline">
                          {factor}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Analytics Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="comparison">Comparison</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Category Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Issues by Category</CardTitle>
                    <CardDescription>
                      Distribution of issues across categories
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Priority Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Issues by Priority</CardTitle>
                    <CardDescription>
                      Priority level distribution
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={priorityChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Radar</CardTitle>
                  <CardDescription>
                    Multi-dimensional performance analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={performanceRadarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar
                        name="Performance"
                        dataKey="value"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.6}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Ward Comparison</CardTitle>
                  <CardDescription>
                    Compare performance across all wards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Issues" fill="#3b82f6" />
                      <Bar dataKey="Resolved" fill="#10b981" />
                      <Bar dataKey="Critical" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Trend Analysis</CardTitle>
                  <CardDescription>
                    Recent activity trends and patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart
                      data={[
                        {
                          name: "Week 1",
                          issues: Math.round(
                            currentWard.issuesLastMonth * 0.2
                          ),
                        },
                        {
                          name: "Week 2",
                          issues: Math.round(
                            currentWard.issuesLastMonth * 0.25
                          ),
                        },
                        {
                          name: "Week 3",
                          issues: Math.round(
                            currentWard.issuesLastMonth * 0.3
                          ),
                        },
                        {
                          name: "Week 4",
                          issues: currentWard.issuesLastWeek,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="issues"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
