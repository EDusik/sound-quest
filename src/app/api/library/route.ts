import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import {
  getBearerToken,
  getUserFromAccessToken,
  isUserOnAiLibraryAllowlist,
} from "@/lib/ai-library-auth";
import type { AudioLibraryRow } from "@/lib/audio-library-map";
import { rowToItem } from "@/lib/audio-library-map";
import {
  jsonForbidden,
  jsonServerError,
  jsonUnauthorized,
  jsonValidationError,
} from "@/lib/http-api";
import {
  librarySupabaseErrorResponse,
  logCreateUserSupabaseFailure,
} from "@/lib/library-api-helpers";
import { createUserSupabase } from "@/lib/supabase-user";
import { getLibraryQuerySchema, postLibraryBodySchema } from "@/lib/validators/api";

async function requireProtected(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) return { response: jsonUnauthorized() };
  const user = await getUserFromAccessToken(token);
  if (!user) return { response: jsonUnauthorized() };
  if (!isUserOnAiLibraryAllowlist(user)) return { response: jsonForbidden() };
  return { user, token };
}

export async function GET(request: NextRequest) {
  const auth = await requireProtected(request);
  if ("response" in auth) return auth.response;

  const typeRaw = request.nextUrl.searchParams.get("type")?.trim();
  const parsedQ = getLibraryQuerySchema.safeParse(
    typeRaw ? { type: typeRaw } : {},
  );
  if (!parsedQ.success) return jsonValidationError(parsedQ.error);

  let supabase;
  try {
    supabase = createUserSupabase(auth.token);
  } catch (e) {
    logCreateUserSupabaseFailure(e);
    return jsonServerError("Server configuration error", 500);
  }

  let q = supabase.from("audio_library").select("*");
  if (parsedQ.data.type) {
    q = q.eq("type", parsedQ.data.type);
  }
  const { data, error } = await q.order("created_at", { ascending: false });

  if (error) {
    return librarySupabaseErrorResponse(error, " GET");
  }

  return NextResponse.json({
    items: (data ?? []).map((row) => rowToItem(row as AudioLibraryRow)),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireProtected(request);
  if ("response" in auth) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonServerError("Invalid JSON body", 400);
  }

  const parsed = postLibraryBodySchema.safeParse(body);
  if (!parsed.success) return jsonValidationError(parsed.error);

  let supabase;
  try {
    supabase = createUserSupabase(auth.token);
  } catch (e) {
    logCreateUserSupabaseFailure(e);
    return jsonServerError("Server configuration error", 500);
  }

  const id = nanoid();
  const { data, error } = await supabase
    .from("audio_library")
    .insert({
      id,
      user_id: auth.user.id,
      name: parsed.data.name,
      source_url: parsed.data.sourceUrl,
      type: parsed.data.type,
    })
    .select("*")
    .single();

  if (error) {
    return librarySupabaseErrorResponse(error, " POST");
  }

  return NextResponse.json(rowToItem(data as AudioLibraryRow), { status: 201 });
}
