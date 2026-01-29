"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Silk from "@/components/ui/silk/Silk";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock, Shield, Key, UserCheck, AlertTriangle, FileCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SecurityPage() {
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
            <div className="p-2 bg-gray-600 dark:bg-gray-500 rounded-lg">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-black dark:text-white">Security & Permissions</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Configure security policies and manage access controls for your platform
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg w-fit mb-3">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Access Control</CardTitle>
              <CardDescription>Manage user roles and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Shield className="mr-2 h-4 w-4" />
                Configure Access
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg w-fit mb-3">
                <Key className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage API keys and tokens</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Key className="mr-2 h-4 w-4" />
                Manage Keys
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg w-fit mb-3">
                <UserCheck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>Authentication</CardTitle>
              <CardDescription>Configure authentication settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <UserCheck className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg w-fit mb-3">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle>Security Alerts</CardTitle>
              <CardDescription>View and manage security alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <AlertTriangle className="mr-2 h-4 w-4" />
                View Alerts
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg w-fit mb-3">
                <FileCheck className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>Review security audit logs</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <FileCheck className="mr-2 h-4 w-4" />
                View Logs
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg w-fit mb-3">
                <Lock className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <CardTitle>Password Policy</CardTitle>
              <CardDescription>Configure password requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Lock className="mr-2 h-4 w-4" />
                Update Policy
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90 mb-6">
          <CardHeader>
            <CardTitle>Security Status</CardTitle>
            <CardDescription>Current security status and recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                    <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">SSL Certificate</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Valid and secure</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
                  Active
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                    <Key className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Enabled for admin accounts</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
                  Enabled
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Password Expiry</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">3 admin accounts with passwords expiring soon</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300">
                  Warning
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                    <FileCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Last Security Audit</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Completed 2 days ago</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
                  Passed
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-center">
          <Button variant="ghost" onClick={() => router.push("/admin")}>
            ← Back to Admin Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
