import { NextResponse } from "next/server";
import rawCatalog from "@/data/default-audios.json";
import { createAnonServerSupabase } from "@/lib/supabase-server-anon";

/**
 * Public catalog: Supabase `default_audio_catalog` when available, else bundled JSON.
 */
export async function GET() {
  try {
    const supabase = createAnonServerSupabase();
    const { data, error } = await supabase
      .from("default_audio_catalog")
      .select("id, name, source_url, type")
      .order("type", { ascending: true })
      .order("name", { ascending: true });

    if (error || !data?.length) {
      return NextResponse.json(rawCatalog);
    }

    const items = data.map(
      (row: { id: string; name: string; source_url: string; type: string }) => ({
        id: row.id,
        name: row.name,
        sourceUrl: row.source_url,
        type: row.type,
      }),
    );

    return NextResponse.json({ items });
  } catch (e) {
    console.error("default-audio-catalog GET:", e);
    return NextResponse.json(rawCatalog);
  }
}
