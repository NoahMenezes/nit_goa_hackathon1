"use client";

import { useEffect, useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  MapPin,
  BarChart3,
  ExternalLink,
  ArrowRight,
  Target,
} from "lucide-react";
import Link from "next/link";

interface PublicStats {
  totalIssuesReported: number;
  issuesResolved: number;
  resolutionRate: number;
  averageResolutionTime: number;
  activeUsers: number;
  wardPerformance: {
    ward: string;
    issuesReported: number;
    issuesResolved: number;
    resolutionRate: number;
  }[];
  recentResolutions: {
    id: string;
    title: string;
    category: string;
    ward?: string;
    resolvedAt: string;
    resolutionTime: number;
  }[];
  categoryStats: {
    category: string;
    count: number;
    resolvedCount: number;
  }[];
}

export default function TransparencyPage() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicStats();
  }, []);

  const fetchPublicStats = async () => {
    try {
      const response = await fetch("/api/public/stats");
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching public stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (days: number): string => {
    if (days < 1) return `${Math.round(days * 24)} hours`;
    if (days < 7)
      return `${Math.round(days)} day${Math.round(days) !== 1 ? "s" : ""}`;
    if (days < 30)
      return `${Math.round(days / 7)} week${Math.round(days / 7) !== 1 ? "s" : ""}`;
    return `${Math.round(days / 30)} month${Math.round(days / 30) !== 1 ? "s" : ""}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      pothole: "🕳️",
      streetlight: "💡",
      garbage: "🗑️",
      water_leak: "💧",
      road: "🛣️",
      sanitation: "🧹",
      drainage: "🚰",
      electricity: "⚡",
      traffic: "🚦",
      other: "📋",
    };
    return icons[category] || "📋";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Activity className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">
                Loading transparency data...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <p className="text-muted-foreground">
              Unable to load transparency data
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl">
            <Badge className="bg-white/20 text-white mb-4">
              Public Dashboard
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              OurStreet Transparency Portal
            </h1>
            <p className="text-lg text-blue-100 mb-6">
              Track our community&apos;s progress in resolving civic issues.
              Real-time, anonymized data showing how we&apos;re making our city
              better together.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/report">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-50"
                >
                  Report an Issue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/map">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  View Issue Map
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-t-4 border-t-blue-500 transition-all duration-300 ease-out hover:scale-[1.03] hover:-translate-y-1 hover:shadow-xl cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Issues Reported
              </CardTitle>
              <Activity className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats.totalIssuesReported.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Community contributions
              </p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-green-500 transition-all duration-300 ease-out hover:scale-[1.03] hover:-translate-y-1 hover:shadow-xl cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Issues Resolved
              </CardTitle>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats.issuesResolved.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Successfully addressed
              </p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-purple-500 transition-all duration-300 ease-out hover:scale-[1.03] hover:-translate-y-1 hover:shadow-xl cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Resolution Rate
              </CardTitle>
              <Target className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.resolutionRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Current success rate
              </p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-orange-500 transition-all duration-300 ease-out hover:scale-[1.03] hover:-translate-y-1 hover:shadow-xl cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Resolution Time
              </CardTitle>
              <Clock className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatTime(stats.averageResolutionTime)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From report to resolution
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Ward Performance */}
          <Card className="transition-all duration-300 ease-out hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Ward Performance
              </CardTitle>
              <CardDescription>
                Resolution metrics by ward/district
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ward</TableHead>
                      <TableHead className="text-center">Reported</TableHead>
                      <TableHead className="text-center">Resolved</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.wardPerformance
                      .sort((a, b) => b.resolutionRate - a.resolutionRate)
                      .map((ward) => (
                        <TableRow key={ward.ward}>
                          <TableCell className="font-medium">
                            {ward.ward}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">
                              {ward.issuesReported}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">
                              {ward.issuesResolved}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="font-semibold">
                                {ward.resolutionRate}%
                              </span>
                              {ward.resolutionRate >= 70 && (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Category Statistics */}
          <Card className="transition-all duration-300 ease-out hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Issue Categories
              </CardTitle>
              <CardDescription>Breakdown by category type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.categoryStats
                  .sort((a, b) => b.count - a.count)
                  .map((cat) => {
                    const percentage =
                      cat.count > 0
                        ? Math.round((cat.resolvedCount / cat.count) * 100)
                        : 0;
                    return (
                      <div key={cat.category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">
                              {getCategoryIcon(cat.category)}
                            </span>
                            <span className="font-medium capitalize">
                              {cat.category.replace("_", " ")}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {cat.resolvedCount}/{cat.count} ({percentage}%)
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Resolutions */}
        <Card className="transition-all duration-300 ease-out hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Recent Resolutions
            </CardTitle>
            <CardDescription>
              Latest issues resolved by our team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentResolutions.map((resolution) => (
                <Link
                  key={resolution.id}
                  href={`/issues/${resolution.id}`}
                  className="block p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">
                          {getCategoryIcon(resolution.category)}
                        </span>
                        <h3 className="font-medium">{resolution.title}</h3>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {resolution.ward && (
                          <>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {resolution.ward}
                            </span>
                            <span>•</span>
                          </>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Resolved in {formatTime(resolution.resolutionTime)}
                        </span>
                        <span>•</span>
                        <span>{formatDate(resolution.resolvedAt)}</span>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">
                      Resolved
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Community Impact Statement */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-none transition-all duration-300 ease-out hover:shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Users className="h-12 w-12 text-primary flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold mb-2">Community Impact</h3>
                <p className="text-muted-foreground mb-4">
                  Thanks to{" "}
                  <strong>
                    {stats.activeUsers.toLocaleString()} active community
                    members
                  </strong>
                  , we&apos;ve successfully addressed{" "}
                  <strong>
                    {stats.issuesResolved.toLocaleString()} issues
                  </strong>{" "}
                  out of{" "}
                  <strong>
                    {stats.totalIssuesReported.toLocaleString()} reported
                  </strong>
                  . Together, we&apos;re making our city cleaner, safer, and
                  better for everyone.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="secondary" className="text-sm">
                    {stats.resolutionRate}% Success Rate
                  </Badge>
                  <Badge variant="secondary" className="text-sm">
                    {formatTime(stats.averageResolutionTime)} Avg Response
                  </Badge>
                  <Badge variant="secondary" className="text-sm">
                    {stats.activeUsers} Active Citizens
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer CTA */}
        <div className="text-center mt-12 py-8">
          <h2 className="text-2xl font-bold mb-4">Be Part of the Change</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Every report makes a difference. Join thousands of citizens helping
            improve our community.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              Join OurStreet Today
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
