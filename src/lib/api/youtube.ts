/**
 * Fetches YouTube video title via oEmbed API.
 */
export async function fetchYouTubeTitle(youtubeId: string): Promise<string | null> {
  const watchUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`;
  const res = await fetch(oembedUrl);
  if (!res.ok) return null;
  const data = (await res.json()) as { title?: string };
  return data.title ?? null;
}
