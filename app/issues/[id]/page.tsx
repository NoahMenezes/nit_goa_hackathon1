"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  ThumbsUp,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import toast from "react-hot-toast";
import { BeforeAfterPhotos } from "@/components/before-after-photos";
import { Issue } from "@/lib/types";
import { getAuthToken } from "@/lib/api-client";

export default function IssueDetailPage() {
  const router = useRouter();
  const params = useParams();
  const issueId = params.id as string;

  const [issue, setIssue] = useState<Issue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    fetchIssue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issueId]);

  const fetchIssue = async () => {
    try {
      const response = await fetch(`/api/issues/${issueId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch issue");
      }

      const data = await response.json();
      setIssue(data.data);

      const votedIssues = JSON.parse(
        localStorage.getItem("votedIssues") || "[]",
      );
      setHasVoted(votedIssues.includes(issueId));
    } catch (error) {
      console.error("Error fetching issue:", error);
      toast.error("Failed to load issue details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async () => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Please login to vote");
      router.push("/login");
      return;
    }

    if (hasVoted) {
      toast.error("You have already voted for this issue");
      return;
    }

    setIsVoting(true);
    try {
      const response = await fetch(`/api/issues/${issueId}/vote`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to vote");
      }

      setHasVoted(true);
      if (issue) {
        setIssue({ ...issue, votes: issue.votes + 1 });
      }

      const votedIssues = JSON.parse(
        localStorage.getItem("votedIssues") || "[]",
      );
      votedIssues.push(issueId);
      localStorage.setItem("votedIssues", JSON.stringify(votedIssues));

      toast.success("Vote recorded successfully!");
    } catch (error) {
      console.error("Vote error:", error);
      toast.error("Failed to vote. Please try again.");
    } finally {
      setIsVoting(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = getAuthToken();
    if (!token) {
      toast.error("Please login to comment");
      router.push("/login");
      return;
    }

    if (!commentText.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    setIsCommenting(true);
    try {
      const response = await fetch(`/api/issues/${issueId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: commentText }),
      });

      if (!response.ok) {
        throw new Error("Failed to post comment");
      }

      const data = await response.json();

      if (issue) {
        setIssue({
          ...issue,
          comments: [...issue.comments, data.data],
        });
      }

      setCommentText("");
      toast.success("Comment posted successfully!");
    } catch (error) {
      console.error("Comment error:", error);
      toast.error("Failed to post comment. Please try again.");
    } finally {
      setIsCommenting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        icon: React.ComponentType<{ className?: string }>;
      }
    > = {
      open: { variant: "destructive", icon: AlertCircle },
      "in-progress": { variant: "secondary", icon: Clock },
      resolved: { variant: "default", icon: CheckCircle2 },
      closed: { variant: "outline", icon: CheckCircle2 },
    };

    const config = variants[status] || variants.open;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-blue-500",
      medium: "bg-yellow-500",
      high: "bg-orange-500",
      critical: "bg-red-500",
    };

    return (
      <Badge
        className={`${colors[priority] || colors.medium} text-white`}
        variant="outline"
      >
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      pothole: "🕳️",
      streetlight: "💡",
      garbage: "🗑️",
      water_leak: "💧",
      road: "🛣️",
      sanitation: "🧹",
      drainage: "🌊",
      electricity: "⚡",
      traffic: "🚦",
      other: "📋",
    };
    return emojis[category] || "📋";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-black dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading issue details...
          </p>
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-black dark:to-gray-950 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Issue Not Found</CardTitle>
            <CardDescription>
              The issue you&apos;re looking for doesn&apos;t exist or has been
              removed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/map")} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Map
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-black dark:to-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6">
          <Link href="/map">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Map
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="transition-all duration-300 ease-out hover:shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      {getStatusBadge(issue.status)}
                      {getPriorityBadge(issue.priority)}
                      <Badge variant="outline">
                        {getCategoryEmoji(issue.category)} {issue.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl mb-2">
                      {issue.title}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {issue.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Reported {new Date(issue.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4" />
                    <span>{issue.location}</span>
                  </div>
                  {issue.ward && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 col-span-2">
                      <span className="font-medium">Ward:</span>
                      <span>{issue.ward}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {issue.beforePhotoUrls && issue.beforePhotoUrls.length > 0 && (
              <BeforeAfterPhotos
                beforeUrls={issue.beforePhotoUrls}
                afterUrls={issue.afterPhotoUrls}
                issueTitle={issue.title}
                status={issue.status}
              />
            )}

            <Card className="transition-all duration-300 ease-out hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Comments ({issue.comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleComment} className="space-y-3">
                  <Textarea
                    placeholder="Share your thoughts or provide additional information..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={isCommenting || !commentText.trim()}
                      size="sm"
                    >
                      {isCommenting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Post Comment
                        </>
                      )}
                    </Button>
                  </div>
                </form>

                <Separator />

                {issue.comments.length > 0 ? (
                  <div className="space-y-4">
                    {issue.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {comment.userName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {comment.userName}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No comments yet. Be the first to comment!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="transition-all duration-300 ease-out hover:shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleVote}
                  disabled={isVoting || hasVoted}
                  className="w-full"
                  variant={hasVoted ? "secondary" : "default"}
                >
                  <ThumbsUp className="mr-2 h-4 w-4" />
                  {hasVoted ? "Voted" : "Vote"} ({issue.votes})
                </Button>
                {hasVoted && (
                  <p className="text-xs text-center text-green-600 dark:text-green-400">
                    Thanks for your support!
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Issue Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Votes
                  </span>
                  <Badge variant="outline">{issue.votes}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Comments
                  </span>
                  <Badge variant="outline">{issue.comments.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Status
                  </span>
                  {getStatusBadge(issue.status)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Priority
                  </span>
                  {getPriorityBadge(issue.priority)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-3">
                  <MapPin className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {issue.location}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Lat: {issue.coordinates.lat.toFixed(5)}, Lng:{" "}
                  {issue.coordinates.lng.toFixed(5)}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                  onClick={() =>
                    window.open(
                      `https://maps.google.com/?q=${issue.coordinates.lat},${issue.coordinates.lng}`,
                      "_blank",
                    )
                  }
                >
                  View on Google Maps
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
