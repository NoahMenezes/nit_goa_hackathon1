// Database types and interfaces for OurStreet

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // hashed
  role: "citizen" | "admin" | "authority";
  avatar?: string;
  emailVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  location: string; // Address string
  coordinates: {
    lat: number;
    lng: number;
  };
  photoUrl?: string;
  beforePhotoUrls?: string[]; // Multiple before photos
  afterPhotoUrls?: string[]; // Multiple after photos for resolved issues
  status: IssueStatus;
  priority: IssuePriority;
  userId: string;
  votes: number;
  comments: Comment[];
  ward?: string; // Ward/district identifier
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  assignedTo?: string; // Authority user ID
  aiMetadata?: {
    // AI-powered categorization metadata
    usedAI: boolean; // Whether AI was used for categorization
    aiCategory?: IssueCategory; // AI-suggested category
    aiPriority?: IssuePriority; // AI-suggested priority
    confidence?: number; // AI confidence score (0-1)
    reasoning?: string; // AI reasoning for categorization
    tags?: string[]; // AI-generated tags
    manualOverride?: boolean; // Whether user overrode AI suggestion
  };
}

export type IssueCategory =
  | "pothole"
  | "streetlight"
  | "garbage"
  | "water_leak"
  | "road"
  | "sanitation"
  | "drainage"
  | "electricity"
  | "traffic"
  | "other";

export type IssueStatus = "open" | "in-progress" | "resolved" | "closed";

export type IssuePriority = "low" | "medium" | "high" | "critical";

export interface Comment {
  id: string;
  issueId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface Vote {
  id: string;
  issueId: string;
  userId: string;
  createdAt: string;
}

export interface DashboardStats {
  totalIssues: number;
  openIssues: number;
  inProgressIssues: number;
  resolvedIssues: number;
  totalReports: number;
  averageResolutionTime: number; // in days
  categoryBreakdown: {
    category: IssueCategory;
    count: number;
  }[];
  recentActivity: {
    date: string;
    count: number;
  }[];
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  token?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Request types
export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: "citizen" | "admin";
}

export interface LoginRequest {
  email: string;
  password: string;
}

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
  beforePhotoUrls?: string[];
  ward?: string;
  useAI?: boolean; // Whether to use AI for categorization/priority
  aiSuggestion?: {
    // AI suggestion that user may have applied
    category: IssueCategory;
    priority: IssuePriority;
    confidence: number;
    reasoning: string;
    manualOverride?: boolean;
  };
}

export interface UpdateIssueRequest {
  title?: string;
  description?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  assignedTo?: string;
  afterPhotoUrls?: string[];
  ward?: string;
}

export interface CreateCommentRequest {
  content: string;
}

// Filter types
export interface IssueFilters {
  status?: IssueStatus;
  category?: IssueCategory;
  priority?: IssuePriority;
  userId?: string;
  ward?: string;
  search?: string;
  sortBy?: "createdAt" | "votes" | "priority";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

// Ward/District list for Goa
export const WARDS = [
  "Panjim - Fontainhas",
  "Panjim - St. Inez",
  "Panjim - Miramar",
  "Margao - Market Area",
  "Margao - Fatorda",
  "Vasco - Town Center",
  "Mapusa - Municipal Market",
  "Ponda - City Center",
  "Bicholim - Town",
  "Canacona - Chaudi",
] as const;

export type Ward = (typeof WARDS)[number];

// Upload response type
export interface UploadResponse {
  success: boolean;
  url?: string;
  urls?: string[];
  error?: string;
}

// Analytics and reporting types
export interface WardAnalytics {
  ward: string;
  totalIssues: number;
  openIssues: number;
  inProgressIssues: number;
  resolvedIssues: number;
  averageResolutionTime: number; // in days
  categoryBreakdown: {
    category: IssueCategory;
    count: number;
  }[];
  resolutionRate: number; // percentage
  priorityBreakdown: {
    priority: IssuePriority;
    count: number;
  }[];
}

export interface IssueHotspot {
  location: string;
  ward?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  issueCount: number;
  categories: IssueCategory[];
  severity: "low" | "medium" | "high" | "critical";
}

export interface TrendData {
  date: string;
  openIssues: number;
  resolvedIssues: number;
  newIssues: number;
}

export interface ImpactReport {
  dateRange: {
    start: string;
    end: string;
  };
  summary: {
    totalIssues: number;
    resolvedIssues: number;
    averageResolutionTime: number;
    resolutionRate: number;
  };
  wardAnalytics: WardAnalytics[];
  hotspots: IssueHotspot[];
  trends: TrendData[];
  categoryPerformance: {
    category: IssueCategory;
    totalIssues: number;
    resolvedIssues: number;
    averageResolutionTime: number;
  }[];
}

export interface PublicStats {
  totalIssuesReported: number;
  issuesResolved: number;
  resolutionRate: number;
  averageResolutionTime: number;
  activeUsers: number;
  wardPerformance: {
    ward: string;
    issuesReported: number;
    issuesResolved: number;
    resolutionRate: number;
  }[];
  recentResolutions: {
    id: string;
    title: string;
    category: IssueCategory;
    ward?: string;
    resolvedAt: string;
    resolutionTime: number; // in days
  }[];
  categoryStats: {
    category: IssueCategory;
    count: number;
    resolvedCount: number;
  }[];
}

// Notification types
export interface NotificationConfig {
  userId: string;
  email?: string;
  phone?: string;
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    statusUpdates: boolean;
    resolutionNotifications: boolean;
    commentNotifications: boolean;
  };
}

export interface NotificationPayload {
  type: "status_change" | "resolution" | "comment" | "assignment";
  issueId: string;
  issueTitle: string;
  recipient: {
    userId: string;
    email?: string;
    phone?: string;
  };
  data: {
    oldStatus?: IssueStatus;
    newStatus?: IssueStatus;
    message?: string;
    url?: string;
  };
}

export interface NotificationResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Ward Management Types
export interface WardData {
  id: string;
  ward_number: number;
  ward_name: string;
  ward_area_sq_km: number;
  population: number;
  boundaries: unknown; // GeoJSON type
  created_at: string;
  updated_at: string;
}

export interface WardWithMetrics extends WardData {
  ward_performance_metrics?: WardPerformanceMetrics[];
  ward_analytics?: unknown[];
}

export interface WardIssue {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  latitude: number;
  longitude: number;
  photo_url?: string;
  status: string;
  priority: string;
  user_id: string;
  ward_id: string;
  votes: number;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface WardPerformanceMetrics {
  id: string;
  ward_id: string;
  metric_date: string;
  total_issues: number;
  resolved_issues: number;
  avg_resolution_time_hours: number;
  citizen_satisfaction_score: number;
  response_time_hours: number;
  created_at: string;
}

export interface WardAnalyticsData {
  ward_id: string;
  ward_name: string;
  totalIssues: number;
  openIssues: number;
  inProgressIssues: number;
  resolvedIssues: number;
  criticalIssues: number;
  avgResolutionHours: number;
  categoryBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
  issuesLastWeek: number;
  issuesLastMonth: number;
  population: number;
  metrics?: WardPerformanceMetrics;
  aiInsights?: {
    summary: string;
    recommendations: string[];
    trends: string[];
    riskFactors: string[];
  };
}
