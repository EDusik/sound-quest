/**
 * Freesound API v2 client (search + previews).
 * Search is proxied via /api/freesound-search so the API key stays server-side.
 * @see https://freesound.org/docs/api/
 * Token: https://freesound.org/apiv2/apply → set NEXT_PUBLIC_FREESOUND_API_KEY in .env
 */

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
