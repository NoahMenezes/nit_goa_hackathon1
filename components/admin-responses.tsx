"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Mail, Clock, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface AdminResponse {
  _id: string;
  recipientEmail: string;
  response: string;
  adminName: string;
  adminId: string;
  createdAt: string;
  status: string;
  type: string;
}

export function AdminResponses() {
  const [responses, setResponses] = useState<AdminResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchResponses = async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);

      const token = localStorage.getItem("citypulse_auth_token");
      const response = await fetch("/api/admin/send-response", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setResponses(data.data || []);
          if (showToast) {
            toast.success("Responses refreshed!");
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch admin responses:", error);
      if (showToast) {
        toast.error("Failed to refresh responses");
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, []);

  const markAsRead = async (responseId: string) => {
    // This would call an API to mark the response as read
    // For now, we'll just update the local state
    setResponses((prev) =>
      prev.map((r) =>
        r._id === responseId ? { ...r, status: "read" } : r
      )
    );
  };

  if (isLoading) {
    return (
      <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Admin Responses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Admin Responses
            </CardTitle>
            <CardDescription>
              Messages and responses from administrators
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchResponses(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {responses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-gray-500 dark:text-gray-400">
              No admin responses yet
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {responses.map((response) => (
                <div
                  key={response._id}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                        <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                          {response.adminName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(response.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={response.status === "sent" ? "default" : "secondary"}
                    >
                      {response.status === "sent" ? "New" : "Read"}
                    </Badge>
                  </div>
                  <div className="mt-3 mb-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {response.response}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      To: {response.recipientEmail}
                    </p>
                    {response.status === "sent" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(response._id)}
                        className="h-7 text-xs"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Mark as read
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
