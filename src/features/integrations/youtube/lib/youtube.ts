export function extractYouTubeId(urlOrId: string): string | null {
  const trimmed = urlOrId.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    if (url.hostname.includes("youtube.com")) {
      const fromQuery = url.searchParams.get("v");
      if (fromQuery) return fromQuery;
      const shortsMatch = url.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]{11})$/);
      if (shortsMatch) return shortsMatch[1];
      const embedMatch = url.pathname.match(
        /^\/embed\/([a-zA-Z0-9_-]{11})(?:\/|$)/,
      );
      if (embedMatch) return embedMatch[1];
      const vMatch = url.pathname.match(/^\/v\/([a-zA-Z0-9_-]{11})(?:\/|$)/);
      if (vMatch) return vMatch[1];
      return null;
    }
    if (url.hostname === "youtu.be") {
      return url.pathname.slice(1) || null;
    }
  } catch {
    void 0;
  }

  return null;
}

