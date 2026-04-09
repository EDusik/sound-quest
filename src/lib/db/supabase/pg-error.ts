/** Detect Postgres unique violations from Supabase/PostgREST errors (code or message). */
export function isPgUniqueViolation(err: {
  code?: string;
  message?: string;
} | null | undefined): boolean {
  if (!err) return false;
  if (err.code === "23505") return true;
  const msg = (err.message ?? "").toLowerCase();
  return msg.includes("duplicate key") || msg.includes("unique constraint");
}
