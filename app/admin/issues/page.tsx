"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Silk } from "@/components/ui/silk";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
} from "lucide-react";

export default function AdminIssuesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [isAuthenticated, user, isLoading, router]);

  if (isLoading || !user) {
    return <div>Loading...</div>;
  }

  if (user?.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 relative">
      {/* Silk Background */}
      <div className="fixed inset-0 w-full h-full -z-10 opacity-60 dark:opacity-50">
        <Silk
          speed={5}
          scale={1}
          color="#5227FF"
          noiseIntensity={1.5}
          rotation={0}
        />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-black dark:text-white">
                Issue Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage and track all reported issues
              </p>
            </div>
            <Link href="/admin">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>

        {/* Content Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <ClipboardList className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Total Issues</CardTitle>
                  <CardDescription>All reported issues</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View and manage all civic issues reported by citizens in the
                system.
              </p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Resolved</CardTitle>
                  <CardDescription>Completed issues</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track successfully resolved issues and monitor resolution rates.
              </p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">In Progress</CardTitle>
                  <CardDescription>Active issues</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Monitor issues currently being worked on by authorities.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Card */}
        <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-900/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Issue Management System
            </CardTitle>
            <CardDescription>
              Comprehensive issue tracking and management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose dark:prose-invert max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Overview
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The Issue Management system provides administrators with
                comprehensive tools to track, monitor, and resolve civic issues
                reported by citizens. This centralized platform ensures
                efficient handling of all community concerns.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Key Features
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Real-time Tracking:</strong> Monitor all reported
                    issues in real-time with automatic updates and
                    notifications.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Status Management:</strong> Update issue statuses
                    from open, in-progress, resolved, to closed with ease.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Priority Assignment:</strong> Categorize issues by
                    priority levels (low, medium, high, critical) for efficient
                    resource allocation.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Category Filtering:</strong> Filter issues by type
                    including potholes, streetlights, garbage, water leaks, and
                    more.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Ward-based Organization:</strong> View and manage
                    issues based on specific wards or districts for better
                    locality management.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Bulk Operations:</strong> Perform bulk status
                    updates and actions on multiple issues simultaneously.
                  </span>
                </li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-6">
                Issue Categories
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                The system categorizes issues into the following types:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    🕳️ Potholes
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    💡 Streetlights
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    🗑️ Garbage
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    💧 Water Leaks
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    🛣️ Road Issues
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    🚰 Sanitation
                  </p>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-6">
                Workflow
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      Issue Reported
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Citizen reports an issue through the platform
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
                  <div className="bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-yellow-900 dark:text-yellow-100">
                      Review & Assign
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Admin reviews and assigns priority and category
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
                  <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-purple-900 dark:text-purple-100">
                      In Progress
                    </p>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      Authorities work on resolving the issue
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                  <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    4
                  </div>
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">
                      Resolved
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Issue is resolved and citizen is notified
                    </p>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-6">
                Performance Metrics
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Track key performance indicators:
              </p>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span>Average resolution time per issue category</span>
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span>Resolution rate by ward and priority level</span>
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span>Citizen satisfaction and feedback scores</span>
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span>Response time from report to first action</span>
                </li>
              </ul>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Best Practices
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Respond to critical issues within 24 hours, update issue
                      statuses regularly, communicate with citizens through
                      comments, and maintain detailed records of all actions
                      taken.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
