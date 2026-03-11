import { NextRequest, NextResponse } from "next/server";
import { getFreesoundApiKey } from "@/lib/freesound-env";

export const runtime = "edge";

const BASE = "https://freesound.org/apiv2";
const UPSTREAM_TIMEOUT_MS = 8_000;

/**
 * GET /api/freesound-search?query=...&page=1&pageSize=20&filter=...
 * Proxies search to Freesound API so the API key stays server-side.
 * Returns errorCode for translatable errors (frontend maps to i18n keys).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();

  if (!query) {
    return NextResponse.json(
      { errorCode: "freesound.errorQueryMissing" },
      { status: 400 },
    );
  }

  const token = getFreesoundApiKey();

  if (!token) {
    return NextResponse.json(
      { errorCode: "freesound.errorApiKeyNotConfigured" },
      { status: 503 },
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

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, { signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return NextResponse.json(
        { errorCode: "freesound.errorTimeout" },
        { status: 504 },
      );
    }
    return NextResponse.json(
      { errorCode: "freesound.errorNetwork" },
      { status: 502 },
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    return NextResponse.json(
      { errorCode: "freesound.errorApi" },
      { status: res.status },
    );
  }

  const data = await res.json();

  return new NextResponse(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
