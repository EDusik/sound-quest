import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/** Anon Supabase client for server routes (no user JWT). RLS still applies. */
export function createAnonServerSupabase(): SupabaseClient {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
