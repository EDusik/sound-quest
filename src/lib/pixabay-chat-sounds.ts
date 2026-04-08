/** Pixabay sound search hit (subset of API fields; see Pixabay API docs). */
export type PixabaySoundHit = {
  id?: number;
  pageURL?: string;
  pageUrl?: string;
  audio?: unknown;
};

const PIXABAY_HOME_PATHS = new Set(["", "/"]);

export function isPixabayHomepageUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    if (!/^(www\.)?pixabay\.com$/i.test(u.hostname)) return false;
    return PIXABAY_HOME_PATHS.has(u.pathname.replace(/\/$/, "") || "");
  } catch {
    return false;
  }
}

/** Search results page for the given query (better than linking only pixabay.com). */
export function pixabaySoundEffectsSearchUrl(query: string): string {
  const q = query.trim().replace(/\s+/g, " ");
  return `https://pixabay.com/sound-effects/search/${encodeURIComponent(q)}/`;
}

function findFirstAudioFileUrl(obj: unknown, depth = 0): string | undefined {
  if (depth > 10 || obj == null) return undefined;
  if (typeof obj === "string") {
    return /\.(mp3|wav|ogg|flac)(\?|$)/i.test(obj) ? obj : undefined;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findFirstAudioFileUrl(item, depth + 1);
      if (found) return found;
    }
    return undefined;
  }
  if (typeof obj === "object") {
    for (const v of Object.values(obj as Record<string, unknown>)) {
      const found = findFirstAudioFileUrl(v, depth + 1);
      if (found) return found;
    }
  }
  return undefined;
}

export function resolvePixabayPageAndPreview(hit: PixabaySoundHit | undefined): {
  pageUrl: string | undefined;
  previewUrl: string | undefined;
} {
  if (!hit) return { pageUrl: undefined, previewUrl: undefined };
  const pageUrl =
    (typeof hit.pageURL === "string" && hit.pageURL) ||
    (typeof hit.pageUrl === "string" && hit.pageUrl) ||
    (typeof hit.id === "number"
      ? `https://pixabay.com/sound-effects/${hit.id}/`
      : undefined);
  const previewUrl =
    findFirstAudioFileUrl(hit.audio) ?? findFirstAudioFileUrl(hit);
  return { pageUrl, previewUrl };
}
