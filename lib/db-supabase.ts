// Supabase database operations for OurStreet
// This replaces the in-memory database with persistent Supabase storage

import { supabase, supabaseAdmin } from "./supabase";
import {
  User,
  Issue,
  Comment,
  Vote,
  IssueCategory,
  IssueStatus,
  IssuePriority,
} from "./types";

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
  status: string;
  priority: string;
  user_id: string;
  votes: number;
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

// Safety check helper
// Get Supabase client
function getSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return supabase;
}

// Get Supabase admin client (for server-side operations that need to bypass RLS)
function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    console.warn(
      "Supabase admin client not configured, falling back to regular client",
    );
    return getSupabase();
  }
  return supabaseAdmin;
}

// Helper function to generate unique IDs (Supabase uses UUIDs)
export function generateId(): string {
  return crypto.randomUUID();
}

// User operations
export const userDb = {
  async create(
    user: Omit<User, "id" | "createdAt" | "updatedAt">,
  ): Promise<User | null> {
    // Use admin client to bypass RLS policies for user creation
    const { data, error } = await getSupabaseAdmin()
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

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      avatar: data.avatar || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async findById(id: string): Promise<User | undefined> {
    const { data, error } = await getSupabase()
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return undefined;
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      avatar: data.avatar || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async findByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await getSupabase()
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !data) {
      return undefined;
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      avatar: data.avatar || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async update(id: string, updates: Partial<User>): Promise<User | undefined> {
    const updateData: Record<string, string | null | undefined> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.password !== undefined) updateData.password = updates.password;
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.avatar !== undefined) updateData.avatar = updates.avatar;

    const { data, error } = await getSupabase()
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      console.error("Error updating user:", error);
      return undefined;
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      avatar: data.avatar || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await getSupabase().from("users").delete().eq("id", id);
    return !error;
  },

  async getAll(): Promise<User[]> {
    const { data, error } = await getSupabase().from("users").select("*");

    if (error || !data) {
      return [];
    }

    return data.map((user: UserRow) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role as "citizen" | "admin" | "authority",
      avatar: user.avatar || undefined,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }));
  },
};

// Issue operations
export const issueDb = {
  async create(
    issue: Omit<Issue, "id" | "createdAt" | "updatedAt" | "votes" | "comments">,
  ): Promise<Issue | null> {
    const { data, error } = await getSupabase()
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
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Error creating issue:", error);
      return null;
    }

    // Get comments for this issue
    const comments = await commentDb.findByIssueId(data.id);

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      category: data.category,
      location: data.location,
      coordinates: { lat: data.latitude, lng: data.longitude },
      photoUrl: data.photo_url || undefined,
      status: data.status,
      priority: data.priority,
      userId: data.user_id,
      votes: data.votes || 0,
      comments: comments,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      resolvedAt: data.resolved_at || undefined,
    };
  },

  async findById(id: string): Promise<Issue | undefined> {
    const { data, error } = await getSupabase()
      .from("issues")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return undefined;
    }

    // Get comments for this issue
    const comments = await commentDb.findByIssueId(data.id);

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      category: data.category,
      location: data.location,
      coordinates: { lat: data.latitude, lng: data.longitude },
      photoUrl: data.photo_url || undefined,
      status: data.status,
      priority: data.priority,
      userId: data.user_id,
      votes: data.votes || 0,
      comments: comments,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      resolvedAt: data.resolved_at || undefined,
    };
  },

  async update(
    id: string,
    updates: Partial<Issue>,
  ): Promise<Issue | undefined> {
    const updateData: Record<string, string | number | null | undefined> = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.coordinates !== undefined) {
      updateData.latitude = updates.coordinates.lat;
      updateData.longitude = updates.coordinates.lng;
    }
    if (updates.photoUrl !== undefined) updateData.photo_url = updates.photoUrl;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.priority !== undefined) updateData.priority = updates.priority;

    const { data, error } = await getSupabase()
      .from("issues")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      console.error("Error updating issue:", error);
      return undefined;
    }

    // Get comments for this issue
    const comments = await commentDb.findByIssueId(data.id);

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      category: data.category,
      location: data.location,
      coordinates: { lat: data.latitude, lng: data.longitude },
      photoUrl: data.photo_url || undefined,
      status: data.status,
      priority: data.priority,
      userId: data.user_id,
      votes: data.votes || 0,
      comments: comments,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      resolvedAt: data.resolved_at || undefined,
    };
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await getSupabase().from("issues").delete().eq("id", id);
    return !error;
  },

  async getAll(): Promise<Issue[]> {
    const { data, error } = await getSupabase()
      .from("issues")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    // Convert database records to Issue type
    const issues = await Promise.all(
      data.map(async (issue: IssueRow) => {
        const comments = await commentDb.findByIssueId(issue.id);
        return {
          id: issue.id,
          title: issue.title,
          description: issue.description,
          category: issue.category as IssueCategory,
          location: issue.location,
          coordinates: { lat: issue.latitude, lng: issue.longitude },
          photoUrl: issue.photo_url || undefined,
          status: issue.status as IssueStatus,
          priority: issue.priority as IssuePriority,
          userId: issue.user_id,
          votes: issue.votes || 0,
          comments: comments,
          createdAt: issue.created_at,
          updatedAt: issue.updated_at,
          resolvedAt: issue.resolved_at || undefined,
        };
      }),
    );

    return issues;
  },

  async findByUserId(userId: string): Promise<Issue[]> {
    const { data, error } = await getSupabase()
      .from("issues")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    const issues = await Promise.all(
      data.map(async (issue: IssueRow) => {
        const comments = await commentDb.findByIssueId(issue.id);
        return {
          id: issue.id,
          title: issue.title,
          description: issue.description,
          category: issue.category as IssueCategory,
          location: issue.location,
          coordinates: { lat: issue.latitude, lng: issue.longitude },
          photoUrl: issue.photo_url || undefined,
          status: issue.status as IssueStatus,
          priority: issue.priority as IssuePriority,
          userId: issue.user_id,
          votes: issue.votes || 0,
          comments: comments,
          createdAt: issue.created_at,
          updatedAt: issue.updated_at,
          resolvedAt: issue.resolved_at || undefined,
        };
      }),
    );

    return issues;
  },

  async findByStatus(status: string): Promise<Issue[]> {
    const { data, error } = await getSupabase()
      .from("issues")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    const issues = await Promise.all(
      data.map(async (issue: IssueRow) => {
        const comments = await commentDb.findByIssueId(issue.id);
        return {
          id: issue.id,
          title: issue.title,
          description: issue.description,
          category: issue.category as IssueCategory,
          location: issue.location,
          coordinates: { lat: issue.latitude, lng: issue.longitude },
          photoUrl: issue.photo_url || undefined,
          status: issue.status as IssueStatus,
          priority: issue.priority as IssuePriority,
          userId: issue.user_id,
          votes: issue.votes || 0,
          comments: comments,
          createdAt: issue.created_at,
          updatedAt: issue.updated_at,
          resolvedAt: issue.resolved_at || undefined,
        };
      }),
    );

    return issues;
  },

  async findByCategory(category: string): Promise<Issue[]> {
    const { data, error } = await getSupabase()
      .from("issues")
      .select("*")
      .eq("category", category)
      .order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    const issues = await Promise.all(
      data.map(async (issue: IssueRow) => {
        const comments = await commentDb.findByIssueId(issue.id);
        return {
          id: issue.id,
          title: issue.title,
          description: issue.description,
          category: issue.category as IssueCategory,
          location: issue.location,
          coordinates: { lat: issue.latitude, lng: issue.longitude },
          photoUrl: issue.photo_url || undefined,
          status: issue.status as IssueStatus,
          priority: issue.priority as IssuePriority,
          userId: issue.user_id,
          votes: issue.votes || 0,
          comments: comments,
          createdAt: issue.created_at,
          updatedAt: issue.updated_at,
          resolvedAt: issue.resolved_at || undefined,
        };
      }),
    );

    return issues;
  },

  async incrementVotes(id: string): Promise<Issue | undefined> {
    // First get current votes
    const current = await this.findById(id);
    if (!current) return undefined;

    const { data, error } = await getSupabase()
      .from("issues")
      .update({ votes: (current.votes || 0) + 1 })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      return undefined;
    }

    const comments = await commentDb.findByIssueId(data.id);

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      category: data.category,
      location: data.location,
      coordinates: { lat: data.latitude, lng: data.longitude },
      photoUrl: data.photo_url || undefined,
      status: data.status,
      priority: data.priority,
      userId: data.user_id,
      votes: data.votes || 0,
      comments: comments,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      resolvedAt: data.resolved_at || undefined,
    };
  },

  async decrementVotes(id: string): Promise<Issue | undefined> {
    // First get current votes
    const current = await this.findById(id);
    if (!current) return undefined;

    const { data, error } = await getSupabase()
      .from("issues")
      .update({ votes: Math.max((current.votes || 0) - 1, 0) })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      return undefined;
    }

    const comments = await commentDb.findByIssueId(data.id);

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      category: data.category,
      location: data.location,
      coordinates: { lat: data.latitude, lng: data.longitude },
      photoUrl: data.photo_url || undefined,
      status: data.status,
      priority: data.priority,
      userId: data.user_id,
      votes: data.votes || 0,
      comments: comments,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      resolvedAt: data.resolved_at || undefined,
    };
  },
};

// Comment operations
export const commentDb = {
  async create(
    comment: Omit<Comment, "id" | "createdAt">,
  ): Promise<Comment | null> {
    const { data, error } = await getSupabase()
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

    return {
      id: data.id,
      issueId: data.issue_id,
      userId: data.user_id,
      userName: data.user_name,
      content: data.content,
      createdAt: data.created_at,
    };
  },

  async findById(id: string): Promise<Comment | undefined> {
    const { data, error } = await getSupabase()
      .from("comments")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return undefined;
    }

    return {
      id: data.id,
      issueId: data.issue_id,
      userId: data.user_id,
      userName: data.user_name,
      content: data.content,
      createdAt: data.created_at,
    };
  },

  async findByIssueId(issueId: string): Promise<Comment[]> {
    const { data, error } = await getSupabase()
      .from("comments")
      .select("*")
      .eq("issue_id", issueId)
      .order("created_at", { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map((comment: CommentRow) => ({
      id: comment.id,
      issueId: comment.issue_id,
      userId: comment.user_id,
      userName: comment.user_name,
      content: comment.content,
      createdAt: comment.created_at,
    }));
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await getSupabase()
      .from("comments")
      .delete()
      .eq("id", id);
    return !error;
  },
};

// Vote operations
export const voteDb = {
  async create(vote: Omit<Vote, "id" | "createdAt">): Promise<Vote | null> {
    const { data, error } = await getSupabase()
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

    return {
      id: data.id,
      issueId: data.issue_id,
      userId: data.user_id,
      createdAt: data.created_at,
    };
  },

  async findByUserAndIssue(
    userId: string,
    issueId: string,
  ): Promise<Vote | undefined> {
    const { data, error } = await getSupabase()
      .from("votes")
      .select("*")
      .eq("user_id", userId)
      .eq("issue_id", issueId)
      .single();

    if (error || !data) {
      return undefined;
    }

    return {
      id: data.id,
      issueId: data.issue_id,
      userId: data.user_id,
      createdAt: data.created_at,
    };
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await getSupabase().from("votes").delete().eq("id", id);
    return !error;
  },

  async findByIssueId(issueId: string): Promise<Vote[]> {
    const { data, error } = await getSupabase()
      .from("votes")
      .select("*")
      .eq("issue_id", issueId);

    if (error || !data) {
      return [];
    }

    return data.map((vote: VoteRow) => ({
      id: vote.id,
      issueId: vote.issue_id,
      userId: vote.user_id,
      createdAt: vote.created_at,
    }));
  },
};

// No seed function needed - seed data is in schema.sql
export async function seedDatabase() {
  console.log("Using Supabase - seed data should be loaded via schema.sql");
}
