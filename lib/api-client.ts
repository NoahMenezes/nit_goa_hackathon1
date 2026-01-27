// Enhanced API Client for CityPulse
// Centralized API layer with proper error handling, authentication, and retry logic

import Cookies from "js-cookie";
import {
  AuthResponse,
  ApiResponse,
  Issue,
  Comment,
  DashboardStats,
  CreateIssueRequest,
  UpdateIssueRequest,
  CreateCommentRequest,
  IssueFilters,
  User,
} from "./types";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  createdAt?: string;
}

interface RequestConfig extends RequestInit {
  retries?: number;
  timeout?: number;
  skipAuth?: boolean;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const TOKEN_KEY = "citypulse_auth_token";
const USER_KEY = "citypulse_user_data";
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;

// Determine API base URL
const getApiBaseUrl = (): string => {
  // In production, use relative URLs for same-origin requests
  if (typeof window !== "undefined" && window.location.origin) {
    return `${window.location.origin}/api`;
  }
  // Fallback for SSR or development
  return process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api`
    : "http://localhost:3000/api";
};

const API_BASE_URL = getApiBaseUrl();

// ============================================================================
// TOKEN MANAGEMENT (Secure Cookie-based)
// ============================================================================

export function setAuthToken(token: string): void {
  // Store in secure HTTP-only-style cookie (as secure as js-cookie allows)
  Cookies.set(TOKEN_KEY, token, {
    expires: 7, // 7 days
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
  });
}

export function getAuthToken(): string | null {
  return Cookies.get(TOKEN_KEY) || null;
}

export function removeAuthToken(): void {
  Cookies.remove(TOKEN_KEY);
}

// ============================================================================
// USER DATA MANAGEMENT (localStorage with SSR safety)
// ============================================================================

export function setUserData(user: AuthUser): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error("Failed to store user data:", error);
    }
  }
}

export function getUserData(): AuthUser | null {
  if (typeof window === "undefined") return null;

  try {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Failed to retrieve user data:", error);
    return null;
  }
}

export function removeUserData(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(USER_KEY);
      // Also clear voted issues tracking
      localStorage.removeItem("votedIssues");
    } catch (error) {
      console.error("Failed to remove user data:", error);
    }
  }
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function handleApiError(error: unknown, endpoint: string): never {
  if (error instanceof ApiError) {
    throw error;
  }

  if (error instanceof Error) {
    throw new ApiError(
      `API request to ${endpoint} failed: ${error.message}`,
      undefined,
      "NETWORK_ERROR",
    );
  }

  throw new ApiError(
    `Unknown error occurred while calling ${endpoint}`,
    undefined,
    "UNKNOWN_ERROR",
  );
}

// ============================================================================
// CORE API REQUEST FUNCTION
// ============================================================================

async function apiRequest<T = unknown>(
  endpoint: string,
  config: RequestConfig = {},
): Promise<ApiResponse<T>> {
  const {
    retries = MAX_RETRIES,
    timeout = DEFAULT_TIMEOUT,
    skipAuth = false,
    ...options
  } = config;

  const url = `${API_BASE_URL}${endpoint}`;
  const token = skipAuth ? null : getAuthToken();

  // Build headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  // Add authorization header if token exists
  if (token && !skipAuth) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle non-JSON responses
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new ApiError(
        "Server returned non-JSON response",
        response.status,
        "INVALID_RESPONSE",
      );
    }

    const data = await response.json();

    // Handle HTTP errors
    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        removeAuthToken();
        removeUserData();
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.includes("/login")
        ) {
          window.location.href = "/login?session_expired=true";
        }
        throw new ApiError(
          data.error || "Authentication required",
          401,
          "UNAUTHORIZED",
        );
      }

      // Handle forbidden errors
      if (response.status === 403) {
        throw new ApiError(data.error || "Access forbidden", 403, "FORBIDDEN");
      }

      // Handle not found errors
      if (response.status === 404) {
        throw new ApiError(
          data.error || "Resource not found",
          404,
          "NOT_FOUND",
        );
      }

      // Handle rate limiting
      if (response.status === 429) {
        throw new ApiError(
          data.error || "Too many requests. Please try again later.",
          429,
          "RATE_LIMITED",
        );
      }

      // Handle server errors with retry logic
      if (response.status >= 500 && retries > 0) {
        console.warn(`Server error, retrying... (${retries} attempts left)`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return apiRequest<T>(endpoint, { ...config, retries: retries - 1 });
      }

      // Generic error
      throw new ApiError(
        data.error || "An error occurred",
        response.status,
        "API_ERROR",
      );
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle abort/timeout
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("Request timeout", undefined, "TIMEOUT");
    }

    // Handle network errors with retry
    if (error instanceof TypeError && error.message.includes("fetch")) {
      if (retries > 0) {
        console.warn(`Network error, retrying... (${retries} attempts left)`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return apiRequest<T>(endpoint, { ...config, retries: retries - 1 });
      }
      throw new ApiError(
        "Network error. Please check your connection.",
        undefined,
        "NETWORK_ERROR",
      );
    }

    // Re-throw ApiErrors
    if (error instanceof ApiError) {
      throw error;
    }

    // Unknown error
    handleApiError(error, endpoint);
  }
}

// ============================================================================
// AUTHENTICATION API
// ============================================================================

export const authAPI = {
  /**
   * Sign up a new user
   */
  async signup(data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    role?: "citizen" | "admin";
  }): Promise<AuthResponse> {
    try {
      const response = (await apiRequest<AuthUser>("/auth/signup", {
        method: "POST",
        body: JSON.stringify(data),
        skipAuth: true,
      })) as AuthResponse;

      if (response.success && response.token && response.user) {
        setAuthToken(response.token);
        setUserData(response.user);
      }

      return response;
    } catch (err) {
      if (err instanceof ApiError) {
        return {
          success: false,
          error: err.message,
        };
      }
      return {
        success: false,
        error: "Signup failed. Please try again.",
      };
    }
  },

  /**
   * Login an existing user
   */
  async login(data: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    try {
      const response = (await apiRequest<AuthUser>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
        skipAuth: true,
      })) as AuthResponse;

      if (response.success && response.token && response.user) {
        setAuthToken(response.token);
        setUserData(response.user);
      }

      return response;
    } catch (err) {
      if (err instanceof ApiError) {
        return {
          success: false,
          error: err.message,
        };
      }
      return {
        success: false,
        error: "Login failed. Please try again.",
      };
    }
  },

  /**
   * Logout the current user
   */
  logout(): void {
    removeAuthToken();
    removeUserData();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },

  /**
   * Check if user session is valid
   */
  async checkSession(): Promise<boolean> {
    if (!isAuthenticated()) return false;

    try {
      const response = await apiRequest("/user");
      return response.success;
    } catch {
      return false;
    }
  },

  /**
   * Request password reset email
   */
  async forgotPassword(email: string): Promise<ApiResponse> {
    try {
      return await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
        skipAuth: true,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        return {
          success: false,
          error: err.message,
        };
      }
      return {
        success: false,
        error: "Failed to send reset email. Please try again.",
      };
    }
  },

  /**
   * Reset password with token
   */
  async resetPassword(data: {
    token: string;
    password: string;
    confirmPassword: string;
  }): Promise<ApiResponse> {
    try {
      return await apiRequest("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(data),
        skipAuth: true,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        return {
          success: false,
          error: err.message,
        };
      }
      return {
        success: false,
        error: "Failed to reset password. Please try again.",
      };
    }
  },

  /**
   * Verify reset token validity
   */
  async verifyResetToken(
    token: string,
  ): Promise<ApiResponse<{ valid: boolean; email: string }>> {
    try {
      return await apiRequest(`/auth/reset-password?token=${token}`, {
        skipAuth: true,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        return {
          success: false,
          error: err.message,
        };
      }
      return {
        success: false,
        error: "Failed to verify token.",
      };
    }
  },

  /**
   * Send email verification link
   */
  async sendVerificationEmail(email: string): Promise<ApiResponse> {
    try {
      return await apiRequest("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ email }),
        skipAuth: true,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        return {
          success: false,
          error: err.message,
        };
      }
      return {
        success: false,
        error: "Failed to send verification email. Please try again.",
      };
    }
  },

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<ApiResponse> {
    try {
      return await apiRequest(`/auth/verify-email?token=${token}`, {
        skipAuth: true,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        return {
          success: false,
          error: err.message,
        };
      }
      return {
        success: false,
        error: "Failed to verify email. Please try again.",
      };
    }
  },
};

// ============================================================================
// ISSUES API
// ============================================================================

export const issuesAPI = {
  /**
   * Get all issues with optional filters
   */
  async getAll(filters?: IssueFilters): Promise<
    ApiResponse<{
      issues: Issue[];
      total: number;
      limit?: number;
      offset?: number;
    }>
  > {
    try {
      const params = new URLSearchParams();

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }

      const query = params.toString();
      return await apiRequest(`/issues${query ? `?${query}` : ""}`);
    } catch (error) {
      console.error("Failed to fetch issues:", error);
      return {
        success: false,
        error:
          error instanceof ApiError ? error.message : "Failed to fetch issues",
      };
    }
  },

  /**
   * Get a single issue by ID
   */
  async getById(id: string): Promise<ApiResponse<Issue>> {
    try {
      return await apiRequest(`/issues/${id}`);
    } catch (error) {
      console.error(`Failed to fetch issue ${id}:`, error);
      return {
        success: false,
        error:
          error instanceof ApiError ? error.message : "Failed to fetch issue",
      };
    }
  },

  /**
   * Create a new issue
   */
  async create(data: CreateIssueRequest): Promise<ApiResponse<Issue>> {
    try {
      return await apiRequest("/issues", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Failed to create issue:", error);
      return {
        success: false,
        error:
          error instanceof ApiError ? error.message : "Failed to create issue",
      };
    }
  },

  /**
   * Update an existing issue
   */
  async update(
    id: string,
    data: UpdateIssueRequest,
  ): Promise<ApiResponse<Issue>> {
    try {
      return await apiRequest(`/issues/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error(`Failed to update issue ${id}:`, error);
      return {
        success: false,
        error:
          error instanceof ApiError ? error.message : "Failed to update issue",
      };
    }
  },

  /**
   * Delete an issue
   */
  async delete(id: string): Promise<ApiResponse> {
    try {
      return await apiRequest(`/issues/${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error(`Failed to delete issue ${id}:`, error);
      return {
        success: false,
        error:
          error instanceof ApiError ? error.message : "Failed to delete issue",
      };
    }
  },
};

// ============================================================================
// COMMENTS API
// ============================================================================

export const commentsAPI = {
  /**
   * Get all comments for an issue
   */
  async getByIssueId(
    issueId: string,
  ): Promise<ApiResponse<{ comments: Comment[]; total: number }>> {
    try {
      return await apiRequest(`/issues/${issueId}/comments`);
    } catch (error) {
      console.error(`Failed to fetch comments for issue ${issueId}:`, error);
      return {
        success: false,
        error:
          error instanceof ApiError
            ? error.message
            : "Failed to fetch comments",
      };
    }
  },

  /**
   * Add a comment to an issue
   */
  async create(
    issueId: string,
    data: CreateCommentRequest,
  ): Promise<ApiResponse<Comment>> {
    try {
      return await apiRequest(`/issues/${issueId}/comments`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error(`Failed to add comment to issue ${issueId}:`, error);
      return {
        success: false,
        error:
          error instanceof ApiError ? error.message : "Failed to add comment",
      };
    }
  },

  /**
   * Delete a comment
   */
  async delete(issueId: string, commentId: string): Promise<ApiResponse> {
    try {
      return await apiRequest(
        `/issues/${issueId}/comments?commentId=${commentId}`,
        {
          method: "DELETE",
        },
      );
    } catch (error) {
      console.error(`Failed to delete comment ${commentId}:`, error);
      return {
        success: false,
        error:
          error instanceof ApiError
            ? error.message
            : "Failed to delete comment",
      };
    }
  },
};

// ============================================================================
// VOTES API
// ============================================================================

export const votesAPI = {
  /**
   * Toggle vote for an issue
   */
  async toggle(
    issueId: string,
  ): Promise<ApiResponse<{ voted: boolean; votes: number }>> {
    try {
      return await apiRequest(`/issues/${issueId}/vote`, {
        method: "POST",
      });
    } catch (error) {
      console.error(`Failed to toggle vote for issue ${issueId}:`, error);
      return {
        success: false,
        error:
          error instanceof ApiError ? error.message : "Failed to toggle vote",
      };
    }
  },

  /**
   * Get vote status for an issue
   */
  async getStatus(
    issueId: string,
  ): Promise<ApiResponse<{ voted: boolean; votes: number }>> {
    try {
      return await apiRequest(`/issues/${issueId}/vote`);
    } catch (error) {
      console.error(`Failed to get vote status for issue ${issueId}:`, error);
      return {
        success: false,
        error:
          error instanceof ApiError
            ? error.message
            : "Failed to get vote status",
      };
    }
  },
};

// ============================================================================
// DASHBOARD & ANALYTICS API
// ============================================================================

export const dashboardAPI = {
  /**
   * Get dashboard statistics
   */
  async getStats(): Promise<ApiResponse<DashboardStats>> {
    try {
      return await apiRequest("/dashboard");
    } catch (error) {
      // Don't log auth errors since they're expected when not logged in
      if (error instanceof ApiError && error.statusCode === 401) {
        // User is being redirected to login, don't spam console
        return {
          success: false,
          error: "Authentication required",
        };
      }
      console.error("Failed to fetch dashboard stats:", error);
      return {
        success: false,
        error:
          error instanceof ApiError
            ? error.message
            : "Failed to fetch statistics",
      };
    }
  },
};

// ============================================================================
// USER API
// ============================================================================

export const userAPI = {
  /**
   * Get current user profile
   */
  async getProfile(): Promise<
    ApiResponse<{
      user: Omit<User, "password">;
      stats: {
        issuesCreated: number;
        commentsPosted: number;
        votesGiven: number;
      };
    }>
  > {
    try {
      return await apiRequest("/user");
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      return {
        success: false,
        error:
          error instanceof ApiError ? error.message : "Failed to fetch profile",
      };
    }
  },

  /**
   * Update user profile
   */
  async update(data: { name?: string; avatar?: string }): Promise<ApiResponse> {
    try {
      return await apiRequest("/user", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
      return {
        success: false,
        error:
          error instanceof ApiError
            ? error.message
            : "Failed to update profile",
      };
    }
  },

  /**
   * Delete user account
   */
  async delete(): Promise<ApiResponse> {
    try {
      return await apiRequest("/user", {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Failed to delete account:", error);
      return {
        success: false,
        error:
          error instanceof ApiError
            ? error.message
            : "Failed to delete account",
      };
    }
  },
};

// ============================================================================
// AI CATEGORIZATION API
// ============================================================================

export const aiAPI = {
  /**
   * Get AI-powered categorization for a report
   */
  async categorize(data: {
    title: string;
    description: string;
    location?: string;
  }): Promise<
    ApiResponse<{
      category: string;
      priority: string;
      suggestedTitle?: string;
      tags?: string[];
      confidence?: number;
    }>
  > {
    try {
      return await apiRequest("/ai/categorize", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Failed to get AI categorization:", error);
      return {
        success: false,
        error:
          error instanceof ApiError
            ? error.message
            : "AI categorization failed",
      };
    }
  },
};

// ============================================================================
// FILE UPLOAD API
// ============================================================================

export const uploadAPI = {
  /**
   * Upload an image file
   */
  async uploadImage(file: File): Promise<ApiResponse<{ url: string }>> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.error || "Upload failed",
          response.status,
          "UPLOAD_ERROR",
        );
      }

      return data;
    } catch (error) {
      console.error("Failed to upload image:", error);
      return {
        success: false,
        error:
          error instanceof ApiError ? error.message : "Failed to upload image",
      };
    }
  },
};

// ============================================================================
// HEALTH CHECK API
// ============================================================================

export const healthAPI = {
  /**
   * Check API health status
   */
  async check(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    try {
      return await apiRequest("/health", { skipAuth: true });
    } catch (error) {
      console.error("Health check failed:", error);
      return {
        success: false,
        error: "API is not responding",
      };
    }
  },
};

// ============================================================================
// UNIFIED API EXPORT
// ============================================================================

const api = {
  auth: authAPI,
  issues: issuesAPI,
  comments: commentsAPI,
  votes: votesAPI,
  dashboard: dashboardAPI,
  user: userAPI,
  ai: aiAPI,
  upload: uploadAPI,
  health: healthAPI,
};

export default api;

// Export ApiError for external use
export { ApiError };
