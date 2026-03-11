/**
 * Extracts a user-friendly error message from an unknown error.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err)
    return String((err as { message: string }).message);
  return fallback;
}

const FREESOUND_ERROR_KEYS = [
  "freesound.errorQueryMissing",
  "freesound.errorApiKeyNotConfigured",
  "freesound.errorTimeout",
  "freesound.errorNetwork",
  "freesound.errorApi",
] as const;

/**
 * Returns a translated error message for Freesound errors.
 * If the error has a known errorCode, translates it; otherwise uses fallback.
 */
export function getTranslatedFreesoundError(
  err: unknown,
  t: (key: string) => string,
  fallbackKey: string,
): string {
  const msg = getErrorMessage(err, t(fallbackKey));
  if (FREESOUND_ERROR_KEYS.includes(msg as (typeof FREESOUND_ERROR_KEYS)[number])) {
    return t(msg);
  }
  return t(fallbackKey);
}
