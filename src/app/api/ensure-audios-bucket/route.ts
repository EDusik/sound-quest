import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const AUDIOS_MIME_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
];

/**
 * POST /api/ensure-audios-bucket
 * Creates the "audios" storage bucket and RLS policies if missing.
 * Requires SUPABASE_SERVICE_ROLE_KEY in env (Dashboard → Settings → API).
 * Requires Authorization: Bearer <Supabase access_token> (authenticated user).
 */
export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey || !anonKey) {
    return NextResponse.json(
      {
        error:
          "Missing NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY. Add SUPABASE_SERVICE_ROLE_KEY in .env (Supabase Dashboard → Settings → API).",
      },
      { status: 500 },
    );
  }
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;
  if (!token) {
    return NextResponse.json(
      { error: "Missing or invalid Authorization header." },
      { status: 401 },
    );
  }
  const anonClient = createClient(url, anonKey);
  const {
    data: { user },
    error: userError,
  } = await anonClient.auth.getUser(token);
  if (userError || !user) {
    return NextResponse.json(
      { error: "Invalid or expired token." },
      { status: 401 },
    );
  }
  const supabase = createClient(url, serviceRoleKey);

  const { error: bucketError } = await supabase.storage.createBucket("audios", {
    public: true,
    fileSizeLimit: "25MB",
    allowedMimeTypes: AUDIOS_MIME_TYPES,
  });
  if (bucketError) {
    const msg = bucketError.message?.toLowerCase() ?? "";
    if (
      msg.includes("already exists") ||
      msg.includes("duplicate") ||
      msg.includes("unique")
    ) {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json(
      { error: "Failed to create bucket: " + bucketError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
