"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Silk from "@/components/ui/silk/Silk";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Plus, Clock, MapPin, Users, Bell, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CalendarPage() {
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
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-violet-600 dark:bg-violet-500 rounded-lg">
                  <CalendarDays className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-black dark:text-white">Event Calendar</h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Schedule and manage civic events and maintenance activities
              </p>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                <CalendarDays className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <Badge variant="outline" className="mt-2 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
                Next 7 days
              </Badge>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">16</div>
              <Badge variant="outline" className="mt-2 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                This month
              </Badge>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Attendance</CardTitle>
                <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">432</div>
              <Badge variant="outline" className="mt-2 bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300">
                Total registrations
              </Badge>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg w-fit mb-3">
                <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Create New Event</CardTitle>
              <CardDescription>Schedule a new civic event or meeting</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg w-fit mb-3">
                <CalendarDays className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>View Calendar</CardTitle>
              <CardDescription>Browse all scheduled events</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <CalendarDays className="mr-2 h-4 w-4" />
                Open Calendar
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
            <CardHeader>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg w-fit mb-3">
                <Bell className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>Event Reminders</CardTitle>
              <CardDescription>Manage event notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Bell className="mr-2 h-4 w-4" />
                Manage Reminders
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90 mb-6">
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Next scheduled civic events and activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg text-center min-w-[60px]">
                  <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">JAN</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">18</div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm">Community Town Hall Meeting</h4>
                    <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      Public Meeting
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Monthly town hall to discuss civic improvements and community concerns
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      6:00 PM - 8:00 PM
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      City Hall, Main Auditorium
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      145 registered
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button variant="outline" size="sm">
                      <Bell className="h-3 w-3 mr-1" />
                      Notify
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg text-center min-w-[60px]">
                  <div className="text-xs font-semibold text-green-600 dark:text-green-400">JAN</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">20</div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm">Road Maintenance - Oak Street</h4>
                    <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
                      Maintenance
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Scheduled road resurfacing and repair work on Oak Street between 1st and 5th Avenue
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      8:00 AM - 5:00 PM
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Oak Street, Ward 3
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button variant="outline" size="sm">
                      <Bell className="h-3 w-3 mr-1" />
                      Notify
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg text-center min-w-[60px]">
                  <div className="text-xs font-semibold text-purple-600 dark:text-purple-400">JAN</div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">22</div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm">Park Cleanup Volunteer Day</h4>
                    <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                      Community Event
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Community volunteer event for park cleanup and beautification
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      9:00 AM - 1:00 PM
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Central Park
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      78 volunteers
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button variant="outline" size="sm">
                      <Bell className="h-3 w-3 mr-1" />
                      Notify
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg text-center min-w-[60px]">
                  <div className="text-xs font-semibold text-orange-600 dark:text-orange-400">JAN</div>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">25</div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm">Infrastructure Planning Workshop</h4>
                    <Badge variant="outline" className="bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300">
                      Workshop
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Planning session for upcoming infrastructure projects and budget allocation
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      2:00 PM - 5:00 PM
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      City Hall, Conference Room B
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      32 attendees
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button variant="outline" size="sm">
                      <Bell className="h-3 w-3 mr-1" />
                      Notify
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-3 w-3" />
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
