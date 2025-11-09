"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ShieldCheck } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminId, setAdminId] = useState("");
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, adminLogin } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      let result;

      if (isAdminLogin) {
        // Admin login requires admin ID
        if (!adminId.trim()) {
          setError("Admin ID is required for administrator login");
          setIsLoading(false);
          return;
        }
        result = await adminLogin(email, password, adminId);

        if (result.success) {
          router.push("/admin");
        } else {
          setError(
            result.error ||
              "Admin login failed. Please check your credentials and Admin ID.",
          );
        }
      } else {
        // Regular user login
        result = await login(email, password);

        if (result.success) {
          router.push("/dashboard");
        } else {
          setError(result.error || "Login failed. Please try again.");
        }
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      className={cn("flex flex-col gap-4 sm:gap-6 p-4 sm:p-6", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-xl sm:text-2xl font-bold">
            {isAdminLogin ? "Administrator Login" : "Welcome Back to OurStreet"}
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm text-balance px-2">
            {isAdminLogin
              ? "Login with your administrator credentials"
              : "Login to report and track civic issues in your community"}
          </p>
        </div>

        {/* Admin Login Toggle */}
        <div className="flex items-center justify-center gap-2 py-2">
          <Button
            type="button"
            variant={isAdminLogin ? "outline" : "ghost"}
            size="sm"
            onClick={() => {
              setIsAdminLogin(false);
              setAdminId("");
              setError("");
            }}
            className="flex-1"
            disabled={isLoading}
          >
            Citizen Login
          </Button>
          <Button
            type="button"
            variant={isAdminLogin ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setIsAdminLogin(true);
              setError("");
            }}
            className="flex-1 gap-1"
            disabled={isLoading}
          >
            <ShieldCheck className="h-4 w-4" />
            Admin Login
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </Field>
        {isAdminLogin && (
          <Field>
            <FieldLabel htmlFor="adminId">Admin ID</FieldLabel>
            <Input
              id="adminId"
              type="text"
              placeholder="Enter your Admin ID"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              required
              disabled={isLoading}
            />
            <FieldDescription>
              Your unique administrator identification code
            </FieldDescription>
          </Field>
        )}
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            {!isAdminLogin && (
              <Link
                href="/forgot-password"
                className="ml-auto text-sm underline-offset-4 hover:underline text-primary"
              >
                Forgot password?
              </Link>
            )}
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </Field>
        <Field>
          <Button
            type="submit"
            className="w-full h-10 sm:h-11"
            disabled={isLoading}
          >
            {isLoading
              ? "Logging in..."
              : isAdminLogin
                ? "Login as Administrator"
                : "Login"}
          </Button>
        </Field>
        {!isAdminLogin && (
          <>
            <FieldSeparator className="text-xs sm:text-sm">
              Or continue with
            </FieldSeparator>
            <Field>
              <Button
                variant="outline"
                type="button"
                className="w-full h-10 sm:h-11 text-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="mr-2 h-4 w-4 flex-shrink-0"
                >
                  <path
                    d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                    fill="currentColor"
                  />
                </svg>
                <span className="hidden sm:inline">Login with GitHub</span>
                <span className="sm:hidden">GitHub</span>
              </Button>
              <FieldDescription className="text-center text-xs sm:text-sm">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="underline underline-offset-4 hover:text-primary font-medium"
                >
                  Sign up
                </Link>
              </FieldDescription>
            </Field>
          </>
        )}
      </FieldGroup>
    </form>
  );
}
