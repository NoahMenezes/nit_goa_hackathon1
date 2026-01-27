"use client";

import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Clock,
  MapPin,
  User,
  Eye,
  CheckCircle,
  XCircle,
  Bell,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NeonGradientCard } from "@/components/magicui/neon-gradient-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface SLAAlert {
  id: string;
  ticketId: string;
  title: string;
  category: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in-progress" | "resolved" | "closed";
  location: string;
  assignedTo: string;
  createdAt: string;
  slaDeadline: string;
  timeRemaining: string;
  timeRemainingHours: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  estimatedCompletionTime: string;
  impact: string;
}

interface AlertsData {
  alerts: SLAAlert[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    overdue: number;
  };
}

const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case "critical":
      return "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800";
    case "high":
      return "bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800";
    case "medium":
      return "bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800";
    case "low":
      return "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800";
    default:
      return "bg-gray-100 dark:bg-gray-950 text-gray-800 dark:text-gray-200";
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "open":
      return "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200";
    case "in-progress":
      return "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200";
    case "resolved":
      return "bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200";
    case "closed":
      return "bg-gray-100 dark:bg-gray-950 text-gray-800 dark:text-gray-200";
    default:
      return "bg-gray-100 dark:bg-gray-950 text-gray-800 dark:text-gray-200";
  }
};

const getRiskLevelColor = (riskLevel: string) => {
  switch (riskLevel.toLowerCase()) {
    case "critical":
      return "text-red-600 dark:text-red-400 font-bold";
    case "high":
      return "text-orange-600 dark:text-orange-400 font-semibold";
    case "medium":
      return "text-yellow-600 dark:text-yellow-400 font-medium";
    case "low":
      return "text-green-600 dark:text-green-400";
    default:
      return "text-gray-600 dark:text-gray-400";
  }
};

const formatCategoryName = (category: string): string => {
  const categoryMap: Record<string, string> = {
    pothole: "Potholes",
    streetlight: "Street Lights",
    water_leak: "Water Leak",
    garbage: "Garbage",
    sanitation: "Sanitation",
    drainage: "Drainage",
    electricity: "Electricity",
    traffic: "Traffic",
    road: "Road",
    other: "Other",
  };
  return categoryMap[category] || category;
};

export function SLAAlertsTable() {
  const [selectedAlert, setSelectedAlert] = useState<SLAAlert | null>(null);
  const [alertsData, setAlertsData] = useState<AlertsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterRisk, setFilterRisk] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setIsLoading(true);
        const url = filterRisk
          ? `/api/analytics/sla-alerts?risk=${filterRisk}&limit=20`
          : "/api/analytics/sla-alerts?limit=20";

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
          setAlertsData(data.data);
          setError(null);

          // Show toast for critical alerts
          const criticalAlerts = data.data.alerts.filter(
            (alert: SLAAlert) => alert.riskLevel === "critical",
          );

          if (criticalAlerts.length > 0 && !filterRisk) {
            const alert = criticalAlerts[0];
            setTimeout(() => {
              toast.error("Critical SLA Alert!", {
                description: `${alert.title} at ${alert.location} - ${alert.timeRemaining}`,
                icon: <Bell className="h-4 w-4" />,
                action: {
                  label: "View",
                  onClick: () => setSelectedAlert(alert),
                },
                duration: 8000,
              });
            }, 1000);
          }
        } else {
          setError(data.error || "Failed to fetch SLA alerts");
        }
      } catch (err) {
        console.error("Error fetching SLA alerts:", err);
        setError("Failed to load SLA alerts");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlerts();

    // Refresh every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);

    return () => clearInterval(interval);
  }, [filterRisk]);

  const handleEscalate = (alertId: string) => {
    toast.success("Alert Escalated!", {
      description: "Issue has been escalated to senior management",
    });
  };

  const handleResolve = (alertId: string) => {
    toast.success("Issue Resolved!", {
      description: "SLA alert has been marked as resolved",
    });
  };

  if (isLoading) {
    return (
      <NeonGradientCard className="transition-all duration-300 ease-out">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <Skeleton className="h-6 w-48" />
          </CardTitle>
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </NeonGradientCard>
    );
  }

  if (error || !alertsData) {
    return (
      <NeonGradientCard className="transition-all duration-300 ease-out">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black dark:text-white">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            SLA Alert System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-6 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/20">
            <p className="text-red-600 dark:text-red-400">
              {error || "Failed to load SLA alerts"}
            </p>
          </div>
        </CardContent>
      </NeonGradientCard>
    );
  }

  return (
    <NeonGradientCard className="transition-all duration-300 ease-out hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-black dark:text-white">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              SLA Alert System - At-Risk Tickets
            </CardTitle>
            <CardDescription>
              Real-time monitoring of issues at risk of SLA breach with
              automated escalation alerts
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-red-50 dark:bg-red-950">
              <Bell className="h-3 w-3 mr-1" />
              {alertsData.summary.critical} Critical
            </Badge>
            <Badge
              variant="outline"
              className="bg-orange-50 dark:bg-orange-950"
            >
              {alertsData.summary.high} High Risk
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border">
            <div className="text-2xl font-bold text-black dark:text-white">
              {alertsData.summary.total}
            </div>
            <div className="text-xs text-muted-foreground">Total Alerts</div>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {alertsData.summary.critical}
            </div>
            <div className="text-xs text-red-600 dark:text-red-400">
              Critical
            </div>
          </div>
          <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {alertsData.summary.high}
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400">
              High Risk
            </div>
          </div>
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {alertsData.summary.medium}
            </div>
            <div className="text-xs text-yellow-600 dark:text-yellow-400">
              Medium
            </div>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {alertsData.summary.overdue}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400">
              Overdue
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={filterRisk === null ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterRisk(null)}
          >
            All
          </Button>
          <Button
            variant={filterRisk === "critical" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterRisk("critical")}
          >
            Critical
          </Button>
          <Button
            variant={filterRisk === "high" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterRisk("high")}
          >
            High
          </Button>
          <Button
            variant={filterRisk === "medium" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterRisk("medium")}
          >
            Medium
          </Button>
        </div>

        {/* Alerts Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Ticket ID</TableHead>
                <TableHead>Issue Details</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time Remaining</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alertsData.alerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                      <p className="text-muted-foreground">
                        No SLA alerts at this risk level
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                alertsData.alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell className="font-mono text-xs">
                      #{alert.ticketId}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="font-medium text-sm">{alert.title}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {formatCategoryName(alert.category)}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {alert.assignedTo}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getPriorityColor(alert.priority)}
                      >
                        {alert.priority.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getStatusColor(alert.status)}
                      >
                        {alert.status === "in-progress"
                          ? "In Progress"
                          : alert.status.charAt(0).toUpperCase() +
                            alert.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className={getRiskLevelColor(alert.riskLevel)}>
                          {alert.timeRemaining}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-1 text-xs">
                        <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{alert.location}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedAlert(alert)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>SLA Alert Details</DialogTitle>
                            <DialogDescription>
                              #{alert.ticketId} - {alert.title}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">
                                  Priority
                                </label>
                                <div className="mt-1">
                                  <Badge
                                    variant="outline"
                                    className={getPriorityColor(alert.priority)}
                                  >
                                    {alert.priority.toUpperCase()}
                                  </Badge>
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium">
                                  Status
                                </label>
                                <div className="mt-1">
                                  <Badge
                                    variant="outline"
                                    className={getStatusColor(alert.status)}
                                  >
                                    {alert.status === "in-progress"
                                      ? "In Progress"
                                      : alert.status.charAt(0).toUpperCase() +
                                        alert.status.slice(1)}
                                  </Badge>
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium">
                                  Category
                                </label>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {formatCategoryName(alert.category)}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">
                                  Risk Level
                                </label>
                                <p
                                  className={`text-sm mt-1 ${getRiskLevelColor(alert.riskLevel)}`}
                                >
                                  {alert.riskLevel.toUpperCase()}
                                </p>
                              </div>
                            </div>

                            <div>
                              <label className="text-sm font-medium">
                                Location
                              </label>
                              <p className="text-sm text-muted-foreground mt-1 flex items-start gap-2">
                                <MapPin className="h-4 w-4 mt-0.5" />
                                {alert.location}
                              </p>
                            </div>

                            <div>
                              <label className="text-sm font-medium">
                                Assigned To
                              </label>
                              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {alert.assignedTo}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">
                                  Time Remaining
                                </label>
                                <p
                                  className={`text-sm mt-1 flex items-center gap-2 ${getRiskLevelColor(alert.riskLevel)}`}
                                >
                                  <Clock className="h-4 w-4" />
                                  {alert.timeRemaining}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">
                                  Estimated Completion
                                </label>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {alert.estimatedCompletionTime}
                                </p>
                              </div>
                            </div>

                            <div>
                              <label className="text-sm font-medium">
                                Impact Assessment
                              </label>
                              <p className="text-sm text-muted-foreground mt-1">
                                {alert.impact}
                              </p>
                            </div>

                            <div>
                              <label className="text-sm font-medium">
                                SLA Deadline
                              </label>
                              <p className="text-sm text-muted-foreground mt-1">
                                {new Date(alert.slaDeadline).toLocaleString()}
                              </p>
                            </div>

                            <div className="flex gap-2 pt-4">
                              <Button
                                className="flex-1"
                                variant="outline"
                                onClick={() => handleEscalate(alert.id)}
                              >
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Escalate
                              </Button>
                              <Button
                                className="flex-1"
                                onClick={() => handleResolve(alert.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark Resolved
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Info Banner */}
        {alertsData.summary.critical > 0 && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                  ⚠️ Critical SLA Breach Risk Detected
                </p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  {alertsData.summary.critical} critical issue(s) require
                  immediate attention to prevent SLA violations and maintain
                  service quality standards.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </NeonGradientCard>
  );
}
