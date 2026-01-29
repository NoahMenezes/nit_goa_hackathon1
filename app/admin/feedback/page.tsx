"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Silk from "@/components/ui/silk/Silk";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, ThumbsUp, ThumbsDown, Star, TrendingUp, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function FeedbackPage() {
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
            <div className="p-2 bg-teal-600 dark:bg-teal-500 rounded-lg">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-black dark:text-white">Feedback Management</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Review and respond to user feedback and suggestions
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
                <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Positive</CardTitle>
                <ThumbsUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">892</div>
              <Badge variant="outline" className="mt-2 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
                72%
              </Badge>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Negative</CardTitle>
                <ThumbsDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">123</div>
              <Badge variant="outline" className="mt-2 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300">
                10%
              </Badge>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
                <Star className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.5</div>
              <Badge variant="outline" className="mt-2 bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300">
                ★★★★☆
              </Badge>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg w-fit mb-3">
                <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>View All Feedback</CardTitle>
              <CardDescription>Browse all user feedback and comments</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <MessageSquare className="mr-2 h-4 w-4" />
                View Feedback
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg w-fit mb-3">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>Feedback Analytics</CardTitle>
              <CardDescription>View feedback trends and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg w-fit mb-3">
                <Star className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>Feature Requests</CardTitle>
              <CardDescription>Review user feature suggestions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Star className="mr-2 h-4 w-4" />
                View Requests
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90 mb-6">
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
            <CardDescription>Latest feedback from users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <ThumbsUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm">Great issue tracking system!</h4>
                    <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
                      Positive
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    The new issue tracking feature is really helpful. Makes it easy to report and follow up on civic issues.
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <p className="text-xs text-gray-500 dark:text-gray-500">John Doe • 2 hours ago</p>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Mark Reviewed
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Star className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm">Feature Request: Dark mode improvements</h4>
                    <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      Suggestion
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Would love to see better contrast in dark mode for the map view. Some text is hard to read.
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <p className="text-xs text-gray-500 dark:text-gray-500">Jane Smith • 5 hours ago</p>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Mark Reviewed
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <ThumbsDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm">Slow loading times on mobile</h4>
                    <Badge variant="outline" className="bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300">
                      Issue
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    The dashboard takes too long to load on my mobile device. Please optimize for mobile users.
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <p className="text-xs text-gray-500 dark:text-gray-500">Mike Johnson • 1 day ago</p>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Mark Reviewed
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <ThumbsUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm">Love the voice agent feature!</h4>
                    <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
                      Positive
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    The voice agent makes it so much easier to report issues while on the go. Great addition!
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <p className="text-xs text-gray-500 dark:text-gray-500">Sarah Williams • 2 days ago</p>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Mark Reviewed
                    </Button>
                  </div>
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
