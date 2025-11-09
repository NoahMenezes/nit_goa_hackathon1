"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  authAPI,
  getUserData,
  isAuthenticated,
  AuthUser,
} from "@/lib/api-client";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  adminLogin: (
    email: string,
    password: string,
    adminId: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signup: (
    name: string,
    email: string,
    password: string,
    confirmPassword: string,
    role?: "citizen" | "admin",
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  checkSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/map",
  "/issues",
  "/team",
  "/transparency",
  "/dashboard", // Allow guests to view dashboard
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Logout function - defined early so it can be used in useEffect
  const logout = () => {
    authAPI.logout();
    setUser(null);
    router.push("/login");
  };

  // Check session validity
  const checkSession = async (): Promise<boolean> => {
    if (!isAuthenticated()) {
      return false;
    }

    try {
      const isValid = await authAPI.checkSession();
      if (!isValid) {
        // Session expired, clear auth data
        setUser(null);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Session check failed:", error);
      setUser(null);
      return false;
    }
  };

  // Load user data and verify session on mount
  useEffect(() => {
    const loadUser = async () => {
      if (isAuthenticated()) {
        const userData = getUserData();
        setUser(userData);

        // Verify session is still valid
        const isValid = await checkSession();
        if (!isValid && userData) {
          // Session expired, redirect to login
          const isPublicRoute = PUBLIC_ROUTES.some((route) =>
            pathname?.startsWith(route),
          );
          if (!isPublicRoute && pathname && router) {
            router.push("/login?session_expired=true");
          }
        }
      }
      setIsLoading(false);
      setSessionChecked(true);
    };

    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Periodic session check (every 5 minutes)
  useEffect(() => {
    if (!sessionChecked || !user) return;

    const interval = setInterval(
      async () => {
        const isValid = await checkSession();
        if (!isValid && user) {
          console.log("Session expired, redirecting to login");
          logout();
        }
      },
      5 * 60 * 1000,
    ); // 5 minutes

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionChecked, user]);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authAPI.login({ email, password });

      if (response.success && response.user) {
        setUser(response.user);
        setIsLoading(false);
        return { success: true };
      } else {
        setIsLoading(false);
        return { success: false, error: response.error || "Login failed" };
      }
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An error occurred during login",
      };
    }
  };

  // Admin login function
  const adminLogin = async (
    email: string,
    password: string,
    adminId: string,
  ) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, adminId }),
      });

      const data = await response.json();

      if (data.success && data.user && data.token) {
        // Store token and user data
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        setIsLoading(false);
        return { success: true };
      } else {
        setIsLoading(false);
        return {
          success: false,
          error: data.error || "Admin login failed",
        };
      }
    } catch (error) {
      console.error("Admin login error:", error);
      setIsLoading(false);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An error occurred during admin login",
      };
    }
  };

  // Signup function
  const signup = async (
    name: string,
    email: string,
    password: string,
    confirmPassword: string,
    role: "citizen" | "admin" = "citizen",
  ) => {
    try {
      setIsLoading(true);
      const response = await authAPI.signup({
        name,
        email,
        password,
        confirmPassword,
        role,
      });

      if (response.success && response.user) {
        setUser(response.user);
        setIsLoading(false);
        return { success: true };
      } else {
        setIsLoading(false);
        return { success: false, error: response.error || "Signup failed" };
      }
    } catch (error) {
      console.error("Signup error:", error);
      setIsLoading(false);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An error occurred during signup",
      };
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    if (isAuthenticated()) {
      const userData = getUserData();
      setUser(userData);

      // Also verify session
      await checkSession();
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user && isAuthenticated(),
    login,
    adminLogin,
    signup,
    logout,
    refreshUser,
    checkSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
