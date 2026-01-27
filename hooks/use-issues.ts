"use client";

import { useState, useEffect, useCallback } from "react";
import { issuesAPI } from "@/lib/api-client";
import { Issue, IssueFilters, CreateIssueRequest } from "@/lib/types";
import toast from "react-hot-toast";

export function useIssues(initialFilters?: IssueFilters) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<IssueFilters>(initialFilters || {});

  // Fetch issues
  const fetchIssues = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await issuesAPI.getAll(filters);

      if (response.success && response.data) {
        setIssues(response.data.issues);
        setTotal(response.data.total);
      } else {
        setError(response.error || "Failed to fetch issues");
      }
    } catch (err) {
      setError("An error occurred while fetching issues");
      console.error("Fetch issues error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Load issues on mount and when filters change
  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  // Create new issue
  const createIssue = async (data: CreateIssueRequest) => {
    try {
      const response = await issuesAPI.create(data);

      if (response.success && response.data) {
        toast.success("Issue reported successfully!");
        // Add new issue to the list
        setIssues((prev) => [response.data!, ...prev]);
        setTotal((prev) => prev + 1);
        return { success: true, issue: response.data };
      } else {
        toast.error(response.error || "Failed to create issue");
        return { success: false, error: response.error };
      }
    } catch {
      const errorMsg = "An error occurred while creating the issue";
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Update issue
  const updateIssue = async (id: string, data: Partial<Issue>) => {
    try {
      const response = await issuesAPI.update(id, data);

      if (response.success && response.data) {
        toast.success("Issue updated successfully!");
        // Update issue in the list
        setIssues((prev) =>
          prev.map((issue) => (issue.id === id ? response.data! : issue)),
        );
        return { success: true, issue: response.data };
      } else {
        toast.error(response.error || "Failed to update issue");
        return { success: false, error: response.error };
      }
    } catch {
      const errorMsg = "An error occurred while updating the issue";
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Delete issue
  const deleteIssue = async (id: string) => {
    try {
      const response = await issuesAPI.delete(id);

      if (response.success) {
        toast.success("Issue deleted successfully!");
        // Remove issue from the list
        setIssues((prev) => prev.filter((issue) => issue.id !== id));
        setTotal((prev) => prev - 1);
        return { success: true };
      } else {
        toast.error(response.error || "Failed to delete issue");
        return { success: false, error: response.error };
      }
    } catch {
      const errorMsg = "An error occurred while deleting the issue";
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Update filters
  const updateFilters = (newFilters: IssueFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Refresh issues
  const refresh = () => {
    fetchIssues();
  };

  return {
    issues,
    isLoading,
    error,
    total,
    filters,
    createIssue,
    updateIssue,
    deleteIssue,
    updateFilters,
    refresh,
  };
}

// Hook for single issue
export function useIssue(id: string) {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIssue = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await issuesAPI.getById(id);

      if (response.success && response.data) {
        setIssue(response.data);
      } else {
        setError(response.error || "Failed to fetch issue");
      }
    } catch (err) {
      setError("An error occurred while fetching the issue");
      console.error("Fetch issue error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchIssue();
  }, [fetchIssue]);

  return {
    issue,
    isLoading,
    error,
    refresh: fetchIssue,
  };
}
