/**
 * Admin Supabase user UUIDs for audio library + AI features.
 * - `NEXT_USER_ADMIN`: comma-separated IDs (available on server and in API routes).
 * - `NEXT_PUBLIC_USER_ADMIN`: same value(s) for client components (scene “save to library”); Next only inlines NEXT_PUBLIC_* in the browser bundle.
 */
function normalizeAdminId(id: string): string {
  return id.trim().toLowerCase();
}

function parseAdminUserIds(): Set<string> {
  const merged = [process.env.NEXT_USER_ADMIN ?? "", process.env.NEXT_PUBLIC_USER_ADMIN ?? ""]
    .join(",")
    .split(",")
    .map((s) => normalizeAdminId(s))
    .filter(Boolean);
  return new Set(merged);
}

export function isAdminUserId(userId: string): boolean {
  if (!userId) return false;
  return parseAdminUserIds().has(normalizeAdminId(userId));
}
