import { NextResponse } from "next/server";
import { createAnonServerSupabase } from "@/lib/supabase-server-anon";
import {
  rowToFavoriteItem,
  type AudioLibraryDefaultFavoriteRow,
  type LibraryDefaultFavoriteItem,
} from "@/lib/library-default-favorite-map";
import { librarySupabaseErrorResponse } from "@/lib/library-api-helpers";

/**
 * Lists all library items promoted to "Default sounds" (global catalog).
 * Public read; no auth. Requires RLS policies from migration
 * `20260408120000_public_read_default_favorites.sql`.
 */
export async function GET() {
  let supabase;
  try {
    supabase = createAnonServerSupabase();
  } catch (e) {
    console.error("public default-favorites:", e);
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  const { data: favs, error } = await supabase
    .from("audio_library_default_favorites")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return librarySupabaseErrorResponse(error, " GET public default-favorites");
  }

  const rows = (favs ?? []) as AudioLibraryDefaultFavoriteRow[];
  if (rows.length === 0) {
    return NextResponse.json({ items: [] as LibraryDefaultFavoriteItem[] });
  }

  const libIds = rows.map((r) => r.library_item_id);
  const { data: libs, error: libErr } = await supabase
    .from("audio_library")
    .select("id, source_url")
    .in("id", libIds);

  if (libErr) {
    return librarySupabaseErrorResponse(libErr, " GET public audio_library join");
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
