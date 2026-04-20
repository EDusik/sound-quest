import type { AiChatSuggestion } from "@/lib/api/api-client";

/** Matches direct audio URLs the HTML5 audio element can load. */
const DIRECT_AUDIO_URL = /\.(mp3|wav|ogg|flac|m4a|aac)(\?.*)?$/i;

/**
 * URL to persist for library / scene file audio. AI chat enriches suggestions with a
 * direct preview URL while `sourceUrl` is often a Pixabay HTML page — using
 * only the page URL breaks `<audio src>` ("no supported sources").
 */
export function libraryStorageUrlFromAiSuggestion(s: AiChatSuggestion): string {
  const preview = s.previewUrl?.trim();
  if (preview && DIRECT_AUDIO_URL.test(preview)) return preview;
  return s.sourceUrl.trim();
}

