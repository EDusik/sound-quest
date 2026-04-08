import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import {
  getBearerToken,
  getUserFromAccessToken,
  isUserOnAiLibraryAllowlist,
} from "@/lib/ai-library-auth";
import {
  rowToFavoriteItem,
  type AudioLibraryDefaultFavoriteRow,
  type LibraryDefaultFavoriteItem,
} from "@/lib/library-default-favorite-map";
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
import { postLibraryDefaultFavoriteBodySchema } from "@/lib/validators/api";

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

  let supabase;
  try {
    supabase = createUserSupabase(auth.token);
  } catch (e) {
    logCreateUserSupabaseFailure(e);
    return jsonServerError("Server configuration error", 500);
  }

  const { data: favs, error } = await supabase
    .from("audio_library_default_favorites")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return librarySupabaseErrorResponse(error, " GET default-favorites");
  }

  const rows = (favs ?? []) as AudioLibraryDefaultFavoriteRow[];
  if (rows.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const libIds = rows.map((r) => r.library_item_id);
  const { data: libs, error: libErr } = await supabase
    .from("audio_library")
    .select("id, source_url")
    .in("id", libIds);

  if (libErr) {
    return librarySupabaseErrorResponse(libErr, " GET audio_library join");
  }

  const urlById = new Map(
    (libs ?? []).map((l: { id: string; source_url: string }) => [
      l.id,
      l.source_url,
    ]),
  );

  const items = rows
    .map((row) => {
      const sourceUrl = urlById.get(row.library_item_id);
      if (!sourceUrl) return null;
      return rowToFavoriteItem(row, sourceUrl);
    })
    .filter((x): x is LibraryDefaultFavoriteItem => x != null);

  return NextResponse.json({ items });
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

  const parsed = postLibraryDefaultFavoriteBodySchema.safeParse(body);
  if (!parsed.success) return jsonValidationError(parsed.error);

  let supabase;
  try {
    supabase = createUserSupabase(auth.token);
  } catch (e) {
    logCreateUserSupabaseFailure(e);
    return jsonServerError("Server configuration error", 500);
  }

  const { libraryItemId, category, displayName } = parsed.data;

  const { data: libRow, error: libErr } = await supabase
    .from("audio_library")
    .select("id")
    .eq("id", libraryItemId)
    .maybeSingle();

  if (libErr) {
    return librarySupabaseErrorResponse(libErr, " POST library lookup");
  }
  if (!libRow) {
    return NextResponse.json({ error: "Library item not found" }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("audio_library_default_favorites")
    .select("id")
    .eq("library_item_id", libraryItemId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Already in default sounds" },
      { status: 409 },
    );
  }

  const id = nanoid();
  const { data: inserted, error: insErr } = await supabase
    .from("audio_library_default_favorites")
    .insert({
      id,
      user_id: auth.user.id,
      library_item_id: libraryItemId,
      category,
      display_name: displayName,
    })
    .select("*")
    .single();

  if (insErr) {
    return librarySupabaseErrorResponse(insErr, " POST default-favorites");
  }

  const { error: typeUpdErr } = await supabase
    .from("audio_library")
    .update({ type: category })
    .eq("id", libraryItemId);

  if (typeUpdErr) {
    await supabase.from("audio_library_default_favorites").delete().eq("id", id);
    return librarySupabaseErrorResponse(typeUpdErr, " POST default-favorites sync library type");
  }

  const { data: src } = await supabase
    .from("audio_library")
    .select("source_url")
    .eq("id", libraryItemId)
    .single();

  const sourceUrl =
    src && typeof src === "object" && "source_url" in src
      ? String((src as { source_url: string }).source_url)
      : "";

  const row = inserted as AudioLibraryDefaultFavoriteRow;
  return NextResponse.json(rowToFavoriteItem(row, sourceUrl), { status: 201 });
}
