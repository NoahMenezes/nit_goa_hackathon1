// Dual Supabase client configuration for OurStreet
// Supports separate databases for Citizens and Admins
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// CITIZEN DATABASE CONFIGURATION
// ============================================================================
const citizenSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_CITIZEN_URL || "";
const citizenSupabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_CITIZEN_ANON_KEY || "";
const citizenSupabaseServiceRoleKey =
  process.env.SUPABASE_CITIZEN_SERVICE_ROLE_KEY || "";

// ============================================================================
// ADMIN DATABASE CONFIGURATION
// ============================================================================
const adminSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_ADMIN_URL || "";
const adminSupabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ADMIN_ANON_KEY || "";
const adminSupabaseServiceRoleKey =
  process.env.SUPABASE_ADMIN_SERVICE_ROLE_KEY || "";

// ============================================================================
// BACKWARD COMPATIBILITY (Legacy single database)
// ============================================================================
// Support old environment variables for backward compatibility
const legacySupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const legacySupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const legacySupabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Environment detection
const isProduction = process.env.NODE_ENV === "production";
const isDevelopment = process.env.NODE_ENV === "development";

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

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

// Check if citizen database is configured
export function isCitizenDbConfigured(): boolean {
  return Boolean(
    citizenSupabaseUrl &&
    citizenSupabaseAnonKey &&
    isValidSupabaseUrl(citizenSupabaseUrl),
  );
}

// Check if admin database is configured
export function isAdminDbConfigured(): boolean {
  return Boolean(
    adminSupabaseUrl &&
    adminSupabaseAnonKey &&
    isValidSupabaseUrl(adminSupabaseUrl),
  );
}

// Check if legacy database is configured (for backward compatibility)
function isLegacyDbConfigured(): boolean {
  return Boolean(
    legacySupabaseUrl &&
    legacySupabaseAnonKey &&
    isValidSupabaseUrl(legacySupabaseUrl),
  );
}

// Check if any Supabase configuration exists
export function isSupabaseConfigured(): boolean {
  return (
    isCitizenDbConfigured() || isAdminDbConfigured() || isLegacyDbConfigured()
  );
}

// ============================================================================
// CONFIGURATION STATUS LOGGING
// ============================================================================

if (!isCitizenDbConfigured() && !isLegacyDbConfigured()) {
  if (isProduction) {
    console.error(
      "❌ CRITICAL: Citizen Supabase database not configured in production!\n" +
        "   Set NEXT_PUBLIC_SUPABASE_CITIZEN_URL and NEXT_PUBLIC_SUPABASE_CITIZEN_ANON_KEY.\n" +
        "   App will fall back to in-memory database for citizens (DATA WILL BE LOST).",
    );
  } else {
    console.warn(
      "⚠️ Citizen database not configured - using in-memory database.\n" +
        "   To persist citizen data, set NEXT_PUBLIC_SUPABASE_CITIZEN_URL and NEXT_PUBLIC_SUPABASE_CITIZEN_ANON_KEY.",
    );
  }
}

if (!isAdminDbConfigured() && !isLegacyDbConfigured()) {
  if (isProduction) {
    console.error(
      "❌ CRITICAL: Admin Supabase database not configured in production!\n" +
        "   Set NEXT_PUBLIC_SUPABASE_ADMIN_URL and NEXT_PUBLIC_SUPABASE_ADMIN_ANON_KEY.\n" +
        "   App will fall back to in-memory database for admins (DATA WILL BE LOST).",
    );
  } else {
    console.warn(
      "⚠️ Admin database not configured - using in-memory database.\n" +
        "   To persist admin data, set NEXT_PUBLIC_SUPABASE_ADMIN_URL and NEXT_PUBLIC_SUPABASE_ADMIN_ANON_KEY.",
    );
  }
}

if (isLegacyDbConfigured() && isProduction) {
  console.warn(
    "⚠️ Using legacy single-database configuration.\n" +
      "   Consider migrating to dual-database setup for better security.",
  );
}

// ============================================================================
// SUPABASE CLIENT INSTANCES
// ============================================================================

// Create Citizen Supabase client (for client-side/public operations)
export const citizenSupabase: SupabaseClient | null = isCitizenDbConfigured()
  ? createClient(citizenSupabaseUrl, citizenSupabaseAnonKey, {
      auth: {
        persistSession: false, // We're using JWT tokens instead
        autoRefreshToken: false,
      },
    })
  : isLegacyDbConfigured()
    ? createClient(legacySupabaseUrl, legacySupabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

// Create Citizen Supabase admin client (for server-side operations)
export const citizenSupabaseAdmin: SupabaseClient | null =
  citizenSupabaseUrl && citizenSupabaseServiceRoleKey
    ? createClient(citizenSupabaseUrl, citizenSupabaseServiceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : legacySupabaseUrl && legacySupabaseServiceRoleKey
      ? createClient(legacySupabaseUrl, legacySupabaseServiceRoleKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        })
      : null;

// Create Admin Supabase client (for client-side/public operations)
export const adminSupabase: SupabaseClient | null = isAdminDbConfigured()
  ? createClient(adminSupabaseUrl, adminSupabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : isLegacyDbConfigured()
    ? createClient(legacySupabaseUrl, legacySupabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

// Create Admin Supabase admin client (for server-side operations)
export const adminSupabaseAdmin: SupabaseClient | null =
  adminSupabaseUrl && adminSupabaseServiceRoleKey
    ? createClient(adminSupabaseUrl, adminSupabaseServiceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : legacySupabaseUrl && legacySupabaseServiceRoleKey
      ? createClient(legacySupabaseUrl, legacySupabaseServiceRoleKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        })
      : null;

// Legacy exports for backward compatibility
export const supabase = citizenSupabase;
export const supabaseAdmin = citizenSupabaseAdmin;

// ============================================================================
// CLIENT GETTER FUNCTIONS
// ============================================================================

export type UserType = "citizen" | "admin";

/**
 * Get the appropriate Supabase client based on user type
 * @param userType - "citizen" or "admin"
 * @param useServiceRole - Whether to use service role key (for server-side)
 */
export function getSupabaseClient(
  userType: UserType = "citizen",
  useServiceRole = false,
): SupabaseClient | null {
  if (userType === "admin") {
    return useServiceRole ? adminSupabaseAdmin : adminSupabase;
  }
  return useServiceRole ? citizenSupabaseAdmin : citizenSupabase;
}

/**
 * Get Supabase client from user role string
 * @param role - User role (e.g., "citizen", "admin", "user")
 * @param useServiceRole - Whether to use service role key
 */
export function getSupabaseClientByRole(
  role: string,
  useServiceRole = false,
): SupabaseClient | null {
  const userType: UserType = role === "admin" ? "admin" : "citizen";
  return getSupabaseClient(userType, useServiceRole);
}

// ============================================================================
// STATUS HELPERS
// ============================================================================

/**
 * Get detailed configuration status for both databases
 */
export function getSupabaseStatus(): {
  citizen: {
    configured: boolean;
    hasUrl: boolean;
    hasAnonKey: boolean;
    hasServiceKey: boolean;
    urlValid: boolean;
  };
  admin: {
    configured: boolean;
    hasUrl: boolean;
    hasAnonKey: boolean;
    hasServiceKey: boolean;
    urlValid: boolean;
  };
  legacy: {
    configured: boolean;
    hasUrl: boolean;
    hasAnonKey: boolean;
    hasServiceKey: boolean;
    urlValid: boolean;
  };
  anyConfigured: boolean;
};

export function getSupabaseStatus() {
  return {
    citizen: {
      configured: isCitizenDbConfigured(),
      hasUrl: Boolean(citizenSupabaseUrl),
      hasAnonKey: Boolean(citizenSupabaseAnonKey),
      hasServiceKey: Boolean(citizenSupabaseServiceRoleKey),
      urlValid: isValidSupabaseUrl(citizenSupabaseUrl),
    },
    admin: {
      configured: isAdminDbConfigured(),
      hasUrl: Boolean(adminSupabaseUrl),
      hasAnonKey: Boolean(adminSupabaseAnonKey),
      hasServiceKey: Boolean(adminSupabaseServiceRoleKey),
      urlValid: isValidSupabaseUrl(adminSupabaseUrl),
    },
    legacy: {
      configured: isLegacyDbConfigured(),
      hasUrl: Boolean(legacySupabaseUrl),
      hasAnonKey: Boolean(legacySupabaseAnonKey),
      hasServiceKey: Boolean(legacySupabaseServiceRoleKey),
      urlValid: isValidSupabaseUrl(legacySupabaseUrl),
    },
    anyConfigured: isSupabaseConfigured(),
  };
}

// ============================================================================
// CONNECTION TESTING
// ============================================================================

/**
 * Test database connection for a specific user type
 */
export async function testConnection(userType: UserType = "citizen"): Promise<{
  connected: boolean;
  latencyMs?: number;
  error?: string;
}> {
  const client = getSupabaseClient(userType, false);

  if (!client) {
    return {
      connected: false,
      error: `${userType} Supabase client not configured`,
    };
  }

  const startTime = Date.now();
  try {
    // Simple query to test connection
    const { error } = await client.from("users").select("id").limit(1);
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
          error: `${userType} database tables not set up. Run migrations.`,
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
      error:
        err instanceof Error
          ? err.message
          : `Unknown connection error for ${userType} database`,
    };
  }
}

/**
 * Test connections for both databases
 */
export async function testAllConnections(): Promise<{
  citizen: {
    connected: boolean;
    latencyMs?: number;
    error?: string;
  };
  admin: {
    connected: boolean;
    latencyMs?: number;
    error?: string;
  };
}> {
  const [citizenResult, adminResult] = await Promise.all([
    testConnection("citizen"),
    testConnection("admin"),
  ]);

  return {
    citizen: citizenResult,
    admin: adminResult,
  };
}

// ============================================================================
// DATABASE TYPES
// ============================================================================

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
