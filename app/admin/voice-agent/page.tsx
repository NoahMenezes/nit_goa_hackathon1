"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Silk from "@/components/ui/silk/Silk";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Send, Mail, MessageSquare, Loader2 } from "lucide-react";

export default function AdminVoiceAgentPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [response, setResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Redirect if not authenticated or not admin
    if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [isAuthenticated, user, isLoading, router]);

  // Show loading state
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

  // Redirect non-admins
  if (user?.role !== "admin") {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    if (!response.trim()) {
      toast.error("Please enter a response");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("citypulse_auth_token");

      // Send the response to all user accounts
      const apiResponse = await fetch("/api/admin/send-response", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: email.trim(),
          response: response.trim(),
          adminName: user?.name || "Admin",
        }),
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        if (data.success) {
          toast.success("Response sent successfully to all users!");
          // Clear the form
          setEmail("");
          setResponse("");
        } else {
          toast.error(data.message || "Failed to send response");
        }
      } else {
        toast.error("Failed to send response. Please try again.");
      }
    } catch (error) {
      console.error("Error sending response:", error);
      toast.error("An error occurred while sending the response");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Silk Background - Only Silk, no other background */}
      <div className="fixed inset-0 w-full h-full z-0">
        <Silk
          speed={5}
          scale={1}
          color="#5227FF"
          noiseIntensity={1.5}
          rotation={0}
        />
      </div>

      {/* Overlay for better contrast */}
      <div className="fixed inset-0 w-full h-full z-1 bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-sm" />

      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-3 text-black dark:text-white">
            Admin Voice Agent Response
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            Generate and send responses to users through the voice agent system.
            Your response will be stored and sent to all user accounts.
          </p>
        </div>

        {/* Main Response Form */}
        <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Generate Response
            </CardTitle>
            <CardDescription>
              Enter the recipient&apos;s email and compose your response below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="flex items-center gap-2 text-base"
                >
                  <Mail className="h-4 w-4" />
                  Recipient Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-base"
                  disabled={isSubmitting}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Enter the email address of the user you&apos;re responding to
                </p>
              </div>

              {/* Response Textarea */}
              <div className="space-y-2">
                <Label
                  htmlFor="response"
                  className="flex items-center gap-2 text-base"
                >
                  <MessageSquare className="h-4 w-4" />
                  Your Response
                </Label>
                <Textarea
                  id="response"
                  placeholder="Type your response here... This message will be sent to all users and stored in their accounts."
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={12}
                  className="text-base resize-none"
                  disabled={isSubmitting}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Compose your response. This will be delivered to all user
                  accounts.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEmail("");
                    setResponse("");
                  }}
                  disabled={isSubmitting}
                >
                  Clear
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-30"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit Response
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 backdrop-blur-md bg-blue-50/90 dark:bg-blue-950/90 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="shrink-0">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  How it works
                </h3>
                <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                  <li>
                    • Enter the email address of the user you&apos;re responding
                    to
                  </li>
                  <li>• Compose your response in the text area below</li>
                  <li>
                    • Click &quot;Submit Response&quot; to send it to all user
                    accounts
                  </li>
                  <li>
                    • Users will be able to see this response in their account
                    dashboard
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="mt-6 flex justify-center">
          <Button
            variant="ghost"
            onClick={() => router.push("/admin")}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            ← Back to Admin Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
