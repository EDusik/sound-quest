/** Fallback when no translator is passed or key is missing. */
function formatLibraryTypeFallback(type: string): string {
  return type
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Localized label for an `audio_library.type` slug (default catalog categories).
 * Pass `t` from `useTranslations()` for EN / pt-BR strings.
 */
export function formatLibraryType(
  type: string,
  t?: (key: string) => string,
): string {
  if (t) {
    const defKey = `defaultAudioCategory.${type}.title`;
    const fromCatalog = t(defKey);
    if (fromCatalog !== defKey) return fromCatalog;
    const legacyKey = `libraryType.${type}`;
    const legacy = t(legacyKey);
    if (legacy !== legacyKey) return legacy;
  }
  return formatLibraryTypeFallback(type);
}
