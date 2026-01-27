// Database layer for OurStreet
// Automatically uses Supabase when configured, otherwise falls back to in-memory storage

import { isSupabaseConfigured } from "./supabase";
import * as memoryDb from "./db-memory";
import * as supabaseDb from "./db-supabase";

// Check if Supabase is configured
const useSupabase = isSupabaseConfigured();

if (useSupabase) {
  console.log("✅ Using Supabase database");
} else {
  console.log("⚠️ Using in-memory database (data will be lost on restart)");
  console.log(
    "💡 To use Supabase, set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
  );
}

// Select the appropriate database implementation
const db = useSupabase ? supabaseDb : memoryDb;

// Export database operations
export const generateId = db.generateId;
export const userDb = db.userDb;
export const issueDb = db.issueDb;
export const commentDb = db.commentDb;
export const voteDb = db.voteDb;
export const seedDatabase = db.seedDatabase;

// Default export
export default db;
