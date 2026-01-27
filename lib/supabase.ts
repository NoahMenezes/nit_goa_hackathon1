// Supabase client configuration for OurStreet
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ Supabase credentials not found. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.",
  );
}

if (!supabaseServiceRoleKey && process.env.NODE_ENV !== "development") {
  console.warn(
    "⚠️ SUPABASE_SERVICE_ROLE_KEY not found. Some admin operations may fail.",
  );
}

// Helper to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

// Create Supabase client only if configured (for client-side/public operations)
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // We're using JWT tokens instead
        autoRefreshToken: false,
      },
    })
  : null;

// Create Supabase admin client with service role key (for server-side operations)
// This bypasses RLS policies and should ONLY be used in API routes
export const supabaseAdmin: SupabaseClient | null =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

// Helper to get the appropriate client based on context
export function getSupabaseClient(
  useServiceRole = false,
): SupabaseClient | null {
  if (useServiceRole && supabaseAdmin) {
    return supabaseAdmin;
  }
  return supabase;
}

// Database types for TypeScript
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          password: string;
          role: string;
          avatar: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          password: string;
          role?: string;
          avatar?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          password?: string;
          role?: string;
          avatar?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      issues: {
        Row: {
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
        Insert: {
          id?: string;
          title: string;
          description: string;
          category: string;
          location: string;
          latitude: number;
          longitude: number;
          photo_url?: string | null;
          status?: string;
          priority?: string;
          user_id: string;
          votes?: number;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          category?: string;
          location?: string;
          latitude?: number;
          longitude?: number;
          photo_url?: string | null;
          status?: string;
          priority?: string;
          user_id?: string;
          votes?: number;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
      };
      comments: {
        Row: {
          id: string;
          issue_id: string;
          user_id: string;
          user_name: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          issue_id: string;
          user_id: string;
          user_name: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          issue_id?: string;
          user_id?: string;
          user_name?: string;
          content?: string;
          created_at?: string;
        };
      };
      votes: {
        Row: {
          id: string;
          issue_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          issue_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          issue_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};
