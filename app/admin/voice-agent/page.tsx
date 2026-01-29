"use client";

import React, { useState, useEffect, useRef } from "react";
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
import {
  Send,
  Mail,
  MessageSquare,
  Loader2,
  Mic,
  MicOff,
  Copy,
  Check,
} from "lucide-react";

export default function AdminVoiceAgentPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [manualResponse, setManualResponse] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const recognitionRef = useRef<unknown>(null);

  useEffect(() => {
    // Redirect if not authenticated or not admin
    if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [isAuthenticated, user, isLoading, router]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognitionAPI =
        (window as unknown as { SpeechRecognition?: unknown })
          .SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: unknown })
          .webkitSpeechRecognition;

      if (SpeechRecognitionAPI) {
        const recognition = new (SpeechRecognitionAPI as new () => {
          continuous: boolean;
          interimResults: boolean;
          lang: string;
          onresult: ((event: unknown) => void) | null;
          onerror: ((event: unknown) => void) | null;
          onend: (() => void) | null;
          start: () => void;
          stop: () => void;
        })();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: unknown) => {
          const resultEvent = event as {
            resultIndex: number;
            results: Array<{
              isFinal: boolean;
              [index: number]: { transcript: string };
            }>;
          };

          let finalTranscript = "";

          for (
            let i = resultEvent.resultIndex;
            i < resultEvent.results.length;
            i++
          ) {
            const transcriptPiece = resultEvent.results[i][0].transcript;
            if (resultEvent.results[i].isFinal) {
              finalTranscript += transcriptPiece + " ";
            }
          }

          if (finalTranscript) {
            setTranscript((prev) => prev + finalTranscript);
            setManualResponse((prev) => prev + finalTranscript);
          }
        };

        recognition.onerror = (event: unknown) => {
          const errorEvent = event as { error: string };
          console.error("Speech recognition error:", errorEvent.error);
          if (errorEvent.error === "no-speech") {
            toast.error("No speech detected. Please try again.");
          } else if (errorEvent.error === "not-allowed") {
            toast.error(
              "Microphone access denied. Please enable it in your browser settings.",
            );
          } else {
            toast.error("Speech recognition error: " + errorEvent.error);
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      const recognition = recognitionRef.current as { stop: () => void } | null;
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

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

    console.log("Submit button clicked!");
    console.log("Email:", email);
    console.log("Transcript:", transcript);
    console.log("Manual Response:", manualResponse);

    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    const responseText = manualResponse.trim() || transcript.trim();

    if (!responseText) {
      toast.error("Please provide a response (voice or text)");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    console.log("Sending response:", responseText);
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("citypulse_auth_token");
      console.log("Auth token present:", !!token);

      // Send the response to the user's most recent issue
      const apiResponse = await fetch("/api/admin/send-response", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: email.trim(),
          response: responseText,
          adminName: user?.name || "Admin",
        }),
      });

      console.log("API Response status:", apiResponse.status);
      console.log("API Response status text:", apiResponse.statusText);

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        console.log("API Response data:", data);
        if (data.success) {
          toast.success(
            `Response sent successfully to issue: ${data.data.issueTitle}!`,
            {
              duration: 10000,
              action: {
                label: "View Issue",
                onClick: () => router.push(`/issues/${data.data.issueId}`),
              },
            },
          );
          // Clear the form
          setEmail("");
          setTranscript("");
          setManualResponse("");
        } else {
          console.error("API returned success=false:", data.message);
          toast.error(data.message || "Failed to send response");
        }
      } else {
        // Handle non-OK responses
        console.error("API Response failed with status:", apiResponse.status);
        let errorMessage = "Failed to send response. Please try again.";

        try {
          const errorData = await apiResponse.json();
          console.error("API error response:", errorData);
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          // If response is not JSON, try to get text
          console.error("Could not parse error as JSON:", jsonError);
          try {
            const errorText = await apiResponse.text();
            console.error("API error text:", errorText);
            errorMessage = errorText || errorMessage;
          } catch (textError) {
            console.error("Could not read error response:", textError);
          }
        }

        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error sending response:", error);
      toast.error(
        `An error occurred: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleListening = () => {
    const recognition = recognitionRef.current as {
      start: () => void;
      stop: () => void;
    } | null;

    if (!recognition) {
      toast.error("Speech recognition is not supported in your browser.");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
        toast.success("Listening... Speak now");
      } catch (error) {
        console.error("Error starting recognition:", error);
        toast.error("Failed to start speech recognition");
      }
    }
  };

  const copyTranscript = async () => {
    try {
      await navigator.clipboard.writeText(transcript);
      setIsCopied(true);
      toast.success("Transcript copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("Failed to copy transcript");
    }
  };

  const clearAll = () => {
    setEmail("");
    setTranscript("");
    setManualResponse("");
    if (isListening) {
      const recognition = recognitionRef.current as { stop: () => void } | null;
      if (recognition) {
        recognition.stop();
      }
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
            Send voice responses to users. Your response will be added as a
            comment to the user&apos;s most recent reported issue.
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
              Enter the user&apos;s email and record your voice response
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
                  The response will be added to this user&apos;s most recent
                  issue
                </p>
              </div>

              {/* Voice Input Section */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-base">
                  <Mic className="h-4 w-4" />
                  Voice Input
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={isListening ? "destructive" : "default"}
                    onClick={toggleListening}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isListening ? (
                      <>
                        <MicOff className="mr-2 h-4 w-4" />
                        Stop Listening
                      </>
                    ) : (
                      <>
                        <Mic className="mr-2 h-4 w-4" />
                        Start Voice Input
                      </>
                    )}
                  </Button>
                </div>
                {isListening && (
                  <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 animate-pulse">
                    <div className="h-2 w-2 rounded-full bg-red-600 dark:bg-red-400" />
                    Recording...
                  </div>
                )}
              </div>

              {/* Transcript Display */}
              {transcript && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-base">
                      <MessageSquare className="h-4 w-4" />
                      Voice Transcript
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyTranscript}
                      disabled={!transcript}
                    >
                      {isCopied ? (
                        <>
                          <Check className="mr-2 h-3 w-3" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-3 w-3" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="p-4 rounded-lg border bg-muted/50 min-h-25 max-h-50 overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">{transcript}</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    This transcript will be sent as your response
                  </p>
                </div>
              )}

              {/* Manual Response Input */}
              <div className="space-y-2">
                <Label
                  htmlFor="manualResponse"
                  className="flex items-center gap-2 text-base"
                >
                  <MessageSquare className="h-4 w-4" />
                  Response (Edit or Type Manually)
                </Label>
                <Textarea
                  id="manualResponse"
                  placeholder="Your voice transcript appears here automatically, or you can type your response manually..."
                  value={manualResponse}
                  onChange={(e) => setManualResponse(e.target.value)}
                  rows={8}
                  className="text-base resize-none"
                  disabled={isSubmitting}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Edit the voice transcript or type your response directly
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearAll}
                  disabled={isSubmitting}
                >
                  Clear All
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
                  <li>• Use voice input to dictate your response</li>
                  <li>• View and copy your voice transcript in real-time</li>
                  <li>
                    • Click &quot;Submit Response&quot; to add your response as
                    a comment
                  </li>
                  <li>
                    • The response will appear in the user&apos;s most recent
                    issue details
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
