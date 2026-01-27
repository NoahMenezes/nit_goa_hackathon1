"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Download,
  RefreshCw,
  Eye,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Issue } from "@/lib/types";

interface IssueFilters {
  status?: string;
  category?: string;
  ward?: string;
  priority?: string;
  search?: string;
}

export default function AdminIssuesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [filters, setFilters] = useState<IssueFilters>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [isAuthenticated, user, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      fetchIssues();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, filters]);

  const fetchIssues = async () => {
    setLoadingIssues(true);
    try {
      const token = localStorage.getItem("citypulse_auth_token");
      const params = new URLSearchParams();

      if (filters.status) params.append("status", filters.status);
      if (filters.category) params.append("category", filters.category);
      if (filters.ward) params.append("ward", filters.ward);
      if (filters.priority) params.append("priority", filters.priority);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/admin/issues?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIssues(data.data || []);
        }
      } else {
        toast.error("Failed to fetch issues");
      }
    } catch (error) {
      console.error("Failed to fetch issues:", error);
      toast.error("An error occurred while fetching issues");
    } finally {
      setLoadingIssues(false);
    }
  };

  const handleStatusUpdate = async (issueId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("citypulse_auth_token");
      const response = await fetch(`/api/issues/${issueId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success("Issue status updated successfully");
        fetchIssues();
      } else {
        toast.error("Failed to update issue status");
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("An error occurred while updating status");
    }
  };

  const handleDeleteIssue = async (issueId: string) => {
    if (!confirm("Are you sure you want to delete this issue?")) return;

    try {
      const token = localStorage.getItem("citypulse_auth_token");
      const response = await fetch(`/api/issues/${issueId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success("Issue deleted successfully");
        fetchIssues();
      } else {
        toast.error("Failed to delete issue");
      }
    } catch (error) {
      console.error("Failed to delete issue:", error);
      toast.error("An error occurred while deleting issue");
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedIssues.length === 0) {
      toast.error("Please select issues to update");
      return;
    }

    try {
      const token = localStorage.getItem("citypulse_auth_token");
      const updatePromises = selectedIssues.map((issueId) =>
        fetch(`/api/issues/${issueId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }),
      );

      await Promise.all(updatePromises);
      toast.success(`${selectedIssues.length} issues updated successfully`);
      setSelectedIssues([]);
      fetchIssues();
    } catch (error) {
      console.error("Failed to update issues:", error);
      toast.error("An error occurred while updating issues");
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ["ID", "Title", "Category", "Status", "Ward", "Priority", "Created At"],
      ...issues.map((issue) => [
        issue.id,
        issue.title,
        issue.category,
        issue.status,
        issue.ward || "N/A",
        issue.priority || "N/A",
        new Date(issue.createdAt).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `issues-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Issues exported successfully");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      {
        variant: "default" | "destructive" | "outline" | "secondary";
        icon: React.ComponentType<{ className?: string }>;
      }
    > = {
      open: { variant: "secondary", icon: AlertCircle },
      "in-progress": { variant: "default", icon: Clock },
      resolved: { variant: "default", icon: CheckCircle },
      closed: { variant: "outline", icon: CheckCircle },
    };

    const config = variants[status] || variants.open;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return <Badge variant="outline">None</Badge>;

    const colors: Record<string, string> = {
      low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      medium:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };

    return (
      <Badge className={colors[priority] || colors.medium}>{priority}</Badge>
    );
  };

  if (isLoading || !user) {
    return <div>Loading...</div>;
  }

  if (user?.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-black dark:text-white">
                Issue Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage and track all reported issues
              </p>
            </div>
            <Link href="/admin">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters & Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search issues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    status: value === "all" ? undefined : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.category || "all"}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    category: value === "all" ? undefined : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Roads">Roads</SelectItem>
                  <SelectItem value="Waste Management">
                    Waste Management
                  </SelectItem>
                  <SelectItem value="Street Lights">Street Lights</SelectItem>
                  <SelectItem value="Water Supply">Water Supply</SelectItem>
                  <SelectItem value="Drainage">Drainage</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.priority || "all"}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    priority: value === "all" ? undefined : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={fetchIssues} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              {selectedIssues.length > 0 && (
                <>
                  <Button
                    onClick={() => handleBulkStatusUpdate("in-progress")}
                    variant="outline"
                    size="sm"
                  >
                    Mark as In Progress ({selectedIssues.length})
                  </Button>
                  <Button
                    onClick={() => handleBulkStatusUpdate("resolved")}
                    variant="outline"
                    size="sm"
                  >
                    Mark as Resolved ({selectedIssues.length})
                  </Button>
                  <Button
                    onClick={() => setSelectedIssues([])}
                    variant="outline"
                    size="sm"
                  >
                    Clear Selection
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Issues Table */}
        <Card>
          <CardHeader>
            <CardTitle>Issues ({issues.length})</CardTitle>
            <CardDescription>
              {loadingIssues ? "Loading..." : `Showing ${issues.length} issues`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={
                          selectedIssues.length === issues.length &&
                          issues.length > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIssues(issues.map((i) => i.id));
                          } else {
                            setSelectedIssues([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Ward</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingIssues ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        Loading issues...
                      </TableCell>
                    </TableRow>
                  ) : issues.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        No issues found
                      </TableCell>
                    </TableRow>
                  ) : (
                    issues.map((issue) => (
                      <TableRow key={issue.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedIssues.includes(issue.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIssues([
                                  ...selectedIssues,
                                  issue.id,
                                ]);
                              } else {
                                setSelectedIssues(
                                  selectedIssues.filter(
                                    (id) => id !== issue.id,
                                  ),
                                );
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium max-w-xs truncate">
                          {issue.title}
                        </TableCell>
                        <TableCell>{issue.category}</TableCell>
                        <TableCell>
                          <Select
                            value={issue.status}
                            onValueChange={(value) =>
                              handleStatusUpdate(issue.id, value)
                            }
                          >
                            <SelectTrigger className="w-36">
                              {getStatusBadge(issue.status)}
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in-progress">
                                In Progress
                              </SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {getPriorityBadge(issue.priority)}
                        </TableCell>
                        <TableCell>{issue.ward || "N/A"}</TableCell>
                        <TableCell className="truncate max-w-32">
                          {issue.userId || "Anonymous"}
                        </TableCell>
                        <TableCell>
                          {new Date(issue.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Link href={`/issues/${issue.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteIssue(issue.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
