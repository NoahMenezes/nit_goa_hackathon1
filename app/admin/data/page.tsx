"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Silk from "@/components/ui/silk/Silk";
import { Skeleton } from "@/components/ui/skeleton";
import { Database, Download, Upload, Archive, RefreshCw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DataManagementPage() {
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
            <div className="p-2 bg-emerald-600 dark:bg-emerald-500 rounded-lg">
              <Database className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-black dark:text-white">Data Management</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Backup, restore, and manage system data efficiently
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg w-fit mb-3">
                <Download className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Export Data</CardTitle>
              <CardDescription>Download system data in various formats</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Export Database
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg w-fit mb-3">
                <Upload className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>Import Data</CardTitle>
              <CardDescription>Upload and restore data from backups</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                Import Database
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg w-fit mb-3">
                <Archive className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>Create Backup</CardTitle>
              <CardDescription>Generate full system backup</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Archive className="mr-2 h-4 w-4" />
                Backup Now
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg w-fit mb-3">
                <RefreshCw className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle>Restore Backup</CardTitle>
              <CardDescription>Restore from previous backups</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Restore Data
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg w-fit mb-3">
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle>Clean Data</CardTitle>
              <CardDescription>Remove old or unused data</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Clean Database
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg w-fit mb-3">
                <Database className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <CardTitle>Database Status</CardTitle>
              <CardDescription>View database health and stats</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Database className="mr-2 h-4 w-4" />
                View Status
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90 mb-6">
          <CardHeader>
            <CardTitle>Recent Backups</CardTitle>
            <CardDescription>History of system backups</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                    <Archive className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Full System Backup</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">backup_2024-01-15_14-30.sql</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">2 hours ago • 245 MB</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <Archive className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Automated Daily Backup</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">backup_2024-01-14_00-00.sql</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">1 day ago • 238 MB</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                    <Archive className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Weekly Archive</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">backup_2024-01-08_00-00.sql</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">7 days ago • 220 MB</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <CardTitle>Storage Usage</CardTitle>
              <CardDescription>Database and file storage statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Database Size</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">245 MB / 1 GB</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: "24.5%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">File Storage</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">1.2 GB / 5 GB</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: "24%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Backup Archives</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">685 MB / 2 GB</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: "34.25%" }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <CardTitle>Data Statistics</CardTitle>
              <CardDescription>System data overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium">Total Users</span>
                  <Badge variant="outline">1,234</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium">Total Issues</span>
                  <Badge variant="outline">5,678</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium">Total Comments</span>
                  <Badge variant="outline">12,345</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium">Total Attachments</span>
                  <Badge variant="outline">3,456</Badge>
                </div>
              </div>
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
