import { jsonServerError } from "@/lib/api/http-api";

const isDev = process.env.NODE_ENV === "development";

/** Logs Supabase/Postgres errors in development; appends migration hint when the table is missing. */
export function librarySupabaseErrorResponse(
  error: { message: string; code?: string },
  context: string,
) {
  if (isDev) {
    console.error(`[api/library${context}]`, error.message, error.code ?? "");
  }
  let msg = error.message;
  const missingAudioLibrary =
    /audio_library/i.test(msg) &&
    /does not exist|relation|Could not find the table|schema cache/i.test(msg);
  if (isDev && missingAudioLibrary) {
    msg = `${msg} — Apply migration: supabase/migrations/20250324130000_audio_library.sql (Supabase SQL Editor or supabase db push)`;
  }
  const missingDefaultFavorites =
    /audio_library_default_favorites/i.test(msg) &&
    /does not exist|relation|Could not find the table|schema cache/i.test(msg);
  if (isDev && missingDefaultFavorites) {
    msg = `${msg} — Apply migration: supabase/migrations/20250407120000_audio_library_default_favorites.sql`;
  }
  return jsonServerError(msg, 500);
}

export function logCreateUserSupabaseFailure(err: unknown) {
  if (isDev) {
    console.error("[api/library] createUserSupabase failed:", err);
  }
}
