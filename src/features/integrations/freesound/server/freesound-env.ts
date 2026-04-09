/**
 * Server-only: Freesound API key from env.
 * Used by /api/freesound-search and /api/freesound-configured.
 */

export function getFreesoundApiKey(): string | null {
  const key = process.env.NEXT_PUBLIC_FREESOUND_API_KEY?.trim();
  return key || null;
}

export function isFreesoundConfigured(): boolean {
  return Boolean(getFreesoundApiKey());
}

