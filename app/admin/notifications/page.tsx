"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Silk from "@/components/ui/silk/Silk";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Send, Users, AlertCircle, Info, CheckCircle } from "lucide-react";

export default function NotificationsPage() {
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
            <div className="p-2 bg-yellow-600 dark:bg-yellow-500 rounded-lg">
              <Bell className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-black dark:text-white">Notifications Center</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and send notifications to users and staff members
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg w-fit mb-3">
                <Send className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Send Broadcast</CardTitle>
              <CardDescription>Send notifications to all users at once</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Send className="mr-2 h-4 w-4" />
                Create Broadcast
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg w-fit mb-3">
                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>Targeted Messages</CardTitle>
              <CardDescription>Send notifications to specific user groups</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Users className="mr-2 h-4 w-4" />
                Select Recipients
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg w-fit mb-3">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle>Emergency Alerts</CardTitle>
              <CardDescription>Send critical emergency notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="destructive">
                <AlertCircle className="mr-2 h-4 w-4" />
                Send Alert
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg w-fit mb-3">
                <Info className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>System Updates</CardTitle>
              <CardDescription>Notify users about system updates</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Info className="mr-2 h-4 w-4" />
                Post Update
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-teal-100 dark:bg-teal-900 rounded-lg w-fit mb-3">
                <CheckCircle className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
              <CardTitle>Issue Updates</CardTitle>
              <CardDescription>Notify users about issue resolutions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <CheckCircle className="mr-2 h-4 w-4" />
                Send Update
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg w-fit mb-3">
                <Bell className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle>Scheduled Notifications</CardTitle>
              <CardDescription>Schedule notifications for future delivery</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Bell className="mr-2 h-4 w-4" />
                Schedule Message
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90 mb-6">
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>View recently sent notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">System Maintenance Notice</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Scheduled maintenance on Sunday 2:00 AM</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Sent 2 hours ago • 1,234 recipients</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">Issue Resolved</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Streetlight repair completed in Ward 5</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Sent 5 hours ago • 89 recipients</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">Weather Alert</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Heavy rain expected in the next 24 hours</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Sent 1 day ago • 2,456 recipients</p>
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
