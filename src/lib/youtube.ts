export function extractYouTubeId(urlOrId: string): string | null {
  const trimmed = urlOrId.trim();

  // If it already looks like a YouTube video ID, accept it directly.
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    if (url.hostname.includes("youtube.com")) {
      return url.searchParams.get("v");
    }
    if (url.hostname === "youtu.be") {
      return url.pathname.slice(1) || null;
    }
  } catch {
    // Not a valid URL, fall through.
  }

  return null;
}

