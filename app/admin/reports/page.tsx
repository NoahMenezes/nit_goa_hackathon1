"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Silk from "@/components/ui/silk/Silk";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Download, Calendar, TrendingUp, BarChart3, PieChart } from "lucide-react";

export default function ReportsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [isAuthenticated, user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 w-full h-full z-0">
        <Silk speed={5} scale={1} color="#5227FF" noiseIntensity={1.5} rotation={0} />
      </div>

      <div className="fixed inset-0 w-full h-full z-1 bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-sm" />

      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-600 dark:bg-red-500 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-black dark:text-white">Reports & Analytics</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Generate detailed reports and export analytics data for your platform
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg w-fit mb-3">
                <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Issue Reports</CardTitle>
              <CardDescription>Comprehensive issue tracking and resolution reports</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg w-fit mb-3">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>System performance and efficiency analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg w-fit mb-3">
                <PieChart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>Ward Analytics</CardTitle>
              <CardDescription>Ward-wise distribution and impact analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg w-fit mb-3">
                <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle>Monthly Summary</CardTitle>
              <CardDescription>Monthly activity and resolution summaries</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-pink-100 dark:bg-pink-900 rounded-lg w-fit mb-3">
                <FileText className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <CardTitle>User Engagement</CardTitle>
              <CardDescription>User activity and engagement statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg w-fit mb-3">
                <TrendingUp className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <CardTitle>Custom Reports</CardTitle>
              <CardDescription>Build and export custom analytics reports</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-center">
          <Button variant="ghost" onClick={() => router.push("/admin")}>
            ← Back to Admin Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
