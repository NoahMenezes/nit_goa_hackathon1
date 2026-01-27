"use client";

import { useState, useEffect } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, Users, Target } from "lucide-react";
import { NeonGradientCard } from "@/components/magicui/neon-gradient-card";
import { Skeleton } from "@/components/ui/skeleton";

interface TrendData {
  hotspotTrends: Array<{
    month: string;
    potholes: number;
    streetlights: number;
    water: number;
    sanitation: number;
    drainage: number;
    electricity: number;
    traffic: number;
    other: number;
    predicted: number;
  }>;
  resourceDemand: Array<{
    week: string;
    maintenance: number;
    emergency: number;
    planned: number;
    capacity: number;
  }>;
  departmentPerformance: Array<{
    department: string;
    resolved: number;
    pending: number;
    avgTime: number;
  }>;
  predictionAccuracy: Array<{
    week: string;
    predicted: number;
    actual: number;
    accuracy: number;
  }>;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function ChartAreaInteractive() {
  const [selectedTimeframe, setSelectedTimeframe] = useState("6months");
  const [selectedChart, setSelectedChart] = useState("hotspot");
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrendData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/analytics/trends");
        const data = await response.json();

        if (data.success) {
          setTrendData(data.data);
          setError(null);
        } else {
          setError(data.error || "Failed to fetch trend data");
        }
      } catch (err) {
        console.error("Error fetching trend data:", err);
        setError("Failed to load analytics data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendData();

    // Refresh data every 60 seconds
    const interval = setInterval(fetchTrendData, 60000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-96 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="p-6 border rounded-lg">
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  if (error || !trendData) {
    return (
      <div className="p-6 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/20">
        <p className="text-red-600 dark:text-red-400">
          {error || "Failed to load analytics data"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Predictive Issue Management Analytics
          </h2>
          <p className="text-muted-foreground">
            AI-powered insights and trend projections for civic issue management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={selectedTimeframe}
            onValueChange={setSelectedTimeframe}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">3 Months</SelectItem>
              <SelectItem value="6months">6 Months</SelectItem>
              <SelectItem value="1year">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="ml-2">
            <Activity className="h-3 w-3 mr-1" />
            Live Data
          </Badge>
        </div>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs
        value={selectedChart}
        onValueChange={setSelectedChart}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="hotspot">Hotspot Trends</TabsTrigger>
          <TabsTrigger value="resource">Resource Demand</TabsTrigger>
          <TabsTrigger value="performance">Department Performance</TabsTrigger>
          <TabsTrigger value="prediction">Prediction Accuracy</TabsTrigger>
        </TabsList>

        {/* Hotspot Trend Projection */}
        <TabsContent value="hotspot">
          <NeonGradientCard className="transition-all duration-300 ease-out hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black dark:text-white">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Hotspot Trend Projection
              </CardTitle>
              <CardDescription>
                Monthly issue trends by category with AI-powered predictions for
                upcoming periods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={trendData.hotspotTrends}>
                  <defs>
                    <linearGradient
                      id="colorPotholes"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorStreetlights"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorSanitation"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorPredicted"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis
                    dataKey="month"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="potholes"
                    stackId="1"
                    stroke="#ef4444"
                    fill="url(#colorPotholes)"
                    name="Potholes"
                  />
                  <Area
                    type="monotone"
                    dataKey="streetlights"
                    stackId="1"
                    stroke="#f59e0b"
                    fill="url(#colorStreetlights)"
                    name="Streetlights"
                  />
                  <Area
                    type="monotone"
                    dataKey="water"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="url(#colorWater)"
                    name="Water Issues"
                  />
                  <Area
                    type="monotone"
                    dataKey="sanitation"
                    stackId="1"
                    stroke="#10b981"
                    fill="url(#colorSanitation)"
                    name="Sanitation"
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    dot={{ fill: "#8b5cf6", r: 4 }}
                    name="AI Predicted"
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  📊 Insight: The prediction model forecasts a{" "}
                  {trendData.hotspotTrends.length > 0 &&
                  trendData.hotspotTrends[trendData.hotspotTrends.length - 1]
                    .predicted >
                    trendData.hotspotTrends[trendData.hotspotTrends.length - 1]
                      .potholes +
                      trendData.hotspotTrends[
                        trendData.hotspotTrends.length - 1
                      ].streetlights +
                      trendData.hotspotTrends[
                        trendData.hotspotTrends.length - 1
                      ].water +
                      trendData.hotspotTrends[
                        trendData.hotspotTrends.length - 1
                      ].sanitation
                    ? "rise"
                    : "decline"}{" "}
                  in civic issues based on historical patterns and seasonal
                  trends.
                </p>
              </div>
            </CardContent>
          </NeonGradientCard>
        </TabsContent>

        {/* Resource Demand */}
        <TabsContent value="resource">
          <NeonGradientCard className="transition-all duration-300 ease-out hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black dark:text-white">
                <Users className="h-5 w-5 text-purple-500" />
                Resource Demand Analysis
              </CardTitle>
              <CardDescription>
                Weekly resource utilization showing emergency, maintenance, and
                planned work capacity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={trendData.resourceDemand}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis
                    dataKey="week"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-3">
                            <p className="font-semibold mb-2">{label}</p>
                            {payload.map((entry, index) => (
                              <p
                                key={index}
                                style={{ color: entry.color }}
                                className="text-sm"
                              >
                                {entry.name}: {entry.value}%
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="emergency"
                    stackId="a"
                    fill="#ef4444"
                    name="Emergency"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="maintenance"
                    stackId="a"
                    fill="#f59e0b"
                    name="Maintenance"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="planned"
                    stackId="a"
                    fill="#10b981"
                    name="Planned"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    type="monotone"
                    dataKey="capacity"
                    stroke="#6366f1"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Capacity"
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                  ⚡ Recommendation: Resource utilization is{" "}
                  {trendData.resourceDemand.some(
                    (week) =>
                      week.emergency + week.maintenance + week.planned > 90,
                  )
                    ? "high"
                    : "optimal"}
                  . Consider{" "}
                  {trendData.resourceDemand.some(
                    (week) =>
                      week.emergency + week.maintenance + week.planned > 90,
                  )
                    ? "deploying additional teams during peak periods"
                    : "maintaining current resource allocation"}
                  .
                </p>
              </div>
            </CardContent>
          </NeonGradientCard>
        </TabsContent>

        {/* Department Performance */}
        <TabsContent value="performance">
          <NeonGradientCard className="transition-all duration-300 ease-out hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black dark:text-white">
                <Target className="h-5 w-5 text-green-500" />
                Department Performance Metrics
              </CardTitle>
              <CardDescription>
                Comparative analysis of department efficiency and resolution
                times
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={trendData.departmentPerformance}
                  layout="vertical"
                  margin={{ left: 120 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis type="number" stroke="#888888" fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="department"
                    stroke="#888888"
                    fontSize={12}
                    width={110}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="resolved"
                    fill="#10b981"
                    name="Resolved"
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar
                    dataKey="pending"
                    fill="#f59e0b"
                    name="Pending"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {trendData.departmentPerformance
                  .sort((a, b) => a.avgTime - b.avgTime)
                  .slice(0, 3)
                  .map((dept, index) => (
                    <div
                      key={dept.department}
                      className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg"
                    >
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}{" "}
                        {dept.department}
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                        Avg Resolution: {dept.avgTime} days | Resolved:{" "}
                        {dept.resolved}
                      </p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </NeonGradientCard>
        </TabsContent>

        {/* Prediction Accuracy */}
        <TabsContent value="prediction">
          <NeonGradientCard className="transition-all duration-300 ease-out hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black dark:text-white">
                <Activity className="h-5 w-5 text-indigo-500" />
                AI Prediction Accuracy
              </CardTitle>
              <CardDescription>
                Model accuracy comparison between predicted and actual issue
                volumes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendData.predictionAccuracy}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis
                    dataKey="week"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="predicted"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ fill: "#8b5cf6", r: 5 }}
                    name="Predicted Issues"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="actual"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    dot={{ fill: "#06b6d4", r: 5 }}
                    name="Actual Issues"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Accuracy %"
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg">
                <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                  🤖 Model Performance: Average prediction accuracy is{" "}
                  {trendData.predictionAccuracy.length > 0
                    ? Math.round(
                        trendData.predictionAccuracy.reduce(
                          (sum, week) => sum + week.accuracy,
                          0,
                        ) / trendData.predictionAccuracy.length,
                      )
                    : 0}
                  %, enabling proactive resource planning and issue prevention
                  strategies.
                </p>
              </div>
            </CardContent>
          </NeonGradientCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
