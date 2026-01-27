"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./auth-context";

export interface Issue {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  reportedBy: {
    id: string;
    name: string;
    email: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    department: string;
  };
  imageUrl?: string;
  reportedDate: string;
  updatedDate: string;
  resolvedDate?: string;
  slaDeadline?: string;
  upvotes: number;
  comments: Comment[];
  tags: string[];
}

export interface Comment {
  id: number;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
}

export interface IssueFilters {
  status?: string[];
  category?: string[];
  priority?: string[];
  search?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

interface IssueContextType {
  issues: Issue[];
  filteredIssues: Issue[];
  isLoading: boolean;
  error: string | null;
  filters: IssueFilters;
  setFilters: (filters: IssueFilters) => void;
  fetchIssues: () => Promise<void>;
  fetchIssueById: (id: number) => Promise<Issue | null>;
  createIssue: (issueData: Partial<Issue>) => Promise<{ success: boolean; error?: string; issue?: Issue }>;
  updateIssue: (id: number, updates: Partial<Issue>) => Promise<{ success: boolean; error?: string }>;
  deleteIssue: (id: number) => Promise<{ success: boolean; error?: string }>;
  upvoteIssue: (id: number) => Promise<{ success: boolean; error?: string }>;
  addComment: (issueId: number, content: string) => Promise<{ success: boolean; error?: string }>;
  getIssuesByCategory: (category: string) => Issue[];
  getIssuesByStatus: (status: string) => Issue[];
  refreshIssues: () => Promise<void>;
}

const IssueContext = createContext<IssueContextType | undefined>(undefined);

export function IssueProvider({ children }: { children: React.ReactNode }) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<IssueFilters>({});
  const { isAuthenticated } = useAuth();

  // Fetch all issues
  const fetchIssues = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/issues");

      if (!response.ok) {
        throw new Error("Failed to fetch issues");
      }

      const data = await response.json();
      setIssues(data.issues || []);
      setFilteredIssues(data.issues || []);
    } catch (err) {
      console.error("Error fetching issues:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch issues");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch single issue by ID
  const fetchIssueById = useCallback(async (id: number): Promise<Issue | null> => {
    try {
      const response = await fetch(`/api/issues/${id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch issue");
      }

      const data = await response.json();
      return data.issue || null;
    } catch (err) {
      console.error("Error fetching issue:", err);
      return null;
    }
  }, []);

  // Create new issue
  const createIssue = useCallback(async (issueData: Partial<Issue>) => {
    try {
      const response = await fetch("/api/issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(issueData),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Failed to create issue" };
      }

      // Add new issue to state
      setIssues((prev) => [data.issue, ...prev]);
      setFilteredIssues((prev) => [data.issue, ...prev]);

      return { success: true, issue: data.issue };
    } catch (err) {
      console.error("Error creating issue:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to create issue",
      };
    }
  }, []);

  // Update issue
  const updateIssue = useCallback(async (id: number, updates: Partial<Issue>) => {
    try {
      const response = await fetch(`/api/issues/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Failed to update issue" };
      }

      // Update issue in state
      setIssues((prev) =>
        prev.map((issue) => (issue.id === id ? { ...issue, ...data.issue } : issue))
      );
      setFilteredIssues((prev) =>
        prev.map((issue) => (issue.id === id ? { ...issue, ...data.issue } : issue))
      );

      return { success: true };
    } catch (err) {
      console.error("Error updating issue:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to update issue",
      };
    }
  }, []);

  // Delete issue
  const deleteIssue = useCallback(async (id: number) => {
    try {
      const response = await fetch(`/api/issues/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Failed to delete issue" };
      }

      // Remove issue from state
      setIssues((prev) => prev.filter((issue) => issue.id !== id));
      setFilteredIssues((prev) => prev.filter((issue) => issue.id !== id));

      return { success: true };
    } catch (err) {
      console.error("Error deleting issue:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to delete issue",
      };
    }
  }, []);

  // Upvote issue
  const upvoteIssue = useCallback(async (id: number) => {
    try {
      const response = await fetch(`/api/issues/${id}/upvote`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Failed to upvote issue" };
      }

      // Update upvote count in state
      setIssues((prev) =>
        prev.map((issue) =>
          issue.id === id ? { ...issue, upvotes: issue.upvotes + 1 } : issue
        )
      );
      setFilteredIssues((prev) =>
        prev.map((issue) =>
          issue.id === id ? { ...issue, upvotes: issue.upvotes + 1 } : issue
        )
      );

      return { success: true };
    } catch (err) {
      console.error("Error upvoting issue:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to upvote issue",
      };
    }
  }, []);

  // Add comment to issue
  const addComment = useCallback(async (issueId: number, content: string) => {
    try {
      const response = await fetch(`/api/issues/${issueId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Failed to add comment" };
      }

      // Update comments in state
      setIssues((prev) =>
        prev.map((issue) =>
          issue.id === issueId
            ? { ...issue, comments: [...issue.comments, data.comment] }
            : issue
        )
      );
      setFilteredIssues((prev) =>
        prev.map((issue) =>
          issue.id === issueId
            ? { ...issue, comments: [...issue.comments, data.comment] }
            : issue
        )
      );

      return { success: true };
    } catch (err) {
      console.error("Error adding comment:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to add comment",
      };
    }
  }, []);

  // Get issues by category
  const getIssuesByCategory = useCallback(
    (category: string) => {
      return issues.filter((issue) => issue.category === category);
    },
    [issues]
  );

  // Get issues by status
  const getIssuesByStatus = useCallback(
    (status: string) => {
      return issues.filter((issue) => issue.status === status);
    },
    [issues]
  );

  // Refresh issues
  const refreshIssues = useCallback(async () => {
    await fetchIssues();
  }, [fetchIssues]);

  // Apply filters whenever filters or issues change
  useEffect(() => {
    let filtered = [...issues];

    // Filter by status
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((issue) => filters.status!.includes(issue.status));
    }

    // Filter by category
    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter((issue) => filters.category!.includes(issue.category));
    }

    // Filter by priority
    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter((issue) => filters.priority!.includes(issue.priority));
    }

    // Filter by search query
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (issue) =>
          issue.title.toLowerCase().includes(searchLower) ||
          issue.description.toLowerCase().includes(searchLower) ||
          issue.location.address.toLowerCase().includes(searchLower)
      );
    }

    // Filter by date range
    if (filters.dateRange) {
      filtered = filtered.filter((issue) => {
        const issueDate = new Date(issue.reportedDate);
        const startDate = new Date(filters.dateRange!.start);
        const endDate = new Date(filters.dateRange!.end);
        return issueDate >= startDate && issueDate <= endDate;
      });
    }

    setFilteredIssues(filtered);
  }, [filters, issues]);

  // Fetch issues on mount
  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const value: IssueContextType = {
    issues,
    filteredIssues,
    isLoading,
    error,
    filters,
    setFilters,
    fetchIssues,
    fetchIssueById,
    createIssue,
    updateIssue,
    deleteIssue,
    upvoteIssue,
    addComment,
    getIssuesByCategory,
    getIssuesByStatus,
    refreshIssues,
  };

  return <IssueContext.Provider value={value}>{children}</IssueContext.Provider>;
}

// Custom hook to use issue context
export function useIssues() {
  const context = useContext(IssueContext);
  if (context === undefined) {
    throw new Error("useIssues must be used within an IssueProvider");
  }
  return context;
}
