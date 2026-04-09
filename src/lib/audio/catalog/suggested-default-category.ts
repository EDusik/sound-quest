import {
  DEFAULT_AUDIO_CATEGORY_SLUGS,
  type DefaultAudioCategorySlug,
} from "@/lib/audio/catalog/default-audio-category-slugs";

/** Legacy `audio_library.type` values before catalog alignment. */
const LEGACY_TO_DEFAULT: Record<string, DefaultAudioCategorySlug> = {
  "weather-effects": "weather",
  battle: "combat",
  animals: "animals",
  cities: "ambience",
  ambience: "ambience",
  music: "music",
  others: "ambience",
};

export function suggestedDefaultCategoryFromLibraryType(
  libraryType: string,
): DefaultAudioCategorySlug {
  if (
    (DEFAULT_AUDIO_CATEGORY_SLUGS as readonly string[]).includes(libraryType)
  ) {
    return libraryType as DefaultAudioCategorySlug;
  }
  return LEGACY_TO_DEFAULT[libraryType] ?? "ambience";
}
