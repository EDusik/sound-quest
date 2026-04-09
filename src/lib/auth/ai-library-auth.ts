import { createClient, type User } from "@supabase/supabase-js";
import { isAdminUserId } from "@/lib/auth/admin-user-ids";

export function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  return token || null;
}

export async function getUserFromAccessToken(
  accessToken: string,
): Promise<User | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  const supabase = createClient(url, anonKey);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);
  if (error || !user) return null;
  return user;
}

/**
 * Audio library + AI chat: only users listed in NEXT_USER_ADMIN (and NEXT_PUBLIC_USER_ADMIN on the client).
 */
export function isUserOnAiLibraryAllowlist(user: User): boolean {
  return isAdminUserId(user.id);
}
