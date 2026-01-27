"use client";

import { useEffect, useState, useCallback } from "react";
import { Navigation } from "@/components/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Download,
  Calendar,
  Target,
  Activity,
} from "lucide-react";
import { toast } from "sonner";

interface WardAnalytics {
  ward: string;
  totalIssues: number;
  openIssues: number;
  inProgressIssues: number;
  resolvedIssues: number;
  averageResolutionTime: number;
  resolutionRate: number;
  categoryBreakdown: { category: string; count: number }[];
  priorityBreakdown: { priority: string; count: number }[];
}

interface IssueHotspot {
  location: string;
  ward?: string;
  issueCount: number;
  categories: string[];
  severity: "low" | "medium" | "high" | "critical";
}

interface CategoryPerformance {
  category: string;
  totalIssues: number;
  resolvedIssues: number;
  averageResolutionTime: number;
}

interface ImpactReport {
  dateRange: { start: string; end: string };
  summary: {
    totalIssues: number;
    resolvedIssues: number;
    averageResolutionTime: number;
    resolutionRate: number;
  };
  wardAnalytics: WardAnalytics[];
  hotspots: IssueHotspot[];
  categoryPerformance: CategoryPerformance[];
}

export default function AnalyticsPage() {
  const [report, setReport] = useState<ImpactReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"30" | "90" | "365" | "all">("30");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login to view analytics");
        return;
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      if (dateRange !== "all") {
        startDate.setDate(startDate.getDate() - parseInt(dateRange));
      } else {
        startDate.setFullYear(startDate.getFullYear() - 10); // Go back 10 years for "all"
      }

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const response = await fetch(`/api/analytics/impact-report?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setReport(data.data);
      } else {
        toast.error(data.error || "Failed to load analytics");
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleExport = () => {
    if (!report) return;

    const csvData = generateCSVReport(report);
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `impact-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Report exported successfully");
  };

  const generateCSVReport = (report: ImpactReport): string => {
    let csv = "OurStreet Impact Report\n\n";
    csv += `Date Range:,${new Date(report.dateRange.start).toLocaleDateString()},to,${new Date(report.dateRange.end).toLocaleDateString()}\n\n`;
    csv += "Summary Statistics\n";
    csv += `Total Issues,${report.summary.totalIssues}\n`;
    csv += `Resolved Issues,${report.summary.resolvedIssues}\n`;
    csv += `Resolution Rate,${report.summary.resolutionRate}%\n`;
    csv += `Average Resolution Time,${report.summary.averageResolutionTime} days\n\n`;

    csv += "Ward-wise Performance\n";
    csv +=
      "Ward,Total Issues,Open,In Progress,Resolved,Resolution Rate,Avg Resolution Time\n";
    report.wardAnalytics.forEach((ward) => {
      csv += `${ward.ward},${ward.totalIssues},${ward.openIssues},${ward.inProgressIssues},${ward.resolvedIssues},${ward.resolutionRate}%,${ward.averageResolutionTime} days\n`;
    });

    return csv;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200";
      default:
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200";
    }
  };

  const formatTime = (days: number): string => {
    if (days < 1) return `${Math.round(days * 24)}h`;
    if (days < 7) return `${Math.round(days)}d`;
    if (days < 30) return `${Math.round(days / 7)}w`;
    return `${Math.round(days / 30)}mo`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex flex-1 items-center justify-center min-h-[calc(100vh-3.5rem)]">
          <div className="text-center">
            <Activity className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex flex-1 items-center justify-center min-h-[calc(100vh-3.5rem)]">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <p className="text-muted-foreground">No analytics data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-6 max-w-full">
        <div className="flex flex-col gap-4 md:gap-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <BarChart3 className="h-8 w-8 text-primary" />
                Impact Reports & Analytics
              </h1>
              <p className="text-muted-foreground mt-1">
                Comprehensive performance metrics and ward-wise analytics
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={dateRange}
                onValueChange={(value) =>
                  setDateRange(value as "30" | "90" | "365" | "all")
                }
              >
                <SelectTrigger className="w-[180px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                  <SelectItem value="365">Last Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleExport} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="transition-all duration-300 ease-out hover:scale-[1.03] hover:-translate-y-1 hover:shadow-xl cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Issues
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {report.summary.totalIssues}
                </div>
                <p className="text-xs text-muted-foreground">
                  {report.dateRange.start.split("T")[0]} to{" "}
                  {report.dateRange.end.split("T")[0]}
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 ease-out hover:scale-[1.03] hover:-translate-y-1 hover:shadow-xl cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Resolution Rate
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {report.summary.resolutionRate}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {report.summary.resolvedIssues} issues resolved
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 ease-out hover:scale-[1.03] hover:-translate-y-1 hover:shadow-xl cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Resolution Time
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {report.summary.averageResolutionTime.toFixed(1)} days
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From report to resolution
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 ease-out hover:scale-[1.03] hover:-translate-y-1 hover:shadow-xl cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Hotspots
                </CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {report.hotspots.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Areas requiring attention
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Ward-wise Performance */}
          <div>
            <Card className="transition-all duration-300 ease-out hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Ward-wise Performance Metrics
                </CardTitle>
                <CardDescription>
                  Detailed analytics for each ward/district
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ward</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-center">Open</TableHead>
                        <TableHead className="text-center">
                          In Progress
                        </TableHead>
                        <TableHead className="text-center">Resolved</TableHead>
                        <TableHead className="text-center">
                          Resolution Rate
                        </TableHead>
                        <TableHead className="text-center">Avg Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.wardAnalytics
                        .sort((a, b) => b.totalIssues - a.totalIssues)
                        .map((ward) => (
                          <TableRow key={ward.ward}>
                            <TableCell className="font-medium">
                              {ward.ward}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">
                                {ward.totalIssues}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
                                {ward.openIssues}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                                {ward.inProgressIssues}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">
                                {ward.resolvedIssues}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <span className="font-medium">
                                  {ward.resolutionRate}%
                                </span>
                                {ward.resolutionRate >= 70 ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : ward.resolutionRate >= 50 ? (
                                  <Clock className="h-4 w-4 text-yellow-500" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 text-red-500" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {formatTime(ward.averageResolutionTime)}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hotspot Visualization & Category Performance */}
          <div className="px-4 lg:px-6">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Issue Hotspots */}
              <Card className="transition-all duration-300 ease-out hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-red-500" />
                    Issue Hotspots
                  </CardTitle>
                  <CardDescription>
                    Areas with high concentration of issues
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.hotspots.slice(0, 5).map((hotspot, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{hotspot.location}</p>
                          {hotspot.ward && (
                            <p className="text-xs text-muted-foreground">
                              {hotspot.ward}
                            </p>
                          )}
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {hotspot.categories.map((cat) => (
                              <Badge
                                key={cat}
                                variant="secondary"
                                className="text-xs"
                              >
                                {cat}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <Badge className={getSeverityColor(hotspot.severity)}>
                            {hotspot.severity}
                          </Badge>
                          <p className="text-sm font-bold mt-1">
                            {hotspot.issueCount} issues
                          </p>
                        </div>
                      </div>
                    ))}
                    {report.hotspots.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        No hotspots identified
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Category Performance */}
            <div>
              <Card className="transition-all duration-300 ease-out hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-500" />
                    Category Performance
                  </CardTitle>
                  <CardDescription>
                    Resolution metrics by issue category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.categoryPerformance
                      .sort((a, b) => b.totalIssues - a.totalIssues)
                      .slice(0, 6)
                      .map((cat) => (
                        <div
                          key={cat.category}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium capitalize">
                              {cat.category.replace("_", " ")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {cat.resolvedIssues}/{cat.totalIssues} resolved •
                              Avg: {formatTime(cat.averageResolutionTime)}
                            </p>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{
                                  width: `${(cat.resolvedIssues / cat.totalIssues) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="ml-4 text-right">
                            <p className="text-lg font-bold">
                              {Math.round(
                                (cat.resolvedIssues / cat.totalIssues) * 100,
                              )}
                              %
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
