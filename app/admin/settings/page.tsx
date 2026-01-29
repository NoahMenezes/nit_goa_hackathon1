"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Silk from "@/components/ui/silk/Silk";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Globe, Mail, Bell, Palette, Database, Shield } from "lucide-react";

export default function SettingsPage() {
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
            <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-black dark:text-white">System Settings</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Configure system settings, SLA times, and notification preferences
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg w-fit mb-3">
                <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure general system preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Globe className="mr-2 h-4 w-4" />
                Configure
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg w-fit mb-3">
                <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>Configure SMTP and email templates</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                Configure
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg w-fit mb-3">
                <Bell className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Manage notification preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Bell className="mr-2 h-4 w-4" />
                Configure
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-pink-100 dark:bg-pink-900 rounded-lg w-fit mb-3">
                <Palette className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize theme and branding</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Palette className="mr-2 h-4 w-4" />
                Customize
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg w-fit mb-3">
                <Database className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle>Database Settings</CardTitle>
              <CardDescription>Configure database connections</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Database className="mr-2 h-4 w-4" />
                Configure
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg w-fit mb-3">
                <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security policies</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Shield className="mr-2 h-4 w-4" />
                Configure
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90 mb-6">
          <CardHeader>
            <CardTitle>SLA Configuration</CardTitle>
            <CardDescription>Set Service Level Agreement times for issue resolution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <h4 className="font-semibold text-sm">Critical Issues</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">High priority issues requiring immediate attention</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">4 hours</p>
                  <Button variant="ghost" size="sm" className="mt-1">Edit</Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <h4 className="font-semibold text-sm">High Priority Issues</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Important issues affecting multiple users</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">24 hours</p>
                  <Button variant="ghost" size="sm" className="mt-1">Edit</Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <h4 className="font-semibold text-sm">Medium Priority Issues</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Standard issues with moderate impact</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">72 hours</p>
                  <Button variant="ghost" size="sm" className="mt-1">Edit</Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <h4 className="font-semibold text-sm">Low Priority Issues</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Minor issues with minimal impact</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">7 days</p>
                  <Button variant="ghost" size="sm" className="mt-1">Edit</Button>
                </div>
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
