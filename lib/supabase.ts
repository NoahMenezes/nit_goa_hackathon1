// Supabase client configuration for OurStreet
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Environment detection
const isProduction = process.env.NODE_ENV === "production";
const isDevelopment = process.env.NODE_ENV === "development";

// Validate Supabase URL format
function isValidSupabaseUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" ||
      (isDevelopment && parsed.protocol === "http:")
    );
  } catch {
    return false;
  }
}

// Configuration status logging
if (!supabaseUrl || !supabaseAnonKey) {
  if (isProduction) {
    console.error(
      "❌ CRITICAL: Supabase credentials not configured in production!\n" +
        "   Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.\n" +
        "   App will fall back to in-memory database (DATA WILL BE LOST).",
    );
  } else {
    console.warn(
      "⚠️ Supabase not configured - using in-memory database.\n" +
        "   To persist data, set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
} else if (!isValidSupabaseUrl(supabaseUrl)) {
  console.error(
    `❌ Invalid NEXT_PUBLIC_SUPABASE_URL format: ${supabaseUrl}\n` +
      "   Expected format: https://your-project.supabase.co",
  );
}

if (!supabaseServiceRoleKey && isProduction) {
  console.warn(
    "⚠️ SUPABASE_SERVICE_ROLE_KEY not found. Admin operations may fail.\n" +
      "   Find this in Supabase Dashboard → Settings → API → service_role key.",
  );
}

// Helper to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl && supabaseAnonKey && isValidSupabaseUrl(supabaseUrl),
  );
}

// Get detailed configuration status (useful for health checks)
export function getSupabaseStatus(): {
  configured: boolean;
  hasUrl: boolean;
  hasAnonKey: boolean;
  hasServiceKey: boolean;
  urlValid: boolean;
} {
  return {
    configured: isSupabaseConfigured(),
    hasUrl: Boolean(supabaseUrl),
    hasAnonKey: Boolean(supabaseAnonKey),
    hasServiceKey: Boolean(supabaseServiceRoleKey),
    urlValid: isValidSupabaseUrl(supabaseUrl),
  };
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

// Test database connection (useful for health checks)
export async function testConnection(): Promise<{
  connected: boolean;
  latencyMs?: number;
  error?: string;
}> {
  if (!supabase) {
    return {
      connected: false,
      error: "Supabase client not configured",
    };
  }

  const startTime = Date.now();
  try {
    // Simple query to test connection
    const { error } = await supabase.from("users").select("id").limit(1);
    const latencyMs = Date.now() - startTime;

    if (error) {
      // Check for common error types
      if (
        error.message.includes("relation") &&
        error.message.includes("does not exist")
      ) {
        return {
          connected: true, // Connection works, just missing table
          latencyMs,
          error: "Database tables not set up. Run migrations.",
        };
      }
      return {
        connected: false,
        latencyMs,
        error: error.message,
      };
    }

    return {
      connected: true,
      latencyMs,
    };
  } catch (err) {
    return {
      connected: false,
      latencyMs: Date.now() - startTime,
      error: err instanceof Error ? err.message : "Unknown connection error",
    };
  }
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
