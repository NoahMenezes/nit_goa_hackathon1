// Supabase database operations for OurStreet
// This replaces the in-memory database with persistent Supabase storage

import { getSupabaseClientByRole } from "./supabase";
import {
  User,
  Issue,
  Comment,
  Vote,
  IssueCategory,
  IssueStatus,
  IssuePriority,
} from "./types";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Supabase database row types
type UserRow = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  avatar: string | null;
  created_at: string;
  updated_at: string;
};

type IssueRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  latitude: number;
  longitude: number;
  photo_url: string | null;
  before_photo_urls?: string[] | null;
  after_photo_urls?: string[] | null;
  status: string;
  priority: string;
  user_id: string;
  votes: number;
  ward?: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

type CommentRow = {
  id: string;
  issue_id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
};

type VoteRow = {
  id: string;
  issue_id: string;
  user_id: string;
  created_at: string;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get Supabase client based on role (for public operations)
 */
function getSupabase(role: string = "citizen") {
  const client = getSupabaseClientByRole(role, false);
  if (!client) {
    throw new Error(
      `Supabase ${role} database is not configured. Please set environment variables.`,
    );
  }
  return client;
}

/**
 * Get Supabase admin client (for server-side operations that need to bypass RLS)
 */
function getSupabaseAdmin(role: string = "citizen") {
  const client = getSupabaseClientByRole(role, true);
  if (!client) {
    console.warn(
      `Supabase ${role} admin client not configured, falling back to regular client`,
    );
    return getSupabase(role);
  }
  return client;
}

/**
 * Generate unique IDs (Supabase uses UUIDs)
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Map UserRow from database to User application object
 */
function mapUserRowToUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    role: row.role as "citizen" | "admin" | "authority",
    avatar: row.avatar || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Map IssueRow from database to Issue application object
 */
function mapIssueRowToIssue(row: IssueRow, comments: Comment[] = []): Issue {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category as IssueCategory,
    location: row.location,
    coordinates: { lat: row.latitude, lng: row.longitude },
    photoUrl: row.photo_url || undefined,
    beforePhotoUrls: row.before_photo_urls || undefined,
    afterPhotoUrls: row.after_photo_urls || undefined,
    status: row.status as IssueStatus,
    priority: row.priority as IssuePriority,
    userId: row.user_id,
    votes: row.votes || 0,
    comments: comments,
    ward: row.ward || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at || undefined,
  };
}

/**
 * Map CommentRow from database to Comment application object
 */
function mapCommentRowToComment(row: CommentRow): Comment {
  return {
    id: row.id,
    issueId: row.issue_id,
    userId: row.user_id,
    userName: row.user_name,
    content: row.content,
    createdAt: row.created_at,
  };
}

/**
 * Map VoteRow from database to Vote application object
 */
function mapVoteRowToVote(row: VoteRow): Vote {
  return {
    id: row.id,
    issueId: row.issue_id,
    userId: row.user_id,
    createdAt: row.created_at,
  };
}

/**
 * Determine which role/database to use based on user role
 * Admin and authority users go to admin DB, citizens go to citizen DB
 */
function getRoleDatabase(role?: string): string {
  if (role === "admin" || role === "authority") {
    return "admin";
  }
  return "citizen";
}

// ============================================================================
// USER OPERATIONS
// ============================================================================

export const userDb = {
  /**
   * Create a new user
   */
  async create(
    user: Omit<User, "id" | "createdAt" | "updatedAt">,
  ): Promise<User | null> {
    const dbRole = getRoleDatabase(user.role);
    const { data, error } = await getSupabaseAdmin(dbRole)
      .from("users")
      .insert({
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role,
        avatar: user.avatar || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating user:", error);
      return null;
    }

    return mapUserRowToUser(data);
  },

  /**
   * Find user by ID
   */
  async findById(id: string, role: string = "citizen"): Promise<User | null> {
    const dbRole = getRoleDatabase(role);
    const { data, error } = await getSupabase(dbRole)
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return null;
    }

    return mapUserRowToUser(data);
  },

  /**
   * Find user by email
   */
  async findByEmail(
    email: string,
    role: string = "citizen",
  ): Promise<User | null> {
    const dbRole = getRoleDatabase(role);
    const { data, error } = await getSupabase(dbRole)
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (error || !data) {
      return null;
    }

    return mapUserRowToUser(data);
  },

  /**
   * Update user
   */
  async update(
    id: string,
    updates: Partial<User>,
    role: string = "citizen",
  ): Promise<User | undefined> {
    const dbRole = getRoleDatabase(role);
    const updateData: Record<string, string | null | undefined> = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.password !== undefined) updateData.password = updates.password;
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.avatar !== undefined) updateData.avatar = updates.avatar;

    const { data, error } = await getSupabaseAdmin(dbRole)
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      console.error("Error updating user:", error);
      return undefined;
    }

    return mapUserRowToUser(data);
  },

  /**
   * Delete user
   */
  async delete(id: string, role: string = "citizen"): Promise<boolean> {
    const dbRole = getRoleDatabase(role);
    const { error } = await getSupabaseAdmin(dbRole)
      .from("users")
      .delete()
      .eq("id", id);
    return !error;
  },

  /**
   * Get all users from a specific database
   */
  async getAll(role: string = "citizen"): Promise<User[]> {
    const dbRole = getRoleDatabase(role);
    const { data, error } = await getSupabase(dbRole).from("users").select("*");

    if (error || !data) {
      return [];
    }

    return data.map(mapUserRowToUser);
  },

  /**
   * Get all users from both databases (for admin purposes)
   */
  async getAllFromBothDatabases(): Promise<User[]> {
    const [citizenUsers, adminUsers] = await Promise.all([
      this.getAll("citizen"),
      this.getAll("admin"),
    ]);

    const userMap = new Map<string, User>();
    [...citizenUsers, ...adminUsers].forEach((user) => {
      userMap.set(user.id, user);
    });

    return Array.from(userMap.values());
  },
};

// ============================================================================
// ISSUE OPERATIONS
// ============================================================================

export const issueDb = {
  /**
   * Create a new issue
   */
  async create(
    issue: Omit<Issue, "id" | "votes" | "comments" | "createdAt" | "updatedAt">,
    role: string = "citizen",
  ): Promise<Issue | null> {
    const dbRole = getRoleDatabase(role);
    const { data, error } = await getSupabaseAdmin(dbRole)
      .from("issues")
      .insert({
        title: issue.title,
        description: issue.description,
        category: issue.category,
        location: issue.location,
        latitude: issue.coordinates.lat,
        longitude: issue.coordinates.lng,
        photo_url: issue.photoUrl || null,
        status: issue.status,
        priority: issue.priority,
        user_id: issue.userId,
        ward: issue.ward || null,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Error creating issue:", error);
      return null;
    }

    const comments = await commentDb.findByIssueId(data.id);
    return mapIssueRowToIssue(data, comments);
  },

  /**
   * Find issue by ID
   */
  async findById(id: string, role: string = "citizen"): Promise<Issue | null> {
    const dbRole = getRoleDatabase(role);
    const { data, error } = await getSupabase(dbRole)
      .from("issues")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return null;
    }

    const comments = await commentDb.findByIssueId(data.id);
    return mapIssueRowToIssue(data, comments);
  },

  /**
   * Update an issue
   */
  async update(
    id: string,
    updates: Partial<Issue>,
    role: string = "citizen",
  ): Promise<Issue | undefined> {
    const dbRole = getRoleDatabase(role);
    const updateData: Record<string, unknown> = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.photoUrl !== undefined) updateData.photo_url = updates.photoUrl;
    if (updates.ward !== undefined) updateData.ward = updates.ward;
    if (updates.resolvedAt !== undefined)
      updateData.resolved_at = updates.resolvedAt;
    if (updates.coordinates !== undefined) {
      updateData.latitude = updates.coordinates.lat;
      updateData.longitude = updates.coordinates.lng;
    }

    const { data, error } = await getSupabaseAdmin(dbRole)
      .from("issues")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      console.error("Error updating issue:", error);
      return undefined;
    }

    const comments = await commentDb.findByIssueId(data.id);
    return mapIssueRowToIssue(data, comments);
  },

  /**
   * Delete an issue
   */
  async delete(id: string, role: string = "citizen"): Promise<boolean> {
    const dbRole = getRoleDatabase(role);
    const { error } = await getSupabaseAdmin(dbRole)
      .from("issues")
      .delete()
      .eq("id", id);
    return !error;
  },

  /**
   * Get all issues
   */
  async getAll(role: string = "citizen"): Promise<Issue[]> {
    const dbRole = getRoleDatabase(role);
    const { data, error } = await getSupabase(dbRole)
      .from("issues")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    // Batch fetch all comments for efficiency
    const issueIds = data.map((issue: IssueRow) => issue.id);
    const allComments = await commentDb.findByIssueIds(issueIds);

    return data.map((issue: IssueRow) => {
      const comments = allComments.filter((c) => c.issueId === issue.id);
      return mapIssueRowToIssue(issue, comments);
    });
  },

  /**
   * Find issues by user ID
   */
  async findByUserId(
    userId: string,
    role: string = "citizen",
  ): Promise<Issue[]> {
    const dbRole = getRoleDatabase(role);
    const { data, error } = await getSupabase(dbRole)
      .from("issues")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    const issueIds = data.map((issue: IssueRow) => issue.id);
    const allComments = await commentDb.findByIssueIds(issueIds);

    return data.map((issue: IssueRow) => {
      const comments = allComments.filter((c) => c.issueId === issue.id);
      return mapIssueRowToIssue(issue, comments);
    });
  },

  /**
   * Find issues by status
   */
  async findByStatus(
    status: string,
    role: string = "citizen",
  ): Promise<Issue[]> {
    const dbRole = getRoleDatabase(role);
    const { data, error } = await getSupabase(dbRole)
      .from("issues")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    const issueIds = data.map((issue: IssueRow) => issue.id);
    const allComments = await commentDb.findByIssueIds(issueIds);

    return data.map((issue: IssueRow) => {
      const comments = allComments.filter((c) => c.issueId === issue.id);
      return mapIssueRowToIssue(issue, comments);
    });
  },

  /**
   * Find issues by category
   */
  async findByCategory(
    category: string,
    role: string = "citizen",
  ): Promise<Issue[]> {
    const dbRole = getRoleDatabase(role);
    const { data, error } = await getSupabase(dbRole)
      .from("issues")
      .select("*")
      .eq("category", category)
      .order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    const issueIds = data.map((issue: IssueRow) => issue.id);
    const allComments = await commentDb.findByIssueIds(issueIds);

    return data.map((issue: IssueRow) => {
      const comments = allComments.filter((c) => c.issueId === issue.id);
      return mapIssueRowToIssue(issue, comments);
    });
  },

  /**
   * Increment vote count for an issue
   */
  async incrementVotes(
    id: string,
    role: string = "citizen",
  ): Promise<Issue | undefined> {
    const dbRole = getRoleDatabase(role);
    const current = await this.findById(id, role);
    if (!current) return undefined;

    const { data, error } = await getSupabaseAdmin(dbRole)
      .from("issues")
      .update({ votes: current.votes + 1 })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      console.error("Error incrementing votes:", error);
      return undefined;
    }

    const comments = await commentDb.findByIssueId(data.id);
    return mapIssueRowToIssue(data, comments);
  },

  /**
   * Decrement vote count for an issue
   */
  async decrementVotes(
    id: string,
    role: string = "citizen",
  ): Promise<Issue | undefined> {
    const dbRole = getRoleDatabase(role);
    const current = await this.findById(id, role);
    if (!current || current.votes <= 0) return current;

    const { data, error } = await getSupabaseAdmin(dbRole)
      .from("issues")
      .update({ votes: Math.max(0, current.votes - 1) })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      console.error("Error decrementing votes:", error);
      return undefined;
    }

    const comments = await commentDb.findByIssueId(data.id);
    return mapIssueRowToIssue(data, comments);
  },
};

// ============================================================================
// COMMENT OPERATIONS
// ============================================================================

export const commentDb = {
  /**
   * Create a new comment
   */
  async create(
    comment: Omit<Comment, "id" | "createdAt">,
    role: string = "citizen",
  ): Promise<Comment | null> {
    const dbRole = getRoleDatabase(role);
    const { data, error } = await getSupabaseAdmin(dbRole)
      .from("comments")
      .insert({
        issue_id: comment.issueId,
        user_id: comment.userId,
        user_name: comment.userName,
        content: comment.content,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Error creating comment:", error);
      return null;
    }

    return mapCommentRowToComment(data);
  },

  /**
   * Find comment by ID
   */
  async findById(
    id: string,
    role: string = "citizen",
  ): Promise<Comment | undefined> {
    const dbRole = getRoleDatabase(role);
    const { data, error } = await getSupabase(dbRole)
      .from("comments")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return undefined;
    }

    return mapCommentRowToComment(data);
  },

  /**
   * Find comments by issue ID
   */
  async findByIssueId(
    issueId: string,
    role: string = "citizen",
  ): Promise<Comment[]> {
    const dbRole = getRoleDatabase(role);
    const { data, error } = await getSupabase(dbRole)
      .from("comments")
      .select("*")
      .eq("issue_id", issueId)
      .order("created_at", { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map(mapCommentRowToComment);
  },

  /**
   * Find comments by multiple issue IDs (batch operation for efficiency)
   */
  async findByIssueIds(
    issueIds: string[],
    role: string = "citizen",
  ): Promise<Comment[]> {
    if (issueIds.length === 0) return [];

    const dbRole = getRoleDatabase(role);
    const { data, error } = await getSupabase(dbRole)
      .from("comments")
      .select("*")
      .in("issue_id", issueIds)
      .order("created_at", { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map(mapCommentRowToComment);
  },

  /**
   * Delete a comment
   */
  async delete(id: string, role: string = "citizen"): Promise<boolean> {
    const dbRole = getRoleDatabase(role);
    const { error } = await getSupabaseAdmin(dbRole)
      .from("comments")
      .delete()
      .eq("id", id);
    return !error;
  },
};

// ============================================================================
// VOTE OPERATIONS
// ============================================================================

export const voteDb = {
  /**
   * Create a new vote
   */
  async create(
    vote: Omit<Vote, "id" | "createdAt">,
    role: string = "citizen",
  ): Promise<Vote | null> {
    const dbRole = getRoleDatabase(role);
    const { data, error } = await getSupabaseAdmin(dbRole)
      .from("votes")
      .insert({
        issue_id: vote.issueId,
        user_id: vote.userId,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Error creating vote:", error);
      return null;
    }

    return mapVoteRowToVote(data);
  },

  /**
   * Find vote by user and issue
   */
  async findByUserAndIssue(
    userId: string,
    issueId: string,
    role: string = "citizen",
  ): Promise<Vote | undefined> {
    const dbRole = getRoleDatabase(role);
    const { data, error } = await getSupabase(dbRole)
      .from("votes")
      .select("*")
      .eq("user_id", userId)
      .eq("issue_id", issueId)
      .single();

    if (error || !data) {
      return undefined;
    }

    return mapVoteRowToVote(data);
  },

  /**
   * Delete a vote
   */
  async delete(id: string, role: string = "citizen"): Promise<boolean> {
    const dbRole = getRoleDatabase(role);
    const { error } = await getSupabaseAdmin(dbRole)
      .from("votes")
      .delete()
      .eq("id", id);
    return !error;
  },

  /**
   * Find votes by issue ID
   */
  async findByIssueId(
    issueId: string,
    role: string = "citizen",
  ): Promise<Vote[]> {
    const dbRole = getRoleDatabase(role);
    const { data, error } = await getSupabase(dbRole)
      .from("votes")
      .select("*")
      .eq("issue_id", issueId);

    if (error || !data) {
      return [];
    }

    return data.map(mapVoteRowToVote);
  },
};

// ============================================================================
// SEED DATABASE (No-op for Supabase)
// ============================================================================

export async function seedDatabase(): Promise<void> {
  console.log(
    "⚠️ Supabase database seeding should be done via migrations, not through the application",
  );
}
