import type { AudioItem } from "@/lib/types";
import { spotifyUriToOpenUrl } from "@/lib/spotify";

/**
 * HTTP URL suitable for POST /api/library (z.string().url()).
 */
export function getLibrarySourceUrlForAudio(audio: AudioItem): string {
  const raw = audio.sourceUrl.trim();
  if (audio.kind === "spotify") {
    return spotifyUriToOpenUrl(raw);
  }
  if (audio.kind === "youtube") {
    if (/^https?:\/\//i.test(raw)) return raw;
    return `https://www.youtube.com/watch?v=${encodeURIComponent(raw)}`;
  }
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) {
    return `https://www.youtube.com/watch?v=${encodeURIComponent(raw)}`;
  }
  return raw;
}
