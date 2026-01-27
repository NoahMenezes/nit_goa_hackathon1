"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle, Mail } from "lucide-react";

function VerifyEmailContent() {
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setIsVerifying(false);
        setError("Invalid verification link. No token provided.");
        toast.error("Invalid verification link");
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setVerificationSuccess(true);
          toast.success("Email verified successfully!");
        } else {
          setError(data.error || "Failed to verify email");
          toast.error(data.error || "Verification failed");
        }
      } catch (error) {
        console.error("Email verification error:", error);
        setError("An error occurred during verification");
        toast.error("Verification failed");
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [token]);

  // Verifying state
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <div className="relative">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <Mail className="w-5 h-5 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">Verifying Your Email</p>
                <p className="text-sm text-muted-foreground">
                  Please wait while we verify your email address...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (verificationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">Email Verified!</CardTitle>
            <CardDescription>
              Your email address has been successfully verified.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="text-sm text-green-800 dark:text-green-200 space-y-2">
                <p className="font-medium">✓ Email verification complete</p>
                <p>You now have access to all CityPulse features:</p>
                <ul className="list-disc list-inside ml-2 space-y-1 text-xs">
                  <li>Report civic issues in your area</li>
                  <li>Vote and comment on existing reports</li>
                  <li>Track issue resolution progress</li>
                  <li>Receive updates and notifications</li>
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => router.push("/dashboard")}
              >
                Go to Dashboard
              </Button>
              <Link href="/report">
                <Button variant="outline" className="w-full">
                  Report an Issue
                </Button>
              </Link>
            </div>

            <div className="text-center text-xs text-muted-foreground">
              <Link href="/login" className="hover:underline">
                Not logged in? Sign in here
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl">Verification Failed</CardTitle>
          <CardDescription>
            We couldn&apos;t verify your email address.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>Error:</strong> {error}
            </p>
          </div>

          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium">This could happen if:</p>
            <ul className="list-disc list-inside ml-2 space-y-1 text-xs">
              <li>
                The verification link has expired (links are valid for 24 hours)
              </li>
              <li>The link was already used</li>
              <li>The link is invalid or corrupted</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={async () => {
                const email = prompt(
                  "Please enter your email address to resend verification:",
                );
                if (email) {
                  try {
                    const response = await fetch("/api/auth/verify-email", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email }),
                    });
                    if (response.ok) {
                      toast.success(
                        "Verification email sent! Check your inbox.",
                      );
                    } else {
                      const data = await response.json();
                      toast.error(
                        data.error || "Failed to send verification email",
                      );
                    }
                  } catch {
                    toast.error("Failed to send verification email");
                  }
                }
              }}
            >
              <Mail className="w-4 h-4 mr-2" />
              Resend Verification Email
            </Button>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                Back to Login
              </Button>
            </Link>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            Need help?{" "}
            <Link href="/contact" className="text-primary hover:underline">
              Contact support
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
