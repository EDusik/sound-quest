import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const BASE = "https://freesound.org/apiv2";

/**
 * GET /api/freesound-search?query=...&page=1&pageSize=20&filter=...
 * Proxies search to Freesound API so the API key stays server-side.
 */
export async function GET(request: NextRequest) {
  const token = process.env.NEXT_PUBLIC_FREESOUND_API_KEY?.trim();
  if (!token) {
    return NextResponse.json(
      {
        error:
          "Freesound API key not configured. Add FREESOUND_API_KEY to .env.",
      },
      { status: 503 },
    );
  }
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();
  if (!query) {
    return NextResponse.json(
      { error: "Missing query parameter." },
      { status: 400 },
    );
  }
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(
    30,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "15", 10)),
  );
  const filter = searchParams.get("filter")?.trim() ?? "";
  const fields = "id,name,previews,duration";
  const q = encodeURIComponent(query);
  let url = `${BASE}/search/?query=${q}&token=${token}&fields=${fields}&page=${page}&page_size=${pageSize}`;
  if (filter) {
    url += `&filter=${encodeURIComponent(filter)}`;
  }
  const res = await fetch(url, {
    // Always hit Freesound directly; avoid any cache overhead.
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json(
      {
        error:
          (err as { detail?: string }).detail ??
          `Freesound API error: ${res.status}`,
      },
      { status: res.status },
    );
  }
  const data = await res.json();
  return NextResponse.json(data);
}
