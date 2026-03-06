/**
 * Freesound API v2 client (search + previews).
 * @see https://freesound.org/docs/api/
 * Token: https://freesound.org/apiv2/apply
 */

const BASE = "https://freesound.org/apiv2";

export interface FreesoundPreviews {
  "preview-hq-mp3"?: string;
  "preview-lq-mp3"?: string;
  "preview-hq-ogg"?: string;
  "preview-lq-ogg"?: string;
}

export interface FreesoundSound {
  id: number;
  name: string;
  previews: FreesoundPreviews;
  duration?: number;
}

export interface FreesoundSearchResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: FreesoundSound[];
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return process.env.NEXT_PUBLIC_FREESOUND_API_KEY ?? null;
}

/** Prefer HQ MP3 for playback; fallback to LQ MP3 or first available. */
export function getPreviewUrl(previews: FreesoundPreviews): string | null {
  if (!previews) return null;
  const url =
    previews["preview-hq-mp3"] ??
    previews["preview-lq-mp3"] ??
    previews["preview-hq-ogg"] ??
    previews["preview-lq-ogg"];
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `https://freesound.org${url.startsWith("/") ? "" : "/"}${url}`;
}

export async function searchFreesound(
  query: string,
  page = 1,
  pageSize = 15,
): Promise<FreesoundSearchResponse> {
  const token = getToken();
  if (!token) {
    throw new Error(
      "Freesound API key not configured. Add NEXT_PUBLIC_FREESOUND_API_KEY.",
    );
  }
  const q = encodeURIComponent(query.trim());
  const fields = "id,name,previews,duration";
  const url = `${BASE}/search/?query=${q}&token=${token}&fields=${fields}&page=${page}&page_size=${Math.min(pageSize, 30)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Freesound API error: ${res.status}`);
  }
  return res.json() as Promise<FreesoundSearchResponse>;
}

export function isFreesoundConfigured(): boolean {
  return Boolean(
    typeof window !== "undefined" && process.env.NEXT_PUBLIC_FREESOUND_API_KEY,
  );
}
