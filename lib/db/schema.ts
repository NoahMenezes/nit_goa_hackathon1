// Database Schema Types for OurStreet

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // hashed
  role: "citizen" | "moderator" | "admin";
  createdAt: Date;
  updatedAt: Date;
  reportedIssues: string[]; // issue IDs
  supportedIssues: string[]; // issue IDs
  verifiedIssues: string[]; // issue IDs
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  photoUrl?: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  status: IssueStatus;
  priority: IssuePriority;
  userId: string;
  assignedTo?: string; // municipal authority ID
  votes: number;
  votedBy: string[]; // user IDs
  comments: Comment[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  estimatedResolutionDate?: Date;
}

export type IssueCategory =
  | "pothole"
  | "streetlight"
  | "garbage"
  | "water_leak"
  | "road"
  | "sanitation"
  | "lighting"
  | "drainage"
  | "other";

export type IssueStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "closed"
  | "rejected";

export type IssuePriority = "low" | "medium" | "high" | "critical";

export interface Comment {
  id: string;
  issueId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StatusUpdate {
  id: string;
  issueId: string;
  oldStatus: IssueStatus;
  newStatus: IssueStatus;
  comment?: string;
  updatedBy: string;
  updatedByName: string;
  createdAt: Date;
}

export interface Analytics {
  id: string;
  totalIssues: number;
  resolvedIssues: number;
  inProgressIssues: number;
  openIssues: number;
  averageResolutionTime: number; // in hours
  categoryBreakdown: {
    [key in IssueCategory]: number;
  };
  wardWisePerformance: {
    wardId: string;
    wardName: string;
    totalIssues: number;
    resolvedIssues: number;
    resolutionRate: number;
  }[];
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  issueId?: string;
  type: "issue_update" | "comment" | "resolution" | "vote";
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export interface Ward {
  id: string;
  name: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  population?: number;
  area?: number; // in sq km
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Request Types
export interface CreateIssueRequest {
  title: string;
  description: string;
  category: IssueCategory;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  photoUrl?: string;
}

export interface UpdateIssueStatusRequest {
  issueId: string;
  status: IssueStatus;
  comment?: string;
  afterImageUrl?: string;
}

export interface VoteIssueRequest {
  issueId: string;
  userId: string;
}

export interface AddCommentRequest {
  issueId: string;
  userId: string;
  text: string;
}
