/** Stable slugs for default catalog categories (API / i18n / favorites). */
export const DEFAULT_AUDIO_CATEGORY_SLUGS = [
  "ambience",
  "combat",
  "magic",
  "creatures",
  "foley",
  "music",
  "tension",
  "stingers",
  "weather",
  "animals",
] as const;

export type DefaultAudioCategorySlug =
  (typeof DEFAULT_AUDIO_CATEGORY_SLUGS)[number];
